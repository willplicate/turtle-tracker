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
 * For short-term: sqrt scaling (volatility ~ sqrt of time)
 * For LEAPS (300+ DTE): enhanced scaling to match real market premiums
 * Calibrated: SPY ATM 7 DTE = ~$450, SPY ATM 365 DTE = ~$11,000 at VIX 15
 */
function getBasePremium(dte: number): number {
  const baseWeekly = 450; // $450 for 7 DTE at ATM, VIX 15 (matches minimal game)

  if (dte <= 90) {
    // Short-term: use sqrt scaling
    return baseWeekly * Math.sqrt(dte / 7);
  } else {
    // Long-term: transition from sqrt to linear scaling
    // At 90 DTE: sqrt gives 3.61x = $1,625
    // At 365 DTE: we want ~17x = $7,650 for ATM (adjusted for baseWeekly=450)
    const shortTermPremium = baseWeekly * Math.sqrt(90 / 7); // $1,625
    const daysAbove90 = dte - 90;

    // Add linear component for days beyond 90
    // Target: go from $1,625 at 90 DTE to $7,650 at 365 DTE
    // That's $6,025 over 275 days = $21.91/day
    const linearBonus = daysAbove90 * 21.91;

    return shortTermPremium + linearBonus;
  }
}

/**
 * Get moneyness multiplier based on distance from ATM
 * DTE-AWARE: LEAPS retain more extrinsic value even when deep ITM/OTM
 * Uses steeper decay curve for weekly options (matches minimal game)
 */
function getMoneynessMultiplier(stockPrice: number, strike: number, dte: number): number {
  const distance = Math.abs(stockPrice - strike);
  const percentAway = distance / stockPrice;

  // Base multiplier for weeklies (< 90 DTE)
  // UPDATED: Now matches minimal-game-with-leaps-selector.html curve (much steeper!)
  let baseMultiplier: number;

  // Convert to percentage points for clarity (0.001 = 0.1%)
  const percentAwayPct = percentAway * 100;

  if (percentAwayPct < 0.1) {
    baseMultiplier = 1.0;
  } else if (percentAwayPct < 0.2) {
    // 0.1% → 0.2%: 1.0 → 0.96
    baseMultiplier = 1.0 - (percentAwayPct - 0.1) * 0.4;
  } else if (percentAwayPct < 0.35) {
    // 0.2% → 0.35%: 0.96 → 0.84
    baseMultiplier = 0.96 - (percentAwayPct - 0.2) * 0.8;
  } else if (percentAwayPct < 0.5) {
    // 0.35% → 0.5%: 0.84 → 0.66
    baseMultiplier = 0.84 - (percentAwayPct - 0.35) * 1.2;
  } else {
    // Beyond 0.5%: steep decay, floor at 0.30
    // At 1.0%: 0.66 - 0.5 * 0.8 = 0.26 → floor at 0.30
    // At 1.5%: 0.66 - 1.0 * 0.8 = -0.14 → floor at 0.30
    baseMultiplier = Math.max(0.30, 0.66 - (percentAwayPct - 0.5) * 0.8);
  }

  // DTE adjustment: LEAPS retain more extrinsic value when ITM/OTM
  // For weeklies (7-90 DTE): use base multiplier as-is
  // For LEAPS (300+ DTE): boost floor from 0.15 → 0.70 for deep ITM/OTM
  if (dte < 90) {
    return baseMultiplier;
  } else if (dte < 300) {
    // Intermediate (90-300 DTE): gradual transition
    const transitionFactor = (dte - 90) / 210; // 0.0 at 90 DTE, 1.0 at 300 DTE
    const leapsFloor = 0.15 + (0.70 - 0.15) * transitionFactor;
    return Math.max(baseMultiplier, leapsFloor);
  } else {
    // LEAPS (300+ DTE): preserve 70% minimum extrinsic even when deep ITM
    return Math.max(baseMultiplier, 0.70);
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
 * For deep ITM options, HEAVILY reduce VIX sensitivity since value is mostly intrinsic
 * Exponential scaling: (VIX / 15)^1.3, but nearly eliminated for ITM LEAPS
 */
function getVolatilityMultiplier(vix: number, stockPrice: number, strike: number): number {
  const baseVIX = 15; // Normal market baseline
  const baseMultiplier = Math.pow(vix / baseVIX, 1.3);
  const cappedMultiplier = Math.min(baseMultiplier, 5.0); // Cap at 5.0x

  // For ITM options, dramatically reduce VIX sensitivity
  // Real deep ITM options are ~95% intrinsic value, so VIX barely matters
  const moneyness = stockPrice / strike;
  const percentITM = (moneyness - 1) * 100;

  if (percentITM >= 15) {
    // Very deep ITM (15%+): Almost no VIX sensitivity (~95% reduction)
    return 1.0 + (cappedMultiplier - 1.0) * 0.05;
  } else if (percentITM >= 10) {
    // Deep ITM (10-15%): Minimal VIX sensitivity (85-95% reduction)
    const factor = (percentITM - 10) / 5; // 0 at 10%, 1.0 at 15%
    const reduction = 0.85 + factor * 0.10; // 85% to 95%
    return 1.0 + (cappedMultiplier - 1.0) * (1.0 - reduction);
  } else if (percentITM >= 5) {
    // Moderate ITM (5-10%): Reduced VIX sensitivity (60-85% reduction)
    const factor = (percentITM - 5) / 5; // 0 at 5%, 1.0 at 10%
    const reduction = 0.60 + factor * 0.25; // 60% to 85%
    return 1.0 + (cappedMultiplier - 1.0) * (1.0 - reduction);
  } else if (percentITM >= 2) {
    // Slight ITM (2-5%): Some reduction (30-60%)
    const factor = (percentITM - 2) / 3;
    const reduction = 0.30 + factor * 0.30;
    return 1.0 + (cappedMultiplier - 1.0) * (1.0 - reduction);
  }

  // ATM and OTM options: Full VIX sensitivity
  return cappedMultiplier;
}

/**
 * Estimate delta based on moneyness using continuous interpolation
 * For deep ITM LEAPS, delta should be very close to 1.00 since the option
 * value changes almost entirely with intrinsic value (stock price changes)
 */
function estimateDelta(stockPrice: number, strike: number, _dte: number, isCall: boolean): number {
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

  // Validation: catch invalid inputs early
  if (!isFinite(stockPrice) || !isFinite(strike) || !isFinite(dte) || !isFinite(vix)) {
    console.error('Invalid option pricing inputs:', params);
    throw new Error(`Invalid pricing inputs: stockPrice=${stockPrice}, strike=${strike}, dte=${dte}, vix=${vix}`);
  }

  // 1. Calculate intrinsic value
  const intrinsic = calculateIntrinsic(stockPrice, strike, isCall);

  // 2. Calculate extrinsic value
  // Extrinsic = Base_Premium × Moneyness × Time × Volatility
  const basePremium = getBasePremium(dte);
  const moneynessMultiplier = getMoneynessMultiplier(stockPrice, strike, dte);
  const timeMultiplier = getTimeMultiplier(dte);
  const volatilityMultiplier = getVolatilityMultiplier(vix, stockPrice, strike);

  const extrinsic = basePremium * moneynessMultiplier * timeMultiplier * volatilityMultiplier;

  // Validation: catch NaN in intermediate calculations
  if (!isFinite(extrinsic)) {
    console.error('NaN in extrinsic calculation:', {
      basePremium, moneynessMultiplier, timeMultiplier, volatilityMultiplier, params
    });
    throw new Error('Extrinsic value calculation resulted in NaN');
  }

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
