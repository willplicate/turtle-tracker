// Tutorial 1, Screen 3: Time/Cost Trade-off
// Learning: Longer DTE = lower daily theta, but higher upfront cost

import { calculateLEAPSValue } from '../../lib/pricing/leaps';

interface Screen3State {
  dte: number;
  stockPrice: number;
}

export class Tutorial1Screen3 {
  private state: Screen3State = {
    dte: 120,
    stockPrice: 590,
  };

  private container: HTMLElement;
  private onNext: () => void;
  private onBack: () => void;

  constructor(container: HTMLElement, onNext: () => void, onBack: () => void) {
    this.container = container;
    this.onNext = onNext;
    this.onBack = onBack;
    this.render();
    this.attachEventListeners();
  }

  private updateDte(dte: number): void {
    this.state.dte = dte;
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
    // Calculate LEAPS values for current DTE
    const strike = this.state.stockPrice - 80; // 13% ITM to get ~85 delta
    const leapsValue = calculateLEAPSValue({
      stockPrice: this.state.stockPrice,
      strike,
      dte: this.state.dte,
      delta: 0.85,
    });

    // Calculate for comparison: 30 DTE (short-term) and 120 DTE (long-term)
    const shortTerm = calculateLEAPSValue({
      stockPrice: this.state.stockPrice,
      strike,
      dte: 30,
      delta: 0.85,
    });

    const longTerm = calculateLEAPSValue({
      stockPrice: this.state.stockPrice,
      strike,
      dte: 120,
      delta: 0.85,
    });

    const sevenDayTotal = leapsValue.theta * 7;

    this.container.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="mb-8">
          <h1 class="text-4xl font-bold mb-2">Tutorial 1: Shares vs LEAPS</h1>
          <h2 class="text-2xl text-matrix-green">Step 3 of 4 - The Time/Cost Trade-off</h2>
        </div>

        <div class="card mb-6">
          <div class="bg-blue-900/30 border border-blue-500 p-4 rounded mb-6">
            <p class="text-lg">
              <strong>Question:</strong> If LEAPS with 120 days cost -$2/day in theta...
              <br>
              What about LEAPS that last only 30 days? Or 365 days?
            </p>
          </div>

          <h3 class="text-xl font-bold mb-4">Compare Two LEAPS (Same 85% Delta)</h3>

          <div class="grid grid-cols-2 gap-4 mb-8">
            <!-- Short-Term LEAPS -->
            <div class="bg-gray-800 p-4 rounded border border-gray-600">
              <div class="text-center mb-3">
                <div class="text-sm text-gray-400">SHORT-TERM LEAPS</div>
                <div class="text-2xl font-bold text-yellow-400">30 DTE</div>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Daily Theta:</span>
                  <span class="text-red-400 font-bold">${this.formatMoney(shortTerm.theta)}/day</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Upfront Cost:</span>
                  <span class="font-bold">${this.formatMoney(shortTerm.premium)}</span>
                </div>
                <div class="flex justify-between pt-2 border-t border-gray-700">
                  <span class="text-gray-400">Weekly Cost:</span>
                  <span class="text-red-400 font-bold">${this.formatMoney(shortTerm.theta * 7)}</span>
                </div>
              </div>
            </div>

            <!-- Long-Term LEAPS -->
            <div class="bg-gray-800 p-4 rounded border border-matrix-green">
              <div class="text-center mb-3">
                <div class="text-sm text-gray-400">LONG-TERM LEAPS</div>
                <div class="text-2xl font-bold text-matrix-green">120 DTE</div>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Daily Theta:</span>
                  <span class="text-red-400 font-bold">${this.formatMoney(longTerm.theta)}/day</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Upfront Cost:</span>
                  <span class="font-bold">${this.formatMoney(longTerm.premium)}</span>
                </div>
                <div class="flex justify-between pt-2 border-t border-gray-700">
                  <span class="text-gray-400">Weekly Cost:</span>
                  <span class="text-red-400 font-bold">${this.formatMoney(longTerm.theta * 7)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-lg mb-4 text-center">
              <span class="text-matrix-green font-bold">Try It:</span> Adjust DTE to see how it affects cost
            </label>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-400 w-16">30 days</span>
              <input
                type="range"
                id="dte-slider"
                min="30"
                max="365"
                step="5"
                value="${this.state.dte}"
                class="flex-1 h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span class="text-sm text-gray-400 w-16 text-right">365 days</span>
            </div>
            <div class="text-center mt-2">
              <span class="text-3xl font-bold text-matrix-green">${this.state.dte} days</span>
            </div>
          </div>

          <div class="bg-gray-900 p-6 rounded border border-gray-600 mb-6">
            <div class="text-lg font-bold mb-4 text-center">At ${this.state.dte} DTE:</div>
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-sm text-gray-400 mb-1">Upfront Cost</div>
                <div class="text-2xl font-bold">${this.formatMoney(leapsValue.premium)}</div>
              </div>
              <div>
                <div class="text-sm text-gray-400 mb-1">Daily Theta</div>
                <div class="text-2xl font-bold text-red-400">${this.formatMoney(leapsValue.theta)}/day</div>
              </div>
              <div>
                <div class="text-sm text-gray-400 mb-1">7-Day Total</div>
                <div class="text-2xl font-bold text-red-400">${this.formatMoney(sevenDayTotal)}</div>
              </div>
            </div>
          </div>

          <div class="bg-blue-900/30 border border-blue-500 p-4 rounded">
            <p class="text-lg">
              💡 <strong>Key Insight:</strong> Further out in time = cheaper per day, but higher upfront cost.
              <br><br>
              The Turtle Strategy uses <strong>120+ DTE</strong> to minimize daily bleed while maintaining capital efficiency.
            </p>
          </div>
        </div>

        <div class="flex gap-4">
          <button id="back-btn" class="btn flex-1">
            ← PREVIOUS SCREEN
          </button>
          <button id="next-btn" class="btn btn-primary flex-1">
            NEXT SCREEN →
          </button>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const dteSlider = this.container.querySelector<HTMLInputElement>('#dte-slider');
    if (dteSlider) {
      dteSlider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.updateDte(parseInt(target.value));
      });
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
