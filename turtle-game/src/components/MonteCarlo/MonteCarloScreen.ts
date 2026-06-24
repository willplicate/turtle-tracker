// Monte Carlo Screen - Main Orchestrator Component

import type { SimulationConfig } from '../../lib/montecarlo/types';
import { ParameterPanel } from './ParameterPanel';
import { RuleEditor } from './RuleEditor';
import { ResultsView } from './ResultsView';

export class MonteCarloScreen {
  private container: HTMLElement;
  private parameterPanel!: ParameterPanel;
  private ruleEditor!: RuleEditor;
  private resultsView!: ResultsView;
  private worker: Worker | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.createLayout();
    this.initializeComponents();
  }

  private createLayout(): void {
    this.container.innerHTML = `
      <div class="min-h-screen bg-game-bg px-6 py-4">
        <!-- Header -->
        <div class="mb-6">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-matrix-green">📊 Monte Carlo Simulator</h1>
              <p class="text-gray-400 mt-1">
                Backtest PMCC strike selection strategies across thousands of market scenarios
              </p>
            </div>
            <a href="/" class="btn btn-secondary">
              ← Back to Game
            </a>
          </div>
        </div>

        <!-- Main Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left Column: Parameters & Rules (4 cols) -->
          <div class="lg:col-span-4 space-y-6">
            <div id="parameter-panel"></div>
            <div id="rule-editor"></div>
          </div>

          <!-- Right Column: Results (8 cols) -->
          <div class="lg:col-span-8">
            <div id="results-view"></div>
          </div>
        </div>

        <!-- Progress Overlay -->
        <div id="progress-overlay" class="hidden fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div class="bg-gray-900 border-2 border-matrix-green rounded-xl p-8 max-w-md w-full">
            <h3 class="text-2xl font-bold text-matrix-green mb-4">Running Simulation...</h3>

            <!-- Progress Bar -->
            <div class="w-full bg-gray-700 rounded-full h-4 mb-4">
              <div
                id="progress-bar"
                class="bg-matrix-green h-4 rounded-full transition-all duration-300"
                style="width: 0%"
              ></div>
            </div>

            <!-- Progress Text -->
            <div class="flex justify-between text-sm text-gray-400 mb-2">
              <span id="progress-text">0 / 1000 paths</span>
              <span id="progress-percent">0%</span>
            </div>

            <!-- ETA -->
            <div class="text-center text-gray-400 text-sm">
              <span id="progress-eta">Estimating...</span>
            </div>

            <!-- Current Status -->
            <div class="mt-4 p-3 bg-gray-800 rounded text-sm">
              <div class="text-gray-500 mb-1">Current:</div>
              <div id="progress-status" class="text-matrix-green font-mono">
                Initializing...
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private initializeComponents(): void {
    // Parameter Panel
    const parameterContainer = this.container.querySelector('#parameter-panel') as HTMLElement;
    this.parameterPanel = new ParameterPanel(parameterContainer, {
      onRunSimulation: (config) => this.runSimulation(config),
    });

    // Rule Editor
    const ruleEditorContainer = this.container.querySelector('#rule-editor') as HTMLElement;
    this.ruleEditor = new RuleEditor(ruleEditorContainer);

    // Results View
    const resultsContainer = this.container.querySelector('#results-view') as HTMLElement;
    this.resultsView = new ResultsView(resultsContainer);
  }

  private async runSimulation(config: SimulationConfig): Promise<void> {
    const ruleSets = this.ruleEditor.getSelectedRuleSets();

    if (ruleSets.length === 0) {
      alert('Please select at least one rule set');
      return;
    }

    // Show progress overlay
    this.showProgress();

    // Create Web Worker
    this.worker = new Worker(new URL('../../lib/workers/montecarloWorker.ts', import.meta.url), {
      type: 'module',
    });

    // Listen for messages from worker
    this.worker.onmessage = (e) => {
      const message = e.data;

      if (message.type === 'PROGRESS') {
        this.updateProgress(message.payload);
      } else if (message.type === 'COMPLETE') {
        this.handleResults(message.payload);
        this.hideProgress();
        this.worker?.terminate();
        this.worker = null;
      } else if (message.type === 'ERROR') {
        // Show detailed error message
        const errorDetail = message.payload.error || message.payload.message;
        alert('❌ Simulation Error\n\n' + errorDetail);
        this.hideProgress();
        this.worker?.terminate();
        this.worker = null;
      }
    };

    // Start simulation
    this.worker.postMessage({
      type: 'START_SIMULATION',
      payload: {
        config,
        ruleSets,
        strategies: ['pmcc'], // For MVP, just run PMCC
      },
    });
  }

  private showProgress(): void {
    const overlay = this.container.querySelector('#progress-overlay');
    overlay?.classList.remove('hidden');
  }

  private hideProgress(): void {
    const overlay = this.container.querySelector('#progress-overlay');
    overlay?.classList.add('hidden');
  }

  private updateProgress(payload: any): void {
    const progressBar = this.container.querySelector('#progress-bar') as HTMLElement;
    const progressText = this.container.querySelector('#progress-text') as HTMLElement;
    const progressPercent = this.container.querySelector('#progress-percent') as HTMLElement;
    const progressEta = this.container.querySelector('#progress-eta') as HTMLElement;
    const progressStatus = this.container.querySelector('#progress-status') as HTMLElement;

    if (progressBar) {
      progressBar.style.width = `${payload.percentComplete}%`;
    }

    if (progressText) {
      progressText.textContent = `${payload.pathsCompleted} / ${payload.totalPaths} paths`;
    }

    if (progressPercent) {
      progressPercent.textContent = `${Math.round(payload.percentComplete)}%`;
    }

    if (progressEta) {
      const seconds = Math.ceil(payload.estimatedTimeRemaining / 1000);
      progressEta.textContent = seconds > 0 ? `~${seconds}s remaining` : 'Almost done...';
    }

    if (progressStatus) {
      progressStatus.textContent = `${payload.currentStrategy} - ${payload.currentRuleSet}`;
    }
  }

  private handleResults(payload: any): void {
    // Simulation complete - update results view
    this.resultsView.update(payload.results);

    // Show completion message
    const duration = (payload.totalDurationMs / 1000).toFixed(1);
    alert(`Simulation complete in ${duration} seconds!`);
  }

  destroy(): void {
    this.worker?.terminate();
    this.parameterPanel?.destroy();
    this.ruleEditor?.destroy();
    this.resultsView?.destroy();
  }
}
