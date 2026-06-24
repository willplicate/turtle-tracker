// Results View Component
// Displays summary table and charts for simulation results

import type { SimulationResults } from '../../lib/montecarlo/types';
import { exportToCSV } from '../../lib/montecarlo/resultsAnalyzer';
import { Chart, registerables } from 'chart.js';
import { PathInspector } from './PathInspector';

Chart.register(...registerables);

export class ResultsView {
  private container: HTMLElement;
  private results: SimulationResults[] = [];
  private charts: Chart[] = [];
  private pathInspector: PathInspector;

  constructor(container: HTMLElement) {
    this.container = container;
    this.pathInspector = new PathInspector();
    this.render();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="space-y-6">
        <!-- Empty State -->
        <div id="empty-state" class="card p-12 text-center">
          <div class="text-6xl mb-4">📊</div>
          <h2 class="text-xl font-bold text-gray-300 mb-2">No Results Yet</h2>
          <p class="text-gray-400">Configure parameters and run a simulation to see results</p>
        </div>

        <!-- Results Container (hidden initially) -->
        <div id="results-container" class="hidden space-y-6">
          <!-- Summary Table -->
          <div class="card p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-matrix-green">Summary Statistics</h2>
              <button id="export-csv-btn" class="btn btn-secondary">
                📥 Export CSV
              </button>
            </div>
            <div id="summary-table" class="overflow-x-auto"></div>
          </div>

          <!-- Model Validation -->
          <div class="card p-6">
            <h2 class="text-xl font-bold text-matrix-green mb-4">📊 Model Validation</h2>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="h-80">
                <h3 class="text-sm font-medium text-gray-300 mb-2">Annual Return Distribution (Market Paths)</h3>
                <div class="h-72 relative">
                  <canvas id="annual-return-chart" class="bg-gray-900 rounded"></canvas>
                </div>
              </div>
              <div class="h-80">
                <h3 class="text-sm font-medium text-gray-300 mb-2">Historical SPY Comparison</h3>
                <div id="spy-comparison" class="h-72 overflow-y-auto text-sm"></div>
              </div>
              <div class="h-80">
                <h3 class="text-sm font-medium text-gray-300 mb-2">Market Regime Statistics</h3>
                <div id="market-regimes" class="h-72 overflow-y-auto text-sm"></div>
              </div>
            </div>
          </div>

          <!-- Strategy Results -->
          <div class="card p-6">
            <h2 class="text-xl font-bold text-matrix-green mb-4">Strategy Performance</h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div class="h-80">
                <h3 class="text-sm font-medium text-gray-300 mb-2">Terminal Wealth Distribution</h3>
                <div class="h-72 relative">
                  <canvas id="histogram-chart" class="bg-gray-900 rounded"></canvas>
                </div>
              </div>
              <div class="h-80">
                <h3 class="text-sm font-medium text-gray-300 mb-2">Survival Curve</h3>
                <div class="h-72 relative">
                  <canvas id="survival-chart" class="bg-gray-900 rounded"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const exportBtn = this.container.querySelector('#export-csv-btn');
    exportBtn?.addEventListener('click', () => this.exportCSV());
  }

  update(results: SimulationResults[]): void {
    this.results = results;

    // Hide empty state, show results
    const emptyState = this.container.querySelector('#empty-state');
    const resultsContainer = this.container.querySelector('#results-container');

    if (emptyState && resultsContainer) {
      emptyState.classList.add('hidden');
      resultsContainer.classList.remove('hidden');
    }

    // Render summary table
    this.renderSummaryTable();

    // Render charts
    this.renderCharts();
  }

