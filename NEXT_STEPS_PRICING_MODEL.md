# Next Steps: Rebuild LEAPS Pricing Model

## Current Problem

The LEAPS P&L still doesn't match the educational calculation shown on the Friday splash screen:

**Expected:**
```
Stock Impact = Stock_Change × Delta × 100
Theta Impact = Theta × 7 days
Total P&L = Stock Impact + Theta Impact
```

**Example from screenshot:**
```
Stock Change: +$4.10
Delta: 89%
Expected: +$4.10 × 0.89 × 100 - $24 = $365 - $24 = $341
Actual: $416
Difference: $75 (unexplained)
```

## Root Cause

The current pricing model has too many factors affecting the LEAPS value:
1. Intrinsic value (changes by FULL stock movement, not delta-adjusted)
2. Extrinsic value affected by VIX (even with reduced sensitivity)
3. Base premium calculations
4. Moneyness multipliers
5. Time multipliers

For deep ITM LEAPS, this complexity causes discrepancies.

## Proposed Solution: Python-First Approach

### Phase 1: Build Correct Python Model
1. **Define the ideal behavior:**
   - For deep ITM LEAPS (10%+ ITM), delta should be 0.95-0.99
   - P&L should be: `(Stock_Change × Delta × 100) + (Theta × Days)`
   - VIX should have minimal impact on deep ITM options
   - Extrinsic value should be tiny and decay linearly

2. **Create simplified pricing formula:**
   ```python
   def calculate_leaps_value_simple(stock_price, strike, dte, vix):
       # Intrinsic value
       intrinsic = max(0, stock_price - strike) * 100

       # Extrinsic value - VERY SMALL for deep ITM
       # Should be ~1-2% of total value for 10%+ ITM LEAPS
       extrinsic = calculate_minimal_extrinsic(stock_price, strike, dte, vix)

       # Total
       total = intrinsic + extrinsic

       # Greeks
       delta = calculate_accurate_delta(stock_price, strike)  # Should be 0.95+ for 10%+ ITM
       theta = -extrinsic / dte  # Linear decay of extrinsic

       return total, delta, theta
   ```

3. **Test with actual scenarios:**
   - Monday: SPY $580.90, strike $510, value should be X
   - Friday: SPY $585.00, strike $510, value should be Y
   - P&L = Y - X should equal (Stock_Change × Delta × 100) + (Theta × 7)

### Phase 2: Verify Against Real Options Pricing
- Compare to Black-Scholes (for reference, even though we don't use it)
- Check if delta/theta calculations are realistic
- Ensure deep ITM options behave like stock (delta → 1.0)

### Phase 3: Implement in TypeScript
- Once Python model is verified and matches expected behavior
- Port the exact logic to TypeScript
- No additional complexity or factors

## Key Principles for New Model

1. **Deep ITM LEAPS should behave like stock:**
   - Delta should approach 1.0 (0.95-0.99 for 10-20% ITM)
   - Almost all value is intrinsic
   - Extrinsic value is 1-3% of total value

2. **Extrinsic value should:**
   - Be proportional to DTE (more time = more extrinsic)
   - Decay linearly (not affected by VIX for deep ITM)
   - Be minimal for deep ITM options

3. **P&L should be deterministic:**
   - `P&L ≈ Intrinsic_Change + Extrinsic_Change`
   - `Intrinsic_Change ≈ Stock_Change × Delta × 100`
   - `Extrinsic_Change ≈ Theta × Days`

4. **Delta calculation:**
   - Use a formula that makes delta approach 1.0 for deep ITM
   - Example: `delta = 1.0 - (1.0 / (1.0 + percent_itm^2))`
   - For 15% ITM: `delta = 1.0 - (1.0 / (1.0 + 0.15^2)) = 0.98`

## Files to Create

1. `pricing_model_v2.py` - New simplified pricing model
2. `test_pricing_model.py` - Test cases with expected vs actual P&L
3. `compare_models.py` - Compare old vs new model behavior
4. Once verified, update `src/lib/pricing/optionsPricing.ts`

## Questions to Answer First

1. For a LEAPS that's 14.7% ITM, what should the delta be? (I suggest 0.96-0.98)
2. What should the extrinsic value be? (I suggest 1-2% of intrinsic value)
3. Should VIX affect deep ITM LEAPS at all? (I suggest no, or minimal < 5%)
4. How should theta be calculated? (I suggest: theta = -extrinsic / dte for simple linear decay)

## Current File Status

- `optionsPricing.ts` - Current model (complex, not matching expectations)
- `verify_pnl_calculations.py` - Test script showing the issue
- `diagnose_leaps_issue.py` - Diagnostic showing VIX doesn't explain the discrepancy
- `verify_new_pricing.py` - Shows current model still has ~$37 error

Ready to start fresh with a Python-only approach when you are!
