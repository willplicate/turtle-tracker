"""
Verify 7 DTE Options Pricing Calculation
Reproduces the pricing model from optionsPricing.ts to identify issues
"""

import math

def get_base_premium(dte):
    """Base premium scaled by DTE"""
    base_weekly = 150  # $150 for 7 DTE at ATM, VIX 15
    return base_weekly * math.sqrt(dte / 7)

def get_moneyness_multiplier(stock_price, strike):
    """Get moneyness multiplier - CURRENT IMPLEMENTATION"""
    distance = abs(stock_price - strike)
    percent_away = distance / stock_price

    if percent_away < 0.005:
        return 1.00      # Within 0.5% = ATM
    elif percent_away < 0.01:
        return 0.90      # 0.5-1% away
    elif percent_away < 0.015:
        return 0.80      # 1-1.5% away
    elif percent_away < 0.02:
        return 0.65      # 1.5-2% away
    elif percent_away < 0.03:
        return 0.45      # 2-3% away
    elif percent_away < 0.04:
        return 0.30      # 3-4% away
    else:
        return 0.15      # 4%+ away

def get_moneyness_multiplier_improved(stock_price, strike):
    """
    IMPROVED: Finer granularity for near-ATM options
    Uses linear interpolation within each bucket for smooth pricing
    """
    distance = abs(stock_price - strike)
    percent_away = distance / stock_price

    # Much finer buckets for near-ATM (within 2%)
    if percent_away < 0.001:
        # Within 0.1% = true ATM
        return 1.00
    elif percent_away < 0.002:
        # 0.1-0.2% away - linear from 1.00 to 0.98
        return 1.00 - (percent_away - 0.001) / 0.001 * 0.02
    elif percent_away < 0.003:
        # 0.2-0.3% away
        return 0.98 - (percent_away - 0.002) / 0.001 * 0.02
    elif percent_away < 0.004:
        # 0.3-0.4% away
        return 0.96 - (percent_away - 0.003) / 0.001 * 0.02
    elif percent_away < 0.005:
        # 0.4-0.5% away
        return 0.94 - (percent_away - 0.004) / 0.001 * 0.02
    elif percent_away < 0.0075:
        # 0.5-0.75% away
        return 0.92 - (percent_away - 0.005) / 0.0025 * 0.07
    elif percent_away < 0.01:
        # 0.75-1% away
        return 0.85 - (percent_away - 0.0075) / 0.0025 * 0.05
    elif percent_away < 0.015:
        # 1-1.5% away
        return 0.80 - (percent_away - 0.01) / 0.005 * 0.15
    elif percent_away < 0.02:
        # 1.5-2% away
        return 0.65 - (percent_away - 0.015) / 0.005 * 0.20
    elif percent_away < 0.03:
        # 2-3% away
        return 0.45 - (percent_away - 0.02) / 0.01 * 0.15
    elif percent_away < 0.04:
        # 3-4% away
        return 0.30 - (percent_away - 0.03) / 0.01 * 0.15
    else:
        # 4%+ away
        return 0.15

def get_time_multiplier(dte):
    """Time multiplier based on DTE"""
    if dte >= 7:
        return 1.00
    elif dte >= 5:
        return 0.90
    elif dte >= 3:
        return 0.75
    elif dte >= 1:
        return 0.60
    elif dte > 0:
        return 0.35
    else:
        return 0.00

def get_volatility_multiplier(vix):
    """Volatility multiplier based on VIX"""
    base_vix = 15
    multiplier = math.pow(vix / base_vix, 1.3)
    return min(multiplier, 5.0)

def calculate_intrinsic(stock_price, strike):
    """Intrinsic value for calls"""
    return max(0, stock_price - strike) * 100

def calculate_bid_ask(price, vix):
    """Simulate bid-ask spread"""
    spread_percent = 0.05 + (vix / 100) * 0.1
    spread = price * spread_percent

    return {
        'bid': max(0, price - spread / 2),
        'ask': price + spread / 2
    }

