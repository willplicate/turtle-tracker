// Path Inspector Component
// Modal that displays week-by-week details for a selected simulation path

import type { PathResult } from '../../lib/montecarlo/types';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export class PathInspector {
  private modal: HTMLElement;
  private chart: Chart | null = null;

  constructor() {
    this.modal = this.createModal();
    document.body.appendChild(this.modal);
  }

  private createModal(): HTMLElement {
    const modal = document.createElement('div');
    modal.id = 'path-inspector-modal';
    modal.className = 'hidden fixed inset-0 bg-black bg-opacity-75 z-50 overflow-y-auto';
    modal.innerHTML = `
      <div class="min-h-screen px-4 py-8">
        <div class="max-w-7xl mx-auto bg-gray-900 rounded-lg shadow-xl">
          <!-- Header -->
          <div class="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 class="text-2xl font-bold text-matrix-green">📊 Path Inspector</h2>
            <div class="flex gap-3 items-center">
              <button id="export-csv" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition">
                📥 Export CSV
              </button>
              <button id="close-inspector" class="text-gray-400 hover:text-white text-3xl leading-none">
                &times;
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="p-6 space-y-6">
            <!-- Summary Stats -->
            <div id="path-summary" class="grid grid-cols-2 md:grid-cols-4 gap-4"></div>

            <!-- Account Value Chart -->
            <div class="card p-4">
              <h3 class="text-lg font-semibold text-gray-300 mb-3">Account Value Over Time</h3>
              <div class="h-64 relative">
                <canvas id="path-chart"></canvas>
              </div>
            </div>

            <!-- Week-by-Week Table -->
            <div class="card p-4">
              <h3 class="text-lg font-semibold text-gray-300 mb-3">Week-by-Week Breakdown</h3>
              <div class="overflow-x-auto max-h-96 overflow-y-auto">
                <table id="path-table" class="w-full text-xs">
                  <thead class="sticky top-0 bg-gray-800">
                    <tr>
                      <th class="px-2 py-2 text-left">Week</th>
                      <th class="px-2 py-2 text-right">SPY</th>
                      <th class="px-2 py-2 text-right">VIX</th>
                      <th class="px-2 py-2 text-right">Ret%</th>
                      <th class="px-2 py-2 text-right">LEAPS</th>
                      <th class="px-2 py-2 text-right" title="LEAPS Change from Previous Week">LΔ</th>
                      <th class="px-2 py-2 text-right" title="LEAPS Delta">δ</th>
                      <th class="px-2 py-2 text-right" title="Stock Impact (delta × price change)">Stock</th>
                      <th class="px-2 py-2 text-right" title="Theta Decay">Theta</th>
                      <th class="px-2 py-2 text-right" title="Roll Cost">Roll$</th>
                      <th class="px-2 py-2 text-right" title="Strike Price of Short Call">Strike</th>
                      <th class="px-2 py-2 text-right" title="Premium Collected">Prem</th>
                      <th class="px-2 py-2 text-right" title="Current Call Value">CallVal</th>
                      <th class="px-2 py-2 text-right" title="Call P&L">CallP&L</th>
                      <th class="px-2 py-2 text-right" title="Weekly P&L">Wk P&L</th>
                      <th class="px-2 py-2 text-right" title="Cash Balance">Cash</th>
                      <th class="px-2 py-2 text-right">Acct</th>
                      <th class="px-2 py-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody id="path-table-body" class="divide-y divide-gray-700"></tbody>
                  <tfoot id="path-table-footer" class="bg-gray-800 font-bold border-t-2 border-gray-600"></tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach close handler
    const closeBtn = modal.querySelector('#close-inspector');
    closeBtn?.addEventListener('click', () => this.close());

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    return modal;
  }

  private currentPath: PathResult | null = null;
  private currentPathIndex: number = 0;
  private currentStrategy: string = '';
  private currentRuleSet: string = '';

  show(path: PathResult, pathIndex: number, strategy: string, ruleSet: string): void {
    // Store current path data
    this.currentPath = path;
    this.currentPathIndex = pathIndex;
    this.currentStrategy = strategy;
    this.currentRuleSet = ruleSet;

    // Show modal
    this.modal.classList.remove('hidden');

    // Attach CSV export handler
    const exportBtn = this.modal.querySelector('#export-csv');
    exportBtn?.replaceWith(exportBtn.cloneNode(true)); // Remove old listeners
    const newExportBtn = this.modal.querySelector('#export-csv');
    newExportBtn?.addEventListener('click', () => this.exportToCSV());

    // Render summary
    this.renderSummary(path, pathIndex, strategy, ruleSet);

    // Render chart
    this.renderChart(path);

    // Render table
    this.renderTable(path);
  }

  close(): void {
    this.modal.classList.add('hidden');
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private renderSummary(path: PathResult, pathIndex: number, strategy: string, ruleSet: string): void {
    const summaryEl = this.modal.querySelector('#path-summary');
    if (!summaryEl) return;

    const returnClass = path.totalReturn >= 0 ? 'text-green-400' : 'text-red-400';
    const statusClass = path.blownUp ? 'text-red-400' : 'text-green-400';

    // Calculate summary metrics
    const firstWeek = path.weeklyHistory[0];
    const lastWeek = path.weeklyHistory[path.weeklyHistory.length - 1];
    const spyReturn = ((lastWeek.price - firstWeek.price) / firstWeek.price) * 100;
    const spyReturnClass = spyReturn >= 0 ? 'text-green-400' : 'text-red-400';

    // Calculate total premium collected
    const totalPremiumCollected = path.weeklyHistory.reduce((sum, week) => {
      return sum + (week.expiredCallPremium || 0);
    }, 0);

    // Calculate total call P&L (premium - assignment costs)
    const totalCallPnL = path.weeklyHistory.reduce((sum, week) => {
      if (week.expiredCallPremium !== undefined && week.expiredCallFinalValue !== undefined) {
        return sum + (week.expiredCallPremium - week.expiredCallFinalValue);
      }
      return sum;
    }, 0);
    const callPnLClass = totalCallPnL >= 0 ? 'text-green-400' : 'text-red-400';

    summaryEl.innerHTML = `
      <div class="bg-gray-800 rounded p-3">
        <div class="text-xs text-gray-400">Path</div>
        <div class="text-lg font-bold text-matrix-green">#${pathIndex + 1}</div>
      </div>
      <div class="bg-gray-800 rounded p-3">
        <div class="text-xs text-gray-400">Strategy</div>
        <div class="text-lg font-bold text-blue-400">${strategy.toUpperCase()}</div>
        <div class="text-xs text-gray-400">${ruleSet}</div>
      </div>
      <div class="bg-gray-800 rounded p-3">
        <div class="text-xs text-gray-400">Account Return</div>
        <div class="text-lg font-bold ${returnClass}">${path.totalReturn >= 0 ? '+' : ''}${path.totalReturn.toFixed(1)}%</div>
        <div class="text-xs text-gray-400">Final: $${path.finalValue.toLocaleString()}</div>
      </div>
      <div class="bg-gray-800 rounded p-3">
        <div class="text-xs text-gray-400">SPY Return</div>
        <div class="text-lg font-bold ${spyReturnClass}">${spyReturn >= 0 ? '+' : ''}${spyReturn.toFixed(1)}%</div>
        <div class="text-xs ${returnClass}">Alpha: ${(path.totalReturn - spyReturn).toFixed(1)}%</div>
      </div>
      <div class="bg-gray-800 rounded p-3">
        <div class="text-xs text-gray-400">Premium Collected</div>
        <div class="text-lg font-bold text-blue-400">$${totalPremiumCollected.toLocaleString()}</div>
        <div class="text-xs text-gray-400">52 weeks</div>
      </div>
      <div class="bg-gray-800 rounded p-3">
        <div class="text-xs text-gray-400">Call P&L</div>
        <div class="text-lg font-bold ${callPnLClass}">${totalCallPnL >= 0 ? '+' : ''}$${totalCallPnL.toLocaleString()}</div>
        <div class="text-xs text-gray-400">Net after assignments</div>
      </div>
      <div class="bg-gray-800 rounded p-3">
        <div class="text-xs text-gray-400">Status</div>
        <div class="text-lg font-bold ${statusClass}">${path.blownUp ? 'Blown Up' : 'Survived'}</div>
        ${path.blownUp ? `<div class="text-xs text-red-400">Week ${path.blowupWeek}</div>` : `<div class="text-xs text-gray-400">Max DD: ${path.maxDrawdown.toFixed(1)}%</div>`}
      </div>
    `;
  }

  private renderChart(path: PathResult): void {
    const canvas = this.modal.querySelector('#path-chart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy previous chart
    if (this.chart) {
      this.chart.destroy();
    }

    const weeks = path.weeklyHistory.map((w) => w.week);
    const accountValues = path.weeklyHistory.map((w) => w.accountValue);
    const spyPrices = path.weeklyHistory.map((w) => w.price);

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: weeks,
        datasets: [
          {
            label: 'Account Value',
            data: accountValues,
            borderColor: '#00ff41',
            backgroundColor: '#00ff4120',
            fill: true,
            tension: 0.1,
            yAxisID: 'y',
          },
          {
            label: 'SPY Price',
            data: spyPrices,
            borderColor: '#3b82f6',
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.1,
            yAxisID: 'y1',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {
              color: '#00ff41',
              callback: (value) => '$' + (Number(value) / 1000).toFixed(0) + 'k',
            },
            grid: { color: '#374151' },
            title: {
              display: true,
              text: 'Account Value',
              color: '#00ff41',
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            ticks: {
              color: '#3b82f6',
              callback: (value) => '$' + Number(value).toFixed(0),
            },
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: 'SPY Price',
              color: '#3b82f6',
            },
          },
          x: {
            ticks: { color: '#9ca3af' },
            grid: { color: '#374151' },
            title: {
              display: true,
              text: 'Week',
              color: '#9ca3af',
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: '#9ca3af',
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  if (context.datasetIndex === 0) {
                    // Account value
                    label += '$' + context.parsed.y.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    });
                  } else {
                    // SPY price
                    label += '$' + context.parsed.y.toFixed(2);
                  }
                }
                return label;
              }
            }
          }
        },
      },
    });
  }

  private renderTable(path: PathResult): void {
    const tbody = this.modal.querySelector('#path-table-body');
    if (!tbody) return;

    let rows = '';
    let prevLeapsValue = 0;

    path.weeklyHistory.forEach((week, idx) => {
      const returnClass = week.weeklyReturn >= 0 ? 'text-green-400' : 'text-red-400';
      const pnlClass = week.weeklyPnL >= 0 ? 'text-green-400' : 'text-red-400';

      // Calculate deltas (change from previous week)
      const leapsDelta = idx > 0 ? week.leapsValue - prevLeapsValue : 0;

      // Calculate short call P&L
      // Priority: Show expired call P&L (realized) if available, otherwise show open call P&L (unrealized)
      let callPnL = 0;
      if (week.expiredCallPremium !== undefined && week.expiredCallFinalValue !== undefined) {
        // Call expired this week - show realized P&L
        callPnL = week.expiredCallPremium - week.expiredCallFinalValue;
      } else if (week.shortCallPremium > 0) {
        // Call still open - show unrealized P&L
        callPnL = week.shortCallPremium - week.shortCallValue;
      }

      const leapsDeltaClass = leapsDelta >= 0 ? 'text-green-400' : 'text-red-400';
      const callPnLClass = callPnL >= 0 ? 'text-green-400' : 'text-red-400';

      // LEAPS P&L component colors
      const stockImpact = week.leapsStockImpact ?? 0;
      const thetaDecay = week.leapsThetaDecay ?? 0;
      const rollCost = week.rollCost ?? 0;

      const stockImpactClass = stockImpact >= 0 ? 'text-green-400' : 'text-red-400';
      const thetaDecayClass = 'text-red-400'; // Theta is always negative
      const rollCostClass = rollCost >= 0 ? 'text-green-400' : 'text-red-400';

      // Format cash with color coding (red if low)
      const cashClass = week.cash < 5000 ? 'text-red-400' : week.cash < 10000 ? 'text-yellow-400' : 'text-gray-300';

      rows += `
        <tr class="hover:bg-gray-800">
          <td class="px-2 py-2 text-gray-300">${week.week}</td>
          <td class="px-2 py-2 text-right text-gray-300">$${week.price.toFixed(2)}</td>
          <td class="px-2 py-2 text-right text-gray-300">${week.vix.toFixed(1)}</td>
          <td class="px-2 py-2 text-right ${returnClass}">${week.weeklyReturn >= 0 ? '+' : ''}${week.weeklyReturn.toFixed(2)}%</td>
          <td class="px-2 py-2 text-right text-gray-300">$${week.leapsValue.toLocaleString()}</td>
          <td class="px-2 py-2 text-right ${leapsDeltaClass}">${idx > 0 ? (leapsDelta >= 0 ? '+' : '') + '$' + leapsDelta.toFixed(0) : '-'}</td>
          <td class="px-2 py-2 text-right text-blue-300">${week.leapsDelta.toFixed(2)}</td>
          <td class="px-2 py-2 text-right ${stockImpactClass}">${stockImpact !== 0 ? (stockImpact >= 0 ? '+' : '') + '$' + stockImpact.toFixed(0) : '-'}</td>
          <td class="px-2 py-2 text-right ${thetaDecayClass}">${thetaDecay !== 0 ? '$' + thetaDecay.toFixed(0) : '-'}</td>
          <td class="px-2 py-2 text-right ${rollCostClass}">${rollCost !== 0 ? (rollCost >= 0 ? '+' : '') + '$' + rollCost.toFixed(0) : '-'}</td>
          <td class="px-2 py-2 text-right text-blue-300">${week.shortCallStrike ? '$' + week.shortCallStrike : '-'}</td>
          <td class="px-2 py-2 text-right text-gray-300">${week.shortCallPremium > 0 ? '+$' + week.shortCallPremium.toFixed(0) : '-'}</td>
          <td class="px-2 py-2 text-right text-gray-300">${week.shortCallValue > 0 ? '-$' + week.shortCallValue.toFixed(0) : '-'}</td>
          <td class="px-2 py-2 text-right ${callPnLClass}">${week.shortCallPremium > 0 ? (callPnL >= 0 ? '+' : '') + '$' + callPnL.toFixed(0) : '-'}</td>
          <td class="px-2 py-2 text-right ${pnlClass}">${week.weeklyPnL >= 0 ? '+' : ''}$${week.weeklyPnL.toFixed(0)}</td>
          <td class="px-2 py-2 text-right ${cashClass}">$${week.cash.toLocaleString()}</td>
          <td class="px-2 py-2 text-right text-gray-300">$${week.accountValue.toLocaleString()}</td>
          <td class="px-2 py-2 text-gray-400 text-xs">${week.action || '-'}</td>
        </tr>
      `;

      prevLeapsValue = week.leapsValue;
    });

    tbody.innerHTML = rows;

    // Render footer with totals
    this.renderTableFooter(path);
  }

  private renderTableFooter(path: PathResult): void {
    const tfoot = this.modal.querySelector('#path-table-footer');
    if (!tfoot) return;

    // Calculate totals
    const totalPremiumCollected = path.weeklyHistory.reduce((sum, week) => {
      return sum + (week.expiredCallPremium || 0);
    }, 0);

    const totalAssignmentCosts = path.weeklyHistory.reduce((sum, week) => {
      return sum + (week.expiredCallFinalValue || 0);
    }, 0);

    const totalCallPnL = totalPremiumCollected - totalAssignmentCosts;
    const callPnLClass = totalCallPnL >= 0 ? 'text-green-400' : 'text-red-400';

    const totalStockImpact = path.weeklyHistory.reduce((sum, week) => {
      return sum + (week.leapsStockImpact || 0);
    }, 0);
    const stockImpactClass = totalStockImpact >= 0 ? 'text-green-400' : 'text-red-400';

    const totalThetaDecay = path.weeklyHistory.reduce((sum, week) => {
      return sum + (week.leapsThetaDecay || 0);
    }, 0);

    const totalRollCost = path.weeklyHistory.reduce((sum, week) => {
      return sum + (week.rollCost || 0);
    }, 0);
    const rollCostClass = totalRollCost >= 0 ? 'text-green-400' : 'text-red-400';

    const firstWeek = path.weeklyHistory[0];
    const lastWeek = path.weeklyHistory[path.weeklyHistory.length - 1];
    const spyReturn = ((lastWeek.price - firstWeek.price) / firstWeek.price) * 100;
    const spyReturnClass = spyReturn >= 0 ? 'text-green-400' : 'text-red-400';

    tfoot.innerHTML = `
      <tr>
        <td class="px-2 py-2 text-gray-300" colspan="3">TOTALS</td>
        <td class="px-2 py-2 text-right ${spyReturnClass}" title="SPY Total Return">${spyReturn >= 0 ? '+' : ''}${spyReturn.toFixed(1)}%</td>
        <td class="px-2 py-2" colspan="3"></td>
        <td class="px-2 py-2 text-right ${stockImpactClass}" title="Total LEAPS Stock Impact">${totalStockImpact >= 0 ? '+' : ''}$${totalStockImpact.toFixed(0)}</td>
        <td class="px-2 py-2 text-right text-red-400" title="Total Theta Decay">$${totalThetaDecay.toFixed(0)}</td>
        <td class="px-2 py-2 text-right ${rollCostClass}" title="Total Roll Costs">${totalRollCost >= 0 ? '+' : ''}$${totalRollCost.toFixed(0)}</td>
        <td class="px-2 py-2"></td>
        <td class="px-2 py-2 text-right text-blue-400" title="Total Premium Collected">+$${totalPremiumCollected.toFixed(0)}</td>
        <td class="px-2 py-2"></td>
        <td class="px-2 py-2 text-right ${callPnLClass}" title="Total Call P&L">${totalCallPnL >= 0 ? '+' : ''}$${totalCallPnL.toFixed(0)}</td>
        <td class="px-2 py-2" colspan="4"></td>
      </tr>
    `;
  }

  private exportToCSV(): void {
    if (!this.currentPath) return;

    // Create CSV header
    const headers = [
      'Week',
      'SPY Price',
      'VIX',
      'Weekly Return %',
      'LEAPS Value',
      'LEAPS Change',
      'LEAPS Delta',
      'LEAPS Intrinsic',
      'LEAPS Extrinsic',
      'LEAPS Stock Impact',
      'LEAPS Theta Decay',
      'Roll Cost',
      'Call Strike',
      'Call Premium (Open)',
      'Call Value (Open)',
      'Expired Call Premium',
      'Expired Call Final Value',
      'Call P&L',
      'Weekly P&L',
      'Cash',
      'Account Value',
      'Regime',
      'Action'
    ];

    // Create CSV rows
    let prevLeapsValue = 0;

    const rows = this.currentPath.weeklyHistory.map((week, idx) => {
      const leapsChange = idx > 0 ? week.leapsValue - prevLeapsValue : 0;

      // Calculate call P&L (same logic as table rendering)
      let callPnL = 0;
      if (week.expiredCallPremium !== undefined && week.expiredCallFinalValue !== undefined) {
        callPnL = week.expiredCallPremium - week.expiredCallFinalValue;
      } else if (week.shortCallPremium > 0) {
        callPnL = week.shortCallPremium - week.shortCallValue;
      }

      const row = [
        week.week,
        week.price.toFixed(2),
        week.vix.toFixed(1),
        week.weeklyReturn.toFixed(2),
        week.leapsValue.toFixed(2),
        idx > 0 ? leapsChange.toFixed(2) : '',
        week.leapsDelta.toFixed(4),
        week.leapsIntrinsic.toFixed(2),
        week.leapsExtrinsic.toFixed(2),
        week.leapsStockImpact !== undefined ? week.leapsStockImpact.toFixed(2) : '',
        week.leapsThetaDecay !== undefined ? week.leapsThetaDecay.toFixed(2) : '',
        week.rollCost !== undefined ? week.rollCost.toFixed(2) : '',
        week.shortCallStrike !== undefined ? week.shortCallStrike.toString() : '',
        week.shortCallPremium > 0 ? week.shortCallPremium.toFixed(2) : '',
        week.shortCallValue > 0 ? week.shortCallValue.toFixed(2) : '',
        week.expiredCallPremium !== undefined ? week.expiredCallPremium.toFixed(2) : '',
        week.expiredCallFinalValue !== undefined ? week.expiredCallFinalValue.toFixed(2) : '',
        callPnL !== 0 ? callPnL.toFixed(2) : '',
        week.weeklyPnL.toFixed(2),
        week.cash.toFixed(2),
        week.accountValue.toFixed(2),
        week.regime,
        week.action || ''
      ];

      prevLeapsValue = week.leapsValue;

      return row.join(',');
    });

    // Combine headers and rows
    const csv = [headers.join(','), ...rows].join('\n');

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `montecarlo_path_${this.currentPathIndex}_${this.currentStrategy}_${this.currentRuleSet}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  destroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
    this.modal.remove();
  }
}
