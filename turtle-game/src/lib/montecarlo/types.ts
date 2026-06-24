// Monte Carlo Simulation TypeScript Interfaces

// ===== Core Configuration =====

export interface SimulationConfig {
  seed: number;
  numPaths: number;
  numWeeks: number;
  startingCash: number;
  leapsAllocation: number;  // 0.40 = 40%
  initialPrice: number;
  initialVIX: number;
  blowupThreshold: number;  // 0.10 = 10% of starting value
  leapsRollDeltaThreshold: number;  // 0.70 (roll down before ATM death spiral)
  leapsRollDTEThreshold: number;    // 180 days (roll before theta accelerates)
}

// ===== Path Results =====

export interface WeekSnapshot {
  week: number;
  price: number;
  vix: number;
  accountValue: number;
  cash: number;
  leapsValue: number;
  shortCallValue: number;
  shortCallPremium: number;  // Premium of currently open call (total, not per contract)
  shortCallStrike?: number;  // Strike price of the short call sold this week
  weeklyReturn: number;  // Price return percentage
  weeklyPnL: number;     // Account P&L
  regime: string;        // "High VIX Rising", "Low VIX Flat", etc.
  action: string;        // "Sold 595C" or "Uncovered" or "Rolled LEAPS"

  // LEAPS P&L Attribution (for detailed breakdown)
  leapsIntrinsic: number;      // Intrinsic value component (per contract)
  leapsExtrinsic: number;      // Extrinsic/theta component (per contract)
  leapsDelta: number;          // Delta of LEAPS position
  leapsStockImpact?: number;   // P&L from stock movement (delta × price change)
  leapsThetaDecay?: number;    // Theta decay for the week
  rollCost?: number;           // Net cost if LEAPS was rolled this week

  // Short Call P&L Attribution
  expiredCallPremium?: number;     // Premium from call that expired this week
  expiredCallFinalValue?: number;  // Final value of expired call (assignment cost or 0)
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

// ===== Aggregated Results =====

export interface SimulationResults {
  strategy: 'naked_leaps' | 'pmcc';
  ruleSetName: string;
  numPaths: number;

  // Survival & Win Rates
  survivalRate: number;  // 0-100%
  winRate: number;       // 0-100% (of surviving paths)

  // Final Value Distribution
  medianFinalValue: number;
  meanFinalValue: number;
  stdDevFinalValue: number;
  percentile5: number;   // Worst 5%
  percentile95: number;  // Best 5%
  cvar95: number;        // Conditional Value at Risk - Average of worst 5%

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

// ===== Rule Engine Types =====

export type VIXLevelCondition = {
  type: 'vix_level';
  operator: '<' | '>' | '<=' | '>=';
  value: number;
};

export type VIXTrendCondition = {
  type: 'vix_trend';
  direction: 'rising' | 'falling' | 'flat';
  weeks: number;
};

export type PriceTrendCondition = {
  type: 'price_trend';
  direction: 'above_ma' | 'below_ma';
  periods: number;
};

export type DrawdownCondition = {
  type: 'drawdown';
  operator: '>' | '<';
  percent: number;
};

export type ConsecutiveWeeksCondition = {
  type: 'consecutive_weeks';
  direction: 'up' | 'down';
  count: number;
};

export type Condition =
  | VIXLevelCondition
  | VIXTrendCondition
  | PriceTrendCondition
  | DrawdownCondition
  | ConsecutiveWeeksCondition;

export type SellCallAction = {
  type: 'sell_call';
  moneyness: 'atm' | 'otm' | 'itm';
  offset: number;  // Dollars from ATM (positive = farther OTM, negative = farther ITM)
};

export type GoUncoveredAction = {
  type: 'go_uncovered';
};

export type Action = SellCallAction | GoUncoveredAction;

export interface Rule {
  conditions: Condition[];  // All must be true (AND logic)
  action: Action;
  priority: number;  // Higher priority evaluated first
  description?: string;  // Human-readable description for UI
}

export interface RuleSet {
  name: string;
  description: string;
  rules: Rule[];
}

// ===== Market Context for Rule Evaluation =====

export interface MarketContext {
  currentVIX: number;
  vixHistory: number[];  // Last N weeks for trend calculation
  priceHistory: number[];  // Last N weeks for MA calculation
  currentPrice: number;
  weeksSinceStart: number;
  accountValue: number;
  startingValue: number;
}

// ===== Volatility Clustering State =====

export interface VolatilityState {
  baseStdDev: number;        // Normal weekly std dev (2%)
  currentStdDev: number;     // Current std dev (can be elevated)
  weeksInHighVol: number;    // Countdown for high-vol regime
  consecutiveDownWeeks: number;  // Track for triggering high vol
}

// ===== Web Worker Messages =====

export interface SimulationRequest {
  type: 'START_SIMULATION';
  payload: {
    config: SimulationConfig;
    ruleSets: RuleSet[];      // 1-4 rule sets for comparison
    strategies: ('naked_leaps' | 'pmcc')[];  // Which strategies to run
  };
}

export interface ProgressUpdate {
  type: 'PROGRESS';
  payload: {
    pathsCompleted: number;
    totalPaths: number;
    percentComplete: number;
    estimatedTimeRemaining: number;  // milliseconds
    currentStrategy: string;
    currentRuleSet: string;
  };
}

export interface SimulationComplete {
  type: 'COMPLETE';
  payload: {
    results: SimulationResults[];  // One per strategy × rule set combo
    totalDurationMs: number;
  };
}

export interface SimulationError {
  type: 'ERROR';
  payload: {
    message: string;
    error: any;
  };
}

export type WorkerMessage = SimulationRequest | ProgressUpdate | SimulationComplete | SimulationError;

// ===== Position Interfaces (for simulation) =====

export interface SimulatedLEAPSPosition {
  strike: number;
  costBasis: number;
  dte: number;
  quantity: number;
  // Incremental tracking (for smooth weekly updates)
  currentValue: number;    // Total value (all contracts)
  intrinsic: number;       // Per contract
  extrinsic: number;       // Per contract
  delta: number;           // Per contract
  theta: number;           // Per day, per contract
  lastStockPrice: number;  // For calculating stock impact
}

export interface SimulatedShortCallPosition {
  strike: number;
  premium: number;
  dte: number;
  quantity: number;
}
