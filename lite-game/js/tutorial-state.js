// tutorial-state.js — state and logic for the lite tutorial game

const SHARE_COUNT    = 100;
const START_PRICE    = 100.00;
const START_CAPITAL  = SHARE_COUNT * START_PRICE;   // $10,000
const START_VIX      = 20;
const TOTAL_WEEKS    = 8;

// ─── Persistent progress ──────────────────────────────────────────────────────

function loadProgress() {
    try {
        const raw = localStorage.getItem('lite_game_progress');
        return raw ? JSON.parse(raw) : { t1: false, t2: false, t3: false };
    } catch {
        return { t1: false, t2: false, t3: false };
    }
}

function saveProgress() {
    localStorage.setItem('lite_game_progress', JSON.stringify(ts.progress));
}

// ─── Global state ─────────────────────────────────────────────────────────────

const ts = {
    screen:       'home',
    tutorial:     null,         // 1 | 2 | 3
    week:         0,            // 1–TOTAL_WEEKS, 0 = not started

    sharePrice:   START_PRICE,
    currentVix:   START_VIX,

    ohlcHistory:       [],      // [{week, open, high, low, close}]
    portfolioHistory:  [],      // portfolio value at end of each week [week0=start, w1, w2, ...]

    shortCall:         null,    // ShortCallPosition | null
    selectedStrike:    null,
    weekResult:        null,    // populated after advanceT1Week() or runWeek()

    totalPremium:  0,           // cumulative premiums collected (T2/T3)
    totalCallLoss: 0,           // cumulative intrinsic paid at expiry (T2/T3)
    weekWins:      0,           // weeks where net P&L >= 0

    progress: loadProgress(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcEMA(prices, period) {
    if (prices.length === 0) return [];
    const k = 2 / (period + 1);
    const ema = [prices[0]];
    for (let i = 1; i < prices.length; i++) {
        ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
}

function makeOHLC(open, close, weekNum) {
    const body = Math.abs(close - open);
    const wick = Math.min(body * 0.4, open * 0.012);
    const r    = Math.sin(weekNum * 17.3) * 0.5 + 0.5;   // deterministic 0–1
    const high = Math.max(open, close) + wick * (0.3 + r * 0.7);
    const low  = Math.min(open, close) - wick * (0.3 + (1 - r) * 0.7);
    return { week: weekNum, open, high, low, close };
}

function calcPortfolioValue(price) {
    return price * SHARE_COUNT + ts.totalPremium - ts.totalCallLoss;
}

// ─── Strike generation ────────────────────────────────────────────────────────

function generateStrikeOptions(price) {
    const itmStrike     = Math.round(price * 0.98);
    const atmStrike     = Math.round(price);
    const nearOtmStrike = Math.round(price * 1.01);
    const farOtmStrike  = Math.round(price * 1.025);

    const defs = [
        { strike: itmStrike,     type: 'ITM',       note: 'Max premium, upside capped now' },
        { strike: atmStrike,     type: 'ATM',       note: 'Balanced premium and participation' },
        { strike: nearOtmStrike, type: 'Near OTM',  note: `Some room to run (+$${(nearOtmStrike - atmStrike)})` },
        { strike: farOtmStrike,  type: 'Far OTM',   note: 'Low premium, most upside retained' },
        { strike: null,          type: 'Uncovered', note: 'No call — full share participation' },
    ];

    return defs.map(d => {
        if (d.strike === null) return { ...d, premium: 0, intrinsic: 0, extrinsic: 0 };
        const call = new ShortCallPosition(price, d.strike, 7, 1);
        const intrinsic = Math.max(0, price - d.strike) * 100;
        const extrinsic = call.premiumCollected - intrinsic;
        return { ...d, premium: call.premiumCollected, intrinsic, extrinsic };
    });
}

// ─── Tutorial lifecycle ───────────────────────────────────────────────────────

function startTutorial(n) {
    ts.tutorial  = n;
    ts.week      = 0;
    ts.sharePrice   = START_PRICE;
    ts.currentVix   = START_VIX;
    // Seed three pre-game candles so the chart has context on week 1
    ts.ohlcHistory = [
        { week: 0, open: 98.5,  high: 99.3,  low: 98.0,  close: 100.0 },
        { week: 0, open: 100.0, high: 101.2, low: 99.5,  close: 100.5 },
        { week: 0, open: 100.5, high: 101.0, low: 99.8,  close: 100.0 },
    ];
    ts.portfolioHistory = [START_CAPITAL];
    ts.shortCall      = null;
    ts.selectedStrike = null;
    ts.weekResult     = null;
    ts.totalPremium   = 0;
    ts.totalCallLoss  = 0;
    ts.weekWins       = 0;
}

// ─── Tutorial 1: passive bull market ─────────────────────────────────────────

function advanceT1Week() {
    ts.week += 1;
    const open  = ts.sharePrice;
    const close = open * 1.015;
    const ohlc  = makeOHLC(open, close, ts.week);

    ts.ohlcHistory.push(ohlc);
    ts.sharePrice = close;

    const portfolioValue = close * SHARE_COUNT;
    ts.portfolioHistory.push(portfolioValue);

    const weekSharePnl  = (close - open)        * SHARE_COUNT;
    const totalSharePnl = (close - START_PRICE) * SHARE_COUNT;

    if (weekSharePnl >= 0) ts.weekWins += 1;

    ts.weekResult = {
        week: ts.week,
        openPrice:    open,
        closePrice:   close,
        priceChangePct: 1.5,
        weekSharePnl,
        totalSharePnl,
        portfolioValue,
    };

    return ts.weekResult;
}

// ─── Tutorial 2 & 3: sell-call flow ──────────────────────────────────────────

// Called at the start of each new sell week — increments week, returns strike options
function beginSellWeek() {
    ts.week       += 1;
    ts.shortCall   = null;
    ts.selectedStrike = null;
    ts.weekResult  = null;
    return generateStrikeOptions(ts.sharePrice);
}

// Called when user selects a strike on the sell screen
function sellCall(strike) {
    if (strike === null) {
        ts.shortCall      = null;
        ts.selectedStrike = null;
        return { uncovered: true, premium: 0, intrinsic: 0, extrinsic: 0 };
    }
    ts.shortCall      = new ShortCallPosition(ts.sharePrice, strike, 7, 1);
    ts.selectedStrike = strike;
    const intrinsic = Math.max(0, ts.sharePrice - strike) * 100;
    return {
        uncovered: false,
        strike,
        premium:  ts.shortCall.premiumCollected,
        intrinsic,
        extrinsic: ts.shortCall.premiumCollected - intrinsic,
    };
}

// Simulate the price move and resolve the call
function runWeek() {
    const open = ts.sharePrice;
    let close, newVix;

    if (ts.tutorial === 2) {
        // T2: fixed -1%/week, no randomness
        close  = open * 0.99;
        newVix = ts.currentVix;
    } else {
        // T3: seeded choppy market (week + 100 offset avoids collision with other uses)
        const r = generateWeeklyMove('choppy', open, ts.currentVix, ts.week + 100);
        close  = r.newPrice;
        newVix = r.newVix;
    }

    const ohlc = makeOHLC(open, close, ts.week);
    ts.ohlcHistory.push(ohlc);
    ts.currentVix = newVix;
    ts.sharePrice = close;

    const weekSharePnl  = (close - open)        * SHARE_COUNT;
    const totalSharePnl = (close - START_PRICE) * SHARE_COUNT;

    let weekPremium  = 0;
    let intrinsicPaid = 0;
    let callExpiredITM = false;

    if (ts.shortCall !== null) {
        weekPremium = ts.shortCall.premiumCollected;
        ts.totalPremium += weekPremium;
        intrinsicPaid = Math.max(0, close - ts.shortCall.strike) * 100;
        if (intrinsicPaid > 0) {
            callExpiredITM = true;
            ts.totalCallLoss += intrinsicPaid;
        }
    }

    const weekCallPnl = weekPremium - intrinsicPaid;
    const weekNetPnl  = weekSharePnl + weekCallPnl;
    if (weekNetPnl >= 0) ts.weekWins += 1;

    const portfolioValue = calcPortfolioValue(close);
    ts.portfolioHistory.push(portfolioValue);

    ts.weekResult = {
        week:  ts.week,
        openPrice:     open,
        closePrice:    close,
        priceChangePct: ((close - open) / open) * 100,
        strike:        ts.shortCall !== null ? ts.selectedStrike : null,
        wasUncovered:  ts.shortCall === null,
        premium:       weekPremium,
        intrinsicPaid,
        callExpiredITM,
        weekSharePnl,
        weekCallPnl,
        weekNetPnl,
        totalPremium:  ts.totalPremium,
        totalSharePnl,
        portfolioValue,
        totalNetPnl:   portfolioValue - START_CAPITAL,
    };

    ts.shortCall = null;
    return ts.weekResult;
}

// ─── Completion ───────────────────────────────────────────────────────────────

function completeTutorial() {
    ts.progress[`t${ts.tutorial}`] = true;
    saveProgress();
}

function getSummaryStats() {
    const totalSharePnl  = (ts.sharePrice - START_PRICE) * SHARE_COUNT;
    const portfolioValue = ts.tutorial === 1
        ? ts.sharePrice * SHARE_COUNT
        : calcPortfolioValue(ts.sharePrice);
    const totalReturn = portfolioValue - START_CAPITAL;
    const returnPct   = (totalReturn / START_CAPITAL) * 100;

    return {
        finalPrice:    ts.sharePrice,
        totalSharePnl,
        totalPremium:  ts.totalPremium,
        totalCallLoss: ts.totalCallLoss,
        portfolioValue,
        totalReturn,
        returnPct,
        weekWins:  ts.weekWins,
        portfolioHistory: ts.portfolioHistory,
        ohlcHistory:      ts.ohlcHistory,
    };
}
