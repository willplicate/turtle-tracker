"""
Diagnose why LEAPS P&L doesn't match delta + theta calculation
From screenshot: Expected $341, Actual $416, Difference $75
"""

import math

def calculate_intrinsic(stock_price, strike):
    return max(0, stock_price - strike) * 100

def get_base_premium(dte):
    base_weekly = 150
    return base_weekly * math.sqrt(dte / 7)

def get_moneyness_multiplier(stock_price, strike):
    distance = abs(stock_price - strike)
    percent_away = distance / stock_price

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
        return 0.15

def get_volatility_multiplier(vix):
    base_vix = 15
    multiplier = math.pow(vix / base_vix, 1.3)
    return min(multiplier, 5.0)

def calculate_option_price(stock_price, strike, dte, vix):
    intrinsic = calculate_intrinsic(stock_price, strike)
    base_premium = get_base_premium(dte)
    moneyness_mult = get_moneyness_multiplier(stock_price, strike)
    time_mult = 1.0
    vol_mult = get_volatility_multiplier(vix)

    extrinsic = base_premium * moneyness_mult * time_mult * vol_mult
    total = intrinsic + extrinsic

    return {
        'intrinsic': round(intrinsic),
        'extrinsic': round(extrinsic),
        'total': round(total),
        'moneyness_mult': moneyness_mult,
        'vol_mult': vol_mult,
        'base_premium': base_premium
    }

def main():
    print("=" * 80)
    print("DIAGNOSE PRICING MODEL ISSUE")
    print("=" * 80)
    print()

    # From screenshot
    strike = 510
    dte_monday = 366  # Approximate
    dte_friday = 361

    # Estimate Monday/Friday prices
    # Friday: current value $7,375, with stock at some price
    # We need to reverse engineer

    # Let's test with realistic prices
    # If strike is $510 and delta is 89%, stock is probably around $585-595

    print("SCENARIO: Testing different stock prices and VIX scenarios")
    print("-" * 80)

    # Test: What stock price gives us $7,375 value?
    for test_spy in range(575, 600, 1):
        friday_price = calculate_option_price(test_spy, strike, dte_friday, 15)
        if abs(friday_price['total'] - 7375) < 50:
            print(f"\nFriday SPY ~${test_spy} gives LEAPS value ${friday_price['total']}")
            print(f"  Intrinsic: ${friday_price['intrinsic']}")
            print(f"  Extrinsic: ${friday_price['extrinsic']}")
            break

    # Assume Friday SPY is around $585
    friday_spy = 585
    monday_spy = friday_spy - 4.10  # Market went up $4.10

    print(f"\nUSING:")
    print(f"  Strike: ${strike}")
    print(f"  Monday SPY: ${monday_spy:.2f}")
    print(f"  Friday SPY: ${friday_spy:.2f}")
    print(f"  Stock change: +${friday_spy - monday_spy:.2f}")
    print()

    # Test different VIX scenarios
    scenarios = [
        ("Stable VIX 15", 15, 15),
        ("VIX drop 18→15", 18, 15),
        ("VIX spike 15→18", 15, 18),
        ("VIX drop 20→15", 20, 15),
        ("VIX spike 15→20", 15, 20),
    ]

    for name, monday_vix, friday_vix in scenarios:
        print(f"\n{name}")
        print("-" * 40)

        monday = calculate_option_price(monday_spy, strike, dte_monday, monday_vix)
        friday = calculate_option_price(friday_spy, strike, dte_friday, friday_vix)

        pnl = friday['total'] - monday['total']
        intrinsic_change = friday['intrinsic'] - monday['intrinsic']
        extrinsic_change = friday['extrinsic'] - monday['extrinsic']

        print(f"  Monday: ${monday['total']:,} (Intr: ${monday['intrinsic']:,}, Extr: ${monday['extrinsic']})")
        print(f"  Friday: ${friday['total']:,} (Intr: ${friday['intrinsic']:,}, Extr: ${friday['extrinsic']})")
        print(f"  P&L: ${pnl:,}")
        print(f"    Intrinsic change: +${intrinsic_change}")
        print(f"    Extrinsic change: ${extrinsic_change:+d}")
        print(f"    Expected (365-24): $341")
        print(f"    Difference: ${abs(pnl - 341)}")

        if abs(pnl - 416) < 10:
            print(f"  ✓✓✓ THIS MATCHES THE ACTUAL P&L OF $416!")

    print("\n" + "=" * 80)
    print("ANALYSIS")
    print("=" * 80)
    print()
    print("PROBLEM: For deep ITM LEAPS (89% delta, 14% ITM), extrinsic value should be")
    print("tiny and stable. But VIX changes cause significant extrinsic fluctuations.")
    print()
    print("SOLUTION: For deep ITM options, reduce or eliminate VIX sensitivity:")
    print("  1. When delta > 0.80 (deep ITM), cap extrinsic value")
    print("  2. Reduce volatility multiplier for ITM options")
    print("  3. Make LEAPS pricing more deterministic: Intrinsic + small fixed extrinsic")
    print()
    print("For a 89% delta LEAPS:")
    print("  - Value should be ~98% intrinsic, ~2% extrinsic")
    print("  - Extrinsic should decay smoothly with theta")
    print("  - VIX should have minimal impact on deep ITM options")
    print("=" * 80)

if __name__ == "__main__":
    main()
