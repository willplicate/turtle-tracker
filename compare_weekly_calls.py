"""
Compare Weekly Call Pricing: Simulator vs Real Market
Analyzing the screenshot data
"""
import math

def calculate_weekly_call_premium_with_vix(stock_price, strike, dte, vix, base_vix=15.0):
    """Calculate weekly call premium using the simulator's formula"""
    intrinsic = max(0, stock_price - strike) * 100
    distance_from_strike = stock_price - strike
    percent_diff = (distance_from_strike / strike) * 100

    base_extrinsic_7dte = 450
    time_factor = dte / 7

    abs_percent = abs(percent_diff)

    # Moneyness factor
    if abs_percent < 0.1:
        moneyness_factor = 1.0
    elif abs_percent < 0.2:
        moneyness_factor = 1.0 - (abs_percent - 0.1) * 0.4
    elif abs_percent < 0.35:
        moneyness_factor = 0.96 - (abs_percent - 0.2) * 0.8
    elif abs_percent < 0.5:
        moneyness_factor = 0.84 - (abs_percent - 0.35) * 1.2
    else:
        moneyness_factor = max(0.3, 0.66 - (abs_percent - 0.5) * 0.8)

    # Base extrinsic at VIX=15
    base_extrinsic = base_extrinsic_7dte * time_factor * moneyness_factor

    # Vega factor
    if abs_percent < 0.2:
        vega_factor = 1.0  # ATM
    elif abs_percent < 0.35:
        vega_factor = 0.8  # ~1 strike OTM
    elif abs_percent < 0.5:
        vega_factor = 0.6  # ~2 strikes OTM
    else:
        vega_factor = 0.4  # 3+ strikes OTM

    # IV multiplier
    base_multiplier = math.sqrt(vix / base_vix) * 1.3
    iv_multiplier = 1.0 + (base_multiplier - 1.0) * vega_factor

    # Total extrinsic with VIX
    total_extrinsic = base_extrinsic * iv_multiplier
    vix_premium = total_extrinsic - base_extrinsic

    return {
        'intrinsic': intrinsic,
        'base_extrinsic': base_extrinsic,
        'vix_premium': vix_premium,
        'total_extrinsic': total_extrinsic,
        'total': intrinsic + total_extrinsic,
        'per_share': (intrinsic + total_extrinsic) / 100
    }


