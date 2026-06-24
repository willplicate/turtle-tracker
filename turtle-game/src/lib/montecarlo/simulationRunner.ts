// Core Simulation Runner
// Runs a single 52-week simulation path using existing pricing functions

import type {
  SimulationConfig,
  PathResult,
  WeekSnapshot,
  RuleSet,
  SimulatedLEAPSPosition,
  SimulatedShortCallPosition,
  MarketContext,
} from './types';
import type { SeededRNG, VolatilityState } from './randomGenerators';
import { generateWeeklyReturn, updateVolatilityState, createVolatilityState } from './randomGenerators';
import { generateVIX, classifyRegime, calculateDrawdown } from './marketSimulator';
import { evaluateRules, calculateStrikeFromAction, describeAction } from './ruleEngine';
import { calculateOptionPrice } from '../pricing/optionsPricing';

/**
 * Calculate simple delta based on moneyness (calibrated to market)
 * Matches minimal game logic
 */
function calculateSimpleDelta(stockPrice: number, strike: number, _dte: number): number {
  const percentITM = ((stockPrice - strike) / stockPrice) * 100;

  let baseDelta: number;

  if (percentITM >= 17) baseDelta = 0.92;
  else if (percentITM >= 13) baseDelta = 0.85 + (percentITM - 13) / 4 * 0.07;
  else if (percentITM >= 9) baseDelta = 0.80 + (percentITM - 9) / 4 * 0.05;
  else if (percentITM >= 5) baseDelta = 0.65 + (percentITM - 5) / 4 * 0.15;
  else if (percentITM >= 2) baseDelta = 0.50 + (percentITM - 2) / 3 * 0.15;
  else if (percentITM >= 0) baseDelta = 0.50;
  else if (percentITM >= -2) baseDelta = 0.50 + (percentITM / 2) * 0.15;
  else if (percentITM >= -5) baseDelta = 0.35 + (percentITM + 5) / 3 * 0.15;
  else baseDelta = 0.20;

  return Math.max(0.01, Math.min(0.99, baseDelta));
}

/**
 * Calculate simple extrinsic value for LEAPS
 * Uses sqrt time scaling, minimal VIX sensitivity for ITM options
 */
function calculateSimpleExtrinsic(stockPrice: number, strike: number, dte: number): number {
  const baseATM_7DTE = 650;  // $650 for 7 DTE ATM at VIX 15

  // Time scaling: sqrt for simplicity
  const timeScaling = Math.sqrt(dte / 7);
  const basePremium = baseATM_7DTE * timeScaling;

  // Moneyness factor (reduced for ITM)
  const percentITM = ((stockPrice - strike) / stockPrice) * 100;
  let moneynessFactor: number;

  if (percentITM >= 15) moneynessFactor = 0.30;
  else if (percentITM >= 10) moneynessFactor = 0.40;
  else if (percentITM >= 8) moneynessFactor = 0.50;
  else if (percentITM >= 5) moneynessFactor = 0.65;
  else if (percentITM >= 2) moneynessFactor = 0.80;
  else if (percentITM >= -2) moneynessFactor = 1.00;  // ATM
  else if (percentITM >= -5) moneynessFactor = 0.80;
  else moneynessFactor = 0.50;

  return basePremium * moneynessFactor;
}

/**
 * Create initial LEAPS position with all tracking fields
 */
function createInitialLEAPS(
  stockPrice: number,
  strike: number,
  dte: number,
  quantity: number
): SimulatedLEAPSPosition {
  const intrinsic = Math.max(0, stockPrice - strike) * 100;
  const extrinsic = calculateSimpleExtrinsic(stockPrice, strike, dte);
  const delta = calculateSimpleDelta(stockPrice, strike, dte);
  const theta = dte > 0 ? -extrinsic / dte : 0;
  const valuePerContract = intrinsic + extrinsic;
  const currentValue = valuePerContract * quantity;

  return {
    strike,
    costBasis: currentValue,
    dte,
    quantity,
    currentValue,
    intrinsic,
    extrinsic,
    delta,
    theta,
    lastStockPrice: stockPrice,
  };
}

