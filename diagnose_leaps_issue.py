"""
Diagnose the LEAPS P&L issue from the screenshot
Market went UP but LEAPS lost $1,716 - clearly wrong!
"""

import math

def calculate_intrinsic(stock_price, strike):
    """Intrinsic value for a call option"""
    return max(0, stock_price - strike) * 100

def get_base_premium(dte):
    """Base premium scaled by DTE"""
    base_weekly = 150  # $150 for 7 DTE at ATM, VIX 15
    return base_weekly * math.sqrt(dte / 7)

def get_moneyness_multiplier(stock_price, strike):
    """Get moneyness multiplier - CURRENT IMPLEMENTATION"""
    distance = abs(stock_price - strike)
    percent_away = distance / stock_price

    # Fine granularity implementation from optionsPricing.ts
    if percent_away < 0.001:
        return 1.00
    elif percent_away < 0.002:
        return 1.00 - (percent_away - 0.001) / 0.001 * 0.02
    elif percent_away < 0.003:
        return 0.98 - (percent_away - 0.002) / 0.001 * 0.02
    elif percent_away < 0.004:
        return 0.96 - (percent_away - 0.003) / 0.001 * 0.02
    elif percent_away < 0.005:
        return 0.94 - (percent_away - 0.004) / 0.001 * 0.02
    elif percent_away < 0.0075:
        return 0.92 - (percent_away - 0.005) / 0.0025 * 0.07
    elif percent_away < 0.01:
        return 0.85 - (percent_away - 0.0075) / 0.0025 * 0.05
    elif percent_away < 0.015:
        return 0.80 - (percent_away - 0.01) / 0.005 * 0.15
    elif percent_away < 0.02:
        return 0.65 - (percent_away - 0.015) / 0.005 * 0.20
    elif percent_away < 0.03:
        return 0.45 - (percent_away - 0.02) / 0.01 * 0.15
    elif percent_away < 0.04:
        return 0.30 - (percent_away - 0.03) / 0.01 * 0.15
    else:
        # 4%+ away
        return 0.15

def get_volatility_multiplier(vix):
    """Volatility multiplier based on VIX"""
    base_vix = 15
    multiplier = math.pow(vix / base_vix, 1.3)
    return min(multiplier, 5.0)

def calculate_option_price(stock_price, strike, dte, vix):
    """Calculate full option price"""
    # Intrinsic
    intrinsic = calculate_intrinsic(stock_price, strike)

    # Extrinsic
    base_premium = get_base_premium(dte)
    moneyness_mult = get_moneyness_multiplier(stock_price, strike)
    time_mult = 1.0  # LEAPS have 7+ days so always 1.0
    vol_mult = get_volatility_multiplier(vix)

    extrinsic = base_premium * moneyness_mult * time_mult * vol_mult

    # Total
    total = intrinsic + extrinsic

    distance = abs(stock_price - strike)
    percent_away = (distance / stock_price) * 100

    return {
        'intrinsic': round(intrinsic),
        'extrinsic': round(extrinsic),
        'total': round(total),
        'moneyness_mult': moneyness_mult,
        'percent_away': percent_away,
        'base_premium': base_premium,
        'vol_mult': vol_mult
    }

