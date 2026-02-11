// Tutorial 1, Screen 1: Own Shares
// Learning: Simple share ownership and P&L calculation

interface Screen1State {
  sharesOwned: number;
  initialPrice: number;
  currentPrice: number;
  daysAdvanced: number;
}

export class Tutorial1Screen1 {
  private state: Screen1State = {
    sharesOwned: 85,
    initialPrice: 590,
    currentPrice: 590,
    daysAdvanced: 0,
  };

  private container: HTMLElement;
  private onNext: () => void;
  private _onBack: () => void;

  constructor(container: HTMLElement, onNext: () => void, _onBack: () => void) {
    this.container = container;
    this.onNext = onNext;
    this._onBack = _onBack;
    this.render();
    this.attachEventListeners();
    // Dummy read to satisfy TypeScript's noUnusedLocals rule, as 'onBack' is not used in the first screen.
    void this._onBack;
  }

  private calculateValue(): number {
    return this.state.sharesOwned * this.state.currentPrice;
  }

  private calculateInitialValue(): number {
    return this.state.sharesOwned * this.state.initialPrice;
  }

  private calculateGain(): number {
    return this.calculateValue() - this.calculateInitialValue();
  }

  private advanceTime(): void {
    this.state.daysAdvanced = 7;
    this.state.currentPrice = 595;
    this.render();
  }

  private updateShares(shares: number): void {
    this.state.sharesOwned = shares;
    this.render();
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
    const initialValue = this.calculateInitialValue();
    const currentValue = this.calculateValue();
    const gain = this.calculateGain();
    const priceChange = this.state.currentPrice - this.state.initialPrice;

    this.container.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="mb-8">
          <h1 class="text-4xl font-bold mb-2">Tutorial 1: Shares vs LEAPS</h1>
          <h2 class="text-2xl text-matrix-green">Screen 1 - Own Shares</h2>
        </div>

        <div class="card mb-6">
          <div class="mb-6">
            <label class="block text-lg mb-3">
              Number of Shares: <span class="text-matrix-green font-bold">${this.state.sharesOwned}</span>
            </label>
            <input
              type="range"
              id="shares-slider"
              min="1"
              max="100"
              value="${this.state.sharesOwned}"
              class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div class="flex justify-between text-sm text-gray-400 mt-1">
              <span>1 share</span>
              <span>100 shares</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-800 p-4 rounded">
              <div class="text-sm text-gray-400">SPY Price</div>
              <div class="text-2xl font-bold">$${this.state.initialPrice}</div>
            </div>
            <div class="bg-gray-800 p-4 rounded">
              <div class="text-sm text-gray-400">Shares Owned</div>
              <div class="text-2xl font-bold text-matrix-green">${this.state.sharesOwned}</div>
            </div>
            <div class="bg-gray-800 p-4 rounded col-span-2">
              <div class="text-sm text-gray-400">Total Value</div>
              <div class="text-3xl font-bold">${this.formatMoney(initialValue)}</div>
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
                    $${this.state.currentPrice}
                    <span class="text-matrix-green text-lg ml-2">+$${priceChange}</span>
                  </div>
                </div>
                <div class="bg-gray-800 p-4 rounded">
                  <div class="text-sm text-gray-400">New Value</div>
                  <div class="text-2xl font-bold">${this.formatMoney(currentValue)}</div>
                </div>
                <div class="bg-gray-900 p-4 rounded col-span-2 border-2 border-matrix-green">
                  <div class="text-sm text-gray-400">Gain</div>
                  <div class="text-4xl font-bold text-matrix-green">
                    ${gain >= 0 ? '+' : ''}${this.formatMoney(gain)}
                  </div>
                </div>
              </div>

              <div class="bg-blue-900/30 border border-blue-500 p-4 rounded">
                <p class="text-lg">
                  ✓ <strong>Simple:</strong> When SPY moves $${priceChange}, you make
                  <span class="text-matrix-green font-bold">$${priceChange} × ${this.state.sharesOwned} shares = ${this.formatMoney(gain)}</span>
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
            <button id="reset-btn" class="btn flex-1">
              ↺ RESET
            </button>
            <button id="next-btn" class="btn btn-primary flex-1">
              NEXT SCREEN →
            </button>
          `}
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Slider
    const slider = this.container.querySelector<HTMLInputElement>('#shares-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        this.updateShares(parseInt(target.value));
      });
    }

    // Advance button
    const advanceBtn = this.container.querySelector('#advance-btn');
    if (advanceBtn) {
      advanceBtn.addEventListener('click', () => this.advanceTime());
    }

    // Reset button
    const resetBtn = this.container.querySelector('#reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.state.daysAdvanced = 0;
        this.state.currentPrice = this.state.initialPrice;
        this.render();
        this.attachEventListeners();
      });
    }

    // Next button
    const nextBtn = this.container.querySelector('#next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.onNext();
      });
    }
  }
}
