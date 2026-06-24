// Results Analyzer
// Aggregates path results into summary statistics

import type { PathResult, SimulationResults } from './types';

/**
 * Calculate percentile of an array of numbers
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * Calculate Conditional Value at Risk (CVaR)
 * Average of worst 5% of outcomes
 */
function calculateCVaR(values: number[], percentile: number = 95): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const cutoffIndex = Math.ceil((sorted.length * (100 - percentile)) / 100);
  const worstOutcomes = sorted.slice(0, cutoffIndex);

  if (worstOutcomes.length === 0) return sorted[0];

  return worstOutcomes.reduce((sum, v) => sum + v, 0) / worstOutcomes.length;
}

/**
 * Aggregate path results into summary statistics
 *
 * @param pathResults - Array of all path results
 * @param strategy - Strategy name ('naked_leaps' or 'pmcc')
 * @param ruleSetName - Name of rule set used
 * @returns SimulationResults with comprehensive statistics
 */
export function aggregateResults(
  pathResults: PathResult[],
  strategy: 'naked_leaps' | 'pmcc',
  ruleSetName: string
): SimulationResults {
  const numPaths = pathResults.length;

  // Separate blown up vs surviving paths
  const survivingPaths = pathResults.filter((p) => !p.blownUp);

  // ===== Survival & Win Rates =====
  const survivalRate = (survivingPaths.length / numPaths) * 100;

  // Win rate: percentage of SURVIVING paths that ended above starting value
  const winningPaths = survivingPaths.filter((p) => p.totalReturn > 0);
  const winRate = survivingPaths.length > 0 ? (winningPaths.length / survivingPaths.length) * 100 : 0;

  // ===== Final Value Distribution =====
  const finalValues = survivingPaths.map((p) => p.finalValue);

  const medianFinalValue = finalValues.length > 0 ? percentile(finalValues, 50) : 0;
  const meanFinalValue = finalValues.length > 0 ? finalValues.reduce((sum, v) => sum + v, 0) / finalValues.length : 0;
  const stdDevFinalValue = standardDeviation(finalValues);
  const percentile5 = finalValues.length > 0 ? percentile(finalValues, 5) : 0;
  const percentile95 = finalValues.length > 0 ? percentile(finalValues, 95) : 0;
  const cvar95 = finalValues.length > 0 ? calculateCVaR(finalValues, 95) : 0;

  // ===== Drawdown Statistics =====
  const allDrawdowns = pathResults.map((p) => p.maxDrawdown);
  const medianMaxDrawdown = allDrawdowns.length > 0 ? percentile(allDrawdowns, 50) : 0;
  const worstDrawdown = allDrawdowns.length > 0 ? Math.max(...allDrawdowns) : 0;

  // ===== Weekly P&L Statistics =====
  // Aggregate all week-to-week P&L changes across all paths
  const allWeeklyPnLs: number[] = [];
  const winningWeekPnLs: number[] = [];
  const losingWeekPnLs: number[] = [];

  for (const path of pathResults) {
    for (const week of path.weeklyHistory) {
      if (week.weeklyPnL !== undefined) {
        allWeeklyPnLs.push(week.weeklyPnL);

        if (week.weeklyPnL > 0) {
          winningWeekPnLs.push(week.weeklyPnL);
        } else if (week.weeklyPnL < 0) {
          losingWeekPnLs.push(week.weeklyPnL);
        }
      }
    }
  }

  const avgWeeklyPnL = allWeeklyPnLs.length > 0 ? allWeeklyPnLs.reduce((sum, v) => sum + v, 0) / allWeeklyPnLs.length : 0;

  const avgWinningWeekPnL =
    winningWeekPnLs.length > 0 ? winningWeekPnLs.reduce((sum, v) => sum + v, 0) / winningWeekPnLs.length : 0;

  const avgLosingWeekPnL =
    losingWeekPnLs.length > 0 ? losingWeekPnLs.reduce((sum, v) => sum + v, 0) / losingWeekPnLs.length : 0;

  const winWeekPercentage = allWeeklyPnLs.length > 0 ? (winningWeekPnLs.length / allWeeklyPnLs.length) * 100 : 0;

  return {
    strategy,
    ruleSetName,
    numPaths,
    survivalRate,
    winRate,
    medianFinalValue,
    meanFinalValue,
    stdDevFinalValue,
    percentile5,
    percentile95,
    cvar95,
    medianMaxDrawdown,
    worstDrawdown,
    avgWeeklyPnL,
    avgWinningWeekPnL,
    avgLosingWeekPnL,
    winWeekPercentage,
    allPathResults: pathResults,
  };
}

/**
 * Export results as CSV string
 * One row per SimulationResults object
 */
export function exportToCSV(results: SimulationResults[]): string {
  // CSV header
  const header = [
    'Strategy',
    'Rule Set',
    'Paths',
    'Survival Rate (%)',
    'Win Rate (%)',
    'Median Final Value',
    'Mean Final Value',
    'Std Dev',
    'Worst 5%',
    'Best 5%',
    'CVaR 95%',
    'Median Max Drawdown (%)',
    'Worst Drawdown (%)',
    'Avg Weekly P&L',
    'Avg Winning Week',
    'Avg Losing Week',
    'Win Week %',
  ].join(',');

  // CSV rows
  const rows = results.map((r) =>
    [
      r.strategy,
      r.ruleSetName,
      r.numPaths,
      r.survivalRate.toFixed(2),
      r.winRate.toFixed(2),
      r.medianFinalValue.toFixed(0),
      r.meanFinalValue.toFixed(0),
      r.stdDevFinalValue.toFixed(0),
      r.percentile5.toFixed(0),
      r.percentile95.toFixed(0),
      r.cvar95.toFixed(0),
      r.medianMaxDrawdown.toFixed(2),
      r.worstDrawdown.toFixed(2),
      r.avgWeeklyPnL.toFixed(0),
      r.avgWinningWeekPnL.toFixed(0),
      r.avgLosingWeekPnL.toFixed(0),
      r.winWeekPercentage.toFixed(2),
    ].join(',')
  );

  return [header, ...rows].join('\n');
}
