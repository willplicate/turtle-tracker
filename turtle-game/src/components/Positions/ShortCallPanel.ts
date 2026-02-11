// Short Call Position Panel - Simplified Design
// Displays short call position details in a clean, compact format

import type { GameState } from '../../lib/game/stateManager';
import { calculateShortCallPnL, isShortCallITM, shouldRollShortCall } from '../../lib/game/positionManager';
import { formatCurrency, getPnLColorClass } from '../../lib/game/pnlCalculator';

interface ShortCallPanelProps {
  state: GameState;
  onSellCall: () => void;
  onRollCall: () => void;
  onBuyBackCall: () => void;
}

export class ShortCallPanel {
  private container: HTMLElement;
  private props: ShortCallPanelProps;

  constructor(container: HTMLElement, props: ShortCallPanelProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(props: ShortCallPanelProps): void {
    this.props = props;
    this.render();
  }

  private render(): void {
    const { state, onSellCall, onRollCall, onBuyBackCall } = this.props;
    const { shortCall, market } = state;

    if (!shortCall) {
      this.renderEmptyState(onSellCall, market.vix);
      return;
    }

    const { unrealizedPnL, currentValue } = calculateShortCallPnL(
      shortCall,
      market.spyPrice,
      market.vix
    );

    const isITM = isShortCallITM(shortCall, market.spyPrice);
    const needsRoll = shouldRollShortCall(shortCall);
    const assignmentRisk = isITM && shortCall.dte <= 1;
    const breakeven = shortCall.strike + shortCall.premium / 100;

    this.container.innerHTML = `
      <div class="border-2 border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xl font-bold text-orange-400">SHORT</h3>
          <span class="px-2 py-1 rounded text-xs font-bold ${
            assignmentRisk ? 'bg-red-900 text-red-200 animate-pulse' :
            isITM ? 'bg-orange-900/50 text-orange-300' :
            'bg-green-900/50 text-green-300'
          }">
            ${assignmentRisk ? 'ASSIGNMENT RISK' : isITM ? 'ITM' : 'OTM'}
          </span>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Strike:</span>
            <span class="font-bold">$${shortCall.strike}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Breakeven:</span>
            <span class="font-bold">$${breakeven.toFixed(2)} (${market.spyPrice > breakeven ? '-$' + (market.spyPrice - breakeven).toFixed(2) : '+$' + (breakeven - market.spyPrice).toFixed(2)})</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Delta:</span>
            <span class="font-bold">${shortCall.delta ? (shortCall.delta * 100).toFixed(0) : '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Theta:</span>
            <span class="font-bold text-green-400">${shortCall.theta ? '+' + formatCurrency(Math.abs(shortCall.theta)) : '-'}/day</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Value:</span>
            <span class="font-bold">${formatCurrency(currentValue)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Time to expiry:</span>
            <span class="font-bold ${shortCall.dte <= 2 ? 'text-red-400' : ''}">
              ${shortCall.dte} days
            </span>
          </div>
          <div class="flex justify-between pt-2 border-t border-gray-700">
            <div class="flex items-center gap-1">
              <span class="text-gray-400 font-bold">P&L:</span>
              <button id="pnl-help-btn" class="text-blue-400 hover:text-blue-300 text-xs font-bold w-5 h-5 rounded-full border border-blue-400 flex items-center justify-center">?</button>
            </div>
            <span class="font-bold ${getPnLColorClass(unrealizedPnL)}">
              ${unrealizedPnL >= 0 ? '+' : ''}${formatCurrency(unrealizedPnL)}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 mt-4">
          <button id="roll-call-btn" class="btn-secondary text-sm py-2">
            Roll
          </button>
          <button id="buyback-btn" class="${assignmentRisk ? 'btn-danger' : 'btn-warning'} text-sm py-2">
            Buy to Close
          </button>
        </div>
      </div>
    `;

    this.attachEventListeners(onRollCall, onBuyBackCall);
  }

  private renderEmptyState(onSellCall: () => void, vix: number): void {
    let recommendation: string;

    if (vix < 20) {
      recommendation = 'Sell ATM call for maximum premium';
    } else if (vix < 30) {
      recommendation = 'Sell $5 ITM for protection';
    } else {
      recommendation = 'Sell $10 ITM or wait for lower VIX';
    }

    this.container.innerHTML = `
      <div class="border-2 border-gray-700 rounded-lg p-4 bg-gray-900/50 text-center">
        <h3 class="text-xl font-bold text-gray-400 mb-2">SHORT</h3>
        <p class="text-sm text-gray-500 mb-2">No position</p>
        <div class="text-xs text-gray-400 mb-3">
          Current VIX: <span class="font-bold ${this.getVIXColorClass(vix)}">${vix.toFixed(1)}</span>
        </div>
        <p class="text-xs text-orange-300 mb-3">${recommendation}</p>
        <button id="sell-call-btn" class="btn-primary w-full">
          Sell Call
        </button>
      </div>
    `;

    const btn = this.container.querySelector('#sell-call-btn');
    if (btn) {
      btn.addEventListener('click', onSellCall);
    }
  }

  private attachEventListeners(onRollCall: () => void, onBuyBackCall: () => void): void {
    const rollBtn = this.container.querySelector('#roll-call-btn');
    const buybackBtn = this.container.querySelector('#buyback-btn');
    const helpBtn = this.container.querySelector('#pnl-help-btn');

    if (rollBtn) {
      rollBtn.addEventListener('click', onRollCall);
    }
    if (buybackBtn) {
      buybackBtn.addEventListener('click', onBuyBackCall);
    }
    if (helpBtn) {
      helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showPnLExplanation();
      });
    }
  }

  private showPnLExplanation(): void {
    const { shortCall, market } = this.props.state;
    if (!shortCall) return;

    const { unrealizedPnL, currentValue } = calculateShortCallPnL(
      shortCall,
      market.spyPrice,
      market.vix
    );

    const strike = shortCall.strike;
    const premiumDollars = shortCall.premium / 100; // Convert to $ per share
    const breakeven = strike + premiumDollars;
    const currentPrice = market.spyPrice;
    const itmAmount = Math.max(0, currentPrice - strike);

    // Create payoff diagram visualization
    const modalHTML = `
      <div id="pnl-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50" style="backdrop-filter: blur(4px);">
        <div class="bg-gray-900 border-2 border-blue-500 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-2xl font-bold text-blue-400">Short Call P&L Explained</h3>
            <button id="close-modal-btn" class="text-gray-400 hover:text-white text-2xl">&times;</button>
          </div>

          <div class="space-y-4">
            <!-- Current Position Info -->
            <div class="bg-gray-800 p-4 rounded-lg">
              <div class="text-sm font-bold text-orange-400 mb-2">Your Position:</div>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div><span class="text-gray-400">Strike:</span> <span class="font-bold">$${strike}</span></div>
                <div><span class="text-gray-400">Premium Collected:</span> <span class="font-bold text-green-400">$${shortCall.premium.toFixed(0)} ($${premiumDollars.toFixed(2)}/share)</span></div>
                <div><span class="text-gray-400">Current Price:</span> <span class="font-bold">$${currentPrice.toFixed(2)}</span></div>
                <div><span class="text-gray-400">Current P&L:</span> <span class="font-bold ${getPnLColorClass(unrealizedPnL)}">${unrealizedPnL >= 0 ? '+' : ''}$${unrealizedPnL.toFixed(0)}</span></div>
              </div>
            </div>

            <!-- Visual Diagram -->
            <div class="bg-gray-800 p-4 rounded-lg">
              <div class="text-sm font-bold text-blue-400 mb-3">Payoff Diagram:</div>
              <div class="relative h-48 bg-gray-900 rounded border border-gray-700 p-4">
                <!-- Y-axis (P&L) -->
                <div class="absolute left-2 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500">
                  <div>+$${shortCall.premium.toFixed(0)}</div>
                  <div class="text-gray-400 font-bold">$0</div>
                  <div>-$${(itmAmount * 100).toFixed(0)}</div>
                </div>

                <!-- Graph area -->
                <svg class="w-full h-full" viewBox="0 0 400 160" style="margin-left: 30px;">
                  <!-- Breakeven line -->
                  <line x1="200" y1="0" x2="200" y2="160" stroke="#666" stroke-width="1" stroke-dasharray="2,2" />
                  <text x="200" y="155" fill="#888" font-size="10" text-anchor="middle">Breakeven: $${breakeven.toFixed(2)}</text>

                  <!-- Max profit zone (OTM) -->
                  <rect x="0" y="20" width="200" height="8" fill="#22c55e" opacity="0.3" />
                  <text x="100" y="15" fill="#22c55e" font-size="10" text-anchor="middle">Max Profit Zone</text>
                  <line x1="0" y1="24" x2="200" y2="24" stroke="#22c55e" stroke-width="3" />

                  <!-- Buffer zone (strike to breakeven) -->
                  <rect x="180" y="20" width="40" height="50" fill="#eab308" opacity="0.2" />
                  <text x="200" y="50" fill="#eab308" font-size="9" text-anchor="middle">Premium</text>
                  <text x="200" y="60" fill="#eab308" font-size="9" text-anchor="middle">Buffer</text>
                  <line x1="200" y1="24" x2="220" y2="70" stroke="#eab308" stroke-width="3" />

                  <!-- Loss zone (ITM beyond breakeven) -->
                  <rect x="220" y="70" width="180" height="60" fill="#ef4444" opacity="0.2" />
                  <text x="310" y="95" fill="#ef4444" font-size="10" text-anchor="middle">Loss Zone</text>
                  <text x="310" y="107" fill="#ef4444" font-size="9" text-anchor="middle">-$100 per $1 move</text>
                  <line x1="220" y1="70" x2="400" y2="130" stroke="#ef4444" stroke-width="3" />

                  <!-- Current price marker -->
                  ${currentPrice > breakeven ? `
                    <circle cx="${Math.min(220 + (currentPrice - breakeven) * 50, 380)}" cy="${Math.min(70 + (currentPrice - breakeven) * 50 * 0.6, 125)}" r="5" fill="#3b82f6" stroke="#fff" stroke-width="2" />
                    <text x="${Math.min(220 + (currentPrice - breakeven) * 50, 380)}" y="${Math.min(70 + (currentPrice - breakeven) * 50 * 0.6 - 10, 115)}" fill="#3b82f6" font-size="10" text-anchor="middle" font-weight="bold">You are here</text>
                  ` : currentPrice >= strike ? `
                    <circle cx="${180 + (currentPrice - strike) / premiumDollars * 40}" cy="${24 + (currentPrice - strike) / premiumDollars * 46}" r="5" fill="#3b82f6" stroke="#fff" stroke-width="2" />
                    <text x="${180 + (currentPrice - strike) / premiumDollars * 40}" y="${24 + (currentPrice - strike) / premiumDollars * 46 - 10}" fill="#3b82f6" font-size="10" text-anchor="middle" font-weight="bold">You are here</text>
                  ` : `
                    <circle cx="${Math.max(10, Math.min(180, currentPrice / strike * 180))}" cy="24" r="5" fill="#3b82f6" stroke="#fff" stroke-width="2" />
                    <text x="${Math.max(10, Math.min(180, currentPrice / strike * 180))}" y="15" fill="#3b82f6" font-size="10" text-anchor="middle" font-weight="bold">You are here</text>
                  `}

                  <!-- X-axis labels -->
                  <text x="0" y="145" fill="#888" font-size="10">$${(strike - 10).toFixed(0)}</text>
                  <text x="180" y="145" fill="#888" font-size="10">Strike: $${strike}</text>
                  <text x="370" y="145" fill="#888" font-size="10" text-anchor="end">$${(breakeven + 5).toFixed(0)}+</text>
                </svg>
              </div>
            </div>

            <!-- Explanation -->
            <div class="bg-blue-900/20 border border-blue-700 p-4 rounded-lg text-sm">
              <div class="font-bold text-blue-400 mb-2">How It Works:</div>
              <div class="space-y-2 text-gray-300">
                <p><span class="text-green-400 font-bold">1. Premium Buffer:</span> You collected $${shortCall.premium.toFixed(0)} upfront. This is your profit cushion!</p>
                <p><span class="text-yellow-400 font-bold">2. Breakeven Point:</span> Strike ($${strike}) + Premium ($${premiumDollars.toFixed(2)}) = $${breakeven.toFixed(2)}</p>
                <p><span class="text-red-400 font-bold">3. Beyond Breakeven:</span> For every $1 the stock moves above $${breakeven.toFixed(2)}, you lose $100 (because 1 contract = 100 shares).</p>
                ${currentPrice > breakeven ? `
                  <div class="mt-3 p-2 bg-red-900/30 rounded">
                    <p class="font-bold text-red-300">Current Calculation:</p>
                    <p class="text-xs font-mono">ITM Amount: $${currentPrice.toFixed(2)} - $${strike} = $${itmAmount.toFixed(2)}</p>
                    <p class="text-xs font-mono">Option Value: $${itmAmount.toFixed(2)} × 100 = $${(itmAmount * 100).toFixed(0)}</p>
                    <p class="text-xs font-mono">Your P&L: $${shortCall.premium.toFixed(0)} (premium) - $${currentValue.toFixed(0)} (current value) = ${unrealizedPnL >= 0 ? '+' : ''}$${unrealizedPnL.toFixed(0)}</p>
                  </div>
                ` : `
                  <div class="mt-3 p-2 bg-green-900/30 rounded">
                    <p class="font-bold text-green-300">You're in the profit zone!</p>
                    <p class="text-xs">The option is ${currentPrice >= strike ? 'slightly ITM but still within your premium buffer' : 'out of the money, losing value due to time decay'}.</p>
                  </div>
                `}
              </div>
            </div>

            <button id="got-it-btn" class="btn-primary w-full py-3">
              Got it! 👍
            </button>
          </div>
        </div>
      </div>
    `;

    // Add modal to body
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);

    // Add event listeners
    const closeBtn = modalDiv.querySelector('#close-modal-btn');
    const gotItBtn = modalDiv.querySelector('#got-it-btn');
    const modal = modalDiv.querySelector('#pnl-modal');

    const closeModal = () => {
      modalDiv.remove();
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (gotItBtn) gotItBtn.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
  }

  private getVIXColorClass(vix: number): string {
    if (vix < 15) return 'text-green-400';
    if (vix < 25) return 'text-yellow-400';
    return 'text-red-400';
  }
}
