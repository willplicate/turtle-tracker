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
├── vercel.json                        # Vercel routing configuration (root level)
├── .env.local                         # Environment variables (API keys)
├── .gitignore                         # Git ignore patterns
│
├── turtle-game/                       # Main TypeScript/Vite application
│   ├── package.json                   # NPM dependencies and scripts
│   ├── package-lock.json              # Locked dependency versions
│   ├── tsconfig.json                  # TypeScript configuration (strict mode)
│   ├── tailwind.config.js             # Tailwind CSS theming
│   ├── postcss.config.js              # PostCSS configuration for Tailwind v4
│   ├── index.html                     # Vite entry HTML
│   ├── tutorial-demo.html             # Tutorial demonstration page
│   ├── tutorial1.html                 # Tutorial 1 standalone
│   ├── tutorial2.html                 # Tutorial 2 standalone
│   ├── minimal-game.html              # Standalone HTML game (no build needed)
│   ├── minimal-game-with-leaps-selector.html  # Enhanced standalone version
│   ├── montecarlo.html                # Monte Carlo simulation interface
│   ├── src/
│   │   ├── main.ts                    # Main game entry point
│   │   ├── tutorial-main.ts           # Tutorial mode entry
│   │   ├── montecarlo-main.ts         # Monte Carlo entry
│   │   ├── style.css                  # Global styles
│   │   ├── counter.ts                 # Simple counter demo component
│   │   ├── typescript.svg             # TypeScript logo asset
│   │   ├── types/
│   │   │   └── index.ts               # Core TypeScript interfaces (Position, MarketState, etc.)
│   │   ├── lib/
│   │   │   ├── pricing/               # Options pricing engine
│   │   │   │   ├── simplifiedPricing.ts      # Main simplified pricing model
│   │   │   │   ├── optionsPricing.ts         # Extended pricing with VIX
│   │   │   │   ├── leaps.ts                  # LEAPS-specific pricing logic
│   │   │   │   ├── testSimplifiedPricing.ts  # TypeScript validation tests
│   │   │   │   └── testShortCallExpiry.ts    # Short call expiry tests
│   │   │   ├── game/                  # Game state management
│   │   │   │   ├── stateManager.ts           # Central state reducer & GameStore class
│   │   │   │   ├── positionManager.ts        # Position management utilities
│   │   │   │   └── pnlCalculator.ts          # P&L calculation logic
│   │   │   ├── market/                # Price generation
│   │   │   │   ├── priceGenerator.ts         # Market price generation algorithms
│   │   │   │   └── stockApi.ts               # Alpha Vantage API integration
│   │   │   ├── montecarlo/            # Monte Carlo simulation engine
│   │   │   │   ├── simulationRunner.ts       # Core simulation loop
│   │   │   │   ├── marketSimulator.ts        # Price path & VIX generation
│   │   │   │   ├── ruleEngine.ts             # Trading rule evaluation
│   │   │   │   ├── resultsAnalyzer.ts        # Statistical analysis
│   │   │   │   ├── presetRules.ts            # Built-in rule sets
│   │   │   │   ├── randomGenerators.ts       # Seeded random generation
│   │   │   │   └── types.ts                  # Monte Carlo TypeScript interfaces
│   │   │   └── workers/
│   │   │       └── montecarloWorker.ts       # Web Worker for simulation
│   │   └── components/                # UI components
│   │       ├── GameScreen.ts                # Main game screen component
│   │       ├── PricingModelTester.ts        # Pricing validation UI
│   │       ├── Chart/
│   │       │   ├── CandlestickChart.ts      # Canvas candlestick chart
│   │       │   └── LEAPSValueChart.ts       # LEAPS value history chart
│   │       ├── OptionsChain/
│   │       │   └── OptionsChain.ts          # Strike selection interface
│   │       ├── Positions/
│   │       │   ├── LEAPSPanel.ts            # LEAPS position display
│   │       │   └── ShortCallPanel.ts        # Short call position display
│   │       ├── Controls/
│   │       │   └── GameControls.ts          # Action buttons and controls
│   │       ├── Common/
│   │       │   └── AccountHeader.ts         # Account summary header
│   │       ├── Tutorial/
│   │       │   ├── TutorialManager.ts       # Tutorial state management
│   │       │   ├── Tutorial0Shares.ts       # Tutorial 0: Initial shares
│   │       │   ├── Tutorial1Screen1.ts      # Tutorial 1 Screen 1
│   │       │   ├── Tutorial1Screen2.ts      # Tutorial 1 Screen 2
│   │       │   ├── Tutorial1Screen3.ts      # Tutorial 1 Screen 3
│   │       │   └── Tutorial1Screen4.ts      # Tutorial 1 Screen 4
│   │       └── MonteCarlo/
│   │           ├── MonteCarloScreen.ts      # Main MC interface
│   │           ├── ParameterPanel.ts        # Simulation parameters UI
│   │           ├── RuleEditor.ts            # Rule configuration UI
│   │           ├── ResultsView.ts           # Results display
│   │           └── PathInspector.ts         # Individual path analysis
│   └── dist/                          # Build output (Vercel serves this)
│       └── (generated by vite build)
│
├── compact-game/                      # Streamlined single-screen version
│   ├── index.html                     # Complete game in single file (~77KB)
│   └── README.md                      # Compact game documentation
│
├── turtle-tracker/                    # Real trade tracking tool
│   ├── index.html                     # Trade tracker with Alpha Vantage API
│   ├── index.html.backup              # Backup version
│   ├── index-v2.html                  # Version 2 experimental
│   ├── README.md                      # Tracker documentation
│   ├── sample-backfill.json           # Sample data for backfilling
│   ├── your-trades-import.json        # JSON import template
│   ├── your-complete-portfolio.json   # Complete portfolio example
│   ├── your-trades.csv                # CSV import template
│   ├── your-data.csv                  # Data export example
│   ├── your-real-data.json            # Real trade data example
│   ├── your-trades-simple.csv         # Simple CSV template
│   └── tastytrade_import.csv          # TastyTrade import template
│
├── *.py                               # Python reference implementations (38 files)
│   # Core Reference Implementation:
│   ├── simplified_trading_simulator.py      # MUST MATCH TypeScript exactly
│   # Calibration & Validation:
│   ├── calibrate_montecarlo.py              # MC calibration to market data
│   ├── calibrate_montecarlo_empirical.py    # Empirical calibration
│   ├── calibrate_delta_to_market.py         # Delta calibration to real options
│   ├── validate_montecarlo_pricing.py       # MC pricing validation
│   ├── validate_simulation_pricing.py       # Simulation validation
│   ├── validate_csv_pricing.py              # CSV data validation
│   ├── validate_delta_js_vs_py.py           # Cross-language delta check
│   ├── verify_pnl_calculations.py           # P&L verification
│   ├── verify_new_pricing.py                # New pricing verification
│   ├── verify_7dte_pricing.py               # 7DTE pricing check
│   ├── verify_fixes.py                      # Bug fix verification
│   ├── verify_path9_numbers.py              # Path 9 specific validation
│   # Pricing Models:
│   ├── trading_simulator.py                 # Full-featured simulator
│   ├── leaps_pricing_model_v2.py            # V2 pricing model
│   ├── advanced_pricing_with_vix.py         # VIX-adjusted pricing
│   ├── delta_calculator.py                  # Delta calculation utilities
│   ├── montecarlo_blackscholes.py           # Black-Scholes MC implementation
│   # Analysis Tools:
│   ├── analyze_path5.py                     # Path 5 analysis
│   ├── analyze_recovery_path9.py            # Path 9 recovery analysis
│   ├── analyze_week27_46_loss.py            # Loss scenario analysis
│   ├── analyze_real_options_data.py         # Real market data analysis
│   # Comparison Tools:
│   ├── compare_pricing.py                   # Pricing comparison
│   ├── compare_pricing_methods.py           # Method comparison
│   ├── compare_pricing_models.py            # Model comparison
│   ├── compare_ts_python_pricing.py         # TS vs Python comparison
│   ├── compare_weekly_calls.py              # Weekly call comparison
│   ├── compare_weekly_iwm.py                # IWM comparison
│   ├── vix_fix_comparison.py                # VIX fix comparison
│   # Diagnostics:
│   ├── diagnose_leaps_issue.py              # LEAPS issue diagnosis
│   ├── diagnose_pricing_model.py            # Pricing model diagnosis
│   ├── identify_pnl_bugs.py                 # P&L bug identification
│   # Test Scripts:
│   ├── test_calibrated_delta.py             # Calibrated delta tests
│   ├── test_delta_logic.py                  # Delta logic tests
│   ├── test_leaps_interactive.py            # Interactive LEAPS tests
│   ├── test_montecarlo_impact.py            # MC impact tests
│   ├── test_short_call_expiry.py            # Short call expiry tests
│   ├── test_weekly_call_pricing.py          # Weekly call pricing tests
│   └── validate_leaps_pricing.ts            # TypeScript validation
│
└── *.md                               # Documentation files (20+ files)
    ├── turtle-spec.md                      # Full game specification
    ├── CONTEXT.md                          # Current session context
    ├── DEPLOYMENT.md                       # Deployment guide
    ├── START_FRESH.md                      # Session startup context
    ├── SESSION_SUMMARY_MAR4.md             # March 4 session summary
    ├── DELTA_SYSTEM_SUMMARY.md             # Delta calculation docs
    ├── MONTECARLO_STATUS.md                # MC simulation status
    ├── MONTECARLO_PRICING_FIX.md           # MC pricing fixes
    ├── ROLLING_CRITERIA_CORRECTED.md       # Rolling rules
    ├── PNL_BUGS_FIXED.md                   # P&L bug fixes
    ├── PNL_FIXES_SUMMARY.md                # P&L fixes summary
    ├── WEEKLY_CALL_FIX.md                  # Weekly call fixes
    ├── WEEKLY_PNL_FIX.md                   # Weekly P&L fixes
    ├── LEAPS_CALCULATION_FLAW.md           # LEAPS calculation issues
    ├── PRICING_VALIDATION.md               # Pricing validation
    ├── PRICING_MODEL_V2_RESULTS.md         # V2 pricing results
    ├── MODEL_COMPARISON.md                 # Model comparison results
    ├── TREND_FOLLOWING_ISSUE.md            # Trend following analysis
    ├── NEXT_STEPS_PRICING_MODEL.md         # Pricing model roadmap
    ├── IMPLEMENTATION_COMPLETE.md          # Implementation status
    ├── ANNUAL_REPORT_FEATURE.md            # Annual report feature
    ├── RECOVERY_FOCUSED_STRATEGY.md        # Recovery strategy
    ├── REMAINING_ISSUES.md                 # Known issues
    └── debug_weekly_pnl.md                 # Weekly P&L debugging
