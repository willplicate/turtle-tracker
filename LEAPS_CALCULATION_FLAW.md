# LEAPS Week-to-Week Calculation Flaw - Analysis

## The Problem

LEAPS values are changing in nonsensical ways week-to-week, with implied deltas that contradict basic option pricing theory.

### Evidence from Path 13 (montecarlo_path_13_pmcc_Conservative.csv)

**Week 2: Negative Implied Delta**
- SPY: $594.05 → $593.38 (**-$0.67**)
- LEAPS: $12,429 → $13,258 (**+$829**)
- VIX: 14.4 → 16.9 (+2.5)
- **Implied delta: -1237** (negative delta on a long call?!)

**Week 8: Massive Oversensitivity**
- SPY: $567.73 → $565.86 (**-$1.87**)
- LEAPS: $14,320 → $11,748 (**-$2,572**)
- VIX: 23.4 → 20.1 (-3.3)
- **Implied delta: 13.75** (way too high)

**Week 11: Wrong Direction**
- SPY: $576.98 → $597.68 (**+$20.70**)
- LEAPS: $12,950 → $11,850 (**-$1,100**)
- VIX: 22.0 → 16.3 (-5.7)
- **Stock UP but LEAPS DOWN** (negative delta)

**Week 48: Wrong Direction Again**
- SPY: $627.32 → $631.84 (**+$4.52**)
- LEAPS: $10,017 → $9,218 (**-$799**)
- VIX: 14.9 → 13.0 (-1.9)
- **Stock UP but LEAPS DOWN**

---

## Root Cause Analysis

### Issue #1: VIX Dominates Over Intrinsic

For moderate ITM LEAPS (5-10% ITM), VIX changes are overwhelming stock price changes.

**Week 11 breakdown:**
- Stock gain: +$20.70 → Should add ~$1,700 in intrinsic (delta ~0.82)
- VIX drop: 22.0 → 16.3 → Extrinsic collapses by ~$2,800
- **Net: -$1,100** (VIX effect > stock effect)

**The problem:** At 8.5% ITM with 288 DTE, the LEAPS still has significant VIX sensitivity due to:
1. Large extrinsic value (~$8,000)
2. VIX multiplier not reduced enough for moderate ITM
3. DTE-dependent floor already dropping below 0.70

### Issue #2: DTE-Dependent Floor Creates Double Decay

As DTE decreases, the moneyness floor drops:
- **DTE 365**: floor = 0.70
- **DTE 300**: floor = 0.70 (boundary)
- **DTE 288**: floor = 0.669
- **DTE 200**: floor = 0.393
- **DTE 90**: floor = 0.15
- **DTE 85**: floor = none

This creates **two sources of decay**:
1. Theta decay (correct)
2. Floor erosion (artificial)

From `optionsPricing.ts` lines 106-110:
```typescript
} else if (dte < 300) {
    const transitionFactor = (dte - 90) / 210;
    const leapsFloor = 0.15 + (0.70 - 0.15) * transitionFactor;
    return Math.max(baseMultiplier, leapsFloor);
}
```

**Week 1**: DTE 365 → floor 0.70
**Week 30**: DTE 155 → floor 0.32
**Extrinsic base dropped 54%** just from floor erosion!

### Issue #3: Moderate ITM LEAPS Have Excessive Extrinsic

At 5-10% ITM with 280+ DTE:
- Base premium at 288 DTE: ~$8,600
- Moneyness floor: 0.669 (due to LEAPS designation)
- VIX multiplier at VIX 22: ~1.4x (only 60-75% reduced)
- **Extrinsic: $8,600 × 0.669 × 1.4 = $8,060**

This extrinsic is way too sensitive to VIX for an option that's 5-8% ITM.

In real markets:
- 8% ITM LEAPS has ~20-25% extrinsic as % of total value
- Extrinsic should be ~$2,500-3,000, not $8,000
- VIX changes should barely affect a moderately ITM LEAPS

---

## Expected Behavior vs Actual

### Week 11 (SPY +$20.70, VIX -5.7)

**Expected LEAPS change:**
- Intrinsic gain: +$20.70 × 0.82 delta × 100 = **+$1,697**
- Extrinsic (theta): -7 days × $25/day = **-$175**
- VIX impact: -5.7 VIX on 8% ITM should be minimal = **-$200**
- **Net: +$1,322** ✓

**Actual LEAPS change:**
- **-$1,100** ❌

**Difference: $2,422 error** (VIX effect way too strong)

---

## Why This Breaks Monte Carlo Results

1. **Unrealistic P&L volatility**: LEAPS swinging $1,000-$3,000 on tiny price moves
2. **VIX-driven instead of stock-driven**: Strategy profitability depends more on VIX than SPY
3. **Artificial time decay acceleration**: Floor erosion creates 2x the expected decay
4. **Makes rule evaluation meaningless**: If LEAPS behavior is wrong, strike selection rules can't be validated

---

## The Fix (High-Level)

### Option A: Reduce VIX Sensitivity for Moderate ITM
Change the VIX reduction formula to be more aggressive:
- 5% ITM: 85% VIX reduction (currently 60%)
- 8% ITM: 90% VIX reduction (currently 70%)
- 10% ITM: 93% VIX reduction (currently 85%)

### Option B: Fix DTE-Dependent Floor (Recommended)
**The moneyness floor should NOT decrease as DTE decreases.**

A LEAPS is a LEAPS based on its original purchase, not its current DTE. Once you buy a 365 DTE option, it should maintain LEAPS-like extrinsic characteristics.

**Solution:** Track whether an option was originally a LEAPS and preserve floor:
```typescript
interface SimulatedLEAPSPosition {
  strike: number;
  costBasis: number;
  dte: number;
  quantity: number;
  originalDTE: number; // NEW: Track original DTE
}
```

Then in pricing:
```typescript
function getMoneynessMultiplier(stockPrice, strike, dte, originalDTE) {
  const baseMultiplier = /* calculate based on percentAway */;

  // Use ORIGINAL DTE to determine if this is a LEAPS
  const isLEAPS = originalDTE >= 300;

  if (isLEAPS) {
    // Preserve LEAPS floor regardless of current DTE
    return Math.max(baseMultiplier, 0.70);
  } else {
    // Short-term options use current DTE
    return baseMultiplier;
  }
}
```

### Option C: Reduce Overall Extrinsic Base for Moderate ITM
The base premium at 288 DTE ($8,600) combined with floor (0.669) creates too much extrinsic.

For 5-10% ITM, the moneyness floor should be lower:
- ATM: 1.00
- 3% ITM: 0.70
- 5% ITM: 0.50
- 8% ITM: 0.35
- 10% ITM: 0.25

This reduces extrinsic from $8,060 → $3,010, which is more realistic.

---

## Recommended Solution

**Combine Option B + Option C:**

1. **Track originalDTE** and preserve LEAPS floor only for options purchased as LEAPS
2. **Reduce VIX sensitivity more aggressively** for 5-10% ITM (85-90% reduction instead of 60-75%)
3. **Lower the moneyness floor** for moderate ITM from 0.70 → 0.40-0.50

This will make LEAPS behave as they should:
- Dominated by intrinsic value changes (delta)
- Smooth theta decay
- Minimal VIX impact for 8%+ ITM
- Realistic week-to-week P&L

---

## Validation Test

After the fix, Week 11 should show:
- SPY +$20.70, VIX -5.7
- LEAPS: +$1,200 to +$1,500 (not -$1,100)
- Breakdown: +$1,697 intrinsic, -$175 theta, -$150 VIX = +$1,372

This matches real option pricing behavior.
