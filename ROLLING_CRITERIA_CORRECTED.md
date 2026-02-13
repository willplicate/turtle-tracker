# LEAPS Rolling Criteria - Corrected Understanding

## Key Insight from Real Market Data

**DTE has MINIMAL effect on delta!**

From OptionStrat (SPY $620C at $681.74):
- 189 DTE: δ = 0.802
- 336 DTE: δ = 0.785
- **Difference: Only 1.7 delta points over 147 days!**

## Why Roll LEAPS? Two Distinct Reasons

### 1. **Delta < 0.75** (Price Drop Scenario)

**Trigger:** SPY price drops, reducing your ITM amount

**Why it matters:**
- Lower delta = less market exposure
- A $1 move in SPY gives you less P&L
- Example: δ=0.70 means $1 SPY move → only $70 P&L (vs $85 at δ=0.85)

**What to do:**
- Roll to a **deeper ITM strike**
- This restores your delta to ~0.80-0.85
- Maintains your market exposure

**Example:**
```
Started: $530 strike at $590 SPY → δ = 0.91
SPY drops to $555 → δ = 0.74 ⚠️
SPY drops to $550 → δ = 0.70 🚨 ROLL!

Action: Roll to $490 strike (deeper ITM) → δ = 0.88 ✓
```

### 2. **DTE < 180 days** (Theta Acceleration)

**Trigger:** Time passing, DTE approaching expiration

**Why it matters:**
- Theta decay **accelerates** as expiration approaches
- More expensive to hold the position
- Daily decay costs increase significantly

**What to do:**
- Roll to a **longer-dated LEAPS** (300+ DTE)
- This extends your position timeline
- Reduces daily theta decay

**Example:**
```
Started: 365 DTE, theta = -$2.00/day
After 6 months: 185 DTE, theta = -$2.50/day ⚠️
After 8 months: 125 DTE, theta = -$4.00/day 🚨 ROLL!

Action: Roll to 365 DTE LEAPS → theta = -$2.00/day ✓
```

**Why theta accelerates:**
Options decay faster near expiration. Think of it like depreciation - a car loses value faster in its last year than spread over 10 years.

## Rolling Alert Thresholds

### Delta Alerts:
- ✅ **≥ 0.75**: Healthy - good exposure
- ⚠️ **0.70-0.75**: Warning - monitor price action
- 🚨 **< 0.70**: Critical - ROLL to deeper ITM

### DTE Alerts:
- ✅ **≥ 180 days**: Healthy - theta manageable
- ⚠️ **120-180 days**: Warning - plan to roll soon
- 🚨 **< 120 days**: Critical - ROLL to longer DTE

## The Two Are Independent!

You might need to roll for EITHER reason:

**Scenario A: Delta drops, but DTE is fine**
- SPY crashes $40 → delta drops to 0.65
- DTE = 300 days (plenty of time)
- **Action:** Roll to deeper ITM strike (same expiration)

**Scenario B: DTE drops, but delta is fine**
- SPY hasn't moved → delta still 0.85
- DTE = 100 days (time passing)
- **Action:** Roll to longer expiration (same strike depth)

**Scenario C: Both need rolling**
- SPY dropped AND time passed
- Delta = 0.68, DTE = 110 days
- **Action:** Roll to deeper ITM AND longer DTE

## Updated Simulator Features

The HTML simulator now shows:

1. **Delta Alerts** (based on price/moneyness)
2. **DTE Alerts** (based on time remaining)
3. **Educational explanations** for why you roll
4. **Action recommendations** when alerts trigger

## Bottom Line

- **Don't worry about DTE affecting delta** - the effect is tiny
- **DO worry about:**
  1. Price drops → delta drops → roll to deeper ITM
  2. Time passing → DTE drops → roll to longer expiration

These are the two distinct reasons to roll LEAPS, and they're independent of each other!