```

---

## Technology Stack

### Frontend (turtle-game/)

| Technology | Version | Purpose |
|------------|---------|---------|
| TypeScript | ~5.9.3 | Primary language |
| Vite | ^7.2.4 | Build tool and dev server |
| Tailwind CSS | ^4.1.18 | Utility-first styling |
| PostCSS | ^8.5.6 | CSS processing |
| Autoprefixer | ^10.4.23 | CSS vendor prefixes |
| Chart.js | ^4.5.1 | Charts (full game) |

**Key Configuration:**
- `type: "module"` in package.json for ES modules
- TypeScript strict mode enabled with `noUnusedLocals` and `noUnusedParameters`
- Tailwind v4 with `@tailwindcss/postcss` plugin

### Python Analysis Tools (root level)

| Category | Libraries |
|----------|-----------|
| Standard Library | `math`, `typing`, `csv`, `random`, `statistics`, `json`, `datetime` |
| Purpose | Reference implementations, pricing validation, Monte Carlo analysis |

**Key Principle:** Python implementations are the "source of truth" - TypeScript must match exactly.

### Deployment Infrastructure

| Component | Configuration |
|-----------|---------------|
| Platform | Vercel |
| Type | Static site deployment |
| Root Routing | `vercel.json` routes root `/` to `turtle-tracker/index.html` |
| API Key | Alpha Vantage `VAD1Q74JGQ6JTG42` (free tier, 25 calls/day) |

---

## Build and Development Commands

### turtle-game/ (Full TypeScript Application)

```bash
cd turtle-game

