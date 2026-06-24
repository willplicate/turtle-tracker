// rules-engine.js — regime detection and signal generation

function calculateEMA(data, period) {
    if (data.length === 0) return [];
    const k = 2 / (period + 1);
    let ema = [data[0]];
    for (let i = 1; i < data.length; i++) {
        ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
}

function getRulesSignal(vixHistory, priceHistory) {
    if (vixHistory.length < 2) return null;

    const vixEMA = calculateEMA(vixHistory, 15);
    const currentRVX = vixHistory[vixHistory.length - 1];
    const currentEMA = vixEMA[vixEMA.length - 1];
    const prevEMA = vixEMA[vixEMA.length - 2] || currentEMA;
    const emaFalling = currentEMA < prevEMA;

    // 6-week window: catches slower VIX buildups, not just short spikes
    const recentWindow = vixHistory.slice(-6);
    const recentPeak = Math.max(...recentWindow);
    const droppedFromPeak = recentPeak - currentRVX;

    // Go uncovered ONLY when VIX is in genuinely calm territory (<20).
    // A drop from 65 to 45 looks large but is still crisis level.
    // Without the absolute floor this fired straight into crash weeks.
    if (droppedFromPeak >= 8 && emaFalling && currentRVX < 20) {
        return { action: 'Go uncovered', reason: 'RVX calm and falling — let the LEAPS run', colour: 'blue' };
    }

    // Active crisis, VIX still rising or stable — maximum premium, maximum protection
    if (currentRVX > 27 && !emaFalling) {
        return { action: 'Sell ITM call', reason: 'Crisis regime — collect maximum premium', colour: 'red' };
    }

    // Crisis but VIX is easing — still too elevated to go light, stay covered
    if (currentRVX > 27) {
        return { action: 'Sell ATM call', reason: 'VIX elevated but easing — stay covered while uncertainty persists', colour: 'amber' };
    }

    if (currentRVX >= 22) {
        return { action: 'Sell ATM call', reason: 'Elevated volatility — premium compensates for capped upside', colour: 'amber' };
    }
    return { action: 'Sell OTM call', reason: 'Calm regime — modest income, keep most upside', colour: 'green' };
}

function getRegimeLabel(vix) {
    if (vix < 12) return { label: 'Complacent', colour: 'green' };
    if (vix < 18) return { label: 'Normal', colour: 'green' };
    if (vix < 22) return { label: 'Slightly elevated', colour: 'green' };
    if (vix < 27) return { label: 'Elevated volatility', colour: 'amber' };
    if (vix < 35) return { label: 'High volatility', colour: 'red' };
    return { label: 'Crisis', colour: 'red' };
}

function generateStrikeOptions(currentPrice, currentVix, simulator, contracts) {
    const superItmStrike = Math.round(currentPrice - 10);
    const itmStrike = Math.round(currentPrice * 0.98);
    const atmStrike = Math.round(currentPrice);
    const nearOtmStrike = Math.round(currentPrice * 1.01);
    const farOtmStrike = Math.round(currentPrice * 1.025);

    function getPremium(strike) {
        if (!strike) return 0;
        if (simulator._pricingMode === 'advanced' && simulator._vixSim) {
            const call = new AdvancedShortCall(currentPrice, strike, 5, currentVix);
            return call.premiumCollected * (contracts || 1);
        }
        const call = new ShortCallPosition(currentPrice, strike, 5);
        return call.premiumCollected * (contracts || 1);
    }

    return [
        { strike: superItmStrike, type: 'Super ITM', note: 'Deep ITM — maximum protection in drawdowns', premium: getPremium(superItmStrike) },
        { strike: itmStrike,      type: 'ITM',       note: 'Max premium, capped upside',                 premium: getPremium(itmStrike) },
        { strike: atmStrike,      type: 'ATM',       note: 'Balanced premium and participation',          premium: getPremium(atmStrike) },
        { strike: nearOtmStrike,  type: 'Near OTM',  note: 'Modest premium, some upside room',            premium: getPremium(nearOtmStrike) },
        { strike: farOtmStrike,   type: 'Far OTM',   note: 'Most upside retained, less income',           premium: getPremium(farOtmStrike) },
        { strike: null,           type: 'Uncovered', note: 'No income — full LEAPS participation',        premium: 0 },
    ];
}
