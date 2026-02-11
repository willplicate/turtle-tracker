// Game State Manager
// Central state management using Zustand-like pattern with TypeScript

import type { MarketState } from '../market/priceGenerator';
import { initializeMarket, advanceMarket } from '../market/priceGenerator';
import type { LEAPSPosition, ShortCallPosition } from '../../types';
import { calculateOptionPrice } from '../pricing/optionsPricing';

/**
 * Calculate delta based on moneyness (how far ITM/OTM)
 * Based on real SPY options data analysis
 */
function estimateDeltaFromMoneyness(percentITM: number): number {
  if (percentITM >= 15) {
    // Very deep ITM: approach 0.95
    return 0.95;
  } else if (percentITM >= 10) {
    // Deep ITM: 0.90 to 0.95
    return 0.90 + (percentITM - 10) / 5 * 0.05;
  } else if (percentITM >= 5) {
    // Moderate ITM: 0.75 to 0.90
    return 0.75 + (percentITM - 5) / 5 * 0.15;
  } else if (percentITM >= 1) {
    // Slight ITM: 0.60 to 0.75
    return 0.60 + (percentITM - 1) / 4 * 0.15;
  } else if (percentITM >= 0) {
    // Just barely ITM: 0.52 to 0.60
    return 0.52 + percentITM * 0.08;
  } else if (percentITM >= -1) {
    // Just barely OTM: 0.44 to 0.52
    return 0.52 + percentITM * 0.08;
  } else if (percentITM >= -5) {
    // Moderate OTM: 0.30 to 0.44
    return 0.44 + (percentITM + 1) / 4 * 0.14;
  } else {
    // Deep OTM: 0.10 to 0.30
    return Math.max(0.10, 0.30 + (percentITM + 5) / 5 * 0.20);
  }
}

export interface GameState {
  // Account
  cash: number;
  initialCash: number;

  // Market
  market: MarketState;

  // Positions
  leaps: LEAPSPosition | null;
  shortCall: ShortCallPosition | null;

  // P&L Tracking
  realizedPnL: number;
  unrealizedPnL: number;
  weeklyPnL: number;
  totalTrades: number;
  winningTrades: number;

  // Weekly tracking for splash screen
  leapsWeekStartValue: number | null;
  shortCallWeekStartValue: number | null;

  // Game status
  isPlaying: boolean;
  gameSpeed: number; // 1 = 1 sec/day, 2 = 0.5 sec/day, etc.
  currentWeek: number;

  // History for charts
  priceHistory: number[];
  pnlHistory: number[];
}

// Initial state factory
export function createInitialState(scenario: string = 'normal'): GameState {
  const initialCash = 25000;
  const market = initializeMarket(scenario);
  
  return {
    cash: initialCash,
    initialCash,
    market,
    leaps: null,
    shortCall: null,
    realizedPnL: 0,
    unrealizedPnL: 0,
    weeklyPnL: 0,
    totalTrades: 0,
    winningTrades: 0,
    leapsWeekStartValue: null,
    shortCallWeekStartValue: null,
    isPlaying: false,
    gameSpeed: 1,
    currentWeek: 1,
    priceHistory: [market.spyPrice],
    pnlHistory: [0],
  };
}

// Action types
type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'ADVANCE_DAY' }
  | { type: 'BUY_LEAPS'; payload: { strike: number; premium: number; delta: number; theta: number; dte: number } }
  | { type: 'SELL_SHORT_CALL'; payload: { strike: number; premium: number; dte: number } }
  | { type: 'CLOSE_LEAPS' }
  | { type: 'BUY_BACK_CALL'; payload: { cost: number } }
  | { type: 'ROLL_LEAPS'; payload: { newStrike: number; newPremium: number; newDelta: number; newTheta: number; newDte: number; cost: number } }
  | { type: 'ROLL_SHORT_CALL'; payload: { newStrike: number; newPremium: number; newDte: number; cost: number } }
  | { type: 'RESET_GAME'; payload: string };

