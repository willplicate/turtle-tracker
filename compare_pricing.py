"""
Compare Simulated LEAPS Pricing vs Real OptionStrat Data
"""
import math

def calculate_simple_delta(stock_price, strike, dte):
    """Calculate delta based on moneyness"""
    percent_itm = ((stock_price - strike) / stock_price) * 100

    # Base delta (same logic as JavaScript)
    if percent_itm >= 20:
        base_delta = 0.95
    elif percent_itm >= 15:
        base_delta = 0.90 + (percent_itm - 15) / 5 * 0.05
    elif percent_itm >= 10:
        base_delta = 0.80 + (percent_itm - 10) / 5 * 0.10
    elif percent_itm >= 5:
        base_delta = 0.68 + (percent_itm - 5) / 5 * 0.12
    elif percent_itm >= 1:
        base_delta = 0.58 + (percent_itm - 1) / 4 * 0.10
    elif percent_itm >= 0:
        base_delta = 0.52 + percent_itm * 0.06
    elif percent_itm >= -1:
        base_delta = 0.52 + percent_itm * 0.06
    elif percent_itm >= -5:
        base_delta = 0.38 + (percent_itm + 1) / 4 * 0.14
    elif percent_itm >= -10:
        base_delta = 0.25 + (percent_itm + 5) / 5 * 0.13
    else:
        base_delta = max(0.10, 0.25 + (percent_itm + 10) / 10 * 0.15)

    # DTE adjustment
    if percent_itm > 0:
        dte_diff_from_200 = (dte - 200) / 100
        itm_strength = min(1.0, percent_itm / 15)
        delta_adjustment = dte_diff_from_200 * 0.008 * itm_strength
        return max(0.50, min(0.95, base_delta - delta_adjustment))
    else:
        dte_diff_from_200 = (dte - 200) / 100
        otm_strength = min(1.0, abs(percent_itm) / 15)
        delta_adjustment = dte_diff_from_200 * 0.008 * otm_strength
        return max(0.05, min(0.50, base_delta + delta_adjustment))


def calculate_simple_extrinsic(stock_price, strike, dte):
    """Calculate extrinsic value using sqrt scaling"""
    percent_itm = ((stock_price - strike) / stock_price) * 100

    # Base extrinsic for ATM at 7 DTE (calibrated for SPY at $590)
    SPY_BASE_PRICE = 590.0
    baseATM_7DTE_SPY = 1350  # 3x real market for educational purposes

    # Scale extrinsic by stock price using square root
    price_scale_factor = math.sqrt(stock_price / SPY_BASE_PRICE)
    baseATM_7DTE = baseATM_7DTE_SPY * price_scale_factor

    # Scale by time using sqrt relationship
    time_factor = math.sqrt(dte / 7)
    base_extrinsic = baseATM_7DTE * time_factor

    # Adjust for moneyness
    if percent_itm >= 15:
        moneyness_factor = 0.10
    elif percent_itm >= 12:
        moneyness_factor = 0.10 + (15 - percent_itm) / 3 * 0.10
    elif percent_itm >= 8:
        moneyness_factor = 0.20 + (12 - percent_itm) / 4 * 0.20
    elif percent_itm >= 4:
        moneyness_factor = 0.40 + (8 - percent_itm) / 4 * 0.30
    elif percent_itm >= 1:
        moneyness_factor = 0.70 + (4 - percent_itm) / 3 * 0.20
    else:
        moneyness_factor = 0.90 + percent_itm * 0.10

    return base_extrinsic * moneyness_factor


def analyze_option(stock_price, strike, dte, name=""):
    """Analyze an option and return all components"""
    intrinsic = max(0, stock_price - strike) * 100
    extrinsic = calculate_simple_extrinsic(stock_price, strike, dte)
    total_value = intrinsic + extrinsic
    delta = calculate_simple_delta(stock_price, strike, dte)
    percent_itm = ((stock_price - strike) / stock_price) * 100

    return {
        'name': name,
        'stock_price': stock_price,
        'strike': strike,
        'dte': dte,
        'percent_itm': percent_itm,
        'intrinsic': intrinsic,
        'extrinsic': extrinsic,
        'total_value': total_value,
        'delta': delta,
        'extrinsic_pct': (extrinsic / total_value) * 100 if total_value > 0 else 0
    }


