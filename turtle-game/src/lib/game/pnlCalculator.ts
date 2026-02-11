// P&L Calculator Module
// Calculates realized and unrealized P&L for all positions

import type { GameState } from './stateManager';
import type { LEAPSPosition, ShortCallPosition } from '../../types';
import { calculateLEAPSValue, calculateShortCallValue } from './positionManager';

export interface PnLSummary {
  // Overall
  totalAccountValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  
  // Breakdown
  realizedPnL: number;
  unrealizedPnL: number;
  
  // Positions
  leapsPnL: number;
  shortCallPnL: number;
  
  // Weekly
  weeklyPnL: number;
  weeklyPnLPercent: number;
  
  // Greeks
  portfolioDelta: number;
  portfolioTheta: number;
}

export interface TradeRecord {
  date: number; // Day number
  type: 'BUY_LEAPS' | 'SELL_CALL' | 'CLOSE_LEAPS' | 'BUY_BACK_CALL' | 'ROLL';
  description: string;
  pnl: number;
}

/**
 * Calculate complete P&L summary for the game state
 */
export function calculatePnLSummary(state: GameState): PnLSummary {
  const { cash, leaps, shortCall, realizedPnL, unrealizedPnL, weeklyPnL, initialCash, market } = state;
  
  // Calculate current position values
  let leapsCurrentValue = 0;
  let leapsPnL = 0;
  let shortCallCurrentValue = 0;
  let shortCallPnL = 0;
  
  if (leaps) {
    leapsCurrentValue = calculateLEAPSValue(leaps, market.spyPrice, market.vix);
    leapsPnL = leapsCurrentValue - leaps.costBasis;
  }
  
  if (shortCall) {
    shortCallCurrentValue = calculateShortCallValue(shortCall, market.spyPrice, market.vix);
    shortCallPnL = shortCall.premium - shortCallCurrentValue;
  }
  
  // Total account value
  const totalAccountValue = cash + leapsCurrentValue - shortCallCurrentValue;
  
  // Total P&L
  const totalPnL = totalAccountValue - initialCash;
  const totalPnLPercent = (totalPnL / initialCash) * 100;
  
  // Weekly P&L percentage
  const weeklyPnLPercent = (weeklyPnL / initialCash) * 100;
  
  // Portfolio Greeks
  let portfolioDelta = 0;
  let portfolioTheta = 0;
  
  if (leaps) {
    portfolioDelta += leaps.delta * 100;
    portfolioTheta += leaps.theta;
  }
  
  if (shortCall) {
    portfolioDelta += (shortCall.delta || 0) * -100;
    portfolioTheta += (shortCall.theta || 0) * -1;
  }
  
  return {
    totalAccountValue,
    totalPnL,
    totalPnLPercent,
    realizedPnL,
    unrealizedPnL,
    leapsPnL,
    shortCallPnL,
    weeklyPnL,
    weeklyPnLPercent,
    portfolioDelta,
    portfolioTheta,
  };
}

/**
 * Calculate capital deployment percentage
 */
export function calculateCapitalDeployment(state: GameState): number {
  const { leaps, shortCall, initialCash, market } = state;
  
  let deployed = 0;
  
  if (leaps) {
    deployed += calculateLEAPSValue(leaps, market.spyPrice, market.vix);
  }
  
  // Short calls reduce deployment (they bring in cash)
  if (shortCall) {
    deployed -= shortCall.premium;
  }
  
  return (deployed / initialCash) * 100;
}

/**
 * Check if capital deployment exceeds safe limits
 */
export function checkCapitalLimits(deploymentPercent: number, vix: number): {
  isSafe: boolean;
  warning: string | null;
  maxAllowed: number;
} {
  let maxAllowed: number;
  
  if (vix < 20) {
    maxAllowed = 50;
  } else if (vix < 30) {
    maxAllowed = 70;
  } else if (vix < 40) {
    maxAllowed = 80;
  } else {
    maxAllowed = 85;
  }
  
  if (deploymentPercent > 80) {
    return {
      isSafe: false,
      warning: '⚠️ OVERLEVERAGED! Close positions immediately!',
      maxAllowed,
    };
  }
  
  if (deploymentPercent > maxAllowed) {
    return {
      isSafe: false,
      warning: `⚠️ High deployment! Max recommended: ${maxAllowed}%`,
      maxAllowed,
    };
  }
  
  return {
    isSafe: true,
    warning: null,
    maxAllowed,
  };
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(state: GameState): {
  winRate: number;
  avgTradePnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
} {
  const { totalTrades, winningTrades, realizedPnL, pnlHistory, initialCash } = state;
  
  // Win rate
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  // Average trade P&L
  const avgTradePnL = totalTrades > 0 ? realizedPnL / totalTrades : 0;
  
  // Max drawdown from P&L history
  let maxDrawdown = 0;
  let peak = initialCash;
  
  for (const pnl of pnlHistory) {
    const value = initialCash + pnl;
    if (value > peak) {
      peak = value;
    }
    const drawdown = (peak - value) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  // Simple Sharpe-like ratio (return / volatility)
  // Using P&L changes as returns
  const returns: number[] = [];
  for (let i = 1; i < pnlHistory.length; i++) {
    returns.push(pnlHistory[i] - pnlHistory[i - 1]);
  }
  
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length || 0;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length || 1;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
  
  return {
    winRate,
    avgTradePnL,
    maxDrawdown: maxDrawdown * 100, // As percentage
    sharpeRatio,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Get color class based on P&L value
 */
export function getPnLColorClass(value: number): string {
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-gray-400';
}

/**
 * Calculate breakeven prices for positions
 */
export function calculateBreakevens(
  leaps: LEAPSPosition | null,
  shortCall: ShortCallPosition | null
): {
  leapsBreakeven: number | null;
  shortCallBreakeven: number | null;
  strategyBreakeven: number | null;
} {
  let leapsBreakeven: number | null = null;
  let shortCallBreakeven: number | null = null;
  let strategyBreakeven: number | null = null;
  
  if (leaps) {
    // For LEAPS: breakeven = strike + (premium paid / 100)
    leapsBreakeven = leaps.strike + (leaps.costBasis / 100);
  }
  
  if (shortCall) {
    // For short call: breakeven = strike + (premium received / 100)
    shortCallBreakeven = shortCall.strike + (shortCall.premium / 100);
  }
  
  if (leaps && shortCall) {
    // For the strategy: net debit = leaps cost - call credit
    const netDebit = leaps.costBasis - shortCall.premium;
    strategyBreakeven = leaps.strike + (netDebit / 100);
  }
  
  return { leapsBreakeven, shortCallBreakeven, strategyBreakeven };
}
