# Turtle Trading Simulator — Claude Code Build Instructions

## What you are building

A web-based educational trading simulator that teaches the Turtle Strategy (Poor Man's Covered Call using
clLEAPS + weekly short calls). Users progress through four screens: Setup → Buy LEAPS → Sell Call → Results. The simulator runs for 52 weeks and tracks cumulative P&L, LEAPS health, and premium collected.

This is a greenfield build. Do not reference or inherit from any existing HTML simulator file. Start from scratch.

---

## Project structure

```
simulator/
├── CLAUDE.md              ← this file
├── index.html             ← all HTML and CSS, no logic
├── js/
│   ├── engine.js          ← TradingSimulator, LEAPSPosition, ShortCallPosition
│   ├── vix-engine.js      ← VIXSimulator, AdvancedShortCall
│   ├── scenarios.js       ← market scenario generation (weekly price moves)
│   ├── game-state.js      ← UI state machine, screen transitions, event wiring
│   ├── charts.js          ← canvas rendering, EMA overlay, chart drawing
│   └── rules-engine.js   ← regime detection, signal generation
└── css/
    └── styles.css         ← all styling
```

`index.html` loads all JS files via `<script src="js/...">` tags. No inline JS in HTML.

---

## Step 1 — Translate Python engine to JavaScript

### Source files (provided alongside this brief)

| Python file | Translate to | Contains |
|---|---|---|
| `trading_simulator.py` | `js/engine.js` | `LEAPSPosition`, `ShortCallPosition`, `TradingSimulator` |
| `advanced_pricing_with_vix.py` | `js/vix-engine.js` | `VIXSimulator`, `AdvancedShortCall` |
| `leaps_pricing_model_v2.py` | Reference only | Use to verify delta/theta calculations in engine.js match |

### Translation rules

- Translate every class and method exactly — same variable names, same formulas, same constants
- Python `math.sqrt` → `Math.sqrt`, `math.exp` → `Math.exp`, etc.
- Python `Dict` return types → plain JS objects
- Python `Optional` → JS `null`
- Use ES6 classes throughout
- Export each class: `export class TradingSimulator { ... }`
- Do not simplify, optimise, or rewrite any formula — numerical fidelity is the priority

### engine.js

Translate from `trading_simulator.py`:

```javascript
export class LEAPSPosition { ... }      // _calculate_delta, _calculate_extrinsic, _calculate_initial_pricing, advance_day, get_pnl
export class ShortCallPosition { ... }  // _calculate_weekly_call_value, advance_day, get_pnl, close
export class TradingSimulator { ... }   // open_leaps, sell_weekly_call, advance_day, reset_week, get_status, get_total_value, get_total_pnl, get_weekly_pnl
```

### vix-engine.js

Translate from `advanced_pricing_with_vix.py`:

```javascript
export class VIXSimulator { ... }       // update, get_iv_multiplier, get_status, _get_regime
export class AdvancedShortCall { ... }  // _calculate_premium_with_vix, _get_premium_breakdown, update_value, get_pnl
```

When the user selects "Advanced (with VIX)" pricing mode, `AdvancedShortCall` replaces `ShortCallPosition` for the weekly call. `VIXSimulator` drives the RVX chart in all modes.

### Verify before proceeding

Before building any UI, write a console test in a throwaway HTML file:

```javascript
const sim = new TradingSimulator(20000);
sim.open_leaps(190, 360);               // IWM $214, strike $190
sim.sell_weekly_call(214, 7);           // ATM call
sim.advance_day(219);                   // IWM moves up $5
console.log(sim.get_status());
```

Expected output: LEAPS gained ~$420 (delta 0.84 × $5 × 100), short call lost value (went ITM), net weekly P&L positive. If numbers look wrong, fix engine.js before proceeding.

---

## Step 2 — Scenarios

Create `js/scenarios.js`. This generates weekly price moves for each scenario. Translate the scenario logic from the original minimalist HTML game (the `generateWeeklyMove` function and related scenario constants).

Scenarios to support:

