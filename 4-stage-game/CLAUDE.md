# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

```
4-stage-game/           ← working directory (you are here)
  minimal-game-with-leaps-selector.html   ← standalone game (all logic, no build step)
  simulator_setup_screen.html             ← reference design for screen 1
  claude_code_brief.md                    ← full visual reskin spec (read this)
turtle-game/            ← TypeScript/Vite production codebase
```

## The standalone HTML game (`minimal-game-with-leaps-selector.html`)

This is the primary file to work with in this directory. It is a self-contained ~3,000-line HTML/JS/CSS file — no build step, open directly in a browser.

**The reskin brief is `claude_code_brief.md`. Read it before making any changes.**

Key rules from the brief:

- **Never modify JS logic** — extract every `<script>` block and paste it unchanged into the new file
- The only JS changes allowed: updating `getElementById` refs if IDs change, and adding new event listeners for new UI elements (preset capital buttons, info bubble toggles, rules engine toggle)
- Output must remain a single self-contained HTML file
- Replace all `alert()` calls with inline confirmation cards (auto-dismiss after 3s)

**What NOT to change:** `calculateOptionPrice()`, `createLEAPS()`, `generateWeeklyMove()`, all VIX/RVX simulation, all P&L attribution, all `cumulativeState` structure and updates, margin call detection, annual report logic, roll LEAPS logic.

## Design system (from brief)

Fonts (load from Google Fonts):
- IBM Plex Sans 400/500 — body/UI text
- IBM Plex Mono — all numbers, prices, P&L values, deltas, strikes

Colour tokens:
```css
--bg-primary: #ffffff; --bg-secondary: #f8f8f8; --bg-tertiary: #f0f0f0;
--border: #e0e0e0; --border-strong: #cccccc;
--text-primary: #1a1a1a; --text-secondary: #666666; --text-tertiary: #999999;
--accent-blue: #378ADD; --accent-blue-light: #E6F1FB; --accent-blue-dark: #0C447C;
--green: #3B6D11; --green-light: #EAF3DE; --green-border: #97C459;
--red: #A32D2D; --red-light: #FCEBEB; --red-border: #F09595;
--amber: #854F0B; --amber-light: #FAEEDA; --amber-border: #EF9F27;
```

Layout: topbar → 4-step bar → two-column body (left panel flex:1, right panel 280px fixed).

## The TypeScript app (`../turtle-game/`)

The TS app is a Vite/TypeScript rebuild of the same simulator with a Monte Carlo engine added.

```bash
cd ../turtle-game
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # tsc + vite build
npm run preview  # serve dist/
```

Entry points: `src/main.ts` (main game), `src/montecarlo-main.ts`, `src/tutorial-main.ts`.

**Core state:** `src/lib/game/stateManager.ts` — `GameState` owns `leaps`, `shortCall`, `cash`, `market`, `priceHistory[]`, `pnlHistory[]`.

**Pricing:** `src/lib/pricing/optionsPricing.ts` — empirical model (not Black-Scholes), calibrated to SPY ATM 7 DTE ≈ $450 at VIX 15. Delta is a moneyness lookup table, not N(d1). Do not replace this model.

**Market simulation:** `src/lib/market/priceGenerator.ts` — weekly candles with VIX-correlated moves. Scenarios: `normal`, `bullish`, `bearish`, `choppy`, `crash`, `recovery`.

**Monte Carlo:** `src/lib/montecarlo/` — runs up to 4 rule sets × 2 strategies (naked LEAPS vs PMCC) in a Web Worker (`src/lib/workers/montecarloWorker.ts`). Rule engine in `ruleEngine.ts` evaluates VIX level/trend and price conditions each week to decide the sell-call action.

## Core game mechanic constraints

- LEAPS 50% cash reserve rule: always keep ≥50% of account as cash
- Roll LEAPS when delta < 0.75 or DTE < 180
- `cumulativeState` in the HTML file = `GameState` in the TS app — same structure, must be preserved

---

