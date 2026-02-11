// Main Game Screen
// Integrates all components for the Turtle Trading Game

import { GameStore, type GameState } from '../lib/game/stateManager';
import { AccountHeader } from './Common/AccountHeader';
import { GameControls, type GameMode } from './Controls/GameControls';
import { CandlestickChart } from './Chart/CandlestickChart';
import { OptionsChain } from './OptionsChain/OptionsChain';
import { LEAPSPanel } from './Positions/LEAPSPanel';
import { ShortCallPanel } from './Positions/ShortCallPanel';
import { calculateOptionPrice } from '../lib/pricing/optionsPricing';
import type { OptionPriceBreakdown } from '../lib/pricing/optionsPricing';
import { calculateLEAPSPnL, calculateShortCallPnL } from '../lib/game/positionManager';
import { formatCurrency, getPnLColorClass } from '../lib/game/pnlCalculator';

export class GameScreen {
  private container: HTMLElement;
  private store: GameStore;
  private unsubscribe: (() => void) | null = null;
  private gameMode: GameMode = '1x';
  private isFridaySplashOpen = false;
  private lastSplashWeek = -1; // Track which week we last showed splash for
  private optionsChainMode: 'weekly' | 'leaps' = 'weekly';
  
  // Component references
  private accountHeader: AccountHeader | null = null;
  private gameControls: GameControls | null = null;
  private candlestickChart: CandlestickChart | null = null;
  private optionsChain: OptionsChain | null = null;
  private leapsPanel: LEAPSPanel | null = null;
  private shortCallPanel: ShortCallPanel | null = null;
  
  // DOM element references
  private headerEl!: HTMLElement;
  private controlsEl!: HTMLElement;
  private chartEl!: HTMLElement;
  private chainEl!: HTMLElement;
  private splashEl: HTMLElement | null = null;
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.store = new GameStore('normal');
    
    // Create layout structure
    this.createLayout();
    
    // Initialize components
    this.initializeComponents();
    
    // Subscribe to state changes
    this.unsubscribe = this.store.subscribe((state) => {
      this.handleStateUpdate(state);
    });
    