# Install dependencies
npm install

# Development server (hot reload at http://localhost:5173)
npm run dev

# Type check and build for production
npm run build

# Preview production build locally
npm run preview

# TypeScript execution (for tests, requires tsx)
npx tsx src/lib/pricing/testSimplifiedPricing.ts
```

**Build Output:**
- Static files generated in `turtle-game/dist/`
- `dist/index.html` - Entry point
- `dist/assets/` - Bundled JS and CSS

### Standalone Games (No Build Required)

```bash
# Minimal game (single HTML file, best for testing)
open turtle-game/minimal-game.html

# Minimal game with LEAPS selector
open turtle-game/minimal-game-with-leaps-selector.html

# Compact game (dashboard layout) - Includes Trade Correction Feature
open compact-game/index.html

# Trade tracker with live prices
open turtle-tracker/index.html

# Monte Carlo interface
open turtle-game/montecarlo.html
```

### Python Validation Scripts

```bash
# Run simplified simulator (primary reference)
python3 simplified_trading_simulator.py

# Test pricing models
python3 test_short_call_expiry.py
python3 test_weekly_call_pricing.py
python3 validate_montecarlo_pricing.py

# Delta calibration and validation
python3 delta_calculator.py
python3 test_calibrated_delta.py

# P&L verification
python3 verify_pnl_calculations.py
python3 verify_fixes.py

