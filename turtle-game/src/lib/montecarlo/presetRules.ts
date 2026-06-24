// Preset Rule Sets for Monte Carlo Simulation
// Defines 4 standard strike selection strategies for comparison

import type { RuleSet } from './types';

/**
 * Conservative Strategy
 * - Go uncovered when VIX extremely high (>35) and rising
 * - Sell ITM in high VIX for safety
 * - Sell ATM in normal VIX
 * - Sell farther OTM in low VIX
 * - Snapback rule: go uncovered after >15% drawdown + 2 consecutive up weeks
 */
const CONSERVATIVE: RuleSet = {
  name: 'Conservative',
  description: 'Safety first - ITM strikes in high VIX, uncovered in extreme conditions',
  rules: [
    {
      priority: 100,
      conditions: [
        { type: 'vix_level', operator: '>', value: 35 },
        { type: 'vix_trend', direction: 'rising', weeks: 4 },
      ],
      action: { type: 'go_uncovered' },
      description: 'Go uncovered when VIX >35 and rising (too dangerous)',
    },
    {
      priority: 90,
      conditions: [
        { type: 'drawdown', operator: '>', percent: 15 },
        { type: 'consecutive_weeks', direction: 'up', count: 2 },
      ],
      action: { type: 'go_uncovered' },
      description: 'Snapback rule: uncovered after big drop + recovery',
    },
    {
      priority: 50,
      conditions: [
        { type: 'vix_level', operator: '>', value: 25 },
        { type: 'vix_trend', direction: 'rising', weeks: 4 },
      ],
      action: { type: 'sell_call', moneyness: 'itm', offset: -2 },
      description: 'Sell 2% ITM when VIX >25 and rising',
    },
    {
      priority: 40,
      conditions: [{ type: 'vix_level', operator: '>', value: 20 }],
      action: { type: 'sell_call', moneyness: 'atm', offset: 0 },
      description: 'Sell ATM when VIX >20',
    },
    {
      priority: 30,
      conditions: [{ type: 'vix_level', operator: '<', value: 15 }],
      action: { type: 'sell_call', moneyness: 'otm', offset: 3 },
      description: 'Sell 3% OTM when VIX <15 (low vol)',
    },
    {
      priority: 1,
      conditions: [],
      action: { type: 'sell_call', moneyness: 'otm', offset: 1.5 },
      description: 'Default: sell 1.5% OTM',
    },
  ],
};

/**
 * Aggressive Premium Strategy
 * - Always maximize premium collection
 * - Sell deep ITM in extreme VIX
 * - Sell ITM in high VIX
 * - Sell ATM otherwise
 * - Never go uncovered (always collecting premium)
 */
const AGGRESSIVE_PREMIUM: RuleSet = {
  name: 'Aggressive Premium',
  description: 'Maximum premium collection - always ITM/ATM for max theta',
  rules: [
    {
      priority: 50,
      conditions: [{ type: 'vix_level', operator: '>', value: 40 }],
      action: { type: 'sell_call', moneyness: 'itm', offset: -3 },
      description: 'Sell 3% ITM when VIX >40 (huge premium)',
    },
    {
      priority: 40,
      conditions: [{ type: 'vix_level', operator: '>', value: 25 }],
      action: { type: 'sell_call', moneyness: 'itm', offset: -1 },
      description: 'Sell 1% ITM when VIX >25',
    },
    {
      priority: 30,
      conditions: [{ type: 'vix_trend', direction: 'rising', weeks: 4 }],
      action: { type: 'sell_call', moneyness: 'atm', offset: 0 },
      description: 'Sell ATM when VIX rising',
    },
    {
      priority: 1,
      conditions: [],
      action: { type: 'sell_call', moneyness: 'otm', offset: 0.5 },
      description: 'Default: sell slightly OTM (0.5%)',
    },
  ],
};

/**
 * Passive/Fixed Strategy
 * - Baseline strategy for comparison
 * - Always sell same strike distance regardless of conditions
 * - Simple, mechanical, no market timing
 */
const PASSIVE_FIXED: RuleSet = {
  name: 'Passive/Fixed',
  description: 'Baseline - always sell 1% OTM regardless of market conditions',
  rules: [
    {
      priority: 1,
      conditions: [],
      action: { type: 'sell_call', moneyness: 'otm', offset: 1 },
      description: 'Always sell 1% OTM',
    },
  ],
};

/**
 * Trend Following Strategy
 * - Adjust strikes based on price trend and VIX
 * - Give room in uptrends (farther OTM)
 * - Protect in downtrends (closer to ATM/ITM)
 * - Snapback rule when oversold
 */
