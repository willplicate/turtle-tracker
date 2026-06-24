# Trend Following Strategy Loss Analysis

**Date:** March 4, 2026
**Result:** -9.9% return while SPY gained +7.9% = **-17.8% underperformance**

---

## 🔴 The Problem

From the screenshot:
- **SPY Performance:** $570 → $615 (+7.9%)
- **Account Performance:** $20,000 → $18,027 (-9.9%)
- **Max Drawdown:** 21.5%

The strategy LOST money in a market that GAINED 8%. This is worse than just holding cash!

---

## 🎯 Trend Following Rules (What It Should Do)

**Above 8-week MA:**
- **Strong uptrend** (above MA + falling VIX): Sell **2% OTM** (let it run)
- **Normal uptrend** (above MA): Sell **1% OTM**

**Below 8-week MA:**
- **Downtrend + rising VIX**: Sell **1% ITM** (defense)
- **Below MA but VIX falling**: Sell **ATM**
- **Default below MA**: Sell **ATM**

**Snapback rule:**
- After >15% drop + 2 up weeks: Go **uncovered**

---

## 🐛 Why It's Failing

### Issue #1: Whipsaw Problem

Looking at the chart, SPY was **choppy** - moving above and below MA frequently. This causes:

1. **Week N:** SPY drops below MA → Sell ATM call
2. **Week N+1:** SPY rallies above MA → Call gets assigned (capped gains)
3. **Week N+2:** SPY above MA → Sell 1% OTM call
4. **Week N+3:** SPY drops → Call expires worthless (small profit)
5. **Repeat** → Net result: Losing money

**The whipsaw pattern eats you alive!**

### Issue #2: Assignment Losses

Looking at visible weeks (11-20):
- Week 12: Call P&L **-$925** (assigned during rally)
- Week 17: Call P&L **-$1,191** (assigned during rally)
- Week 19: Call P&L **+$136** (barely profitable)

**Pattern:** Big assignment losses wipe out small premium gains.

### Issue #3: 8-Week MA is Too Slow

In a choppy market, 8-week MA lags price significantly:
- Market rallies for 2-3 weeks → Still "below MA" → Selling ATM
- By the time MA catches up, market reverses
- Result: Always selling the wrong strike for current conditions

---

## 🔬 What the Data Should Show

**Refresh browser and check the Strike column** to verify:

### Expected strikes for Trend Following:
**Weeks 1-10 (market choppy $570-620):**
- If above MA: Should see strikes like $576 (1% OTM), $582 (2% OTM)
- If below MA: Should see strikes like $570 (ATM), $564 (1% ITM)

**Weeks 11-20 (market consolidating $590-620):**
- Above MA + falling VIX: Should be 2% OTM = ~$610-630 strikes
- Below MA: Should be ATM = ~$595-605 strikes

**Weeks 20-52 (market trending up $590-615):**
- Should be mostly 1-2% OTM = ~$605-625 strikes

### What to look for:
1. **Strikes vs SPY at expiration** - Are calls ITM at expiration?
2. **Premium amounts** - Are they realistic ($130-500 depending on strike)?
3. **Assignment frequency** - Should be <30%, not >50%

---

## 🎯 Root Cause Hypothesis

Based on the -9.9% result, I suspect **one or more** of these issues:

### A. Strikes Still Wrong (Most Likely)
Despite the fix, percentage calculation might still be broken somewhere:
- If selling "1% OTM" but strike is actually 0.5% OTM → constant assignments
- If selling "2% OTM" but strike is actually 1% OTM → assignments in every rally

**CHECK:** Look at Strike column, calculate `(Strike - SPY) / SPY * 100%`
- Should be +1% to +2% for OTM
- Should be 0% for ATM
- Should be -1% for ITM

### B. Premium Too Low (Possible)
Even with correct strikes, if premium is too low:
- Collecting $150/week × 52 = $7,800/year
- LEAPS theta decay: -$2,000/year
- Rolling costs: -$5,000/year
- Net: Only +$800 = +4% return
- If SPY gains 8% and we only gain 4%, LEAPS delta isn't capturing moves

### C. LEAPS Delta Issues (Possible)
If LEAPS delta is calculated wrong:
- SPY gains 8% = $45 gain per contract × 100 × 3 = $13,500 expected
- But if delta is 0.60 instead of 0.85, only capture $9,000
- Missing $4,500 in delta gains

### D. Rolling Too Often (Possible)
Check CSV for roll frequency:
- Should roll LEAPS 1-2 times per year
- If rolling 4-5 times, costs add up to $10k+
- This would explain the loss

---

## 🧪 Debugging Steps

1. **Export CSV** from the Trend Following path
2. **Check Strike column** - verify percentages are correct
3. **Count assignments** - how many weeks show negative Call P&L?
4. **Check premiums** - are they in the $130-500 range?
5. **Check roll costs** - total up all "Roll Cost" values
6. **Calculate total premium** - sum all "Prem" values

**Expected totals for a successful year:**
- Premium collected: $10,000 - $20,000
- Assignment costs: $3,000 - $7,000 (20-30% of weeks)
- Net call P&L: $5,000 - $15,000
- Roll costs: $2,000 - $5,000
- LEAPS delta gains: $8,000 - $12,000 (for +8% SPY)
- **Total gain: $10,000 - $20,000 (+50-100%)**

**Your actual result:** -$2,000 (-9.9%)

**Deficit:** ~$12,000 - $22,000 unaccounted loss!

---

## 💡 Quick Test

Run **Conservative** strategy on the same seed/path:
- Conservative is simpler (fixed rules based on VIX)
- Should perform better in choppy markets
- If Conservative also loses money → fundamental pricing/LEAPS issue
- If Conservative makes money → Trend Following rules are bad

---

## 🚨 Most Likely Culprit

Given that you're seeing **big negative Call P&L values** (-$925, -$1,191), the strikes are probably **still too close to ATM**.

Check week 17:
- SPY: $599.96
- Action: "Sell 600C (+0.0%)" ← This should be 1% or 2% OTM!
- If it says "Sell 600C" when SPY is $599.96, that's ATM, not OTM
- ATM call will get assigned on any 0.1% rally

**Expected:**
- SPY $600, Above MA → Sell 1% OTM = **$606 strike**
- SPY $600, Below MA → Sell ATM = **$600 strike**
- SPY $600, Below MA + rising VIX → Sell 1% ITM = **$594 strike**

If you're seeing strikes within $1-2 of SPY, **the percentage offset is still broken!**