# MC validation
python3 validate_montecarlo_pricing.py
python3 test_montecarlo_impact.py

# Cross-language comparison
python3 compare_ts_python_pricing.py

# Analysis tools
python3 analyze_path5.py
python3 analyze_recovery_path9.py
```

### TypeScript Tests (via tsx)

```bash
cd turtle-game

# Test pricing model
npx tsx src/lib/pricing/testSimplifiedPricing.ts

# Test short call expiry
npx tsx src/lib/pricing/testShortCallExpiry.ts

# Validate delta consistency
npx tsx src/lib/pricing/testDelta.ts
```

---

## Code Organization

### Pricing Engine (Critical)

The pricing model is the **core intellectual property** of this project. It uses a simplified educational model (NOT Black-Scholes) designed for clarity.

**Key Files:**
```
turtle-game/src/lib/pricing/
├── simplifiedPricing.ts      # Main TypeScript implementation
├── optionsPricing.ts         # Extended pricing with VIX
├── leaps.ts                  # LEAPS-specific calculations
├── testSimplifiedPricing.ts  # Self-validation tests
└── testShortCallExpiry.ts    # Expiry scenario tests
```

**Python Reference:**
```
simplified_trading_simulator.py    # MUST MATCH TypeScript exactly
```

**Core Concepts:**

1. **LEAPS Position:** Deep ITM long-dated calls (80-90 delta)
   ```typescript
   // Delta-based daily updates
   stockImpact = stockChange × delta × 100
   
   // Fixed theta decay
   theta = -extrinsic / DTE
   
   // Extrinsic: $2-3 per day depending on moneyness
   dailyExtrinsic = 2.0 to 3.5 based on % ITM
   ```

2. **Short Call Position:** Weekly covered calls sold against LEAPS
   ```typescript
   // Base extrinsic: $450 for 7 DTE ATM (validated vs real SPY options)
   baseExtrinsic7DTE = 450
   
   // Moneyness curve: Fine-grained for $1 strike increments
   // At SPY $590, each $1 = 0.17%, requires fine granularity
   
   // At expiration: worth only intrinsic value
   if (DTE === 0) value = max(0, stockPrice - strike) × 100
   ```

3. **Validation:** Python and TypeScript implementations must produce identical results within $0.01

### State Management

**GameStore Class (stateManager.ts):**
```typescript
class GameStore {
  private state: GameState;
  private listeners: Set<(state: GameState) => void>;
  
