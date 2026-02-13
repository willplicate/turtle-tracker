"""
Test calibrated delta against real OptionStrat data
"""

def calculate_delta(stock_price, strike, dte):
    """
    Calibrated delta calculator matching JavaScript
    """
    percent_itm = ((stock_price - strike) / stock_price) * 100

    # Base delta from moneyness (calibrated to OptionStrat data)
    if percent_itm >= 17:
        base_delta = 0.92
    elif percent_itm >= 13:
        base_delta = 0.85 + (percent_itm - 13) / 4 * 0.07
    elif percent_itm >= 9:
        base_delta = 0.80 + (percent_itm - 9) / 4 * 0.05
    elif percent_itm >= 5:
        base_delta = 0.70 + (percent_itm - 5) / 4 * 0.10
    elif percent_itm >= 1:
        base_delta = 0.55 + (percent_itm - 1) / 4 * 0.15
    elif percent_itm >= 0:
        base_delta = 0.52 + percent_itm * 0.03
    elif percent_itm >= -1:
        base_delta = 0.52 + percent_itm * 0.03
    elif percent_itm >= -5:
        base_delta = 0.49 + (percent_itm + 1) / 4 * 0.14
    else:
        base_delta = max(0.15, 0.35 + (percent_itm + 5) / 5 * 0.20)

    # DTE adjustment - minimal
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


print("=" * 80)
print("CALIBRATED DELTA VS. OPTIONSTRAT DATA")
print("=" * 80)
print()

# Test against real market data
test_cases = [
    # (stock, strike, dte, market_delta, description)
    (681.74, 620, 189, 0.802, "OptionStrat: 9% ITM, 189 DTE"),
    (681.74, 620, 336, 0.785, "OptionStrat: 9% ITM, 336 DTE"),
    (681.74, 600, 189, 0.847, "OptionStrat: 13% ITM, 189 DTE (from screenshot)"),
]

print(f"{'Description':<50} {'% ITM':<8} {'Market':<10} {'Model':<10} {'Diff':<10}")
print("-" * 90)

for stock, strike, dte, market, desc in test_cases:
    pct_itm = ((stock - strike) / stock) * 100
    model_delta = calculate_delta(stock, strike, dte)
    diff = abs(market - model_delta)

    print(f"{desc:<50} {pct_itm:>6.1f}% {market:<10.3f} {model_delta:<10.3f} {diff:<10.3f}")

print()
print("=" * 80)
print("USER'S SCENARIO: $590 SPY with different strikes")
print("=" * 80)
print()

stock = 590
dte = 200

print(f"{'Strike':<10} {'$ ITM':<10} {'% ITM':<10} {'Delta':<10} {'Alert Level':<20}")
print("-" * 70)

strikes = [
    (490, "Deepest (slider left)"),
    (500, ""),
    (510, ""),
    (520, ""),
    (530, "Shallowest (slider right)"),
]

for strike, note in strikes:
    itm = stock - strike
    pct_itm = ((stock - strike) / stock) * 100
    delta = calculate_delta(stock, strike, dte)

    # Alert level
    if delta >= 0.85:
        alert = "✓ Excellent"
    elif delta >= 0.80:
        alert = "✓ Good"
    elif delta >= 0.75:
        alert = "⚠️ Acceptable"
    else:
        alert = "⚠️ Risky"

    print(f"${strike:<9} ${itm:<9} {pct_itm:>6.1f}%   {delta:<10.3f} {alert:<20} {note}")

print()
print("=" * 80)
print("EXPECTED BEHAVIOR IN HTML:")
print("=" * 80)
print()
print("When you move the slider from right ($530) to left ($490):")
print("- $530 (10.2% ITM): Delta ~0.82 → 'Good' (yellow/orange)")
print("- $510 (13.6% ITM): Delta ~0.85 → 'Excellent' (green)")
print("- $490 (16.9% ITM): Delta ~0.88 → 'Excellent' (green)")
print()
print("Now it VARIES the message instead of always showing 'Delta Healthy'!")
print()
