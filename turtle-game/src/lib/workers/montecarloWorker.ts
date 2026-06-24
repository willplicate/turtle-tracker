// Monte Carlo Web Worker
// Runs simulations in background thread to keep UI responsive

import type { SimulationRequest, SimulationResults } from '../montecarlo/types';
import { SeededRNG } from '../montecarlo/randomGenerators';
import { runSinglePath } from '../montecarlo/simulationRunner';
import { aggregateResults } from '../montecarlo/resultsAnalyzer';

/**
 * Handle incoming messages from main thread
 */
self.onmessage = async (e: MessageEvent) => {
  const message = e.data as SimulationRequest;

  if (message.type === 'START_SIMULATION') {
    try {
      await runSimulation(message.payload);
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        payload: {
          message: 'Simulation failed',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
};

/**
 * Run Monte Carlo simulation
 * Executes all strategy × rule set combinations
 */
async function runSimulation(payload: SimulationRequest['payload']) {
  const { config, ruleSets, strategies } = payload;
  const startTime = Date.now();

  // Calculate total number of paths to run
  const totalCombinations = strategies.length * ruleSets.length;
  const pathsPerCombination = config.numPaths;
  const totalPaths = totalCombinations * pathsPerCombination;

  let pathsCompleted = 0;
  const allResults: SimulationResults[] = [];

  // Run simulation for each strategy × rule set combination
  for (const strategy of strategies) {
    for (const ruleSet of ruleSets) {
      // Initialize RNG for this combination
      // Use different seed offset for each combination to ensure different paths
      const combinationSeed = config.seed + pathsCompleted;
      const rng = new SeededRNG(combinationSeed);

      const pathResults = [];

      // Run N paths for this combination
      for (let pathId = 0; pathId < pathsPerCombination; pathId++) {
        const result = runSinglePath(config, ruleSet, strategy, rng, pathId);
        pathResults.push(result);
        pathsCompleted++;

        // Send progress update every 50 paths
        if (pathsCompleted % 50 === 0 || pathsCompleted === totalPaths) {
          const percentComplete = (pathsCompleted / totalPaths) * 100;
          const elapsed = Date.now() - startTime;
          const rate = pathsCompleted / elapsed; // paths per ms
          const remaining = totalPaths - pathsCompleted;
          const estimatedTimeRemaining = remaining / rate;

          self.postMessage({
            type: 'PROGRESS',
            payload: {
              pathsCompleted,
              totalPaths,
              percentComplete,
              estimatedTimeRemaining,
              currentStrategy: strategy,
              currentRuleSet: ruleSet.name,
            },
          });
        }

        // Yield to event loop every 100 paths to avoid blocking worker thread
        if (pathId % 100 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      // Aggregate results for this combination
      const aggregated = aggregateResults(pathResults, strategy, ruleSet.name);
      allResults.push(aggregated);
    }
  }

  // Send final results
  const totalDurationMs = Date.now() - startTime;

  self.postMessage({
    type: 'COMPLETE',
    payload: {
      results: allResults,
      totalDurationMs,
    },
  });
}
