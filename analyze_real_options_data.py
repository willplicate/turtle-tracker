"""
Analyze real SPY options data to build accurate pricing model
Date: Feb 10, 2026
SPY Price: $695.46
Expiration: Feb 17, 2026 (7 DTE)
"""

import math

# Real market data from option chain
spy_price = 695.46
dte = 7

options_data = [
    # Strike, Extrinsic, Delta, Bid, Ask
    (690, 3.06, 0.66, 8.47, 8.55),
    (691, 3.30, 0.64, 7.71, 7.80),
    (692, 3.55, 0.61, 6.96, 7.05),
    (693, 3.84, 0.57, 6.20, 6.39),
    (694, 4.15, 0.55, 5.58, 5.61),
    (695, 4.50, 0.52, 4.93, 4.95),  # ATM
    (696, 4.31, 0.48, 4.30, 4.32),
    (697, 3.72, 0.45, 3.71, 3.72),
    (698, 3.16, 0.41, 3.15, 3.17),
    (699, 2.65, 0.37, 2.64, 2.65),
    (700, 2.18, 0.33, 2.17, 2.19),
    (701, 1.77, 0.28, 1.75, 1.77),
    (702, 1.39, 0.25, 1.39, 1.40),
    (703, 1.08, 0.21, 1.07, 1.09),
]

print("=" * 80)
print("REAL SPY OPTIONS ANALYSIS (7 DTE)")
print("=" * 80)
print(f"SPY Price: ${spy_price:.2f}")
print(f"Days to Expiration: {dte}")
print()

print(f"{'Strike':<8} {'%ITM/OTM':<10} {'Delta':<8} {'Extrinsic':<12} {'Mid Price':<12} {'Intrinsic':<12}")
print("-" * 80)

for strike, extrinsic, delta, bid, ask in options_data:
    mid_price = (bid + ask) / 2
    intrinsic = max(0, spy_price - strike) * 100
    percent_itm_otm = ((spy_price - strike) / spy_price) * 100

    itm_label = f"{percent_itm_otm:+.2f}%"

    print(f"{strike:<8} {itm_label:<10} {delta:<8.2f} ${extrinsic * 100:<10.2f} ${mid_price * 100:<10.2f} ${intrinsic:<10.2f}")

print()
print("=" * 80)
print("KEY OBSERVATIONS")
print("=" * 80)
print()

# Find ATM
atm_strike = min(options_data, key=lambda x: abs(x[0] - spy_price))
print(f"ATM Strike: {atm_strike[0]}")
print(f"ATM Delta: {atm_strike[2]:.2f} (should be ~0.50)")
print(f"ATM Extrinsic: ${atm_strike[1] * 100:.2f}")
print()

# Analyze ITM options
print("ITM Options:")
itm_options = [opt for opt in options_data if opt[0] < spy_price]
for strike, extrinsic, delta, bid, ask in itm_options[:5]:
    intrinsic = (spy_price - strike) * 100
    total_value = (bid + ask) / 2 * 100
    extrinsic_pct = (extrinsic * 100) / total_value * 100
    print(f"  ${strike}: Delta={delta:.2f}, Extrinsic=${extrinsic * 100:.2f} ({extrinsic_pct:.1f}% of value)")

print()
print("OTM Options:")
otm_options = [opt for opt in options_data if opt[0] > spy_price]
for strike, extrinsic, delta, bid, ask in otm_options[:5]:
    total_value = (bid + ask) / 2 * 100
    print(f"  ${strike}: Delta={delta:.2f}, Extrinsic=${extrinsic * 100:.2f} (100% of value)")

print()
print("=" * 80)
print("EXTRAPOLATE TO LEAPS (365 DTE)")
print("=" * 80)
print()
print("Using sqrt(time) scaling: Extrinsic(365 DTE) = Extrinsic(7 DTE) × sqrt(365/7)")
print(f"Scaling factor: sqrt(365/7) = sqrt(52.14) = {math.sqrt(365/7):.2f}")
print()

scaling_factor = math.sqrt(365 / 7)

print(f"{'Strike':<8} {'%ITM/OTM':<10} {'Delta':<8} {'7 DTE Extr':<12} {'365 DTE Extr':<14}")
print("-" * 80)

for strike, extrinsic_7dte, delta, bid, ask in options_data:
    percent_itm_otm = ((spy_price - strike) / spy_price) * 100
    itm_label = f"{percent_itm_otm:+.2f}%"
    extrinsic_365dte = extrinsic_7dte * scaling_factor

    print(f"{strike:<8} {itm_label:<10} {delta:<8.2f} ${extrinsic_7dte * 100:<10.2f} ${extrinsic_365dte * 100:<12.2f}")

print()
print("=" * 80)
print("CRITICAL INSIGHT FOR LEAPS PRICING")
print("=" * 80)
print()
print("For a LEAPS that's 0.78% ITM (like 690 strike @ $695.46):")
print(f"  - Delta: 0.66")
print(f"  - 7 DTE Extrinsic: ${3.06 * 100:.2f}")
print(f"  - 365 DTE Extrinsic (estimated): ${3.06 * scaling_factor * 100:.2f}")
print()
print("For a LEAPS that's 15% ITM (e.g., $510 strike @ $585):")
print("  - This is MUCH deeper ITM than our data shows")
print("  - Delta should be ~0.90-0.95 (approaching stock-like behavior)")
print("  - Extrinsic should be minimal (< 2% of total value)")
print()
print("PROPOSED DELTA FORMULA for deep ITM:")
print("  For ITM > 10%: delta = 0.85 + (percent_itm - 10) * 0.01")
print("  For 15% ITM: delta = 0.85 + 5 * 0.01 = 0.90")
print()
print("PROPOSED EXTRINSIC FORMULA for deep ITM LEAPS:")
print("  Base extrinsic at 10% ITM: $220 (from extrapolation)")
print("  Reduce by 20% for each 1% deeper ITM")
print("  For 15% ITM: $220 * (0.8^5) = $220 * 0.33 = $72")
print()
print("=" * 80)
print("THETA CALCULATION")
print("=" * 80)
print()
print("For 7 DTE options, extrinsic decays from ~$450 to $0 over 7 days")
print("ATM theta ≈ -$450 / 7 = -$64/day")
print()
print("For 365 DTE LEAPS:")
print(f"ATM extrinsic: ${4.50 * scaling_factor * 100:.2f}")
print(f"Theta: -${4.50 * scaling_factor * 100 / 365:.2f}/day")
print()
print("For 15% ITM LEAPS with $72 extrinsic:")
print(f"Theta: -${72 / 365:.2f}/day")
print()
print("=" * 80)