| ID | Name | Behaviour |
|---|---|---|
| `mystery` | Mystery scenario | Random mix, hidden from user |
| `bull` | Bull market | +2% weekly drift, low VIX |
| `moderate-bull` | Moderate bull | +1% weekly drift |
| `bear` | Bear market | -2% weekly drift, high VIX |
| `moderate-bear` | Moderate bear | -1% weekly drift |
| `choppy` | Sideways chop | Mean reverting, high VIX |
| `high-vol` | High volatility | ±5% swings, neutral drift |
| `crash` | Flash crash | -5% to -10% drops, VIX spikes to 60-80 |
| `bear-recovery` | V-shape recovery | Crash → fake rallies → real recovery |

```javascript
export function generateWeeklyMove(scenario, currentPrice, currentVix, week) {
    // Returns { newPrice, priceChangePct, newVix, ohlc: { open, high, low, close } }
}
```

OHLC data is needed for candlestick charts. Generate realistic intra-week high/low from the weekly move.

---

## Step 3 — Rules engine

Create `js/rules-engine.js`:

```javascript
export function calculateEMA(data, period) {
    if (data.length === 0) return [];
    const k = 2 / (period + 1);
    let ema = [data[0]];
    for (let i = 1; i < data.length; i++) {
        ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
}

export function getRulesSignal(vixHistory, priceHistory) {
    if (vixHistory.length < 2) return null;

    const vixEMA = calculateEMA(vixHistory, 15);
    const currentRVX = vixHistory[vixHistory.length - 1];
    const currentEMA = vixEMA[vixEMA.length - 1];
    const prevEMA = vixEMA[vixEMA.length - 2] || currentEMA;
    const emaFalling = currentEMA < prevEMA;

    // Find recent peak (last 4 weeks)
    const recentWindow = vixHistory.slice(-4);
    const recentPeak = Math.max(...recentWindow);
    const droppedFromPeak = recentPeak - currentRVX;

    if (droppedFromPeak >= 10 && emaFalling) {
        return { action: 'Go uncovered', reason: 'RVX falling fast from recent peak — let the LEAPS run', colour: 'blue' };
    }
    if (currentRVX > 27 && !emaFalling) {
        return { action: 'Sell ITM call', reason: 'Crisis regime — collect maximum premium', colour: 'red' };
    }
    if (currentRVX >= 22) {
        return { action: 'Sell ATM call', reason: 'Elevated volatility — premium compensates for capped upside', colour: 'amber' };
    }
    return { action: 'Sell OTM call', reason: 'Calm regime — modest income, keep most upside', colour: 'green' };
}
```

---

## Step 4 — Charts

Create `js/charts.js`. Uses HTML5 Canvas.

### Price chart (candlestick + EMA)
- Green candles (close > open), red candles (close < open)
- EMA 15 overlay in `#378ADD`
- Show last 12 weeks of data
- Current week candle renders as the week progresses

### VIX/RVX chart (line + EMA + regime zones)
- RVX line in `#888780`
- EMA 15 overlay in `#378ADD`
- Horizontal dashed line at 22 (green `#97C459`, label "22")
- Horizontal dashed line at 27 (amber `#EF9F27`, label "27")
- Fill zone below 22 with very light green tint
- Fill zone above 27 with very light amber tint

```javascript
export function drawPriceChart(canvas, ohlcData, emaData) { ... }
export function drawVixChart(canvas, vixData, vixEMA) { ... }
```

---

## Step 5 — Game state

Create `js/game-state.js`. This is the UI controller — it manages which screen is shown, wires buttons to engine calls, and updates the DOM.

```javascript
// Global game state
const state = {
    screen: 'setup',           // setup | leaps | sell | results | roll | gameover | annual
    simulator: null,           // TradingSimulator instance
    vixSimulator: null,        // VIXSimulator instance
    scenario: 'mystery',
    ticker: 'IWM',
    startingCapital: 20000,
    pricingMode: 'simple',     // simple | advanced
    week: 0,
    priceHistory: [],
    vixHistory: [],
    ohlcHistory: [],
    rulesEnabled: true,
    selectedStrike: null,
    selectedContracts: 1,
};
```

Screen transitions:
- `setup` → click "Select LEAPS" → `leaps`
- `leaps` → click "Buy this LEAPS" → `sell`
- `sell` → click "Run this week" → `results`
- `results` → click "Next week" → `sell` (increment week)
- `results` → click "Adjust LEAPS" → `roll`
- `roll` → click "Execute Roll" → `results`
- week 52 → `annual`
- account value < 10% of start → `gameover`

---

