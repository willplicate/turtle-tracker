# Lite Game — Build Plan

## What this is

A free, simplified educational version of the Turtle Trading Simulator.
Teaches covered calls through three locked tutorials, each adding one layer of concept.
Lives in `/Turtle Game/lite-game/` — cloned from `tabbed-game` on 2026-06-01.

The full game (`tabbed-game`) stays untouched. This is a separate product.

---

## Concept

No LEAPS. The user owns **100 shares** of a stock and learns to sell covered calls against them.
Three tutorials, locked progression — must complete #1 to unlock #2, #2 to unlock #3.
Each tutorial runs **8 weeks**.

---

## Tutorial Structure

### Tutorial 1 — "The Market"
- **Market:** Bull only (consistent +1.5%/week, no randomness)
- **Concept:** Shares move with price. Portfolio value = shares × price.
- **User action:** None — passive observation. Just click "Next week."
- **Key lesson:** You benefit from upside, but you're also fully exposed to downside. (Sets up the problem the short call solves.)
- **End screen:** "You made $X. But what if the market went sideways or down? Next tutorial shows how to collect income while you wait."

### Tutorial 2 — "Premium Income"
- **Market:** Bear only (consistent -1%/week, no randomness)
- **Concept:** How short calls are priced — intrinsic value + extrinsic value (time value + IV). Theta decay. Calls expire worthless when price falls.
- **User action:** Pick a strike each week — ITM / ATM / OTM. See the premium breakdown before confirming.
- **Key lesson:** Even though shares fell, you collected premium every week. The calls expired worthless. Extrinsic value goes to zero at expiry.
- **End screen:** Summary of total premium collected vs. share P&L.

### Tutorial 3 — "The Full Picture"
- **Market:** Realistic mixed (up, down, sideways — randomised but seeded for consistency)
- **Concept:** The covered call tradeoff. Sometimes the call goes ITM and caps your upside. Sometimes it expires worthless and you keep the premium.
- **User action:** Pick a strike each week — ITM / ATM / OTM. Active tradeoff decision.
- **Key lesson:** There's no "right" answer — it depends on your view. Selling ITM = max income, capped upside. OTM = some income, more participation. Uncovered = no income, full upside.
- **End screen:** Full 8-week performance summary. Premium collected, share P&L, net result.

---

## Screen Structure

### Home screen
Three tutorial cards in a row:
- Card 1: unlocked, green "Start" button
- Card 2: locked (greyed out) until Tutorial 1 complete
- Card 3: locked until Tutorial 2 complete

Each card shows: title, one-line description, difficulty badge, completion state.

### Per-tutorial screens

**All tutorials:**
`Intro → [Week loop] → Summary`

**Week loop for Tutorial 1:**
`Week view (price moves, portfolio updates) → click Next week`

**Week loop for Tutorials 2 & 3:**
`Sell call screen (pick strike, see premium breakdown) → Run week → Results screen → click Next week`

**Sell call screen shows:**
- Current price, your shares value
- Strike table: ITM / ATM / OTM with premium, breakdown (intrinsic + extrinsic), and a plain-English note
- Selected row highlighted, confirm button

**Results screen shows:**
- Did the call expire worthless or go ITM?
- Premium collected this week
- Share P&L this week
- Running totals
- Brief explanation of what happened and why

---

## Educational copy principles

- Never use jargon without an immediate plain-English translation
- "Intrinsic value = how far ITM the call is × 100. Extrinsic value = everything else — time and volatility. At expiry, extrinsic goes to zero."
- "Going ITM isn't a loss — you still keep the premium. You just don't get the share upside above your strike."
- Tooltips on all terms: delta, theta, intrinsic, extrinsic, ITM, OTM, ATM, expiry, premium

---

## Technical approach

### What to reuse from tabbed-game
- `js/engine.js` — BlackScholes pricing, ShortCallPosition class
- `js/scenarios.js` — weekly move generator (use bull/bear/mixed scenarios)
- `js/charts.js` — candlestick chart, portfolio value chart
- `css/styles.css` — colour palette, typography (IBM Plex Sans/Mono)

### What to build fresh
- `index.html` — new home screen + tutorial shell
- `js/tutorial-state.js` — state machine for tutorial progression, week loop, lock/unlock logic
- `js/tutorial-ui.js` — DOM wiring for all tutorial screens
- Scenarios: Tutorial 1 uses a simple +1.5%/week loop (no randomness), Tutorial 2 uses -1%/week loop, Tutorial 3 uses the existing randomised mixed scenario

### What to remove / not port
- LEAPS screens (Buy LEAPS, Roll LEAPS)
- VIX engine and advanced pricing mode
- Rules engine (no regime signals needed)
- Setup screen (no capital input — use a fixed $10,000 starting capital to keep it simple)
- Annual report screen (tutorials end at week 8)

### Pricing
- Use the existing `ShortCallPosition` (simple mode, no VIX)
- For Tutorial 2 intrinsic/extrinsic breakdown, call `_calculate_weekly_call_value()` and split: intrinsic = max(0, price - strike) × 100, extrinsic = premium - intrinsic

### Persistence
- Use `localStorage` to store which tutorials are complete
- Key: `lite_game_progress` = `{ t1: false, t2: false, t3: false }`

---

## Dev server

The cloned `server.js` serves on port 3000 by default.
Change `const PORT = 3000` to `3001` in `lite-game/server.js` so both can run simultaneously.
Run: `node server.js` from the `lite-game/` directory.

---

## Design notes

Same colour palette and typography as tabbed-game:
- IBM Plex Sans for UI text, IBM Plex Mono for all numbers
- Blue accent `#378ADD`, green `#97C459`, amber `#EF9F27`, red `#F09595`
- Lock icon on locked tutorial cards (grey overlay)
- Progress indicator within each tutorial: "Week 3 of 8"

---

## Build order

1. `index.html` home screen with 3 tutorial cards (locked/unlocked state from localStorage)
2. Tutorial 1 — week loop (no options, just price movement)
3. Tutorial 2 — sell call screen + results, bear market
4. Tutorial 3 — sell call screen + results, mixed market
5. Intro and summary screens for each tutorial
6. Polish: tooltips, educational copy, mobile-friendly layout check
