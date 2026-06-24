// Tutorial 1, Screen 4: Final Comparison
// Learning: LEAPS = same exposure with 75% less capital, but theta is the cost

interface Screen4State {
  hasRun: boolean;
}

export class Tutorial1Screen4 {
  private state: Screen4State = {
    hasRun: false,
  };

  private container: HTMLElement;
  private onComplete: () => void;
  private onBack: () => void;

  // Constants from spec
  private readonly SHARES_OWNED = 85;
  private readonly SPY_PRICE = 590;
  private readonly LEAPS_COST = 12900;
  private readonly LEAPS_DELTA = 0.85;
  private readonly LEAPS_THETA = -2;
  private readonly DAYS = 30;

  constructor(container: HTMLElement, onComplete: () => void, onBack: () => void) {
    this.container = container;
    this.onComplete = onComplete;
    this.onBack = onBack;
    this.render();
    this.attachEventListeners();
  }

  private runSimulation(): void {
    this.state.hasRun = true;
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
    const sharesCapital = this.SHARES_OWNED * this.SPY_PRICE;
    const capitalFreed = sharesCapital - this.LEAPS_COST;

    // Calculate UP scenario (SPY +$10)
    const upMove = 10;
    const sharesUpGain = this.SHARES_OWNED * upMove;
    const leapsUpDelta = upMove * this.LEAPS_DELTA * 100;
    const leapsUpTheta = this.LEAPS_THETA * this.DAYS;
    const leapsUpNet = leapsUpDelta + leapsUpTheta;

    // Calculate DOWN scenario (SPY -$10)
    const downMove = -10;
    const sharesDownLoss = this.SHARES_OWNED * downMove;
    const leapsDownDelta = downMove * this.LEAPS_DELTA * 100;
    const leapsDownTheta = this.LEAPS_THETA * this.DAYS;
    const leapsDownNet = leapsDownDelta + leapsDownTheta;

    // Cash opportunity calculation
    const monthlyInterest = (capitalFreed * 0.045) / 12;

    this.container.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="mb-8">
          <h1 class="text-4xl font-bold mb-2">Tutorial 1: Shares vs LEAPS</h1>
          <h2 class="text-2xl text-matrix-green">Step 4 of 4 - Final Comparison</h2>
        </div>

        <div class="card mb-6">
          <div class="text-center mb-6">
            ${!this.state.hasRun ? `
              <p class="text-lg mb-4">
                Let's run a 30-day simulation comparing <strong>85 shares</strong> vs <strong>85-delta LEAPS</strong>
              </p>
              <button id="run-btn" class="btn btn-primary text-xl py-4 px-8">
                🎬 RUN 30-DAY TEST
              </button>
            ` : `
              <div class="inline-block bg-matrix-green text-black px-6 py-3 rounded font-bold text-xl mb-4">
                ✓ SIMULATION COMPLETE
              </div>
            `}
          </div>

          ${this.state.hasRun ? `
            <div class="grid grid-cols-2 gap-6 mb-6">
              <!-- Shares Column -->
              <div class="bg-gray-800 p-4 rounded">
                <div class="text-center mb-4">
                  <div class="text-xl font-bold">85 SHARES</div>
                  <div class="text-sm text-gray-400">Capital: ${this.formatMoney(sharesCapital)}</div>
                </div>

                <!-- UP Scenario -->
                <div class="bg-gray-900 p-3 rounded mb-3 border-2 border-matrix-green">
                  <div class="text-sm text-gray-400 mb-2">📈 UP SCENARIO</div>
                  <div class="text-lg mb-1">SPY +$${upMove}</div>
                  <div class="text-2xl font-bold text-matrix-green">
                    Gain: ${this.formatMoney(sharesUpGain)} ✓
                  </div>
                </div>

                <!-- DOWN Scenario -->
                <div class="bg-gray-900 p-3 rounded border-2 border-red-400">
                  <div class="text-sm text-gray-400 mb-2">📉 DOWN SCENARIO</div>
                  <div class="text-lg mb-1">SPY -$${Math.abs(downMove)}</div>
                  <div class="text-2xl font-bold text-red-400">
                    Loss: ${this.formatMoney(sharesDownLoss)}
                  </div>
                </div>
              </div>

              <!-- LEAPS Column -->
              <div class="bg-gray-800 p-4 rounded">
                <div class="text-center mb-4">
                  <div class="text-xl font-bold">85-DELTA LEAPS</div>
                  <div class="text-sm text-gray-400">Capital: ${this.formatMoney(this.LEAPS_COST)}</div>
                </div>

                <!-- UP Scenario -->
                <div class="bg-gray-900 p-3 rounded mb-3 border-2 border-matrix-green">
                  <div class="text-sm text-gray-400 mb-2">📈 UP SCENARIO</div>
                  <div class="text-lg mb-1">SPY +$${upMove}</div>
                  <div class="space-y-1 text-sm mb-2">
                    <div class="flex justify-between">
                      <span class="text-gray-400">Delta gain:</span>
                      <span class="text-matrix-green">+${this.formatMoney(leapsUpDelta)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Theta cost:</span>
                      <span class="text-red-400">${this.formatMoney(leapsUpTheta)}</span>
                    </div>
                  </div>
                  <div class="border-t border-gray-700 pt-2">
                    <div class="text-2xl font-bold text-matrix-green">
                      Net: ${this.formatMoney(leapsUpNet)} ✓
                    </div>
                  </div>
                </div>

                <!-- DOWN Scenario -->
                <div class="bg-gray-900 p-3 rounded border-2 border-red-400">
                  <div class="text-sm text-gray-400 mb-2">📉 DOWN SCENARIO</div>
                  <div class="text-lg mb-1">SPY -$${Math.abs(downMove)}</div>
                  <div class="space-y-1 text-sm mb-2">
                    <div class="flex justify-between">
                      <span class="text-gray-400">Delta loss:</span>
                      <span class="text-red-400">${this.formatMoney(leapsDownDelta)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Theta cost:</span>
                      <span class="text-red-400">${this.formatMoney(leapsDownTheta)}</span>
                    </div>
                  </div>
                  <div class="border-t border-gray-700 pt-2">
                    <div class="text-2xl font-bold text-red-400">
                      Net: ${this.formatMoney(leapsDownNet)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bonus Section -->
            <div class="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-2 border-purple-500/50 p-6 rounded mb-6">
              <div class="text-center mb-4">
                <div class="text-xl font-bold text-purple-300">💰 BONUS: Cash Opportunity</div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center">
                  <div class="text-sm text-gray-400 mb-1">Freed Capital</div>
                  <div class="text-3xl font-bold text-matrix-green">${this.formatMoney(capitalFreed)}</div>
                </div>
                <div class="text-center">
                  <div class="text-sm text-gray-400 mb-1">Earning 4.5% APY</div>
                  <div class="text-3xl font-bold text-matrix-green">~${this.formatMoney(monthlyInterest)}/month</div>
                </div>
              </div>
            </div>

            <!-- Key Takeaways -->
            <div class="bg-blue-900/30 border border-blue-500 p-6 rounded">
              <div class="text-xl font-bold mb-4">🎯 Key Takeaways:</div>
              <div class="space-y-3 text-lg">
                <div class="flex items-start gap-3">
                  <span class="text-matrix-green text-2xl">✓</span>
                  <span><strong>Same exposure:</strong> LEAPS gives you the same upside as shares (within $${Math.abs(sharesUpGain - leapsUpNet)})</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-matrix-green text-2xl">✓</span>
                  <span><strong>75% less capital:</strong> ${this.formatMoney(this.LEAPS_COST)} vs ${this.formatMoney(sharesCapital)}</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-yellow-400 text-2xl">⚠</span>
                  <span><strong>Theta cost:</strong> ${this.formatMoney(Math.abs(leapsUpTheta))}/month is your "rental fee" for leverage</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-matrix-green text-2xl">✓</span>
                  <span><strong>Capital freed:</strong> You keep $${this.formatMoney(capitalFreed)} working elsewhere!</span>
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="flex gap-4">
          ${this.state.hasRun ? `
            <button id="back-btn" class="btn flex-1">
              ← PREVIOUS SCREEN
            </button>
            <button id="complete-btn" class="btn btn-primary flex-1 text-xl py-4">
              🎓 COMPLETE TUTORIAL
            </button>
          ` : `
            <button id="back-btn" class="btn flex-1">
              ← PREVIOUS SCREEN
            </button>
          `}
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const runBtn = this.container.querySelector('#run-btn');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.runSimulation());
    }

    const backBtn = this.container.querySelector('#back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.onBack();
      });
    }

    const completeBtn = this.container.querySelector('#complete-btn');
    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        this.onComplete();
      });
    }
  }
}