def main():
    print("=" * 80)
    print("DIAGNOSE LEAPS P&L ISSUE FROM SCREENSHOT")
    print("=" * 80)
    print()

    # Data from screenshot
    strike = 535
    dte_friday = 341  # DTE remaining on Friday
    dte_monday = dte_friday + 5  # Monday was 5 days earlier (Mon, Tue, Wed, Thu, Fri)

    monday_spy = 591.77
    friday_spy = 596.19

    friday_value = 6263  # Current value shown
    weekly_pnl = -1716  # Weekly P&L shown (NEGATIVE!)
    monday_value = friday_value - weekly_pnl  # Reverse engineer Monday value

    price_change = friday_spy - monday_spy
    percent_change = (price_change / monday_spy) * 100

    print(f"FROM SCREENSHOT:")
    print(f"  LEAPS Strike: ${strike}")
    print(f"  DTE on Friday: {dte_friday} days")
    print(f"  DTE on Monday: ~{dte_monday} days")
    print(f"  Monday SPY: ${monday_spy:.2f}")
    print(f"  Friday SPY: ${friday_spy:.2f}")
    print(f"  Price Change: +${price_change:.2f} (+{percent_change:.2f}%)")
    print(f"  Friday LEAPS Value: ${friday_value:,}")
    print(f"  Weekly P&L: ${weekly_pnl:,}")
    print(f"  Implied Monday Value: ${monday_value:,}")
    print()

    print("=" * 80)
    print("TESTING WITH DIFFERENT VIX SCENARIOS")
    print("=" * 80)
    print()

    # Test different VIX scenarios to see what could cause this
    vix_scenarios = [
        ("Low VIX (stable)", 12, 12),
        ("Normal VIX (stable)", 15, 15),
        ("VIX spike", 15, 25),
        ("VIX drop", 25, 15),
        ("Extreme VIX drop", 35, 15),
    ]

    for scenario_name, monday_vix, friday_vix in vix_scenarios:
        print(f"\nSCENARIO: {scenario_name}")
        print(f"  Monday VIX: {monday_vix:.2f}, Friday VIX: {friday_vix:.2f}")
        print("-" * 80)

        # Calculate Monday value
        monday_price = calculate_option_price(monday_spy, strike, dte_monday, monday_vix)

        # Calculate Friday value
        friday_price = calculate_option_price(friday_spy, strike, dte_friday, friday_vix)

        # Calculate P&L
        calculated_pnl = friday_price['total'] - monday_price['total']

        print(f"\n  Monday:")
        print(f"    Intrinsic: ${monday_price['intrinsic']:,}")
        print(f"    Extrinsic: ${monday_price['extrinsic']:,}")
        print(f"    Total: ${monday_price['total']:,}")
        print(f"    Moneyness mult: {monday_price['moneyness_mult']:.3f}")
        print(f"    Vol mult: {monday_price['vol_mult']:.3f}")

        print(f"\n  Friday:")
        print(f"    Intrinsic: ${friday_price['intrinsic']:,} (change: +${friday_price['intrinsic'] - monday_price['intrinsic']})")
        print(f"    Extrinsic: ${friday_price['extrinsic']:,} (change: ${friday_price['extrinsic'] - monday_price['extrinsic']})")
        print(f"    Total: ${friday_price['total']:,}")
        print(f"    Moneyness mult: {friday_price['moneyness_mult']:.3f}")
        print(f"    Vol mult: {friday_price['vol_mult']:.3f}")

        print(f"\n  CALCULATED P&L: ${calculated_pnl:,}")
        print(f"  ACTUAL P&L FROM SCREENSHOT: ${weekly_pnl:,}")
        print(f"  DIFFERENCE: ${abs(calculated_pnl - weekly_pnl):,}")

        if abs(calculated_pnl - weekly_pnl) < 100:
            print(f"  ✓✓✓ THIS MATCHES! VIX went from {monday_vix} to {friday_vix}")

    print("\n" + "=" * 80)
    print("ANALYSIS")
    print("=" * 80)
    print()
    print("The LEAPS is $61 ITM ($596 - $535 = $61)")
    print(f"This is {((friday_spy - strike) / friday_spy * 100):.1f}% ITM")
    print()
    print("With a 10%+ ITM LEAPS:")
    print("  - Intrinsic value = ($596 - $535) × 100 = $6,100")
    print("  - Extrinsic value is VERY SMALL due to low moneyness multiplier (0.15x)")
    print()
    print("The moneyness multiplier is only 0.15x because the option is 10%+ away from ATM.")
    print("This means extrinsic value is minimal, but it's still affected by VIX changes.")
    print()
    print("POTENTIAL ISSUES:")
    print("1. VIX spiked massively at week start, then dropped - causing large extrinsic loss")
    print("2. Week start value is being captured AFTER Monday's movement instead of BEFORE")
    print("3. Bug in how daily position values are updated during ADVANCE_DAY")
    print("=" * 80)

if __name__ == "__main__":
    main()