/**
 * Update LEAPS position incrementally (delta + theta approach)
 * NO VIX sensitivity - smooth predictable decay
 */
function updateLEAPSIncremental(
  position: SimulatedLEAPSPosition,
  newStockPrice: number,
  daysElapsed: number
): SimulatedLEAPSPosition {
  // 1. Stock impact (delta × price change × 100 × quantity)
  const stockChange = newStockPrice - position.lastStockPrice;
  const stockImpact = stockChange * position.delta * 100 * position.quantity;

  // 2. Theta decay (theta per day × days × quantity)
  const thetaDecay = position.theta * daysElapsed * position.quantity;

  // 3. Update total value
  const newValue = position.currentValue + stockImpact + thetaDecay;

  // 4. Update extrinsic (decays)
  const newExtrinsic = Math.max(0, position.extrinsic + (thetaDecay / position.quantity));

  // 5. Update intrinsic
  const newIntrinsic = Math.max(0, newStockPrice - position.strike) * 100;

  // 6. Update DTE
  const newDTE = Math.max(0, position.dte - daysElapsed);

  // 7. Recalculate theta (simple linear decay)
  const newTheta = newDTE > 0 && newExtrinsic > 0 ? -newExtrinsic / newDTE : 0;

  // 8. Recalculate delta
  const newDelta = calculateSimpleDelta(newStockPrice, position.strike, newDTE);

  return {
    strike: position.strike,
    costBasis: position.costBasis,
    dte: newDTE,
    quantity: position.quantity,
    currentValue: newValue,
    intrinsic: newIntrinsic,
    extrinsic: newExtrinsic,
    delta: newDelta,
    theta: newTheta,
    lastStockPrice: newStockPrice,
  };
}

/**
 * Calculate current short call value using existing pricing function
 */
function calculateShortCallValue(position: SimulatedShortCallPosition, stockPrice: number, vix: number): number {
  const pricing = calculateOptionPrice({
    stockPrice,
    strike: position.strike,
    dte: Math.max(0, position.dte),
    vix,
    isCall: true,
  });

  return pricing.total * position.quantity;
}

/**
 * Run a single 52-week simulation path
 *
 * @param config - Simulation configuration
 * @param ruleSet - Strike selection rules (ignored if strategy is 'naked_leaps')
 * @param strategy - 'naked_leaps' or 'pmcc'
 * @param rng - Seeded random number generator
 * @param pathId - Identifier for this path
 * @returns PathResult with final value, history, and statistics
 */
