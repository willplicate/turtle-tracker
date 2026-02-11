// Position Management Module
// Handles LEAPS and short call position operations

import type { LEAPSPosition, ShortCallPosition } from '../../types';
import { calculateOptionPrice, type OptionPriceBreakdown } from '../pricing/optionsPricing';

export interface RollResult {
  oldPositionClosed: boolean;
  premiumReceived: number;
  premiumPaid: number;
  netCredit: number;
  newPosition: LEAPSPosition | ShortCallPosition;
}

export interface PositionMetrics {
  delta: number;
  theta: number;
  gamma: number;
  vega: number;
}

/**
 * Create a new LEAPS position
 */
export function createLEAPSPosition(
  stockPrice: number,
  strike: number,
  dte: number,
  pricing: OptionPriceBreakdown
): LEAPSPosition {
  return {
    type: 'leaps',
    quantity: 1,
    costBasis: pricing.total,
    currentValue: pricing.total,
    strike,
    dte,
    delta: pricing.delta,
    theta: pricing.theta,
    premium: pricing.total,
    extrinsic: pricing.extrinsic,
    lastStockPrice: stockPrice,
  };
}

/**
 * Create a new short call position
 */
export function createShortCallPosition(
  _stockPrice: number,
  strike: number,
  dte: number,
  pricing: OptionPriceBreakdown
): ShortCallPosition {
  return {
    type: 'short-call',
    quantity: -1,
    costBasis: -pricing.total, // Credit received
    currentValue: pricing.total,
    strike,
    dte,
    premium: pricing.total,
    delta: pricing.delta,
    theta: pricing.theta,
  };
}

/**
 * Calculate current value of a LEAPS position
 */
export function calculateLEAPSValue(
  position: LEAPSPosition,
  currentStockPrice: number,
  currentVIX: number
): number {
  const pricing = calculateOptionPrice({
    stockPrice: currentStockPrice,
    strike: position.strike,
    dte: Math.max(0, position.dte),
    vix: currentVIX,
    isCall: true,
  });
  
  return pricing.total;
}

/**
 * Calculate current value of a short call position
 */
export function calculateShortCallValue(
  position: ShortCallPosition,
  currentStockPrice: number,
  currentVIX: number
): number {
  const pricing = calculateOptionPrice({
    stockPrice: currentStockPrice,
    strike: position.strike,
    dte: Math.max(0, position.dte),
    vix: currentVIX,
    isCall: true,
  });
  
  return pricing.total;
}

/**
 * Calculate P&L for a LEAPS position
 */
export function calculateLEAPSPnL(
  position: LEAPSPosition,
  currentStockPrice: number,
  currentVIX: number
): { unrealizedPnL: number; currentValue: number } {
  const currentValue = calculateLEAPSValue(position, currentStockPrice, currentVIX);
  const unrealizedPnL = currentValue - position.costBasis;
  
  return { unrealizedPnL, currentValue };
}

/**
 * Calculate P&L for a short call position
 */
export function calculateShortCallPnL(
  position: ShortCallPosition,
  currentStockPrice: number,
  currentVIX: number
): { unrealizedPnL: number; currentValue: number } {
  const currentValue = calculateShortCallValue(position, currentStockPrice, currentVIX);
  // For short calls, P&L = credit received - current value
  const unrealizedPnL = position.premium - currentValue;
  
  return { unrealizedPnL, currentValue };
}

/**
 * Roll a LEAPS position to a new strike and/or expiration
 */
