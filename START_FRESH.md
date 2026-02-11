# Starting Fresh: Rebuild Pricing System

## Current State: System is Broken
- P&L calculations don't match expectations
- Multiple failed attempts to fix
- Code is cluttered with debugging statements
- Calculations are fundamentally wrong

## What We Learned

### What Works
✅ **Python pricing model** (`leaps_pricing_model_v2.py`) - P&L matches within $0.30
✅ **Real SPY options data analysis** - We have realistic delta, theta, extrinsic values
✅ **Delta-based approach** - Conceptually correct: `value_change = (stock × delta × 100) + (theta × days)`

### What Doesn't Work
❌ Current TypeScript implementation - produces wrong P&L
❌ Week start value tracking - not capturing correctly
❌ Mixing intrinsic+extrinsic recalculation with delta updates
❌ Complex pricing formulas with VIX, moneyness, etc.

## Key Questions to Answer Before Rebuilding

### 1. What Does "Weekly P&L" Mean?
**Option A: P&L for This Week Only**
- Monday start value → Friday end value
- Resets every Monday
- Example: Week 1 = +$100, Week 2 = +$50 (not +$150)

**Option B: P&L Since Position Opened**
- Opening value → Current value
- Cumulative across all weeks
- Example: Week 1 = +$100, Week 2 = +$150 total

**User: Please decide which one you want!**

### 2. Should Pricing Be Simplified?
For an educational tool, do we need:
- VIX impact on LEAPS? (Could set to zero for deep ITM)
- Complex extrinsic calculations? (Could use fixed decay rate)
- Real market pricing? (Or simplified "teaching" model)

**User: How realistic vs. how simple?**

## Proposed Rebuild Approach

### Step 1: Finalize Python Model
1. User clarifies requirements above
2. Adjust Python model to match
3. Create test scenarios with expected results
4. **Verify it works perfectly before touching TypeScript**

### Step 2: Clean the Codebase
1. Remove all diagnostic code from `GameScreen.ts`
2. Remove all debug console.logs
3. Remove delta-based attempt from `stateManager.ts`
4. Get back to a clean, working baseline (even if calculations are wrong)

### Step 3: Port Python to TypeScript (Carefully)
1. **One function at a time**
2. **Test after each function**
3. **Don't move on until it works**

Order:
1. Initial LEAPS pricing (opening a position)
2. LEAPS value after 1 day (test with known scenario)
3. LEAPS value after 1 week (test with known scenario)
4. Week start value tracking (test that it resets correctly)
5. Weekly P&L calculation (test that math is correct)
6. Short call pricing (repeat above process)

### Step 4: Integration Testing
1. Run full week scenarios
2. Compare to Python model results
3. Must match within $1-2

## Test Scenarios (Define Before Coding)

### Scenario 1: LEAPS, Market Up
- Strike: $510
- Monday SPY: $580.90
- Friday SPY: $585.00 (+$4.10)
- Expected P&L: ~$368 (based on Python model)

### Scenario 2: Short Call, Expires OTM
- Strike: $593
- Premium: $125
- Expires at SPY $592 (OTM)
- Expected P&L: $125 (full premium)

### Scenario 3: Both Positions
- Run both scenarios together
- Verify total P&L = LEAPS P&L + Short Call P&L

## Success Criteria
✅ LEAPS P&L matches Python model (within $2)
✅ Short call P&L = premium collected when expires OTM
✅ Educational calculation shown on screen matches actual P&L
✅ No "VIX & Other Factors" mystery discrepancies
✅ Code is clean and maintainable
✅ User can verify calculations by hand

## Files to Keep (Reference)
- `leaps_pricing_model_v2.py` - The correct model
- `analyze_real_options_data.py` - Real market data
- `test_leaps_interactive.py` - Testing tool
- All the diagnostic scripts we created

## Files to Clean/Rebuild
- `src/lib/game/stateManager.ts` - Remove delta attempt, start fresh
- `src/components/GameScreen.ts` - Remove diagnostic panels
- `src/lib/pricing/optionsPricing.ts` - Simplify or replace

## Next Session Checklist
- [ ] User answers questions above
- [ ] Finalize Python model based on requirements
- [ ] Create 3-5 test scenarios with expected results
- [ ] Remove all debugging code from TypeScript
- [ ] Port Python model, one function at a time
- [ ] Test each function before moving on
- [ ] No shortcuts, no rushing

## The Right Way Forward
This is an educational tool. The calculations MUST be:
1. **Correct** - Matches real options behavior
2. **Transparent** - User can verify by hand
3. **Simple** - Easy to understand and maintain

We've learned that trying to patch a broken system doesn't work.
Time to rebuild it right. 🎯