export function runSinglePath(
  config: SimulationConfig,
  ruleSet: RuleSet,
  strategy: 'naked_leaps' | 'pmcc',
  rng: SeededRNG,
  pathId: number
): PathResult {
  // Initialize account
  let cash = config.startingCash;
  let currentPrice = config.initialPrice;
  let currentVIX = config.initialVIX;

  // Initialize volatility clustering
  // Target: 18.5% annual std dev ≈ 2.57% weekly
  // Using normal distribution (not Student's t) with volatility clustering
  // Base = 2.0% weekly, clustering creates fat tails naturally
  let volState: VolatilityState = createVolatilityState(0.020); // 2.0% base weekly std dev

  // Buy initial LEAPS position
  // Target: Moderate ITM for 70-80 delta (affordable with 40% allocation)
  // Strike at 92% of current price
  const initialLEAPSStrike = Math.round(currentPrice * 0.92);

  // Create temporary LEAPS to calculate cost
  const tempLEAPS = createInitialLEAPS(currentPrice, initialLEAPSStrike, 365, 1);
  const costPerContract = tempLEAPS.currentValue;

  // Calculate how much to allocate to LEAPS (e.g., 40% of capital)
  const leapsAllocationAmount = config.startingCash * config.leapsAllocation;
  const leapsQuantity = Math.floor(leapsAllocationAmount / costPerContract);

  // Validation: Check if we can afford at least 1 LEAPS
  if (leapsQuantity === 0) {
    const requiredCash = Math.ceil(costPerContract / config.leapsAllocation);
    const requiredAllocation = Math.ceil((costPerContract / config.startingCash) * 100);

    throw new Error(
      `⚠️ INSUFFICIENT CAPITAL TO PURCHASE LEAPS\n\n` +
      `LEAPS Cost: $${costPerContract.toLocaleString()}\n` +
      `Your Allocation: $${leapsAllocationAmount.toLocaleString()} (${(config.leapsAllocation * 100).toFixed(0)}% of $${config.startingCash.toLocaleString()})\n\n` +
      `SOLUTIONS:\n` +
      `1️⃣ Increase starting cash to $${requiredCash.toLocaleString()}+\n` +
      `2️⃣ Increase LEAPS allocation to ${requiredAllocation}%+\n` +
      `3️⃣ Recommended: Use $35,000 starting cash with 40% allocation`
    );
  }

  // Create actual LEAPS position with correct quantity
  let leapsPosition = createInitialLEAPS(currentPrice, initialLEAPSStrike, 365, leapsQuantity);

  // Deduct LEAPS cost from cash (only once!)
  cash -= leapsPosition.costBasis;

  // Short call position (PMCC only)
  let shortCallPosition: SimulatedShortCallPosition | null = null;

  // Tracking arrays
  const weeklyHistory: WeekSnapshot[] = [];
  const priceHistory: number[] = [currentPrice];
  const vixHistory: number[] = [currentVIX];
  const accountValueHistory: number[] = [config.startingCash];

  // Weekly loop (52 weeks = 1 year)
  for (let week = 1; week <= config.numWeeks; week++) {
    // ===== 1. Generate weekly price movement =====
    // Calculate YTD return for soft capping (calibrated empirical approach)
    const ytdReturn = (currentPrice / config.initialPrice - 1);

    // Generate weekly return using empirical distribution with soft caps
    // Calibrated to match SPY 1928-2024: mean ~10% annual, std ~18.5%, best year ~32%
    const weeklyReturn = generateWeeklyReturn(ytdReturn, volState, rng);

    const newPrice = currentPrice * (1 + weeklyReturn);

    // ===== 2. Generate new VIX =====
    const newVIX = generateVIX(currentVIX, weeklyReturn, rng);

    // ===== 3. Update volatility clustering state =====
    volState = updateVolatilityState(volState, weeklyReturn, rng);

    // ===== 4. Update LEAPS position =====
    const prevLEAPSPosition = { ...leapsPosition };
    leapsPosition = updateLEAPSIncremental(leapsPosition, newPrice, 7);
    const leapsValue = leapsPosition.currentValue;

    // Calculate LEAPS P&L components for this week
    const stockChange = newPrice - prevLEAPSPosition.lastStockPrice;
    const leapsStockImpact = stockChange * prevLEAPSPosition.delta * 100 * prevLEAPSPosition.quantity;
    const leapsThetaDecay = prevLEAPSPosition.theta * 7 * prevLEAPSPosition.quantity;

    // ===== 5. Update/expire short call position =====
    let shortCallValue = 0;
    let expiredCallPremium = 0;  // Track premium of expired call for P&L attribution
    let expiredCallFinalValue = 0;  // Track final value of expired call

    if (shortCallPosition) {
      shortCallPosition.dte = Math.max(0, shortCallPosition.dte - 7);

      if (shortCallPosition.dte <= 0) {
        // Weekly expired - calculate final P&L before closing
        expiredCallPremium = shortCallPosition.premium * shortCallPosition.quantity;

        // Calculate final value at expiration
        if (newPrice > shortCallPosition.strike) {
          // ITM - assignment cost is the final value
          const intrinsicValue = (newPrice - shortCallPosition.strike) * 100;
          expiredCallFinalValue = intrinsicValue * shortCallPosition.quantity;
          cash -= expiredCallFinalValue;
        } else {
          // OTM - expires worthless, final value is 0
          expiredCallFinalValue = 0;
        }

        shortCallPosition = null;
      } else {
        // Still active - mark to market
        shortCallValue = calculateShortCallValue(shortCallPosition, newPrice, newVIX);
      }
    }

    // ===== 6. Calculate account value =====
    // Account value = cash + long positions - short positions
    const accountValue = cash + leapsValue - shortCallValue;

    // ===== 7. Check blowup condition =====
    if (accountValue < config.startingCash * config.blowupThreshold) {
      return {
        pathId,
        blownUp: true,
        blowupWeek: week,
        finalValue: accountValue,
        totalReturn: ((accountValue - config.startingCash) / config.startingCash) * 100,
        maxDrawdown: calculateDrawdown(accountValueHistory),
        weeklyHistory,
      };
    }

    // ===== 8. Check LEAPS rolling =====
    const leapsDelta = leapsPosition.delta;

    // Two types of rolls:
    // 1. TIME ROLL: DTE < 180 → Roll OUT to 365 DTE at 92% moneyness (reset theta clock)
    // 2. DELTA ROLL: Delta < 0.70 → Roll DOWN to lower strike at same DTE (restore delta, avoid ATM death spiral)
    const needsTimeRoll = leapsPosition.dte < config.leapsRollDTEThreshold;
    const needsDeltaRoll = leapsDelta < config.leapsRollDeltaThreshold;

    if (needsTimeRoll || needsDeltaRoll) {
      // Sell current LEAPS
      cash += leapsValue;

      let newStrike: number;
      let newDTE: number;
      let rollType: string;

      if (needsTimeRoll) {
        // TIME ROLL: Reset to 365 DTE at 8% ITM (92% moneyness)
        newStrike = Math.round(newPrice * 0.92);
        newDTE = 365;
        rollType = 'TIME';
      } else {
        // DELTA ROLL: Keep same DTE but roll down to 12% ITM (88% moneyness) to restore ~0.85 delta
        // Going deeper ITM reduces theta and increases delta
        newStrike = Math.round(newPrice * 0.88);
        newDTE = leapsPosition.dte; // Keep same expiration
        rollType = 'DELTA';
      }

      // Create new LEAPS position
      leapsPosition = createInitialLEAPS(newPrice, newStrike, newDTE, leapsPosition.quantity);

      // Buy new LEAPS
      cash -= leapsPosition.costBasis;

      // Recalculate account value AFTER the roll
      const newLeapsValue = leapsPosition.currentValue;
      const accountValueAfterRoll = cash + newLeapsValue - shortCallValue;

      // Calculate roll cost (old value - new cost)
      const rollCost = leapsValue - leapsPosition.costBasis;

      // Record roll action in history
      weeklyHistory.push({
        week,
        price: newPrice,
        vix: newVIX,
        accountValue: accountValueAfterRoll,
        cash,
        leapsValue: newLeapsValue,
        shortCallValue,
        shortCallPremium: shortCallPosition ? shortCallPosition.premium * shortCallPosition.quantity : 0,
        shortCallStrike: shortCallPosition ? shortCallPosition.strike : undefined,
        weeklyReturn: weeklyReturn * 100,
        weeklyPnL: accountValueAfterRoll - accountValueHistory[accountValueHistory.length - 1],
        regime: classifyRegime(newVIX, newPrice, priceHistory, vixHistory),
        action: `Rolled LEAPS ${rollType} to ${newStrike} (DTE=${newDTE})`,
        // LEAPS P&L breakdown (includes old LEAPS P&L before roll + roll cost)
        leapsIntrinsic: leapsPosition.intrinsic,
        leapsExtrinsic: leapsPosition.extrinsic,
        leapsDelta: leapsPosition.delta,
        leapsStockImpact: leapsStockImpact,  // Show old LEAPS stock P&L before roll
        leapsThetaDecay: leapsThetaDecay,    // Show old LEAPS theta decay before roll
        rollCost: rollCost,
        // Short Call expiration P&L (typically not applicable during roll week)
        expiredCallPremium: expiredCallPremium > 0 ? expiredCallPremium : undefined,
        expiredCallFinalValue: expiredCallPremium > 0 ? expiredCallFinalValue : undefined,
      });

      priceHistory.push(newPrice);
      vixHistory.push(newVIX);
      accountValueHistory.push(accountValueAfterRoll);
      currentPrice = newPrice;
      currentVIX = newVIX;

      continue; // Skip to next week
    }

    // ===== 9. Sell new short call (PMCC strategy only, and only if no current short) =====
    let actionDescription = 'No action';

    if (strategy === 'pmcc' && !shortCallPosition) {
      // Evaluate rules to determine strike selection
      const marketContext: MarketContext = {
        currentVIX: newVIX,
        vixHistory,
        priceHistory,
        currentPrice: newPrice,
        weeksSinceStart: week,
        accountValue,
        startingValue: config.startingCash,
      };

      const action = evaluateRules(ruleSet, marketContext);
      actionDescription = describeAction(action, newPrice);

      if (action.type === 'sell_call') {
        const strikePrice = calculateStrikeFromAction(action, newPrice);

        if (strikePrice !== null) {
          const callPricing = calculateOptionPrice({
            stockPrice: newPrice,
            strike: strikePrice,
            dte: 7, // Weekly options (7 DTE)
            vix: newVIX,
            isCall: true,
          });

          shortCallPosition = {
            strike: strikePrice,
            premium: callPricing.total,
            dte: 7,
            quantity: leapsPosition.quantity,
          };

          // Collect premium
          cash += callPricing.total * shortCallPosition.quantity;
          shortCallValue = callPricing.total * shortCallPosition.quantity;
        }
      }
      // If action is 'go_uncovered', shortCallPosition remains null
    }

    // ===== 10. Record week snapshot =====
    const weeklyPnL = accountValue - accountValueHistory[accountValueHistory.length - 1];

    weeklyHistory.push({
      week,
      price: newPrice,
      vix: newVIX,
      accountValue,
      cash,
      leapsValue,
      shortCallValue,
      shortCallPremium: shortCallPosition ? shortCallPosition.premium * shortCallPosition.quantity : 0,
      shortCallStrike: shortCallPosition ? shortCallPosition.strike : undefined,
      weeklyReturn: weeklyReturn * 100,
      weeklyPnL,
      regime: classifyRegime(newVIX, newPrice, priceHistory, vixHistory),
      action: actionDescription,
      // LEAPS P&L breakdown
      leapsIntrinsic: leapsPosition.intrinsic,
      leapsExtrinsic: leapsPosition.extrinsic,
      leapsDelta: leapsPosition.delta,
      leapsStockImpact,
      leapsThetaDecay,
      // Short Call expiration P&L
      expiredCallPremium: expiredCallPremium > 0 ? expiredCallPremium : undefined,
      expiredCallFinalValue: expiredCallPremium > 0 ? expiredCallFinalValue : undefined,
    });

    // ===== 11. Update history arrays =====
    priceHistory.push(newPrice);
    vixHistory.push(newVIX);
    accountValueHistory.push(accountValue);
    currentPrice = newPrice;
    currentVIX = newVIX;
  }

  // ===== Final settlement at week 52 =====
  const finalLEAPSValue = leapsPosition.currentValue;
  const finalShortCallValue = shortCallPosition
    ? calculateShortCallValue(shortCallPosition, currentPrice, currentVIX)
    : 0;
  const finalValue = cash + finalLEAPSValue - finalShortCallValue;

  return {
    pathId,
    blownUp: false,
    finalValue,
    totalReturn: ((finalValue - config.startingCash) / config.startingCash) * 100,
    maxDrawdown: calculateDrawdown(accountValueHistory),
    weeklyHistory,
  };
}
