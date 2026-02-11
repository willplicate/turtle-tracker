# Turtle Trading Game - Context

## Project Overview
Poor Man's Covered Call simulator - educational game teaching options trading strategy using LEAPS + weekly short calls.

## Tech Stack
- TypeScript
- Vite (dev server)
- Custom state management (Redux-style)
- Component-based architecture (vanilla TS classes, no framework)

## Key Files

### State Management
- `src/lib/game/stateManager.ts` - Central game state, actions, reducer
  - Tracks positions, cash, P&L, market data
  - **Important**: `leapsWeekStartValue` and `shortCallWeekStartValue` track position values at start of each week for weekly P&L calculation

### Market & Pricing
- `src/lib/market/priceGenerator.ts` - Geometric Brownian motion for SPY price simulation
- `src/lib/pricing/optionsPricing.ts` - Custom empirical options pricing (not Black-Scholes)
  - Uses VIX-based volatility
  - Returns delta, theta, gamma, vega, total price

### Position Management
- `src/lib/game/positionManager.ts` - LEAPS and short call operations
  - `calculateLEAPSPnL()` - Returns unrealized P&L (total, not weekly)
  - `calculateShortCallPnL()` - Returns unrealized P&L for short positions
  - `getRecommendedStrike()` - VIX-based strike recommendations (uses $1 increments for weeklies)

### UI Components
- `src/components/GameScreen.ts` - Main game UI
  - Friday splash screen with weekly P&L summary
  - Market summary section (top of splash)
  - Position P&L breakdowns with educational calculations
- `src/components/OptionsChain/OptionsChain.ts` - Options chain display
  - Weekly (7 DTE): $1 strike increments
  - LEAPS (365 DTE): $5 strike increments
- `src/components/Positions/LEAPSPanel.ts` - LEAPS position display
- `src/components/Positions/ShortCallPanel.ts` - Short call position display

## Recent Fixes (Session Summary)

### 1. Fixed Weekly P&L Calculation Bug
**Problem**: Friday splash showed TOTAL unrealized P&L instead of WEEKLY change. Example: showed -$2,327 instead of expected -$536.

**Root Cause**: Week start values were captured AFTER Monday's market movement instead of BEFORE (capturing Friday's closing values).

**Fix**:
- Added `leapsWeekStartValue` and `shortCallWeekStartValue` to GameState
- Capture values at week boundaries using OLD position values (before day advances)
- Calculate weekly P&L as: `currentValue - weekStartValue`
- stateManager.ts lines 186-195

### 2. Fixed "VIX & Other Factors" Calculation
**Problem**: Showed -$637 discrepancy when it should be ~$50-100.

**Root Cause**: Same as above - incorrect week start value made calculations way off.

**Fix**: Now shows accurate weekly P&L, VIX factors are small as expected.

### 3. Added Market Summary to Friday Splash
**Problem**: Weekly stock movement was buried inside LEAPS calculation section.

**Fix**:
- Added prominent market summary at top of splash screen
- Shows: "SPY Weekly Movement: $608.81 → $612.02 = +$3.22 (+0.5%)"
- GameScreen.ts lines 257-265

### 4. Changed Weekly Strikes to $1 Increments
**Problem**: Weekly options used $5 strikes (unrealistic for SPY). "2 strikes OTM" = $10 away.

**Fix**:
- Weekly (7 DTE): Now use $1 increments (580, 581, 582, 583...)
- LEAPS (365 DTE): Still use $5 increments (565, 570, 575, 580...)
- Updated OptionsChain.ts and positionManager.ts
- VIX-based recommendations now: 1 ITM = $1 below, 2 ITM = $2 below

## Game Flow
1. User buys LEAPS (deep ITM call, 365 DTE, ~90% delta)
2. User sells weekly short calls (7 DTE) against LEAPS
3. Week runs Monday-Friday (day advances via timer)
4. Friday: Splash screen shows weekly P&L breakdown
5. User rolls short call to next week
6. Repeat

## Weekly P&L Calculation (Educational Feature)
```
Stock Impact = stock_change × delta × 100
Time Decay = theta × 7 days
VIX & Other = actual_pnl - (stock_impact + time_decay)
Actual P&L = [calculated from position values]
```

