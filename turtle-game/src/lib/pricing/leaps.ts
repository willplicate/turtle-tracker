// Simplified LEAPS pricing model
// Based on the spec: simplified empirical pricing, not Black-Scholes

export interface LEAPSParams {
  stockPrice: number;
  strike: number;
  dte: number; // Days to expiration
  delta: number; // 0.0 to 1.0
}

export interface LEAPSValue {
  premium: number; // Total cost
  delta: number;
  theta: number; // Daily decay in dollars
  intrinsic: number;
  extrinsic: number;
}

/**
 * Calculate simplified LEAPS value
 * For Tutorial 1, we're using fixed values from the spec:
 * - 85 delta LEAPS
 * - 120 DTE
 * - ~$12,900 cost
 * - Theta: -$2/day
 */
export function calculateLEAPSValue(params: LEAPSParams): LEAPSValue {
  const { stockPrice, strike, dte, delta } = params;

  // Intrinsic value: how much is in-the-money
  const intrinsic = Math.max(0, stockPrice - strike);

  // For tutorial, use simplified extrinsic calculation
  // Base: longer DTE = more extrinsic value
  // For 120 DTE at 85 delta: ~$800 extrinsic (from spec)
  const extrinsicBase = 800;
  const dteFactor = dte / 120; // Scale based on DTE
  const extrinsic = extrinsicBase * dteFactor;

  const premium = intrinsic + extrinsic;

  // Theta: simplified decay rate
  // Further out = lower daily decay
  // For 120 DTE: -$2/day (from spec)
  const theta = -(extrinsicBase / dte);

  return {
    premium,
    delta,
    theta,
    intrinsic,
    extrinsic,
  };
}

/**
 * Calculate LEAPS P&L after a price move
 */
export function calculateLEAPSPnL(
  params: {
    initialValue: {
      premium: number;
      delta: number;
      theta: number;
    };
    stockPriceChange: number;
    daysElapsed: number;
    leapsCost: number; // The initial cost of the LEAPS
  }
): {
  netPnL: number;
  deltaGain: number;
  thetaCost: number;
  newLeapsValue: number;
} {
  const { initialValue, stockPriceChange, daysElapsed, leapsCost } = params;

  // Delta gain/loss
  const deltaGain = stockPriceChange * initialValue.delta * 100;

  // Theta cost
  const thetaCost = initialValue.theta * daysElapsed;

  const netPnL = deltaGain + thetaCost;
  const newLeapsValue = leapsCost + netPnL;

  return { netPnL, deltaGain, thetaCost, newLeapsValue };
}

/**
 * Create a standard LEAPS position for tutorials
 * 85 delta, 120 DTE, based on SPY $590
 */
export function createTutorialLEAPS(stockPrice: number = 590): LEAPSValue {
  // Strike chosen to give 85 delta
  // Deep ITM: strike ~$120 below current price
  const strike = stockPrice - 120;

  return calculateLEAPSValue({
    stockPrice,
    strike,
    dte: 120,
    delta: 0.85,
  });
}
