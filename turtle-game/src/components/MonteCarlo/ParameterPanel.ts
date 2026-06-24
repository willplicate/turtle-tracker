// Parameter Panel Component
// Configuration inputs for Monte Carlo simulation

import type { SimulationConfig } from '../../lib/montecarlo/types';

export interface ParameterPanelCallbacks {
  onRunSimulation: (config: SimulationConfig) => void;
}

export class ParameterPanel {
  private container: HTMLElement;
  private callbacks: ParameterPanelCallbacks;

  constructor(container: HTMLElement, callbacks: ParameterPanelCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="card p-6">
        <h2 class="text-xl font-bold text-matrix-green mb-4">Simulation Parameters</h2>

        <div class="space-y-4">
          <!-- Number of Paths -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">
              Number of Paths
            </label>
            <input
              id="num-paths"
              type="number"
              min="100"
              max="5000"
              step="100"
              value="1000"
              class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            />
            <p class="text-xs text-gray-400 mt-1">100-5000 paths (1000 recommended)</p>
          </div>

          <!-- Number of Weeks -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">
              Number of Weeks
            </label>
            <input
              id="num-weeks"
              type="number"
              min="12"
              max="104"
              step="1"
              value="52"
              class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            />
            <p class="text-xs text-gray-400 mt-1">12-104 weeks (52 = 1 year)</p>
          </div>

          <!-- Starting Cash -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">
              Starting Cash
            </label>
            <input
              id="starting-cash"
              type="number"
              min="5000"
              max="1000000"
              step="1000"
              value="20000"
              class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            />
            <p class="text-xs text-gray-400 mt-1">Initial account balance</p>
          </div>

          <!-- LEAPS Allocation -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">
              LEAPS Allocation (%)
            </label>
            <input
              id="leaps-allocation"
              type="number"
              min="20"
              max="80"
              step="5"
              value="40"
              class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            />
            <p class="text-xs text-gray-400 mt-1">20-80% (40% recommended)</p>
          </div>

          <!-- Initial SPY Price -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">
              Initial SPY Price
            </label>
            <input
              id="initial-price"
              type="number"
              min="100"
              max="1000"
              step="1"
              value="590"
              class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>

          <!-- Initial VIX -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">
              Initial VIX
            </label>
            <input
              id="initial-vix"
              type="number"
              min="9"
              max="80"
              step="1"
              value="16"
              class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            />
          </div>

          <!-- Random Seed -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">
              Random Seed
            </label>
            <input
              id="random-seed"
              type="number"
              min="1"
              max="999999"
              value="${Math.floor(Math.random() * 999999)}"
              class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            />
            <p class="text-xs text-gray-400 mt-1">For reproducibility</p>
          </div>

          <!-- Run Button -->
          <button
            id="run-simulation-btn"
            class="w-full btn btn-primary mt-4"
          >
            🎲 Run Simulation
          </button>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const runBtn = this.container.querySelector('#run-simulation-btn') as HTMLButtonElement;
    runBtn?.addEventListener('click', () => this.handleRunSimulation());
  }

  private handleRunSimulation(): void {
    const config: SimulationConfig = {
      seed: parseInt((this.container.querySelector('#random-seed') as HTMLInputElement).value),
      numPaths: parseInt((this.container.querySelector('#num-paths') as HTMLInputElement).value),
      numWeeks: parseInt((this.container.querySelector('#num-weeks') as HTMLInputElement).value),
      startingCash: parseInt((this.container.querySelector('#starting-cash') as HTMLInputElement).value),
      leapsAllocation: parseInt((this.container.querySelector('#leaps-allocation') as HTMLInputElement).value) / 100,
      initialPrice: parseFloat((this.container.querySelector('#initial-price') as HTMLInputElement).value),
      initialVIX: parseFloat((this.container.querySelector('#initial-vix') as HTMLInputElement).value),
      blowupThreshold: 0.10,
      leapsRollDeltaThreshold: 0.70,  // Roll down before ATM death spiral
      leapsRollDTEThreshold: 180,  // Roll at 180 DTE to avoid accelerating theta decay
    };

    this.callbacks.onRunSimulation(config);
  }

  destroy(): void {
    // Cleanup if needed
  }
}
