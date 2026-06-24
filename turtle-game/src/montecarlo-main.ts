import './style.css';
import { MonteCarloScreen } from './components/MonteCarlo/MonteCarloScreen';

// Initialize the Monte Carlo simulator
const app = document.querySelector<HTMLDivElement>('#app')!;

// Create and mount the Monte Carlo screen
const monteCarloScreen = new MonteCarloScreen(app);

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
  monteCarloScreen.destroy();
});
