Monte Carlo Simulation Module Implementation Plan                                               

 Context

 Adding a Monte Carlo simulation mode to the Turtle Trading Simulator to enable users to
 backtest different PMCC strike selection strategies across thousands of randomized market
 scenarios. This will answer the critical question: "Does actively managing short call strikes
 based on market conditions (PMCC) outperform simply holding LEAPS naked?"

 The simulation will:
 - Generate 1,000+ realistic market paths (52 weeks each) with fat-tailed returns, volatility
 clustering, and realistic VIX behavior
 - Allow users to define custom strike selection rules (e.g., "If VIX > 30, go uncovered" or "If
  price below 8-week MA, sell ITM")
 - Compare multiple strategies side-by-side using the same market paths
 - Provide comprehensive statistics and visualizations to identify which approaches work best

 This directly addresses the user's need to validate and optimize their PMCC strategy before
 deploying real capital.

 Integration Approach

 Separate HTML entry point: montecarlo.html
 - Add "Monte Carlo" button in GameScreen header (top-right)
 - Opens Monte Carlo simulator in new tab/window
 - Clean separation from game logic
 - No modifications to core game state management

 Architecture Overview

 File Structure

 New files to create:
 turtle-game/
 ├── montecarlo.html                          # New entry point
 ├── src/
 │   ├── montecarlo-main.ts                   # Monte Carlo app initialization
 │   ├── lib/
 │   │   ├── montecarlo/
 │   │   │   ├── types.ts                     # TypeScript interfaces
 │   │   │   ├── randomGenerators.ts          # Seedable RNG, Student's t, vol clustering
 │   │   │   ├── marketSimulator.ts           # Weekly market path generation
 │   │   │   ├── ruleEngine.ts                # Strike selection rule evaluation
 │   │   │   ├── simulationRunner.ts          # Core: run single 52-week path
 │   │   │   ├── resultsAnalyzer.ts           # Aggregate statistics calculation
 │   │   │   └── presetRules.ts               # 4 preset rule sets
 │   │   └── workers/
 │   │       └── montecarloWorker.ts          # Web Worker for background computation
 │   └── components/
 │       └── MonteCarlo/
 │           ├── MonteCarloScreen.ts          # Main orchestrator component
 │           ├── ParameterPanel.ts            # Config inputs (paths, weeks, capital)
 │           ├── RuleEditor.ts                # Rule builder UI
 │           ├── ResultsView.ts               # Summary table + chart container
 │           └── PathInspector.ts             # Modal to view week-by-week path details

 Modified files:
 turtle-game/src/components/GameScreen.ts     # Add "Monte Carlo" button in header

 Key Dependencies

 Existing functions to reuse (DO NOT rebuild):
 - calculateOptionPrice() from /turtle-game/src/lib/pricing/optionsPricing.ts
 - calculateLEAPSValue() from /turtle-game/src/lib/game/positionManager.ts
 - calculateShortCallValue() from /turtle-game/src/lib/game/positionManager.ts
 - estimateDelta() from /turtle-game/src/lib/pricing/optionsPricing.ts

 New external dependency:
 - Chart.js v4 (for histograms, line charts, radar charts)
 - Install: npm install chart.js

 Implementation Steps

 Phase 1: Random Number Generation & Market Simulation

 File: randomGenerators.ts
 - Implement Mulberry32 seedable RNG class
 - Box-Muller transform for standard normal (reuse pattern from priceGenerator.ts)
 - Student's t distribution (df=5) using ratio-of-uniforms method
 - Volatility clustering state machine (tracks high-vol regime, decays over 2-4 weeks)

 File: marketSimulator.ts
 - Weekly price generation: mean=+0.15%, stdDev=2% (dynamic with clustering)
 - VIX generation: inverse correlation with price (-2x), mean reversion to 16, own randomness
 - Regime classification: compute VIX trend (4-week), price vs 8-week MA, VIX level buckets

 Phase 2: Rule Engine

 File: ruleEngine.ts

 Rule data structure:
 type Condition =
   | { type: 'vix_level'; operator: '<' | '>'; value: number }
   | { type: 'vix_trend'; direction: 'rising' | 'falling'; weeks: number }
   | { type: 'price_trend'; direction: 'above_ma' | 'below_ma'; periods: number }
   | { type: 'drawdown'; operator: '>'; percent: number }
   | { type: 'consecutive_weeks'; direction: 'up' | 'down'; count: number };

 type Action =
   | { type: 'sell_call'; moneyness: 'atm' | 'otm' | 'itm'; offset: number }
   | { type: 'go_uncovered' };

 interface Rule {
   conditions: Condition[];  // AND logic
   action: Action;
   priority: number;
 }

 interface RuleSet {
   name: string;
   description: string;
   rules: Rule[];
 }

 Rule evaluation:
 - Sort rules by priority (high to low)
 - For each rule, check if ALL conditions match current market state
 - Return first matching rule's action
 - Always include default rule (empty conditions, priority=1)

 File: presetRules.ts

 Implement 4 preset rule sets as specified:

 1. Conservative: ITM strikes in high VIX, uncovered when VIX>30 and rising, snapback rule for
 >15% drawdown + 2 consecutive up weeks
 2. Aggressive Premium: Sell 3% ITM when VIX>40, 1% ITM when VIX>25, ATM otherwise
 3. Passive/Fixed: Always sell 1% OTM (baseline)
 4. Trend Following: 2% OTM when above 8-week MA, ATM/ITM when below, uncovered on snapback

 Phase 3: Core Simulation Logic

 File: simulationRunner.ts

 Core function: runSinglePath(config, ruleSet, strategy, rng)

 Weekly loop (52 iterations):
 1. Generate weekly return using studentT(rng, 5) scaled by volatility state
 2. Update price and VIX (inverse correlation + mean reversion)
 3. Update volatility clustering state (check if large negative move triggers high-vol regime)
 4. Recalculate LEAPS value using existing calculateOptionPrice()
 5. Update/expire short call:
   - If DTE=0 and ITM: assignment (cash -= intrinsic value)
   - If DTE=0 and OTM: expires worthless (profit = premium)
   - If DTE>0: mark to market using calculateShortCallValue()
 6. Calculate week-end account value: cash + leapsValue - shortCallValue
 7. Check blowup: if accountValue < startingCash * 0.10, terminate path early
 8. Check LEAPS rolling:
   - If delta < 0.50 OR dte < 60: sell current, buy new (target 0.70-0.85 delta)
   - Deduct roll cost from cash
 9. Sell new short call (if PMCC strategy and no current short):
   - Evaluate rules to get action
   - If action = 'sell_call': calculate strike based on moneyness + offset
   - Price using calculateOptionPrice(), collect premium (cash += premium)
   - If action = 'go_uncovered': skip selling this week
 10. Record week snapshot (price, VIX, account value, regime, action taken)
 11. Update price/VIX history arrays for moving average calculations

 Return: PathResult with final value, weekly history, max drawdown, blowup status

 File: resultsAnalyzer.ts

 Aggregate 1000 paths into summary statistics:
 - Survival rate: (paths not blown up) / total paths
 - Win rate: (surviving paths with final value > starting) / surviving paths
 - Median/Mean final value: percentile calculations
 - Std dev of final values
 - CVaR (95%): average of worst 5% of outcomes
 - Max drawdown: median and worst across all paths
 - Weekly P&L stats: avg winning week, avg losing week, % win weeks

 Phase 4: Web Worker Implementation

 File: montecarloWorker.ts

 Worker message handling:
 // Received from main thread
 interface SimulationRequest {
   type: 'START_SIMULATION';
   payload: {
     seed: number;
     numPaths: number;
     numWeeks: number;
     startingCash: number;
     leapsAllocation: number;  // 0.40 default
     initialPrice: number;
     initialVIX: number;
     ruleSets: RuleSet[];      // 1-4 rule sets
     strategies: ('naked_leaps' | 'pmcc')[];
   };
 }

 Worker algorithm:
 1. Initialize seedable RNG with config.seed
 2. For each strategy × rule set combination:
   - For path = 1 to N:
       - Call runSinglePath(config, ruleSet, strategy, rng)
     - Store PathResult
     - Every 50 paths: postMessage({ type: 'PROGRESS', pathsCompleted, totalPaths })
   - Aggregate results using resultsAnalyzer
 3. postMessage({ type: 'COMPLETE', results })

 Performance optimization:
 - Process in chunks to avoid blocking worker thread
 - Reuse objects where possible (minimize allocations)
 - Batch progress updates (not every path)

 Phase 5: UI Components

 File: MonteCarloScreen.ts

 Main orchestrator component following GameScreen.ts pattern:
 - Constructor: constructor(container: HTMLElement)
 - Create 2-column layout:
   - Left (4 cols): ParameterPanel + RuleEditor stacked
   - Right (8 cols): ResultsView
 - Progress overlay (fixed position, hidden by default)
 - Worker management:
   - Create worker on run
   - Listen for PROGRESS and COMPLETE messages
   - Terminate worker after completion
 - Export CSV: summary stats in rows (one per strategy/rule set combo)

 File: ParameterPanel.ts

 Configuration inputs (all with sensible defaults):
 - Number of paths: 1000 (range: 100-5000)
 - Number of weeks: 52 (range: 12-104)
 - Starting cash: $20,000
 - LEAPS allocation: 40% (range: 20-80%)
 - Initial SPY price: $590
 - Initial VIX: 16
 - Random seed: Auto-generate or manual input
 - "Run Simulation" button (green, matrix-themed)

 File: RuleEditor.ts

 Rule set selection and editing:
 - Dropdown: "Conservative" | "Aggressive Premium" | "Passive/Fixed" | "Trend Following" |
 "Custom"
 - When preset selected: load preset rules, display read-only (with "Edit" button to copy to
 custom)
 - Custom mode:
   - List of rules (cards with priority order)
   - "Add Rule" button → opens modal with condition builder
   - Conditions: dropdown selectors for type, operators, values
   - Action: radio buttons for ATM/OTM/ITM + offset input
   - Delete button per rule
 - "Compare Rule Sets" mode: checkbox to enable, select up to 4 rule sets

 File: ResultsView.ts

 Summary table + charts:

 Table layout (row per strategy/rule set):

 ┌──────────┬───────┬──────────┬───────┬──────────┬─────────┬──────┬────────┬─────┬──────────┐
 │          │ Rule  │          │ Win   │ Median   │  Mean   │ Std  │ CVaR   │ Max │   Avg    │
 │ Strategy │  Set  │ Survival │ Rate  │  Return  │ Return  │ Dev  │ (95%)  │  DD │ Weekly   │
 │          │       │          │       │          │         │      │        │     │   P&L    │
 ├──────────┼───────┼──────────┼───────┼──────────┼─────────┼──────┼────────┼─────┼──────────┤
 └──────────┴───────┴──────────┴───────┴──────────┴─────────┴──────┴────────┴─────┴──────────┘

 Charts (using Chart.js):

 1. Histogram (Terminal Wealth Distribution):
   - X-axis: Final account value bins (20-30 bins)
   - Y-axis: Frequency
   - Overlaid bars for multiple strategies (different colors)
   - Vertical line at starting value ($20k)
 2. Survival Curve:
   - X-axis: Week (0-52)
   - Y-axis: % paths still alive
   - Line chart with multiple lines for strategy comparison
   - Filled area under curve
 3. Spaghetti Chart (Sample Paths):
   - X-axis: Week
   - Y-axis: Account value
   - 50 random paths (thin, semi-transparent lines)
   - Median path (bold, bright line)
   - Toggle strategies on/off
 4. Regime Breakdown (Bar chart):
   - Group paths by market outcome: Bull (>+10%), Flat (-5% to +10%), Bear (<-5%)
   - Show win rate per strategy within each regime
   - Stacked or grouped bars
 5. Radar Chart (Rule Set Comparison, if comparing multiple):
   - Axes: Win Rate, Survival Rate, Median Return, Best Case, Worst Case
   - Normalize to 0-100 scale
   - Overlay polygons for each rule set

 File: PathInspector.ts

 Modal component (full-screen overlay):
 - Triggered by clicking on histogram bar or path in spaghetti chart
 - Shows week-by-week table for selected path:
   - Week | Price | VIX | Account Value | LEAPS Value | Short Call Value | Weekly P&L | Regime |
  Action Taken
 - Mini line chart of account value over 52 weeks
 - "Close" button

 Phase 6: Chart.js Integration

 Install dependency:
 npm install chart.js

 Chart configuration:
 - Dark theme: black background, matrix green accents, gray grid
 - Custom tooltip styling (dark with green border)
 - Responsive: maintainAspectRatio: false
 - Reusable chart factory functions for each chart type

 Example configuration:
 import { Chart, registerables } from 'chart.js';
 Chart.register(...registerables);

 function createHistogram(canvas: HTMLCanvasElement, data: number[][]) {
   return new Chart(canvas, {
     type: 'bar',
     data: {
       labels: binLabels,
       datasets: [
         { label: 'PMCC', data: pmccFrequencies, backgroundColor: '#00ff4180' },
         { label: 'Naked LEAPS', data: nakedFrequencies, backgroundColor: '#ff4d4d80' }
       ]
     },
     options: {
       responsive: true,
       maintainAspectRatio: false,
       scales: {
         y: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } },
         x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } }
       },
       plugins: {
         legend: { labels: { color: '#00ff41' } }
       }
     }
   });
 }

 Phase 7: Integration with GameScreen

 Modify GameScreen.ts (lines 60-90):

 Add Monte Carlo button in header:
 <div class="flex justify-between items-center mb-4">
   <h1 class="text-3xl font-bold text-matrix-green">🐢 Turtle Strategy Simulator</h1>
   <button
     id="open-montecarlo"
     class="btn btn-primary"
   >
     📊 Monte Carlo Simulator
   </button>
 </div>

 Event listener:
 const mcButton = document.getElementById('open-montecarlo');
 mcButton?.addEventListener('click', () => {
   window.open('/montecarlo.html', '_blank');
 });

 TypeScript Interfaces (types.ts)

 export interface SimulationConfig {
   seed: number;
   numPaths: number;
   numWeeks: number;
   startingCash: number;
   leapsAllocation: number;
   initialPrice: number;
   initialVIX: number;
   blowupThreshold: number;  // 0.10 = 10% of starting
   leapsRollDeltaThreshold: number;  // 0.50
   leapsRollDTEThreshold: number;    // 60 days
 }

 export interface PathResult {
   pathId: number;
   blownUp: boolean;
   blowupWeek?: number;
   finalValue: number;
   totalReturn: number;  // Percentage
   maxDrawdown: number;  // Percentage
   weeklyHistory: WeekSnapshot[];
 }

 export interface WeekSnapshot {
   week: number;
   price: number;
   vix: number;
   accountValue: number;
   cash: number;
   leapsValue: number;
   shortCallValue: number;
   weeklyReturn: number;  // Price return
   weeklyPnL: number;     // Account P&L
   regime: string;        // "High VIX Rising", "Low VIX Flat", etc.
   action: string;        // "Sold 595C" or "Uncovered"
 }

 export interface SimulationResults {
   strategy: 'naked_leaps' | 'pmcc';
   ruleSetName: string;
   numPaths: number;

   // Survival & Win Rates
   survivalRate: number;  // 0-100%
   winRate: number;       // 0-100%

   // Final Value Distribution
   medianFinalValue: number;
   meanFinalValue: number;
   stdDevFinalValue: number;
   percentile5: number;   // Worst 5%
   percentile95: number;  // Best 5%
   cvar95: number;        // Average of worst 5%

   // Drawdown
   medianMaxDrawdown: number;
   worstDrawdown: number;

   // Weekly P&L
   avgWeeklyPnL: number;
   avgWinningWeekPnL: number;
   avgLosingWeekPnL: number;
   winWeekPercentage: number;

   // Raw path data (for charts)
   allPathResults: PathResult[];
 }

 Verification & Testing

 Manual Testing Steps

 1. Open Monte Carlo simulator:
   - Run npm run dev
   - Open game at http://localhost:5173
   - Click "Monte Carlo Simulator" button
   - Verify new tab opens with Monte Carlo UI
 2. Test Parameter Panel:
   - Adjust number of paths (100 for quick test)
   - Change starting cash, LEAPS allocation
   - Verify validation (min/max ranges)
 3. Test Rule Editor:
   - Select "Conservative" preset → verify rules display
   - Select "Passive/Fixed" → verify single rule
   - Add custom rule: "If VIX > 25, sell ATM"
   - Verify rule appears in list
 4. Run Simulation:
   - Click "Run Simulation" with Conservative preset, PMCC strategy, 100 paths
   - Verify progress overlay appears
   - Verify progress bar updates (0% → 100%)
   - Wait for completion (should be < 2 seconds for 100 paths)
 5. Verify Results:
   - Check summary table: Survival Rate should be 85-95%
   - Win Rate should be 60-75%
   - Median return should be positive (5-15%)
   - Verify CVaR is negative (tail risk)
 6. Test Charts:
   - Histogram: Should show bell curve centered around $22-25k
   - Survival Curve: Should start at 100%, gradually decline to 85-95%
   - Spaghetti Chart: Should show 50 paths with variation
   - Regime Breakdown: Should categorize into Bull/Flat/Bear
 7. Test Comparisons:
   - Enable "Compare Rule Sets"
   - Select: Conservative, Aggressive, Passive
   - Run simulation (300 paths total)
   - Verify results table has 3 rows
   - Verify radar chart shows 3 overlapping polygons
   - Conservative should show higher survival, lower mean
   - Aggressive should show higher mean, lower survival
 8. Test Path Inspector:
   - Click on a bar in histogram
   - Verify modal opens with week-by-week table
   - Verify weekly data shows price changes, VIX, actions
   - Close modal
 9. Test CSV Export:
   - Click "Export CSV" button
   - Verify file downloads
   - Open in spreadsheet: should have columns for Strategy, Rule Set, Survival Rate, Win Rate,
 etc.
   - Verify numbers match summary table
 10. Test Edge Cases:
   - Run with VIX starting at 40 (high volatility)
   - Run with only 10 paths (verify still works)
   - Run Naked LEAPS vs PMCC side-by-side
   - Verify Naked LEAPS has wider distribution (higher variance)

 Performance Verification

 - Target: 1000 paths in < 10 seconds
 - Run with 1000 paths, time completion
 - Should complete in 5-8 seconds on modern hardware
 - Progress bar should update smoothly (every 50 paths)
 - UI should remain responsive during computation (verify can switch tabs)

 Expected Outcomes (Validation)

 Based on options pricing theory and historical market behavior:

 1. PMCC vs Naked LEAPS:
   - PMCC should show higher survival rate (5-10% better)
   - PMCC should show higher win rate (10-15% better)
   - PMCC should show tighter distribution (lower std dev)
   - Naked LEAPS should show higher mean (more upside potential)
   - Naked LEAPS should show worse CVaR (worse tail risk)
 2. Rule Set Performance:
   - Conservative: Highest survival, lowest variance, moderate returns
   - Aggressive: Higher returns, lower survival, higher variance
   - Passive: Baseline, middle ground
   - Trend Following: Performance varies by market regime
 3. Market Regime Breakdown:
   - Bull markets: All strategies profit, Naked LEAPS leads
   - Bear markets: PMCC protects capital, Naked LEAPS suffers
   - Flat markets: PMCC generates steady premium, Naked LEAPS bleeds theta

 If these patterns don't emerge, investigate:
 - Pricing model calibration (VIX multipliers, theta decay)
 - Rule logic bugs (conditions not evaluating correctly)
 - Random number generation (verify fat tails actually occurring)

 Critical Files Summary

 5 most critical files (implementation priority):

 1. /turtle-game/src/lib/montecarlo/simulationRunner.ts - Core weekly simulation loop
 2. /turtle-game/src/lib/workers/montecarloWorker.ts - Background computation & progress
 3. /turtle-game/src/lib/montecarlo/ruleEngine.ts - Strike selection logic
 4. /turtle-game/src/lib/montecarlo/randomGenerators.ts - Realistic market behavior
 5. /turtle-game/src/components/MonteCarlo/MonteCarloScreen.ts - Main UI orchestrator

 Supporting files (secondary priority):
 - /turtle-game/src/lib/montecarlo/resultsAnalyzer.ts
 - /turtle-game/src/components/MonteCarlo/ResultsView.ts
 - /turtle-game/src/components/MonteCarlo/ParameterPanel.ts
 - /turtle-game/src/components/MonteCarlo/RuleEditor.ts

 Styling Notes

 - Use Tailwind CSS + custom theme variables from style.css
 - Primary color: #00ff41 (matrix green)
 - Background: #0b0f0f (dark)
 - Card background: #1a1f1f
 - Chart.js theme: Match dark background, green accents, gray grid
 - Button styles: .btn-primary (green), .btn-secondary (gray)
 - Progress bar: Green fill on dark gray background
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
