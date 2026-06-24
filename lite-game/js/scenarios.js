// scenarios.js — market scenario generation

// Drift reflects long-term direction, but weekly sigma is large enough that
// ~35-45% of bear weeks are positive and ~30-35% of bull weeks are negative.
// This matches real market behaviour where direction is uncertain week-to-week.
const SCENARIOS = {
    // Difficulty presets
    easy:            { name: 'Easy',                drift: 0.004,  vixBase: 14 },
    medium:          { name: 'Medium',              drift: 0.000,  vixBase: 20 },
    hard:            { name: 'Hard',                drift: 0.000,  vixBase: 28 },
    // Named regimes
    mystery:         { name: 'Mystery scenario',    drift: null,   vixBase: null },
    bull:            { name: 'Bull market',         drift: 0.005,  vixBase: 14 },
    'moderate-bull': { name: 'Moderate bull',       drift: 0.003,  vixBase: 16 },
    bear:            { name: 'Bear market',         drift: -0.010, vixBase: 28 },
    'moderate-bear': { name: 'Moderate bear',       drift: -0.005, vixBase: 22 },
    choppy:          { name: 'Sideways chop',       drift: 0.000,  vixBase: 24 },
    'high-vol':      { name: 'High volatility',     drift: 0.000,  vixBase: 35 },
    crash:           { name: 'Flash crash',         drift: -0.050, vixBase: 50 },
    'bear-recovery': { name: 'V-shape recovery',    drift: -0.015, vixBase: 35 },
    // Historical scenarios — names only; data lives in historical-data.js
    'covid-2020':    { name: 'COVID Crash 2020',    drift: null,   vixBase: 17 },
    'bear-2022':     { name: '2022 Bear Market',    drift: null,   vixBase: 27 },
    'bull-2024':     { name: '2024 Bull Run',       drift: null,   vixBase: 17 },
};

// Seeded pseudo-random (deterministic per week for mystery)
function seededRandom(seed) {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
}

// Box-Muller transform: maps two uniform [0,1] values to a standard normal draw.
// Clamped to ±3.5σ: the sine-based seeded RNG is not perfectly uniform and can land
// very close to 0, turning log(~0) into a 5-6σ draw — unrealistically large weekly moves.
function normalRandom(u1, u2) {
    const safe = Math.max(u1, 1e-10);
    const z = Math.sqrt(-2 * Math.log(safe)) * Math.cos(2 * Math.PI * u2);
    return Math.max(-3.5, Math.min(3.5, z));
}

// Realistic VIX dynamics: very slow mean reversion so VIX trends for weeks/months,
// asymmetric inverse correlation with stock (down moves spike VIX more than up moves suppress),
// and enough noise to create genuine multi-week drifts matching real VIX behaviour.
function updateVix(currentVix, targetVix, weeklyReturn, noiseAmplitude, r3, r4, vixCap) {
    // 0.030/week → ~23 week half-life (~5 months) for genuine multi-month trends
    const reversion = (targetVix - currentVix) * 0.030;
    // Balanced stock correlation: down moves spike VIX slightly more than up moves suppress it,
    // but calibrated so bull markets keep VIX in 12-22 range rather than drifting high
    const stockEffect = weeklyReturn < 0
        ? -weeklyReturn * 60   // -1% → +0.6 VIX pts
        : -weeklyReturn * 50;  // +1% → -0.5 VIX pts
    const noise = normalRandom(r3, r4) * noiseAmplitude;
    return Math.max(9, Math.min(vixCap, currentVix + reversion + stockEffect + noise));
}

