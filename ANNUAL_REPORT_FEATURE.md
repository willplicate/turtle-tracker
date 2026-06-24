# Annual Progress Bar & Report Feature

## Overview

Added two new features to enhance the educational gameplay experience:
1. **Progress Bar** - Visual tracking of weeks completed
2. **Annual Report** - Comprehensive performance summary at week 52

---

## 1. Progress Bar

### Location
Displays at the top of the "Friday Close" results screen, below the week number.

### Visual Design
- **Background**: Light gray bar
- **Fill**: Green gradient (grows from left to right)
- **Text**: "Week X of 52 (Y%)"
- **Animation**: Smooth 0.3s transition as it fills

### Example
```
Annual Progress
Week 15 of 52 (29%)
[=========>          ]
```

---

## 2. Annual Report

### Trigger
Automatically displays when the user completes week 52 (instead of continuing to week 53).

### Sections

#### 📊 Performance Summary
- Starting Capital: $20,000
- Final Account Value: $XX,XXX
- Total Gain/Loss: $X,XXX
- **Total Return: XX%** (highlighted in green/red)

#### 📈 Trading Statistics
- Total Weeks Traded: 52
- **Winning Weeks**: X (X%)
- **Losing Weeks**: X (X%)
- **Best Week**: $XXX
- **Worst Week**: $XXX
- Average Weekly P&L: $XXX

#### ⚙️ Strategy Metrics
- **Avg LEAPS Allocation**: X% of portfolio
- **Total Premium Collected**: $X,XXX (from selling calls)
- **Premium as % of Account**: X%

#### 📊 vs Buy & Hold
- Stock Price Change: +X%
- Your Return: +X%
- **Outperformance**: +X% (your strategy vs passive holding)

---

## Data Tracking

### Week History Array
Each week's results are stored in `cumulativeState.weekHistory`:
```javascript
{
    week: 15,
    weeklyPnL: 321.49,
    totalValue: 21592.71,
    leapsPct: 40.1,
    premiumCollected: 191.29,
    stockPrice: 252.00
}
```

### Cumulative Tracking
- `totalPremiumCollected`: Running total of all call premiums
- Updates after each week's results are displayed

---

## User Actions

After viewing the Annual Report, users can:

### Continue Trading (Year 2)
- Continues from week 52 → week 53
- All positions and balances carry forward
- Can trade indefinitely (2+ years)
- Progress bar resets visually but tracking continues

### Start New Game
- Complete reset to week 1
- Resets all cumulative stats
- Returns to initial $20,000 capital
- Clears all history

---

## Calculations

### Win Rate
```javascript
winningWeeks = weeks where weeklyPnL > 0
winRate = (winningWeeks / 52) * 100
```

### Best/Worst Week
```javascript
bestWeek = Math.max(...weeklyPnLs)
worstWeek = Math.min(...weeklyPnLs)
```

### Average LEAPS Allocation
```javascript
avgLeapsPct = sum(all weeks' leapsPct) / 52
```

### Outperformance
```javascript
stockChangePct = (finalPrice - startingPrice) / startingPrice * 100
outperformance = yourReturnPct - stockChangePct
```

---

## Educational Value

### Students Learn:
1. **Win Rate Reality**: Even profitable strategies may win <60% of weeks
2. **Consistency**: Average weekly P&L matters more than best weeks
3. **Leverage Impact**: See how LEAPS allocation affects returns
4. **Premium Income**: Quantify value of selling covered calls
5. **Benchmarking**: Compare strategy to passive holding

### Typical Results
- **Moderate strategy**: 50-60% win rate, ~15-25% annual return
- **Aggressive strategy**: 40-50% win rate, +30% or -20% return
- **Conservative strategy**: 60-70% win rate, ~8-15% annual return

---

## Technical Implementation

### Files Modified
- `turtle-game/minimal-game-with-leaps-selector.html`

### New Functions
1. **`updateProgressBar()`** - Updates visual progress (lines ~2551-2556)
2. **`trackWeeklyResults(s)`** - Stores week data (lines ~2558-2571)
3. **`showAnnualReport()`** - Generates and displays report (lines ~2573-2637)

### Modified Functions
1. **Results display** - Calls tracking functions after displaying week results
2. **Continue button** - Checks if week 52, shows report instead of continuing
3. **Reset buttons** - Initialize new `weekHistory` and `totalPremiumCollected` fields

### New HTML Elements
- Progress bar container (lines ~538-546)
- Annual report modal (lines ~631-728)
- Button handlers for annual report actions

---

## Future Enhancements

### Possible Additions:
1. **Multi-year tracking**: Track performance across years 2, 3, etc.
2. **Charts**: Visual charts of weekly P&L over time
3. **Export**: Download annual report as PDF/CSV
4. **Leaderboard**: Compare against other players' results
5. **Sharpe Ratio**: Risk-adjusted return metric
6. **Max Drawdown**: Track largest peak-to-trough decline
7. **Monthly summaries**: Show performance by month

---

## Testing Checklist

✅ Progress bar updates each week
✅ Annual report triggers at week 52
✅ Win/loss counts are accurate
✅ Premium total matches sum of weekly premiums
✅ Stock comparison calculates correctly
✅ "Continue Trading" button advances to week 53
✅ "Start New Game" button resets everything
✅ All percentages and currency formatted correctly
✅ Positive values show green, negative show red

---

## User Experience

### Motivation
- **Visual progress** keeps users engaged
- **Milestone achievement** at week 52 provides sense of accomplishment
- **Comprehensive stats** help users understand their strategy's effectiveness
- **Comparison to benchmark** validates covered call approach

### Gamification
- Completing a full year feels like "winning"
- Users can try different strategies and compare annual results
- Encourages playing multiple times to beat previous scores
- Natural "checkpoint" for reflection and learning
