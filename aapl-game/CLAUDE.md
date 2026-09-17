# AAPL Turtle Trading Simulator — real-data, single-ticker clone of `tabbed-game`

## What this is

A simplified clone of `../tabbed-game`. Same core mechanics — 52-week paper-trading simulator for a
covered-call / Poor Man's Covered Call (PMCC) strategy — but:

- **AAPL only.** No ticker choice.
- **Real historical price data**, not synthetic scenarios. No scenario/difficulty/market-regime choice.
- **Two position types**, chosen on the Setup screen: buy 100 real shares (classic covered call) or buy
  a LEAPS (PMCC, the original mechanic). Shares mode never rolls the long position — it simply holds for
  all 52 weeks and manages only the weekly short call.
- Each playthrough uses a **random 52-week window** drawn from a ~3-year (156-week) real AAPL dataset, so
  replays vary even though the underlying data is fixed and real.

Do not port scenario-generation logic back into this clone, and do not add ticker choice back — that
functionality belongs in `../tabbed-game`, which this clone intentionally does not replace.

---

## Project structure

```
aapl-game/
├── CLAUDE.md              ← this file
├── index.html             ← HTML/CSS, no scenario/ticker grids (Position type toggle instead)
├── server.js               ← static file server + /api/analyse Anthropic proxy, port 3001
├── js/
│   ├── engine.js           ← LEAPSPosition, SharesPosition, ShortCallPosition, TradingSimulator
│   ├── vix-engine.js       ← VIXSimulator, AdvancedShortCall (unchanged from tabbed-game)
│   ├── aapl-data.js        ← real AAPL weekly OHLC + realized-vol data (replaces scenarios.js/historical-data.js)
│   ├── rules-engine.js     ← regime detection, signal generation, strike-table premium display
│   ├── charts.js           ← canvas rendering (unchanged from tabbed-game)
│   └── game-state.js       ← UI state machine, screen transitions, event wiring
└── css/
    └── styles.css          ← unchanged from tabbed-game
```

`scenarios.js` and `historical-data.js` do not exist in this clone — `js/aapl-data.js` replaces both,
following the same `{newPrice, priceChangePct, newVix, ohlc}` contract `historical-data.js` established
in `tabbed-game`.

---

## Data provenance

`js/aapl-data.js`'s `AAPL_WEEKLY_DATA` array was generated once, offline, during implementation — not
fetched at runtime. The shipped app has no network dependency for price data.

- **Source**: Yahoo Finance chart API (`query1.finance.yahoo.com/v8/finance/chart/AAPL?range=3y&interval=1d`),
  fetched 2026-07-02. (Stooq's free CSV endpoint was the original plan but was blocked by bot-protection
  at fetch time — Yahoo was the fallback.) 753 daily rows, 2023-07-03 to 2026-07-02.
- **Weekly aggregation**: daily rows grouped into Mon–Fri calendar weeks. `open` = first trading day's
  Open, `high`/`low` = week max/min, `close` = last trading day's Close. `dailyCloses` holds the week's
  real daily closes (padded to 5 by repeating the last value in holiday-shortened weeks) — used by
  "daily mode" instead of synthetic interpolation.
- **Realized volatility (the `vix` field)**: trailing 20-trading-day annualized stdev of daily log
  returns (`stdev * sqrt(252) * 100`), computed per week. This is a real-data-derived proxy, not a
  tracked index — there is no free historic options/IV data source, so this is the closest free
  approximation. No real historic options premiums were used anywhere in this pipeline.
