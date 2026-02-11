# Turtle Trading Game - Context & Progress

## Session Summary (Feb 11, 2026)

### What We Built: Minimal Viable Game

Created a fully functional, minimal HTML-based trading simulator (`turtle-game/minimal-game.html`) that implements the core Turtle Strategy mechanics with accurate pricing.

---

## Key Accomplishments

### 1. Pricing Engine Validation & Fixes ✅

**Problem Discovered**: Original pricing model underpriced options by ~67%
- Base ATM extrinsic was $150, real market data showed $450
- Moneyness curve didn't handle $1 strike increments properly on high-priced stocks

**Fixes Applied**:
- Updated base extrinsic: $150 → **$450** (matches real SPY market data)
- Refined moneyness curve for $1 strike granularity
- **Result**: 7.8% average error vs real market prices (was 62%)

**Short Call Expiry Bug Fixed**:
- Issue: Options retained extrinsic value at expiration (DTE=0)
- Fix: When DTE=0, option value = intrinsic only (no extrinsic)
- Result: OTM calls correctly expire worthless, ITM calls correctly valued at intrinsic

**Files Updated**:
- `simplified_trading_simulator.py` ✅
- `turtle-game/src/lib/pricing/simplifiedPricing.ts` ✅
- `turtle-game/minimal-game.html` ✅

**Verification**:
- Python and TypeScript models match exactly
- Weekly P&L: $294.58 (both implementations)
- Short call expiry: OTM = full premium, ITM = premium - intrinsic

---

### 2. Minimal Game Implementation

**File**: `turtle-game/minimal-game.html`
- Single HTML file, no dependencies
- Pure JavaScript (no frameworks)
- Black & white styling (monospace, minimal CSS)

**Core Features**:

#### A. Position Management
- **LEAPS**: Automatically opens ~85 delta position ($510 strike at SPY $590)
- **Short Calls**: User selects from 6 options:
  1. 1 ITM ($589) - Max protection, lower premium
  2. ATM ($590) - Balanced risk/reward
  3. 1 OTM ($591) - Good premium, some upside
  4. 2 OTM ($592) - Better upside, less premium
  5. 3 OTM ($593) - Most common choice (default)
  6. **No Call** - Leave LEAPS uncovered (full exposure)

#### B. Multi-Week Rolling
- Week 1: Buy LEAPS, select short call strike, run week
- Week 2+: LEAPS persists, select new strike, run week
- LEAPS updates: value changes, DTE decreases, delta adjusts
- Balance accumulates across weeks
- Can run indefinitely (tested up to 10+ weeks)

#### C. Weekly P&L Tracking
- **Starting Balance**: Balance at Monday open
- **Current Balance**: Balance at Friday close
- **Weekly P&L**: Current - Starting (for this week only, resets each Monday)
- **Cumulative Tracking**:
  - Net portfolio change since start ($20,000 initial)
  - Total weeks traded
  - Average P&L per week

#### D. Black & White Candlestick Chart
- Weekly candlesticks (open, high, low, close)
- **Up weeks**: Hollow (white) candles
- **Down weeks**: Filled (black) candles
- Wicks show intraweek high/low
- Auto-scales to fit all data
- Persists across weeks (builds history)
- Shows before strike selection and after week results

#### E. Full P&L Breakdown
- **Position P&L**:
  - LEAPS: Starting value, ending value, weekly change
  - Short Call: Premium collected, final value, P&L
- **Calculation Details**:
  - Stock change × delta × 100 = Delta impact
  - Theta × 7 days = Time decay
  - Shows if short call expired ITM/OTM
- **Account Status**:
  - Total portfolio value
  - Weekly P&L (this week only)
  - Cumulative performance stats

---

### 3. Pricing Model: Simplified Educational Version

**Design Choice**: User selected "Simplified Educational Model"

**LEAPS Pricing**:
- Fixed theta: $2/day for deep ITM
- Simple delta: 0.85 for ~13% ITM
- Linear extrinsic decay
- Minimal VIX impact (educational focus)

**Weekly Call Pricing**:
```javascript
Extrinsic = BaseExtrinsic × TimeFactor × MoneynessFactor
BaseExtrinsic = $450 (7 DTE ATM)
TimeFactor = dte / 7 (linear)
MoneynessFactor = refined curve for $1 strikes
```

**Moneyness Curve** (refined for $1 increments):
- 0-0.1% away: 1.00x (ATM)
- 0.1-0.2%: 1.00 → 0.96 (linear)
- 0.2-0.35%: 0.96 → 0.84 (linear)
- 0.35-0.5%: 0.84 → 0.66 (linear)
- 0.5%+: decays further

