// Options pricing model - matches pricing rules.md specification
// Simplified empirical model for educational purposes

export interface OptionPricingParams {
  stockPrice: number;
  strike: number;
  dte: number; // Days to expiration
  vix: number;
  isCall: boolean;
}

export interface OptionPriceBreakdown {
  intrinsic: number;
  extrinsic: number;
  total: number;
  delta: number;
  theta: number; // Daily decay in dollars
  moneyness: number; // Percent from ATM
  moneynessLabel: string;
}

/**
 * Calculate intrinsic value
 * Multiplied by 100 since options contracts represent 100 shares
 */
function calculateIntrinsic(stockPrice: number, strike: number, isCall: boolean): number {
  if (isCall) {
    return Math.max(0, stockPrice - strike) * 100;
  } else {
    return Math.max(0, strike - stockPrice) * 100;
  }
}

/**
 * Get base premium scaled by DTE
 * Base_Premium = $150 × sqrt(DTE / 7)
 */
function getBasePremium(dte: number): number {
  const baseWeekly = 150; // $150 for 7 DTE at ATM, VIX 15
  return baseWeekly * Math.sqrt(dte / 7);
}

/**
 * Get moneyness multiplier based on distance from ATM
 * Uses linear interpolation within buckets for smooth, continuous pricing
 * From pricing rules.md specification (updated)
 */
function getMoneynessMultiplier(stockPrice: number, strike: number): number {
  const distance = Math.abs(stockPrice - strike);
  const percentAway = distance / stockPrice;

  // Fine granularity for near-ATM (within 1%)
  // Using linear interpolation within buckets
  if (percentAway < 0.001) {
    // Within 0.1% = true ATM
    return 1.00;
  } else if (percentAway < 0.002) {
    // 0.1-0.2% away - linear from 1.00 to 0.98
    return 1.00 - (percentAway - 0.001) / 0.001 * 0.02;
  } else if (percentAway < 0.003) {
    // 0.2-0.3% away
    return 0.98 - (percentAway - 0.002) / 0.001 * 0.02;
  } else if (percentAway < 0.004) {
    // 0.3-0.4% away
    return 0.96 - (percentAway - 0.003) / 0.001 * 0.02;
  } else if (percentAway < 0.005) {
    // 0.4-0.5% away
    return 0.94 - (percentAway - 0.004) / 0.001 * 0.02;
  } else if (percentAway < 0.0075) {
    // 0.5-0.75% away
    return 0.92 - (percentAway - 0.005) / 0.0025 * 0.07;
  } else if (percentAway < 0.01) {
    // 0.75-1% away
    return 0.85 - (percentAway - 0.0075) / 0.0025 * 0.05;
  } else if (percentAway < 0.015) {
    // 1-1.5% away
    return 0.80 - (percentAway - 0.01) / 0.005 * 0.15;
  } else if (percentAway < 0.02) {
    // 1.5-2% away
    return 0.65 - (percentAway - 0.015) / 0.005 * 0.20;
  } else if (percentAway < 0.03) {
    // 2-3% away
    return 0.45 - (percentAway - 0.02) / 0.01 * 0.15;
  } else if (percentAway < 0.04) {
    // 3-4% away
    return 0.30 - (percentAway - 0.03) / 0.01 * 0.15;
  } else {
    // 4%+ away
    return 0.15;
  }
}

/**
 * Get time multiplier based on DTE
 * From pricing rules.md specification
 */
function getTimeMultiplier(dte: number): number {
  if (dte >= 7) return 1.00;       // Full value for 7+ days
  else if (dte >= 5) return 0.90;  // 5-7 days
  else if (dte >= 3) return 0.75;  // 3-5 days
  else if (dte >= 1) return 0.60;  // 1-3 days
  else if (dte > 0) return 0.35;   // Expiration day (0-1 days)
  else return 0.00;                // Expired
}

/**
 * Get volatility multiplier based on VIX
 * For deep ITM options, reduce VIX sensitivity since value is mostly intrinsic
 * Exponential scaling: (VIX / 15)^1.3, scaled down for ITM options
 */
function getVolatilityMultiplier(vix: number, stockPrice: number, strike: number): number {
  const baseVIX = 15; // Normal market baseline
  const baseMultiplier = Math.pow(vix / baseVIX, 1.3);
  const cappedMultiplier = Math.min(baseMultiplier, 5.0); // Cap at 5.0x

  // For deep ITM options, reduce VIX sensitivity
  // Calculate how far ITM the option is
  const moneyness = stockPrice / strike;
  const percentITM = (moneyness - 1) * 100;

  if (percentITM >= 10) {
    // Deep ITM (10%+): Minimal VIX sensitivity
    // Scale the volatility multiplier toward 1.0 based on how deep ITM
    const itm_factor = Math.min((percentITM - 10) / 10, 1.0); // 0 at 10% ITM, 1.0 at 20%+ ITM
    return 1.0 + (cappedMultiplier - 1.0) * (1.0 - itm_factor * 0.8); // Reduce VIX impact by up to 80%
  } else if (percentITM >= 5) {
    // Moderate ITM (5-10%): Reduced VIX sensitivity
    const itm_factor = (percentITM - 5) / 5; // 0 at 5% ITM, 1.0 at 10% ITM
    return 1.0 + (cappedMultiplier - 1.0) * (1.0 - itm_factor * 0.4); // Reduce VIX impact by up to 40%
  }

  // ATM and OTM options: Full VIX sensitivity
  return cappedMultiplier;
}

/**
 * Estimate delta based on moneyness using continuous interpolation
 * For deep ITM LEAPS, delta should be very close to 1.00 since the option
 * value changes almost entirely with intrinsic value (stock price changes)
 */
