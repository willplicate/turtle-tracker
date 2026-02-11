// Market Simulation Module
// Generates realistic price movements and VIX behavior

export interface Candle {
  time: number; // timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface MarketScenario {
  name: string;
  initialPrice: number;
  initialVIX: number;
  volatility: number;
  trend: number; // daily drift percentage
  description: string;
}

// Predefined scenarios for different game modes
export const SCENARIOS: Record<string, MarketScenario> = {
  normal: {
    name: 'Normal Market',
    initialPrice: 590,
    initialVIX: 15,
    volatility: 0.008, // 0.8% daily volatility
    trend: 0.0002, // Slight upward drift
    description: 'Standard market conditions with moderate volatility',
  },
  bullish: {
    name: 'Bull Run',
    initialPrice: 590,
    initialVIX: 12,
    volatility: 0.006,
    trend: 0.001, // Strong upward drift
    description: 'Low volatility, steady upward trend',
  },
  bearish: {
    name: 'Bear Market',
    initialPrice: 590,
    initialVIX: 25,
    volatility: 0.015,
    trend: -0.0005, // Downward drift
    description: 'Higher volatility with declining prices',
  },
  choppy: {
    name: 'Choppy Market',
    initialPrice: 590,
    initialVIX: 20,
    volatility: 0.012,
    trend: 0, // No trend, high volatility
    description: 'High volatility with no clear direction',
  },
  crash: {
    name: 'Market Crash',
    initialPrice: 590,
    initialVIX: 35,
    volatility: 0.025,
    trend: -0.002, // Strong downward drift
    description: 'Extreme volatility and declining prices',
  },
  deathSpiral: {
    name: 'Death Spiral',
    initialPrice: 590,
    initialVIX: 28,
    volatility: 0.018,
    trend: -0.001,
    description: 'Slow grind down with periodic spikes',
  },
};

/**
 * Box-Muller transform to generate normally distributed random numbers
 */
function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Generate next price using geometric Brownian motion
 * @param currentPrice - Current stock price
 * @param volatility - Daily volatility (standard deviation)
 * @param trend - Daily drift (mean return)
 * @returns Next day's closing price
 */
export function generatePrice(
  currentPrice: number,
  volatility: number,
  trend: number
): number {
  const randomShock = gaussianRandom();
  const dailyReturn = trend + volatility * randomShock;
  const nextPrice = currentPrice * (1 + dailyReturn);
  return Math.max(nextPrice, 1); // Prevent negative prices
}

/**
 * Generate next VIX value based on price change
 * VIX correlates inversely with price movements
 * @param currentVIX - Current VIX level
 * @param priceChangePercent - Percentage price change
 * @returns Next VIX value
 */
export function generateVIX(
  currentVIX: number,
  priceChangePercent: number
): number {
  // VIX tends to spike on down moves, decline on up moves
  const volatilityOfVIX = 0.05; // VIX is quite volatile itself
  const randomShock = gaussianRandom() * volatilityOfVIX;
  
  // Inverse correlation: -2x price change effect on VIX
  const priceEffect = -priceChangePercent * 2;
  
  // Mean reversion toward 15 (long-term average)
  const meanReversion = (15 - currentVIX) * 0.02;
  
  const nextVIX = currentVIX * (1 + priceEffect + randomShock + meanReversion);
  
  // Clamp VIX to realistic bounds
  return Math.max(9, Math.min(nextVIX, 80));
}

/**
 * Create a full OHLC candle from previous close
 * @param previousClose - Previous day's closing price
 * @param volatility - Daily volatility
 * @returns Candle object with OHLC values
 */
export function createCandle(
  previousClose: number,
  volatility: number
): Candle {
  const trend = 0; // Intraday trend is neutral on average
  const nextClose = generatePrice(previousClose, volatility, trend);
  
  // Generate realistic intraday range
  const intradayVol = volatility * 0.6; // Intraday is less volatile than close-to-close
  const range = previousClose * intradayVol * Math.abs(gaussianRandom());
  
  // Determine if it was an up or down day
  const isUp = nextClose > previousClose;
  
  // Generate high and low based on the range
  let high: number;
  let low: number;
  
  if (isUp) {
    high = Math.max(previousClose, nextClose) + range * 0.5;
    low = Math.min(previousClose, nextClose) - range * 0.3;
  } else {
    high = Math.max(previousClose, nextClose) + range * 0.3;
    low = Math.min(previousClose, nextClose) - range * 0.5;
  }
  
  return {
    time: Date.now(),
    open: previousClose,
    high: Math.max(high, previousClose, nextClose),
    low: Math.min(low, previousClose, nextClose),
    close: nextClose,
    volume: Math.floor(100000000 + Math.random() * 50000000),
  };
}

/**
 * Get a predefined scenario by name
 */
export function getScenario(scenarioType: string): MarketScenario {
  return SCENARIOS[scenarioType] || SCENARIOS.normal;
}

/**
 * Generate a series of candles for chart initialization
 */
export function generateInitialCandles(
  scenario: MarketScenario,
  days: number = 30
): Candle[] {
  const candles: Candle[] = [];
  let currentPrice = scenario.initialPrice;
  
  for (let i = 0; i < days; i++) {
    const candle = createCandle(currentPrice, scenario.volatility);
    candles.push({
      ...candle,
      time: Date.now() - (days - i) * 86400000, // Past dates
    });
    currentPrice = candle.close;
  }
  
  return candles;
}

// Market state for the game
export interface MarketState {
  spyPrice: number;
  vix: number;
  day: number;
  candles: Candle[];
  scenario: MarketScenario;
}

/**
 * Initialize market state for a new game
 */
export function initializeMarket(scenarioType: string = 'normal'): MarketState {
  const scenario = getScenario(scenarioType);
  const candles = generateInitialCandles(scenario, 30);
  
  return {
    spyPrice: candles[candles.length - 1].close,
    vix: scenario.initialVIX,
    day: 0,
    candles,
    scenario,
  };
}

/**
 * Advance market by one day
 */
export function advanceMarket(state: MarketState): MarketState {
  const priceChange = generatePrice(state.spyPrice, state.scenario.volatility, state.scenario.trend);
  const priceChangePercent = (priceChange - state.spyPrice) / state.spyPrice;
  const newVIX = generateVIX(state.vix, priceChangePercent);
  
  const newCandle = createCandle(state.spyPrice, state.scenario.volatility);
  newCandle.time = Date.now() + state.day * 86400000;
  newCandle.close = priceChange;
  
  return {
    spyPrice: priceChange,
    vix: newVIX,
    day: state.day + 1,
    candles: [...state.candles.slice(-50), newCandle], // Keep last 50 candles
    scenario: state.scenario,
  };
}