  // Actions
  dispatch(action: GameAction): void
  subscribe(listener): () => void
  
  // Game controls
  start(), pause(), setSpeed(speed), reset(scenario)
  advanceDay(), updateMarketPrice(spyPrice, vix)
}
```

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

| File | Purpose |
|------|---------|
| `simulationRunner.ts` | Core simulation loop with P&L tracking |
| `marketSimulator.ts` | Price path generation, VIX simulation, volatility clustering |
| `ruleEngine.ts` | Trading rule evaluation (conditions → actions) |
| `resultsAnalyzer.ts` | Statistical analysis, percentiles, CVaR |
| `presetRules.ts` | Built-in rule sets (Conservative, Aggressive, etc.) |
| `randomGenerators.ts` | Seeded random number generation for reproducibility |
| `types.ts` | Complete TypeScript interfaces for MC system |
| `montecarloWorker.ts` | Web Worker for non-blocking simulation |

**Critical Rule Engine Pattern:**
```typescript
// Strike calculation uses PERCENTAGES, not dollars
// CORRECT:
strike = price * (1 + offset / 100)

// WRONG (caused major bug):
strike = price + offset
```

**WeekSnapshot Interface (for P&L attribution):**
```typescript
interface WeekSnapshot {
  week: number;
  price: number;
  vix: number;
  accountValue: number;
  weeklyPnL: number;
  
  // LEAPS P&L Attribution
  leapsStockImpact?: number;
  leapsThetaDecay?: number;
  rollCost?: number;
  
  // Short Call P&L Attribution
  expiredCallPremium?: number;
  expiredCallFinalValue?: number;
}
```

---

## Development Conventions

### TypeScript Style

**Compiler Configuration (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

**Naming Conventions:**
| Type | Convention | Example |
|------|------------|---------|
| Interfaces | PascalCase | `LEAPSPosition`, `WeekSnapshot` |
| Classes | PascalCase | `GameStore`, `ShortCallPosition` |
| Functions | camelCase | `calculateSimpleDelta`, `updateLEAPSDay` |
| Variables | camelCase | `stockImpact`, `weekStartValue` |
| Constants | UPPER_SNAKE_CASE | `baseExtrinsic7DTE` |
| Files (components) | PascalCase | `GameScreen.ts`, `MonteCarloScreen.ts` |
| Files (utilities) | camelCase | `simplifiedPricing.ts`, `stateManager.ts` |

**Type Safety:**
- Always define return types for exported functions
- Use `type` imports: `import type { Portfolio } from './file'`
- Avoid `any` - use `unknown` with type guards instead
- Use strict equality (`===` and `!==`)

### Python Style

**Type Hints:**
```python
from typing import Optional, Dict, List, Tuple

def calculate_delta(stock_price: float, strike: float) -> float:
    """Calculate delta with type annotations."""
    return 0.85
```

**Docstrings (Google Style):**
```python
class LEAPSPosition:
    """Long LEAPS call option - Simplified Educational Model.
    
    Attributes:
        strike: Option strike price
        dte: Days to expiration
        delta: Current delta (0.0 to 1.0)
    """
