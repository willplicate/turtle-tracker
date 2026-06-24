import './style.css';
import { TutorialManager } from './components/Tutorial/TutorialManager';

// Initialize the tutorial
const app = document.querySelector<HTMLDivElement>('#app')!;

// Create and mount the tutorial manager
const tutorial = new TutorialManager(app, () => {
  // On exit, show completion message
  app.innerHTML = `
    <div class="min-h-screen bg-game-bg flex items-center justify-center p-8">
      <div class="text-center">
        <div class="text-8xl mb-6">👋</div>
        <h1 class="text-4xl font-bold mb-4">Thanks for completing the tutorial!</h1>
        <p class="text-xl text-gray-400 mb-8">
          In a real application, this would return you to the main game.
        </p>
        <button
          onclick="window.location.reload()"
          class="btn btn-primary text-xl py-4 px-8"
        >
          Restart Tutorial
        </button>
      </div>
    </div>
  `;
});

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
  tutorial.destroy();
});
