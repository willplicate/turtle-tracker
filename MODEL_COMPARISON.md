# Monte Carlo Model Comparison: Black-Scholes vs Empirical Pricing

## Summary

We ran 1000-path Monte Carlo simulations using two different pricing models with **identical market paths** (same random seed, same volatility generation, same rolling strategy).

**Configuration:**
- Starting cash: $35,000
- LEAPS allocation: 40%
- Initial SPY: $590, VIX: 16
- Rolling: 180 DTE threshold, 0.70 delta threshold
- Strategy: PMCC (Poor Man's Covered Call)

---

## Results Comparison

### Black-Scholes Model
| Metric | Value |
|--------|-------|
| **Median Return** | **+6.1%** |
| **Win Rate** | 63.6% |
| **Survival Rate** | 100% |
| **Median Final Value** | $37,145 |
| **5th Percentile** | $27,976 |
| **95th Percentile** | $46,298 |

### Empirical Model (Our TypeScript Simulator)
| Metric | Value |
|--------|-------|
| **Median Return** | ~-4% to +2% (varies by ruleset) |
| **Win Rate** | 40-60% (varies by ruleset) |
| **Survival Rate** | 95-100% |
| **Median Final Value** | $33,600 - $35,700 |

**Observation:** Black-Scholes produces significantly **better outcomes** than our empirical model!

---

## Key Pricing Differences

### 1. Initial LEAPS Purchase (365 DTE, 8% ITM)

**Black-Scholes:**
- Total: $10,140
- Intrinsic: $6,000 (60% of value)
- Extrinsic: $4,140 (40% of value)
- **Lower initial cost** = More cash left over

**Empirical:**
- Total: $13,842
- Intrinsic: $6,000 (43% of value)
- Extrinsic: $7,842 (57% of value)
- **Higher initial cost** = Less cash buffer

**Difference:** Empirical model prices LEAPS **36% higher** at purchase!

### 2. Theta Decay Rate

**Black-Scholes:** $19/week (gradual decay)
**Empirical:** $162/week (aggressive decay)

**Difference:** Empirical model has **8.5× more theta decay**!

### 3. Price Convergence

By 183 DTE, the models converge:
- Black-Scholes: $9,659
- Empirical: $9,638
- Difference: -0.2% (nearly identical)

**This suggests the empirical model "front-loads" extrinsic value, then decays it faster.**

---

## Which Model is More Realistic?

### Arguments for Black-Scholes ✅
1. **Industry standard** - Used by market makers and traders worldwide
2. **Theoretical foundation** - Based on no-arbitrage pricing
3. **Well-calibrated to liquid markets** - Works well for SPY options
4. **Conservative theta** - More realistic time decay for deep ITM options
5. **Better matches observed PMCC performance** - Many traders report 5-10% annual returns

### Arguments for Empirical Model ⚠️
1. **Calibrated to historical data** - Your Python pricer matches real CSV data
2. **LEAPS premium** - Market makers do charge more for LEAPS (liquidity + skew)
3. **Conservative estimates** - Better to underestimate returns than overestimate
4. **Accounts for bid-ask spread** - Real trades don't get theoretical mid-prices

### Likely Reality: Somewhere in Between

**Hypothesis:**
- Black-Scholes represents **mid-market theoretical price**
- Empirical model includes **slippage + bid-ask spread + market maker edge**
- Real trading results likely fall between the two models

---

## Specific Observations

### LEAPS "Floor" Issue

The empirical model has this logic:
```python
if dte >= 300:
    return max(base, 0.70)  # Minimum 70% multiplier
```

This **artificially inflates** LEAPS extrinsic value, which then decays rapidly. This might be:
- ✅ **Realistic** - Capturing liquidity premium on LEAPS
- ❌ **Too aggressive** - Overestimating market maker edge

### Theta Decay Acceleration

The empirical model's $162/week theta is very aggressive. For comparison:
- Deep ITM LEAPS (80 delta) typically lose ~$20-40/week in time value
- Black-Scholes estimate: $19/week ✅ More realistic
- Empirical estimate: $162/week ⚠️ Likely too high

---

## Recommendations

### For Simulation Accuracy:
1. **Use Black-Scholes for base case** - More likely to match real market behavior
2. **Add slippage/spread penalty** - Reduce returns by 1-2% to account for real trading costs
3. **Validate against real data** - Compare to actual PMCC traders' results (typically 5-10% annual)

### For Conservative Planning:
1. **Use empirical model** - Provides worst-case scenario
2. **Assume 0-5% annual returns** - Conservative estimate with safety margin
3. **Test both models** - Truth is probably between them

### Hybrid Approach:
1. **Use Black-Scholes pricing** for option values
2. **Add empirical adjustments:**
   - 2% cost on rolls (slippage)
   - 5% wider bid-ask on LEAPS (liquidity cost)
   - Conservative VIX assumptions (assume higher baseline)

---

## Conclusion

**Black-Scholes appears more realistic** for liquid SPY options. The empirical model likely overestimates costs (too-high initial LEAPS price, too-aggressive theta decay).

**Recommended path forward:**
1. Use Black-Scholes as the **primary pricing engine**
2. Add **real-world adjustments** (slippage, bid-ask, fees)
3. Validate against **actual trader results** (SPY PMCC typically returns 5-10% annually)
4. Keep empirical model as **conservative scenario / stress test**

The fact that Black-Scholes shows +6% median return aligns well with reported real-world PMCC performance, suggesting it's the more accurate model.