def calculate_option_price(stock_price, strike, dte, vix, use_improved=False):
    """Calculate option price using the pricing model"""
    # Intrinsic value
    intrinsic = calculate_intrinsic(stock_price, strike)

    # Extrinsic value
    base_premium = get_base_premium(dte)

    if use_improved:
        moneyness_mult = get_moneyness_multiplier_improved(stock_price, strike)
    else:
        moneyness_mult = get_moneyness_multiplier(stock_price, strike)

    time_mult = get_time_multiplier(dte)
    vol_mult = get_volatility_multiplier(vix)

    extrinsic = base_premium * moneyness_mult * time_mult * vol_mult

    # Total
    total = intrinsic + extrinsic

    # Distance info
    distance = abs(stock_price - strike)
    percent_away = (distance / stock_price) * 100

    return {
        'strike': strike,
        'intrinsic': round(intrinsic),
        'extrinsic': round(extrinsic),
        'total': round(total),
        'moneyness_mult': moneyness_mult,
        'percent_away': percent_away,
        'distance': distance
    }

def main():
    # Test case from screenshot
    stock_price = 620.33
    vix = 14.22
    dte = 7

    print("=" * 80)
    print("7 DTE OPTIONS PRICING VERIFICATION")
    print("=" * 80)
    print(f"\nStock Price: ${stock_price:.2f}")
    print(f"VIX: {vix:.2f}")
    print(f"DTE: {dte} days")
    print("\n")

    # Test strikes from screenshot
    strikes = [619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630]

    print("CURRENT IMPLEMENTATION (Coarse Buckets)")
    print("-" * 80)
    print(f"{'Strike':<8} {'Distance':<10} {'%Away':<8} {'MoneyMult':<10} {'Extrinsic':<10} {'Total':<8} {'Bid':<8} {'Ask':<8}")
    print("-" * 80)

    for strike in strikes:
        result = calculate_option_price(stock_price, strike, dte, vix, use_improved=False)
        bid_ask = calculate_bid_ask(result['total'], vix)

        print(f"{result['strike']:<8} "
              f"{result['distance']:<10.2f} "
              f"{result['percent_away']:<8.3f} "
              f"{result['moneyness_mult']:<10.3f} "
              f"${result['extrinsic']:<9} "
              f"${result['total']:<7} "
              f"${bid_ask['bid']:<7.0f} "
              f"${bid_ask['ask']:<7.0f}")

    print("\n\n")
    print("IMPROVED IMPLEMENTATION (Fine Granularity)")
    print("-" * 80)
    print(f"{'Strike':<8} {'Distance':<10} {'%Away':<8} {'MoneyMult':<10} {'Extrinsic':<10} {'Total':<8} {'Bid':<8} {'Ask':<8}")
    print("-" * 80)

    for strike in strikes:
        result = calculate_option_price(stock_price, strike, dte, vix, use_improved=True)
        bid_ask = calculate_bid_ask(result['total'], vix)

        print(f"{result['strike']:<8} "
              f"{result['distance']:<10.2f} "
              f"{result['percent_away']:<8.3f} "
              f"{result['moneyness_mult']:<10.3f} "
              f"${result['extrinsic']:<9} "
              f"${result['total']:<7} "
              f"${bid_ask['bid']:<7.0f} "
              f"${bid_ask['ask']:<7.0f}")

    print("\n")
    print("=" * 80)
    print("ANALYSIS")
    print("=" * 80)
    print("\nPROBLEM: In current implementation, strikes 621-626 all have same moneyness")
    print("multiplier (0.90x) because they all fall in the 0.5-1% bucket.")
    print("\nWith $1 strike increments on a $620 stock, each strike is ~0.16% apart.")
    print("We need finer buckets to differentiate between adjacent strikes.")
    print("\nSOLUTION: Use linear interpolation within buckets for smooth, continuous")
    print("pricing that properly reflects small differences in moneyness.")
    print("=" * 80)

if __name__ == "__main__":
    main()