// State reducer
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME':
      return { ...state, isPlaying: true };
      
    case 'PAUSE_GAME':
      return { ...state, isPlaying: false };
      
    case 'SET_SPEED':
      return { ...state, gameSpeed: action.payload };
      
    case 'ADVANCE_DAY': {
      const newMarket = advanceMarket(state.market);
      const newWeek = Math.floor(newMarket.day / 7) + 1;
      const isNewWeek = newWeek !== state.currentWeek;

      // IMPORTANT: Capture week start values BEFORE updating positions
      // This must happen when entering a new week, using CURRENT position values
      let newLeapsWeekStartValue = state.leapsWeekStartValue;
      let newShortCallWeekStartValue = state.shortCallWeekStartValue;

      if (isNewWeek) {
        // New week starting - capture current values as week start values
        if (state.leaps) {
          newLeapsWeekStartValue = state.leaps.currentValue;
        }
        if (state.shortCall) {
          newShortCallWeekStartValue = state.shortCall.currentValue;
        }
      }

      // Track old position values for P&L calculation
      let dailyPnLChange = 0;
      let updatedLeaps = state.leaps;
      let updatedShortCall = state.shortCall;

      // Update LEAPS position value using delta-based updates
      if (state.leaps) {
        const newDte = Math.max(0, state.leaps.dte - 1);
        const oldValue = state.leaps.currentValue;

        // DELTA-BASED UPDATE: Calculate stock price change
        const stockChange = newMarket.spyPrice - state.leaps.lastStockPrice;

        // Calculate value changes from delta and theta
        const stockImpact = stockChange * state.leaps.delta * 100;
        const thetaImpact = state.leaps.theta * 1; // 1 day

        // Update value
        const newValue = oldValue + stockImpact + thetaImpact;

        // Update extrinsic (decays with theta)
        const newExtrinsic = Math.max(0, state.leaps.extrinsic + thetaImpact); // theta is negative

        // Calculate new delta based on updated moneyness
        const percentITM = ((newMarket.spyPrice - state.leaps.strike) / newMarket.spyPrice) * 100;
        const newDelta = estimateDeltaFromMoneyness(percentITM);

        // Recalculate theta based on remaining extrinsic
        const newTheta = newDte > 0 ? -newExtrinsic / newDte : 0;

        // Calculate daily P&L change
        const valueDiff = newValue - oldValue;
        dailyPnLChange += valueDiff;

        // Update LEAPS with new values
        updatedLeaps = {
          ...state.leaps,
          dte: newDte,
          currentValue: newValue,
          delta: newDelta,
          theta: newTheta,
          premium: newValue,
          extrinsic: newExtrinsic,
          lastStockPrice: newMarket.spyPrice, // Track for next update
        };

        // Handle LEAPS expiration (shouldn't normally happen, but just in case)
        if (newDte <= 0) {
          // LEAPS expired - auto-close at intrinsic value
          console.warn('LEAPS expired at DTE 0');
        }
      }

      // Recalculate short call position value with new market price and DTE
      if (state.shortCall) {
        const newDte = Math.max(0, state.shortCall.dte - 1);
        const oldValue = state.shortCall.currentValue;

        // Recalculate option price with new market conditions
        const pricing = calculateOptionPrice({
          stockPrice: newMarket.spyPrice,
          strike: state.shortCall.strike,
          dte: newDte,
          vix: newMarket.vix,
          isCall: true,
        });

        // Check for expiration and force value to 0 if expired OTM
        let finalValue = pricing.total;
        if (newDte <= 0) {
          // Option expired
          if (newMarket.spyPrice > state.shortCall.strike) {
            // ITM - would be assigned, use intrinsic value
            finalValue = Math.max(0, newMarket.spyPrice - state.shortCall.strike) * 100;
            console.warn('Short call expired ITM - assignment at intrinsic value');
          } else {
            // OTM - expires worthless (good for seller)
            finalValue = 0;
            console.log('Short call expired OTM - full profit captured');
          }
        }

        // For short positions, we profit when value decreases
        // (we sold it, so if it becomes cheaper to buy back, we profit)
        const valueDiff = oldValue - finalValue; // Note: reversed for short position
        dailyPnLChange += valueDiff;

        // Update short call with new values
        updatedShortCall = {
          ...state.shortCall,
          dte: newDte,
          currentValue: finalValue,
          delta: newDte <= 0 ? (finalValue > 0 ? 1.0 : 0.0) : pricing.delta,
          theta: newDte <= 0 ? 0 : pricing.theta,
        };
      }

      // Update weekly P&L (reset to 0 at start of new week)
      const newWeeklyPnL = isNewWeek ? 0 : state.weeklyPnL + dailyPnLChange;

      // Calculate new total unrealized P&L
      const newUnrealizedPnL = state.unrealizedPnL + dailyPnLChange;

      return {
        ...state,
        market: newMarket,
        unrealizedPnL: newUnrealizedPnL,
        weeklyPnL: newWeeklyPnL,
        currentWeek: newWeek,
        priceHistory: [...state.priceHistory.slice(-100), newMarket.spyPrice],
        pnlHistory: [...state.pnlHistory.slice(-100), newUnrealizedPnL],
        leaps: updatedLeaps,
        shortCall: updatedShortCall,
        // Update week start values at week boundaries
        leapsWeekStartValue: newLeapsWeekStartValue,
        shortCallWeekStartValue: newShortCallWeekStartValue,
      };
    }
      
    case 'BUY_LEAPS': {
      const { strike, premium, delta, theta, dte } = action.payload;

      // Calculate extrinsic value (total - intrinsic)
      const intrinsic = Math.max(0, state.market.spyPrice - strike) * 100;
      const extrinsic = premium - intrinsic;

      const leaps: LEAPSPosition = {
        type: 'leaps',
        quantity: 1,
        costBasis: premium,
        currentValue: premium,
        strike,
        dte,
        delta,
        theta,
        premium,
        extrinsic,
        lastStockPrice: state.market.spyPrice, // Initialize for delta-based updates
      };

      return {
        ...state,
        cash: state.cash - premium,
        leaps,
        leapsWeekStartValue: premium, // Set week start value when opening position
        totalTrades: state.totalTrades + 1,
      };
    }
      
    case 'SELL_SHORT_CALL': {
      const { strike, premium, dte } = action.payload;
      const shortCall: ShortCallPosition = {
        type: 'short-call',
        quantity: -1, // Short position
        costBasis: -premium, // Negative cost = credit received
        currentValue: premium,
        strike,
        dte,
        premium,
      };

      return {
        ...state,
        cash: state.cash + premium,
        shortCall,
        shortCallWeekStartValue: premium, // Set week start value when opening position
        totalTrades: state.totalTrades + 1,
      };
    }
      
    case 'CLOSE_LEAPS': {
      if (!state.leaps) return state;

      const pnl = state.leaps.currentValue - state.leaps.costBasis;
      const isWin = pnl > 0;

      return {
        ...state,
        cash: state.cash + state.leaps.currentValue,
        leaps: null,
        leapsWeekStartValue: null, // Reset week start value when closing
        realizedPnL: state.realizedPnL + pnl,
        unrealizedPnL: state.unrealizedPnL - (state.leaps.currentValue - state.leaps.costBasis),
        winningTrades: isWin ? state.winningTrades + 1 : state.winningTrades,
      };
    }
      
    case 'BUY_BACK_CALL': {
      if (!state.shortCall) return state;

      const pnl = state.shortCall.costBasis + state.shortCall.premium - action.payload.cost;
      const isWin = pnl > 0;

      return {
        ...state,
        cash: state.cash - action.payload.cost,
        shortCall: null,
        shortCallWeekStartValue: null, // Reset week start value when closing
        realizedPnL: state.realizedPnL + pnl,
        winningTrades: isWin ? state.winningTrades + 1 : state.winningTrades,
      };
    }
      
    case 'ROLL_LEAPS': {
      if (!state.leaps) return state;

      const { newStrike, newPremium, newDelta, newTheta, newDte, cost } = action.payload;

      // Close old position
      const closePnl = state.leaps.currentValue - state.leaps.costBasis;

      // Calculate extrinsic value for new position
      const intrinsic = Math.max(0, state.market.spyPrice - newStrike) * 100;
      const extrinsic = newPremium - intrinsic;

      // Open new position
      const newLeaps: LEAPSPosition = {
        type: 'leaps',
        quantity: 1,
        costBasis: newPremium,
        currentValue: newPremium,
        strike: newStrike,
        dte: newDte,
        delta: newDelta,
        theta: newTheta,
        premium: newPremium,
        extrinsic,
        lastStockPrice: state.market.spyPrice,
      };

      return {
        ...state,
        cash: state.cash + state.leaps.currentValue - cost,
        leaps: newLeaps,
        leapsWeekStartValue: newPremium, // Set new week start value when rolling
        realizedPnL: state.realizedPnL + closePnl,
        totalTrades: state.totalTrades + 1,
      };
    }
      
    case 'ROLL_SHORT_CALL': {
      if (!state.shortCall) return state;

      const { newStrike, newPremium, newDte, cost } = action.payload;

      // Close old position
      const closePnl = state.shortCall.costBasis + state.shortCall.premium;

      // Open new position
      const newShortCall: ShortCallPosition = {
        type: 'short-call',
        quantity: -1,
        costBasis: -newPremium,
        currentValue: newPremium,
        strike: newStrike,
        dte: newDte,
        premium: newPremium,
      };

      return {
        ...state,
        cash: state.cash - cost + newPremium,
        shortCall: newShortCall,
        shortCallWeekStartValue: newPremium, // Set new week start value when rolling
        realizedPnL: state.realizedPnL + closePnl,
        totalTrades: state.totalTrades + 1,
      };
    }
      
    case 'RESET_GAME':
      return createInitialState(action.payload);
      
    default:
      return state;
  }
}

