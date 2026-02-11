# Weekly P&L Calculation Fix

## The Problem

When the market went UP by +$4.43 (+0.75%), your LEAPS position showed a LOSS of -$1,716 for the week. This was clearly wrong - a deep ITM LEAPS with 86% delta should gain value when the market rises.

## Root Cause Analysis

### What Was Happening
The "weekly P&L" wasn't actually showing weekly P&L - it was showing **total P&L since the position was first opened**.

From your screenshot:
- LEAPS Current Value: $6,263
- Weekly P&L: -$1,716
- **Implied "Week Start Value": $7,979**

The week start value of $7,979 was **way too high**. Running the pricing model shows that a $535 strike LEAPS when SPY is at $591-596 should be worth around $5,800-$6,300, not $7,979.

### The Bug

In `stateManager.ts`, the week start values were only set in two places:
1. When buying a position (line 224)
2. When rolling a position (line 308)

They were **NEVER reset at the start of each new week**.

So if you bought your LEAPS in Week 1 for $7,979, the system kept using $7,979 as the "week start value" even in Week 5. The "weekly P&L" was actually showing:
```
Weekly P&L = Current Value - Value When Position Was First Opened
Weekly P&L = $6,263 - $7,979 = -$1,716
```

Instead of the correct calculation:
```
Weekly P&L = Friday Value - Monday Value (start of this week)
Weekly P&L = $6,263 - $5,822 = +$441  (approximately)
```

## The Fix

Modified `stateManager.ts` ADVANCE_DAY logic (lines 94-127):

### Before:
- Week start values were only set when opening/rolling positions
- Comment said "Don't overwrite them at week boundaries"
- This was fundamentally wrong

### After:
- Detect when a new week begins: `isNewWeek = newWeek !== state.currentWeek`
- **Capture current position values as week start values at the start of each new week**
- Use the position values from the END of Friday (before advancing to Monday)
- Now weekly P&L correctly shows only the P&L for that specific week

### Code Changes
```typescript
// BEFORE: Week start values never updated at week boundaries
const newWeeklyPnL = newWeek !== state.currentWeek ? 0 : state.weeklyPnL + dailyPnLChange;
// ... week start values not updated

// AFTER: Capture values when entering new week
if (isNewWeek) {
  if (state.leaps) {
    newLeapsWeekStartValue = state.leaps.currentValue;
  }
  if (state.shortCall) {
    newShortCallWeekStartValue = state.shortCall.currentValue;
  }
}
```

## Testing the Fix

You can now test the fix at http://localhost:5173/

The Friday splash screen should now show:
- **Correct weekly P&L** that reflects only Monday-Friday of that week
- Market up = LEAPS value up (with high delta)
- Market down = LEAPS value down (with high delta)
- Small adjustments from theta decay and VIX changes

## What You Should See Now

For a week where SPY goes from $591.77 → $596.19 (+$4.42, +0.75%):
- LEAPS with 86% delta should gain approximately: $4.42 × 0.86 × 100 = **+$380**
- Minus theta decay over 7 days: ~-$20
- Plus/minus small VIX adjustments: ±$50-100
- **Expected weekly P&L: +$350 to +$460**

NOT -$1,716!

## Updated Documentation

- `CONTEXT.md` has been updated with this fix
- `stateManager.ts` now has correct logic and comments
- This fix ensures weekly P&L is truly weekly, not cumulative since position opening
