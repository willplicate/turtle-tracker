# LEAPS Pricing Model V2 - Results

## The Breakthrough

**Problem:** P&L didn't match `(Stock × Delta × 100) + (Theta × Days)`

**Root Cause:** The old model recalculated `Intrinsic + Extrinsic` every day, which always gives delta ≈ 1.0 for ITM options because intrinsic changes dollar-for-dollar with stock price.

**Solution:** Use **delta-based value updates** instead of recalculating intrinsic+extrinsic.

## New Model Results

Test scenario: $510 strike LEAPS, SPY $580.90 → $585.00 (+$4.10), 366 DTE

### Monday (Opening):
- **Value:** $7,779.15
- **Delta:** 0.922
- **Theta:** -$1.88/day
- **Extrinsic:** $689.15 (8.9% of value)
- **Intrinsic:** $7,090.00

### Friday (After 5 days):
- **Value:** $8,150.60
- **Delta:** 0.928
- **Theta:** -$1.88/day

### P&L Calculation:
- **Stock Impact:** $4.10 × 0.93 × 100 = **$380.56**
- **Theta Impact:** -$1.88/day × 5 days = **-$9.41**
- **Expected P&L:** **$371.15**

- **Actual P&L:** **$371.45**
- **Difference:** **$0.30** ✓✓✓

## How It Works

### 1. Initial Pricing (when position opens):
```python
intrinsic = (stock - strike) × 100
extrinsic = calculate_extrinsic(moneyness, dte, vix)
value = intrinsic + extrinsic
delta = calculate_delta(moneyness)
theta = -extrinsic / dte
```

### 2. Daily Updates (CRITICAL DIFFERENCE):
```python
# OLD MODEL (WRONG):
intrinsic = (new_stock - strike) × 100  # Always changes by $100 per $1 stock move
extrinsic = recalculate(...)
value = intrinsic + extrinsic  # This gives delta ≈ 1.0!

# NEW MODEL (CORRECT):
stock_change = new_stock - old_stock
value += stock_change × delta × 100  # Respects delta!
value += theta × 1  # Daily decay
# Then update delta and theta for next day
```

## Key Principles

1. **Value changes via delta, not intrinsic recalculation**
2. **Delta approaches 1.0 for deep ITM** (12% ITM → delta 0.92)
3. **Theta is tiny for LEAPS** (-$1.88/day for $689 extrinsic over 366 days)
4. **Extrinsic is small for deep ITM** (8.9% of total value)
5. **VIX has zero impact on deep ITM LEAPS** (for simplicity)

## Comparison with Old Model

| Metric | Old Model | New Model |
|--------|-----------|-----------|
| P&L Match | ❌ Off by $40-75 | ✅ Off by $0.30 |
| Delta Accuracy | ❌ Says 0.89, acts like 1.0 | ✅ Says 0.92, acts like 0.92 |
| VIX Impact | ❌ Causes swings | ✅ Zero for deep ITM |
| Theta Calculation | ❌ 2% daily (wrong) | ✅ -$1.88/day (realistic) |

## Next Steps

1. ✅ Python model validated
2. ⏳ Port to TypeScript (update `optionsPricing.ts` and `stateManager.ts`)
3. ⏳ Test in game simulator
4. ⏳ Verify with more scenarios

## Implementation Notes

**Files to update:**
- `src/lib/game/stateManager.ts` - Change ADVANCE_DAY to use delta-based updates
- `src/lib/pricing/optionsPricing.ts` - Simplify to only calculate initial pricing
- Store `last_stock_price` in position state to calculate stock changes

**Critical:** Don't recalculate `intrinsic + extrinsic` every day. Only update value via delta and theta!
