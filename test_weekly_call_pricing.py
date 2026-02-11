"""
Test our simplified weekly call pricing model against real market data
"""

import math

# Real market data from analyze_real_options_data.py
spy_price = 695.46
real_data = {
    # Strike: (extrinsic, delta, description)
    694: (415, 0.55, "1 ITM"),
    695: (450, 0.52, "ATM"),
    696: (431, 0.48, "1 OTM"),
    697: (372, 0.45, "2 OTM"),
    698: (316, 0.41, "3 OTM"),
}

# Our simplified pricing model
def calculate_simple_weekly_premium(stock_price, strike, dte=7):
    """Our simplified model from simplifiedPricing.ts"""
    # Intrinsic value
    intrinsic = max(0, stock_price - strike) * 100

    # Extrinsic value
    distance_from_strike = stock_price - strike
    percent_diff = (distance_from_strike / strike) * 100

    # Base extrinsic for 7 DTE ATM (real market data: $450)
    base_extrinsic_7dte = 450

    # Time scaling (linear for weeklies)
    time_factor = dte / 7

    # Moneyness factor - refined for $1 strikes
    # At SPY $590, each $1 = 0.17%, so we need fine granularity
    abs_percent = abs(percent_diff)

    if abs_percent < 0.1:
        # Very close to ATM
        moneyness_factor = 1.0
    elif abs_percent < 0.2:
        # 0.1-0.2% away (1 strike on SPY ~$600)
        moneyness_factor = 1.0 - (abs_percent - 0.1) * 0.4  # 1.0 to 0.96
    elif abs_percent < 0.35:
        # 0.2-0.35% away (2 strikes)
        moneyness_factor = 0.96 - (abs_percent - 0.2) * 0.8  # 0.96 to 0.84
    elif abs_percent < 0.5:
        # 0.35-0.5% away (3 strikes)
        moneyness_factor = 0.84 - (abs_percent - 0.35) * 1.2  # 0.84 to 0.66
    else:
        # Further away
        moneyness_factor = max(0.3, 0.66 - (abs_percent - 0.5) * 0.8)

    extrinsic = base_extrinsic_7dte * time_factor * moneyness_factor

    return intrinsic + extrinsic

print("=" * 90)
print("TESTING OUR SIMPLIFIED WEEKLY CALL PRICING MODEL")
print("=" * 90)
print(f"SPY Price: ${spy_price:.2f}")
print(f"DTE: 7 days")
print()

print(f"{'Strike':<8} {'Type':<10} {'Real Extr':<12} {'Our Extr':<12} {'Difference':<12} {'% Error':<10}")
print("-" * 90)

total_error = 0
count = 0

for strike, (real_extr, delta, desc) in sorted(real_data.items()):
    # Calculate using our model
    our_premium = calculate_simple_weekly_premium(spy_price, strike, 7)
    our_intrinsic = max(0, spy_price - strike) * 100
    our_extrinsic = our_premium - our_intrinsic

    # Compare
    difference = our_extrinsic - real_extr
    percent_error = (difference / real_extr) * 100

    total_error += abs(percent_error)
    count += 1

    print(f"{strike:<8} {desc:<10} ${real_extr:<10.2f} ${our_extrinsic:<10.2f} "
          f"${difference:>+10.2f} {percent_error:>+8.1f}%")

avg_error = total_error / count

print()
print("=" * 90)
print("SUMMARY")
print("=" * 90)
print(f"Average absolute error: {avg_error:.1f}%")
print()

if avg_error < 10:
    print("✅ EXCELLENT: Our model is within 10% of real market prices")
elif avg_error < 20:
    print("✅ GOOD: Our model is within 20% of real market prices")
elif avg_error < 30:
    print("⚠️  ACCEPTABLE: Our model is within 30% of real market prices")
else:
    print("❌ NEEDS IMPROVEMENT: Model deviates too much from real prices")

print()
print("=" * 90)
print("DETAILED ANALYSIS")
print("=" * 90)
print()

# Test at SPY $590 (our game scenario)
test_spy = 590.0
print(f"Testing at SPY ${test_spy:.2f} (our game scenario):")
print(f"{'Strike':<8} {'Type':<10} {'Premium':<12} {'Extrinsic':<12} {'Intrinsic':<12}")
print("-" * 60)

strikes_to_test = [
    (test_spy - 1, "1 ITM"),
    (test_spy, "ATM"),
    (test_spy + 1, "1 OTM"),
    (test_spy + 2, "2 OTM"),
    (test_spy + 3, "3 OTM"),
]

for strike, desc in strikes_to_test:
    premium = calculate_simple_weekly_premium(test_spy, strike, 7)
    intrinsic = max(0, test_spy - strike) * 100
    extrinsic = premium - intrinsic

    print(f"{strike:<8.0f} {desc:<10} ${premium:<10.2f} ${extrinsic:<10.2f} ${intrinsic:<10.2f}")

print()
print("=" * 90)
print("RECOMMENDATION")
print("=" * 90)
print()

if avg_error < 20:
    print("✅ Our simplified model is GOOD ENOUGH for the educational game.")
    print("   The pricing is realistic and will teach the right concepts.")
    print()
    print("   For the 5-strike selector, users will see reasonable price differences:")
    print("   - 1 ITM: Higher premium (more intrinsic)")
    print("   - ATM: Maximum extrinsic value")
    print("   - 1-3 OTM: Decreasing premiums as you go further OTM")
else:
    print("⚠️  Consider adjusting the model to match real market data more closely.")
    print()
    print("   Suggested adjustments:")
    print("   - Increase base ATM extrinsic from $150 to $450")
    print("   - Adjust moneyness decay curve")

print()
print("=" * 90)