**At SPY $590, premiums are**:
- 1 ITM ($589): $537 (includes $100 intrinsic)
- ATM ($590): $450
- 1 OTM ($591): $438
- 2 OTM ($592): $382
- 3 OTM ($593): $295 ← Most common choice
- No Call: $0

---

### 4. Weekly P&L Logic (Key Decision)

**User Choice**: "P&L for this week only (resets Monday)"

**Implementation**:
- Track `weekStartingBalance` at Monday open
- Calculate `weeklyPnL = currentBalance - weekStartingBalance`
- Resets every Monday (not cumulative across weeks)
- Separate cumulative tracking for overall performance

**LEAPS P&L**:
- Week 1: Shows P&L vs cost basis ($8,240)
- Week 2+: Shows weekly change (Friday value - Monday value)
- Not cumulative - shows this week's movement only

**Example**:
- Week 1: Start $20,000 → End $20,284 → Weekly P&L: +$284
- Week 2: Start $20,284 → End $19,978 → Weekly P&L: -$306 (not -$22!)
- Cumulative: $20,000 → $19,978 → Total P&L: -$22

---

## File Structure

### Python Reference Implementation
```
/Users/williamford/Documents/AI-Coding/Turtle Game/
├── simplified_trading_simulator.py    # Working model with weekly P&L reset
├── leaps_pricing_model_v2.py         # LEAPS-only delta-based model
├── analyze_real_options_data.py      # Real SPY options data analysis
├── test_short_call_expiry.py         # Validates short call expiry logic
└── test_weekly_call_pricing.py       # Validates weekly call pricing
```

### Web Game
```
turtle-game/
├── minimal-game.html                  # Complete standalone game
└── src/lib/pricing/
    ├── simplifiedPricing.ts          # TypeScript pricing engine
    ├── testSimplifiedPricing.ts      # Validates TS matches Python
    └── testShortCallExpiry.ts        # Validates expiry behavior
```

---

## Testing & Validation

### Python Model Tests
✅ **Full scenario**: $294.58 weekly P&L (Week 1)
✅ **Short call expiry OTM**: $79.21 premium → $0 at expiry → $79.21 P&L
✅ **Short call expiry ITM**: $79.21 premium → $200 intrinsic → -$120.79 P&L
✅ **Weekly P&L reset**: Week 1 = +$294, Week 2 = -$22 (separate)

### TypeScript Model Tests
✅ **Matches Python exactly**: $294.58 weekly P&L
✅ **Short call expiry OTM**: $79.21 P&L (matches Python)
✅ **Short call expiry ITM**: -$120.79 P&L (matches Python)
✅ **Pricing accuracy**: 7.8% error vs real market data

### Real Market Comparison
At SPY $695.46, 7 DTE:
| Strike | Real | Our Model | Error |
|--------|------|-----------|-------|
| ATM | $450 | $450 | 0% ✅ |
| 1 OTM | $431 | $450 | +4% ✅ |
| 3 OTM | $316 | $371 | +17% ✅ |

---

## Game Flow

### First Time Play
1. Click **"Setup Positions"**
2. See empty chart
3. LEAPS opens automatically ($510 strike, $8,240 cost)
4. Choose short call strike (or "No Call")
5. Click **"Run Week with Selected Strike"**
6. Chart shows first candle
7. See Friday results with full P&L breakdown

### Rolling to Next Week
1. Click **"Continue to Next Week"**
2. Chart shows previous week(s)
3. LEAPS carries forward (updated value, DTE-7)
4. Choose new strike for this week
5. Run week → New candle added
6. Repeat indefinitely

### Key Insights Shown
- **Covered (with short call)**: Lower volatility, capped upside, steady income
- **Uncovered (no short call)**: Full volatility, unlimited upside, no income
- **Strike selection impact**: ITM = protection, OTM = upside
- **Weekly P&L patterns**: Win/loss streaks, average performance
- **Chart visualization**: Weekly price movement context

---

## Known Limitations

### Simplifications (By Design)
1. **No VIX changes**: VIX fixed at 15 for simplicity
2. **No early assignment**: Short calls always held to Friday
3. **No transaction costs**: Assumes zero commissions/slippage
4. **Weekly OHLC simulation**: Random walk, not real market patterns
5. **No dividends**: SPY dividends not modeled
6. **7-day weeks**: Not 5 trading days (educational simplification)

### Future Enhancements (Not Implemented)
- [ ] VIX-based strike recommendations (1 ITM at VIX 20+)
- [ ] Rolling short calls mid-week
- [ ] Multiple LEAPS positions
- [ ] Different underlyings (QQQ, IWM)
- [ ] Historical scenario playback
- [ ] Trade journal export

---

## Key Design Decisions

### Why Minimal Game First?
- Test core mechanics before building full UI
- Validate pricing engine accuracy
- Get user feedback on game flow
- No framework dependencies = fast iteration

