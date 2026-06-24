// Stock Price API Module
// Fetches real-time stock prices and VIX data

export interface StockPriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface VIXData {
  price: number;
  change: number;
  changePercent: number;
}

export interface MarketData {
  spy: StockPriceData;
  vix: VIXData;
}

// API Configuration
const API_CONFIG = {
  // Default to demo/test mode - no API key required
  useRealApi: false,
  apiKey: '',
  baseUrl: 'https://api.polygon.io/v2',
};

/**
 * Configure the API with your credentials
 * @param apiKey Your Polygon.io API key (or other provider)
 * @param useRealApi Set to true to use real API calls
 */
export function configureAPI(apiKey: string, useRealApi: boolean = false): void {
  API_CONFIG.apiKey = apiKey;
  API_CONFIG.useRealApi = useRealApi;
}

/**
 * Estimate VIX based on recent SPY price volatility
 * This is a simplified approximation since VIX requires options data
 * @param spyPrice Current SPY price
 * @param history Recent price history (optional)
 * @returns Estimated VIX value (10-50 range)
 */
function estimateVIX(_spyPrice: number, history?: number[]): number {
  if (!history || history.length < 2) {
    // Default to moderate volatility if no history
    return 15 + Math.random() * 5;
  }
  
  // Calculate realized volatility from recent price changes
  const returns: number[] = [];
  for (let i = 1; i < history.length; i++) {
    returns.push((history[i] - history[i-1]) / history[i-1]);
  }
  
  // Calculate standard deviation of returns
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Annualize and convert to VIX-like scale
  // VIX is annualized volatility, so multiply by sqrt(252 trading days)
  const annualizedVol = stdDev * Math.sqrt(252) * 100;
  
  // Clamp to realistic range (VIX rarely goes below 10 or above 50 in normal conditions)
  return Math.max(10, Math.min(50, annualizedVol));
}

/**
 * Generate demo/test data for development
 * Returns realistic mock data without API calls
 */
function getDemoData(): MarketData {
  const basePrice = 590;
  const variation = (Math.random() - 0.5) * 10; // ±$5 random variation
  const spyPrice = basePrice + variation;
  
  // Generate realistic VIX (12-25 range for demo)
  const vixPrice = 15 + Math.random() * 10;
  
  return {
    spy: {
      symbol: 'SPY',
      price: spyPrice,
      change: variation,
      changePercent: (variation / basePrice) * 100,
      timestamp: Date.now(),
    },
    vix: {
      price: vixPrice,
      change: (Math.random() - 0.5) * 2,
      changePercent: (Math.random() - 0.5) * 10,
    },
  };
}

/**
 * Fetch real SPY price from Polygon.io API
 * Requires API key to be configured
 */
async function fetchPolygonData(): Promise<MarketData> {
  if (!API_CONFIG.apiKey) {
    throw new Error('Polygon API key not configured. Call configureAPI() first.');
  }
  
  try {
    // Fetch SPY data
    const spyResponse = await fetch(
      `${API_CONFIG.baseUrl}/aggs/ticker/SPY/prev?apiKey=${API_CONFIG.apiKey}`
    );
    
    if (!spyResponse.ok) {
      throw new Error(`SPY API error: ${spyResponse.status}`);
    }
    
    const spyData = await spyResponse.json();
    const spyResult = spyData.results?.[0];
    
    if (!spyResult) {
      throw new Error('No SPY data returned from API');
    }
    
    const spyPrice = spyResult.c;
    const spyPrevClose = spyResult.o; // Using open as proxy for prev close
    const spyChange = spyPrice - spyPrevClose;
    
    // Try to fetch VIX (VIXX or VIX index)
    let vixPrice = 15; // Default
    try {
      const vixResponse = await fetch(
        `${API_CONFIG.baseUrl}/aggs/ticker/VIX/prev?apiKey=${API_CONFIG.apiKey}`
      );
      if (vixResponse.ok) {
        const vixData = await vixResponse.json();
        vixPrice = vixData.results?.[0]?.c ?? 15;
      }
    } catch {
      // VIX fetch failed, use estimation
      vixPrice = estimateVIX(spyPrice);
    }
    
    return {
      spy: {
        symbol: 'SPY',
        price: spyPrice,
        change: spyChange,
        changePercent: (spyChange / spyPrevClose) * 100,
        timestamp: Date.now(),
      },
      vix: {
        price: vixPrice,
        change: 0,
        changePercent: 0,
      },
    };
  } catch (error) {
    console.error('Error fetching from Polygon:', error);
    throw error;
  }
}

/**
 * Fetch current market data (SPY price and VIX)
 * Uses real API if configured, otherwise returns demo data
 * @returns Promise with market data
 */
export async function fetchMarketData(): Promise<MarketData> {
  if (API_CONFIG.useRealApi && API_CONFIG.apiKey) {
    return fetchPolygonData();
  }
  
  // Return demo data with a small delay to simulate network
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getDemoData());
    }, 500);
  });
}

/**
 * Fetch just the SPY price
 * Convenience wrapper for simple use cases
 */
export async function fetchSPYPrice(): Promise<number> {
  const data = await fetchMarketData();
  return data.spy.price;
}

/**
 * Check if API is properly configured
 */
export function isAPIConfigured(): boolean {
  return API_CONFIG.useRealApi && API_CONFIG.apiKey.length > 0;
}

/**
 * Get current API configuration status
 */
export function getAPIStatus(): { configured: boolean; mode: 'demo' | 'live' } {
  return {
    configured: isAPIConfigured(),
    mode: API_CONFIG.useRealApi && API_CONFIG.apiKey ? 'live' : 'demo',
  };
}
