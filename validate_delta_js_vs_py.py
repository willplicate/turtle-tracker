"""
Validate that JavaScript delta calculation matches Python
"""

from delta_calculator import simplified_delta

# Test cases matching the HTML simulator
test_cases = [
    # (stock_price, strike, dte, description)
    (590, 530, 200, "$60 ITM, 200 DTE"),
    (590, 530, 360, "$60 ITM, 360 DTE"),
    (590, 530, 450, "$60 ITM, 450 DTE"),
    (590, 510, 200, "$80 ITM, 200 DTE"),
    (590, 510, 360, "$80 ITM, 360 DTE"),
    (590, 510, 450, "$80 ITM, 450 DTE"),
    (590, 490, 200, "$100 ITM, 200 DTE"),
    (590, 490, 360, "$100 ITM, 360 DTE"),
    (590, 490, 450, "$100 ITM, 450 DTE"),
]

print("=" * 80)
print("DELTA VALIDATION - Python values to verify against JavaScript")
print("=" * 80)
print()
print("Copy these values and test them in the browser console:")
print()

for stock, strike, dte, desc in test_cases:
    delta = simplified_delta(stock, strike, dte)
    percent_itm = ((stock - strike) / stock) * 100

    print(f"// {desc}")
    print(f"calculateSimpleDelta({stock}, {strike}, {dte})  // Should be ≈ {delta:.4f} (${stock-strike} ITM, {percent_itm:.1f}%)")
    print()

print()
print("=" * 80)
print("EXAMPLE TEST IN BROWSER CONSOLE:")
print("=" * 80)
print("""
1. Open the HTML file in browser
2. Open developer console (F12)
3. Run: calculateSimpleDelta(590, 530, 200)
4. Should return approximately 0.8687
5. Run: calculateSimpleDelta(590, 530, 450)
6. Should return approximately 0.8391
7. Notice: Longer DTE = lower delta!
""")

print()
print("=" * 80)
print("FORMATTED TABLE FOR VALIDATION")
print("=" * 80)
print()
print(f"{'Description':<25} {'Stock':<8} {'Strike':<8} {'DTE':<6} {'%ITM':<8} {'Delta':<10}")
print("-" * 80)
for stock, strike, dte, desc in test_cases:
    delta = simplified_delta(stock, strike, dte)
    percent_itm = ((stock - strike) / stock) * 100
    print(f"{desc:<25} ${stock:<7} ${strike:<7} {dte:<6} {percent_itm:>6.1f}% {delta:>9.4f}")