```

### CSS/Tailwind

**Custom Colors (tailwind.config.js):**
```javascript
colors: {
  'matrix-green': '#00FF41',  // Primary accent for positive values
  'game-bg': '#0b0f0f',       // Dark background
  'card-bg': '#1a1f1f',       // Card background
}
```

**Usage Patterns:**
```html
<!-- Dark theme background -->
<div class="bg-game-bg">

<!-- Positive values (gains, calls, ITM) -->
<span class="text-matrix-green">+$425</span>

<!-- Negative values (losses, puts, OTM) -->
<span class="text-red-500">-$250</span>

<!-- Card containers -->
<div class="bg-card-bg rounded-lg p-4 shadow-lg">
```

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
   ```
   Stock up $5 with 0.85 delta → Value increases by $425
   Theta of -$2.50/day → Value decreases by $2.50
   Net: +$422.50
   ```

2. **Short Call Expiry:**
   ```
   ATM call at expiration (DTE=0) → Worth $0 (no extrinsic)
   $5 ITM call at expiration → Worth $500 (intrinsic only)
   ```

3. **Weekly P&L Attribution:**
   ```
   Weekly P&L = LEAPS Stock Impact + LEAPS Theta + Call P&L ± Roll Cost
   Must balance exactly - no unexplained gaps
   ```

### Automated Test Files

| File | Purpose |
|------|---------|
| `test_short_call_expiry.py` | Validates expiry behavior |
| `test_weekly_call_pricing.py` | Validates weekly pricing |
| `validate_montecarlo_pricing.py` | Validates MC pricing |
| `verify_pnl_calculations.py` | Validates P&L math |
| `compare_ts_python_pricing.py` | Cross-language validation |

### Monte Carlo Validation

```bash
python3 validate_montecarlo_pricing.py
```

Checks:
- Strike calculations use percentages (not dollars)
- OTM decay curve matches minimal game
- Base premium at $450 (not $650)
- P&L attribution balances exactly

---

## Deployment Process

### Vercel Deployment

**Configuration (vercel.json):**
```json
{
  "version": 2,
  "builds": [{ "src": "turtle-tracker/**", "use": "@vercel/static" }],
  "routes": [
    { "src": "/", "dest": "/turtle-tracker/index.html" },
    { "src": "/(.*)", "dest": "/turtle-tracker/$1" }
  ]
}
```

**Deploy Commands:**
```bash
# Option 1: Vercel CLI
npm i -g vercel
vercel --prod

# Option 2: Git Integration (recommended)
git add .
git commit -m "Description of changes"
git push origin main
# Vercel auto-deploys from main branch