    // Initial render
    this.handleStateUpdate(this.store.getState());
  }
  
  private createLayout(): void {
    this.container.innerHTML = `
      <div class="min-h-screen bg-game-bg px-6 py-4">
        <!-- Simplified Header -->
        <div id="game-header" class="mb-4"></div>

        <!-- Controls -->
        <div id="game-controls" class="mb-4"></div>

        <!-- Main Grid: 3 equal columns -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <!-- Left: Options Chain (3 cols) -->
          <div id="options-chain" class="lg:col-span-3 h-[600px]"></div>

          <!-- Center: Chart (6 cols) -->
          <div id="chart-container" class="lg:col-span-6 h-[600px]"></div>

          <!-- Right: Positions Stack (3 cols) -->
          <div class="lg:col-span-3 flex flex-col gap-4">
            <div id="leaps-panel" class="flex-shrink-0"></div>
            <div id="shortcall-panel" class="flex-shrink-0"></div>
          </div>
        </div>

        <!-- Splash Screen Container -->
        <div id="splash-container"></div>
      </div>
    `;

    this.headerEl = this.container.querySelector('#game-header')!;
    this.controlsEl = this.container.querySelector('#game-controls')!;
    this.chainEl = this.container.querySelector('#options-chain')!;
    this.chartEl = this.container.querySelector('#chart-container')!;
    this.splashEl = this.container.querySelector('#splash-container');
  }
  
  private initializeComponents(): void {
    const state = this.store.getState();
    
    // Account Header
    this.accountHeader = new AccountHeader(this.headerEl, { state });
    
    // Game Controls
    this.gameControls = new GameControls(this.controlsEl, {
      state,
      gameMode: this.gameMode,
      onStart: () => this.store.start(),
      onPause: () => this.store.pause(),
      onModeChange: (mode) => this.handleModeChange(mode),
      onReset: () => this.store.reset(),
      onScenarioChange: (scenario) => this.store.reset(scenario),
    });
    
    // Candlestick Chart
    this.candlestickChart = new CandlestickChart(this.chartEl);
    
    // Options Chain
    this.optionsChain = new OptionsChain(this.chainEl, {
      stockPrice: state.market.spyPrice,
      vix: state.market.vix,
      onSelectStrike: (strike, price) => this.handleStrikeSelection(strike, price),
      mode: this.optionsChainMode,
      onModeChange: (mode) => {
        this.optionsChainMode = mode;
      },
    });
    
    // Position Panels
    const leapsContainer = this.container.querySelector('#leaps-panel')! as HTMLElement;
    this.leapsPanel = new LEAPSPanel(leapsContainer, {
      state,
      onBuyLEAPS: () => this.openBuyLEAPSDialog(),
      onRollLEAPS: () => this.openRollLEAPSDialog(),
      onCloseLEAPS: () => this.closeLEAPS(),
    });
    
    const shortCallContainer = this.container.querySelector('#shortcall-panel')! as HTMLElement;
    this.shortCallPanel = new ShortCallPanel(shortCallContainer, {
      state,
      onSellCall: () => this.openSellCallDialog(),
      onRollCall: () => this.openRollCallDialog(),
      onBuyBackCall: () => this.buyBackCall(),
    });
  }
  
  private handleStateUpdate(state: GameState): void {
    // Check if it's Friday (day % 5 === 4) and we haven't shown splash yet for this week
    const tradingDay = state.market.day % 5;
    const isFriday = tradingDay === 4;
    const currentWeek = Math.floor(state.market.day / 5) + 1;

    // DEBUG: Log Friday detection
    if (isFriday) {
      console.log('🎉 FRIDAY DETECTED!', {
        day: state.market.day,
        tradingDay,
        currentWeek,
        isFridaySplashOpen: this.isFridaySplashOpen,
        lastSplashWeek: this.lastSplashWeek,
        shouldShow: !this.isFridaySplashOpen && currentWeek !== this.lastSplashWeek && state.market.day > 0
      });
    }

    // Only show splash once per week when reaching Friday
    if (isFriday && !this.isFridaySplashOpen && currentWeek !== this.lastSplashWeek && state.market.day > 0) {
      console.log('📊 SHOWING FRIDAY SPLASH');
      this.lastSplashWeek = currentWeek;
      this.showFridaySplash(state);
      this.store.pause();
    }

    // Update all components
    this.updateComponents(state);

    // Auto-trading logic for auto mode
    if (this.gameMode === 'auto' && state.isPlaying && !this.isFridaySplashOpen) {
      this.executeAutoTradeRules(state);
    }
  }
  
  private handleModeChange(mode: GameMode): void {
    this.gameMode = mode;
    
    // Update interval timing based on mode
    switch (mode) {
      case 'slow':
        this.store.setInterval(3000); // 3 seconds per candle
        break;
      case '1x':
      case 'auto':
        this.store.setInterval(1000); // 1 second per candle
        break;
    }
    
    this.updateComponents(this.store.getState());
  }
  
  
  private executeAutoTradeRules(state: GameState): void {
    const { vix } = state.market;
    const { leaps, shortCall } = state;
    
    // If we have LEAPS but no short call, sell according to VIX rules
    if (leaps && !shortCall && vix < 40) {
      let strikeOffset = 0;
      
      if (vix < 20) {
        // Sell $3 OTM
        strikeOffset = 3;
      } else if (vix < 30) {
        // Sell ATM
        strikeOffset = 0;
      } else if (vix < 40) {
        // Sell $2 ITM
        strikeOffset = -2;
      }
      
      const strike = Math.round((state.market.spyPrice + strikeOffset) / 5) * 5;
      const pricing = calculateOptionPrice({
        stockPrice: state.market.spyPrice,
        strike,
        dte: 5, // 5 trading days to Friday
        vix,
        isCall: true,
      });
      
      // Auto-sell the call
      this.store.dispatch({
        type: 'SELL_SHORT_CALL',
        payload: {
          strike,
          premium: pricing.total,
          dte: 5,
        },
      });
    }
  }
  
  private showFridaySplash(state: GameState): void {
    console.log('🚨 showFridaySplash() called');

    try {
      this.isFridaySplashOpen = true;

      const { leaps, shortCall } = state;
      const weekNumber = Math.floor(state.market.day / 5) + 1;

      console.log('📊 Splash data:', { leaps: !!leaps, shortCall: !!shortCall, weekNumber });

    // Calculate weekly P&L using week start values
    let shortCallPnL = 0;
    let shortCallStatus = '';
    let leapsPnL = 0;
    let totalPnL = 0;

    // Calculate weekly market summary first (needed for debug logging)
    const currentPrice = state.market.spyPrice;
    const priceHistory = state.priceHistory;
    const mondayPrice = priceHistory.length >= 5 ? priceHistory[priceHistory.length - 5] : priceHistory[0];
    const priceChange = currentPrice - mondayPrice;
    const percentChange = (priceChange / mondayPrice) * 100;

    if (shortCall && state.shortCallWeekStartValue !== null) {
      // For short positions: profit when value decreases
      // Weekly P&L = week start value - current value
      const { currentValue } = calculateShortCallPnL(shortCall, state.market.spyPrice, state.market.vix);
      shortCallPnL = state.shortCallWeekStartValue - currentValue;

      // DEBUG LOGGING
      console.log('📊 SHORT CALL P&L CALCULATION:');
      console.log('  Premium collected:', shortCall.premium);
      console.log('  Week start value:', state.shortCallWeekStartValue);
      console.log('  Current value:', currentValue);
      console.log('  DTE:', shortCall.dte);
      console.log('  Strike:', shortCall.strike);
      console.log('  SPY Price:', state.market.spyPrice);
      console.log('  Is ITM?', state.market.spyPrice > shortCall.strike);
      console.log('  Weekly P&L:', shortCallPnL);
      console.log('  Expected (if opened this week):', shortCall.premium - currentValue);

      // Determine if ITM or OTM at expiration
      if (state.market.spyPrice > shortCall.strike) {
        shortCallStatus = 'ITM (In The Money)';
      } else {
        shortCallStatus = 'OTM (Out of The Money) - Full Profit!';
      }
    }

    if (leaps && state.leapsWeekStartValue !== null) {
      // For long positions: profit when value increases
      // Weekly P&L = current value - week start value
      const { currentValue } = calculateLEAPSPnL(leaps, state.market.spyPrice, state.market.vix);
      leapsPnL = currentValue - state.leapsWeekStartValue;

      // DEBUG LOGGING
      console.log('📊 LEAPS P&L CALCULATION:');
      console.log('  Cost basis:', leaps.costBasis);
      console.log('  Week start value:', state.leapsWeekStartValue);
      console.log('  Current value:', currentValue);
      console.log('  Delta:', leaps.delta);
      console.log('  Theta:', leaps.theta);
      console.log('  DTE:', leaps.dte);
      console.log('  Strike:', leaps.strike);
      console.log('  SPY Price:', state.market.spyPrice);
      console.log('  Weekly P&L:', leapsPnL);
      console.log('  Stock movement:', priceChange);
      console.log('  Expected from delta:', priceChange * leaps.delta * 100);
    }

    totalPnL = shortCallPnL + leapsPnL;

    // Log weekly summary to console
    console.log(`
═══════════════════════════════════════════════════════════════
WEEK ${weekNumber} COMPLETE
═══════════════════════════════════════════════════════════════
Market:     $${mondayPrice.toFixed(2)} → $${currentPrice.toFixed(2)} (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%, ${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(2)})
LEAPS P&L:  ${leapsPnL >= 0 ? '+' : ''}$${leapsPnL.toFixed(2)}
Short P&L:  ${shortCallPnL >= 0 ? '+' : ''}$${shortCallPnL.toFixed(2)}
Total P&L:  ${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(2)}
Account:    $${(state.cash + (leaps?.currentValue || 0) - (shortCall?.currentValue || 0)).toFixed(2)}
═══════════════════════════════════════════════════════════════
    `);

    const splashHTML = `
      <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" id="friday-splash">
        <div class="bg-gray-900 border-2 border-matrix-green rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div class="text-center mb-4">
            <div class="text-4xl mb-1">🎉</div>
            <h2 class="text-2xl font-bold text-matrix-green">Week ${weekNumber} Complete!</h2>
            <p class="text-sm text-gray-400">Friday Market Close</p>
          </div>

          <!-- Market Summary -->
          <div class="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-2 border-blue-500/50 rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-gray-400 mb-1">SPY Weekly Movement</div>
                <div class="text-2xl font-bold">
                  <span class="text-gray-300">$${mondayPrice.toFixed(2)}</span>
                  <span class="text-gray-500 mx-2">→</span>
                  <span class="text-white">$${currentPrice.toFixed(2)}</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs text-gray-400 mb-1">Change</div>
                <div class="text-2xl font-bold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}">
                  ${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(2)}
                </div>
                <div class="text-sm font-mono ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}">
                  ${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          <!-- DIAGNOSTIC INFO -->
          <div class="bg-red-900/30 border border-red-500 p-3 rounded text-xs font-mono mb-4">
            <div class="font-bold text-red-400 mb-2">🔍 DIAGNOSTIC INFO:</div>
            ${shortCall ? `
              <div class="mb-2">
                <div class="text-yellow-400 font-bold">Short Call:</div>
                <div>Premium collected: $${shortCall.premium.toFixed(2)}</div>
                <div>Week start value: $${state.shortCallWeekStartValue?.toFixed(2) || 'NULL'}</div>
                <div>Current value: $${shortCall.currentValue.toFixed(2)}</div>
                <div>DTE: ${shortCall.dte}</div>
                <div>Calculated P&L: ${state.shortCallWeekStartValue ? (state.shortCallWeekStartValue - shortCall.currentValue).toFixed(2) : 'N/A'}</div>
                <div>Expected (if opened Mon): $${(shortCall.premium - shortCall.currentValue).toFixed(2)}</div>
              </div>
            ` : ''}
            ${leaps ? `
              <div>
                <div class="text-yellow-400 font-bold">LEAPS:</div>
                <div>Cost basis: $${(leaps.costBasis || 0).toFixed(2)}</div>
                <div>Week start value: $${state.leapsWeekStartValue?.toFixed(2) || 'NULL'}</div>
                <div>Current value: $${(leaps.currentValue || 0).toFixed(2)}</div>
                <div>Delta: ${(leaps.delta || 0).toFixed(3)}</div>
                <div>Calculated P&L: ${state.leapsWeekStartValue ? ((leaps.currentValue || 0) - state.leapsWeekStartValue).toFixed(2) : 'N/A'}</div>
                <div>Expected from delta: $${(priceChange * (leaps.delta || 0) * 100).toFixed(2)}</div>
                <div>Expected from theta: $${((leaps.theta || 0) * 7).toFixed(2)}</div>
                <div>Expected total: $${((priceChange * (leaps.delta || 0) * 100) + ((leaps.theta || 0) * 7)).toFixed(2)}</div>
              </div>
            ` : ''}
          </div>

          <div class="space-y-3 mb-4">
            <!-- Short Call Result -->
            ${shortCall ? `
              <div class="bg-gray-800 p-4 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-bold text-orange-400">Short Call Result</span>
                  <span class="text-sm ${state.market.spyPrice > shortCall.strike ? 'text-red-400' : 'text-green-400'}">${shortCallStatus}</span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span class="text-gray-400">Strike:</span>
                    <span class="ml-2 font-mono">$${shortCall.strike}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Premium:</span>
                    <span class="ml-2 font-mono text-green-400">+${formatCurrency(shortCall.premium)}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Close Price:</span>
                    <span class="ml-2 font-mono">$${state.market.spyPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">P&L:</span>
                    <span class="ml-2 font-mono ${getPnLColorClass(shortCallPnL)}">${shortCallPnL >= 0 ? '+' : ''}${formatCurrency(shortCallPnL)}</span>
                  </div>
                </div>
                ${(() => {
                  const premiumPerShare = shortCall.premium / 100;
                  const breakeven = shortCall.strike + premiumPerShare;
                  const itmAmount = Math.max(0, state.market.spyPrice - shortCall.strike);
                  const priceInBuffer = state.market.spyPrice >= shortCall.strike && state.market.spyPrice <= breakeven;
                  const bufferPercent = priceInBuffer ? ((state.market.spyPrice - shortCall.strike) / premiumPerShare * 100) : 0;
                  const beyondBreakeven = state.market.spyPrice > breakeven;

                  return `
                    <div class="bg-gray-900/50 border border-gray-600 p-2 rounded text-[11px] mb-3">
                      <div class="font-bold text-blue-400 mb-1.5 text-xs">💡 P&L Visualization:</div>

                      <!-- Visual Bar Graph -->
                      <div class="relative h-8 bg-gray-800 rounded-lg overflow-hidden mb-1 border border-gray-700">
                        <!-- OTM Zone (Green) - Left of strike -->
                        <div class="absolute left-0 top-0 bottom-0 bg-green-600/40 border-r-2 border-green-400"
                             style="width: 40%">
                        </div>

                        <!-- Premium Buffer Zone (Yellow) - Strike to breakeven -->
                        <div class="absolute bg-yellow-600/40 top-0 bottom-0 border-r-2 border-yellow-400"
                             style="left: 40%; width: 30%">
                        </div>

                        <!-- Loss Zone (Red) - Beyond breakeven -->
                        <div class="absolute right-0 top-0 bottom-0 bg-red-600/40"
                             style="width: 30%">
                        </div>

                        <!-- "You are here" marker -->
                        ${(() => {
                          let position = 0;
                          let color = 'green-300';
                          let zone = 'OTM';

                          if (beyondBreakeven) {
                            // Beyond breakeven - in red zone
                            const distanceBeyond = state.market.spyPrice - breakeven;
                            const maxDistance = premiumPerShare * 2; // Arbitrary max for visualization
                            position = 70 + Math.min((distanceBeyond / maxDistance) * 30, 29);
                            color = 'red-300';
                            zone = 'ITM';
                          } else if (priceInBuffer) {
                            // In buffer zone - between strike and breakeven
                            position = 40 + (bufferPercent / 100) * 30;
                            color = 'yellow-300';
                            zone = 'Buffer';
                          } else {
                            // OTM - left of strike
                            const distanceFromStrike = Math.abs(state.market.spyPrice - shortCall.strike);
                            const scaleRange = shortCall.strike * 0.05; // 5% of strike as range
                            position = Math.max(5, 40 - (distanceFromStrike / scaleRange) * 35);
                            color = 'green-300';
                            zone = 'OTM';
                          }

                          return `
                            <div class="absolute top-1/2 -translate-y-1/2 text-${color} font-bold text-xs whitespace-nowrap" style="left: ${position}%">
                              ↓
                            </div>
                          `;
                        })()}

                        <!-- Zone labels -->
                        <div class="absolute left-2 top-1 text-[9px] text-green-300 font-bold">OTM</div>
                        <div class="absolute right-2 top-1 text-[9px] text-red-300 font-bold">ITM</div>
                      </div>

                      <!-- Price scale below bar -->
                      <div class="relative h-6 mb-1">
                        <!-- Strike marker -->
                        <div class="absolute" style="left: 40%; transform: translateX(-50%)">
                          <div class="text-[9px] text-yellow-400 font-bold text-center">Strike</div>
                          <div class="text-[9px] text-yellow-400 text-center">$${shortCall.strike}</div>
                        </div>

                        <!-- Breakeven marker -->
                        <div class="absolute" style="left: 70%; transform: translateX(-50%)">
                          <div class="text-[9px] text-orange-400 font-bold text-center">Break</div>
                          <div class="text-[9px] text-orange-400 text-center">$${breakeven.toFixed(2)}</div>
                        </div>

                        <!-- Current price marker -->
                        ${(() => {
                          let position = 0;
                          if (beyondBreakeven) {
                            const distanceBeyond = state.market.spyPrice - breakeven;
                            const maxDistance = premiumPerShare * 2;
                            position = 70 + Math.min((distanceBeyond / maxDistance) * 30, 29);
                          } else if (priceInBuffer) {
                            position = 40 + (bufferPercent / 100) * 30;
                          } else {
                            const distanceFromStrike = Math.abs(state.market.spyPrice - shortCall.strike);
                            const scaleRange = shortCall.strike * 0.05;
                            position = Math.max(5, 40 - (distanceFromStrike / scaleRange) * 35);
                          }

                          return `
                            <div class="absolute" style="left: ${position}%; transform: translateX(-50%)">
                              <div class="text-[9px] text-blue-400 font-bold text-center">You</div>
                              <div class="text-[9px] text-blue-400 text-center">$${state.market.spyPrice.toFixed(2)}</div>
                            </div>
                          `;
                        })()}
                      </div>

                      <div class="text-gray-300 space-y-1">
                        ${beyondBreakeven ? `
                          <div class="text-red-300">
                            <span class="font-bold">Beyond breakeven:</span> Stock at $${state.market.spyPrice.toFixed(2)}, losing $100 per $1 move
                          </div>
                          <div class="font-mono text-xs bg-gray-800 p-1 rounded">
                            $${shortCall.premium.toFixed(0)} premium - $${(itmAmount * 100).toFixed(0)} ITM value = ${shortCallPnL >= 0 ? '+' : ''}$${shortCallPnL.toFixed(0)}
                          </div>
                        ` : priceInBuffer ? `
                          <div class="text-yellow-300">
                            <span class="font-bold">In buffer zone:</span> ${((1 - bufferPercent/100) * 100).toFixed(0)}% of $${shortCall.premium.toFixed(0)} buffer remaining
                          </div>
                        ` : `
                          <div class="text-green-300">
                            <span class="font-bold">Profit zone:</span> Keep full $${shortCall.premium.toFixed(0)} premium!
                          </div>
                        `}
                      </div>
                    </div>
                  `;
                })()}
                <button id="roll-short-call-btn" class="btn-secondary px-4 py-2 text-sm w-full">
                  Roll Short Call to Next Week
                </button>
                <p class="text-xs text-gray-400 mt-2 text-center">Extend your covered call position for another week</p>
              </div>
            ` : `
              <div class="bg-gray-800/50 p-4 rounded-lg">
                <div class="text-center text-gray-400 mb-3">No short call position this week</div>
                ${leaps ? `
                  <button id="sell-call-from-splash-btn" class="btn-warning px-4 py-2 text-sm w-full">
                    Sell Short Call for Next Week
                  </button>
                ` : `
                  <div class="text-xs text-gray-500 text-center">Buy LEAPS first to sell covered calls</div>
                `}
              </div>
            `}
            
            <!-- LEAPS Result -->
            ${leaps ? `
              <div class="bg-gray-800 p-4 rounded-lg">
                <div class="flex justify-between items-center mb-2">
                  <span class="font-bold text-matrix-green">LEAPS Result</span>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span class="text-gray-400">Strike:</span>
                    <span class="ml-2 font-mono">$${leaps.strike}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">DTE Remaining:</span>
                    <span class="ml-2 font-mono">${leaps.dte}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Current Value:</span>
                    <span class="ml-2 font-mono">${formatCurrency(leaps.currentValue || leaps.premium)}</span>
                  </div>
                  <div>
                    <span class="text-gray-400">Weekly P&L:</span>
                    <span class="ml-2 font-mono ${getPnLColorClass(leapsPnL)}">${leapsPnL >= 0 ? '+' : ''}${formatCurrency(leapsPnL)}</span>
                  </div>
                </div>

                ${(() => {
                  // Calculate current delta
                  const currentPricing = calculateOptionPrice({
                    stockPrice: currentPrice,
                    strike: leaps.strike,
                    dte: leaps.dte,
                    vix: state.market.vix,
                    isCall: true,
                  });

                  // Estimated P&L from stock movement (simplified)
                  const deltaPnL = priceChange * currentPricing.delta * 100;
                  const thetaCost = leaps.theta * 7; // 7 days (full week) of theta decay

                  return `
                    <div class="bg-gray-900/50 border border-gray-600 p-2 rounded text-[11px]">
                      <div class="font-bold text-blue-400 mb-1.5 text-xs">💡 LEAPS P&L Calculation:</div>

                      <div class="space-y-1.5 text-gray-300">
                        <div class="font-mono text-[10px] bg-gray-800 p-1.5 rounded space-y-0.5">
                          <div class="flex justify-between">
                            <span class="text-gray-400">Stock Impact:</span>
                            <span class="${deltaPnL >= 0 ? 'text-green-400' : 'text-red-400'}">${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(2)} × ${(currentPricing.delta * 100).toFixed(0)}% = ${deltaPnL >= 0 ? '+' : ''}$${deltaPnL.toFixed(0)}</span>
                          </div>
                          <div class="flex justify-between">
                            <span class="text-gray-400">Time Decay (7d):</span>
                            <span class="text-red-400">${leaps.theta.toFixed(2)}/day × 7 = ${thetaCost >= 0 ? '+' : ''}$${thetaCost.toFixed(0)}</span>
                          </div>
                          <div class="flex justify-between pt-1 border-t border-gray-700">
                            <span class="font-bold">Actual Weekly P&L:</span>
                            <span class="${getPnLColorClass(leapsPnL)} font-bold">${leapsPnL >= 0 ? '+' : ''}$${leapsPnL.toFixed(0)}</span>
                          </div>
                        </div>
                        <div class="text-[9px] text-gray-500 mt-1">
                          Note: VIX changes and delta shifts affect actual P&L
                        </div>
                      </div>
                    </div>
                  `;
                })()}
              </div>
            ` : `
              <div class="bg-gray-800/50 p-4 rounded-lg">
                <div class="text-center text-gray-400 mb-3">No LEAPS position</div>
                <button id="buy-leaps-from-splash-btn" class="btn-primary px-4 py-2 text-sm w-full">
                  Buy LEAPS to Start Strategy
                </button>
              </div>
            `}
            
            <!-- Total -->
            <div class="bg-gradient-to-r from-gray-800 to-gray-700 p-4 rounded-lg border border-gray-600">
              <div class="flex justify-between items-center">
                <span class="text-lg font-bold">Weekly Total P&L</span>
                <span class="text-2xl font-bold font-mono ${getPnLColorClass(totalPnL)}">${totalPnL >= 0 ? '+' : ''}${formatCurrency(totalPnL)}</span>
              </div>
            </div>
            
            <!-- Account Value -->
            <div class="p-4 bg-blue-900/20 rounded-lg">
              <div class="text-gray-400 text-sm text-center mb-2">Total Account Value</div>
              <div class="text-3xl font-bold font-mono text-white text-center mb-3">${formatCurrency(state.cash + (leaps?.currentValue || leaps?.premium || 0) - (shortCall?.currentValue || 0))}</div>

              <!-- Account Breakdown -->
              <div class="text-[10px] font-mono bg-gray-800/50 p-2 rounded space-y-0.5">
                <div class="flex justify-between">
                  <span class="text-gray-400">Cash:</span>
                  <span class="text-white">${formatCurrency(state.cash)}</span>
                </div>
                ${leaps ? `
                  <div class="flex justify-between">
                    <span class="text-gray-400">+ LEAPS value:</span>
                    <span class="text-green-400">+${formatCurrency(leaps.currentValue || leaps.premium)}</span>
                  </div>
                ` : ''}
                ${shortCall ? `
                  <div class="flex justify-between">
                    <span class="text-gray-400">- Short call value:</span>
                    <span class="text-red-400">-${formatCurrency(shortCall.currentValue)}</span>
                  </div>
                ` : ''}
                <div class="flex justify-between pt-1 border-t border-gray-700 text-white font-bold">
                  <span>Total:</span>
                  <span>${formatCurrency(state.cash + (leaps?.currentValue || leaps?.premium || 0) - (shortCall?.currentValue || 0))}</span>
                </div>
              </div>

              <div class="text-[9px] text-gray-500 text-center mt-2">
                Starting balance: $${state.initialCash.toLocaleString()} | Total profit: ${formatCurrency(state.cash + (leaps?.currentValue || leaps?.premium || 0) - (shortCall?.currentValue || 0) - state.initialCash)}
              </div>
            </div>
          </div>
          
          <div class="text-center">
            <button id="close-splash-btn" class="btn-primary px-8 py-3 text-lg w-full">
              Continue to Next Week →
            </button>
          </div>
        </div>
      </div>
    `;

    console.log('🎯 Rendering splash, splashEl exists?', !!this.splashEl);

    if (this.splashEl) {
      console.log('✅ Setting splash HTML');
      this.splashEl.innerHTML = splashHTML;
      console.log('✅ Splash HTML set, length:', splashHTML.length);

      const closeBtn = this.splashEl.querySelector('#close-splash-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closeFridaySplash(state);
        });
      }

      const rollBtn = this.splashEl.querySelector('#roll-short-call-btn');
      if (rollBtn) {
        rollBtn.addEventListener('click', () => {
          this.handleRollFromSplash(state);
        });
      }

      const buyLeapsBtn = this.splashEl.querySelector('#buy-leaps-from-splash-btn');
      if (buyLeapsBtn) {
        buyLeapsBtn.addEventListener('click', () => {
          // Close splash first so dialog shows properly
          this.isFridaySplashOpen = false;
          if (this.splashEl) {
            this.splashEl.innerHTML = '';
          }
          this.openBuyLEAPSDialog();
        });
      }

      const sellCallBtn = this.splashEl.querySelector('#sell-call-from-splash-btn');
      if (sellCallBtn) {
        sellCallBtn.addEventListener('click', () => {
          // Close splash first so dialog shows properly
          this.isFridaySplashOpen = false;
          if (this.splashEl) {
            this.splashEl.innerHTML = '';
          }
          this.openSellCallDialog();
        });
      }
    }
    } catch (error) {
      console.error('❌ ERROR in showFridaySplash:', error);
      this.isFridaySplashOpen = false; // Reset flag so we can try again
      throw error; // Re-throw to see in console
    }
  }
  
  private closeFridaySplash(state: GameState): void {
    this.isFridaySplashOpen = false;

    // Handle expired short call (if not rolled)
    if (state.shortCall) {
      const isITM = state.market.spyPrice > state.shortCall.strike;

      if (isITM) {
        // ITM - simulate assignment (close both positions in real scenario)
        // For now, just close the short call and realize the loss
        this.store.dispatch({
          type: 'BUY_BACK_CALL',
          payload: { cost: state.shortCall.currentValue },
        });
        console.log('Short call expired ITM - assigned (position closed)');
      } else {
        // OTM - expires worthless, we keep full premium
        this.store.dispatch({
          type: 'BUY_BACK_CALL',
          payload: { cost: 0 }, // Expires worthless, no cost to close
        });
        console.log('Short call expired OTM - full profit captured');
      }
    }

    if (this.splashEl) {
      this.splashEl.innerHTML = '';
    }
  }

  private handleRollFromSplash(state: GameState): void {
    if (!state.shortCall) return;

    const currentValue = state.shortCall.currentValue;
    const vix = state.market.vix;

    // Provide VIX-based suggestion
    let suggestion: string;
    if (vix < 20) {
      suggestion = 'VIX < 20: Consider ATM or slightly OTM strikes';
    } else if (vix < 30) {
      suggestion = 'VIX 20-30: Consider ATM or $5 ITM strikes';
    } else {
      suggestion = 'VIX > 30: Consider $10+ ITM strikes for protection';
    }

    const confirmed = confirm(
      `Roll Short Call?\n\n` +
      `This will:\n` +
      `1. Close your current $${state.shortCall.strike} call for $${currentValue.toFixed(0)}\n` +
      `2. Open the Options Chain for you to select a new strike\n\n` +
      `${suggestion}\n\n` +
      `Ready to select a new strike?`
    );

    if (confirmed) {
      // Close current position
      this.store.dispatch({
        type: 'BUY_BACK_CALL',
        payload: { cost: currentValue },
      });

      // Close splash
      this.isFridaySplashOpen = false;
      if (this.splashEl) {
        this.splashEl.innerHTML = '';
      }

      // Switch to weekly mode and show instructions
      this.optionsChainMode = 'weekly';
      this.optionsChain?.setMode('weekly');

      // Show alert with instructions
      setTimeout(() => {
        alert(
          `Select New Strike from Options Chain\n\n` +
          `Your old position has been closed.\n\n` +
          `Now click any strike in the Weekly options chain (left side) to sell a new covered call for next week.\n\n` +
          `${suggestion}`
        );
      }, 100);
    }
  }
  
  private updateComponents(state: GameState): void {
    // Update all components with new state
    this.accountHeader?.update({ state });
    this.gameControls?.update({
      state,
      gameMode: this.gameMode,
      onStart: () => this.store.start(),
      onPause: () => this.store.pause(),
      onModeChange: (mode) => this.handleModeChange(mode),
      onReset: () => this.store.reset(),
      onScenarioChange: (scenario) => this.store.reset(scenario),
    });
    
    // Update chart
    this.candlestickChart?.updateCandles(state.market.candles);
    
    // Update options chain
    this.optionsChain?.update({
      stockPrice: state.market.spyPrice,
      vix: state.market.vix,
      onSelectStrike: (strike, price) => this.handleStrikeSelection(strike, price),
      selectedStrike: state.shortCall?.strike,
      mode: this.optionsChainMode,
      onModeChange: (mode) => {
        this.optionsChainMode = mode;
      },
    });
    
    // Update position panels
    this.leapsPanel?.update({
      state,
      onBuyLEAPS: () => this.openBuyLEAPSDialog(),
      onRollLEAPS: () => this.openRollLEAPSDialog(),
      onCloseLEAPS: () => this.closeLEAPS(),
    });
    
    this.shortCallPanel?.update({
      state,
      onSellCall: () => this.openSellCallDialog(),
      onRollCall: () => this.openRollCallDialog(),
      onBuyBackCall: () => this.buyBackCall(),
    });
  }
  
  private handleStrikeSelection(strike: number, price: OptionPriceBreakdown): void {
    const state = this.store.getState();

    // If in LEAPS mode and no LEAPS position, buy LEAPS
    if (this.optionsChainMode === 'leaps' && !state.leaps) {
      // Confirm LEAPS purchase
      const itmAmount = state.market.spyPrice - strike;
      const confirmed = confirm(
        `Buy LEAPS Call Option?\n\n` +
        `Strike: $${strike}\n` +
        `ITM Amount: $${itmAmount > 0 ? '+' : ''}${itmAmount.toFixed(2)}\n` +
        `DTE: 365 days (1 year)\n` +
        `Delta: ${(price.delta * 100).toFixed(1)}%\n` +
        `Theta: $${price.theta.toFixed(2)}/day\n` +
        `Cost: $${price.total.toLocaleString()}\n\n` +
        `Cash available: $${state.cash.toLocaleString()}\n\n` +
        `Click OK to purchase this LEAPS option.`
      );

      if (confirmed) {
        this.store.dispatch({
          type: 'BUY_LEAPS',
          payload: {
            strike,
            premium: price.total,
            delta: price.delta,
            theta: price.theta,
            dte: 365,
          },
        });
      }
    } else if (!state.leaps) {
      // In weekly mode with no LEAPS - suggest buying LEAPS first
      alert('Please switch to LEAPS mode and click a strike to purchase a LEAPS option first.');
    } else if (!state.shortCall && this.optionsChainMode === 'weekly') {
      // In weekly mode with LEAPS - sell call at selected strike
      const moneyness = strike > state.market.spyPrice ? 'OTM' : strike === Math.round(state.market.spyPrice / 5) * 5 ? 'ATM' : 'ITM';
      const confirmed = confirm(
        `Sell Weekly Call Option?\n\n` +
        `Strike: $${strike} (${moneyness})\n` +
        `DTE: 5 days (to Friday)\n` +
        `Premium Collected: $${price.total.toLocaleString()}\n` +
        `Delta: ${(price.delta * 100).toFixed(1)}%\n\n` +
        `This creates a covered call position against your LEAPS.\n\n` +
        `Click OK to sell this call.`
      );

      if (confirmed) {
        this.sellCall(strike, price);
      }
    } else if (!state.shortCall) {
      // In LEAPS mode but already have LEAPS - switch to weekly mode for short calls
      alert('You have a LEAPS position. Switch to Weekly mode to sell short calls.');
      this.optionsChainMode = 'weekly';
      this.optionsChain?.setMode('weekly');
    }
  }
  
  private openBuyLEAPSDialog(): void {
    // Switch to LEAPS mode so user can click on the options chain
    this.optionsChainMode = 'leaps';
    this.optionsChain?.setMode('leaps');

    alert(
      'Buy LEAPS - Select from Options Chain\n\n' +
      'The Options Chain is now in LEAPS mode (365 DTE).\n\n' +
      'Click on any strike in the chain to select it.\n' +
      'Look for strikes with 80-100 delta (highlighted in green).'
    );
  }
  
  private openSellCallDialog(): void {
    const state = this.store.getState();

    if (!state.leaps) {
      alert('You need to buy LEAPS first!\n\nSwitch to LEAPS mode and click a strike to purchase a LEAPS option.');
      return;
    }

    // Switch to weekly mode so user can click on the options chain
    this.optionsChainMode = 'weekly';
    this.optionsChain?.setMode('weekly');

    // Suggest strike based on VIX
    let suggestion = '';
    if (state.market.vix < 20) {
      suggestion = 'VIX < 20: Consider ATM or slightly OTM for more premium';
    } else if (state.market.vix < 30) {
      suggestion = 'VIX 20-30: Consider ATM strikes for balanced risk/reward';
    } else {
      suggestion = 'VIX > 30: Consider ITM strikes for more protection';
    }

    alert(
      'Sell Short Call - Select from Options Chain\n\n' +
      'The Options Chain is now in Weekly mode (7 DTE).\n\n' +
      'Click on any strike to sell a covered call.\n\n' +
      `Current VIX: ${state.market.vix.toFixed(1)}\n` +
      `${suggestion}\n\n` +
      '▼ ITM (green) = More premium, less risk\n' +
      '◆ ATM (yellow) = Balanced\n' +
      '▲ OTM (red) = Less premium, more upside'
    );
  }
  
  private sellCall(strike: number, pricing: OptionPriceBreakdown): void {
    this.store.dispatch({
      type: 'SELL_SHORT_CALL',
      payload: {
        strike,
        premium: pricing.total,
        dte: 5,
      },
    });
  }
  
  private openRollLEAPSDialog(): void {
    const state = this.store.getState();
    if (!state.leaps) return;
    
    const newStrike = Math.round((state.market.spyPrice * 0.85) / 5) * 5; // 85% moneyness for ~85 delta
    const pricing = calculateOptionPrice({
      stockPrice: state.market.spyPrice,
      strike: newStrike,
      dte: 365,
      vix: state.market.vix,
      isCall: true,
    });
    
    const confirmed = confirm(
      `Roll LEAPS?\n\n` +
      `Close current position and open new LEAPS:\n` +
      `New Strike: $${newStrike}\n` +
      `New DTE: 365 days (1 year)\n` +
      `New Delta: ${(pricing.delta * 100).toFixed(1)}%\n` +
      `New Cost: $${pricing.total.toLocaleString()}\n\n` +
      `This will realize any P&L on current position.`
    );
    
    if (confirmed) {
      this.store.dispatch({
        type: 'ROLL_LEAPS',
        payload: {
          newStrike,
          newPremium: pricing.total,
          newDelta: pricing.delta,
          newTheta: pricing.theta,
          newDte: 365,
          cost: pricing.total,
        },
      });
    }
  }
  
  private openRollCallDialog(): void {
    const state = this.store.getState();
    if (!state.shortCall) return;
    
    // Roll to next week at same strike or adjusted for VIX
    let newStrike = state.shortCall.strike;
    if (state.market.vix > 25) {
      newStrike = Math.round((newStrike - 5) / 5) * 5; // Move ITM if VIX high
    }
    
    const pricing = calculateOptionPrice({
      stockPrice: state.market.spyPrice,
      strike: newStrike,
      dte: 5,
      vix: state.market.vix,
      isCall: true,
    });
    
    const confirmed = confirm(
      `Roll Short Call?\n\n` +
      `Buy back current call and sell new call:\n` +
      `New Strike: $${newStrike}\n` +
      `New DTE: 5 days\n` +
      `New Premium: $${pricing.total.toLocaleString()}\n\n` +
      `Any profit/loss on current call will be realized.`
    );
    
    if (confirmed) {
      this.store.dispatch({
        type: 'ROLL_SHORT_CALL',
        payload: {
          newStrike,
          newPremium: pricing.total,
          newDte: 5,
          cost: 0, // Will be calculated based on buyback
        },
      });
    }
  }
  
  private closeLEAPS(): void {
    const state = this.store.getState();
    if (!state.leaps) return;
    
    const confirmed = confirm('Close LEAPS position? This will realize all P&L.');
    if (confirmed) {
      this.store.dispatch({ type: 'CLOSE_LEAPS' });
    }
  }
  
  private buyBackCall(): void {
    const state = this.store.getState();
    if (!state.shortCall) return;
    
    // Calculate current value to buy back
    const pricing = calculateOptionPrice({
      stockPrice: state.market.spyPrice,
      strike: state.shortCall.strike,
      dte: state.shortCall.dte,
      vix: state.market.vix,
      isCall: true,
    });
    
    const confirmed = confirm(
      `Buy back call option?\n\n` +
      `Cost to close: $${pricing.total.toLocaleString()}\n` +
      `Original credit: $${state.shortCall.premium.toLocaleString()}\n` +
      `P&L: $${(state.shortCall.premium - pricing.total).toLocaleString()}`
    );
    
    if (confirmed) {
      this.store.dispatch({
        type: 'BUY_BACK_CALL',
        payload: { cost: pricing.total },
      });
    }
  }
  
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.candlestickChart?.destroy();
  }
}