function estimateDelta(stockPrice: number, strike: number, dte: number, isCall: boolean): number {
  const moneyness = stockPrice / strike;
  const percentFromATM = (moneyness - 1) * 100; // Positive = ITM, Negative = OTM

  let baseDelta: number;

  // For ITM options, delta should approach 1.00 as they get deeper ITM
  // This ensures P&L matches intrinsic value changes
  if (percentFromATM >= 20) {
    // Very deep ITM (20%+): 98-99 delta
    baseDelta = 0.98 + (Math.min(percentFromATM, 40) - 20) / 20 * 0.01;
  } else if (percentFromATM >= 15) {
    // Deep ITM (15-20%): 95-98 delta
    baseDelta = 0.95 + (percentFromATM - 15) / 5 * 0.03;
  } else if (percentFromATM >= 10) {
    // ITM (10-15%): 90-95 delta
    baseDelta = 0.90 + (percentFromATM - 10) / 5 * 0.05;
  } else if (percentFromATM >= 5) {
    // Moderate ITM (5-10%): 80-90 delta
    baseDelta = 0.80 + (percentFromATM - 5) / 5 * 0.10;
  } else if (percentFromATM >= 2) {
    // Slight ITM (2-5%): 65-80 delta
    baseDelta = 0.65 + (percentFromATM - 2) / 3 * 0.15;
  } else if (percentFromATM >= -2) {
    // ATM region (±2%): 50 delta at 0%, tapering to 40%/65% at ±2%
    baseDelta = 0.50 + percentFromATM / 2 * 0.15;
  } else if (percentFromATM >= -5) {
    // Slight OTM (-2 to -5%): 30-35 delta
    baseDelta = 0.30 + (percentFromATM + 5) / 3 * 0.05;
  } else if (percentFromATM >= -10) {
    // OTM (-5 to -10%): 15-30 delta
    baseDelta = 0.15 + (percentFromATM + 10) / 5 * 0.15;
  } else {
    // Deep OTM (< -10%): 2-15 delta
    baseDelta = 0.02 + Math.max(0, (percentFromATM + 20) / 10 * 0.13);
  }

  // Clamp between 0.01 and 0.99
  baseDelta = Math.max(0.01, Math.min(0.99, baseDelta));

  // For puts, delta is negative
  return isCall ? baseDelta : -baseDelta;
}

/**
 * Calculate theta (daily decay) as percentage of extrinsic value
 * From pricing rules.md specification
 */
function calculateTheta(extrinsicValue: number, dte: number): number {
  if (dte === 0) return -extrinsicValue; // Loses all on expiration

  // Accelerating decay
  let decayRate;
  if (dte <= 7) {
    decayRate = 0.14; // Loses ~14% per day
  } else if (dte <= 30) {
    decayRate = 0.05; // Loses ~5% per day
  } else {
    decayRate = 0.02; // Loses ~2% per day
  }

  return -extrinsicValue * decayRate;
}

/**
 * Get moneyness label for display
 */
function getMoneynessLabel(stockPrice: number, strike: number): string {
  const moneyness = ((stockPrice - strike) / stockPrice) * 100;

  if (Math.abs(moneyness) <= 0.5) {
    return 'ATM';
  } else if (moneyness > 0) {
    return `${Math.abs(moneyness).toFixed(1)}% ITM`;
  } else {
    return `${Math.abs(moneyness).toFixed(1)}% OTM`;
  }
}

/**
 * Calculate option price using simplified model
 * Implementation of pricing rules.md
 */
export function calculateOptionPrice(params: OptionPricingParams): OptionPriceBreakdown {
  const { stockPrice, strike, dte, vix, isCall } = params;

  // 1. Calculate intrinsic value
  const intrinsic = calculateIntrinsic(stockPrice, strike, isCall);

  // 2. Calculate extrinsic value
  // Extrinsic = Base_Premium × Moneyness × Time × Volatility
  const basePremium = getBasePremium(dte);
  const moneynessMultiplier = getMoneynessMultiplier(stockPrice, strike);
  const timeMultiplier = getTimeMultiplier(dte);
  const volatilityMultiplier = getVolatilityMultiplier(vix, stockPrice, strike);

  const extrinsic = basePremium * moneynessMultiplier * timeMultiplier * volatilityMultiplier;

  // 3. Total value
  const total = intrinsic + extrinsic;

  // 4. Calculate Greeks
  const delta = estimateDelta(stockPrice, strike, dte, isCall);
  const theta = calculateTheta(extrinsic, dte);

  // 5. Moneyness percentage
  const moneyness = ((stockPrice - strike) / stockPrice) * 100;
  const moneynessLabel = getMoneynessLabel(stockPrice, strike);

  return {
    intrinsic: Math.round(intrinsic),
    extrinsic: Math.round(extrinsic),
    total: Math.round(total),
    delta: Math.round(delta * 1000) / 1000, // 3 decimal places
    theta: Math.round(theta * 100) / 100,   // 2 decimal places
    moneyness: Math.round(moneyness * 10) / 10,
    moneynessLabel,
  };
}

/**
 * Calculate option price after a time period with potential price change
 */
export function calculatePriceAfterDays(
  params: OptionPricingParams,
  daysElapsed: number,
  newStockPrice: number
): OptionPriceBreakdown {
  return calculateOptionPrice({
    ...params,
    stockPrice: newStockPrice,
    dte: Math.max(0, params.dte - daysElapsed),
  });
}

/**
 * Calculate P&L from price movement and time decay
 */
export function calculatePnL(
  initialPrice: OptionPriceBreakdown,
  newPrice: OptionPriceBreakdown
): number {
  return newPrice.total - initialPrice.total;
}
