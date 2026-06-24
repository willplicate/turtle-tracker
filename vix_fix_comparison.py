"""
Compare VIX Impact: Before vs After Fix
"""
import math

def calculate_vix_impact_old(vix, base_vix=15, vega_factor=1.0):
    """OLD formula with 1.3 multiplier (BROKEN)"""
    base_multiplier = math.sqrt(vix / base_vix) * 1.3
    iv_multiplier = 1.0 + (base_multiplier - 1.0) * vega_factor
    return iv_multiplier

def calculate_vix_impact_new(vix, base_vix=15, vega_factor=1.0):
    """NEW formula without 1.3 multiplier (FIXED)"""
    base_multiplier = math.sqrt(vix / base_vix)
    iv_multiplier = 1.0 + (base_multiplier - 1.0) * vega_factor
    return iv_multiplier

print("=" * 80)
print("VIX MULTIPLIER FIX - BEFORE vs AFTER")
print("=" * 80)
print()

# Test scenarios
scenarios = [
    (10, "Very Low VIX (calm market)"),
    (13.5, "Current Game VIX (low/normal)"),
    (15, "Base VIX (neutral)"),
    (20, "Elevated VIX"),
    (25, "High VIX (volatile)"),
    (35, "Panic VIX (crisis)")
]

print(f"{'VIX':<8} {'Description':<30} {'OLD':<12} {'NEW':<12} {'Impact'}")
print("-" * 80)

for vix, desc in scenarios:
    old = calculate_vix_impact_old(vix, 15, 1.0)
    new = calculate_vix_impact_new(vix, 15, 1.0)
    old_pct = (old - 1.0) * 100
    new_pct = (new - 1.0) * 100

    status = "✅" if (vix < 15 and new < 1.0) or (vix > 15 and new > 1.0) or vix == 15 else "❌"

    print(f"{vix:<8.1f} {desc:<30} {old_pct:>+6.1f}%    {new_pct:>+6.1f}%    {status}")

print()
print("=" * 80)
print("DETAILED EXAMPLE: Your Current Game")
print("=" * 80)
print()

vix = 13.5
base_extrinsic = 298  # From your ATM screenshot

print(f"VIX: {vix} (BELOW base of 15 → should REDUCE premium)")
print(f"Base extrinsic: ${base_extrinsic}")
print()

old_mult = calculate_vix_impact_old(vix)
new_mult = calculate_vix_impact_new(vix)

old_total = base_extrinsic * old_mult
new_total = base_extrinsic * new_mult

old_vix_premium = old_total - base_extrinsic
new_vix_premium = new_total - base_extrinsic

print("OLD (BROKEN):")
print(f"  Multiplier: {old_mult:.3f}")
print(f"  Total extrinsic: ${old_total:.2f}")
print(f"  VIX premium: ${old_vix_premium:.2f} (+{(old_vix_premium/base_extrinsic)*100:.1f}%)")
print(f"  ❌ WRONG: VIX is LOW but premium INCREASED!")
print()

print("NEW (FIXED):")
print(f"  Multiplier: {new_mult:.3f}")
print(f"  Total extrinsic: ${new_total:.2f}")
print(f"  VIX adjustment: ${new_vix_premium:.2f} ({(new_vix_premium/base_extrinsic)*100:+.1f}%)")
print(f"  ✅ CORRECT: VIX is LOW so premium DECREASED!")
print()

print("Difference: ${:.2f}".format(new_total - old_total))
print()

print("=" * 80)
print("KEY TAKEAWAYS")
print("=" * 80)
print()
print("✅ VIX < 15: Premium should DECREASE (options cheaper)")
print("✅ VIX = 15: Premium unchanged (neutral)")
print("✅ VIX > 15: Premium should INCREASE (options more expensive)")
print()
print("The 1.3 multiplier was breaking this relationship!")
print()