# Option 3: Drag & Drop (easiest)
# Go to vercel.com and drag compact-game/ folder
```

### Deployment Configuration

| Directory | Purpose |
|-----------|---------|
| `turtle-game/dist/` | Build output from `npm run build` |
| `compact-game/` | Static HTML (no build needed) |
| `turtle-tracker/` | Static HTML with API integration |

**No Backend Required:** Uses localStorage for persistence.

### Pre-deployment Checklist

1. [ ] Run `npm run build` - ensure no TypeScript errors
2. [ ] Run Python validation tests
3. [ ] Validate pricing: Python vs TypeScript outputs match
4. [ ] Test game flow: Open LEAPS → Sell Call → Run Week → Verify P&L
5. [ ] Check localStorage persistence (refresh page, data should remain)
6. [ ] Test trade correction feature (compact-game)

---

## Key Design Decisions

### 1. Simplified Pricing (Not Black-Scholes)

**Decision:** Use linear, deterministic calculations instead of Black-Scholes.

**Rationale:**
- Educational clarity - users can verify calculations by hand
- No complex math dependencies
- Predictable behavior for teaching
- ~7.8% error vs real market data (acceptable for education)

### 2. Dual Implementation (Python + TypeScript)

**Decision:** Maintain identical logic in Python (validation) and TypeScript (production).

**Rationale:**
- Python for rapid prototyping and analysis
- TypeScript for browser execution
- Cross-validation catches bugs
- Python results are "source of truth"

### 3. Multiple Game Versions

| Version | File | Purpose | Status |
|---------|------|---------|--------|
| Minimal | `turtle-game/minimal-game.html` | Quick testing, mobile-friendly | ✅ Complete |
| Compact | `compact-game/index.html` | Full dashboard, desktop-optimized | ✅ Complete |
| Full TS | `turtle-game/src/` | Extensible, tutorial mode, Monte Carlo | 🚧 In Development |
| Tracker | `turtle-tracker/index.html` | Real trade tracking with API | ✅ Complete |

### 4. localStorage Persistence

**Decision:** Use browser localStorage instead of backend database.

**Pros:**
- Zero hosting costs
- No user accounts needed
- Instant deployment
- Works offline

**Cons:**
- Data tied to browser
- No cross-device sync
- Cleared if user clears browser data

**Storage Keys:**
```javascript
localStorage.setItem('turtleGame_save', JSON.stringify(gameState));
localStorage.setItem('turtleGame_tradeHistory', JSON.stringify(trades));
```

---

## Common Pitfalls

### 1. Strike Calculation Bug (CRITICAL)

**Wrong:**
```typescript
strike = price + offset  // Treats offset as dollars
```

**Right:**
```typescript
strike = price * (1 + offset / 100)  // Treats offset as percentage
```

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

### 5. Import Path Issues

**Correct:**
```typescript
import type { Portfolio } from '../types';
import { calculateDelta } from './simplifiedPricing';
```

**Incorrect (missing `.ts` extension not needed with bundler):**
```typescript
import type { Portfolio } from '../types.js';  // Don't add .js
```

---

## Trade Correction Feature (compact-game)

The compact-game includes a **Trade History & Correction** feature to fix data entry errors (e.g., entering $7.45 instead of $745 when closing a position).

### How It Works

1. **Automatic Trade Logging:** Every trade (LEAPS open, short call sell, buyback, weekly results) is recorded to localStorage
2. **Correction UI:** Click the "📜 History" button in the header to view all trades
3. **Edit Values:** Click "Edit Values" on any trade to modify the recorded amounts
4. **Auto-Recalculation:** When a trade is corrected, the entire portfolio state is recalculated from that point forward

### Trade Types Tracked

| Trade Type | Editable Fields | Storage Key |
|------------|-----------------|-------------|
| `OPEN_LEAPS` | Premium paid | `turtleGame_tradeHistory` |
| `SELL_CALL` | Premium collected | `turtleGame_tradeHistory` |
| `CLOSE_LEAPS` | Close value | `turtleGame_tradeHistory` |
| `BUY_BACK_CALL` | Buyback cost | `turtleGame_tradeHistory` |
| `WEEKLY_RESULT` | Ending balance | `turtleGame_tradeHistory` |

### Implementation Details

**Storage:**
```javascript
// Trade history stored in localStorage
turtleGame_tradeHistory: [{
  id: string,
  type: 'OPEN_LEAPS' | 'SELL_CALL' | ...,
  timestamp: number,
  data: { ... },
  corrected?: boolean,
  originalData?: { ... }
}]
```

**Recalculation Logic:**
```javascript
// Rebuild state up to the corrected trade
const workingState = rebuildStateUpToIndex(tradeIndex);

