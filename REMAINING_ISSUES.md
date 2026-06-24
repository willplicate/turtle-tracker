# Monte Carlo Remaining Issues Analysis

**Date:** March 4, 2026

## ✅ Fixed
1. **Call premium pricing** - Reduced from 650 to 450 base (matches real market)
2. **OTM moneyness decay** - Much steeper curve (matches minimal game)
3. **Strike offset bug** - Now uses percentages instead of dollars

## 📊 Strike Column Added
- CSV now includes "Call Strike" column
- Can see exactly what strike was sold each week
- Easier to analyze assignment patterns

---

## 🔍 Potential Remaining Issues

### 1. **6% Return in Flat Market Seems Low**

Looking at your screenshot (weeks 43-52):
- SPY: $564 → $592 (+4.9%)
- Account: +6.2% return
- **Issue:** Only 1.3% alpha despite collecting premiums every week?

**Possible causes:**
- LEAPS theta decay eating most gains
- Short calls getting assigned even at 1.5% OTM
- Rolling costs are still too high

### 2. **Weeks 14-21 Showed Big Losses**

From screenshot:
- Week 17: SPY $555, VIX 23.1, **Call P&L: -$1,088**
- Week 21: SPY $552, VIX 19.8, **Call P&L: -$1,105**

**Questions to investigate:**
1. What strikes were sold? (now visible in CSV)
2. Were they assigned even though market dropped?
3. Is the VIX-based strike selection working correctly?

**Expected Conservative behavior:**
- VIX 19.8 (week 21) → should sell **1.5% OTM** (default rule)
- VIX 23.1 (week 17) → should sell **ATM** (VIX >20 rule)

If SPY dropped from $575 to $552, ATM/1.5% OTM calls should have expired worthless, not assigned!

---

## 🐛 Hypothesis: Assignment Logic May Be Wrong

Look at this pattern:
- Market drops from $575 to $552
- Conservative should be selling ATM or slightly OTM
- **Result: Big assignment losses**

**This doesn't make sense!** If market drops, OTM calls should expire worthless.

### Possible Bug: Extrinsic Value Calculation

Let me check if short calls are being valued incorrectly at expiration...

Actually, looking at week 17:
- Premium collected: $807
- Final value at expiration: $807 (Call Value column)
- **Call P&L: $0** (should be +$807!)

Then "Call P&L" column shows -$1,088 - this must be from the PREVIOUS week's expired call!

---

## 🎯 Action Items

### 1. Re-run simulation and export CSV
- Check "Call Strike" column
- Verify strikes are now correct (1.5% OTM, not 0.3%)
- Compare strike to SPY price at expiration

### 2. Analyze Assignment Pattern
Look for weeks where:
- Call P&L is negative
- Check if SPY > Strike at expiration
- Verify assignment only happens when ITM

### 3. Check Conservative Rules
Expected behavior:
- VIX < 15: Sell **3% OTM**
- VIX 15-20: Sell **1.5% OTM** (default)
- VIX > 20: Sell **ATM**
- VIX > 25 + rising: Sell **2% ITM**

With fixed strike calculation:
- SPY $570, sell 1.5% OTM → **$578** strike
- SPY $570, sell ATM → **$570** strike
- SPY $570, sell 2% ITM → **$559** strike

### 4. Check Premium Amounts
With new pricing (base=450, steep OTM decay):
- ATM 7 DTE: ~$450-500 per contract
- 1.5% OTM 7 DTE: ~$135-150 per contract
- 3% OTM 7 DTE: ~$130-135 per contract

If you're seeing premiums much higher or lower, there's still a pricing issue.

---

## 📈 Expected Results After Fixes

**Flat/Choppy Market (like your example):**
- Should collect 52 weeks × $400 avg = **~$20,800 in premiums**
- LEAPS theta decay: **-$2,000 to -$3,000**
- Assignments: **10-20% of weeks** (not 60%+)
- Net return: **+12-18%** (much better than 6%)

**Bull Market (+15% SPY):**
- Should capture **most of LEAPS delta gains**
- Some calls assigned (capping upside)
- Net return: **+20-30%**

**Bear Market (-15% SPY):**
- Premium collection offsets some losses
- LEAPS lose value
- Net return: **-5% to -15%** (better than -15% SPY)

---

## 🔬 Debugging Steps

1. **Look at CSV "Call Strike" column**
   - Week 17: SPY $555, VIX 23.1 → should sell ATM ≈ $555
   - Week 21: SPY $552, VIX 19.8 → should sell 1.5% OTM ≈ $560

2. **Check "Action" column matches**
   - Should see "Sell 555C (+0.0%)" for week 17
   - Should see "Sell 560C (+1.5%)" for week 21

3. **Verify expiration logic**
   - If SPY ends week at $552 and strike is $560
   - Call should expire worthless → Call P&L = +$premium

4. **Check for calculation bugs**
   - "Expired Call Premium" = premium collected
   - "Expired Call Final Value" = intrinsic at expiration
   - Call P&L = Premium - Final Value

---

## 🎓 Why 6% Might Be Realistic

Even if everything is working correctly, 6% in a flat market might be right because:

1. **LEAPS Theta Decay**: -$2,000 to -$3,000 over the year
2. **Rolling Costs**: ~$5,000 for 2 rolls
3. **Premium Collection**: ~$400/week × 52 = $20,800
4. **Net**: $20,800 - $7,000 costs = **$13,800 gain on $20k = 69% return**

Wait, that's WAY higher than 6%! So something IS still wrong.

---

## 💡 Most Likely Issue

Given 6% return in flat market, I suspect:
1. **Premiums are still too low** (should be $15-20k annual, not $6k)
2. **Assignments are too frequent** (eating up gains)
3. **Rolling costs are too high** (shouldn't be more than $2-3k/year)

Check the CSV to see weekly premium amounts!

