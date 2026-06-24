// Tutorial Manager
// Orchestrates navigation between tutorial screens

import { Tutorial1Screen1 } from './Tutorial1Screen1';
import { Tutorial1Screen2 } from './Tutorial1Screen2';
import { Tutorial1Screen3 } from './Tutorial1Screen3';
import { Tutorial1Screen4 } from './Tutorial1Screen4';

type TutorialScreen = 1 | 2 | 3 | 4;

export class TutorialManager {
  private container: HTMLElement;
  private onExit: () => void;

  constructor(container: HTMLElement, onExit: () => void) {
    this.container = container;
    this.onExit = onExit;
    this.loadScreen(1);
  }

  private loadScreen(screen: TutorialScreen): void {
    // Clear container
    this.container.innerHTML = '';

    // Load appropriate screen
    switch (screen) {
      case 1:
        new Tutorial1Screen1(
          this.container,
          () => this.loadScreen(2),
          () => this.onExit()
        );
        break;
      case 2:
        new Tutorial1Screen2(
          this.container,
          () => this.loadScreen(3),
          () => this.loadScreen(1)
        );
        break;
      case 3:
        new Tutorial1Screen3(
          this.container,
          () => this.loadScreen(4),
          () => this.loadScreen(2)
        );
        break;
      case 4:
        new Tutorial1Screen4(
          this.container,
          () => this.completeTutorial(),
          () => this.loadScreen(3)
        );
        break;
    }
  }

  private completeTutorial(): void {
    // Show completion message
    this.container.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="text-center">
          <div class="text-8xl mb-8">🎓</div>
          <h1 class="text-5xl font-bold mb-4">Tutorial Complete!</h1>
          <h2 class="text-3xl text-matrix-green mb-8">You understand Shares vs LEAPS</h2>

          <div class="card mb-8">
            <div class="bg-blue-900/30 border border-blue-500 p-6 rounded mb-6">
              <p class="text-xl mb-4">
                <strong>What you learned:</strong>
              </p>
              <div class="text-left text-lg space-y-3">
                <div class="flex items-start gap-3">
                  <span class="text-matrix-green">✓</span>
                  <span>Shares give you direct exposure to stock price movements</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-matrix-green">✓</span>
                  <span>LEAPS give you the same exposure with 75% less capital</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-matrix-green">✓</span>
                  <span>Theta decay is the cost you pay for leverage</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-matrix-green">✓</span>
                  <span>Longer DTE = lower daily theta but higher upfront cost</span>
                </div>
                <div class="flex items-start gap-3">
                  <span class="text-matrix-green">✓</span>
                  <span>The Turtle Strategy uses 120+ DTE to minimize daily bleed</span>
                </div>
              </div>
            </div>

            <div class="bg-matrix-green text-black p-6 rounded text-center mb-6">
              <p class="text-2xl font-bold">
                Next: Learn how to sell covered calls against your LEAPS to generate income!
              </p>
            </div>
          </div>

          <button id="exit-btn" class="btn btn-primary text-xl py-4 px-12">
            Return to Game
          </button>
        </div>
      </div>
    `;

    const exitBtn = this.container.querySelector('#exit-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.onExit());
    }
  }

  destroy(): void {
    this.container.innerHTML = '';
  }
}
