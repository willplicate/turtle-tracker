# Turtle Trading Game - Agent Documentation

## Project Overview

This is an **educational trading simulator** that teaches the "Turtle Strategy" (Poor Man's Covered Call / LEAPS-against-weeklies) through interactive gameplay and realistic market simulations. The project helps users understand options mechanics through progressive learning before exposing them to complex market scenarios.

**Target Audience:** Beginners to intermediate options traders learning LEAPS strategies without risking real capital.

**Core Philosophy:** Learning through direct comparison, controlled failure, and visual feedback rather than abstract theory.

---

## Repository Structure

```
/Users/williamford/Documents/AI-Coding/Turtle Game/
├── README.md                          # Human-readable project overview
├── turtle-spec.md                     # Full game specification (4 development phases)
├── CONTEXT.md                         # Current session summary and progress
├── DEPLOYMENT.md                      # Vercel deployment instructions
│
├── turtle-game/                       # Main TypeScript/Vite application
│   ├── package.json                   # NPM dependencies and scripts
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── tailwind.config.js             # Tailwind CSS theming
│   ├── vite.config.ts                 # Vite build configuration
│   ├── index.html                     # Vite entry HTML
│   ├── minimal-game.html              # Standalone HTML game (no build needed)
│   ├── minimal-game-with-leaps-selector.html  # Enhanced standalone version
│   ├── montecarlo.html                # Monte Carlo simulation interface
│   ├── src/
│   │   ├── main.ts                    # Main game entry point
│   │   ├── tutorial-main.ts           # Tutorial mode entry
│   │   ├── montecarlo-main.ts         # Monte Carlo entry
│   │   ├── style.css                  # Global styles
│   │   ├── types/index.ts             # Core TypeScript interfaces
│   │   ├── lib/
│   │   │   ├── pricing/               # Options pricing engine
│   │   │   │   ├── simplifiedPricing.ts      # Main pricing model
│   │   │   │   ├── optionsPricing.ts         # Extended pricing
│   │   │   │   ├── leaps.ts                  # LEAPS-specific logic
│   │   │   │   ├── testSimplifiedPricing.ts  # Validation tests
│   │   │   │   └── testShortCallExpiry.ts    # Expiry tests
│   │   │   ├── game/                  # Game state management
│   │   │   │   ├── stateManager.ts
│   │   │   │   ├── positionManager.ts
│   │   │   │   └── pnlCalculator.ts
│   │   │   ├── market/                # Price generation
│   │   │   │   ├── priceGenerator.ts
│   │   │   │   └── stockApi.ts
│   │   │   ├── montecarlo/            # Monte Carlo simulation
│   │   │   │   ├── simulationRunner.ts
│   │   │   │   ├── marketSimulator.ts
│   │   │   │   ├── ruleEngine.ts
│   │   │   │   ├── resultsAnalyzer.ts
│   │   │   │   ├── presetRules.ts
│   │   │   │   ├── randomGenerators.ts
│   │   │   │   └── types.ts
│   │   │   └── workers/
│   │   │       └── montecarloWorker.ts
│   │   └── components/                # UI components
│   │       ├── GameScreen.ts
│   │       ├── Chart/
│   │       ├── OptionsChain/
│   │       ├── Positions/
│   │       ├── Controls/
│   │       ├── Tutorial/
│   │       ├── MonteCarlo/
│   │       └── Common/
│   └── dist/                          # Build output (Vercel serves this)
│
├── compact-game/                      # Streamlined single-screen version
│   ├── index.html                     # Complete game in single file (~1400 lines)
│   └── README.md
│
├── turtle-tracker/                    # Real trade tracking tool
│   ├── index.html                     # Trade tracker with Alpha Vantage API
│   ├── README.md
│   ├── sample-backfill.json
│   ├── your-trades-import.json
│   ├── your-complete-portfolio.json
│   └── *.csv                          # Sample import files
│
├── *.py                               # Python reference implementations
│   ├── simplified_trading_simulator.py
│   ├── trading_simulator.py
│   ├── delta_calculator.py
│   ├── montecarlo_blackscholes.py
│   ├── leaps_pricing_model_v2.py
│   ├── advanced_pricing_with_vix.py
│   ├── calibrate_montecarlo.py
│   ├── calibrate_delta_to_market.py
│   ├── verify_pnl_calculations.py
│   └── test_*.py                      # Various test scripts
│
└── *.md                               # Documentation files
    ├── DELTA_SYSTEM_SUMMARY.md
    ├── MONTECARLO_STATUS.md
    ├── ROLLING_CRITERIA_CORRECTED.md
    ├── PNL_FIXES_SUMMARY.md
    ├── TREND_FOLLOWING_ISSUE.md
    └── ...
```

---

## Technology Stack

### Frontend (turtle-game/)
- **Framework:** Vanilla TypeScript + Vite (no React currently)
- **Build Tool:** Vite v7.2.4
- **Styling:** Tailwind CSS v4.1.18 with custom theme
- **Charts:** Canvas API (minimal/compact games), Chart.js (full game)
- **State:** Plain TypeScript objects (no external state management)

### Python Analysis Tools (root level)
- **Language:** Python 3
- **Purpose:** Reference implementations, pricing validation, Monte Carlo analysis
- **Key Libraries:** math, typing, csv, random, statistics

### Deployment
- **Platform:** Vercel (configured via `vercel.json`)
- **Type:** Static site deployment
- **Domain:** https://turtle-trading-game.vercel.app

---

## Build and Development Commands

### turtle-game/ (Full TypeScript Application)

```bash
cd turtle-game

# Install dependencies
npm install

# Development server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

### Standalone Games (No Build Required)

```bash
# Minimal game (single HTML file)
open turtle-game/minimal-game.html

# Compact game (dashboard layout) - Includes Trade Correction Feature
open compact-game/index.html

# Trade tracker
open turtle-tracker/index.html
```

### Python Validation Scripts

```bash
# Run simplified simulator
python3 simplified_trading_simulator.py

# Test pricing models
python3 test_short_call_expiry.py
python3 test_weekly_call_pricing.py
python3 validate_montecarlo_pricing.py

# Delta calibration
python3 delta_calculator.py

# P&L verification
python3 verify_pnl_calculations.py
```

### TypeScript Tests (via tsx)

```bash
cd turtle-game

# Test pricing model
npx tsx src/lib/pricing/testSimplifiedPricing.ts

# Test short call expiry
npx tsx src/lib/pricing/testShortCallExpiry.ts
```

---

## Code Organization

### Pricing Engine (Critical)

The pricing model is the **core intellectual property** of this project. It uses a simplified educational model (NOT Black-Scholes) designed for clarity:

**Key Files:**
- `turtle-game/src/lib/pricing/simplifiedPricing.ts` - Main TypeScript implementation
- `simplified_trading_simulator.py` - Python reference (must match exactly)

**Core Concepts:**
1. **LEAPS Position:** Deep ITM long-dated calls (80-90 delta)
   - Delta-based daily updates: `stockImpact = stockChange × delta × 100`
   - Fixed theta decay: `theta = -extrinsic / DTE`
   - Extrinsic: $2-3 per day depending on moneyness

2. **Short Call Position:** Weekly covered calls sold against LEAPS
   - Base extrinsic: $450 for 7 DTE ATM
   - Moneyness curve: Fine-grained for $1 strike increments
   - At expiration: worth only intrinsic value

3. **Validation:** Python and TypeScript implementations must produce identical results

### State Management

**Portfolio Interface (simplifiedPricing.ts):**
```typescript
interface Portfolio {
  cash: number;
  leaps: LEAPSPosition | null;
  shortCall: ShortCallPosition | null;
  weekStartValue: number;    // For weekly P&L calculation
  totalStartValue: number;   // For total P&L calculation
  currentDay: number;
  currentWeek: number;
}
```

### Monte Carlo Simulation

Located in `turtle-game/src/lib/montecarlo/`:
- **simulationRunner.ts** - Core simulation loop with P&L tracking
- **marketSimulator.ts** - Price path generation
- **ruleEngine.ts** - Trading rule execution (CRITICAL: strike offsets use percentages, not dollars)
- **types.ts** - WeekSnapshot interface for attribution

**Important:** Strike calculation uses percentages: `strike = price * (1 + offset/100)` NOT `strike = price + offset`

---

## Development Conventions

### TypeScript Style

1. **Strict Mode:** Enabled in tsconfig.json
   - `noUnusedLocals: true`
   - `noUnusedParameters: true`
   - `strict: true`

2. **Module System:** ESNext with Vite
   - Use `import/export` syntax
   - TypeScript extensions allowed: `import './file.ts'`

3. **Naming Conventions:**
   - Interfaces: PascalCase (e.g., `LEAPSPosition`)
   - Functions: camelCase (e.g., `calculateSimpleDelta`)
   - Constants: UPPER_SNAKE_CASE for true constants
   - Files: PascalCase for components, camelCase for utilities

4. **Type Safety:**
   - Always define return types for exported functions
   - Use `type` imports: `import type { Portfolio } from './file'`
   - Avoid `any` - use `unknown` with type guards instead

### Python Style

1. **Type Hints:** Use typing module (`Optional`, `Dict`, `List`)
2. **Docstrings:** Google-style docstrings for classes and methods
3. **Classes:** PascalCase with explicit `__init__` methods
4. **Validation:** Python results are the "source of truth" for pricing

### CSS/Tailwind

1. **Custom Colors** (defined in tailwind.config.js):
   - `matrix-green: #00FF41` - Primary accent
   - `game-bg: #0b0f0f` - Dark background
   - `card-bg: #1a1f1f` - Card background

2. **Theme:** Dark professional trading aesthetic

---

## Testing Strategy

### Pricing Model Validation (Critical)

The TypeScript and Python pricing models **must produce identical results**. Always validate changes:

```bash
# 1. Run Python reference
python3 simplified_trading_simulator.py

# 2. Run TypeScript implementation
cd turtle-game && npx tsx src/lib/pricing/testSimplifiedPricing.ts

# 3. Compare outputs - they should match within $0.01
```

### Key Test Scenarios

1. **LEAPS Daily Update:**
   - Stock up $5 with 0.85 delta → Value increases by $425
   - Theta of -$2.50/day → Value decreases by $2.50

2. **Short Call Expiry:**
   - ATM call at expiration → Worth $0 (no intrinsic)
   - $5 ITM call at expiration → Worth $500 (intrinsic only)

3. **Weekly P&L Attribution:**
   - `Weekly P&L = LEAPS Stock Impact + LEAPS Theta + Call P&L ± Roll Cost`
   - Must balance exactly - no unexplained gaps

### Monte Carlo Validation

```bash
python3 validate_montecarlo_pricing.py
```

Checks:
- Strike calculations use percentages
- OTM decay curve matches minimal game
- Base premium at $450 (not $650)

---

## Deployment Process

### Vercel Deployment

```bash
# Option 1: Vercel CLI
npm i -g vercel
vercel --prod

# Option 2: Git Integration (recommended)
git add .
git commit -m "Description of changes"
git push origin main
# Vercel auto-deploys from main branch
```

### Deployment Configuration

- **vercel.json** at root configures routes to turtle-tracker/
- **turtle-game/dist/** is the build output directory
- **compact-game/** can be deployed as static HTML
- No backend required - uses localStorage for persistence

### Pre-deployment Checklist

1. [ ] Run `npm run build` - ensure no TypeScript errors
2. [ ] Validate pricing: Python vs TypeScript outputs match
3. [ ] Test game flow: Open LEAPS → Sell Call → Run Week → Verify P&L
4. [ ] Check localStorage persistence (refresh page, data should remain)

---

## Key Design Decisions

### 1. Simplified Pricing (Not Black-Scholes)

**Decision:** Use linear, deterministic calculations instead of Black-Scholes.

**Rationale:**
- Educational clarity - users can verify calculations by hand
- No complex math dependencies
- Predictable behavior for teaching

**Trade-off:** ~7.8% error vs real market data (acceptable for education)

### 2. Dual Implementation (Python + TypeScript)

**Decision:** Maintain identical logic in Python (validation) and TypeScript (production).

**Rationale:**
- Python for rapid prototyping and analysis
- TypeScript for browser execution
- Cross-validation catches bugs

### 3. Multiple Game Versions

| Version | File | Purpose |
|---------|------|---------|
| Minimal | `minimal-game.html` | Quick testing, mobile-friendly |
| Compact | `compact-game/index.html` | Full dashboard, desktop-optimized |
| Full TS | `turtle-game/src/` | Extensible, tutorial mode, Monte Carlo |
| Tracker | `turtle-tracker/index.html` | Real trade tracking with API |

### 4. localStorage Persistence

**Decision:** Use browser localStorage instead of backend database.

**Pros:**
- Zero hosting costs
- No user accounts needed
- Instant deployment

**Cons:**
- Data tied to browser
- No cross-device sync
- Cleared if user clears browser data

---

## Common Pitfalls

### 1. Strike Calculation Bug (CRITICAL)

**Wrong:** `strike = price + offset` (treats offset as dollars)
**Right:** `strike = price * (1 + offset/100)` (treats offset as percentage)

This caused strikes to be 0.25% OTM instead of 1.5% OTM, leading to constant assignments.

### 2. P&L Attribution Gaps

When rolling LEAPS, the old LEAPS P&L must be explicitly shown:
- Stock Impact from old LEAPS
- Theta from old LEAPS  
- Roll Cost (new LEAPS cost - old LEAPS value)

**Don't:** Hide these in the roll week (creates $1000+ attribution gaps)

### 3. Weekly Premium Calibration

Base extrinsic for 7 DTE ATM should be **$450**, not $650 (validated vs real SPY options).

### 4. Delta Boundaries

LEAPS rolling triggers:
- **Delta < 0.75** (time decay accelerating)
- **DTE < 180** (approaching expiration)

Don't use higher thresholds or rolls happen too frequently.

---

## Trade Correction Feature (compact-game)

The compact-game includes a **Trade History & Correction** feature to fix data entry errors (e.g., entering $7.45 instead of $745 when closing a position).

### How It Works

1. **Automatic Trade Logging:** Every trade (LEAPS open, short call sell, buyback, weekly results) is recorded to localStorage
2. **Correction UI:** Click the "📜 History" button in the header to view all trades
3. **Edit Values:** Click "Edit Values" on any trade to modify the recorded amounts
4. **Auto-Recalculation:** When a trade is corrected, the entire portfolio state is recalculated from that point forward

### Trade Types Tracked

| Trade Type | Editable Fields |
|------------|-----------------|
| `OPEN_LEAPS` | Premium paid |
| `SELL_CALL` | Premium collected |
| `CLOSE_LEAPS` | Close value |
| `BUY_BACK_CALL` | Buyback cost |
| `WEEKLY_RESULT` | Ending balance |

### Implementation Details

**Storage:**
- Trade history stored in `localStorage` under `turtleGame_tradeHistory`
- Each trade has a unique ID, timestamp, and optional `corrected` flag
- Original values preserved in `originalData` when corrected

**Recalculation Logic:**
```javascript
// Rebuild state up to the corrected trade
const workingState = rebuildStateUpToIndex(tradeIndex);

// Reapply all subsequent trades
for (const trade of tradesToReprocess) {
    workingState = applyTradeToState(workingState, trade);
}
```

**Usage Example:**
```javascript
// User realizes they entered $7.45 instead of $745 for buyback
// They open Trade History, find the BUY_BACK_CALL trade
// Edit the buyback cost from 7.45 to 745
// System recalculates: New P&L = Premium - 745 (was Premium - 7.45)
// Balance and all subsequent weeks are recalculated
```

### Reset Behavior

- **Reset Game:** Clears both game state AND trade history
- **New Game:** Starts with fresh trade history

---

## Security Considerations

1. **No Backend:** All data stays in browser localStorage
2. **No User Input Parsing:** CSV imports use simple split (no eval)
3. **API Keys:** Alpha Vantage key is public (free tier, limited requests)
4. **XSS Prevention:** innerHTML used minimally; textContent preferred

---

## External Dependencies

### APIs
- **Alpha Vantage:** Live stock prices (25 calls/day free tier)
  - Key: `VAD1Q74JGQ6JTG42` (pre-configured)
  - Endpoint: `https://www.alphavantage.co/query`

### NPM Packages (turtle-game/)
- `vite` - Build tool
- `typescript` - Language
- `tailwindcss` - Styling
- `chart.js` - Charts (full game)
- `autoprefixer` - CSS processing

---

## Documentation Files

| File | Purpose |
|------|---------|
| `turtle-spec.md` | Full game specification with 4 development phases |
| `CONTEXT.md` | Current session progress and recent changes |
| `DEPLOYMENT.md` | Vercel deployment guide |
| `DELTA_SYSTEM_SUMMARY.md` | Delta calculation implementation |
| `MONTECARLO_STATUS.md` | Monte Carlo simulation status |
| `ROLLING_CRITERIA_CORRECTED.md` | LEAPS rolling rules |
| `PNL_FIXES_SUMMARY.md` | P&L calculation fixes history |
| `TREND_FOLLOWING_ISSUE.md` | Analysis of strategy underperformance |

---

## Getting Started for New Agents

1. **Understand the Strategy:**
   - Read `turtle-spec.md` sections on Tutorial 1-2
   - Understand LEAPS (long-term deep ITM calls)
   - Understand covered calls (selling weekly calls against LEAPS)

2. **Run the Games:**
   ```bash
   open compact-game/index.html  # Play the streamlined version
   ```

3. **Study the Pricing:**
   - Read `turtle-game/src/lib/pricing/simplifiedPricing.ts`
   - Run Python and TypeScript tests side-by-side
   - Verify they produce identical outputs

4. **Explore Monte Carlo:**
   ```bash
   cd turtle-game
   npm run dev
   # Navigate to Monte Carlo tab in browser
   ```

5. **Check Recent Context:**
   - Read `CONTEXT.md` for current status
   - Read `START_FRESH.md` for previous session context

---

## License

MIT License - Educational project open for contributions.

---

*Built with Claude Code ⚡*