def analyze_screenshot_data():
    """Analyze the data from the user's screenshot"""
    print("=" * 90)
    print("WEEKLY CALL PRICING ANALYSIS")
    print("=" * 90)
    print()

    # From screenshot
    spy_price = 260.07
    num_contracts = 3
    dte = 7  # Weekly options
    vix = 15  # Assuming base VIX, user can adjust

    print(f"Setup from Screenshot:")
    print(f"  SPY Price: ${spy_price:.2f}")
    print(f"  Number of Contracts: {num_contracts}")
    print(f"  DTE: {dte} days")
    print(f"  VIX: {vix} (assumed)")
    print()

    # Screenshot data
    screenshot_data = [
        {'strike': 260, 'type': '1 ITM', 'total': 1589.63, 'base': 530, 'vix': 73},
        {'strike': 261, 'type': 'ATM', 'total': 1234.61, 'base': 412, 'vix': 36},
        {'strike': 262, 'type': '1 OTM', 'total': 677.78, 'base': 226, 'vix': 14},
        {'strike': 263, 'type': '2 OTM', 'total': 431.12, 'base': 144, 'vix': 9},
        {'strike': 264, 'type': '3 OTM', 'total': 431.12, 'base': 144, 'vix': 9},  # DUPLICATE!
    ]

    print("SCREENSHOT VALUES vs CALCULATED:")
    print(f"{'Strike':<8} {'Type':<8} {'Screenshot':<15} {'Calculated':<15} {'Diff':<10} {'$/share':<10}")
    print("-" * 90)

    for data in screenshot_data:
        strike = data['strike']
        calc = calculate_weekly_call_premium_with_vix(spy_price, strike, dte, vix)

        screenshot_total = data['total']
        calculated_total = calc['total'] * num_contracts
        diff = calculated_total - screenshot_total
        diff_pct = (diff / screenshot_total) * 100 if screenshot_total > 0 else 0

        print(f"${strike:<7} {data['type']:<8} ${screenshot_total:<14,.2f} ${calculated_total:<14,.2f} "
              f"{diff_pct:>6.1f}%   ${calc['per_share']:.2f}")

    print()
    print("🔴 ISSUE DETECTED: $263 and $264 both show identical values ($431.12)")
    print("   This is a bug - they should be different!")
    print()

    # Detailed breakdown for ATM
    print("=" * 90)
    print("DETAILED BREAKDOWN: ATM ($261 strike)")
    print("=" * 90)
    print()

    atm_calc = calculate_weekly_call_premium_with_vix(spy_price, 261, dte, vix)
    print(f"SPY: ${spy_price:.2f}, Strike: $261")
    print(f"  Distance from strike: ${spy_price - 261:.2f}")
    print(f"  Percent diff: {((spy_price - 261) / 261) * 100:.3f}%")
    print()
    print(f"  Intrinsic: ${atm_calc['intrinsic']:.2f}")
    print(f"  Base Extrinsic (VIX=15): ${atm_calc['base_extrinsic']:.2f}")
    print(f"  VIX Premium: ${atm_calc['vix_premium']:.2f}")
    print(f"  Total Extrinsic: ${atm_calc['total_extrinsic']:.2f}")
    print(f"  Total per contract: ${atm_calc['total']:.2f}")
    print(f"  Total for {num_contracts} contracts: ${atm_calc['total'] * num_contracts:.2f}")
    print(f"  Per share: ${atm_calc['per_share']:.2f}")
    print()
    print(f"Screenshot shows: ${screenshot_data[1]['total']:.2f} (base: ${screenshot_data[1]['base']}, VIX: ${screenshot_data[1]['vix']})")
    print()

    # Compare to real market expectations
    print("=" * 90)
    print("REAL MARKET COMPARISON")
    print("=" * 90)
    print()

    print("Typical SPY weekly options (7 DTE) pricing:")
    print("  - ATM: $2-4 per share (depends on VIX)")
    print("  - 1 OTM: $1-2 per share")
    print("  - 2 OTM: $0.50-1 per share")
    print("  - 3 OTM: $0.25-0.50 per share")
    print()

    print("Simulator pricing (at VIX=15):")
    for i, data in enumerate(screenshot_data[:4]):  # Skip duplicate
        strike = data['strike']
        calc = calculate_weekly_call_premium_with_vix(spy_price, strike, dte, vix)
        per_share = calc['per_share']

        # Estimate typical range
        if i == 0:
            typical = "$3-5"  # 1 ITM
        elif i == 1:
            typical = "$2-4"  # ATM
        elif i == 2:
            typical = "$1-2"  # 1 OTM
        elif i == 3:
            typical = "$0.50-1"  # 2 OTM
        else:
            typical = "$0.25-0.50"  # 3 OTM

        status = "✅" if per_share >= 2 else "⚠️" if per_share >= 1 else "❓"
        print(f"  ${strike} ({data['type']}): ${per_share:.2f}/share - Typical: {typical} {status}")

    # Check 3 OTM separately
    calc_264 = calculate_weekly_call_premium_with_vix(spy_price, 264, dte, vix)
    print(f"  $264 (3 OTM): ${calc_264['per_share']:.2f}/share - Typical: $0.25-0.50")
    print()

    print("NOTES:")
    print("  ✅ = Within expected range")
    print("  ⚠️ = Borderline (may be slightly high)")
    print("  ❓ = Needs validation")
    print()

    # Test with higher VIX
    print("=" * 90)
    print("VIX IMPACT TEST (VIX=25 instead of VIX=15)")
    print("=" * 90)
    print()

    high_vix = 25
    print(f"Recalculating ATM ($261) with VIX={high_vix}:")
    atm_high_vix = calculate_weekly_call_premium_with_vix(spy_price, 261, dte, high_vix)
    print(f"  Base Extrinsic (VIX=15): ${atm_calc['base_extrinsic']:.2f}")
    print(f"  Total Extrinsic (VIX={high_vix}): ${atm_high_vix['total_extrinsic']:.2f}")
    print(f"  VIX Premium: ${atm_high_vix['vix_premium']:.2f}")
    print(f"  Total per contract: ${atm_high_vix['total']:.2f}")
    print(f"  Per share: ${atm_high_vix['per_share']:.2f}")
    print()
    print(f"VIX multiplier effect: {atm_high_vix['total_extrinsic'] / atm_calc['base_extrinsic']:.2f}x")
    print()


if __name__ == "__main__":
    analyze_screenshot_data()