function generateWeeklyMove(scenario, currentPrice, currentVix, week) {
    const r1 = seededRandom(week * 7 + 1);
    const r2 = seededRandom(week * 7 + 2);
    const r3 = seededRandom(week * 7 + 3);
    const r4 = seededRandom(week * 7 + 4);
    const r5 = seededRandom(week * 7 + 5);

    let weeklyReturn, newVix;

    if (scenario === 'mystery') {
        // One regime per 13-week block so VIX trends for a full quarter before potentially shifting
        const regimes = ['bull', 'moderate-bull', 'moderate-bull', 'bear', 'choppy', 'high-vol'];
        const block = Math.floor(week / 13);
        const picked = regimes[Math.floor(seededRandom(block * 137 + 99) * regimes.length)];
        return generateWeeklyMove(picked, currentPrice, currentVix, week);
    }

    const cfg = SCENARIOS[scenario] || SCENARIOS['moderate-bull'];

    // Weekly sigma blends the scenario baseline with the live VIX,
    // matching how option-implied vol drives realised vol.
    // 0.75 factor converts implied vol (VIX) to realized vol — IV runs ~25% above RV historically.
    const blendedVix = cfg.vixBase * 0.6 + currentVix * 0.4;
    const sigma = blendedVix / 100 / Math.sqrt(52) * 0.75;

    switch (scenario) {
        case 'bull': {
            weeklyReturn = cfg.drift + sigma * normalRandom(r1, r2);
            // ~12% chance of a pullback week to keep bulls honest
            if (r5 > 0.88) weeklyReturn -= 0.015 + r5 * 0.015;
            newVix = updateVix(currentVix, 14, weeklyReturn, 0.9, r3, r4, 45);
            break;
        }

        case 'moderate-bull': {
            weeklyReturn = cfg.drift + sigma * normalRandom(r1, r2);
            if (r5 > 0.85) weeklyReturn -= 0.012 + r5 * 0.018;
            newVix = updateVix(currentVix, 16, weeklyReturn, 1.1, r3, r4, 50);
            break;
        }

        case 'bear': {
            weeklyReturn = cfg.drift + sigma * normalRandom(r1, r2);
            // ~15% chance of a bear-market rally (sharp bounce +1.5-3%)
            if (r5 > 0.85) weeklyReturn += 0.015 + r5 * 0.015;
            // Hard cap: even a 2022-style bear doesn't exceed ±11% in a single week
            weeklyReturn = Math.max(-0.11, Math.min(0.11, weeklyReturn));
            newVix = updateVix(currentVix, 28, weeklyReturn, 1.5, r3, r4, 42);
            break;
        }

        case 'moderate-bear': {
            weeklyReturn = cfg.drift + sigma * normalRandom(r1, r2);
            if (r5 > 0.87) weeklyReturn += 0.012 + r5 * 0.015;
            weeklyReturn = Math.max(-0.09, Math.min(0.09, weeklyReturn));
            newVix = updateVix(currentVix, 22, weeklyReturn, 1.2, r3, r4, 38);
            break;
        }

        case 'choppy': {
            weeklyReturn = sigma * normalRandom(r1, r2);
            weeklyReturn = Math.max(-0.08, Math.min(0.08, weeklyReturn));
            newVix = updateVix(currentVix, 24, weeklyReturn, 1.8, r3, r4, 38);
            break;
        }

        case 'high-vol': {
            weeklyReturn = sigma * normalRandom(r1, r2);
            newVix = updateVix(currentVix, 35, weeklyReturn, 2.2, r3, r4, 65);
            break;
        }

        case 'crash': {
            if (week < 5) {
                // Acute crash: sharp drops, VIX spikes fast (keep multiplicative formula for drama)
                weeklyReturn = -0.04 - r1 * 0.05 + r2 * 0.015;
                newVix = Math.min(80, currentVix * 1.12 + r3 * 6);
            } else if (week < 11) {
                // Shock plateau: very high VIX, slow decay begins. No sigma multiplier —
                // high VIX already inflates sigma; ×2 pushed weekly moves past +40%.
                weeklyReturn = sigma * normalRandom(r1, r2) - 0.008;
                newVix = updateVix(currentVix, 55, weeklyReturn, 2.0, r3, r4, 80);
            } else if (week < 22) {
                // Recovery: VIX slowly declining toward 28 over many weeks
                weeklyReturn = 0.012 + sigma * normalRandom(r1, r2) * 1.1;
                newVix = updateVix(currentVix, 28, weeklyReturn, 1.5, r3, r4, 70);
            } else {
                // Post-crisis normalisation: VIX drifts toward calm over remaining weeks
                weeklyReturn = 0.007 + sigma * normalRandom(r1, r2);
                newVix = updateVix(currentVix, 18, weeklyReturn, 1.2, r3, r4, 50);
            }
            break;
        }

        case 'bear-recovery': {
            if (week < 6) {
                // Sharp initial drop with fast VIX spike
                weeklyReturn = -0.025 + sigma * normalRandom(r1, r2) * 1.2;
                newVix = Math.min(70, currentVix * 1.08 + r2 * 4);
            } else if (week < 10) {
                // Fake rally: VIX starts retreating but not fully
                weeklyReturn = 0.015 + sigma * normalRandom(r1, r2);
                newVix = updateVix(currentVix, 25, weeklyReturn, 1.3, r3, r4, 55);
            } else {
                // Real recovery: VIX slowly normalises over many weeks
                weeklyReturn = 0.018 + sigma * normalRandom(r1, r2) * 0.8;
                newVix = updateVix(currentVix, 14, weeklyReturn, 1.0, r3, r4, 45);
            }
            break;
        }

        case 'easy': {
            weeklyReturn = 0.004 + sigma * normalRandom(r1, r2);
            if (r5 > 0.92) weeklyReturn -= 0.015 + r5 * 0.015;
            newVix = updateVix(currentVix, 14, weeklyReturn, 0.7, r3, r4, 40);
            break;
        }

        case 'medium': {
            // Four-phase arc: rally → slide → flat → recovery
            let drift, vixTarget;
            if (week < 15) {
                drift = 0.005; vixTarget = 16;
            } else if (week < 29) {
                drift = -0.004; vixTarget = 24;
            } else if (week < 41) {
                drift = 0.000; vixTarget = 20;
            } else {
                drift = 0.004; vixTarget = 16;
            }
            weeklyReturn = drift + sigma * normalRandom(r1, r2);
            newVix = updateVix(currentVix, vixTarget, weeklyReturn, 1.1, r3, r4, 45);
            break;
        }

        case 'hard': {
            // Two sudden-drop events with V-shape recoveries; choppy baseline in between
            const drop1 = 6 + Math.floor(seededRandom(201) * 16);
            const drop2 = 26 + Math.floor(seededRandom(202) * 16);
            const inRecovery = (w, dw) => w > dw && w <= dw + 3;
            const isDropWeek = week === drop1 || week === drop2;
            const isRecovery = inRecovery(week, drop1) || inRecovery(week, drop2);

            if (isDropWeek) {
                weeklyReturn = -0.05 - r1 * 0.04 + r2 * 0.01;
                newVix = Math.min(75, currentVix * 1.15 + r3 * 8);
            } else if (isRecovery) {
                weeklyReturn = 0.020 + r1 * 0.015;
                // Gradual VIX decay rather than step-down
                newVix = updateVix(currentVix, 22, weeklyReturn, 1.3, r3, r4, 60);
            } else {
                weeklyReturn = sigma * normalRandom(r1, r2) * 1.1;
                newVix = updateVix(currentVix, 28, weeklyReturn, 1.8, r3, r4, 55);
            }
            break;
        }

        default: {
            weeklyReturn = sigma * normalRandom(r1, r2);
            newVix = currentVix;
        }
    }

    const newPrice = currentPrice * (1 + weeklyReturn);

    // OHLC: intraday wicks capped at min(40% of body, 2% of price) so mid-week daily
    // prices don't overshoot the actual weekly close by a crazy margin.
    const open = currentPrice;
    const close = newPrice;
    const bodyRange  = Math.abs(newPrice - currentPrice);
    const wickBudget = Math.min(bodyRange * 0.40, currentPrice * 0.020);
    const high = Math.max(open, close) + wickBudget * (0.2 + r4 * 0.8);
    const low  = Math.min(open, close) - wickBudget * (0.2 + (1 - r4) * 0.8);

    return {
        newPrice,
        priceChangePct: weeklyReturn * 100,
        newVix: Math.max(9, Math.min(80, newVix)),
        ohlc: { open, high, low, close }
    };
}

