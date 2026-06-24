// Market Simulation for Monte Carlo
// Generates weekly price and VIX movements with realistic correlations

import { SeededRNG, standardNormal } from './randomGenerators';

/**
 * Generate next VIX value based on price change
 *
 * SIMPLIFIED MODEL - Calibrated to historical SPY/VIX data (1990-2024)
 * Historical VIX stats:
 * - Mean: 19.5, Median: 17.5
 * - VIX > 30: ~12% of time
 * - VIX > 40: ~3% of time
 * - VIX > 50: <1% of time
 *
 * Weekly correlation:
 * - SPY +1%: VIX typically -5 to -10%
 * - SPY -1%: VIX typically +10 to +20%
 * - SPY -5%: VIX typically +50 to +100%
 *
 * @param currentVIX - Current VIX level
 * @param priceChangePercent - Weekly price change as decimal (e.g., -0.05 for -5%)
 * @param rng - Seeded random number generator
 * @returns Next VIX value
 */
export function generateVIX(
  currentVIX: number,
  priceChangePercent: number,
  rng: SeededRNG
): number {
  // 1. PRICE EFFECT: Asymmetric inverse correlation
  // Calibrated conservatively to avoid VIX staying too elevated
  let priceEffect: number;

  if (priceChangePercent < 0) {
    // DOWN MOVES: VIX spikes
    const absChange = Math.abs(priceChangePercent);
    // Use conservative multipliers: 6-10x (not 20-45x!)
    let multiplier: number;
    if (absChange < 0.02) {
      multiplier = 6; // Small drops: 6x
    } else if (absChange < 0.05) {
      multiplier = 8; // Medium drops: 8x
    } else {
      multiplier = 10; // Large drops: 10x (capped!)
    }
    priceEffect = absChange * multiplier;
  } else {
    // UP MOVES: VIX declines (slower than spikes)
    const absChange = Math.abs(priceChangePercent);
    priceEffect = -absChange * 3; // 3x decline on up moves
  }

  // 2. MEAN REVERSION: Very strong pull toward 17
  // Half-life of ~2 weeks (weekly decay rate = 0.35)
  // VIX should quickly return to normal in calm markets
  const target = 17;
  const decayRate = 0.35;
  const meanReversion = ((target - currentVIX) / currentVIX) * decayRate;

  // 3. RANDOM SHOCK: Minimal noise to keep signal clear
  const vixVolatility = 0.04; // 4% weekly std dev (reduced from 8%)
  const randomShock = standardNormal(rng) * vixVolatility;

  // Calculate next VIX
  const vixChange = priceEffect + meanReversion + randomShock;
  const nextVIX = currentVIX * (1 + vixChange);

  // Clamp to realistic bounds
  return Math.max(10, Math.min(nextVIX, 80));
}

/**
 * Calculate moving average of prices
 */
export function calculateMovingAverage(prices: number[], periods: number): number {
  if (prices.length < periods) {
    return prices.reduce((sum, p) => sum + p, 0) / prices.length;
  }

  const recentPrices = prices.slice(-periods);
  return recentPrices.reduce((sum, p) => sum + p, 0) / periods;
}

/**
 * Determine VIX trend over last N weeks
 */
export function getVIXTrend(vixHistory: number[], weeks: number): 'rising' | 'falling' | 'flat' {
  if (vixHistory.length < weeks + 1) {
    return 'flat';
  }

  const recent = vixHistory.slice(-weeks - 1);
  const firstVIX = recent[0];
  const lastVIX = recent[recent.length - 1];
  const change = (lastVIX - firstVIX) / firstVIX;

  // Consider significant if >5% change
  if (change > 0.05) return 'rising';
  if (change < -0.05) return 'falling';
  return 'flat';
}

/**
 * Classify market regime based on price and VIX
 *
 * Regime classification helps rules make context-aware decisions:
 * - VIX level: Low (<15), Normal (15-25), High (25-35), Extreme (>35)
 * - Price trend: Above/below 8-week MA
 * - VIX trend: Rising/Falling over 4 weeks
 *
 * Examples:
 * - "Low VIX, Above MA" → Calm bull market
 * - "High VIX Rising, Below MA" → Bear market fear
 * - "Extreme VIX Falling, Below MA" → Recovery from crash
 */
export function classifyRegime(
  currentVIX: number,
  currentPrice: number,
  priceHistory: number[],
  vixHistory: number[]
): string {
  // VIX level classification
  let vixLevel: string;
  if (currentVIX < 15) vixLevel = 'Low VIX';
  else if (currentVIX < 25) vixLevel = 'Normal VIX';
  else if (currentVIX < 35) vixLevel = 'High VIX';
  else vixLevel = 'Extreme VIX';

  // Price trend vs 8-week MA
  const ma8 = calculateMovingAverage(priceHistory, 8);
  const priceTrend = currentPrice > ma8 ? 'Above MA' : 'Below MA';

  // VIX trend over 4 weeks
  const vixTrend = getVIXTrend(vixHistory, 4);
  const vixTrendStr = vixTrend === 'rising' ? 'Rising' : vixTrend === 'falling' ? 'Falling' : 'Flat';

  return `${vixLevel} ${vixTrendStr}, ${priceTrend}`;
}

/**
 * Calculate drawdown from peak
 * Returns percentage (e.g., 15.0 for 15% drawdown)
 */
export function calculateDrawdown(accountHistory: number[]): number {
  if (accountHistory.length === 0) return 0;

  let peak = accountHistory[0];
  let maxDrawdown = 0;

  for (const value of accountHistory) {
    if (value > peak) {
      peak = value;
    }
    const drawdown = ((peak - value) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * Count consecutive weeks with same direction
 * Returns count (positive for up weeks, negative for down weeks)
 */
export function countConsecutiveWeeks(priceHistory: number[]): { up: number; down: number } {
  if (priceHistory.length < 2) {
    return { up: 0, down: 0 };
  }

  let consecutiveUp = 0;
  let consecutiveDown = 0;

  // Count from most recent backward
  for (let i = priceHistory.length - 1; i > 0; i--) {
    const isUp = priceHistory[i] > priceHistory[i - 1];
    if (isUp) {
      consecutiveUp++;
      consecutiveDown = 0;
    } else {
      consecutiveDown++;
      consecutiveUp = 0;
    }

    // Only count the current streak
    if (i < priceHistory.length - 1) break;
  }

  return { up: consecutiveUp, down: consecutiveDown };
}

/**
 * Check if recent drawdown qualifies for "snapback" rule
 * Snapback: Price dropped >15% from recent high + 2+ consecutive up weeks
 * This suggests a potential reversal, so some strategies go uncovered to capture upside
 */
export function isSnapbackScenario(
  currentPrice: number,
  priceHistory: number[],
  minDrawdownPercent: number = 15,
  minConsecutiveUp: number = 2
): boolean {
  // Need enough history
  if (priceHistory.length < 8) return false;

  // Calculate recent high (8-week lookback)
  const recentPrices = priceHistory.slice(-8);
  const recentHigh = Math.max(...recentPrices);

  // Check if we're in significant drawdown
  const drawdown = ((recentHigh - currentPrice) / recentHigh) * 100;
  if (drawdown < minDrawdownPercent) return false;

  // Check for consecutive up weeks
  const { up } = countConsecutiveWeeks(priceHistory);
  return up >= minConsecutiveUp;
}
