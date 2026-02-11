// Account Header Component
// Displays account value, P&L, and capital deployment

import type { GameState } from '../../lib/game/stateManager';
import { calculatePnLSummary, calculateCapitalDeployment, checkCapitalLimits, formatCurrency, formatPercent, getPnLColorClass } from '../../lib/game/pnlCalculator';

interface AccountHeaderProps {
  state: GameState;
}

export class AccountHeader {
  private container: HTMLElement;
  private props: AccountHeaderProps;
  
  constructor(container: HTMLElement, props: AccountHeaderProps) {
    this.container = container;
    this.props = props;
    this.render();
  }
  
  update(props: AccountHeaderProps): void {
    this.props = props;
    this.render();
  }
  
  private render(): void {
    const { state } = this.props;
    const pnl = calculatePnLSummary(state);
    const capitalDeployed = calculateCapitalDeployment(state);
    const capitalStatus = checkCapitalLimits(capitalDeployed, state.market.vix);
    
    this.container.innerHTML = `
      <div class="card mb-4">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- Logo/Title -->
          <div class="flex items-center gap-3">
            <div class="text-3xl">🐢</div>
            <div>
              <h1 class="text-xl font-bold text-matrix-green">Turtle Trading Game</h1>
              <p class="text-xs text-gray-500">Poor Man's Covered Call Simulator</p>
            </div>
          </div>
          
          <!-- Account Value -->
          <div class="text-center">
            <div class="text-sm text-gray-400">Net Account Value</div>
            <div class="text-2xl font-bold font-mono">${formatCurrency(pnl.totalAccountValue)}</div>
          </div>
          
          <!-- Total P&L -->
          <div class="text-center">
            <div class="text-sm text-gray-400">Total P&L</div>
            <div class="text-2xl font-bold font-mono ${getPnLColorClass(pnl.totalPnL)}">
              ${pnl.totalPnL >= 0 ? '+' : ''}${formatCurrency(pnl.totalPnL)}
              <span class="text-sm">(${formatPercent(pnl.totalPnLPercent)})</span>
            </div>
          </div>
          
          <!-- Weekly P&L -->
          <div class="text-center">
            <div class="text-sm text-gray-400">Weekly P&L</div>
            <div class="text-xl font-bold font-mono ${getPnLColorClass(pnl.weeklyPnL)}">
              ${pnl.weeklyPnL >= 0 ? '+' : ''}${formatCurrency(pnl.weeklyPnL)}
            </div>
          </div>
          
          <!-- Capital Deployment -->
          <div class="text-center">
            <div class="text-sm text-gray-400">Capital Deployed</div>
            <div class="text-xl font-bold font-mono ${capitalStatus.isSafe ? 'text-blue-400' : 'text-red-400 animate-pulse'}">
              ${capitalDeployed.toFixed(1)}%
            </div>
            ${capitalStatus.warning ? `
              <div class="text-xs text-red-400 font-bold">${capitalStatus.warning}</div>
            ` : `
              <div class="text-xs text-gray-500">Max: ${capitalStatus.maxAllowed}%</div>
            `}
          </div>
        </div>
        
        <!-- Portfolio Greeks -->
        <div class="mt-4 pt-4 border-t border-gray-700 grid grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-xs text-gray-500">Portfolio Delta</div>
            <div class="text-lg font-mono ${pnl.portfolioDelta > 0 ? 'text-green-400' : 'text-red-400'}">
              ${pnl.portfolioDelta > 0 ? '+' : ''}${pnl.portfolioDelta.toFixed(0)}
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Portfolio Theta</div>
            <div class="text-lg font-mono ${pnl.portfolioTheta > 0 ? 'text-green-400' : 'text-red-400'}">
              ${pnl.portfolioTheta > 0 ? '+' : ''}${formatCurrency(pnl.portfolioTheta)}/day
            </div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Cash Available</div>
            <div class="text-lg font-mono text-blue-400">${formatCurrency(state.cash)}</div>
          </div>
          <div>
            <div class="text-xs text-gray-500">Realized P&L</div>
            <div class="text-lg font-mono ${getPnLColorClass(state.realizedPnL)}">
              ${state.realizedPnL >= 0 ? '+' : ''}${formatCurrency(state.realizedPnL)}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
