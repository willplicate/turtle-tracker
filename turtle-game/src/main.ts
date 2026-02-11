import './style.css';
import { GameScreen } from './components/GameScreen';

// Initialize the game
const app = document.querySelector<HTMLDivElement>('#app')!;

// Create and mount the main game screen
const game = new GameScreen(app);

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
  game.destroy();
});
