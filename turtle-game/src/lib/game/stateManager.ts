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
    return 0.95;
  } else if (percentITM >= 10) {
    return 0.90 + (percentITM - 10) / 5 * 0.05;
  } else if (percentITM >= 5) {
    return 0.75 + (percentITM - 5) / 5 * 0.15;
  } else if (percentITM >= 1) {
    return 0.60 + (percentITM - 1) / 4 * 0.15;
  } else if (percentITM >= 0) {
    return 0.52 + percentITM * 0.08;
  } else if (percentITM >= -1) {
    return 0.52 + percentITM * 0.08;
  } else if (percentITM >= -5) {
    return 0.44 + (percentITM + 1) / 4 * 0.14;
  } else {
    return Math.max(0.10, 0.30 + (percentITM + 5) / 5 * 0.20);
  }
}

export interface GameState {
  cash: number;
  initialCash: number;
  market: MarketState;
  leaps: LEAPSPosition | null;
  shortCall: ShortCallPosition | null;
  realizedPnL: number;
  unrealizedPnL: number;
  weeklyPnL: number;
  totalTrades: number;
  winningTrades: number;
  leapsWeekStartValue: number | null;
  shortCallWeekStartValue: number | null;
  isPlaying: boolean;
  gameSpeed: number;
  currentWeek: number;
  priceHistory: number[];
  pnlHistory: number[];
  leapsValueHistory: { day: number; value: number; date: Date }[];
}

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
    leapsValueHistory: [],
  };
}

