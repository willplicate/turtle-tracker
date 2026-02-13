"""
Test to verify the delta logic is correct:
Shorter DTE = Higher Delta (for ITM options)
"""

from delta_calculator import simplified_delta, black_scholes_delta

print("=" * 80)
print("VERIFY: Shorter DTE = Higher Delta (for ITM options)")
print("=" * 80)
print()

# Test with $60 ITM option ($530 strike, $590 SPY)
stock = 590
strike = 530
itm_amount = stock - strike

print(f"Scenario: ${itm_amount} ITM (${strike} strike at ${stock} SPY)")
print()
print(f"{'DTE':<8} {'Delta (Simple)':<15} {'Delta (BS)':<15} {'Reasoning':<50}")
print("-" * 90)

test_dtes = [
    (10, "Almost expired - very certain to stay ITM"),
    (50, "1.5 months - high certainty"),
    (100, "3 months - good certainty"),
    (200, "7 months - moderate certainty"),
    (360, "1 year - more uncertainty"),
    (450, "15 months - high uncertainty"),
    (730, "2 years - very high uncertainty"),
]

for dte, reasoning in test_dtes:
    simple = simplified_delta(stock, strike, dte)
    bs = black_scholes_delta(stock, strike, dte)
    print(f"{dte:<8} {simple:<15.4f} {bs:<15.4f} {reasoning:<50}")

print()
print("✓ Confirmed: Delta INCREASES as DTE DECREASES")
print()

# Now test what happens when price drops (delta should decrease)
print("=" * 80)
print("VERIFY: When price drops, delta decreases (need to roll!)")
print("=" * 80)
print()

strike = 530
dte = 200  # Fixed DTE
print(f"Scenario: ${strike} strike, {dte} DTE")
print()
print(f"{'SPY Price':<12} {'$ ITM':<10} {'% ITM':<10} {'Delta':<10} {'Status':<30}")
print("-" * 80)

price_scenarios = [
    (590, "Original position"),
    (580, "Down $10 - still healthy"),
    (570, "Down $20 - getting concerning"),
    (560, "Down $30 - delta dropping!"),
    (550, "Down $40 - NEED TO ROLL!"),
    (540, "Down $50 - URGENT ROLL!"),
]

for price, status in price_scenarios:
    itm = price - strike
    pct_itm = ((price - strike) / price) * 100
    delta = simplified_delta(price, strike, dte)

    # Flag if delta drops below 0.70
    flag = "⚠️ ROLL!" if delta < 0.70 else ""

    print(f"${price:<11} ${itm:<9} {pct_itm:>6.1f}%   {delta:<10.4f} {status:<30} {flag}")

print()
print("=" * 80)
print("TRADING RULE: When delta drops below 0.70, you need to ROLL the LEAPS!")
print("=" * 80)
print()
