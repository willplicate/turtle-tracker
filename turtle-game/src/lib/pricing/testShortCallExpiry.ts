/**
 * Test Short Call Expiry Behavior
 * Verify short calls return full premium when expiring OTM
 */

import {
  createShortCallPosition,
  updateShortCallDay,
  getShortCallPnL,
} from './simplifiedPricing';

function testOTMExpiry() {
  console.log('='.repeat(80));
  console.log('TEST: Short Call Expires OTM');
  console.log('='.repeat(80));
  console.log();

  // Monday: Sell 593 call when SPY is 590
  const mondaySPY = 590.0;
  const strike = 593;

  let shortCall = createShortCallPosition(mondaySPY, strike, 4); // 4 DTE

  console.log(`MONDAY: Sold ${strike} call at SPY $${mondaySPY}`);
  console.log(`  Premium Collected: $${shortCall.premiumCollected.toFixed(2)}`);
  console.log(`  Strike: $${strike}`);
  console.log(`  DTE: 4 (expires Friday)`);
  console.log();

  // Simulate days where SPY stays below strike
  const days: [string, number][] = [
    ['Tuesday', 590.5],
    ['Wednesday', 591.2],
    ['Thursday', 591.8],
    ['Friday', 592.0], // Expires OTM
  ];

  console.log('Daily Updates:');
  console.log(
    'Day'.padEnd(12) + 'SPY'.padStart(8) + 'Option Value'.padStart(15) + 'Daily P&L'.padStart(12)
  );
  console.log('-'.repeat(50));

  for (const [dayName, spy] of days) {
    const result = updateShortCallDay(shortCall, spy);
    shortCall = result.position;

    console.log(
      dayName.padEnd(12) +
        `$${spy.toFixed(2)}`.padStart(8) +
        `$${result.position.optionValue.toFixed(2)}`.padStart(15) +
        `$${result.dailyPnL.toFixed(2)}`.padStart(12)
    );
  }

  console.log();
  console.log('='.repeat(80));
  console.log('FRIDAY EXPIRY - ANALYSIS');
  console.log('='.repeat(80));

  const finalSPY = 592.0;
  const intrinsicAtExpiry = Math.max(0, finalSPY - strike) * 100;

  console.log(`Final SPY: $${finalSPY}`);
  console.log(`Strike: $${strike}`);
  console.log(`Intrinsic at Expiry: $${intrinsicAtExpiry.toFixed(2)}`);
  console.log();
  console.log(`Premium Collected: $${shortCall.premiumCollected.toFixed(2)}`);
  console.log(`Option Final Value: $${shortCall.optionValue.toFixed(2)}`);
  console.log(`Final P&L: $${getShortCallPnL(shortCall).toFixed(2)}`);
  console.log();

  const expectedPnL = shortCall.premiumCollected;
  const actualPnL = getShortCallPnL(shortCall);

  console.log('EXPECTED BEHAVIOR:');
  console.log(`  Call expires OTM (SPY $${finalSPY} < Strike $${strike})`);
  console.log(`  Should be worthless (intrinsic = $0)`);
  console.log(`  Expected P&L = Premium Collected = $${expectedPnL.toFixed(2)}`);
  console.log();
  console.log('ACTUAL RESULT:');
  console.log(`  Actual P&L = $${actualPnL.toFixed(2)}`);
  console.log();

  if (Math.abs(actualPnL - expectedPnL) < 1.0) {
    console.log('✅ PASS: Short call correctly returns full premium when expires OTM');
  } else {
    console.log(`❌ FAIL: Expected $${expectedPnL.toFixed(2)}, got $${actualPnL.toFixed(2)}`);
    console.log(`   Difference: $${Math.abs(actualPnL - expectedPnL).toFixed(2)}`);
  }

  console.log('='.repeat(80));
}

function testITMExpiry() {
  console.log();
  console.log('='.repeat(80));
  console.log('TEST: Short Call Expires ITM');
  console.log('='.repeat(80));
  console.log();

  // Monday: Sell 593 call when SPY is 590
  const mondaySPY = 590.0;
  const strike = 593;

  let shortCall = createShortCallPosition(mondaySPY, strike, 4); // 4 DTE

  console.log(`MONDAY: Sold ${strike} call at SPY $${mondaySPY}`);
  console.log(`  Premium Collected: $${shortCall.premiumCollected.toFixed(2)}`);
  console.log(`  Strike: $${strike}`);
  console.log(`  DTE: 4 (expires Friday)`);
  console.log();

  // Simulate days where SPY goes ABOVE strike
  const days: [string, number][] = [
    ['Tuesday', 592.0],
    ['Wednesday', 593.5],
    ['Thursday', 594.8],
    ['Friday', 595.0], // Expires ITM
  ];

  console.log('Daily Updates:');
  console.log(
    'Day'.padEnd(12) + 'SPY'.padStart(8) + 'Option Value'.padStart(15) + 'Daily P&L'.padStart(12)
  );
  console.log('-'.repeat(50));

  for (const [dayName, spy] of days) {
    const result = updateShortCallDay(shortCall, spy);
    shortCall = result.position;

    console.log(
      dayName.padEnd(12) +
        `$${spy.toFixed(2)}`.padStart(8) +
        `$${result.position.optionValue.toFixed(2)}`.padStart(15) +
        `$${result.dailyPnL.toFixed(2)}`.padStart(12)
    );
  }

  console.log();
  console.log('='.repeat(80));
  console.log('FRIDAY EXPIRY - ANALYSIS');
  console.log('='.repeat(80));

  const finalSPY = 595.0;
  const intrinsicAtExpiry = Math.max(0, finalSPY - strike) * 100;

  console.log(`Final SPY: $${finalSPY}`);
  console.log(`Strike: $${strike}`);
  console.log(`Amount ITM: $${(finalSPY - strike).toFixed(2)}`);
  console.log(`Intrinsic at Expiry: $${intrinsicAtExpiry.toFixed(2)}`);
  console.log();
  console.log(`Premium Collected: $${shortCall.premiumCollected.toFixed(2)}`);
  console.log(`Option Final Value: $${shortCall.optionValue.toFixed(2)}`);
  console.log(`Final P&L: $${getShortCallPnL(shortCall).toFixed(2)}`);
  console.log();

  const expectedPnL = shortCall.premiumCollected - intrinsicAtExpiry;
  const actualPnL = getShortCallPnL(shortCall);

  console.log('EXPECTED BEHAVIOR:');
  console.log(`  Call expires $${(finalSPY - strike).toFixed(2)} ITM`);
  console.log(`  We owe: $${intrinsicAtExpiry.toFixed(2)}`);
  console.log(
    `  Expected P&L = $${shortCall.premiumCollected.toFixed(2)} - $${intrinsicAtExpiry.toFixed(
      2
    )} = $${expectedPnL.toFixed(2)}`
  );
  console.log();
  console.log('ACTUAL RESULT:');
  console.log(`  Actual P&L = $${actualPnL.toFixed(2)}`);
  console.log();

  if (Math.abs(actualPnL - expectedPnL) < 1.0) {
    console.log('✅ PASS: Short call correctly calculates loss when expires ITM');
  } else {
    console.log(`❌ FAIL: Expected $${expectedPnL.toFixed(2)}, got $${actualPnL.toFixed(2)}`);
    console.log(`   Difference: $${Math.abs(actualPnL - expectedPnL).toFixed(2)}`);
  }

  console.log('='.repeat(80));
}

// Run tests
testOTMExpiry();
testITMExpiry();