## Important Notes
- Market runs on 7-day weeks (not 5 trading days)
- Position values update daily in ADVANCE_DAY action
- Week start values captured when `newWeek !== state.currentWeek`
- Friday splash triggered when `day % 7 === 4` (Friday)
- Theta calculations use 7 days (not 5)

## Recent Fixes (Current Session)

### 1. Fixed Weekly P&L Calculation - Fundamental Issue
**Problem**: Market went UP but LEAPS showed massive LOSS (-$1,716). Weekly P&L was actually showing P&L since position was first opened, not weekly P&L.

**Root Cause**: Week start values (`leapsWeekStartValue`, `shortCallWeekStartValue`) were only set when positions were opened/rolled, NOT reset at the start of each new week.

**Fix**:
- Capture current position values as week start values when entering a new week (stateManager.ts lines 97-114)
- Use CURRENT values (before day advances) as the baseline for the new week
- Now weekly P&L correctly shows only the P&L for that specific week

### 2. Fixed LEAPS Pricing Model - Delta and VIX Sensitivity
**Problem**: P&L didn't match delta × stock movement calculation. Market up $4.10 should give ~$341 P&L (delta impact - theta), but showed $416. Deep ITM LEAPS were too sensitive to VIX changes.

**Root Causes**:
1. Delta too low for deep ITM LEAPS (14% ITM had 0.89 delta, should be ~0.95)
2. VIX changes caused large extrinsic value swings even for deep ITM options
3. Extrinsic value should be minimal and only affected by theta for deep ITM

**Fixes** (optionsPricing.ts):
- Adjusted delta calculation: 10-15% ITM now has 0.90-0.95 delta (was 0.85-0.95)
- 15-20% ITM now has 0.95-0.98 delta (lines 129-138)
- Added VIX sensitivity reduction for deep ITM options (lines 111-135):
  - 10%+ ITM: Reduce VIX impact by up to 80%
  - 5-10% ITM: Reduce VIX impact by up to 40%
  - ATM/OTM: Full VIX sensitivity (educational value)
- Deep ITM LEAPS now behave more predictably with P&L driven by delta + theta

## Debugging Features

### Console Logging for Weekly P&L
- GameScreen.ts logs weekly summaries to browser console (lines ~265-276)
- Each Friday displays formatted log with market movement, LEAPS P&L, short call P&L, total P&L, account value
- Access: Open browser DevTools (F12) → Console tab
- Filter by typing "WEEK" to see only weekly summaries
- Useful for tracking multi-week performance and debugging P&L calculations

## Current Status: SYSTEM REQUIRES REBUILD

### Multiple Attempts to Fix Pricing - All Failed

This session made multiple attempts to fix the LEAPS and short call P&L calculations:

**Attempt 1: Fix Week Start Values**
- **Issue**: Weekly P&L was showing cumulative P&L instead of weekly
- **Fix**: Capture position values at start of each new week
- **Result**: Partial fix, but fundamental pricing issues remained

**Attempt 2: Improve Delta Calculation**
- **Issue**: Delta was too low for deep ITM LEAPS (0.89 instead of ~0.95)
- **Fix**: Adjusted delta formula based on real market data
- **Result**: Delta improved, but P&L still didn't match

**Attempt 3: Reduce VIX Sensitivity**
- **Issue**: VIX changes caused large P&L swings for deep ITM LEAPS
- **Fix**: Reduced volatility multiplier for ITM options (10%+ ITM)
- **Result**: Reduced VIX impact, but P&L still off by $50-75

**Attempt 4: Delta-Based Updates (Major Rewrite)**
- **Issue**: Recalculating intrinsic+extrinsic daily gave wrong deltas
- **Fix**: Switched to delta-based value updates: `value += (stock_change × delta × 100) + (theta × days)`
- **Files Modified**:
  - `src/types/index.ts` - Added `extrinsic` and `lastStockPrice` to LEAPS
  - `src/lib/game/stateManager.ts` - Rewrote ADVANCE_DAY to use delta updates
  - Added `estimateDeltaFromMoneyness()` function
- **Result**: Cleaner model, but still produces wrong P&L

**Attempt 5: Debugging & Diagnostics**
- Added extensive console logging
- Added diagnostic panel to splash screen
- Discovered splash screen was breaking when LEAPS present
- **Multiple syntax errors and bugs introduced during debugging**