## Step 6 — HTML and CSS

### Typography

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono&display=swap" rel="stylesheet">
```

- UI text: IBM Plex Sans 400/500
- All numbers, prices, strikes, deltas, P&L values: IBM Plex Mono
- No other weights

### Colour palette

```css
:root {
    --bg-primary: #ffffff;
    --bg-secondary: #f8f8f8;
    --bg-tertiary: #f0f0f0;
    --border: #e0e0e0;
    --border-strong: #cccccc;
    --text-primary: #1a1a1a;
    --text-secondary: #666666;
    --text-tertiary: #999999;
    --accent: #378ADD;
    --accent-light: #E6F1FB;
    --accent-dark: #0C447C;
    --green: #3B6D11;
    --green-light: #EAF3DE;
    --green-border: #97C459;
    --red: #A32D2D;
    --red-light: #FCEBEB;
    --red-border: #F09595;
    --amber: #854F0B;
    --amber-light: #FAEEDA;
    --amber-border: #EF9F27;
    --purple: #3C3489;
    --purple-light: #EEEDFE;
    --purple-border: #AFA9EC;
}
```

### Shared layout (all screens)

```
┌─────────────────────────────────────────────────────┐
│ TOPBAR: "Turtle trading simulator"    context right  │
├───────────┬───────────┬───────────┬─────────────────┤
│  1 Setup  │ 2 LEAPS   │ 3 Sell    │ 4 Results        │  step bar
├───────────┴───────────┴───────────┴─────────────────┤
│                                   │                  │
│   LEFT PANEL (main content)       │  RIGHT PANEL     │
│   flex: 1, padding: 16px          │  width: 280px    │
│                                   │  bg: #f8f8f8     │
└───────────────────────────────────┴──────────────────┘
```

Completed steps show a checkmark. Active step has blue bottom border. Future steps are greyed out.

---

## Screen 1: Setup

### Left panel

**Starting capital**
- Label + info bubble
- Currency input (USD prefix), default $20,000, min $5,000, max $500,000
- Quick preset buttons: $5k / $10k / $20k / $50k / $100k
- Clicking preset fills input and highlights button

**Underlying ticker** (two cards side by side)
- IWM: "iShares Russell 2000 ETF", ~$214/share
- SPY: "S&P 500 ETF", ~$590/share
- Selected card: blue border + `--accent-light` background

**Market scenario** (2×3 card grid)
- Mystery (purple, "Recommended" badge)
- Bull market (green badge)
- Bear market (red badge)
- Sideways chop (amber badge)
- Flash crash (red badge, "Crisis")
- V-shape recovery (amber badge, "Hardest regime")

**Pricing model** (toggle bar)
- "Simple (no VIX)" | "Advanced (with VIX)"

**CTA:** Full-width blue button "Select LEAPS →"

### Right panel
- Session preview card: capital, ticker, scenario, pricing — updates live
- Estimated LEAPS cost card: approximate cost, % of account, cash remaining, horizontal allocation bar
- Small account tip (amber box, shown when capital < $10k)

---

## Screen 2: Buy LEAPS

### Left panel

**Configure your LEAPS** (single card)

1. How deep in-the-money? (slider)
   - Shows current strike and $ below current price
   - Range: $20 ITM to $80 ITM
   - Default: $30 ITM
   - Info bubble on label

2. Time to expiry (three card options)
   - 200 days (~7 months)
   - 360 days (~12 months) — default selected
   - 450 days (~15 months)

3. Number of contracts (slider, 1–5, default 1)
   - Shows "N contract(s) — controls N×100 shares"
   - Info bubble on label

**Health alerts** (below card)
- Delta ≥ 0.80: green banner "Good delta: X.XX"
- Delta 0.72–0.80: amber banner "Acceptable delta: X.XX — aim higher"
- Delta < 0.72: red banner "Low delta — consider a deeper strike"
- DTE ≥ 180: green banner "Good DTE: NNN days"
- DTE < 180: amber banner "DTE getting low — consider rolling soon"

**CTA:** "Buy this LEAPS →" (blue) | "← Back" (grey)

### Right panel
- LEAPS preview (blue-tinted card): strike, expiry, delta, theta/day, theta/week, cost, total cost — IBM Plex Mono for numbers
- Capital allocation card: starting capital, LEAPS cost, cash remaining, horizontal bar (blue = LEAPS %, grey = reserve %), note about 50% reserve rule
- Weekly cost to own: theta/week, typical premium collected, net weekly edge

---

## Screen 3: Sell call

### Left panel

**Two charts stacked**

Price chart (canvas, height 160px):
- Candlestick chart of weekly closes
- EMA 15 overlay in blue
- Show up to last 12 weeks

RVX chart (canvas, height 100px):
- RVX line + EMA 15 overlay
- Dashed horizontal lines at 22 (green) and 27 (amber)
- Light zone fills between lines

**Regime badge + rules toggle** (same row)
- Left: coloured badge showing current regime and RVX value
- Right: "Rules" label + toggle switch (on by default)

**Rules signal** (shown when rules ON)
- Blue card: "Rules engine suggests: [action] — [reason]"

**Strike selection**
- Dropdown: "Number of calls to sell" (1 to number of LEAPS contracts)
- Table: radio / Strike / Type / Premium / Notes
  - ITM ($X below current)
  - ATM (current price)
  - Near OTM ($X above)
  - Far OTM ($XX above)
  - Uncovered (no call — "Full LEAPS participation")
- Selected row: light blue background
- Suggested row (rules ON): 2px blue left border

**CTA:** "Run this week" (blue) | "Reset" (grey)

### Right panel
- Current position card: LEAPS strike, expiry, delta, DTE, theta/day, LEAPS value, cash reserve, total account
- LEAPS health alert (amber banner): shown when delta < 0.75 OR DTE < 180
- Week progress bar: "Week N of 52"
- Running totals: premium collected, LEAPS P&L, avg/week, annualised return, win rate

---

## Screen 4: Results

### Left panel

**Outcome banner** (full width, coloured)
- Green: call expired worthless — "You kept the full premium"
- Blue: went uncovered, LEAPS gained
- Amber: call went ITM, had to roll
- Red: loss week

**P&L summary** (2-card grid)
- "Weekly P&L" — this week's net
- "Total return" — cumulative + %

**P&L breakdown table**
- Columns: Position / Start value / End value / P&L
- Rows: LEAPS (long call) / Short call / Theta decay / Net weekly total
- Net row: stronger background
- Positive = green, negative = red, IBM Plex Mono

**Cumulative P&L chart**
- Line chart, portfolio value week by week
- Horizontal baseline at starting capital

**CTA:** "Next week" (blue) | "Adjust LEAPS" (grey) | "Reset" (grey)

### Right panel
- 4 stat cards (2×2): avg/week, annualised return, total premium, win rate
- Week progress bar
- LEAPS health card (green/amber/red border)
- Capital position: LEAPS value, cash reserve, total account, cash as % of account
- Next week signal: reads current RVX + EMA direction, previews next regime

---

## Screen 5: Roll LEAPS

Triggered from Results → "Adjust LEAPS".

### Left panel
- Current position summary: strike, DTE, delta, current value
- Total available capital (LEAPS value + cash)
- Sliders: ITM amount, number of contracts
- DTE radio buttons: 200d / 360d / 450d
- Roll cost preview: sell credit, buy cost, net debit/credit
- Health alerts for new position
- CTA: "Execute Roll" (blue) | "← Cancel" (grey)

### Right panel
- New position preview card: all metrics for new LEAPS
- Capital impact: before/after cash balance

---

## Screen 6: Game over (margin call)

Triggered when account value < 10% of starting capital.

- Red banner: "Account liquidated"
- Final stats: starting capital, final value, total loss, weeks survived, loss %
- Learning points (clean list):
  - Position sizing matters
  - Watch your delta
  - Keep cash reserve for rolling
  - VIX awareness
- Button: "Start new game" (red)

---

## Screen 7: Annual report

Triggered at week 52.

- Green banner: "Year complete"
- Performance summary table: starting capital, ending value, total premium collected, LEAPS P&L, net P&L, total return %, annualised return %
- Strategy grade (A/B/C/D based on annualised return)
- Week-by-week P&L chart
- Button: "Play again"

---

## Info bubbles

Clicking the (?) icon shows a tooltip card below the label. Closes on second click or click elsewhere.

| Term | Plain English explanation |
|---|---|
| Delta | How much the LEAPS moves per $1 move in IWM. 0.84 means you capture 84 cents of every $1 rally. |
| DTE | Days to expiry. More time = slower theta decay. Roll before DTE drops below 180. |
| Theta | Daily cost of holding the LEAPS. Covered by premium you collect from selling calls. |
| ITM | In the money — strike is below current price. Deeper ITM = higher delta = more expensive. |
| OTM | Out of the money — strike is above current price. Cheaper, more upside room, less premium. |
| Cash reserve | Cash kept back to fund LEAPS rolls during downturns. Keep at least 50% of account as cash. |
| Annualised return | Your weekly average P&L extrapolated to a full year. Based on trades completed so far. |
| RVX | Volatility index for IWM. High RVX = fearful market = sell closer strikes for more premium. |
| EMA | Exponential moving average. Shows trend direction of RVX. Rising EMA = volatility increasing. |

---

## Strike table generation

Generate four strike options dynamically based on current price and VIX:

```javascript
function generateStrikeOptions(currentPrice, currentVix, simulator) {
    const itmStrike = Math.round(currentPrice * 0.98);   // ~2% ITM
    const atmStrike = Math.round(currentPrice);
    const nearOtmStrike = Math.round(currentPrice * 1.01); // ~1% OTM
    const farOtmStrike = Math.round(currentPrice * 1.025); // ~2.5% OTM

    return [
        { strike: itmStrike,    type: 'ITM',      note: 'Maximum premium, capped upside' },
        { strike: atmStrike,    type: 'ATM',      note: 'Balanced premium and participation' },
        { strike: nearOtmStrike, type: 'Near OTM', note: 'Modest premium, some upside room' },
        { strike: farOtmStrike,  type: 'Far OTM',  note: 'Low premium, most upside retained' },
        { strike: null,          type: 'Uncovered', note: 'No income — full LEAPS participation' },
    ];
}
```

Premium for each strike comes from `ShortCallPosition` (or `AdvancedShortCall` in advanced mode).

---

## Key educational framing (use in UI copy)

- The LEAPS is your bet on the market. The short call is income you collect while you wait.
- Being uncovered is not risky — it means fully committing to the bet.
- The real dial is: **Collect income now ←——————→ Keep all the upside**
- You don't predict the weather. You look out the window and react.
- Both choices involve anxiety. Pick which anxiety you can live with.

---

## Acceptance criteria

- [ ] All seven screens render and transition correctly
- [ ] Starting capital is user-adjustable and flows through all calculations
- [ ] LEAPS pricing matches `trading_simulator.py` output (verify with console test)
- [ ] VIX simulation matches `advanced_pricing_with_vix.py` output
- [ ] EMA 15 line appears on both price and RVX charts
- [ ] RVX chart has horizontal reference lines at 22 and 27
- [ ] Rules engine toggle shows/hides signal correctly
- [ ] Info bubbles work on all labelled terms
- [ ] LEAPS health alert appears when delta < 0.75 or DTE < 180
- [ ] All scenario types produce distinct market behaviour
- [ ] Margin call triggers at < 10% of starting capital
- [ ] Annual report triggers at week 52
- [ ] No alert() popups anywhere — use inline UI instead
- [ ] IBM Plex Sans and IBM Plex Mono load and render correctly
- [ ] All numbers displayed via IBM Plex Mono
- [ ] Output is clean modular files as per project structure above

---

## Pricing calibration notes

### LEAPS implied volatility (`BS_IV` in `engine.js`)

`BS_IV` is the Black-Scholes implied volatility used to price LEAPS positions. It was bumped from **0.22 → 0.27** after sense-checking against real market data (May 2026):

- Real benchmark: SPY $730, 680C strike (7% ITM), 383 DTE, VIX 20 → market price **$12,497**, delta 0.799
- Our BS formula at the market's own stated IV (20%) gives **$10,402** — a 17% gap
- Root causes: plain Black-Scholes has no dividend yield (SPY pays ~1.3%/yr) and no vol skew; both systematically understate call prices
- At IV=0.27 our formula gives ~$12,150 for that benchmark, close enough for educational purposes
- IWM LEAPS are in a similar ballpark: IWM's higher real vol (~25-30%) partially compensates for the same missing factors

If VIX-scaling of LEAPS IV is ever added, start from this 0.27 baseline and scale relative to VIX 20.
