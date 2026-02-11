// Game Controls Component
// Start/Pause/Speed controls and game status

import type { GameState } from '../../lib/game/stateManager';

export type GameMode = 'slow' | '1x' | 'auto';

interface GameControlsProps {
  state: GameState;
  gameMode: GameMode;
  onStart: () => void;
  onPause: () => void;
  onModeChange: (mode: GameMode) => void;
  onReset: () => void;
  onScenarioChange: (scenario: string) => void;
}

export class GameControls {
  private container: HTMLElement;
  private props: GameControlsProps;
  
  constructor(container: HTMLElement, props: GameControlsProps) {
    this.container = container;
    this.props = props;
    this.render();
  }
  
  update(props: GameControlsProps): void {
    this.props = props;
    this.render();
  }
  
  private render(): void {
    const { state, gameMode, onStart, onPause, onModeChange, onReset, onScenarioChange } = this.props;
    const { isPlaying, market, currentWeek } = state;
    
    // Trading days: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4
    const tradingDay = market.day % 5;
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const currentDayName = dayNames[tradingDay];
    const isFriday = tradingDay === 4;
    
    this.container.innerHTML = `
      <div class="card">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- Play Controls -->
          <div class="flex items-center gap-2">
            ${!isPlaying ? `
              <button id="start-btn" class="btn-primary flex items-center gap-2">
                <span>▶</span> Start
              </button>
            ` : `
              <button id="pause-btn" class="btn-warning flex items-center gap-2">
                <span>⏸</span> Pause
              </button>
            `}
            
            <button id="reset-btn" class="btn-secondary text-sm">
              ↺ Reset
            </button>
          </div>
          
          <!-- Mode Selection -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-400">Mode:</span>
            <div class="flex bg-gray-800 rounded-lg p-1">
              <button class="mode-btn px-4 py-2 rounded text-sm font-medium transition-colors ${gameMode === 'slow' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}"
                      data-mode="slow">
                🐢 Slow
              </button>
              <button class="mode-btn px-4 py-2 rounded text-sm font-medium transition-colors ${gameMode === '1x' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}"
                      data-mode="1x">
                ⚡ 1x
              </button>
              <button class="mode-btn px-4 py-2 rounded text-sm font-medium transition-colors ${gameMode === 'auto' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}"
                      data-mode="auto">
                🤖 Auto
              </button>
            </div>
          </div>
          
          <!-- Day Counter -->
          <div class="text-center">
            <div class="text-sm text-gray-400">Day ${market.day + 1}</div>
            <div class="text-lg font-bold ${isFriday ? 'text-yellow-400 animate-pulse' : 'text-matrix-green'}">
              ${currentDayName}
              ${isFriday ? ' 🎉' : ''}
            </div>
            <div class="text-xs text-gray-500">Week ${currentWeek}</div>
          </div>
          
          <!-- Scenario Selector -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-400">Scenario:</span>
            <select id="scenario-select" class="bg-gray-800 text-white text-sm rounded px-3 py-2 border border-gray-700">
              <option value="normal" ${market.scenario.name === 'Normal Market' ? 'selected' : ''}>Normal Market</option>
              <option value="bullish" ${market.scenario.name === 'Bull Run' ? 'selected' : ''}>Bull Run</option>
              <option value="bearish" ${market.scenario.name === 'Bear Market' ? 'selected' : ''}>Bear Market</option>
              <option value="choppy" ${market.scenario.name === 'Choppy Market' ? 'selected' : ''}>Choppy Market</option>
              <option value="crash" ${market.scenario.name === 'Market Crash' ? 'selected' : ''}>Market Crash</option>
            </select>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="mt-4">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>Week Progress (Trading Days)</span>
            <span>${tradingDay + 1}/5 days</span>
          </div>
          <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-blue-500 ${isFriday ? 'to-yellow-400' : 'to-matrix-green'} transition-all duration-300"
                 style="width: ${(tradingDay + 1) / 5 * 100}%"></div>
          </div>
        </div>
        
        <!-- Market Info -->
        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div class="flex justify-between bg-gray-800/50 p-2 rounded">
            <span class="text-gray-400">SPY Price:</span>
            <span class="font-mono font-bold">$${market.spyPrice.toFixed(2)}</span>
          </div>
          <div class="flex justify-between bg-gray-800/50 p-2 rounded">
            <span class="text-gray-400">VIX:</span>
            <span class="font-mono font-bold ${this.getVIXColorClass(market.vix)}">${market.vix.toFixed(2)}</span>
          </div>
        </div>
        
        <!-- Auto Mode Rules Display -->
        ${gameMode === 'auto' ? `
          <div class="mt-4 p-3 bg-green-900/20 border border-green-700 rounded">
            <div class="text-xs text-green-400 font-bold mb-1">🤖 Auto Mode Active</div>
            <div class="text-xs text-gray-400">
              ${this.getAutoModeRule(market.vix)}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    this.attachEventListeners(onStart, onPause, onModeChange, onReset, onScenarioChange);
  }
  
  private attachEventListeners(
    onStart: () => void,
    onPause: () => void,
    onModeChange: (mode: GameMode) => void,
    onReset: () => void,
    onScenarioChange: (scenario: string) => void
  ): void {
    const startBtn = this.container.querySelector('#start-btn');
    const pauseBtn = this.container.querySelector('#pause-btn');
    const resetBtn = this.container.querySelector('#reset-btn');
    const modeBtns = this.container.querySelectorAll('.mode-btn');
    const scenarioSelect = this.container.querySelector('#scenario-select') as HTMLSelectElement;
    
    if (startBtn) {
      startBtn.addEventListener('click', onStart);
    }
    if (pauseBtn) {
      pauseBtn.addEventListener('click', onPause);
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', onReset);
    }
    
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode') as GameMode;
        onModeChange(mode);
      });
    });
    
    if (scenarioSelect) {
      scenarioSelect.addEventListener('change', () => {
        onScenarioChange(scenarioSelect.value);
      });
    }
  }
  
  private getVIXColorClass(vix: number): string {
    if (vix < 20) return 'text-green-400';
    if (vix < 30) return 'text-yellow-400';
    return 'text-red-400';
  }
  
  private getAutoModeRule(vix: number): string {
    if (vix < 20) {
      return 'VIX < 20: Selling $3 OTM calls';
    } else if (vix < 30) {
      return 'VIX 20-30: Selling ATM calls';
    } else if (vix < 40) {
      return 'VIX 30-40: Selling $2 ITM calls';
    } else {
      return 'VIX 40+: STOPPED - Too volatile';
    }
  }
}