- **Earnings-week IV multiplier**: AAPL's public quarterly earnings dates for the window (confirmed via
  live source for 2024-08 onward; 2023-08 through 2024-05 dates from training-data recall — flagged as
  lower-confidence and worth spot-checking if this data is ever regenerated):
  `2023-08-03, 2023-11-02, 2024-02-01, 2024-05-02, 2024-08-01, 2024-10-31, 2025-01-30, 2025-05-01,
  2025-07-31, 2025-10-30, 2026-01-29, 2026-04-30`.
  Because `runWeek()` prices next week's short call off *this* week's `newVix`, the multiplier is applied
  one week early: the week **before** an earnings week gets `vix *= 1.4` (pre-earnings IV runup, so the
  earnings week's own call is priced with elevated premium), and the earnings week itself gets
  `vix *= 1.15` (residual post-earnings IV). All other weeks are unmodified realized vol. Final values are
  floored at `16.0` and capped at `80`. These multipliers are reasoned starting points, not empirically
  fit — worth eyeballing against real premium levels if AAPL's real vol profile changes materially.
- **IV floor (16.0)**: added after a real-market sense-check (2026-07-02, AAPL $306.84, 6 DTE ~ATM call,
  real market IV 24.9%, price $3.75 — the `_bsCall()` formula reproduces this almost exactly when given
  the real IV, confirming the pricing math itself is sound). Without a floor, weeks with genuinely quiet
  realized volatility (as low as ~10) produced unrealistically cheap premiums, because implied vol
  structurally sits above realized vol (the "volatility risk premium" — compensation option sellers
  demand for gap/event risk) and single-stock ATM IV rarely drops below the mid-teens even in calm
  markets. 28 of 157 weeks (~18%) were below 16 before this floor was applied. This floor addresses the
  worst cases; it does **not** add a risk-premium markup on top of realized vol for weeks already above
  16 — if premiums still feel systematically low after playing, that markup (e.g. realized vol × 1.15-1.25)
  is the next lever to pull.
- 157 weekly bars total. Valid random-start range for a 52-week playthrough is index `[7, 105]`
  (`AAPL_WEEKLY_DATA.length - 52`), leaving 6 weeks of real preceding data for chart-seeding and 52 weeks
  of runway.

---

## Pricing calibration notes

`BS_IV` (LEAPS IV) and `BS_SHORT_IV_BASE`/`BS_SHORT_IV_BASELINE_VIX` (weekly short-call IV) live in
`js/engine.js`, recalibrated from `tabbed-game`'s IWM/SPY-tuned values:

```js
const BS_IV = 0.26;                    // was 0.27 in tabbed-game (IWM/SPY-calibrated)
const BS_SHORT_IV_BASE = 0.22;         // was a flat 0.24 in tabbed-game
const BS_SHORT_IV_BASELINE_VIX = 22;   // the realized-vol reading BS_SHORT_IV_BASE assumes
```

- `BS_IV` is a **judgment-call reduction** from tabbed-game's `0.27` (itself benchmarked against a real
  SPY LEAPS quote — see the equivalent note that used to live here). AAPL's real ATM long-dated IV
  typically runs slightly below IWM's, but this has not been spot-checked against a live AAPL LEAPS quote
  the same way tabbed-game's constant was. **If recalibrating, benchmark against a real current AAPL
  LEAPS quote (strike, DTE, market price, market-implied IV) and compare to this formula's output at that
  IV**, same methodology as `tabbed-game/CLAUDE.md`.
- Unlike `tabbed-game`, `BS_SHORT_IV_BASE` is **not applied as a flat constant**. `ShortCallPosition` now
  accepts an `ivOverride` (stored on the instance, reused every `advanceDay()` call rather than re-reading
  the module constant). Every call site computes
  `ivOverride = BS_SHORT_IV_BASE * (currentRealizedVol / BS_SHORT_IV_BASELINE_VIX)` before opening or
  rolling a short call, so **both Simple and Advanced pricing modes react to that week's real,
  earnings-aware realized-vol reading** — in `tabbed-game`, only Advanced mode's `AdvancedShortCall`
  reacted to VIX; Simple mode's `ShortCallPosition` did not.
- `TradingSimulator.sellWeeklyCall()` was extended to accept and forward this `ivOverride` — in
  `tabbed-game`, the executed trade always used the flat `BS_SHORT_IV` regardless of pricing mode; only
  the *displayed* strike-table premium in `rules-engine.js` varied by mode.

---

## Position types

`js/engine.js` adds a `SharesPosition` class alongside `LEAPSPosition`. Both are tagged `.kind`
(`'leaps'` or `'shares'`) and implement the same interface (`.value`, `.delta`, `.dte`, `.theta`,
`.strike`, `.costBasis`, `.advanceDay(newPrice)`, `.getPnl()`) so `TradingSimulator` and most of
`game-state.js` operate on either polymorphically via the existing `sim.leapsPosition` field.
`SharesPosition` has `strike: null`, `delta: 1.0`, `dte: null`, `theta: 0` — no expiry, no rolling.

`state.positionType` (`'shares'` default | `'leaps'`) drives:
- Setup screen: default starting capital nudges to $30k for shares (100 AAPL shares costs the bulk of a
  $20k account with no reserve) vs $20k for LEAPS.
- Screen 2: shares mode hides the ITM/DTE sliders and LEAPS health alerts, shows a simple share-purchase
  confirmation, and calls `sim.openShares(contracts)` instead of `sim.openLeaps(...)`.
- Delta/DTE health alerts (Screens 2/3/4, daily mode) are skipped entirely in shares mode — meaningless
  for a position with no delta or expiry.
- "Adjust LEAPS" (Screen 5, rolling) is hidden and unreachable in shares mode — shares never need rolling,
  the player just keeps managing the weekly short call.
- Results P&L table and running-totals labels switch between "LEAPS (long call)" / "LEAPS P&L" and
  "Shares" / "Shares P&L".

---

## Acceptance criteria

- [x] AAPL is the only tradable ticker; no ticker-selection UI exists
- [x] No scenario/difficulty/market-regime selection UI exists
- [x] Each playthrough draws a random 52-week window from real AAPL data on every reset
- [x] Weekly price/OHLC data is real (sourced from Yahoo Finance chart API), not synthetic
- [x] Short-call premium (both pricing modes) reacts to that week's realized-vol reading, including an
      earnings-week bump
- [x] Position type toggle (shares vs LEAPS) works on the Setup screen, with mode-appropriate defaults
- [x] Shares mode: no delta/DTE health alerts, no rolling, correct P&L table labels
- [x] LEAPS mode: plays identically to `tabbed-game`'s PMCC mechanic (sliders, health alerts, rolling)
- [x] No lingering "IWM"/"SPY"/scenario-name strings anywhere in the UI or AI-analysis prompt
- [x] `server.js` runs on port 3001 so it can coexist with `tabbed-game`'s server on 3000
