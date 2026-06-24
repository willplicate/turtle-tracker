// Options Chain Component
// Displays available options with bid/ask prices

import { calculateOptionPrice, type OptionPriceBreakdown } from '../../lib/pricing/optionsPricing';

type ChainMode = 'weekly' | 'leaps';
type SortOrder = 'asc' | 'desc';

interface OptionsChainProps {
  stockPrice: number;
  vix: number;
  onSelectStrike: (strike: number, price: OptionPriceBreakdown) => void;
  selectedStrike?: number;
  mode?: ChainMode;
  onModeChange?: (mode: ChainMode) => void;
}

export class OptionsChain {
  private container: HTMLElement;
  private props: OptionsChainProps;
  private strikes: number[] = [];
  private currentMode: ChainMode = 'weekly';
  private sortOrder: SortOrder = 'asc';
  
  constructor(container: HTMLElement, props: OptionsChainProps) {
    this.container = container;
    this.props = props;
    this.currentMode = props.mode || 'weekly';
    this.render();
  }
  
  update(props: OptionsChainProps): void {
    this.props = props;
    if (props.mode) {
      this.currentMode = props.mode;
    }
    this.render();
  }
  
  setMode(mode: ChainMode): void {
    this.currentMode = mode;
    this.render();
  }
  
  private generateStrikes(): void {
    const { stockPrice } = this.props;

    if (this.currentMode === 'leaps') {
      // For LEAPS: $5 increments
      const strikeIncrement = 5;
      // For LEAPS: show strikes from deep ITM up to ATM
      // Include more granularity for better delta variation
      this.strikes = [];
      const atmStrike = Math.round(stockPrice / strikeIncrement) * strikeIncrement;

      // Generate strikes from 70% of stock price up to ATM
      // This gives us a wide range: deep ITM (high delta) to ATM (50 delta)
      const startStrike = Math.round((stockPrice * 0.70) / strikeIncrement) * strikeIncrement;

      for (let strike = startStrike; strike <= atmStrike; strike += strikeIncrement) {
        this.strikes.push(strike);
      }
    } else {
      // Weekly mode: $1 increments (realistic for SPY weeklies)
      const strikeIncrement = 1;
      const numStrikes = 10;
      const atmStrike = Math.round(stockPrice / strikeIncrement) * strikeIncrement;

      this.strikes = [];
      for (let i = -numStrikes; i <= numStrikes; i++) {
        this.strikes.push(atmStrike + i * strikeIncrement);
      }
    }
  }
  
  private calculateBidAsk(price: OptionPriceBreakdown): { bid: number; ask: number } {
    // Simulate bid-ask spread
    // Wider spread for OTM options and higher VIX
    const spreadPercent = 0.05 + (this.props.vix / 100) * 0.1;
    const spread = price.total * spreadPercent;
    
    return {
      bid: Math.max(0, price.total - spread / 2),
      ask: price.total + spread / 2,
    };
  }
  