function getScenarioStartingVix(scenario) {
    if (scenario === 'mystery') return 16;
    return SCENARIOS[scenario]?.vixBase || 16;
}

// Generate 5 end-of-day prices (Mon–Fri) from a single weekly OHLC bar.
// Spreads the weekly move linearly across the week with small bounded noise (±1% per day).
// The tent-path approach was retired: routing through the weekly high/low forced each
// individual day to cover the full week's range, producing 5-6% single-day moves.
function getDailyPrices(ohlc, week) {
    const { open, close } = ohlc;
    const r1 = seededRandom(week * 31 + 77);
    const r2 = seededRandom(week * 31 + 78);
    const r3 = seededRandom(week * 31 + 79);
    const r4 = seededRandom(week * 31 + 80);

    // Each intermediate day sits at open + (N/5 of weekMove) + random noise capped at ±1%.
    // Friday is forced to the actual weekly close so the chart always lands correctly.
    const weekMove = close - open;
    const noise    = open * 0.010; // ±1% of price — small enough to keep days looking realistic

    const d0 = open + weekMove * 0.20 + (r1 - 0.5) * noise * 2;
    const d1 = open + weekMove * 0.40 + (r2 - 0.5) * noise * 2;
    const d2 = open + weekMove * 0.60 + (r3 - 0.5) * noise * 2;
    const d3 = open + weekMove * 0.80 + (r4 - 0.5) * noise * 2;

    return [d0, d1, d2, d3, close];  // [Monday, Tuesday, Wednesday, Thursday, Friday]
}
