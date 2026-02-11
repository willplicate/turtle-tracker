# Weekly P&L Debugging

## Problems Identified:

### 1. Short Call P&L ($88 instead of $125)
- Premium collected: $125
- Week start value: $88 (NOT $125!)
- Current value: $0 (expired OTM)
- P&L: $88 - $0 = $88

**Cause:** Position was opened BEFORE this week. By Monday of Week 1, it had decayed to $88.

**Question:** When was the position opened? If it was opened Monday of Week 1, week start should be $125.

### 2. LEAPS P&L ($415 instead of $358)
- Expected: $361 (delta) - $3 (theta) = $358
- Actual: $415
- Difference: $57

**Possible causes:**
1. Week start value is wrong
2. Delta-based updates aren't being used
3. Old intrinsic+extrinsic calculation is still running

### 3. Short Call Value (-$37 when should be $0)
- Option expired OTM
- Should be worth $0
- Showing -$37

**Cause:** Expiration logic not working correctly in stateManager.ts

## What to Check:

1. Open browser console (F12)
2. Look for the debug logs I just added
3. Check:
   - When were positions opened?
   - What are the week start values?
   - What are the current values?
   - Is expiration logic running?
