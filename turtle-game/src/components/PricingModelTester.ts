// Interactive pricing model tester
// Allows users to see how option prices change with different parameters

import { calculateOptionPrice, type OptionPricingParams } from '../lib/pricing/optionsPricing';

interface TesterState {
  stockPrice: number;
  strike: number;
  dte: number;
  vix: number;
  isCall: boolean;
}

export class PricingModelTester {
  private state: TesterState = {
    stockPrice: 590,
    strike: 590,
    dte: 7,
    vix: 15,
    isCall: true,
  };

  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
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
    const params: OptionPricingParams = {
      stockPrice: this.state.stockPrice,
      strike: this.state.strike,
      dte: this.state.dte,
      vix: this.state.vix,
      isCall: this.state.isCall,
    };

    const price = calculateOptionPrice(params);

    this.container.innerHTML = `
      <div class="max-w-6xl mx-auto">
        <div class="mb-8">
          <h1 class="text-4xl font-bold mb-2">Options Pricing Model Tester</h1>
          <p class="text-gray-400">Adjust the sliders to see how option prices change</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left: Controls -->
          <div class="card">
            <h2 class="text-2xl font-bold mb-6">Parameters</h2>

            <!-- Stock Price -->
            <div class="mb-6">
              <label class="block text-lg mb-2">
                Stock Price (SPY): <span class="text-matrix-green font-bold">$${this.state.stockPrice}</span>
              </label>
              <input
                type="range"
                id="stock-price"
                min="550"
                max="650"
                step="1"
                value="${this.state.stockPrice}"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div class="flex justify-between text-sm text-gray-400 mt-1">
                <span>$550</span>
                <span>$650</span>
              </div>
            </div>

            <!-- Strike Price -->
            <div class="mb-6">
              <label class="block text-lg mb-2">
                Strike Price: <span class="text-matrix-green font-bold">$${this.state.strike}</span>
                <span class="text-sm text-gray-400 ml-2">(${price.moneynessLabel})</span>
              </label>
              <input
                type="range"
                id="strike"
                min="550"
                max="650"
                step="1"
                value="${this.state.strike}"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div class="flex justify-between text-sm text-gray-400 mt-1">
                <span>$550 (Deep ITM)</span>
                <span>$650 (Deep OTM)</span>
              </div>
            </div>

            <!-- DTE -->
            <div class="mb-6">
              <label class="block text-lg mb-2">
                Days to Expiration (DTE): <span class="text-matrix-green font-bold">${this.state.dte}</span>
              </label>
              <input
                type="range"
                id="dte"
                min="0"
                max="120"
                step="1"
                value="${this.state.dte}"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div class="flex justify-between text-sm text-gray-400 mt-1">
                <span>0 (Expiry)</span>
                <span>120 (4 months)</span>
              </div>
            </div>

            <!-- VIX -->
            <div class="mb-6">
              <label class="block text-lg mb-2">
                VIX (Volatility): <span class="text-matrix-green font-bold">${this.state.vix}</span>
                <span class="text-sm ml-2 ${this.state.vix < 20 ? 'text-green-400' : this.state.vix < 30 ? 'text-yellow-400' : 'text-red-400'}">
                  ${this.state.vix < 20 ? '(Calm)' : this.state.vix < 30 ? '(Elevated)' : '(High)'}
                </span>
              </label>
              <input
                type="range"
                id="vix"
                min="10"
                max="60"
                step="1"
                value="${this.state.vix}"
                class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div class="flex justify-between text-sm text-gray-400 mt-1">
                <span>10 (Very calm)</span>
                <span>60 (Panic)</span>
              </div>
            </div>

            <!-- Call/Put Toggle -->
            <div class="flex gap-4 mb-6">
              <button
                id="toggle-call"
                class="btn ${this.state.isCall ? 'btn-primary' : ''} flex-1"
              >
                CALL
              </button>
              <button
                id="toggle-put"
                class="btn ${!this.state.isCall ? 'btn-primary' : ''} flex-1"
              >
                PUT
              </button>
            </div>
          </div>

          <!-- Right: Results -->
          <div>
            <div class="card mb-4">
              <h2 class="text-2xl font-bold mb-6">Option Value</h2>

              <div class="bg-gray-900 p-6 rounded mb-6 border-2 border-matrix-green">
                <div class="text-sm text-gray-400">Total Premium</div>
                <div class="text-5xl font-bold text-matrix-green mb-2">
                  ${this.formatMoney(price.total)}
                </div>
                <div class="text-sm text-gray-400">per contract (100 shares)</div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-gray-800 p-4 rounded">
                  <div class="text-sm text-gray-400">Intrinsic Value</div>
                  <div class="text-2xl font-bold">${this.formatMoney(price.intrinsic)}</div>
                  <div class="text-xs text-gray-500 mt-1">Real value if exercised</div>
                </div>
                <div class="bg-gray-800 p-4 rounded">
                  <div class="text-sm text-gray-400">Extrinsic Value</div>
                  <div class="text-2xl font-bold text-yellow-400">${this.formatMoney(price.extrinsic)}</div>
                  <div class="text-xs text-gray-500 mt-1">Time value (decays)</div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-800 p-4 rounded">
                  <div class="text-sm text-gray-400">Delta</div>
                  <div class="text-2xl font-bold">${(price.delta * 100).toFixed(1)}%</div>
                  <div class="text-xs text-gray-500 mt-1">Price sensitivity</div>
                </div>
                <div class="bg-gray-800 p-4 rounded">
                  <div class="text-sm text-gray-400">Theta</div>
                  <div class="text-2xl font-bold text-red-400">${this.formatMoney(price.theta)}/day</div>
                  <div class="text-xs text-gray-500 mt-1">Daily decay</div>
                </div>
              </div>
            </div>

            <div class="card bg-blue-900/20 border-blue-500">
              <h3 class="font-bold mb-2">💡 Understanding the Values</h3>
              <ul class="text-sm space-y-2">
                <li><strong>Intrinsic:</strong> How much the option is "in the money"</li>
                <li><strong>Extrinsic:</strong> Extra value from time and volatility</li>
                <li><strong>Delta:</strong> If stock moves $1, option moves ~${(Math.abs(price.delta)).toFixed(2)}</li>
                <li><strong>Theta:</strong> You lose ~${this.formatMoney(Math.abs(price.theta))} per day from time decay</li>
              </ul>
            </div>

            <div class="mt-4 bg-yellow-900/20 border border-yellow-500 p-4 rounded">
              <p class="text-sm">
                <strong>Try this:</strong> Move the stock price slider and watch the intrinsic vs extrinsic split.
                Notice how ATM options have maximum extrinsic value!
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Stock price slider
    const stockPriceSlider = this.container.querySelector<HTMLInputElement>('#stock-price');
    if (stockPriceSlider) {
      stockPriceSlider.addEventListener('input', (e) => {
        this.state.stockPrice = parseInt((e.target as HTMLInputElement).value);
        this.render();
        this.attachEventListeners();
      });
    }

    // Strike slider
    const strikeSlider = this.container.querySelector<HTMLInputElement>('#strike');
    if (strikeSlider) {
      strikeSlider.addEventListener('input', (e) => {
        this.state.strike = parseInt((e.target as HTMLInputElement).value);
        this.render();
        this.attachEventListeners();
      });
    }

    // DTE slider
    const dteSlider = this.container.querySelector<HTMLInputElement>('#dte');
    if (dteSlider) {
      dteSlider.addEventListener('input', (e) => {
        this.state.dte = parseInt((e.target as HTMLInputElement).value);
        this.render();
        this.attachEventListeners();
      });
    }

    // VIX slider
    const vixSlider = this.container.querySelector<HTMLInputElement>('#vix');
    if (vixSlider) {
      vixSlider.addEventListener('input', (e) => {
        this.state.vix = parseInt((e.target as HTMLInputElement).value);
        this.render();
        this.attachEventListeners();
      });
    }

    // Call/Put toggle
    const callBtn = this.container.querySelector('#toggle-call');
    const putBtn = this.container.querySelector('#toggle-put');

    if (callBtn) {
      callBtn.addEventListener('click', () => {
        this.state.isCall = true;
        this.render();
        this.attachEventListeners();
      });
    }

    if (putBtn) {
      putBtn.addEventListener('click', () => {
        this.state.isCall = false;
        this.render();
        this.attachEventListeners();
      });
    }
  }
}
