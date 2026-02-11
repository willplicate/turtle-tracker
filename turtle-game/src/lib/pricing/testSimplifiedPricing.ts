/**
 * Test the simplified pricing model
 * Should match results from simplified_trading_simulator.py
 */

import {
  createLEAPSPosition,
  updateLEAPSDay,
  getLEAPSPnL,
  createShortCallPosition,
  updateShortCallDay,
  getShortCallPnL,
  getPortfolioValue,
  getWeeklyPnL,
  getTotalPnL,
  type Portfolio,
} from './simplifiedPricing';

function runTest() {
  console.log('='.repeat(80));
  console.log('SIMPLIFIED PRICING TEST - TypeScript');
  console.log('Should match Python simplified_trading_simulator.py results');
  console.log('='.repeat(80));
  console.log();

  // Initialize portfolio
  const startingCash = 20000;
  let portfolio: Portfolio = {
    cash: startingCash,
    leaps: null,
    shortCall: null,
    weekStartValue: startingCash,
    totalStartValue: startingCash,
    currentDay: 0,
    currentWeek: 0,
  };

  const startingSPY = 590.0;

  console.log('DAY 0 (MONDAY) - Opening Positions');
  console.log(`Starting Capital: $${portfolio.cash.toLocaleString()}`);
  console.log(`SPY: $${startingSPY.toFixed(2)}`);
  console.log();

  // Open LEAPS
  const leaps = createLEAPSPosition(startingSPY, 510, 120);
  portfolio.cash -= leaps.value;
  portfolio.leaps = leaps;

  console.log('✅ Opened LEAPS:');
  console.log(`   Strike: $510 | Cost: $${leaps.value.toFixed(2)}`);
  console.log(`   Delta: ${leaps.delta.toFixed(2)} | Theta: $${leaps.theta.toFixed(2)}/day`);
  console.log(`   Intrinsic: $${leaps.intrinsic.toFixed(2)} | Extrinsic: $${leaps.extrinsic.toFixed(2)}`);
  console.log();

  // Sell weekly call
  const shortCall = createShortCallPosition(startingSPY, 593, 5);
  portfolio.cash += shortCall.premiumCollected;
  portfolio.shortCall = shortCall;

  console.log('✅ Sold Weekly Call:');
  console.log(`   Strike: $593 | Premium: $${shortCall.premiumCollected.toFixed(2)}`);
  console.log();

  console.log(`Cash after trades: $${portfolio.cash.toFixed(2)}`);
  console.log(`Total Portfolio Value: $${getPortfolioValue(portfolio).toFixed(2)}`);
  console.log();

  // Simulate days
  const stockPrices: [string, number][] = [
    ['Tuesday', 591.5],
    ['Wednesday', 592.8],
    ['Thursday', 594.2],
    ['Friday', 595.0],
  ];

  console.log('='.repeat(80));
  console.log('DAILY PROGRESSION');
  console.log('='.repeat(80));
  console.log(
    'Day'.padEnd(12) +
      'SPY'.padStart(8) +
      'LEAPS Δ'.padStart(10) +
      'Call Δ'.padStart(10) +
      'Daily P&L'.padStart(12) +
      'Weekly P&L'.padStart(12)
  );
  console.log('-'.repeat(80));

  for (const [dayName, spy] of stockPrices) {
    portfolio.currentDay++;

    let leapsPnL = 0;
    let callPnL = 0;

    // Update LEAPS
    if (portfolio.leaps) {
      const { position, update } = updateLEAPSDay(portfolio.leaps, spy);
      portfolio.leaps = position;
      leapsPnL = update.dailyPnL;
    }

    // Update short call
    if (portfolio.shortCall) {
      const result = updateShortCallDay(portfolio.shortCall, spy);
      portfolio.shortCall = result.expired ? null : result.position;
      callPnL = result.dailyPnL;

      if (result.expired && result.finalPnL !== undefined) {
        console.log(`   [Short call expired: Final P&L = $${result.finalPnL.toFixed(2)}]`);
      }
    }

    const dailyPnL = leapsPnL + callPnL;
    const weeklyPnL = getWeeklyPnL(portfolio);

    console.log(
      dayName.padEnd(12) +
        `$${spy.toFixed(2)}`.padStart(8) +
        `$${leapsPnL.toFixed(2)}`.padStart(10) +
        `$${callPnL.toFixed(2)}`.padStart(10) +
        `$${dailyPnL.toFixed(2)}`.padStart(12) +
        `$${weeklyPnL.toFixed(2)}`.padStart(12)
    );
  }

  console.log();
  console.log('='.repeat(80));
  console.log('FINAL STATUS (FRIDAY)');
  console.log('='.repeat(80));

  const totalValue = getPortfolioValue(portfolio);
  const weeklyPnL = getWeeklyPnL(portfolio);
  const totalPnL = getTotalPnL(portfolio);

  console.log(`Total Portfolio Value: $${totalValue.toFixed(2)}`);
  console.log(`Weekly P&L: $${weeklyPnL.toFixed(2)}`);
  console.log(`Total P&L: $${totalPnL.toFixed(2)}`);
  console.log();

  if (portfolio.leaps) {
    console.log('LEAPS Position:');
    console.log(`  Value: $${portfolio.leaps.value.toFixed(2)}`);
    console.log(`  Delta: ${portfolio.leaps.delta.toFixed(3)}`);
    console.log(`  P&L: $${getLEAPSPnL(portfolio.leaps).toFixed(2)}`);
    console.log();
  }

  if (portfolio.shortCall) {
    console.log('Short Call Position:');
    console.log(`  Premium Collected: $${portfolio.shortCall.premiumCollected.toFixed(2)}`);
    console.log(`  Current Value: $${portfolio.shortCall.optionValue.toFixed(2)}`);
    console.log(`  P&L: $${getShortCallPnL(portfolio.shortCall).toFixed(2)}`);
    console.log();
  }

  console.log('='.repeat(80));
  console.log();

  // Compare to Python expected results
  console.log('COMPARISON TO PYTHON MODEL:');
  console.log('Python expected Weekly P&L: ~$372.97');
  console.log(`TypeScript actual Weekly P&L: $${weeklyPnL.toFixed(2)}`);
  const difference = Math.abs(weeklyPnL - 372.97);
  console.log(`Difference: $${difference.toFixed(2)}`);
  console.log();

  if (difference < 1) {
    console.log('✅ SUCCESS! TypeScript matches Python model exactly!');
  } else {
    console.log('⚠️  WARNING: Difference from Python model');
  }

  console.log('='.repeat(80));
}

// Run the test
runTest();
