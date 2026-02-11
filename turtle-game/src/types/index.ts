// Core types for the Turtle Trading Simulator

export interface Position {
  type: 'shares' | 'leaps' | 'short-call';
  quantity: number;
  costBasis: number;
  currentValue: number;
}

export interface SharesPosition extends Position {
  type: 'shares';
  sharesOwned: number;
  pricePerShare: number;
}

export interface LEAPSPosition extends Position {
  type: 'leaps';
  strike: number;
  dte: number; // Days to expiration
  delta: number; // 0.0 to 1.0
  theta: number; // Daily decay in dollars
  premium: number; // Current value
  extrinsic: number; // Extrinsic value (for theta decay tracking)
  lastStockPrice: number; // Track stock price for delta-based updates
}

export interface ShortCallPosition extends Position {
  type: 'short-call';
  strike: number;
  dte: number;
  premium: number; // Collected premium
  currentValue: number; // What it would cost to buy back
  delta?: number; // Option delta
  theta?: number; // Daily time decay
}

export interface MarketState {
  spyPrice: number;
  vix: number;
  currentDay: number; // Day number in simulation
}

export interface GameState {
  cash: number;
  positions: Position[];
  market: MarketState;
  totalValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
}

export interface TutorialState {
  currentScreen: number;
  currentTutorial: number;
  hasShares: boolean;
  hasLEAPS: boolean;
  hasShortCall: boolean;
}

// Pricing parameters
export interface PricingParams {
  stockPrice: number;
  strike: number;
  dte: number;
  vix: number;
}

export interface OptionValue {
  intrinsic: number;
  extrinsic: number;
  total: number;
}

// Tutorial screen data
export interface TutorialScreen {
  title: string;
  content: string;
  interactive?: boolean;
}