  private renderSummaryTable(): void {
    const tableEl = this.container.querySelector('#summary-table');
    if (!tableEl) return;

    const headers = [
      'Strategy',
      'Rule Set',
      'Survival %',
      'Win %',
      'Median $',
      'Mean $',
      'Std Dev $',
      'CVaR $',
      'Max DD %',
    ];

    const rows = this.results.map((r) => [
      r.strategy === 'pmcc' ? 'PMCC' : 'Naked LEAPS',
      r.ruleSetName,
      r.survivalRate.toFixed(1) + '%',
      r.winRate.toFixed(1) + '%',
      '$' + r.medianFinalValue.toLocaleString(),
      '$' + r.meanFinalValue.toLocaleString(),
      '$' + r.stdDevFinalValue.toLocaleString(),
      '$' + r.cvar95.toLocaleString(),
      r.medianMaxDrawdown.toFixed(1) + '%',
    ]);

    tableEl.innerHTML = `
      <table class="w-full text-sm">
        <thead class="bg-gray-800">
          <tr>
            ${headers.map((h) => `<th class="px-4 py-2 text-left text-gray-300">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-700">
          ${rows
            .map(
              (row) => `
            <tr class="hover:bg-gray-800">
              ${row.map((cell) => `<td class="px-4 py-2 text-gray-200">${cell}</td>`).join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  private renderCharts(): void {
    // Destroy existing charts
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];

    this.renderAnnualReturnDistribution();
    this.renderSPYComparison();
    this.renderMarketRegimeStats();
    this.renderHistogram();
    this.renderSurvivalCurve();
  }

  private renderAnnualReturnDistribution(): void {
    const canvas = this.container.querySelector('#annual-return-chart') as HTMLCanvasElement;
    if (!canvas) return;

    // Calculate annual returns from all paths
    const annualReturns: number[] = [];
    this.results.forEach((r) => {
      r.allPathResults.forEach((path) => {
        if (path.weeklyHistory.length > 0) {
          const startPrice = path.weeklyHistory[0].price;
          const endPrice = path.weeklyHistory[path.weeklyHistory.length - 1].price;
          const annualReturn = ((endPrice - startPrice) / startPrice) * 100;
          annualReturns.push(annualReturn);
        }
      });
    });

    if (annualReturns.length === 0) return;

    // Create bins from -60% to +60%
    const minReturn = -60;
    const maxReturn = 60;
    const binSize = 5; // 5% bins
    const numBins = (maxReturn - minReturn) / binSize;
    const bins = Array(numBins).fill(0);

    annualReturns.forEach((ret) => {
      const binIndex = Math.floor((ret - minReturn) / binSize);
      if (binIndex >= 0 && binIndex < numBins) {
        bins[binIndex]++;
      }
    });

    const labels = bins.map((_, i) => {
      const binStart = minReturn + i * binSize;
      return binStart + '%';
    });

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Frequency',
            data: bins,
            backgroundColor: '#3b82f680',
            borderColor: '#3b82f6',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#374151' },
          },
          x: {
            ticks: { color: '#9ca3af', maxRotation: 45, minRotation: 45 },
            grid: { color: '#374151' },
          },
        },
        plugins: {
          legend: { labels: { color: '#3b82f6' } },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const binStart = minReturn + context.dataIndex * binSize;
                const binEnd = binStart + binSize;
                return `Range: ${binStart}% to ${binEnd}%`;
              },
            },
          },
        },
      },
    });

    this.charts.push(chart);
  }

  private renderSPYComparison(): void {
    const container = this.container.querySelector('#spy-comparison');
    if (!container) return;

    // Calculate annual returns from all paths
    const annualReturns: number[] = [];
    this.results.forEach((r) => {
      r.allPathResults.forEach((path) => {
        if (path.weeklyHistory.length > 0) {
          const startPrice = path.weeklyHistory[0].price;
          const endPrice = path.weeklyHistory[path.weeklyHistory.length - 1].price;
          const annualReturn = ((endPrice - startPrice) / startPrice) * 100;
          annualReturns.push(annualReturn);
        }
      });
    });

    if (annualReturns.length === 0) return;

    // Calculate statistics
    const mean = annualReturns.reduce((a, b) => a + b, 0) / annualReturns.length;
    const variance = annualReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / annualReturns.length;
    const stdDev = Math.sqrt(variance);
    const negativeYears = (annualReturns.filter((r) => r < 0).length / annualReturns.length) * 100;
    const min = Math.min(...annualReturns);
    const max = Math.max(...annualReturns);

    // Calculate percentiles
    const sorted = [...annualReturns].sort((a, b) => a - b);
    const p5 = sorted[Math.floor(sorted.length * 0.05)];
    const median = sorted[Math.floor(sorted.length * 0.50)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    // Historical SPY benchmarks (known from historical data)
    const histSPY = {
      mean: 10.0,
      stdDev: 18.5,
      negativeYears: 27.0,
      min: -37.0,
      max: 32.0,
      p5: -25.0,
      p25: 0.0,
      median: 12.0,
      p75: 22.0,
      p95: 30.0,
    };

    const getColor = (simVal: number, histVal: number, reverse = false) => {
      const diff = Math.abs(simVal - histVal);
      const threshold = Math.abs(histVal) * 0.2; // 20% tolerance
      if (diff < threshold) return 'text-green-400'; // Close match
      if (reverse ? simVal > histVal : simVal < histVal) return 'text-yellow-400'; // Warning
      return 'text-red-400'; // Concern
    };

    container.innerHTML = `
      <div class="space-y-4">
        <div class="text-gray-300">
          <p class="font-semibold mb-2 text-blue-400">Simulated Market Paths vs Historical SPY (1928-2024)</p>
          <p class="text-xs text-gray-400 mb-3">Green = Match, Yellow = Slight deviation, Red = Significant deviation</p>
        </div>

        <table class="w-full text-xs">
          <thead class="border-b border-gray-600">
            <tr>
              <th class="text-left py-1 text-gray-400">Metric</th>
              <th class="text-right py-1 text-gray-400">Simulated</th>
              <th class="text-right py-1 text-gray-400">Historical SPY</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            <tr>
              <td class="py-2 text-gray-300">Mean Return</td>
              <td class="text-right ${getColor(mean, histSPY.mean)}">${mean.toFixed(1)}%</td>
              <td class="text-right text-gray-300">${histSPY.mean.toFixed(1)}%</td>
            </tr>
            <tr>
              <td class="py-2 text-gray-300">Std Deviation</td>
              <td class="text-right ${getColor(stdDev, histSPY.stdDev)}">${stdDev.toFixed(1)}%</td>
              <td class="text-right text-gray-300">${histSPY.stdDev.toFixed(1)}%</td>
            </tr>
            <tr>
              <td class="py-2 text-gray-300">Negative Years %</td>
              <td class="text-right ${getColor(negativeYears, histSPY.negativeYears, true)}">${negativeYears.toFixed(1)}%</td>
              <td class="text-right text-gray-300">${histSPY.negativeYears.toFixed(1)}%</td>
            </tr>
            <tr>
              <td class="py-2 text-gray-300">Worst Year</td>
              <td class="text-right ${getColor(min, histSPY.min, true)}">${min.toFixed(1)}%</td>
              <td class="text-right text-gray-300">${histSPY.min.toFixed(1)}%</td>
            </tr>
            <tr>
              <td class="py-2 text-gray-300">Best Year</td>
              <td class="text-right ${getColor(max, histSPY.max)}">${max.toFixed(1)}%</td>
              <td class="text-right text-gray-300">${histSPY.max.toFixed(1)}%</td>
            </tr>
            <tr>
              <td class="py-2 text-gray-300">5th Percentile</td>
              <td class="text-right ${getColor(p5, histSPY.p5, true)}">${p5.toFixed(1)}%</td>
              <td class="text-right text-gray-300">${histSPY.p5.toFixed(1)}%</td>
            </tr>
            <tr>
              <td class="py-2 text-gray-300">Median</td>
              <td class="text-right ${getColor(median, histSPY.median)}">${median.toFixed(1)}%</td>
              <td class="text-right text-gray-300">${histSPY.median.toFixed(1)}%</td>
            </tr>
            <tr>
              <td class="py-2 text-gray-300">95th Percentile</td>
              <td class="text-right ${getColor(p95, histSPY.p95)}">${p95.toFixed(1)}%</td>
              <td class="text-right text-gray-300">${histSPY.p95.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>

        <div class="mt-4 p-3 bg-gray-800 rounded text-xs">
          <p class="font-semibold text-gray-300 mb-1">Interpretation:</p>
          <ul class="space-y-1 text-gray-400">
            <li>• <span class="text-green-400">Green</span>: Simulated market closely matches historical reality</li>
            <li>• <span class="text-yellow-400">Yellow</span>: Slight deviation (within 20% of historical)</li>
            <li>• <span class="text-red-400">Red</span>: Significant deviation - model may be biased</li>
          </ul>
        </div>
      </div>
    `;
  }

  private renderMarketRegimeStats(): void {
    const container = this.container.querySelector('#market-regimes');
    if (!container) return;

    // Analyze market conditions across all paths
    let totalWeeks = 0;
    let highVixWeeks = 0; // VIX > 30
    let veryHighVixWeeks = 0; // VIX > 40
    let extremeVixWeeks = 0; // VIX > 50
    let priceUpWeeks = 0;
    let priceDownWeeks = 0;
    let largeDropWeeks = 0; // Weekly drop > 5%
    let extremeDropWeeks = 0; // Weekly drop > 10%

    let bullPaths = 0; // Annual return > +10%
    let bearPaths = 0; // Annual return < -10%
    let sidewaysPaths = 0; // Annual return between -10% and +10%

    this.results.forEach((r) => {
      r.allPathResults.forEach((path) => {
        // Calculate annual return
        if (path.weeklyHistory.length > 0) {
          const startPrice = path.weeklyHistory[0].price;
          const endPrice = path.weeklyHistory[path.weeklyHistory.length - 1].price;
          const annualReturn = ((endPrice - startPrice) / startPrice) * 100;

          if (annualReturn > 10) bullPaths++;
          else if (annualReturn < -10) bearPaths++;
          else sidewaysPaths++;
        }

        // Analyze weekly conditions
        path.weeklyHistory.forEach((week, idx) => {
          totalWeeks++;

          if (week.vix > 30) highVixWeeks++;
          if (week.vix > 40) veryHighVixWeeks++;
          if (week.vix > 50) extremeVixWeeks++;

          if (idx > 0) {
            const prevPrice = path.weeklyHistory[idx - 1].price;
            const weeklyReturn = ((week.price - prevPrice) / prevPrice) * 100;

            if (weeklyReturn > 0) priceUpWeeks++;
            else priceDownWeeks++;

            if (weeklyReturn < -5) largeDropWeeks++;
            if (weeklyReturn < -10) extremeDropWeeks++;
          }
        });
      });
    });

    const totalPaths = this.results.reduce((sum, r) => sum + r.numPaths, 0);

    container.innerHTML = `
      <div class="space-y-3">
        <div class="text-gray-300">
          <p class="font-semibold mb-2 text-purple-400">Market Conditions Across ${totalPaths} Paths</p>
        </div>

        <!-- Path Outcomes -->
        <div class="bg-gray-800 rounded p-3">
          <p class="font-semibold text-xs text-gray-400 mb-2">Path Outcomes (52 weeks)</p>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-300">Bull Market (>+10%):</span>
              <span class="font-mono text-green-400">${((bullPaths / totalPaths) * 100).toFixed(1)}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-300">Sideways (-10% to +10%):</span>
              <span class="font-mono text-yellow-400">${((sidewaysPaths / totalPaths) * 100).toFixed(1)}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-300">Bear Market (<-10%):</span>
              <span class="font-mono text-red-400">${((bearPaths / totalPaths) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <!-- VIX Conditions -->
        <div class="bg-gray-800 rounded p-3">
          <p class="font-semibold text-xs text-gray-400 mb-2">VIX Conditions (% of weeks)</p>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-300">VIX > 30 (High):</span>
              <span class="font-mono ${highVixWeeks / totalWeeks > 0.15 ? 'text-yellow-400' : 'text-green-400'}">${((highVixWeeks / totalWeeks) * 100).toFixed(1)}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-300">VIX > 40 (Very High):</span>
              <span class="font-mono ${veryHighVixWeeks / totalWeeks > 0.05 ? 'text-orange-400' : 'text-green-400'}">${((veryHighVixWeeks / totalWeeks) * 100).toFixed(1)}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-300">VIX > 50 (Extreme):</span>
              <span class="font-mono ${extremeVixWeeks / totalWeeks > 0.01 ? 'text-red-400' : 'text-gray-400'}">${((extremeVixWeeks / totalWeeks) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <!-- Weekly Price Action -->
        <div class="bg-gray-800 rounded p-3">
          <p class="font-semibold text-xs text-gray-400 mb-2">Weekly Price Movement</p>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-300">Up Weeks:</span>
              <span class="font-mono text-green-400">${((priceUpWeeks / (totalWeeks - totalPaths)) * 100).toFixed(1)}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-300">Down Weeks:</span>
              <span class="font-mono text-red-400">${((priceDownWeeks / (totalWeeks - totalPaths)) * 100).toFixed(1)}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-300">Large Drop (>5%):</span>
              <span class="font-mono text-orange-400">${((largeDropWeeks / (totalWeeks - totalPaths)) * 100).toFixed(1)}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-300">Extreme Drop (>10%):</span>
              <span class="font-mono text-red-400">${((extremeDropWeeks / (totalWeeks - totalPaths)) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div class="mt-3 p-2 bg-gray-800 rounded text-xs">
          <p class="text-gray-400">
            <span class="font-semibold">Historical benchmarks:</span> Bull years ~55%, Sideways ~25%, Bear ~20%.
            VIX > 30 happens ~15% of time. Large drops (>5%) happen ~10% of weeks.
          </p>
        </div>
      </div>
    `;
  }

  private renderHistogram(): void {
    const canvas = this.container.querySelector('#histogram-chart') as HTMLCanvasElement;
    if (!canvas) return;

    // Aggregate all final values from surviving paths with metadata
    const pathData: Array<{ value: number; result: any; path: any }> = [];
    this.results.forEach((r) => {
      r.allPathResults.filter((p) => !p.blownUp).forEach((p) => {
        // Defensive: skip paths with invalid final values
        if (typeof p.finalValue === 'number' && !isNaN(p.finalValue) && isFinite(p.finalValue)) {
          pathData.push({ value: p.finalValue, result: r, path: p });
        } else {
          console.warn('Skipping path with invalid finalValue:', p.finalValue, p);
        }
      });
    });

    if (pathData.length === 0) {
      console.error('No valid path data for histogram');
      return;
    }

    const allValues = pathData.map((p) => p.value);

    // Create bins
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const numBins = 20;
    const range = max - min;

    // Handle edge case where all values are the same
    if (range === 0 || !isFinite(range)) {
      console.warn('Invalid range for histogram:', { min, max, range });
      return;
    }

    const binSize = range / numBins;
    const bins = Array(numBins).fill(0);

    // Map paths to bins
    const pathsByBin: Array<Array<{ result: any; path: any }>> = Array(numBins)
      .fill(null)
      .map(() => []);

    pathData.forEach((item) => {
      const binIndex = Math.min(Math.floor((item.value - min) / binSize), numBins - 1);
      // Defensive: ensure binIndex is valid
      if (binIndex >= 0 && binIndex < numBins && pathsByBin[binIndex]) {
        bins[binIndex]++;
        pathsByBin[binIndex].push({ result: item.result, path: item.path });
      } else {
        console.warn('Invalid binIndex:', binIndex, 'for value:', item.value, 'min:', min, 'max:', max);
      }
    });

    const labels = bins.map((_, i) => {
      const binStart = min + i * binSize;
      return '$' + Math.round(binStart / 1000) + 'k';
    });

    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Frequency',
            data: bins,
            backgroundColor: '#00ff4180',
            borderColor: '#00ff41',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#374151' },
          },
          x: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#374151' },
          },
        },
        plugins: {
          legend: { labels: { color: '#00ff41' } },
          tooltip: {
            callbacks: {
              afterLabel: () => 'Click to inspect path details',
            },
          },
        },
        onClick: (_event, activeElements) => {
          if (activeElements.length > 0) {
            const binIndex = activeElements[0].index;
            const pathsInBin = pathsByBin[binIndex];
            if (pathsInBin.length > 0) {
              // Show the first path in this bin
              const { result, path } = pathsInBin[0];
              const pathIndex = result.allPathResults.indexOf(path);
              this.pathInspector.show(path, pathIndex, result.strategy, result.ruleSetName);
            }
          }
        },
      },
    });

    this.charts.push(chart);
  }

  private renderSurvivalCurve(): void {
    const canvas = this.container.querySelector('#survival-chart') as HTMLCanvasElement;
    if (!canvas) return;

    // Calculate survival rate at each week
    const weeks = this.results[0]?.allPathResults[0]?.weeklyHistory.length || 52;
    const survivalData = [];

    for (let week = 0; week <= weeks; week++) {
      const totalPaths = this.results[0]?.numPaths || 0;
      let survivingPaths = 0;

      this.results[0]?.allPathResults.forEach((path) => {
        if (!path.blownUp || (path.blowupWeek && path.blowupWeek > week)) {
          survivingPaths++;
        }
      });

      survivalData.push((survivingPaths / totalPaths) * 100);
    }

    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: Array.from({ length: weeks + 1 }, (_, i) => i),
        datasets: [
          {
            label: 'Survival Rate (%)',
            data: survivalData,
            borderColor: '#00ff41',
            backgroundColor: '#00ff4140',
            fill: true,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { color: '#9ca3af' },
            grid: { color: '#374151' },
          },
          x: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#374151' },
          },
        },
        plugins: {
          legend: { labels: { color: '#00ff41' } },
        },
      },
    });

    this.charts.push(chart);
  }

  private exportCSV(): void {
    const csv = exportToCSV(this.results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monte-carlo-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  destroy(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.pathInspector.destroy();
  }
}