  private render(): void {
    this.generateStrikes();

    const { stockPrice, vix, selectedStrike } = this.props;
    const atmStrike = Math.round(stockPrice / 5) * 5;
    const dte = this.currentMode === 'leaps' ? 365 : 7;
    const isLEAPS = this.currentMode === 'leaps';

    // Calculate option prices for each strike
    const chainData = this.strikes.map(strike => {
      const price = calculateOptionPrice({
        stockPrice,
        strike,
        dte,
        vix,
        isCall: true,
      });

      const { bid, ask } = this.calculateBidAsk(price);
      const isATM = Math.abs(strike - atmStrike) < 2.5;
      const isITM = strike < stockPrice;
      const isOTM = strike > stockPrice;
      const itmAmount = stockPrice - strike;

      return {
        strike,
        bid,
        ask,
        price,
        isATM,
        isITM,
        isOTM,
        itmAmount,
      };
    });

    // Sort strikes based on current sort order
    const sortedChainData = this.sortOrder === 'asc'
      ? chainData.sort((a, b) => a.strike - b.strike)
      : chainData.sort((a, b) => b.strike - a.strike);

    this.container.innerHTML = `
      <div class="h-full flex flex-col">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-lg font-bold text-matrix-green">Options Chain</h3>
          <div class="text-sm">
            <span class="text-gray-400">VIX:</span>
            <span class="font-bold ${this.getVIXColorClass(vix)}">${vix.toFixed(2)}</span>
          </div>
        </div>

        <!-- Mode Toggle -->
        <div class="flex bg-gray-800 rounded p-1 mb-3">
          <button id="mode-weekly" class="flex-1 py-1 px-2 rounded text-xs font-bold transition-colors ${!isLEAPS ? 'bg-matrix-green text-black' : 'text-gray-400 hover:text-white'}">
            Weekly (7 DTE)
          </button>
          <button id="mode-leaps" class="flex-1 py-1 px-2 rounded text-xs font-bold transition-colors ${isLEAPS ? 'bg-matrix-green text-black' : 'text-gray-400 hover:text-white'}">
            LEAPS (365 DTE)
          </button>
        </div>

        <div class="text-xs text-center text-gray-400 mb-2">
          ${isLEAPS
            ? `SPY: <span class="font-bold text-white">$${stockPrice.toFixed(2)}</span><span class="ml-2 text-gray-500">|</span><span class="ml-2 text-blue-400">365 DTE</span><span class="ml-2 text-gray-500">|</span><span class="ml-2 text-green-400">80-100 Delta</span>`
            : `SPY: <span class="font-bold text-white">$${stockPrice.toFixed(2)}</span><span class="ml-2 text-gray-500">|</span><span class="ml-2 text-green-400">▼ ITM</span><span class="ml-2 text-yellow-400">ATM</span><span class="ml-2 text-red-400">OTM ▲</span>`
          }
        </div>

        <div class="flex-1 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 bg-gray-900">
              <tr class="text-gray-400 border-b border-gray-700">
                <th class="text-left py-2 px-2">Bid</th>
                <th class="text-left py-2 px-2">Ask</th>
                <th class="text-center py-2 px-2">
                  <button id="sort-toggle" class="hover:text-white transition-colors cursor-pointer">
                    Strike ${this.sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </th>
                ${isLEAPS ? '<th class="text-right py-2 px-2">ITM $</th>' : ''}
                <th class="text-right py-2 px-2">Delta</th>
              </tr>
            </thead>
            <tbody>
              ${sortedChainData.map(({ strike, bid, ask, price, isATM, isITM, isOTM: _isOTM, itmAmount }) => {
                const isSelected = strike === selectedStrike;
                const rowClass = isSelected
                  ? 'bg-blue-900/30 border-l-4 border-blue-500'
                  : isATM && !isLEAPS
                    ? 'bg-yellow-900/20 border-l-4 border-yellow-500'
                    : isLEAPS && price.delta >= 0.80 && price.delta <= 0.95
                      ? 'bg-green-900/20 border-l-4 border-green-500'
                      : 'hover:bg-gray-800';

                // Strike styling with direction arrow
                let strikeDisplay = '';
                let strikeClass = '';

                if (isLEAPS) {
                  // LEAPS view: show ITM amount
                  strikeDisplay = `$${strike}`;
                  strikeClass = price.delta >= 0.80 ? 'text-green-400 font-bold' : 'text-gray-400';
                } else {
                  // Weekly view: ITM/ATM/OTM indicators
                  if (isITM) {
                    strikeDisplay = `▼ ${strike}`;
                    strikeClass = 'text-green-400 font-bold';
                  } else if (isATM) {
                    strikeDisplay = `◆ ${strike}`;
                    strikeClass = 'text-yellow-400 font-bold';
                  } else {
                    strikeDisplay = `▲ ${strike}`;
                    strikeClass = 'text-red-400 font-bold';
                  }
                }

                const deltaInt = Math.round(price.delta * 100);
                
                return `
                  <tr class="cursor-pointer transition-colors ${rowClass} border-b border-gray-800"
                      data-strike="${strike}">
                    <td class="py-2 px-2 text-green-400">${this.formatPrice(bid)}</td>
                    <td class="py-2 px-2 text-red-400">${this.formatPrice(ask)}</td>
                    <td class="py-2 px-2 text-center ${strikeClass}">${strikeDisplay}</td>
                    ${isLEAPS ? `<td class="py-2 px-2 text-right text-green-400">+$${itmAmount.toFixed(0)}</td>` : ''}
                    <td class="py-2 px-2 text-right ${deltaInt >= 80 ? 'text-green-400 font-bold' : 'text-gray-400'}">${deltaInt}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
          ${isLEAPS
            ? `<div class="flex justify-between">
                <span><span class="text-green-400 font-bold">80-95 Delta</span> = Recommended LEAPS</span>
                <span><span class="text-gray-400">365 DTE</span> = 1 Year Expiration</span>
              </div>`
            : `<div class="flex justify-between">
                <span><span class="text-green-400 font-bold">▼ ITM</span> = In The Money</span>
                <span><span class="text-yellow-400 font-bold">◆ ATM</span> = At The Money</span>
                <span><span class="text-red-400 font-bold">OTM ▲</span> = Out of The Money</span>
              </div>`
          }
        </div>
      </div>
   `;

   this.attachEventListeners();
  }
  
  private attachEventListeners(): void {
    const rows = this.container.querySelectorAll('tbody tr');
    const dte = this.currentMode === 'leaps' ? 365 : 7;

    rows.forEach(row => {
      row.addEventListener('click', () => {
        const strike = parseFloat(row.getAttribute('data-strike') || '0');
        const price = calculateOptionPrice({
          stockPrice: this.props.stockPrice,
          strike,
          dte,
          vix: this.props.vix,
          isCall: true,
        });
        this.props.onSelectStrike(strike, price);
      });
    });

    // Sort toggle button
    const sortToggle = this.container.querySelector('#sort-toggle');
    if (sortToggle) {
      sortToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        this.render();
      });
    }

    // Mode toggle buttons
    const weeklyBtn = this.container.querySelector('#mode-weekly');
    const leapsBtn = this.container.querySelector('#mode-leaps');

    if (weeklyBtn) {
      weeklyBtn.addEventListener('click', () => {
        this.currentMode = 'weekly';
        if (this.props.onModeChange) {
          this.props.onModeChange('weekly');
        }
        this.render();
      });
    }

    if (leapsBtn) {
      leapsBtn.addEventListener('click', () => {
        this.currentMode = 'leaps';
        if (this.props.onModeChange) {
          this.props.onModeChange('leaps');
        }
        this.render();
      });
    }
  }
  
  private formatPrice(price: number): string {
    if (price < 100) {
      return `$${price.toFixed(2)}`;
    }
    return `$${Math.round(price).toLocaleString()}`;
  }
  
  private getVIXColorClass(vix: number): string {
    if (vix < 15) return 'text-green-400';
    if (vix < 25) return 'text-yellow-400';
    return 'text-red-400';
  }
}