// Reapply all subsequent trades
for (const trade of tradesToReprocess) {
    workingState = applyTradeToState(workingState, trade);
}
```

### Reset Behavior

- **Reset Game:** Clears both game state AND trade history
- **New Game:** Starts with fresh trade history

---

## Security Considerations

1. **No Backend:** All data stays in browser localStorage - no server-side vulnerabilities

2. **No User Input Parsing:** CSV imports use simple string split (no `eval` or dynamic execution)
   ```javascript
   // Safe parsing
   const rows = csvText.split('\n').map(row => row.split(','));
   ```

3. **API Keys:** Alpha Vantage key is public in source code (acceptable for free tier with rate limits)
   ```javascript
   // Key is hardcoded in source - free tier, 25 requests/day
   const API_KEY = 'VAD1Q74JGQ6JTG42';
   ```

4. **XSS Prevention:** 
   - `textContent` preferred over `innerHTML`
   - Minimal use of `innerHTML` only for trusted template literals
   - No user-generated HTML rendering

5. **CORS:** API calls to Alpha Vantage are client-side only (no proxy needed for GET requests)

---

## External Dependencies

### APIs

**Alpha Vantage:**
- Purpose: Live stock prices
- Key: `VAD1Q74JGQ6JTG42` (pre-configured)
- Endpoint: `https://www.alphavantage.co/query`
- Limits: 25 calls/day (free tier)
- Usage: IWM price fetching in turtle-tracker

### NPM Packages (turtle-game/)

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | ^7.2.4 | Build tool and dev server |
| `typescript` | ~5.9.3 | Language compiler |
| `tailwindcss` | ^4.1.18 | Utility-first CSS |
| `@tailwindcss/postcss` | ^4.1.18 | Tailwind v4 PostCSS plugin |
| `postcss` | ^8.5.6 | CSS processing |
| `autoprefixer` | ^10.4.23 | CSS vendor prefixes |
| `chart.js` | ^4.5.1 | Chart rendering |

---

## Documentation Files

| File | Purpose | Status |
|------|---------|--------|
| `turtle-spec.md` | Full game specification with 4 development phases | Complete |
| `CONTEXT.md` | Current session progress and recent changes | Updated per session |
| `DEPLOYMENT.md` | Vercel deployment guide | Complete |
| `DELTA_SYSTEM_SUMMARY.md` | Delta calculation implementation | Reference |
| `MONTECARLO_STATUS.md` | Monte Carlo simulation status | Reference |
| `MONTECARLO_PRICING_FIX.md` | MC pricing fixes history | Historical |
| `ROLLING_CRITERIA_CORRECTED.md` | LEAPS rolling rules | Reference |
| `PNL_FIXES_SUMMARY.md` | P&L calculation fixes history | Historical |
| `PNL_BUGS_FIXED.md` | Specific P&L bugs and fixes | Historical |
| `TREND_FOLLOWING_ISSUE.md` | Analysis of strategy underperformance | Historical |
| `LEAPS_CALCULATION_FLAW.md` | LEAPS calculation issues | Historical |
| `REMAINING_ISSUES.md` | Known outstanding issues | Active |

---

## Getting Started for New Agents

### Step 1: Understand the Strategy

1. Read `turtle-spec.md` sections on Tutorial 1-2
2. Understand LEAPS (long-term deep ITM calls)
3. Understand covered calls (selling weekly calls against LEAPS)

### Step 2: Run the Games

```bash
# Play the streamlined version
open compact-game/index.html

# Run the full TypeScript game
cd turtle-game && npm run dev
```

### Step 3: Study the Pricing

1. Read `turtle-game/src/lib/pricing/simplifiedPricing.ts`
2. Run Python and TypeScript tests side-by-side
3. Verify they produce identical outputs

```bash
python3 simplified_trading_simulator.py
cd turtle-game && npx tsx src/lib/pricing/testSimplifiedPricing.ts
```

### Step 4: Explore Monte Carlo

```bash
cd turtle-game
npm run dev
# Navigate to Monte Carlo tab in browser
```

### Step 5: Check Recent Context

1. Read `CONTEXT.md` for current status
2. Read `START_FRESH.md` for previous session context
3. Check `REMAINING_ISSUES.md` for known bugs

---

## License

MIT License - Educational project open for contributions.

---

*Built with Claude Code ⚡*
