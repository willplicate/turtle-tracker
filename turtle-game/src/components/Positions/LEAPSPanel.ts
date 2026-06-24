// LEAPS Position Panel - Simplified Design with Value Chart
// Displays LEAPS position details in a clean, compact format

import type { GameState } from '../../lib/game/stateManager';
import { calculateLEAPSPnL } from '../../lib/game/positionManager';
import { formatCurrency, getPnLColorClass } from '../../lib/game/pnlCalculator';
import { calculateOptionPrice } from '../../lib/pricing/optionsPricing';
import { LEAPSValueChart } from '../Chart/LEAPSValueChart';

interface LEAPSPanelProps {
  state: GameState;
  onBuyLEAPS: () => void;
  onRollLEAPS: () => void;
  onCloseLEAPS: () => void;
}

export class LEAPSPanel {
  private container: HTMLElement;
  private props: LEAPSPanelProps;
  private valueChart: LEAPSValueChart | null = null;
  private chartContainer: HTMLElement | null = null;

  constructor(container: HTMLElement, props: LEAPSPanelProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(props: LEAPSPanelProps): void {
    this.props = props;
    this.render();
  }

  private render(): void {
    const { state, onBuyLEAPS, onRollLEAPS, onCloseLEAPS } = this.props;
    const { leaps, market } = state;

    if (!leaps) {
      this.renderEmptyState(onBuyLEAPS);
      return;
    }

    const { unrealizedPnL, currentValue } = calculateLEAPSPnL(
      leaps,
      market.spyPrice,
      market.vix
    );

    // Calculate current delta
    const currentPricing = calculateOptionPrice({
      stockPrice: market.spyPrice,
      strike: leaps.strike,
      dte: leaps.dte,
      vix: market.vix,
      isCall: true,
    });

    const needsRoll = currentPricing.delta < 0.72;

    this.container.innerHTML = `
      <div class="border-2 border-gray-700 rounded-lg p-4 bg-gray-900/50">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-xl font-bold text-matrix-green">LEAPS</h3>
          <span class="px-2 py-1 rounded text-xs font-bold ${needsRoll ? 'bg-red-900 text-red-200' : 'bg-green-900/50 text-green-300'}">
            ${needsRoll ? 'ROLL SOON' : 'HEALTHY'}
          </span>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Strike:</span>
            <span class="font-bold">$${leaps.strike}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Delta:</span>
            <span class="font-bold ${currentPricing.delta < 0.70 ? 'text-red-400' : 'text-blue-400'}">
              ${(currentPricing.delta * 100).toFixed(1)}%
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Theta:</span>
            <span class="font-bold text-red-400">${formatCurrency(currentPricing.theta)}/day</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Value:</span>
            <span class="font-bold">${formatCurrency(currentValue)}</span>
          </div>
          <div class="flex justify-between pt-2 border-t border-gray-700">
            <span class="text-gray-400 font-bold">P&L:</span>
            <span class="font-bold ${getPnLColorClass(unrealizedPnL)}">
              ${unrealizedPnL >= 0 ? '+' : ''}${formatCurrency(unrealizedPnL)}
            </span>
          </div>
        </div>

        <!-- LEAPS Value Chart -->
        <div id="leaps-value-chart" class="h-32 mt-4 border border-gray-700 rounded bg-gray-800/30"></div>

        <div class="grid grid-cols-2 gap-2 mt-4">
          <button id="roll-leaps-btn" class="btn-secondary text-sm py-2">
            Roll
          </button>
          <button id="close-leaps-btn" class="btn-danger text-sm py-2">
            Sell to Close
          </button>
        </div>
      </div>
    `;

    // Initialize or update the chart
    this.chartContainer = this.container.querySelector('#leaps-value-chart');
    if (this.chartContainer) {
      if (!this.valueChart) {
        this.valueChart = new LEAPSValueChart(this.chartContainer);
      }
      this.valueChart.updateData(state.leapsValueHistory, leaps.costBasis);
    }

    this.attachEventListeners(onRollLEAPS, onCloseLEAPS);
  }

  private renderEmptyState(onBuyLEAPS: () => void): void {
    this.container.innerHTML = `
      <div class="border-2 border-gray-700 rounded-lg p-4 bg-gray-900/50 text-center">
        <h3 class="text-xl font-bold text-gray-400 mb-2">LEAPS</h3>
        <p class="text-sm text-gray-500 mb-3">No position</p>
        <button id="buy-leaps-btn" class="btn-primary w-full">
          Buy LEAPS
        </button>
      </div>
    `;

    // Destroy chart if it exists
    if (this.valueChart) {
      this.valueChart.destroy();
      this.valueChart = null;
    }

    const btn = this.container.querySelector('#buy-leaps-btn');
    if (btn) {
      btn.addEventListener('click', onBuyLEAPS);
    }
  }

  private attachEventListeners(onRollLEAPS: () => void, onCloseLEAPS: () => void): void {
    const rollBtn = this.container.querySelector('#roll-leaps-btn');
    const closeBtn = this.container.querySelector('#close-leaps-btn');

    if (rollBtn) {
      rollBtn.addEventListener('click', onRollLEAPS);
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', onCloseLEAPS);
    }
  }
  
  destroy(): void {
    if (this.valueChart) {
      this.valueChart.destroy();
      this.valueChart = null;
    }
  }
}
