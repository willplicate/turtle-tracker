# LEAPS Trading Simulator - Project Specification

## Project Overview

A web-based educational game that teaches the "Turtle Strategy" (Poor Man's Covered Call / LEAPS-against-weeklies) through interactive tutorials and realistic market simulations. The goal is to build intuitive understanding of options mechanics through progressive learning ("poco a poco") before exposing users to complex market scenarios.

**Target Audience:** Beginners to intermediate options traders who want to understand LEAPS strategies without risking real capital.

**Core Philosophy:** Learning through direct comparison, controlled failure, and visual feedback rather than abstract theory or cute analogies.

---

## Technical Stack

- **Frontend:** React + TypeScript
- **Charts:** lightweight-charts (TradingView library) for candlesticks
- **Styling:** Tailwind CSS with custom "game feel" dark theme (Matrix-green accents)
- **State Management:** React Context or Zustand
- **Calculations:** Custom JavaScript functions (simplified pricing model, NOT Black-Scholes initially)
- **Storage:** LocalStorage for save games / progress
- **Optional:** Supabase for leaderboards in later phases

---

## Development Phases

### **PHASE 1: Tutorial Mode (Build This First)**

Progressive learning sequence that builds understanding step-by-step.

#### Tutorial 1: Shares vs LEAPS Comparison

**Learning Objective:** Understand delta as "number of shares controlled"

**Screen 1 - Own Shares:**
```
Controls:
- Slider: Number of shares (1-100, default 85)
- Button: [▶ ADVANCE 7 DAYS]

Display:
- SPY starting price: $590
- Shares owned: 85
- Total value: $50,150
- After 7 days: SPY at $595 (+$5)
- New value: $50,575
- Gain: +$425

Text: "Simple: When SPY moves $5, you make $5 × 85 shares = $425"
```

**Screen 2 - Swap for LEAPS:**
```
Button: [SWAP 85 SHARES → 85-DELTA LEAPS]

Display after swap:
- LEAPS cost: $12,900 (vs $50,150 for shares)
- Capital freed: $37,250
- Delta: 85%
- Theta: -$2/day
- DTE: 120 days

[▶ ADVANCE 7 DAYS] button

After 7 days:
- SPY: $595 (+$5)
- LEAPS value: $13,311
- Breakdown shown:
  * Delta gain: +$425 (same as shares!)
  * Theta cost: -$14 (7 days × $2/day)
  * Net gain: +$411

Text: "Notice: Same upside as shares, costs $2/day to hold"
```

**Screen 3 - Time Costs Money:**
```
Interactive comparison:

Two LEAPS side-by-side:
- Option A: 30 DTE, 85 delta, Theta: -$8/day
- Option B: 120 DTE, 85 delta, Theta: -$2/day

Slider: Adjust DTE from 30 to 365 days
- Watch theta cost change dynamically
- Watch upfront cost change
- Show 7-day theta total for each

Text: "Further out in time = cheaper per day, but higher upfront cost"
```

**Screen 4 - The Trade-off:**
```
Side-by-side 30-day simulation:

Column 1: 85 Shares ($50,150 capital)
- Market up $10 → +$850
- Market down $10 → -$850

Column 2: 85-Delta LEAPS ($12,900 capital)
- Market up $10 → +$850 - $60 theta = +$790
- Market down $10 → -$850 - $60 theta = -$910

Additional note:
- Extra $37,250 cash earning 4.5% = ~$125/month

Text: "LEAPS gives you same exposure with 75% less capital.
Theta cost is your 'rental fee' for this leverage."
```

#### Tutorial 2: Introducing Weekly Calls

**Learning Objective:** Understand how selling calls generates income and limits upside

**Screen 1 - The Concept:**
```
Your position:
- LEAPS: 85 delta, $12,900 value, 120 DTE
- Cash: $37,250

New action unlocked: [SELL WEEKLY CALL]

Three strike options shown:
- 588 (2 ITM): Collect $220
- 590 (ATM): Collect $150  
- 592 (2 OTM): Collect $90

Text: "Sell someone the right to buy SPY at this strike on Friday.
You collect premium NOW. If SPY ends above strike, you pay the difference.
Your LEAPS protects you because it moves with SPY."
```

**Screen 2 - Scenario: Sell ATM, Market Stays Flat:**
```
Monday: SPY $590, sell 590 call for $150

[AUTO-ADVANCE day by day]

Tue-Fri: SPY stays $589-591 range
- Call value shown decaying: $150 → $110 → $70 → $20
- Text each day: "Time decay working for you"

Friday close: SPY $590
- Call expires worthless
- You keep: $150
- LEAPS: -$14 theta
- Net week: +$136

Text: "In flat/down markets, you win."
```

**Screen 3 - Scenario: Sell ATM, Market Rallies:**
```
Monday: SPY $590, sell 590 call for $150

[AUTO-ADVANCE]

Tue-Fri: SPY climbs to $597 (+$7 total)

Friday close:
- Call is $7 ITM
- Intrinsic value: $700
- You pay back: $700
- But you collected: $150
- Net from call: -$550

- LEAPS gained: $7 × 0.85 = $595
- LEAPS theta: -$14
- Net LEAPS: +$581

Total week: $581 - $550 = +$31

Text: "You still made money, but gave up $550 of the $595 LEAPS gain.
If uncovered, you'd have made $581.
Trade-off: $150 income insurance for capped upside."
```

**Screen 4 - Strike Selection Comparison:**
```
Same scenario ($7 rally), three different strikes:

2 ITM (588): Collect $220
- Goes $9 ITM, pay $900 - $220 = -$680
- LEAPS: +$581
- Net: -$99 (LOSS on huge rally!)

ATM (590): Collect $150
- Goes $7 ITM, pay $700 - $150 = -$550  
- LEAPS: +$581
- Net: +$31

2 OTM (592): Collect $90
- Goes $5 ITM, pay $500 - $90 = -$410
- LEAPS: +$581
- Net: +$171

Text: "OTM keeps more upside but collects less premium.
ITM protects downside but caps upside aggressively.
ATM is the balance point - maximum extrinsic value."
```

#### Tutorial 3: Time and Moneyness Behavior

**Learning Objective:** Understand the "extrinsic puzzle" - why ATM options retain value

**Screen - The Extrinsic Puzzle:**
```
Monday: SPY $590
Action: Sell 593 call (3 OTM) for $150, 7 DTE

Split display showing:
- Intrinsic value (red line)
- Extrinsic value (green line)  
- Total value (red + green)

[ADVANCE DAY BY DAY with narration]

Tuesday: SPY $591 (2 OTM)
- Intrinsic: $0
- Extrinsic: $120
- Total: $120
Narration: "Lost $30 from time decay"

Wednesday: SPY $593 (ATM)
- Intrinsic: $0
- Extrinsic: $100
- Total: $100  
Narration: "Moved closer but value DROPPED. Time decay beat the move toward ATM."

Thursday: SPY $594 (1 ITM)
- Intrinsic: $100
- Extrinsic: $110
- Total: $210
Narration: "Now ITM but extrinsic is HIGHER because ATM has maximum gamma"

Friday AM: SPY $593 (ATM, 1 DTE)
- Intrinsic: $0
- Extrinsic: $150
- Total: $150
⭐ BIG POPUP: "KEY INSIGHT:
Monday: 3 OTM, 7 DTE = $150 extrinsic
Friday: ATM, 1 DTE = $150 extrinsic

Same total value, different composition.
ATM premium offset the time decay."

Friday close: SPY $595 (2 ITM)
- Intrinsic: $200
- Extrinsic: $0
- Total: $200
```

#### Tutorial 4: Capital Deployment & Risk Management

**Learning Objective:** Understand position sizing and the deployment ladder

**Screen 1 - The Deployment Ladder:**
```
Visual: Horizontal capacity bar with zones

Starting capital: $20,000

Zone 1 (Green): 0-50% deployed = $0-10,000
- Text: "Normal operations - sustainable forever"
- Conditions: VIX < 20, market above EMAs
- Action: Single LEAPS position

Zone 2 (Yellow): 50-70% deployed = $10,000-14,000
- Text: "Elevated deployment - only during stress"
- Conditions: VIX 20-30, 10-15% correction
- Action: Add second LEAPS

Zone 3 (Red): 70-80% deployed = $14,000-16,000  
- Text: "Maximum deployment - crisis only"
- Conditions: VIX 35+, 15%+ correction
- Action: Third LEAPS, max position

Zone 4 (Black): 80%+ deployed = $16,000+
- Text: "⚠️ DANGER ZONE - Never go here"
- Action: GAME OVER if violated
```

**Screen 2 - Test Your Understanding:**
```
Scenario: You have $20,000
Current: 1 LEAPS deployed ($8,000 = 40%)
VIX: 18 (calm market)

Question: "Market looks great. Should you add another LEAPS?"

[YES] - WRONG
Popup: "No! VIX 18 = calm market = 40% max deployment.
Adding second LEAPS = 80% deployed.
One bad week could destroy you."

[NO] - CORRECT  
Popup: "Correct! Wait for VIX 20-30 to deploy more capital.
Discipline > FOMO."
```

**Screen 3 - The Overleveraged Disaster:**
```
Interactive disaster scenario:

Player starts: $20,000
Option to buy: 1, 2, or 3 LEAPS ($8k each)

If they choose 3:
- Warning: "⚠️ 120% deployed - you're overleveraged"
- Button: [PROCEED ANYWAY] or [FOLLOW TURTLE RULES]

If proceed:
- Week 1-2: Market up, making 3x premium (+$450/week)
- Text: "Feeling smart..."
- Week 3: Market drops -8%, VIX spikes 35
- Each LEAPS loses ~$5,400
- Total loss: -$16,200  
- Account: $20,000 → $3,800

GAME OVER: "Margin call. Account liquidated.
Turtle rule: Max 75% even in crisis. You deployed 120% in calm market.
One bad week destroyed you."

[RETRY WITH DISCIPLINE]
```

---

### **PHASE 2: Demonstration Scenarios**

Pre-scripted scenarios that auto-play to show strategy behavior in different markets.

#### Scenario 1: "The Dream - Grinding Down"

**Purpose:** Show best-case scenario for the strategy

```
Setup:
- Player locked into: "Sell ATM call every Monday"
- Market: Slow downward drift
- Duration: 5 weeks
- Controls: [PLAY] [PAUSE] [RESTART]

Auto-execution:
Week 1: SPY $590 → $587
- Sell 590 call for $150
- Expires worthless
- LEAPS theta: -$14
- Net: +$136

[Repeat pattern 4 more times]

Week 5 summary:
- Premium collected: $750
- LEAPS theta paid: -$70
- LEAPS delta loss: -$170 (5 × $3 down × 0.85)
- Net P&L: +$510

Lesson: "When market drifts down slowly, consistent premium wins."
```

#### Scenario 2: "The Pain - Grinding Up"

**Purpose:** Show upside capping in bull markets

```
Setup: Same auto-sell ATM weekly

Market: Steady climb +$4/week for 5 weeks

Week 1: SPY $590 → $594
- Sell 590 call for $150
- Goes $4 ITM, costs $400 to close
- Net from call: -$250
- LEAPS gains: +$340
- Week net: +$90

Week 5 summary:
- Premium collected: $750
- Paid back ITM costs: -$1,250
- Net from calls: -$500
- LEAPS gains: +$1,700
- Total: +$1,200

Uncovered comparison: +$1,700

Lesson: "You still win but gave up $500 for weekly income insurance.
Is 30% upside haircut worth the downside protection?"
```

#### Scenario 3: "Volatility Changes Everything"

**Purpose:** Teach VIX impact on pricing

```
Monday: SPY $590, VIX 15
- Sell 590 call for $150 (normal premium)

Tuesday: Bad news, SPY drops to $588, VIX spikes to 30
- Short call value shown: $60 (2 OTM but vol kept value)
- Narration: "Vol expansion kept value high despite being OTM"

Wednesday: SPY recovers to $591, VIX still 30
- Short call value: $250!
- Narration: "Same 1 OTM as Monday, but worth MORE due to vol
- LEAPS also gained from vol expansion"

Popup: "This is why rolling during panic is expensive.
Both your short call AND your LEAPS got more expensive.
Wait for vol to settle before rolling."
```

---

### **PHASE 3: Challenge Modes**

Interactive scenarios where player makes decisions and faces consequences.

#### Challenge 1: "ATM Collector - Easy Mode"

**Rules:** Must sell ATM every Monday, can't deviate

**Market:** Gentle upward drift with occasional small pullbacks

**Duration:** 8 weeks

**Win condition:** Net positive P&L

**Teaches:** Basic execution, accepting ITM outcomes, weekly P&L patterns

#### Challenge 2: "The Death Spiral"

**Scenario:**
- Starting: LEAPS 580 strike, 83 delta, SPY $595
- Week 1-4: Market bleeds to $582
- LEAPS delta drops: 83 → 79 → 75 → 71
- Intrinsic cushion: $15 → $2

**Week 5 warning:** "⚠️ LEAPS strike $580, SPY $582
Delta 71% - MUST ROLL DOWN NOW"

**Trap:** Player can ignore and sell 584 call (above LEAPS strike!)

**Week 6:** Market rockets +$15 to $597
- Short call 584 now $13 ITM = -$1,300 cost
- LEAPS gained only $15 × 0.71 = $1,065  
- Net: -$235 on a huge rally

**Game Over popup:**
"CATASTROPHIC ERROR: You sold calls above your hedge strike.
Your LEAPS couldn't protect you.

Correct action: Roll LEAPS to 560 strike for $200 cost.
New delta: 83%, adequate hedge restored.

You saved $200 but lost $400. Penny wise, pound foolish."

#### Challenge 3: "The Panic Test"

**Scenario:**
- Weeks 1-3: Normal, +$1,200 total
- Week 4: Monday opens -5%, VIX spikes 30
- LEAPS unrealized loss: -$4,250
- Net position: -$3,050

**Big red button appears:** [CLOSE EVERYTHING NOW]

**If they click:**
- Locks in -$3,050 loss
- Game then shows Weeks 4-8 simulation where market fully recovers
- "You would have been +$1,800 if you held"
- Final: -$1,250 vs +$1,800 if disciplined

**Lesson:** "Panic selling turns paper losses into permanent losses.
Your LEAPS had 98 DTE and 82 delta - adequate hedge.
You failed the psychology test, not the math test."

#### Challenge 4: "The Early Roll Addiction"

**Tracks:** How many times player rolls early (Wednesday/Thursday)

**Example:**
- Monday: Sell 590 call for $150
- Wednesday: SPY $593, call worth $280
- Temptation popup: "Roll now? Cost $130 to close, collect $150 new = $20 net
  OR wait to Friday and possibly keep full $150?"

**If player rolls early 3+ times:**
- End summary: "You rolled 5 times early, left $680 on table"
- Show comparison: Your P&L vs holding to expiry

**Lesson:** "Let theta do the work. Early rolling destroys edge."

#### Challenge 5: "The VIX Whipsaw"

**Scenario:**
- Week 1: VIX 18, collect $150 ATM (normal)
- Week 2: VIX spikes to 32
- Player choice each week:
  * [A] Keep selling ATM for $300+ (tempting!)
  * [B] Sell 2 ITM for $250 (turtle rule)

**If they choose A during high VIX:**
- Weeks 2-4: High premium collection
- Week 5: Violent recovery rally +$12 in 2 days  
- Short calls deep ITM, cost $1,200
- LEAPS gained only $1,020
- Net: -$180 on huge up week

**If they follow rules (2 ITM during VIX 32):**
- Collect slightly less premium
- Protected during rally
- Net: +$400 on same rally

**Lesson:** "High VIX = explosive moves both ways.
ITM selling = insurance when premium is elevated.
Follow VIX rules, not greed."

#### Challenge 6: "Random Gauntlet" (Final Boss)

**12-week completely random scenario:**
- 3 weeks steady up
- 2 weeks violent down (-12% total)
- VIX spike to 45
- 4 weeks whipsaw  
- 3 weeks recovery

**Player must:**
- Deploy capital correctly (40% → 60% → 75% as VIX rises)
- Roll LEAPS when delta drops below 72%
- Adjust strikes based on VIX (ATM/1 ITM/2 ITM rules)
- Avoid panic selling during -12% drop
- Avoid early rolling temptations

**Scoring system:**
- Premium collected: +Points
- Theta paid: -Points
- Rule violations: -Points each
- Final grade: A/B/C/D/F

**Post-game analysis:**
```
Your Performance:

✓ Capital Management: 92/100
- Max deployed: 68% (safe)
- Reserves maintained: Yes

⚠️ Rolling Discipline: 64/100
- Early rolls: 3 (cost $240)
- Missed delta signals: 1 (cost $180)

✗ Strike Selection: 45/100  
- Sold ATM during VIX 38 (should be 2 ITM)
- Cost: $420 opportunity

✓ Psychology: 88/100
- No panic selling
- Held through -15% drawdown

Overall: B- (77/100)
[TRY AGAIN] [LEADERBOARD]
```

---

### **PHASE 4: Free Play Mode**

Full simulator unlocked after completing tutorials and passing 3+ challenges.

#### Features:

**Market Scenario Selection:**
- Bull Market (2019-style steady climb)
- Bear Market (2022-style grind down)
- Volatile/Whipsaw (2020-style chaos)
- Sideways Grind (2015-style range-bound)
- Random (algorithmic generation)

**Playback Speed:**
- Real-time: 1 sec = 1 hour (too slow)
- Normal: 1 sec = 1 day ✓
- Fast: 1 sec = 1 week
- Turbo: 1 sec = 1 month

**Player Actions:**
- Buy/Sell/Roll LEAPS (any strike, any DTE)
- Sell weekly calls (any strike: ITM/ATM/OTM)
- Close positions early
- Go uncovered (no short call)
- Adjust position sizes

**Advanced Features (Future):**
- Multiple simultaneous LEAPS positions
- Different underlyings (SPY, QQQ, IWM)
- Comparison to buy-and-hold
- Export trade log to CSV

---

## Simplified Options Pricing Model

**Instead of Black-Scholes, use empirical pricing:**

```javascript
// Option value = Intrinsic + Extrinsic

Intrinsic = max(0, Stock Price - Strike)

Extrinsic = ATM_Base × Moneyness_Factor × Time_Factor × Vol_Factor

Where:

ATM_Base (baseline for 7 DTE, VIX 15):
- Weekly call: $150
- LEAPS (120 DTE): $800

Moneyness_Factor (distance from ATM):
- ATM (±0.5%): 1.00x
- 1% OTM/ITM: 0.85x
- 2% OTM/ITM: 0.65x
- 3% OTM/ITM: 0.45x
- 4%+ OTM/ITM: 0.25x

Time_Factor (time decay curve):
- 7 DTE: 1.00x
- 5 DTE: 0.90x
- 3 DTE: 0.75x
- 1 DTE: 0.60x  
- 0 DTE: 0.20x

Vol_Factor (VIX multiplier):
- VIX 15: 1.0x (baseline)
- VIX 25: 1.7x
- VIX 35: 2.5x
- VIX 50: 3.5x
```

**Example calculation:**

```
Sell 593 call when SPY is $590
- Strike: 593 (3 points OTM ≈ 0.5%)  
- DTE: 7
- VIX: 15

Extrinsic = $150 × 0.85 × 1.00 × 1.00 = $128
Intrinsic = $0
Total = $128

Three days later, SPY at $593 (ATM), DTE: 4
Extrinsic = $150 × 1.00 × 0.85 × 1.00 = $128
Intrinsic = $0
Total = $128 (same value despite time passing!)
```

---

## P&L Graph Feature

**Phase 1 Implementation (Simpler):**

Show **expiration P&L only** - what happens on Friday close.

```
Visual: Line graph
X-axis: SPY price range (±$20 from current)
Y-axis: Net P&L

Calculation for each price point:
- LEAPS: (Price - Current SPY) × Delta × 100
- Short Call: Premium - max(0, Price - Strike) × 100  
- Net: LEAPS + Short Call - Theta cost

Display:
- Breakeven points marked
- Max profit region (green)
- Max loss region (red)
- Current SPY price (vertical line)
- LEAPS strike (vertical line, different color)
```

**Phase 2 Implementation (Advanced):**

Add **current P&L line** showing value before expiration.

Requires estimating option values at different prices using the simplified pricing model above.

---

## UI/UX Design Principles

### Game Feel Elements:

**Visual Style:**
- Dark theme (#0b0f0f background)
- Matrix-green accents (#00FF41) for positive values
- Red (#ef4444) for negative/warnings  
- Animated transitions (smooth, not jarring)
- Card-based panels with subtle shadows
- Progress bars for time, extrinsic decay, capital deployment

**Interactive Elements:**
- Pulsing/glowing buttons when actionable
- Sound effects (optional):
  * "Cha-ching" for premium collection
  * Warning beep for rule violations
  * Applause for completing challenges
- Popup notifications with icons (⚠️ 🎯 ✓ ✗)
- Achievement badges
- Tutorial progress dots (Step 2 of 5)

**Layout Example:**
```
┌──────────────────────────────────────────┐
│ 🐢 TURTLE SIMULATOR   Week 12   $23,450 │
├──────────────────────────────────────────┤
│                                           │
│      [Candlestick Chart - 60 days]       │
│      VIX: 23 ↑  SPY: $595               │
│                                           │
├─────────────┬────────────────────────────┤
│ LEAPS       │ SHORT CALL                 │
│ 470C Jan'26 │ 595C This Friday          │
│ Δ 85% ✓     │ Premium: $550             │
│ Value: $12.9│ Extrinsic: 40% left       │
│ 🟢 Healthy  │ DTE: 3 days               │
├─────────────┴────────────────────────────┤
│ [▶ NEXT DAY] [SELL CALL] [ROLL LEAPS]   │
├──────────────────────────────────────────┤
│ Capital Deployed: ████░░░░ 45% (SAFE)   │
│ Net Δ: +55  Net θ: +$22/day             │
└──────────────────────────────────────────┘
```

---

## Key Learning Outcomes

By completing all tutorials and challenges, players will understand:

1. **Delta:** Both as "shares controlled" and "probability of expiring ITM"
2. **Theta:** Time decay as daily cost, accelerating near expiration
3. **Extrinsic behavior:** Why ATM options retain value despite time passing
4. **Strike selection:** Trade-offs between ITM/ATM/OTM in different VIX regimes
5. **Capital management:** The deployment ladder and position sizing discipline
6. **Rolling mechanics:** When/why to roll LEAPS (delta, DTE, cushion triggers)
7. **Psychology:** Resisting panic during drawdowns and greed during rallies
8. **VIX adaptation:** How volatility changes both premiums and strategy selection

---

## Success Metrics

**Tutorial completion rates:**
- % who finish Tutorial 1 (shares vs LEAPS)
- % who complete all 4 tutorials
- Average time to complete tutorials

**Challenge performance:**
- Average score on Random Gauntlet
- % who pass Death Spiral challenge
- % who fail Panic Test

**Engagement:**
- Average session length
- Number of scenarios attempted
- Return user rate

---

## Future Enhancements (Post-MVP)

- Multi-position management (2-3 LEAPS simultaneously)
- Different underlyings (QQQ, IWM with different pricing)
- Real historical market data scenarios (2020 crash, 2022 bear, etc.)
- Multiplayer leaderboards
- Integration with actual Turtle Dashboard for real trading
- Export trade logs for tax/analysis
- Mobile-optimized version
- Difficulty progression system with unlocks

---

## File Structure

```
/src
  /components
    /Tutorial
      SharesVsLeaps.tsx
      TimeAndTheta.tsx
      WeeklyCalls.tsx
      CapitalManagement.tsx
    /Scenarios  
      DemoScenarios.tsx
      ChallengeMode.tsx
    /FreePlay
      Simulator.tsx
      ChartDisplay.tsx
      PositionManager.tsx
    /Common
      PLGraph.tsx
      PositionCard.tsx
      ProgressBar.tsx
  /lib
    /pricing
      optionsPricing.ts
      marketData.ts
    /game
      scenarios.ts
      scoring.ts
  /styles
    globals.css
    gameTheme.css
  /types
    options.ts
    game.ts
```

---

## Development Checklist

### Phase 1: Tutorial Mode ✓ BUILD THIS FIRST
- [ ] Tutorial 1: Shares vs LEAPS (4 screens)
- [ ] Tutorial 2: Weekly Calls Introduction (4 screens)  
- [ ] Tutorial 3: Extrinsic Puzzle (1 interactive screen)
- [ ] Tutorial 4: Capital Deployment (3 screens)
- [ ] Progress tracking system
- [ ] Tutorial navigation (next/back/restart)

### Phase 2: Demonstration Scenarios
- [ ] Auto-play scenario engine
- [ ] Scenario 1: Grinding Down
- [ ] Scenario 2: Grinding Up
- [ ] Scenario 3: Volatility Impact
- [ ] Play/Pause/Restart controls

### Phase 3: Challenge Modes
- [ ] Challenge framework (win conditions, scoring)
- [ ] Challenge 1: ATM Collector
- [ ] Challenge 2: Death Spiral
- [ ] Challenge 3: Panic Test
- [ ] Challenge 4: Early Roll Addiction
- [ ] Challenge 5: VIX Whipsaw  
- [ ] Challenge 6: Random Gauntlet
- [ ] Performance analysis screen

### Phase 4: Free Play
- [ ] Scenario selection screen
- [ ] Full position management
- [ ] Playback speed controls
- [ ] P&L graph (expiration only)
- [ ] Trade log export

### Phase 5: Polish
- [ ] Sound effects
- [ ] Achievement system
- [ ] Leaderboards (if Supabase)
- [ ] Mobile responsiveness
- [ ] Advanced P&L graph (current value)

---

## Notes for Claude Code

**Start with Tutorial 1 only** - get the core mechanics working:
- Slider for share count
- Button to advance time
- Simple delta/theta calculations
- Clean visual display of P&L breakdown

Once Tutorial 1 works, build Tutorial 2-4 using same patterns.

**Don't build everything at once** - iterative development, testing each piece.

**Prioritize clarity over complexity** - simple pricing model is better than accurate Black-Scholes if it teaches concepts better.

**Visual feedback is critical** - players learn by SEEING the numbers change, not reading text.

---

END OF SPECIFICATION