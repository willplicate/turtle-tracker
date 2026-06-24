// Market Simulation Module
// Generates realistic price movements and VIX behavior

export interface Candle {
  time: number; // timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  isHistorical?: boolean; // Flag for pre-game historical context candles
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
 * Simplified model matching weekly simulation
 *
 * @param currentVIX - Current VIX level
 * @param priceChangePercent - Daily price change as decimal (e.g., -0.015 for -1.5%)
 * @returns Next VIX value
 */
export function generateVIX(
  currentVIX: number,
  priceChangePercent: number
): number {
  // 1. PRICE EFFECT: Conservative asymmetric correlation
  let priceEffect: number;

  if (priceChangePercent < 0) {
    // DOWN MOVES: VIX spikes (conservative multipliers for daily)
    const absChange = Math.abs(priceChangePercent);
    let multiplier: number;
    if (absChange < 0.004) {
      multiplier = 6; // Small daily drops
    } else if (absChange < 0.01) {
      multiplier = 8; // Medium daily drops
    } else {
      multiplier = 10; // Large daily drops (capped)
    }
    priceEffect = absChange * multiplier;
  } else {
    // UP MOVES: VIX declines
    const absChange = Math.abs(priceChangePercent);
    priceEffect = -absChange * 3;
  }

  // 2. MEAN REVERSION: Very strong pull toward 17
  const target = 17;
  const decayRate = 0.08; // Daily rate (weekly 0.35 / 5 ≈ 0.07)
  const meanReversion = ((target - currentVIX) / currentVIX) * decayRate;

  // 3. RANDOM SHOCK: Minimal noise
  const vixVolatility = 0.02; // ~2% daily (4% weekly / sqrt(5))
  const randomShock = gaussianRandom() * vixVolatility;

  // Calculate next VIX
  const vixChange = priceEffect + meanReversion + randomShock;
  const nextVIX = currentVIX * (1 + vixChange);

  // Clamp to realistic bounds
  return Math.max(10, Math.min(nextVIX, 80));
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

/**
 * Generate historical context candles (shown before game starts)
 * Working backwards from the final price to show market context
 */
export function generateHistoricalContextCandles(
  finalPrice: number,
  numCandles: number = 6,
  _volatility: number = 0.008
): Candle[] {
  const candles: Candle[] = [];
  let currentPrice = finalPrice;

  // Generate candles in reverse order
  for (let i = 0; i < numCandles; i++) {
    // Each week, previous week's close was within -2% to +3% of current open
    const weeklyChange = (Math.random() * 5 - 2) / 100;
    const open = currentPrice / (1 + weeklyChange);
    const close = currentPrice;

    // Add intraweek volatility
    const vol = Math.abs(weeklyChange) + 0.01;
    const high = Math.max(open, close) * (1 + vol * 0.5);
    const low = Math.min(open, close) * (1 - vol * 0.5);

    candles.unshift({
      time: Date.now() - (numCandles - i) * 604800000, // 1 week in ms
      open,
      high,
      low,
      close,
      isHistorical: true,
    });

    currentPrice = open; // Next iteration works from this open
  }

  return candles;
}

/**
 * Generate VIX historical candles that correlate inversely with SPY movement
 * VIX typically spikes when SPY drops and declines when SPY rises
 */
export function generateVIXHistoricalContextCandles(
  finalVIX: number,
  spyCandles: Candle[],
  numCandles: number = 6
): Candle[] {
  const vixCandles: Candle[] = [];
  let currentVIX = finalVIX;

  // Generate candles in reverse order (matching SPY candles)
  for (let i = 0; i < numCandles; i++) {
    const spyCandle = spyCandles[spyCandles.length - 1 - i];
    if (!spyCandle) break;

    // Calculate SPY's weekly change for this period
    const spyChange = (spyCandle.close - spyCandle.open) / spyCandle.open;
    
    // VIX moves inversely to SPY (with some randomness)
    // When SPY drops 2%, VIX might spike 10-20%
    // When SPY rises 2%, VIX might decline 5-10%
    let vixChangePercent: number;
    if (spyChange < 0) {
      // SPY dropped - VIX spikes (exaggerated move)
      vixChangePercent = Math.abs(spyChange) * (4 + Math.random() * 4); // 4-8x multiplier
    } else {
      // SPY rose - VIX declines
      vixChangePercent = -spyChange * (1.5 + Math.random() * 2); // 1.5-3.5x multiplier
    }

    // Add some random noise
    vixChangePercent += (Math.random() - 0.5) * 0.1;

    const open = currentVIX / (1 + vixChangePercent);
    const close = currentVIX;

    // VIX intraweek range is typically wider percentage-wise than SPY
    const vol = Math.abs(vixChangePercent) + 0.05;
    const high = Math.max(open, close) * (1 + vol * 0.8);
    const low = Math.min(open, close) * (1 - vol * 0.5);

    vixCandles.unshift({
      time: spyCandle.time,
      open: Math.max(10, open),
      high: Math.max(10, high),
      low: Math.max(10, low),
      close: Math.max(10, close),
      isHistorical: true,
    });

    currentVIX = open;
  }

  return vixCandles;
}

// Market state for the game
export interface MarketState {
  spyPrice: number;
  vix: number;
  day: number;
  candles: Candle[];
  vixCandles: Candle[]; // VIX price history
  scenario: MarketScenario;
}

/**
 * Initialize market state for a new game
 */
export function initializeMarket(scenarioType: string = 'normal'): MarketState {
  const scenario = getScenario(scenarioType);
  
  // Generate historical context candles (shown before game starts)
  // These provide market context so users can see the trend before playing
  const numHistoricalCandles = 6; // Show 6 weeks of history
  const currentPrice = scenario.initialPrice;
  const historicalCandles = generateHistoricalContextCandles(
    currentPrice,
    numHistoricalCandles,
    scenario.volatility
  );
  
  // Generate corresponding VIX historical candles
  const currentVIX = scenario.initialVIX;
  const vixHistoricalCandles = generateVIXHistoricalContextCandles(
    currentVIX,
    historicalCandles,
    numHistoricalCandles
  );
  
  // Add one initial game candle (day 0) that's not marked as historical
  const initialGameCandle = createCandle(currentPrice, scenario.volatility);
  initialGameCandle.time = Date.now();
  initialGameCandle.open = currentPrice;
  initialGameCandle.close = currentPrice; // Start at current price
  initialGameCandle.high = currentPrice * 1.002; // Small range for visual
  initialGameCandle.low = currentPrice * 0.998;
  
  const candles = [...historicalCandles, initialGameCandle];
  
  // Initial VIX candle
  const initialVIXCandle: Candle = {
    time: Date.now(),
    open: currentVIX,
    high: currentVIX * 1.02,
    low: currentVIX * 0.98,
    close: currentVIX,
  };
  
  const vixCandles = [...vixHistoricalCandles, initialVIXCandle];
  
  return {
    spyPrice: currentPrice,
    vix: currentVIX,
    day: 0,
    candles,
    vixCandles,
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
  
  // Create corresponding VIX candle
  const vixChange = newVIX - state.vix;
  const vixVol = Math.abs(vixChange) / state.vix + 0.02;
  const newVIXCandle: Candle = {
    time: Date.now() + state.day * 86400000,
    open: state.vix,
    high: Math.max(state.vix, newVIX) * (1 + vixVol * 0.3),
    low: Math.min(state.vix, newVIX) * (1 - vixVol * 0.2),
    close: newVIX,
  };
  
  return {
    spyPrice: priceChange,
    vix: newVIX,
    day: state.day + 1,
    candles: [...state.candles.slice(-50), newCandle], // Keep last 50 candles
    vixCandles: [...state.vixCandles.slice(-50), newVIXCandle], // Keep last 50 VIX candles
    scenario: state.scenario,
  };
}
