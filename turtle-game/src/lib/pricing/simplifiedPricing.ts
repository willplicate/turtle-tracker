/**
 * Simplified Educational Pricing Model
 * Matches the Python simplified_trading_simulator.py
 *
 * Key Principles:
 * 1. Fixed theta decay (easy to calculate)
 * 2. Simple delta based on moneyness
 * 3. Linear calculations (verifiable by hand)
 * 4. Minimal complexity for educational clarity
 */

export interface LEAPSPosition {
  strike: number;
  dte: number;
  value: number;
  delta: number;
  theta: number;
  intrinsic: number;
  extrinsic: number;
  costBasis: number;
  lastStockPrice: number;
}

export interface ShortCallPosition {
  strike: number;
  dte: number;
  premiumCollected: number;
  optionValue: number;
}

export interface DailyUpdate {
  value: number;
  delta: number;
  theta: number;
  stockImpact: number;
  thetaImpact: number;
  dailyPnL: number;
}

/**
 * Calculate simple delta based on moneyness
 * Deep ITM (>10%): 0.85-0.90
 * Moderate ITM (5-10%): 0.75-0.85
 * Slight ITM (0-5%): 0.60-0.75
 */
function calculateSimpleDelta(stockPrice: number, strike: number): number {
  const percentITM = ((stockPrice - strike) / stockPrice) * 100;

  if (percentITM >= 15) {
    return 0.90;
  } else if (percentITM >= 10) {
    return 0.85;
  } else if (percentITM >= 5) {
    // Linear interpolation: 0.75 to 0.85
    return 0.75 + ((percentITM - 5) / 5) * 0.10;
  } else if (percentITM >= 0) {
    // Linear interpolation: 0.60 to 0.75
    return 0.60 + (percentITM / 5) * 0.15;
  } else {
    // OTM - not typical for LEAPS strategy
    return Math.max(0.50, 0.60 + (percentITM / 5) * 0.10);
  }
}

/**
 * Calculate simple extrinsic value for LEAPS
 * Rule: $2-3 per day for deep ITM LEAPS
 * Scales with time remaining
 */
function calculateSimpleExtrinsic(
  stockPrice: number,
  strike: number,
  dte: number
): number {
  const percentITM = ((stockPrice - strike) / stockPrice) * 100;

  // Base: $2.50/day for typical LEAPS position
  let dailyExtrinsic = 2.5;

  // Adjustment for moneyness
  if (percentITM >= 12) {
    dailyExtrinsic = 2.0; // Very deep ITM: lower extrinsic
  } else if (percentITM >= 8) {
    dailyExtrinsic = 2.5; // Deep ITM: moderate extrinsic
  } else if (percentITM >= 5) {
    dailyExtrinsic = 3.0; // Moderate ITM: higher extrinsic
  } else {
    dailyExtrinsic = 3.5; // Slight ITM or ATM: highest extrinsic
  }

  return dailyExtrinsic * dte;
}

/**
 * Initialize a new LEAPS position
 */
export function createLEAPSPosition(
  stockPrice: number,
  strike: number,
  dte: number
): LEAPSPosition {
  const intrinsic = Math.max(0, stockPrice - strike) * 100;
  const delta = calculateSimpleDelta(stockPrice, strike);
  const extrinsic = calculateSimpleExtrinsic(stockPrice, strike, dte);
  const value = intrinsic + extrinsic;
  const theta = dte > 0 ? -extrinsic / dte : 0;

  return {
    strike,
    dte,
    value,
    delta,
    theta,
    intrinsic,
    extrinsic,
    costBasis: value,
    lastStockPrice: stockPrice,
  };
}

/**
 * Update LEAPS position after one day
 * Uses delta-based updates (not recalculation)
 */
export function updateLEAPSDay(
  position: LEAPSPosition,
  newStockPrice: number
): { position: LEAPSPosition; update: DailyUpdate } {
  const stockChange = newStockPrice - position.lastStockPrice;

  // Calculate impacts
  const stockImpact = stockChange * position.delta * 100;
  const thetaImpact = position.theta; // theta is already negative

  // Update value
  const newValue = position.value + stockImpact + thetaImpact;
  const newExtrinsic = position.extrinsic + thetaImpact;
  const newIntrinsic = Math.max(0, newStockPrice - position.strike) * 100;
  const newDTE = position.dte - 1;

  // Recalculate theta
  const newTheta = newDTE > 0 ? -newExtrinsic / newDTE : 0;

  // Update delta
  const newDelta = calculateSimpleDelta(newStockPrice, position.strike);

  const updatedPosition: LEAPSPosition = {
    ...position,
    value: newValue,
    delta: newDelta,
    theta: newTheta,
    intrinsic: newIntrinsic,
    extrinsic: newExtrinsic,
    dte: newDTE,
    lastStockPrice: newStockPrice,
  };

  const update: DailyUpdate = {
    value: newValue,
    delta: newDelta,
    theta: newTheta,
    stockImpact,
    thetaImpact,
    dailyPnL: stockImpact + thetaImpact,
  };

  return { position: updatedPosition, update };
}

/**
 * Calculate LEAPS P&L
 */