// Action types
type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'ADVANCE_DAY' }
  | { type: 'UPDATE_MARKET_PRICE'; payload: { spyPrice: number; vix?: number } }
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
      
    case 'UPDATE_MARKET_PRICE': {
      const { spyPrice, vix } = action.payload;
      return {
        ...state,
        market: {
          ...state.market,
          spyPrice,
          vix: vix ?? state.market.vix,
        },
        priceHistory: [...state.priceHistory.slice(-100), spyPrice],
      };
    }
      
    case 'ADVANCE_DAY': {
      const newMarket = advanceMarket(state.market);
      const newWeek = Math.floor(newMarket.day / 7) + 1;
      const isNewWeek = newWeek !== state.currentWeek;

      let newLeapsWeekStartValue = state.leapsWeekStartValue;
      let newShortCallWeekStartValue = state.shortCallWeekStartValue;

      if (isNewWeek) {
        if (state.leaps) {
          newLeapsWeekStartValue = state.leaps.currentValue;
        }
        if (state.shortCall) {
          newShortCallWeekStartValue = state.shortCall.currentValue;
        }
      }

      let dailyPnLChange = 0;
      let updatedLeaps = state.leaps;
      let updatedShortCall = state.shortCall;

      if (state.leaps) {
        const newDte = Math.max(0, state.leaps.dte - 1);
        const oldValue = state.leaps.currentValue;
        const stockChange = newMarket.spyPrice - state.leaps.lastStockPrice;
        const stockImpact = stockChange * state.leaps.delta * 100;
        const thetaImpact = state.leaps.theta * 1;
        const newValue = oldValue + stockImpact + thetaImpact;
        const newExtrinsic = Math.max(0, state.leaps.extrinsic + thetaImpact);
        const percentITM = ((newMarket.spyPrice - state.leaps.strike) / newMarket.spyPrice) * 100;
        const newDelta = estimateDeltaFromMoneyness(percentITM);
        const newTheta = newDte > 0 ? -newExtrinsic / newDte : 0;
        const valueDiff = newValue - oldValue;
        dailyPnLChange += valueDiff;

        updatedLeaps = {
          ...state.leaps,
          dte: newDte,
          currentValue: newValue,
          delta: newDelta,
          theta: newTheta,
          premium: newValue,
          extrinsic: newExtrinsic,
          lastStockPrice: newMarket.spyPrice,
        };

        if (newDte <= 0) {
          console.warn('LEAPS expired at DTE 0');
        }
      }

      if (state.shortCall) {
        const newDte = Math.max(0, state.shortCall.dte - 1);
        const oldValue = state.shortCall.currentValue;

        const pricing = calculateOptionPrice({
          stockPrice: newMarket.spyPrice,
          strike: state.shortCall.strike,
          dte: newDte,
          vix: newMarket.vix,
          isCall: true,
        });

        let finalValue = pricing.total;
        if (newDte <= 0) {
          if (newMarket.spyPrice > state.shortCall.strike) {
            finalValue = Math.max(0, newMarket.spyPrice - state.shortCall.strike) * 100;
            console.warn('Short call expired ITM - assignment at intrinsic value');
          } else {
            finalValue = 0;
            console.log('Short call expired OTM - full profit captured');
          }
        }

        const valueDiff = oldValue - finalValue;
        dailyPnLChange += valueDiff;

        updatedShortCall = {
          ...state.shortCall,
          dte: newDte,
          currentValue: finalValue,
          delta: newDte <= 0 ? (finalValue > 0 ? 1.0 : 0.0) : pricing.delta,
          theta: newDte <= 0 ? 0 : pricing.theta,
        };
      }

      const newWeeklyPnL = isNewWeek ? 0 : state.weeklyPnL + dailyPnLChange;
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
        leapsWeekStartValue: newLeapsWeekStartValue,
        shortCallWeekStartValue: newShortCallWeekStartValue,
        leapsValueHistory: updatedLeaps 
          ? [...state.leapsValueHistory.slice(-200), { 
              day: newMarket.day, 
              value: updatedLeaps.currentValue,
              date: new Date() 
            }]
          : state.leapsValueHistory,
      };
    }
      
    case 'BUY_LEAPS': {
      const { strike, premium, delta, theta, dte } = action.payload;
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
        lastStockPrice: state.market.spyPrice,
      };

      return {
        ...state,
        cash: state.cash - premium,
        leaps,
        leapsWeekStartValue: premium,
        totalTrades: state.totalTrades + 1,
        leapsValueHistory: [{ day: state.market.day, value: premium, date: new Date() }],
      };
    }
      
    case 'SELL_SHORT_CALL': {
      const { strike, premium, dte } = action.payload;
      const shortCall: ShortCallPosition = {
        type: 'short-call',
        quantity: -1,
        costBasis: -premium,
        currentValue: premium,
        strike,
        dte,
        premium,
      };

      return {
        ...state,
        cash: state.cash + premium,
        shortCall,
        shortCallWeekStartValue: premium,
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
        leapsWeekStartValue: null,
        leapsValueHistory: [],
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
        shortCallWeekStartValue: null,
        realizedPnL: state.realizedPnL + pnl,
        winningTrades: isWin ? state.winningTrades + 1 : state.winningTrades,
      };
    }
      
    case 'ROLL_LEAPS': {
      if (!state.leaps) return state;

      const { newStrike, newPremium, newDelta, newTheta, newDte, cost } = action.payload;
      const closePnl = state.leaps.currentValue - state.leaps.costBasis;
      const intrinsic = Math.max(0, state.market.spyPrice - newStrike) * 100;
      const extrinsic = newPremium - intrinsic;

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
        leapsWeekStartValue: newPremium,
        leapsValueHistory: [{ day: state.market.day, value: newPremium, date: new Date() }],
        realizedPnL: state.realizedPnL + closePnl,
        totalTrades: state.totalTrades + 1,
      };
    }
      
    case 'ROLL_SHORT_CALL': {
      if (!state.shortCall) return state;

      const { newStrike, newPremium, newDte, cost } = action.payload;
      const closePnl = state.shortCall.costBasis + state.shortCall.premium;

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
        shortCallWeekStartValue: newPremium,
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

// Simple store implementation
export class GameStore {
  private state: GameState;
  private listeners: Set<(state: GameState) => void> = new Set();
  private intervalId: number | null = null;
  private intervalMs: number = 1000;
  
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
  
  updateMarketPrice(spyPrice: number, vix?: number) {
    this.dispatch({ type: 'UPDATE_MARKET_PRICE', payload: { spyPrice, vix } });
  }
}