export function rollLEAPS(
  currentPosition: LEAPSPosition,
  newStrike: number,
  newDte: number,
  currentStockPrice: number,
  currentVIX: number
): RollResult {
  // Get current value of old position
  const oldValue = calculateLEAPSValue(currentPosition, currentStockPrice, currentVIX);
  
  // Calculate new position cost
  const newPricing = calculateOptionPrice({
    stockPrice: currentStockPrice,
    strike: newStrike,
    dte: newDte,
    vix: currentVIX,
    isCall: true,
  });
  
  const netCredit = oldValue - newPricing.total;

  const newPosition: LEAPSPosition = {
    type: 'leaps',
    quantity: 1,
    costBasis: newPricing.total,
    currentValue: newPricing.total,
    strike: newStrike,
    dte: newDte,
    delta: newPricing.delta,
    theta: newPricing.theta,
    premium: newPricing.total,
    extrinsic: newPricing.extrinsic,
    lastStockPrice: currentStockPrice,
  };
  
  return {
    oldPositionClosed: true,
    premiumReceived: oldValue,
    premiumPaid: newPricing.total,
    netCredit,
    newPosition,
  };
}

/**
 * Roll a short call position to a new strike and/or expiration
 */
export function rollShortCall(
  currentPosition: ShortCallPosition,
  newStrike: number,
  newDte: number,
  currentStockPrice: number,
  currentVIX: number
): RollResult {
  // Get current value to buy back old position
  const buybackCost = calculateShortCallValue(currentPosition, currentStockPrice, currentVIX);
  
  // Calculate premium from new position
  const newPricing = calculateOptionPrice({
    stockPrice: currentStockPrice,
    strike: newStrike,
    dte: newDte,
    vix: currentVIX,
    isCall: true,
  });
  
  const netCredit = newPricing.total - buybackCost;
  
  const newPosition: ShortCallPosition = {
    type: 'short-call',
    quantity: -1,
    costBasis: -newPricing.total,
    currentValue: newPricing.total,
    strike: newStrike,
    dte: newDte,
    delta: newPricing.delta,
    theta: newPricing.theta,
    premium: newPricing.total,
  };
  
  return {
    oldPositionClosed: true,
    premiumReceived: newPricing.total,
    premiumPaid: buybackCost,
    netCredit,
    newPosition,
  };
}

/**
 * Check if LEAPS needs rolling (delta < 0.70)
 */
export function shouldRollLEAPS(position: LEAPSPosition): boolean {
  return position.delta < 0.70;
}

/**
 * Check if short call is approaching expiration (DTE <= 2)
 */
export function shouldRollShortCall(position: ShortCallPosition): boolean {
  return position.dte <= 2;
}

/**
 * Check if short call is ITM (at risk of assignment)
 */
export function isShortCallITM(position: ShortCallPosition, stockPrice: number): boolean {
  return stockPrice > position.strike;
}

/**
 * Get recommended strike for short call based on VIX
 * Short calls are weekly options (7 DTE) with $1 strike increments
 */
export function getRecommendedStrike(stockPrice: number, vix: number): number {
  const strikeIncrement = 1; // Weekly SPY strikes are in $1 increments

  if (vix < 20) {
    // Sell ATM
    return Math.round(stockPrice / strikeIncrement) * strikeIncrement;
  } else if (vix < 30) {
    // Sell 1 strike ITM (slightly below current price)
    return Math.round((stockPrice - 1) / strikeIncrement) * strikeIncrement;
  } else {
    // Sell 2 strikes ITM (further below current price)
    return Math.round((stockPrice - 2) / strikeIncrement) * strikeIncrement;
  }
}

/**
 * Calculate combined portfolio Greeks
 */
export function calculatePortfolioGreeks(
  leaps: LEAPSPosition | null,
  shortCall: ShortCallPosition | null
): PositionMetrics {
  let delta = 0;
  let theta = 0;
  let gamma = 0;
  let vega = 0;
  
  if (leaps) {
    delta += leaps.delta * 100; // Per contract
    theta += leaps.theta;
  }
  
  if (shortCall) {
    delta += (shortCall.delta || 0) * -100; // Short position
    theta += (shortCall.theta || 0) * -1; // Short benefits from theta
  }
  
  return { delta, theta, gamma, vega };
}