// Simple store implementation (can be replaced with Zustand later)
export class GameStore {
  private state: GameState;
  private listeners: Set<(state: GameState) => void> = new Set();
  private intervalId: number | null = null;
  private intervalMs: number = 1000; // Default 1x speed
  
  constructor(scenario: string = 'normal') {
    this.state = createInitialState(scenario);
  }
  
  getState(): GameState {
    return this.state;
  }
  
  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }
  
  dispatch(action: GameAction) {
    this.state = gameReducer(this.state, action);
    this.notify();
    
    // Auto-advance if playing
    if (action.type === 'START_GAME') {
      this.startAutoAdvance();
    } else if (action.type === 'PAUSE_GAME') {
      this.stopAutoAdvance();
    } else if (action.type === 'SET_SPEED') {
      if (this.state.isPlaying) {
        this.stopAutoAdvance();
        this.startAutoAdvance();
      }
    }
  }
  
  setInterval(intervalMs: number) {
    this.intervalMs = intervalMs;
    if (this.state.isPlaying) {
      this.stopAutoAdvance();
      this.startAutoAdvance();
    }
  }
  
  private startAutoAdvance() {
    this.stopAutoAdvance();
    this.intervalId = window.setInterval(() => {
      this.dispatch({ type: 'ADVANCE_DAY' });
    }, this.intervalMs);
  }
  
  private stopAutoAdvance() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  // Convenience methods
  start() {
    this.dispatch({ type: 'START_GAME' });
  }
  
  pause() {
    this.dispatch({ type: 'PAUSE_GAME' });
  }
  
  setSpeed(speed: number) {
    this.dispatch({ type: 'SET_SPEED', payload: speed });
  }
  
  reset(scenario: string = 'normal') {
    this.dispatch({ type: 'RESET_GAME', payload: scenario });
  }
  
  advanceDay() {
    this.dispatch({ type: 'ADVANCE_DAY' });
  }
}