# Claude Code Brief: Turtle Trading Simulator — Visual Reskin

## Overview

You are reskinning an existing working HTML/JS trading simulator. The source file is `minimal-game-with-leaps-selector.html` (~3,120 lines). **All JavaScript logic must be preserved verbatim.** This is purely a visual and layout overhaul — do not touch any calculations, game state, pricing models, VIX logic, P&L attribution, or event handlers.

The output is a single self-contained HTML file.

---

## Non-negotiable rule

**Extract every `<script>` block from the original file and paste it into the new file unchanged.** Do not rewrite, simplify, or refactor any JavaScript. The only changes permitted to JS are:

- Updating `document.getElementById()` references if an element's ID changes (keep IDs the same wherever possible)
- Adding new event listeners for new UI elements (preset capital buttons, info bubble toggles, rules engine toggle)

---

## Typography

Load from Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono&display=swap" rel="stylesheet">
```

- **Body / UI text:** IBM Plex Sans, weights 400 and 500 only
- **All numbers, prices, P&L values, deltas, strikes:** IBM Plex Mono
- No other font weights. No bold beyond 500.

---

## Colour palette

White/grey IBKR-style. No dark theme for now.

```css
--bg-primary: #ffffff;
--bg-secondary: #f8f8f8;
--bg-tertiary: #f0f0f0;
--border: #e0e0e0;
--border-strong: #cccccc;
--text-primary: #1a1a1a;
--text-secondary: #666666;
--text-tertiary: #999999;
--accent-blue: #378ADD;
--accent-blue-light: #E6F1FB;
--accent-blue-dark: #0C447C;
--green: #3B6D11;
--green-light: #EAF3DE;
--green-border: #97C459;
--red: #A32D2D;
--red-light: #FCEBEB;
--red-border: #F09595;
--amber: #854F0B;
--amber-light: #FAEEDA;
--amber-border: #EF9F27;
```

---

## Layout structure

Every screen shares the same chrome:

```
┌─────────────────────────────────────────────────┐
│ TOPBAR: title left, context right               │
├──────────┬──────────┬──────────┬────────────────┤
│ Step 1   │ Step 2   │ Step 3   │ Step 4         │  ← step bar
├──────────┴──────────┴──────────┴────────────────┤
│                              │                  │
│   LEFT PANEL (main content)  │  RIGHT PANEL     │
│   flex: 1                    │  width: 280px    │
│                              │                  │
└──────────────────────────────┴──────────────────┘
```

- Left panel: main interactive content for current step
- Right panel: persistent summary — always shows current account value, LEAPS health, running totals
- Step bar: highlights active step, shows checkmark for completed steps
- No scrolling panels — full page scrolls naturally

---

## Screen 1: Setup

**Left panel contains:**

### Starting capital
- Label: "How much are you starting with?"
- Sub-label: "The simulator will show how much LEAPS cost relative to your account."
- Input: currency field (prefix "USD"), number input, default $20,000
- Quick presets below input: $5k / $10k / $20k / $50k / $100k — clicking a preset fills the input and highlights that button

**Note:** The original hardcodes $20,000. Wire the capital input so `cumulativeState.startingCapital` and `cumulativeState.cashBalance` are set from this input when "Select LEAPS →" is clicked. If the original uses a hardcoded constant, make it a variable read from the input.

### Underlying ticker
- Two card options side by side: IWM and SPY
- Each card shows: ticker name (large), full name, approximate price
- Selected card gets blue border + light blue background
- Maps to existing `#ticker-select` logic

### Market scenario
- Six cards in a 2×3 grid:
  - Mystery scenario (purple border, "Recommended" badge)
  - Bull market (green badge)
  - Bear market (red badge)
  - Sideways chop (amber badge)
  - Flash crash (red badge)  
  - V-shape recovery (amber badge, label: "Hardest regime")
- Selected card gets blue border
- Maps to existing `#market-scenario` select options

### Pricing model
- Toggle bar: "Simple (no VIX)" | "Advanced (with VIX)"
- Maps to existing `#mode-select`

