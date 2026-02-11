// Tutorial 1, Screen 2: Swap for LEAPS
// Learning: LEAPS give same exposure with less capital, but theta cost

import { createTutorialLEAPS, calculateLEAPSPnL } from '../../lib/pricing/leaps';

interface Screen2State {
  sharesOwned: number;
  initialSpyPrice: number;
  currentSpyPrice: number;
  hasSwapped: boolean;
  daysAdvanced: number;
}

export class Tutorial1Screen2 {
  private state: Screen2State = {
    sharesOwned: 85,
    initialSpyPrice: 590,
    currentSpyPrice: 590,
    hasSwapped: false,
    daysAdvanced: 0,
  };

  private container: HTMLElement;
  private onNext: () => void;
  private onBack: () => void;
  private leapsValue = createTutorialLEAPS(590);

  constructor(container: HTMLElement, onNext: () => void, onBack: () => void) {
    this.container = container;
    this.onNext = onNext;
    this.onBack = onBack;
    this.render();
    this.attachEventListeners();
  }

  private calculateSharesValue(): number {
    return this.state.sharesOwned * this.state.initialSpyPrice;
  }

  private swapToLEAPS(): void {
    this.state.hasSwapped = true;
    this.render();
    this.attachEventListeners();
  }

  private advanceTime(): void {
    this.state.daysAdvanced = 7;
    this.state.currentSpyPrice = 595;
    this.render();
    this.attachEventListeners();
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  private render(): void {
    const sharesValue = this.calculateSharesValue();
    const leapsCost = 12900; // From spec
    const capitalFreed = sharesValue - leapsCost;
    const priceChange = this.state.currentSpyPrice - this.state.initialSpyPrice;

    // Calculate LEAPS P&L after 7 days
    const { netPnL, deltaGain, thetaCost, newLeapsValue } = calculateLEAPSPnL(
      {
        initialValue: {
          premium: leapsCost,
          delta: this.leapsValue.delta,
          theta: this.leapsValue.theta,
        },
        stockPriceChange: priceChange,
        daysElapsed: this.state.daysAdvanced,
        leapsCost: leapsCost
      }
    );

    this.container.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="mb-8">
          <h1 class="text-4xl font-bold mb-2">Tutorial 1: Shares vs LEAPS</h1>
          <h2 class="text-2xl text-matrix-green">Screen 2 - Swap for LEAPS</h2>
        </div>

        ${!this.state.hasSwapped ? `
          <div class="card mb-6">
            <h3 class="text-xl font-bold mb-4">Current Position: Shares</h3>
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-gray-800 p-4 rounded">
                <div class="text-sm text-gray-400">SPY Price</div>
                <div class="text-2xl font-bold">$${this.state.initialSpyPrice}</div>
              </div>
              <div class="bg-gray-800 p-4 rounded">
                <div class="text-sm text-gray-400">Shares Owned</div>
                <div class="text-2xl font-bold">${this.state.sharesOwned}</div>
              </div>
              <div class="bg-gray-800 p-4 rounded col-span-2">
                <div class="text-sm text-gray-400">Total Capital Required</div>
                <div class="text-3xl font-bold">${this.formatMoney(sharesValue)}</div>
              </div>
            </div>

            <div class="bg-blue-900/30 border border-blue-500 p-4 rounded mb-6">
              <p class="text-lg">
                You own ${this.state.sharesOwned} shares of SPY at $${this.state.initialSpyPrice} = ${this.formatMoney(sharesValue)} in capital.
                <br><br>
                What if you could get the <strong>same exposure</strong> with less capital?
              </p>
            </div>

            <button id="swap-btn" class="btn btn-primary w-full text-xl py-4">
              SWAP ${this.state.sharesOwned} SHARES → ${Math.round(this.leapsValue.delta * 100)}-DELTA LEAPS
            </button>
          </div>
        ` : `
          <div class="card mb-6">
            <div class="text-center mb-6">
              <div class="inline-block bg-matrix-green text-black px-6 py-3 rounded font-bold text-xl">
                ✓ SWAPPED TO LEAPS
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-gray-800 p-4 rounded">
                <div class="text-sm text-gray-400">LEAPS Cost</div>
                <div class="text-2xl font-bold">${this.formatMoney(leapsCost)}</div>
                <div class="text-xs text-gray-400 mt-1">vs ${this.formatMoney(sharesValue)} for shares</div>
              </div>
              <div class="bg-gray-800 p-4 rounded">
                <div class="text-sm text-gray-400">Capital Freed</div>
                <div class="text-2xl font-bold text-matrix-green">${this.formatMoney(capitalFreed)}</div>
              </div>
              <div class="bg-gray-800 p-4 rounded">
                <div class="text-sm text-gray-400">Delta</div>
                <div class="text-2xl font-bold">${Math.round(this.leapsValue.delta * 100)}%</div>
              </div>
              <div class="bg-gray-800 p-4 rounded">
                <div class="text-sm text-gray-400">Theta (daily decay)</div>
                <div class="text-2xl font-bold text-red-400">${this.formatMoney(this.leapsValue.theta)}/day</div>
              </div>
              <div class="bg-gray-800 p-4 rounded col-span-2">
                <div class="text-sm text-gray-400">Days to Expiration (DTE)</div>
                <div class="text-2xl font-bold">120 days</div>
              </div>
            </div>

            ${this.state.daysAdvanced > 0 ? `
              <div class="border-t border-gray-700 pt-6 mt-6">
                <div class="text-center mb-4">
                  <div class="inline-block bg-matrix-green text-black px-4 py-2 rounded font-bold">
                    ⏰ 7 DAYS LATER
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4 mb-6">
                  <div class="bg-gray-800 p-4 rounded">
                    <div class="text-sm text-gray-400">SPY Price</div>
                    <div class="text-2xl font-bold">
                      $${this.state.currentSpyPrice}
                      <span class="text-matrix-green text-lg ml-2">+$${priceChange}</span>
                    </div>
                  </div>
                  <div class="bg-gray-800 p-4 rounded">
                    <div class="text-sm text-gray-400">LEAPS Value</div>
                    <div class="text-2xl font-bold">${this.formatMoney(newLeapsValue)}</div>
                  </div>
                </div>

                <div class="bg-gray-900 p-6 rounded border border-gray-700 mb-6">
                  <div class="text-lg font-bold mb-4">P&L Breakdown:</div>
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-400">Delta gain ($${priceChange} × ${this.leapsValue.delta} × 100):</span>
                      <span class="text-2xl font-bold text-matrix-green">+${this.formatMoney(deltaGain)}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-400">Theta cost (${this.state.daysAdvanced} days × ${this.formatMoney(this.leapsValue.theta)}/day):</span>
                      <span class="text-2xl font-bold text-red-400">${this.formatMoney(thetaCost)}</span>
                    </div>
                    <div class="border-t border-gray-700 pt-3 flex justify-between items-center">
                      <span class="text-xl font-bold">Net Gain:</span>
                      <span class="text-3xl font-bold text-matrix-green">+${this.formatMoney(netPnL)}</span>
                    </div>
                  </div>
                </div>

                <div class="bg-blue-900/30 border border-blue-500 p-4 rounded">
                  <p class="text-lg">
                    <strong>Notice:</strong> Same upside as shares (+$${this.formatMoney(deltaGain)} from delta), but costs ${this.formatMoney(Math.abs(this.leapsValue.theta))}/day to hold.
                    <br><br>
                    You still made +${this.formatMoney(netPnL)} with only ${this.formatMoney(leapsCost)} in capital vs ${this.formatMoney(sharesValue)} for shares!
                  </p>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="flex gap-4">
            ${this.state.daysAdvanced === 0 ? `
              <button id="advance-btn" class="btn btn-primary flex-1 text-xl py-4">
                ▶ ADVANCE 7 DAYS
              </button>
            ` : `
              <button id="back-btn" class="btn flex-1">
                ← PREVIOUS SCREEN
              </button>
              <button id="next-btn" class="btn btn-primary flex-1">
                NEXT SCREEN →
              </button>
            `}
          </div>
        `}
      </div>
    `;
  }

  private attachEventListeners(): void {
    const swapBtn = this.container.querySelector('#swap-btn');
    if (swapBtn) {
      swapBtn.addEventListener('click', () => this.swapToLEAPS());
    }

    const advanceBtn = this.container.querySelector('#advance-btn');
    if (advanceBtn) {
      advanceBtn.addEventListener('click', () => this.advanceTime());
    }

    const backBtn = this.container.querySelector('#back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.onBack();
      });
    }

    const nextBtn = this.container.querySelector('#next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.onNext();
      });
    }
  }
}