def print_comparison():
    print("=" * 90)
    print("LEAPS PRICING MODEL COMPARISON: SIMULATED vs REAL MARKET")
    print("=" * 90)
    print()

    # Real OptionStrat data
    print("REAL MARKET DATA (OptionStrat):")
    print("  IWM $230 Call, 327 DTE (expiring 1/15/27)")
    print("  Current IWM price: $264.63")
    print("  Market mid price: $49.04/share × 100 = $4,904")
    real_intrinsic = (264.63 - 230) * 100
    real_total = 4904
    real_extrinsic = real_total - real_intrinsic
    real_percent_itm = ((264.63 - 230) / 264.63) * 100
    print(f"  Intrinsic: ${real_intrinsic:,.0f}")
    print(f"  Extrinsic: ${real_extrinsic:,.0f}")
    print(f"  Percent ITM: {real_percent_itm:.1f}%")
    print(f"  Extrinsic %: {(real_extrinsic/real_total)*100:.1f}%")
    print()

    # Simulated data - same scenario
    print("SIMULATED MODEL (Same Scenario):")
    sim = analyze_option(264.63, 230, 327, "IWM $230C")
    print(f"  IWM $230 Call, 327 DTE")
    print(f"  Current IWM price: ${sim['stock_price']:.2f}")
    print(f"  Simulated value: ${sim['total_value']:,.0f}")
    print(f"  Intrinsic: ${sim['intrinsic']:,.0f}")
    print(f"  Extrinsic: ${sim['extrinsic']:,.0f}")
    print(f"  Percent ITM: {sim['percent_itm']:.1f}%")
    print(f"  Delta: {sim['delta']:.3f}")
    print(f"  Extrinsic %: {sim['extrinsic_pct']:.1f}%")
    print()

    # Calculate differences
    diff_total = sim['total_value'] - real_total
    diff_pct = (diff_total / real_total) * 100
    diff_extrinsic = sim['extrinsic'] - real_extrinsic

    print("COMPARISON:")
    print(f"  Total Value Difference: ${diff_total:,.0f} ({diff_pct:+.1f}%)")
    print(f"  Intrinsic Difference: ${sim['intrinsic'] - real_intrinsic:,.0f} (should be ~$0)")
    print(f"  Extrinsic Difference: ${diff_extrinsic:,.0f}")
    print()

    # Educational multiplier explanation
    print("NOTE: The simulator uses 3x extrinsic multiplier for educational clarity.")
    print("      Real market extrinsic: ~$1,441")
    print("      Simulator base extrinsic: ~$1,441 × 3 = ~$4,323")
    print()

    # Show what the simulator would price without 3x multiplier
    print("HYPOTHETICAL: Simulator with 1x multiplier (real market calibration):")
    # Recalculate with baseATM_7DTE_SPY = 450 instead of 1350
    SPY_BASE_PRICE = 590.0
    baseATM_7DTE_SPY_REAL = 450  # Real market value instead of 1350
    price_scale_factor = math.sqrt(264.63 / SPY_BASE_PRICE)
    baseATM_7DTE = baseATM_7DTE_SPY_REAL * price_scale_factor
    time_factor = math.sqrt(327 / 7)
    base_extrinsic = baseATM_7DTE * time_factor
    percent_itm = ((264.63 - 230) / 264.63) * 100
    # Moneyness factor for 13.1% ITM
    moneyness_factor = 0.10 + (15 - 13.1) / 3 * 0.10
    real_calibrated_extrinsic = base_extrinsic * moneyness_factor
    real_calibrated_total = real_intrinsic + real_calibrated_extrinsic

    print(f"  Extrinsic (1x): ${real_calibrated_extrinsic:,.0f}")
    print(f"  Total value (1x): ${real_calibrated_total:,.0f}")
    print(f"  Difference from market: ${real_calibrated_total - real_total:,.0f} ({((real_calibrated_total - real_total)/real_total)*100:+.1f}%)")
    print()

    print("=" * 90)
    print("ADDITIONAL SCENARIOS")
    print("=" * 90)
    print()

    # Compare original user scenarios
    print("ORIGINAL USER SCENARIOS (from summary):")
    print()

    # SPY scenario
    print("SPY $510 Call, 360 DTE at SPY $590:")
    spy_sim = analyze_option(590, 510, 360, "SPY")
    print(f"  Simulated: ${spy_sim['total_value']:,.0f}")
    print(f"  Intrinsic: ${spy_sim['intrinsic']:,.0f}")
    print(f"  Extrinsic: ${spy_sim['extrinsic']:,.0f}")
    print(f"  Percent ITM: {spy_sim['percent_itm']:.1f}%")
    print(f"  Delta: {spy_sim['delta']:.3f}")
    print()

    # IWM scenario
    print("IWM $220 Call, 360 DTE at IWM $250:")
    iwm_sim = analyze_option(250, 220, 360, "IWM")
    print(f"  Simulated: ${iwm_sim['total_value']:,.0f}")
    print(f"  Intrinsic: ${iwm_sim['intrinsic']:,.0f}")
    print(f"  Extrinsic: ${iwm_sim['extrinsic']:,.0f}")
    print(f"  Percent ITM: {iwm_sim['percent_itm']:.1f}%")
    print(f"  Delta: {iwm_sim['delta']:.3f}")
    print()

    # Ratio comparison
    ratio = iwm_sim['total_value'] / spy_sim['total_value']
    print(f"IWM/SPY Ratio: {ratio:.1%}")
    print(f"  This means IWM costs {ratio:.1%} of SPY cost")
    print(f"  Educational gameplay benefit: Clear price difference helps learning")
    print()


if __name__ == "__main__":
    print_comparison()
