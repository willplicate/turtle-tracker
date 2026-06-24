// Validate LEAPS pricing against expectations
import { calculateOptionPrice } from './turtle-game/src/lib/pricing/optionsPricing';

console.log('\n=== LEAPS PRICING VALIDATION ===\n');

// Scenario from screenshot: Week 1
const stockPrice = 597.59;
const strike = Math.round(stockPrice * 0.92); // 92% moneyness (simulator default)
const dte = 365;
const vix = 15.8;

console.log(`Stock Price: $${stockPrice}`);
console.log(`Strike: $${strike} (${((stockPrice - strike) / stockPrice * 100).toFixed(1)}% ITM)`);
console.log(`DTE: ${dte} days`);
console.log(`VIX: ${vix}\n`);

const pricing = calculateOptionPrice({
  stockPrice,
  strike,
  dte,
  vix,
  isCall: true,
});

console.log('CALCULATED PRICING:');
console.log(`  Intrinsic: $${pricing.intrinsic.toLocaleString()}`);
console.log(`  Extrinsic: $${pricing.extrinsic.toLocaleString()}`);
console.log(`  Total: $${pricing.total.toLocaleString()}`);
console.log(`  Delta: ${pricing.delta.toFixed(3)}`);
console.log(`  Theta: $${pricing.theta.toFixed(2)}/day\n`);

console.log('REALITY CHECK:');
console.log(`  Real SPY LEAPS (8% ITM, 365 DTE) typically costs: $10,000-$13,000`);
console.log(`  Our model calculates: $${pricing.total.toLocaleString()}`);
const error = ((pricing.total - 11500) / 11500 * 100).toFixed(1);
console.log(`  Error: ${error}% vs $11,500 midpoint\n`);

// Test theta decay
console.log('=== THETA DECAY TEST ===\n');
console.log('Week-by-week without price movement:');

let currentDTE = 365;
let currentExtrinsic = pricing.extrinsic;

for (let week = 0; week <= 10; week++) {
  const p = calculateOptionPrice({
    stockPrice, // Price stays constant
    strike,
    dte: currentDTE,
    vix,
    isCall: true,
  });

  const weeklyDecay = week > 0 ? p.extrinsic - currentExtrinsic : 0;
  console.log(`Week ${week}: DTE=${currentDTE}, Extrinsic=$${p.extrinsic.toLocaleString()}, Decay=$${weeklyDecay.toFixed(0)}, Theta=$${p.theta.toFixed(2)}/day`);

  currentExtrinsic = p.extrinsic;
  currentDTE -= 7;
}

console.log('\n');
