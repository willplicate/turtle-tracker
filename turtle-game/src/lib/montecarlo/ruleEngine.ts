// Rule Engine for Strike Selection
// Evaluates conditions and determines which action to take

import type { RuleSet, Condition, Action, MarketContext } from './types';
import { calculateMovingAverage, getVIXTrend, countConsecutiveWeeks } from './marketSimulator';

/**
 * Evaluate a single condition against current market context
 */
function evaluateCondition(condition: Condition, context: MarketContext): boolean {
  switch (condition.type) {
    case 'vix_level': {
      const { operator, value } = condition;
      switch (operator) {
        case '<':
          return context.currentVIX < value;
        case '>':
          return context.currentVIX > value;
        case '<=':
          return context.currentVIX <= value;
        case '>=':
          return context.currentVIX >= value;
        default:
          return false;
      }
    }

    case 'vix_trend': {
      const trend = getVIXTrend(context.vixHistory, condition.weeks);
      return trend === condition.direction;
    }

    case 'price_trend': {
      const ma = calculateMovingAverage(context.priceHistory, condition.periods);
      if (condition.direction === 'above_ma') {
        return context.currentPrice > ma;
      } else {
        return context.currentPrice < ma;
      }
    }

    case 'drawdown': {
      // Calculate recent high (8-week lookback)
      const recentPrices = context.priceHistory.slice(-Math.min(8, context.priceHistory.length));
      const recentHigh = recentPrices.length > 0 ? Math.max(...recentPrices) : context.startingValue;

      const currentDrawdown = ((recentHigh - context.accountValue) / recentHigh) * 100;

      if (condition.operator === '>') {
        return currentDrawdown > condition.percent;
      } else {
        return currentDrawdown < condition.percent;
      }
    }

    case 'consecutive_weeks': {
      const { up, down } = countConsecutiveWeeks(context.priceHistory);
      const count = condition.direction === 'up' ? up : down;
      return count >= condition.count;
    }

    default:
      return false;
  }
}

/**
 * Evaluate all conditions in a rule (AND logic)
 */
function evaluateConditions(conditions: Condition[], context: MarketContext): boolean {
  // Empty conditions array = always true (default rule)
  if (conditions.length === 0) return true;

  // All conditions must be true
  return conditions.every((cond) => evaluateCondition(cond, context));
}

/**
 * Evaluate rule set and return first matching action
 * Rules are evaluated in priority order (highest first)
 * Returns the action from the first rule whose conditions all match
 */
export function evaluateRules(ruleSet: RuleSet, context: MarketContext): Action {
  // Sort rules by priority (descending)
  const sortedRules = [...ruleSet.rules].sort((a, b) => b.priority - a.priority);

  // Find first matching rule
  for (const rule of sortedRules) {
    if (evaluateConditions(rule.conditions, context)) {
      return rule.action;
    }
  }

  // Should never reach here if rule set has a default rule
  // Return default action as fallback
  return { type: 'sell_call', moneyness: 'atm', offset: 0 };
}

/**
 * Calculate strike price from action and current market price
 *
 * @param action - Action from rule evaluation
 * @param currentPrice - Current stock price
 * @returns Strike price (rounded to nearest dollar)
 */
export function calculateStrikeFromAction(action: Action, currentPrice: number): number | null {
  if (action.type === 'go_uncovered') {
    return null;
  }

  const { moneyness, offset } = action;

  let strikePrice: number;

  if (moneyness === 'atm') {
    // ATM + offset percentage (positive = farther OTM, negative = farther ITM)
    strikePrice = currentPrice * (1 + offset / 100);
  } else if (moneyness === 'otm') {
    // OTM: offset is percentage away from current price (e.g., 1.5 = 1.5% OTM)
    strikePrice = currentPrice * (1 + Math.abs(offset) / 100);
  } else {
    // ITM: offset is percentage below current price (e.g., 2 = 2% ITM)
    strikePrice = currentPrice * (1 - Math.abs(offset) / 100);
  }

  // Round to nearest dollar (SPY options are usually $1 strikes)
  return Math.round(strikePrice);
}

/**
 * Get human-readable description of action for logging
 */
export function describeAction(action: Action, currentPrice: number): string {
  if (action.type === 'go_uncovered') {
    return 'Uncovered (no short call)';
  }

  const strike = calculateStrikeFromAction(action, currentPrice);
  if (strike === null) return 'Error calculating strike';

  const distance = ((strike - currentPrice) / currentPrice) * 100;
  const distanceStr = distance >= 0 ? `+${distance.toFixed(1)}%` : `${distance.toFixed(1)}%`;

  return `Sell ${strike}C (${distanceStr})`;
}