### CTA
- Full-width blue button: "Select LEAPS →"
- Maps to existing `#setup-btn`

**Right panel contains:**
- Session preview card: capital, ticker, scenario, pricing model — updates live as user changes selections
- Estimated LEAPS cost card: shows approximate cost of 1 contract, % of account, cash remaining, horizontal bar (blue = LEAPS, grey = reserve)
- Small account tip (amber box): shown when capital < $10,000

---

## Screen 2: Buy LEAPS

Maps to existing `#leaps-selector` screen.

**Left panel contains:**

### Configure your LEAPS

Card with three controls:

**1. How deep in-the-money?**
- Slider mapping to existing `#itm-slider`
- Shows current strike and $ below current price
- Label: left = "Deeper ITM (safer, costlier)", right = "Shallower (cheaper, riskier)"
- Info bubble (?) on label

**2. Time to expiry (DTE)**
- Three card options: 200d / 360d / 450d (default selected)
- Maps to existing `input[name="dte"]` radio buttons

**3. Number of contracts**
- Slider mapping to existing `#contracts-slider`
- Shows "N contract(s) — controls N×100 shares"
- Info bubble (?) on label

### Health alerts
- Below the card, show two status banners (green or amber) for delta and DTE
- Green: delta ≥ 0.80, DTE ≥ 180
- Amber: delta 0.72–0.80 or DTE 150–180
- Red: delta < 0.72 or DTE < 150
- Maps to existing delta/DTE alert logic

### CTA row
- "Buy this LEAPS →" (blue, maps to `#leaps-confirm-btn` or equivalent)
- "← Back" (grey)

**Right panel contains:**
- LEAPS preview card (blue background): strike, expiry, delta, theta/day, theta/week, cost per contract, total cost — all in IBM Plex Mono
- Capital allocation card: starting capital, LEAPS cost, cash remaining, horizontal bar showing % split, note about 50% reserve rule
- Weekly cost to own card: theta/week, typical premium collected, net weekly edge

---

## Screen 3: Sell call (main game screen)

Maps to existing `#positions-state` and `#call-selector` screens combined.

**Left panel contains:**

### Two charts stacked