export function getLEAPSPnL(position: LEAPSPosition): number {
  return position.value - position.costBasis;
}

/**
 * Calculate simple weekly call premium
 * Base: ATM 7 DTE = $150
 * Scales with moneyness and time
 */
function calculateSimpleWeeklyPremium(
  stockPrice: number,
  strike: number,
  dte: number
): number {
  // Intrinsic value
  const intrinsic = Math.max(0, stockPrice - strike) * 100;

  // Extrinsic value
  const distanceFromStrike = stockPrice - strike;
  const percentDiff = (distanceFromStrike / strike) * 100;

  // Base extrinsic for 7 DTE ATM (real market data: $450)
  const baseExtrinsic7DTE = 450;

  // Time scaling (linear for weeklies)
  const timeFactor = dte / 7;

  // Moneyness factor - refined for $1 strikes on high-priced stocks
  // At SPY $590, each $1 = 0.17%, so we need fine granularity
  const absPercent = Math.abs(percentDiff);
  let moneynessFactor: number;

  if (absPercent < 0.1) {
    // Very close to ATM
    moneynessFactor = 1.0;
  } else if (absPercent < 0.2) {
    // 0.1-0.2% away (~1 strike on SPY $600)
    moneynessFactor = 1.0 - (absPercent - 0.1) * 0.4; // 1.0 to 0.96
  } else if (absPercent < 0.35) {
    // 0.2-0.35% away (~2 strikes)
    moneynessFactor = 0.96 - (absPercent - 0.2) * 0.8; // 0.96 to 0.84
  } else if (absPercent < 0.5) {
    // 0.35-0.5% away (~3 strikes)
    moneynessFactor = 0.84 - (absPercent - 0.35) * 1.2; // 0.84 to 0.66
  } else {
    // Further away
    moneynessFactor = Math.max(0.3, 0.66 - (absPercent - 0.5) * 0.8);
  }

  const extrinsic = baseExtrinsic7DTE * timeFactor * moneynessFactor;

  return intrinsic + extrinsic;
}

/**
 * Create a new short call position
 */
export function createShortCallPosition(
  stockPrice: number,
  strike: number,
  dte: number = 7
): ShortCallPosition {
  const premium = calculateSimpleWeeklyPremium(stockPrice, strike, dte);

  return {
    strike,
    dte,
    premiumCollected: premium,
    optionValue: premium,
  };
}

/**
 * Update short call position after one day
 */
export function updateShortCallDay(
  position: ShortCallPosition,
  newStockPrice: number
): {
  position: ShortCallPosition;
  dailyPnL: number;
  expired: boolean;
  finalPnL?: number;
} {
  const oldOptionValue = position.optionValue;
  const newDTE = position.dte - 1;
  const expired = newDTE <= 0;

  // At expiration (DTE=0), option is worth only intrinsic value (no extrinsic)
  let newOptionValue: number;
  if (expired) {
    newOptionValue = Math.max(0, newStockPrice - position.strike) * 100;
  } else {
    // Recalculate option value
    newOptionValue = calculateSimpleWeeklyPremium(
      newStockPrice,
      position.strike,
      newDTE
    );
  }

  // Daily P&L: if option value decreases, we profit (positive)
  const dailyPnL = oldOptionValue - newOptionValue;

  const updatedPosition: ShortCallPosition = {
    ...position,
    dte: Math.max(0, newDTE),
    optionValue: newOptionValue,
  };

  let finalPnL: number | undefined;
  if (expired) {
    finalPnL = position.premiumCollected - newOptionValue;
  }

  return {
    position: updatedPosition,
    dailyPnL,
    expired,
    finalPnL,
  };
}

/**
 * Get short call P&L
 */
export function getShortCallPnL(position: ShortCallPosition): number {
  return position.premiumCollected - position.optionValue;
}

/**
 * Portfolio state with LEAPS and optional short call
 */
export interface Portfolio {
  cash: number;
  leaps: LEAPSPosition | null;
  shortCall: ShortCallPosition | null;
  weekStartValue: number;
  totalStartValue: number;
  currentDay: number;
  currentWeek: number;
}

/**
 * Get total portfolio value
 */
export function getPortfolioValue(portfolio: Portfolio): number {
  let total = portfolio.cash;

  if (portfolio.leaps) {
    total += portfolio.leaps.value;
  }

  if (portfolio.shortCall) {
    // Short call is a liability
    total -= portfolio.shortCall.optionValue;
  }

  return total;
}

/**
 * Get weekly P&L (resets each Monday)
 */
export function getWeeklyPnL(portfolio: Portfolio): number {
  return getPortfolioValue(portfolio) - portfolio.weekStartValue;
}

/**
 * Get total P&L (cumulative)
 */
export function getTotalPnL(portfolio: Portfolio): number {
  return getPortfolioValue(portfolio) - portfolio.totalStartValue;
}

/**
 * Reset weekly P&L counter (call this every Monday)
 */
export function resetWeek(portfolio: Portfolio): Portfolio {
  return {
    ...portfolio,
    weekStartValue: getPortfolioValue(portfolio),
    currentWeek: portfolio.currentWeek + 1,
  };
}