const TREND_FOLLOWING: RuleSet = {
  name: 'Trend Following',
  description: 'Adapt to market trend - OTM in uptrends, ITM in downtrends',
  rules: [
    {
      priority: 100,
      conditions: [
        { type: 'drawdown', operator: '>', percent: 15 },
        { type: 'consecutive_weeks', direction: 'up', count: 2 },
      ],
      action: { type: 'go_uncovered' },
      description: 'Snapback: uncovered after >15% drop + 2 up weeks',
    },
    {
      priority: 80,
      conditions: [
        { type: 'price_trend', direction: 'above_ma', periods: 8 },
        { type: 'vix_trend', direction: 'falling', weeks: 4 },
      ],
      action: { type: 'sell_call', moneyness: 'otm', offset: 2 },
      description: 'Strong uptrend: sell 2% OTM (let it run)',
    },
    {
      priority: 70,
      conditions: [{ type: 'price_trend', direction: 'above_ma', periods: 8 }],
      action: { type: 'sell_call', moneyness: 'otm', offset: 1 },
      description: 'Above MA: sell 1% OTM',
    },
    {
      priority: 60,
      conditions: [
        { type: 'price_trend', direction: 'below_ma', periods: 8 },
        { type: 'vix_trend', direction: 'rising', weeks: 4 },
      ],
      action: { type: 'sell_call', moneyness: 'itm', offset: -1 },
      description: 'Downtrend + rising VIX: sell 1% ITM (defense)',
    },
    {
      priority: 50,
      conditions: [
        { type: 'price_trend', direction: 'below_ma', periods: 8 },
        { type: 'vix_trend', direction: 'falling', weeks: 4 },
      ],
      action: { type: 'sell_call', moneyness: 'atm', offset: 0 },
      description: 'Below MA but VIX falling: sell ATM',
    },
    {
      priority: 40,
      conditions: [{ type: 'price_trend', direction: 'below_ma', periods: 8 }],
      action: { type: 'sell_call', moneyness: 'atm', offset: 0 },
      description: 'Below MA: sell ATM',
    },
    {
      priority: 1,
      conditions: [],
      action: { type: 'sell_call', moneyness: 'atm', offset: 0 },
      description: 'Default: sell ATM',
    },
  ],
};

/**
 * Recovery Focused Strategy
 * - Primary goal: capture post-crash bounces uncovered
 * - Go uncovered during recoveries (VIX falling + recent drawdown)
 * - Stay covered during stable high VIX
 * - Sell defensive strikes otherwise
 */
const RECOVERY_FOCUSED: RuleSet = {
  name: 'Recovery Focused',
  description: 'Ride recoveries uncovered, cover during elevated stable VIX',
  rules: [
    {
      priority: 100,
      conditions: [
        { type: 'vix_trend', direction: 'falling', weeks: 2 },
        { type: 'drawdown', operator: '>', percent: 10 },
        { type: 'consecutive_weeks', direction: 'up', count: 1 },
      ],
      action: { type: 'go_uncovered' },
      description: 'Recovery mode: VIX falling + recent drawdown + bounce',
    },
    {
      priority: 95,
      conditions: [
        { type: 'vix_trend', direction: 'falling', weeks: 4 },
        { type: 'consecutive_weeks', direction: 'up', count: 2 },
      ],
      action: { type: 'go_uncovered' },
      description: 'Strong recovery: sustained VIX drop + 2 up weeks',
    },
    {
      priority: 90,
      conditions: [
        { type: 'drawdown', operator: '>', percent: 15 },
        { type: 'consecutive_weeks', direction: 'up', count: 2 },
      ],
      action: { type: 'go_uncovered' },
      description: 'Snapback: big drop + recovery signal',
    },
    {
      priority: 80,
      conditions: [
        { type: 'vix_level', operator: '>', value: 30 },
        { type: 'vix_trend', direction: 'rising', weeks: 2 },
      ],
      action: { type: 'sell_call', moneyness: 'itm', offset: -1 },
      description: 'Defensive: VIX >30 and rising - sell 1% ITM',
    },
    {
      priority: 70,
      conditions: [
        { type: 'vix_level', operator: '>', value: 25 },
        { type: 'vix_trend', direction: 'flat', weeks: 4 },
      ],
      action: { type: 'sell_call', moneyness: 'atm', offset: 0 },
      description: 'High stable VIX: sell ATM for premium',
    },
    {
      priority: 60,
      conditions: [{ type: 'vix_level', operator: '>', value: 20 }],
      action: { type: 'sell_call', moneyness: 'atm', offset: 0 },
      description: 'Elevated VIX: sell ATM',
    },
    {
      priority: 50,
      conditions: [
        { type: 'vix_level', operator: '<', value: 15 },
        { type: 'price_trend', direction: 'above_ma', periods: 8 },
      ],
      action: { type: 'sell_call', moneyness: 'otm', offset: 2.5 },
      description: 'Low VIX uptrend: sell 2.5% OTM',
    },
    {
      priority: 1,
      conditions: [],
      action: { type: 'sell_call', moneyness: 'otm', offset: 1.5 },
      description: 'Default: sell 1.5% OTM',
    },
  ],
};

/**
 * All preset rule sets for easy access
 */
export const PRESET_RULE_SETS: Record<string, RuleSet> = {
  conservative: CONSERVATIVE,
  aggressive: AGGRESSIVE_PREMIUM,
  passive: PASSIVE_FIXED,
  trendFollowing: TREND_FOLLOWING,
  recoveryFocused: RECOVERY_FOCUSED,
};

/**
 * Get rule set by name (case-insensitive)
 */
export function getRuleSet(name: string): RuleSet | null {
  const key = name.toLowerCase().replace(/[^a-z]/g, '');
  return PRESET_RULE_SETS[key] || null;
}

/**
 * Get all preset rule set names
 */
export function getPresetNames(): string[] {
  return Object.values(PRESET_RULE_SETS).map((rs) => rs.name);
}
