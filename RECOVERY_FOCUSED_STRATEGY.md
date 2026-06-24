# Recovery Focused Strategy

## Problem Identified

The current "Conservative" strategy underperforms because:
1. **Too restrictive on going uncovered** - only triggers when VIX >35 + rising 4 weeks (rare)
2. **Misses post-crash recoveries** - sells calls during bounces, capping upside
3. **Mirrors SPY too closely** - doesn't capture the asymmetry of PMCC strategy

## Core Insight

**PMCCs shine during recoveries, not during crashes.**

During post-crash recoveries:
- VIX is falling (panic subsiding)
- Price is bouncing (1-2 up weeks)
- LEAPS capture the full bounce without call caps
- This is when you make back losses from the drawdown

## New Strategy Rules

### Recovery Detection (Go Uncovered)

**Priority 100**: Recovery Mode
- VIX falling for 2+ weeks
- Recent drawdown >10%
- At least 1 up week
- **Action**: Go uncovered (let LEAPS run)

**Priority 95**: Strong Recovery
- VIX falling for 4+ weeks
- 2+ consecutive up weeks
- **Action**: Go uncovered

**Priority 90**: Snapback
- Drawdown >15% from recent high
- 2+ consecutive up weeks
- **Action**: Go uncovered

### Defensive Covering (Sell Calls)

**Priority 80**: High Rising VIX
- VIX >30 and rising (2 weeks)
- **Action**: Sell 1% ITM calls (defense)

**Priority 70**: High Stable VIX
- VIX >25 and flat (4 weeks)
- **Action**: Sell ATM calls (collect premium)

**Priority 60**: Elevated VIX
- VIX >20
- **Action**: Sell ATM calls

### Normal Market (Sell OTM)

**Priority 50**: Low VIX Uptrend
- VIX <15
- Price above 8-week MA
- **Action**: Sell 2.5% OTM (let it run)

**Priority 1**: Default
- **Action**: Sell 1.5% OTM

## Key Differences from Conservative

| Scenario | Conservative | Recovery Focused |
|----------|--------------|------------------|
| Post-crash bounce (VIX 30→20, 2 up weeks) | Sells ATM call | **Uncovered** |
| VIX falling + 10% drawdown | Sells call | **Uncovered** |
| VIX >35 rising 4 weeks | Uncovered | Uncovered |
| VIX 25, stable | Sells call | Sells ATM |

## Expected Performance

**Advantages:**
- Captures full upside during V-shaped recoveries
- Better performance in choppy/volatile markets
- Exploits VIX mean reversion

**Trade-offs:**
- Higher variance (uncovered = more risk)
- Requires VIX to actually fall during recovery
- May underperform in sideways markets

## Usage

1. Open Monte Carlo simulator
2. Select "Recovery Focused" from Rule Set dropdown
3. Run simulation with your parameters
4. Compare against "Conservative" and "Trend Following"

## Testing Recommendations

Compare across market regimes:
- **2020 COVID crash**: Should capture the sharp recovery
- **2022 slow grind**: May underperform passive strategies
- **2008-2009**: Should excel in the 2009 recovery

## Next Steps

If this performs well:
1. Consider tuning the drawdown threshold (currently 10%)
2. Experiment with VIX falling duration (currently 2 weeks)
3. Add regime classification (bull vs bear market recoveries)
