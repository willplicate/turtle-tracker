// Random Number Generators for Monte Carlo Simulation
// Implements seedable RNG, Student's t distribution, and volatility clustering

import type { VolatilityState } from './types';

// Re-export VolatilityState for convenience
export type { VolatilityState };

/**
 * Mulberry32 Seedable Random Number Generator
 * Fast, simple, and produces high-quality pseudo-random numbers
 * Returns values in [0, 1)
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    // Ensure seed is a 32-bit unsigned integer
    this.state = seed >>> 0;
  }

  /**
   * Generate next random number in [0, 1)
   */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate random integer in [min, max]
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Choose random element from array (for empirical distribution sampling)
   */
  choice<T>(array: T[]): T {
    const index = Math.floor(this.next() * array.length);
    return array[index];
  }
}

/**
 * Box-Muller transform to generate standard normal (mean=0, std=1)
 * Reuses pattern from priceGenerator.ts but with seedable RNG
 */
export function standardNormal(rng: SeededRNG): number {
  let u1 = rng.next();
  let u2 = rng.next();

  // Ensure we don't get log(0)
  while (u1 === 0) u1 = rng.next();
  while (u2 === 0) u2 = rng.next();

  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Chi-squared distribution (sum of squared standard normals)
 * Used for constructing Student's t distribution
 */
function chiSquared(rng: SeededRNG, degreesOfFreedom: number): number {
  let sum = 0;
  for (let i = 0; i < degreesOfFreedom; i++) {
    const z = standardNormal(rng);
    sum += z * z;
  }
  return sum;
}

/**
 * Student's t distribution with specified degrees of freedom
 * For df=15, produces moderately fat-tailed returns (excess kurtosis ~0.5)
 * Lower df = fatter tails (df=5 too extreme, df=8 still too fat, df=15 realistic, df=30 ≈ normal)
 *
 * Formula: t = Z / sqrt(V / df)
 * where Z ~ N(0,1) and V ~ Chi^2(df)
 */
export function studentT(rng: SeededRNG, degreesOfFreedom: number = 15): number {
  const z = standardNormal(rng);
  const v = chiSquared(rng, degreesOfFreedom);
  return z / Math.sqrt(v / degreesOfFreedom);
}

/**
 * Initialize volatility clustering state
 */
export function createVolatilityState(baseStdDev: number = 0.02): VolatilityState {
  return {
    baseStdDev,
    currentStdDev: baseStdDev,
    weeksInHighVol: 0,
    consecutiveDownWeeks: 0,
  };
}

/**
 * Update volatility clustering state based on weekly return
 *
 * CALIBRATED PARAMETERS (from Python empirical validation):
 * - Trigger: -4% weekly return (less frequent than before)
 * - Multiplier: 1.05× (minimal clustering, down from 1.8×)
 * - Duration: 2-3 weeks (shorter, down from 3-5 weeks)
 *
 * This creates realistic but subtle volatility clustering without over-amplifying moves
 */
export function updateVolatilityState(
  state: VolatilityState,
  weeklyReturn: number,
  rng: SeededRNG
): VolatilityState {
  // Calibrated threshold: -4% triggers clustering (less frequent)
  const triggersCluster = weeklyReturn < -0.04;

  // Update consecutive down weeks
  let consecutiveDownWeeks = weeklyReturn < 0 ? state.consecutiveDownWeeks + 1 : 0;

  if (triggersCluster && state.weeksInHighVol === 0) {
    // Enter minimal volatility clustering regime
    const duration = rng.nextInt(2, 3); // 2-3 weeks (calibrated)
    return {
      ...state,
      currentStdDev: state.baseStdDev * 1.05, // 5% increase (calibrated, minimal)
      weeksInHighVol: duration,
      consecutiveDownWeeks,
    };
  } else if (state.weeksInHighVol > 0) {
    // Decay high volatility regime
    const weeksRemaining = state.weeksInHighVol - 1;
    return {
      ...state,
      weeksInHighVol: weeksRemaining,
      currentStdDev: weeksRemaining === 0 ? state.baseStdDev : state.currentStdDev,
      consecutiveDownWeeks,
    };
  }

  // Normal regime
  return {
    ...state,
    consecutiveDownWeeks,
  };
}

/**
 * Empirical SPY weekly returns distribution (bootstrap resampling approach)
 * Based on SPY 1928-2024 historical behavior, calibrated to match:
 * - Mean: ~10% annual, Std: ~18.5% annual
 * - Negative skew (crashes are sharp, rallies are gradual)
 *
 * Distribution: 50% tiny (±1%), 30% small (1-3%), 15% moderate (3-5%), 4% large (5-8%), 1% extreme
 * Adjusted for 14% base mean (gets reduced to ~9% by soft caps)
 */
const SPY_WEEKLY_RETURNS_RAW: number[] = [
  // Very small moves (50% = 100 returns: -1% to +1%)
  0.000, 0.001, -0.001, 0.002, -0.002, 0.003, -0.003, 0.004, -0.004, 0.005,
  -0.005, 0.006, -0.006, 0.007, -0.007, 0.008, -0.008, 0.009, -0.009, 0.010,
  -0.010, 0.001, -0.001, 0.002, -0.002, 0.003, -0.003, 0.004, -0.004, 0.005,
  -0.005, 0.006, -0.006, 0.007, -0.007, 0.008, -0.008, 0.009, -0.009, 0.010,
  -0.010, 0.001, -0.002, 0.003, -0.004, 0.005, -0.006, 0.007, -0.008, 0.009,
  -0.001, 0.002, -0.003, 0.004, -0.005, 0.006, -0.007, 0.008, -0.009, 0.000,
  0.002, -0.001, 0.004, -0.003, 0.006, -0.005, 0.008, -0.007, 0.010, -0.009,
  0.001, -0.002, 0.003, -0.004, 0.005, -0.006, 0.007, -0.008, 0.009, -0.010,
  0.000, 0.003, -0.003, 0.005, -0.005, 0.007, -0.007, 0.002, -0.002, 0.004,
  -0.004, 0.006, -0.006, 0.008, -0.008, 0.001, -0.001, 0.009, -0.009, 0.010,

  // Small moves (30% = 60 returns: 1% to 3%)
  0.011, -0.011, 0.012, -0.012, 0.013, -0.013, 0.014, -0.014, 0.015, -0.015,
  0.016, -0.016, 0.017, -0.017, 0.018, -0.018, 0.019, -0.019, 0.020, -0.020,
  0.021, -0.021, 0.022, -0.022, 0.023, -0.023, 0.024, -0.024, 0.025, -0.025,
  0.026, -0.026, 0.027, -0.027, 0.028, -0.028, 0.029, -0.029, 0.030, -0.030,
  0.011, -0.012, 0.013, -0.014, 0.015, -0.016, 0.017, -0.018, 0.019, -0.020,
  0.021, -0.022, 0.023, -0.024, 0.025, -0.026, 0.027, -0.028, 0.029, -0.030,

  // Moderate moves (15% = 30 returns: 3% to 5%)
  0.031, -0.031, 0.032, -0.033, 0.033, -0.034, 0.034, -0.035, 0.035, -0.036,
  0.036, -0.037, 0.037, -0.038, 0.038, -0.039, 0.039, -0.040, 0.040, -0.041,
  0.041, -0.042, 0.042, -0.043, 0.043, -0.044, 0.044, -0.045, 0.045, -0.046,

  // Large moves (4% = 8 returns: ASYMMETRIC - 3 up, 5 down for negative skew)
  0.051, 0.058, 0.064, -0.055, -0.062, -0.069, -0.076, -0.083,

  // Extreme moves (1% = 2 returns: Sharp crashes, modest rallies)
  -0.130, 0.080,
];

// Adjust distribution to target mean (14% annual = 0.269% weekly)
// This gets reduced to ~9% by soft caps
const TARGET_MEAN = 0.00269;
const currentMean = SPY_WEEKLY_RETURNS_RAW.reduce((sum, r) => sum + r, 0) / SPY_WEEKLY_RETURNS_RAW.length;
const SPY_WEEKLY_RETURNS = SPY_WEEKLY_RETURNS_RAW.map(r => r - currentMean + TARGET_MEAN);

/**
 * Generate weekly return using empirical distribution (bootstrap resampling) with soft caps
 *
 * @param ytdReturn - Year-to-date return (used for soft capping)
 * @param volState - Current volatility state
 * @param rng - Seeded random number generator
 * @returns Weekly return as decimal (e.g., 0.02 for +2%)
 */
export function generateWeeklyReturn(
  ytdReturn: number,
  volState: VolatilityState,
  rng: SeededRNG
): number {
  // Sample from empirical distribution
  let baseReturn = rng.choice(SPY_WEEKLY_RETURNS);

  // SOFT CAP: Progressive probability-based caps to prevent unrealistic extremes
  // Upper soft cap (prevent unrealistic bull years)
  if (ytdReturn > 0.22) {
    let forceNegativeProb = 0;
    if (ytdReturn > 0.32) {
      forceNegativeProb = 1.00; // 100% at 32%+
    } else if (ytdReturn > 0.28) {
      forceNegativeProb = 0.80; // 80% at 28-32%
    } else if (ytdReturn > 0.25) {
      forceNegativeProb = 0.60; // 60% at 25-28%
    } else {
      forceNegativeProb = 0.40; // 40% at 22-25%
    }

    if (baseReturn > 0 && rng.next() < forceNegativeProb) {
      const negativeReturns = SPY_WEEKLY_RETURNS.filter(r => r < 0);
      baseReturn = rng.choice(negativeReturns);
    }
  }
  // Lower soft cap (allow bear markets to develop naturally to -25% range)
  else if (ytdReturn < -0.25) {
    let forcePositiveProb = 0;
    if (ytdReturn < -0.42) {
      forcePositiveProb = 1.00; // 100% at -42%+
    } else if (ytdReturn < -0.38) {
      forcePositiveProb = 0.80; // 80% at -38% to -42%
    } else if (ytdReturn < -0.34) {
      forcePositiveProb = 0.60; // 60% at -34% to -38%
    } else if (ytdReturn < -0.30) {
      forcePositiveProb = 0.40; // 40% at -30% to -34%
    } else {
      forcePositiveProb = 0.20; // 20% at -25% to -30%
    }

    if (baseReturn < 0 && rng.next() < forcePositiveProb) {
      const positiveReturns = SPY_WEEKLY_RETURNS.filter(r => r > 0);
      baseReturn = rng.choice(positiveReturns);
    }
  }

  // Apply minimal volatility clustering (1.05× multiplier)
  const weeklyReturn = baseReturn * (volState.currentStdDev / 0.02); // Scale by vol state
  return weeklyReturn;
}