### Why Black & White?
- User preference: "keep it entirely black and white"
- Reduces visual noise, focuses on numbers
- Professional/terminal aesthetic

### Why Weekly P&L Reset?
- Educational: shows this week's performance in isolation
- Clearer than cumulative (which is shown separately)
- Matches real trading: "How did this week go?"

### Why "No Call" Option?
- Educational: compare covered vs uncovered
- Real strategy decision traders face
- Shows impact of capping upside for income

---

## Pricing Model Accuracy

### Validation Against Real Data
Source: `analyze_real_options_data.py` (SPY $695.46, Feb 10, 2026)

**Our Model Performance**:
- Average error: **7.8%** (acceptable for educational use)
- ATM pricing: Exact match ($450)
- Near-money strikes: Within 5%
- Far OTM strikes: Within 20% (overpriced slightly)

**Why Good Enough**:
- Teaches correct concepts (delta, theta, extrinsic decay)
- Shows realistic premium levels
- Demonstrates strategy trade-offs accurately
- Not trying to match Black-Scholes precision

---

## Code Quality Notes

### What's Clean
✅ Single-file game (no build step)
✅ Python and TypeScript models match exactly
✅ Clear variable names and comments
✅ Tested with multiple scenarios

### What's Minimal (By Design)
- No error handling for impossible states
- No input validation (assumes valid usage)
- Inline styles and scripts (simplicity over separation)
- Direct DOM manipulation (no virtual DOM)

### If Building Full Game
Consider:
- Component framework (React/Vue)
- Proper TypeScript setup with types
- State management (Redux/Zustand)
- Chart library (lightweight-charts)
- CSS framework (Tailwind already in turtle-game/)

---

## Next Steps (Not Started)

### Immediate Priorities
1. **User testing**: Get feedback on minimal game
2. **Refine pricing**: Adjust if users find it unrealistic
3. **Bug fixes**: Address any edge cases found in play

### Phase 2: Full Game
1. Port pricing engine to existing codebase
2. Build Tutorial 1 (Shares vs LEAPS comparison)
3. Integrate with existing chart component
4. Add VIX simulation
5. Build remaining tutorials (per turtle-spec.md)

### Phase 3: Challenge Modes
(See turtle-spec.md for full details)

---

## Important Files to Reference

### For Pricing Logic
- `simplified_trading_simulator.py` - Python reference
- `turtle-game/src/lib/pricing/simplifiedPricing.ts` - TypeScript version
- `analyze_real_options_data.py` - Real market data

### For Game Logic
- `turtle-game/minimal-game.html` - Working game (study this!)
- `turtle-spec.md` - Full game specification

### For Context
- `START_FRESH.md` - Previous session issues & decisions
- `IMPLEMENTATION_COMPLETE.md` - TypeScript game status (pre-rebuild)

---

## Session Commands

### Run Tests
```bash
# Python pricing model
python3 simplified_trading_simulator.py

# Python short call expiry test
python3 test_short_call_expiry.py

# Python weekly call pricing validation
python3 test_weekly_call_pricing.py

# TypeScript tests
cd turtle-game
npx tsx src/lib/pricing/testSimplifiedPricing.ts
npx tsx src/lib/pricing/testShortCallExpiry.ts
```

### Open Game
```bash
open "turtle-game/minimal-game.html"
```

---

## Success Metrics Achieved

✅ **Pricing Accuracy**: 7.8% error vs real market
✅ **Python/TypeScript Match**: 0% difference between implementations
✅ **Short Call Expiry**: Works correctly (OTM and ITM cases)
✅ **Weekly P&L**: Correctly resets each week
✅ **Multi-Week Rolling**: Can play indefinitely
✅ **Cumulative Tracking**: Shows overall performance
✅ **Chart Visualization**: Builds history week by week
✅ **Uncovered Option**: Educational comparison available

---

## What We Learned

### Pricing Insights
1. Real SPY weeklies trade at ~$450 ATM (7 DTE), not $150
2. $1 strike increments need fine-grained moneyness curve
3. Extrinsic must be zero at expiration (was causing bugs)
4. Simple linear decay works well for educational purposes

### Game Design Insights
1. Minimal game validates core mechanics faster
2. Weekly P&L reset is clearer than cumulative
3. Candlestick chart provides essential context
4. "No Call" option enables covered vs uncovered comparison

### Technical Insights
1. Canvas API sufficient for simple charting
2. Single HTML file = easy deployment & testing
3. Python → TypeScript porting is straightforward
4. Test against real market data catches major errors

---

## End of Session

**Status**: ✅ Complete minimal viable game with accurate pricing
**Next Session**: User testing, feedback, then build full game UI
**Ready to Clear Context**: Yes - this document captures everything

---

END OF CONTEXT