### Problems Identified

1. **Short Call P&L Wrong**
   - Premium collected: $125
   - Expired OTM (should be worth $0)
   - P&L showing: $88 (should be $125)
   - **Cause**: Week start values not capturing opening premium

2. **LEAPS P&L Wrong**
   - Stock up $4.04, delta 0.89
   - Expected: $4.04 × 0.89 × 100 - $3 (theta) = $358
   - Actual: $415
   - **Difference**: $57 unexplained

3. **Calculation Engine Broken**
   - None of the educational calculations match actual P&L
   - "VIX & Other Factors" still showing large discrepancies
   - Week start values not working correctly
   - Delta-based updates not producing correct results

4. **Code Quality Degraded**
   - Multiple debugging statements cluttering code
   - Try-catch blocks added as band-aids
   - Splash screen breaking intermittently
   - Reference errors from rushed fixes

## Plan: Rebuild Pricing Model From Scratch

### Phase 1: Python Reference Model (COMPLETE)
✅ Created `leaps_pricing_model_v2.py` - Delta-based model
✅ Created `analyze_real_options_data.py` - Real SPY data analysis
✅ Verified: P&L matches delta + theta within $0.30

### Phase 2: Define Requirements (TODO)
1. **What "Weekly P&L" Means**
   - Should it show P&L for Monday-Friday only?
   - Or P&L since position opened?
   - **Decision needed from user**

2. **Simplifications for Educational Tool**
   - LEAPS: Zero VIX impact? Fixed extrinsic decay?
   - Short calls: Simple linear decay?
   - Remove all complexity not needed for teaching

3. **Core Calculation Rules**
   - LEAPS value change = (stock × delta × 100) + (theta × days)
   - Short call value = linear decay from premium to intrinsic
   - Week start values = captured at Monday 00:00 (before market opens)

### Phase 3: Clean Slate Implementation (TODO)
1. **Remove all debugging code**
   - Clean up GameScreen.ts
   - Remove diagnostic panels
   - Remove console.log statements

2. **Simplify stateManager.ts**
   - Remove delta-based update attempt
   - Start with simple, working baseline

3. **Create new pricing module**
   - Based on Python model
   - Clear, documented functions
   - Unit testable

4. **Implement step-by-step**
   - LEAPS only first
   - Test thoroughly
   - Add short calls
   - Test thoroughly
   - Add weekly P&L tracking
   - Test thoroughly

### Phase 4: Testing Plan (TODO)
1. Create test scenarios with known expected results
2. Verify each scenario produces correct P&L
3. No more "try and see" - test-driven development

## Files with Current Broken Code
- `src/lib/game/stateManager.ts` - Delta-based updates, cluttered with debug
- `src/components/GameScreen.ts` - Diagnostic panels, console logs everywhere
- `src/lib/pricing/optionsPricing.ts` - Complex model that doesn't work correctly
- `src/types/index.ts` - Added fields that may not be needed

## Python Reference Files (WORKING)
- `leaps_pricing_model_v2.py` - Correct delta-based model
- `analyze_real_options_data.py` - Real SPY market data
- `test_leaps_interactive.py` - Interactive tester
- `verify_pnl_calculations.py` - P&L verification

## Next Session: Start Fresh
1. **User decision**: What should "weekly P&L" show?
2. **Clean slate**: Remove all debugging code
3. **Python first**: Finalize the Python model with user requirements
4. **Port carefully**: One piece at a time, test at each step
5. **No shortcuts**: Proper testing before moving on

## Next Steps / Future Enhancements
- Potential: Add assignment risk warnings
- Potential: Add trade history/journal
- Potential: Multiple market scenarios (bull/bear/sideways)

## Running the Project
```bash
npm run dev  # Starts Vite dev server on localhost:5173
```

## Debugging
- Check background bash task output: `/private/tmp/claude-501/-Users-williamford-Documents-AI-Coding-Turtle-Game/tasks/bbd45ff.output`
- TypeScript compilation: `npx tsc --noEmit`
- Current warnings (non-blocking): unused variables in GameScreen.ts, OptionsChain.ts, ShortCallPanel.ts, optionsPricing.ts