**Chart 1 — IWM/SPY price (candlestick)**
- Use existing `#results-chart` canvas
- Height: 160px
- Add EMA 15 line overlay in blue (#378ADD)
- EMA is calculated from the array of weekly closing prices accumulated during gameplay
- Formula: standard exponential moving average, period 15, applied to weekly close prices
- Show EMA line only — no labels cluttering the chart

**Chart 2 — RVX/VIX (line chart)**
- Use existing `#results-vix-chart` canvas (make always visible, not hidden)
- Height: 100px
- Add EMA 15 line overlay in blue (#378ADD)  
- Draw two horizontal dashed reference lines:
  - Green dashed line at y=22 (labelled "22")
  - Amber dashed line at y=27 (labelled "27")
- These are the regime boundaries

### Regime badge + rules toggle
- Below the charts: amber/green/red badge showing current regime (e.g. "Elevated volatility — RVX 24.35, EMA falling")
- Right side of same row: "Rules" label + on/off toggle switch
- When rules ON: show a blue signal box below the badge: "Rules engine suggests: [Sell ATM call / Sell OTM call / Go uncovered / Sell ITM call]"
- Rules logic (new JS to add):
  ```
  if RVX falling fast (dropped 10+ pts from recent peak AND EMA declining): suggest "Go uncovered"
  else if RVX > 27 AND EMA rising: suggest "Sell ITM call"
  else if RVX 22–27: suggest "Sell ATM call"  
  else if RVX < 22 AND EMA flat/falling: suggest "Sell OTM call"
  ```
  "Recent peak" = highest RVX value in last 4 weeks of history

### Strike selection table
- Maps to existing strike radio button logic
- Columns: [radio] / Strike / Type / Premium / Notes
- Selected row: light blue background
- Suggested row (when rules ON): blue left border (2px)
- Row order: ITM → ATM → Near OTM → Far OTM → Uncovered
- "Uncovered" row note: "Full LEAPS participation — no income this week"
- Above table, show: "Number of calls to sell" dropdown (maps to existing contracts selector)

### CTA
- "Run this week" button (blue, maps to existing week-run logic)
- "Reset" button (grey)

**Right panel contains:**
- Current position card: LEAPS strike, expiry, delta, DTE, theta/day, LEAPS current value, cash reserve, total account — numbers in IBM Plex Mono
- LEAPS health indicator: green/amber/red border depending on delta and DTE thresholds
- Alert banner (amber, prominent): shown when delta < 0.75 OR DTE < 180 — "Your LEAPS needs attention — consider rolling"
- Week progress bar: "Week N of 52"
- Running totals: premium collected, LEAPS P&L, avg/week, annualised return, win rate

---

## Screen 4: Results

Maps to existing `#friday-results` screen.

**Left panel contains:**

### Outcome banner
- Full-width coloured banner at top:
  - Green: short call expired worthless
  - Amber: short call went ITM, had to roll
  - Blue: went uncovered, LEAPS gained
  - Red: loss week
- Banner shows: outcome title + one-sentence explanation

### P&L summary cards (2×1 grid)
- "Weekly P&L": this week's net result
- "Total return": cumulative since start + %

### P&L breakdown table
- Columns: Position / Start value / End value / P&L
- Rows: LEAPS (long call) / Short call / Theta decay / **Net weekly total**
- Net row has stronger background
- All values in IBM Plex Mono, positive = green, negative = red

### Cumulative P&L chart
- Line chart showing portfolio value week by week
- Uses existing canvas
- Add a horizontal baseline at starting capital value

### CTA row
- "Next week" (blue, maps to `#continue-btn`)
- "Adjust LEAPS" (grey, maps to `#adjust-leaps-btn`)
- "Reset" (grey, maps to `#reset-btn`)

**Right panel contains:**
- 4 stat cards in 2×2 grid: avg/week, annualised return, total premium, win rate
- Week progress bar
- LEAPS health card (green/amber/red): delta, DTE remaining, current value, vs cost basis
- Capital position card: LEAPS value, cash reserve, total account, cash as % of account
- "Next week signal" box: reads current RVX and EMA direction, shows what regime is coming

---

## Additional screens (preserve existing, reskin only)

### Roll LEAPS screen (`#roll-selector`)
- Same layout pattern: left = controls, right = preview
- Preserve all existing slider and radio logic
- Show roll cost breakdown in a clean card

### Adjust LEAPS dialog (`#adjust-leaps-dialog`)
- Same layout as Buy LEAPS screen
- Preserve all existing logic

### Margin call screen (`#margin-call-screen`)
- Red accent banner
- Final stats table
- Learning points as a clean list
- "Start New Game" button

### Annual report screen (`#annual-report-screen`)
- Green accent banner
- Performance summary table
- Strategy grade
- "Play Again" button

---

## Info bubbles

Add tooltip behaviour for these terms. On click/tap, show a small card below the label with the plain English explanation. Close on second click or clicking elsewhere.

| Term | Explanation |
|------|-------------|
| Delta | How much the LEAPS moves per $1 move in IWM. 0.84 means you capture 84% of the upside. |
| DTE | Days to expiry. The more time remaining, the slower your theta decay. Roll before it drops below 180. |
| Theta | The daily cost of holding the LEAPS. Covered by premium you collect from selling calls. |
| ITM | In the money — the strike is below the current price. Deeper ITM = higher delta = more expensive. |
| OTM | Out of the money — the strike is above the current price. Cheaper premium, more upside room. |
| Cash reserve | The cash you keep back to fund LEAPS rolls during downturns. Rule: keep at least 50% of account as cash. |
| Annualised return | Your weekly average P&L extrapolated to a full year. Based on trades so far. |
| RVX | The volatility index for IWM. High RVX = fearful market = sell closer strikes. Low RVX = calm = sell further OTM. |
| EMA | Exponential moving average. Shows the trend direction of RVX. Rising EMA = volatility increasing. |

---

## EMA calculation (new logic to add)

Add this function to the JS (does not replace any existing logic):

```javascript
function calculateEMA(data, period) {
    if (data.length === 0) return [];
    const k = 2 / (period + 1);
    let ema = [data[0]];
    for (let i = 1; i < data.length; i++) {
        ema.push(data[i] * k + ema[i-1] * (1 - k));
    }
    return ema;
}
```

Apply to:
- `priceHistory` array → EMA 15 → overlay on price chart
- `vixHistory` array → EMA 15 → overlay on VIX/RVX chart

Draw EMA as a continuous line in `#378ADD` on top of the existing chart drawing logic.

---

## Rules engine (new logic to add)

Add this function (reads from existing game state, does not modify it):

```javascript
function getRulesSignal(vixHistory, vixEMA) {
    if (vixHistory.length < 2) return null;
    const currentRVX = vixHistory[vixHistory.length - 1];
    const currentEMA = vixEMA[vixEMA.length - 1];
    const prevEMA = vixEMA[vixEMA.length - 2] || currentEMA;
    const emaFalling = currentEMA < prevEMA;
    
    // Find recent peak (last 4 weeks)
    const recentWindow = vixHistory.slice(-4);
    const recentPeak = Math.max(...recentWindow);
    const droppedFromPeak = recentPeak - currentRVX;
    
    if (droppedFromPeak >= 10 && emaFalling) return { action: 'Go uncovered', reason: 'RVX falling fast from recent peak — let the LEAPS run', colour: 'blue' };
    if (currentRVX > 27 && !emaFalling) return { action: 'Sell ITM call', reason: 'Crisis regime — collect maximum premium', colour: 'red' };
    if (currentRVX >= 22) return { action: 'Sell ATM call', reason: 'Elevated volatility — premium compensates for capped upside', colour: 'amber' };
    return { action: 'Sell OTM call', reason: 'Calm regime — modest income, keep most upside', colour: 'green' };
}
```

Call this function when rendering the sell call screen. Display result in the signal box (shown when rules toggle is ON).

---

## What NOT to change

- All `calculateOptionPrice()` logic
- All `createLEAPS()` logic  
- All `generateWeeklyMove()` logic
- All VIX/RVX simulation logic
- All P&L calculation and attribution logic
- All `cumulativeState` object structure and updates
- All margin call detection logic
- All annual report logic
- All roll LEAPS logic
- All `alert()` calls (replace with in-page modal or inline message — do not keep `alert()` but preserve the content shown)

---

## Replacing alert() popups

The original uses `alert()` for roll confirmations. Replace these with an inline confirmation card that appears in the left panel temporarily, then auto-dismisses after 3 seconds or on user click. Content should be identical to the original alert text.

---

## Files to provide to Claude Code

1. `minimal-game-with-leaps-selector.html` — the original source (all logic lives here)
2. `simulator_setup_screen.html` — reference design for screen 1
3. Screenshots of screens 2, 3, 4 as visual reference

---

## Acceptance criteria

- [ ] All four game screens render correctly with new styling
- [ ] Starting capital is adjustable and flows through all calculations
- [ ] EMA 15 line appears on both price and RVX charts
- [ ] RVX chart has horizontal reference lines at 22 and 27
- [ ] Rules engine toggle works and shows/hides signal
- [ ] Info bubbles work on all labelled terms
- [ ] LEAPS health alert appears when delta < 0.75 or DTE < 180
- [ ] All original scenarios work correctly
- [ ] P&L calculations produce identical results to original
- [ ] Margin call screen triggers correctly
- [ ] Annual report triggers at week 52
- [ ] No `alert()` popups remain
- [ ] IBM Plex Sans and IBM Plex Mono load and render
- [ ] Output is a single self-contained HTML file
