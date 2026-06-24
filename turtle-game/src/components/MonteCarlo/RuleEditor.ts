// Rule Editor Component
// Select and configure strike selection rule sets

import type { RuleSet } from '../../lib/montecarlo/types';
import { PRESET_RULE_SETS } from '../../lib/montecarlo/presetRules';

export interface RuleEditorState {
  selectedRuleSet: RuleSet;
  compareMode: boolean;
  comparisonRuleSets: RuleSet[];
}

export class RuleEditor {
  private container: HTMLElement;
  private state: RuleEditorState;

  constructor(container: HTMLElement) {
    this.container = container;
    this.state = {
      selectedRuleSet: PRESET_RULE_SETS.conservative,
      compareMode: false,
      comparisonRuleSets: [],
    };
    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="card p-6">
        <h2 class="text-xl font-bold text-matrix-green mb-4">Strike Selection Rules</h2>

        <!-- Rule Set Selector -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Rule Set
          </label>
          <select
            id="rule-set-select"
            class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
          >
            <option value="conservative">Conservative</option>
            <option value="recoveryFocused">Recovery Focused</option>
            <option value="aggressive">Aggressive Premium</option>
            <option value="passive">Passive/Fixed</option>
            <option value="trendFollowing">Trend Following</option>
          </select>
        </div>

        <!-- Rule Set Description -->
        <div id="rule-description" class="p-4 bg-gray-800 rounded mb-4 text-sm text-gray-300">
          ${this.state.selectedRuleSet.description}
        </div>

        <!-- Rules Display -->
        <div id="rules-display" class="space-y-2 mb-4">
          ${this.renderRules(this.state.selectedRuleSet)}
        </div>

        <!-- Compare Mode -->
        <div class="mt-6 pt-4 border-t border-gray-700">
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              id="compare-mode"
              class="form-checkbox h-5 w-5 text-matrix-green"
            />
            <span class="text-gray-300">Compare Multiple Rule Sets</span>
          </label>

          <div id="comparison-selector" class="mt-4 space-y-2 hidden">
            <p class="text-sm text-gray-400 mb-2">Select up to 4 rule sets to compare:</p>
            ${this.renderComparisonCheckboxes()}
          </div>
        </div>
      </div>
    `;
  }

  private renderRules(ruleSet: RuleSet): string {
    return ruleSet.rules
      .sort((a, b) => b.priority - a.priority)
      .map(
        (rule, index) => `
        <div class="p-3 bg-gray-900 rounded border border-gray-700">
          <div class="flex justify-between items-start mb-1">
            <span class="text-xs text-gray-500">Priority ${rule.priority}</span>
            <span class="text-xs px-2 py-1 bg-matrix-green/20 text-matrix-green rounded">
              Rule ${index + 1}
            </span>
          </div>
          <p class="text-sm text-gray-300">
            ${rule.description || 'No description'}
          </p>
        </div>
      `
      )
      .join('');
  }

  private renderComparisonCheckboxes(): string {
    return Object.entries(PRESET_RULE_SETS)
      .map(
        ([key, ruleSet]) => `
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            class="comparison-checkbox form-checkbox h-4 w-4 text-matrix-green"
            data-ruleset="${key}"
          />
          <span class="text-gray-300">${ruleSet.name}</span>
        </label>
      `
      )
      .join('');
  }

  private attachEventListeners(): void {
    // Rule set selection
    const select = this.container.querySelector('#rule-set-select') as HTMLSelectElement;
    select?.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      this.state.selectedRuleSet = PRESET_RULE_SETS[value as keyof typeof PRESET_RULE_SETS];
      this.updateDisplay();
    });

    // Compare mode toggle
    const compareCheckbox = this.container.querySelector('#compare-mode') as HTMLInputElement;
    compareCheckbox?.addEventListener('change', (e) => {
      this.state.compareMode = (e.target as HTMLInputElement).checked;
      const selector = this.container.querySelector('#comparison-selector');
      if (selector) {
        selector.classList.toggle('hidden', !this.state.compareMode);
      }
    });
  }

  private updateDisplay(): void {
    const descriptionEl = this.container.querySelector('#rule-description');
    if (descriptionEl) {
      descriptionEl.textContent = this.state.selectedRuleSet.description;
    }

    const rulesEl = this.container.querySelector('#rules-display');
    if (rulesEl) {
      rulesEl.innerHTML = this.renderRules(this.state.selectedRuleSet);
    }
  }

  getSelectedRuleSets(): RuleSet[] {
    if (this.state.compareMode) {
      const checked = this.container.querySelectorAll('.comparison-checkbox:checked');
      return Array.from(checked).map((checkbox) => {
        const key = (checkbox as HTMLInputElement).dataset.ruleset!;
        return PRESET_RULE_SETS[key as keyof typeof PRESET_RULE_SETS];
      });
    }

    return [this.state.selectedRuleSet];
  }

  destroy(): void {
    // Cleanup if needed
  }
}
