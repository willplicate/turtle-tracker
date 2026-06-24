// engine.js — translated from simplified_trading_simulator.py

// Black-Scholes helpers (Horner's method for normCDF, accurate to ~7 decimal places)
function _normCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
    return x > 0 ? 1 - p : p;
}

function _bsCall(S, K, T, r, iv) {
    if (T <= 0) return { price: Math.max(0, S - K) * 100, delta: S > K ? 1.0 : 0.0 };
    const sq = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r + 0.5 * iv * iv) * T) / (iv * sq);
    const d2 = d1 - iv * sq;
    const delta = _normCDF(d1);
    const price = (S * delta - K * Math.exp(-r * T) * _normCDF(d2)) * 100;
    return { price, delta };
}

const BS_IV         = 0.27;   // LEAPS IV — bumped from 0.22 to 0.27 to better match real market prices (real SPY 365-DTE 80-delta LEAPS priced ~17% higher than plain BS at 22%)
const BS_SHORT_IV   = 0.24;   // IWM IV for weekly short calls (short-dated skew)
const BS_R          = 0.04;   // risk-free rate
const TRADING_TO_CAL = 7 / 5; // 5 trading days = 7 calendar days (for BS time input)

class LEAPSPosition {
    constructor(stockPrice, strike, dte, contracts = 1) {
        this.strike = strike;
        this.dte = dte;
        this.contracts = contracts;
        this.openingStockPrice = stockPrice;
        this.lastStockPrice = stockPrice;

        const { price, delta } = _bsCall(stockPrice, strike, dte / 365, BS_R, BS_IV);
        this.value = price * contracts;
        this.delta = delta;
        this.intrinsic = Math.max(0, stockPrice - strike) * 100 * contracts;
        this.extrinsic = this.value - this.intrinsic;
        this.theta = dte > 0 ? -this.extrinsic / dte : 0;
        this.costBasis = this.value;
    }

    advanceDay(newStockPrice) {
        const stockChange = newStockPrice - this.lastStockPrice;
        const stockImpact = stockChange * this.delta * 100 * this.contracts;
        const thetaImpact = this.theta;

        this.value += stockImpact + thetaImpact;
        this.extrinsic += thetaImpact;
        this.intrinsic = Math.max(0, newStockPrice - this.strike) * 100 * this.contracts;
        this.dte -= 1;

        if (this.dte > 0) {
            this.theta = -this.extrinsic / this.dte;
            // Recalculate delta using BS with updated stock price and DTE
            this.delta = _bsCall(newStockPrice, this.strike, this.dte / 365, BS_R, BS_IV).delta;
        } else {
            this.theta = 0;
            this.extrinsic = 0;
            this.delta = newStockPrice > this.strike ? 1.0 : 0.0;
        }

        this.lastStockPrice = newStockPrice;

        return { value: this.value, delta: this.delta, theta: this.theta, stockImpact, thetaImpact, dailyPnl: stockImpact + thetaImpact };
    }

    getPnl() {
        return this.value - this.costBasis;
    }
}

class ShortCallPosition {
    constructor(stockPrice, strike, dte = 7, contracts = 1) {
        this.strike = strike;
        this.dte = dte;
        this.contracts = contracts;
        this.openingStockPrice = stockPrice;
        this.premiumCollected = _bsCall(stockPrice, strike, dte * TRADING_TO_CAL / 365, BS_R, BS_SHORT_IV).price * contracts;
        this.optionValue = this.premiumCollected;
    }

    advanceDay(newStockPrice) {
        const oldOptionValue = this.optionValue;
        this.dte = Math.max(0, this.dte - 1);

        if (this.dte === 0) {
            this.optionValue = Math.max(0, newStockPrice - this.strike) * 100 * this.contracts;
        } else {
            this.optionValue = _bsCall(newStockPrice, this.strike, this.dte * TRADING_TO_CAL / 365, BS_R, BS_SHORT_IV).price * this.contracts;
        }

        return { optionValue: this.optionValue, dailyPnl: oldOptionValue - this.optionValue, dte: this.dte };
    }

    getPnl() {
        return this.premiumCollected - this.optionValue;
    }

    expires(stockPrice) {
        const intrinsicAtExpiry = Math.max(0, stockPrice - this.strike) * 100 * this.contracts;
        return this.premiumCollected - intrinsicAtExpiry;
    }
}

class TradingSimulator {
    constructor(startingCapital = 20000) {
        this.startingCapital = startingCapital;
        this.cash = startingCapital;
        this.leapsPosition = null;
        this.shortCall = null;
        this.currentDay = 0;
        this.currentStockPrice = 285.0;
        this.weekStartValue = startingCapital;
        this.weekNumber = 0;
        this.tradeHistory = [];
        this.weeklyPnlHistory = [];
    }

    getTotalValue() {
        let total = this.cash;
        if (this.leapsPosition) total += this.leapsPosition.value;
        if (this.shortCall) total -= this.shortCall.optionValue;
        return total;
    }

    getWeeklyPnl() {
        return this.getTotalValue() - this.weekStartValue;
    }

    getTotalPnl() {
        return this.getTotalValue() - this.startingCapital;
    }

    resetWeek() {
        this.weekStartValue = this.getTotalValue();
        this.weekNumber += 1;
    }

    openLeaps(strike, dte, contracts = 1) {
        if (this.leapsPosition) return { error: 'LEAPS position already exists' };

        const leaps = new LEAPSPosition(this.currentStockPrice, strike, dte, contracts);

        if (leaps.value > this.cash) {
            return { error: 'Insufficient cash', required: leaps.value, available: this.cash };
        }

        this.cash -= leaps.value;
        this.leapsPosition = leaps;

        this.tradeHistory.push({
            day: this.currentDay, week: this.weekNumber,
            action: 'OPEN_LEAPS', strike, dte, cost: leaps.value,
            stockPrice: this.currentStockPrice
        });

        return { success: true, cost: leaps.value, delta: leaps.delta, theta: leaps.theta, intrinsic: leaps.intrinsic, extrinsic: leaps.extrinsic };
    }

    closeLeaps() {
        if (!this.leapsPosition) return { error: 'No LEAPS position' };
        const proceeds = this.leapsPosition.value;
        this.cash += proceeds;
        this.leapsPosition = null;
        return { success: true, proceeds };
    }

    sellWeeklyCall(strike, dte = 7, contracts = 1) {
        if (this.shortCall) return { error: 'Short call position already exists' };
        if (!this.leapsPosition) return { error: 'Must have LEAPS position first' };

        const shortCall = new ShortCallPosition(this.currentStockPrice, strike, dte, contracts);
        this.cash += shortCall.premiumCollected;
        this.shortCall = shortCall;

        this.tradeHistory.push({
            day: this.currentDay, week: this.weekNumber,
            action: 'SELL_CALL', strike, dte, premium: shortCall.premiumCollected,
            stockPrice: this.currentStockPrice
        });

        return { success: true, premium: shortCall.premiumCollected, strike, dte };
    }

    closeShortCall() {
        if (!this.shortCall) return { error: 'No short call position' };
        const cost = this.shortCall.optionValue;
        this.cash -= cost;
        this.shortCall = null;
        return { success: true, cost };
    }

    advanceDay(newStockPrice) {
        this.currentDay += 1;
        const oldTotalValue = this.getTotalValue();
        const results = { day: this.currentDay, week: this.weekNumber, stockPrice: newStockPrice, leaps: null, shortCall: null };

        if (this.leapsPosition) {
            results.leaps = this.leapsPosition.advanceDay(newStockPrice);
        }

        if (this.shortCall) {
            const callResult = this.shortCall.advanceDay(newStockPrice);
            results.shortCall = callResult;

            if (this.shortCall.dte === 0) {
                const finalPnl = this.shortCall.expires(newStockPrice);
                const intrinsicAtExpiry = Math.max(0, newStockPrice - this.shortCall.strike) * 100 * this.shortCall.contracts;
                this.cash -= intrinsicAtExpiry;
                this.shortCall = null;
                results.shortCall.expired = true;
                results.shortCall.finalPnl = finalPnl;
            }
        }

        this.currentStockPrice = newStockPrice;
        results.dailyPnl = this.getTotalValue() - oldTotalValue;
        results.totalValue = this.getTotalValue();
        results.weeklyPnl = this.getWeeklyPnl();
        results.totalPnl = this.getTotalPnl();
        return results;
    }

    // Simulate a full week (5 trading days) and return end state
    simulateWeek(priceAtEnd) {
        const startPrice = this.currentStockPrice;
        const priceStep = (priceAtEnd - startPrice) / 5;
        let results = [];
        for (let i = 1; i <= 5; i++) {
            const dayPrice = startPrice + priceStep * i;
            results.push(this.advanceDay(dayPrice));
        }
        return results;
    }

    processWithdrawal(amount) {
        if (this.cash >= amount) {
            this.cash -= amount;
            return { withdrawn: amount, shortfall: 0, success: true };
        }
        const available = Math.max(0, this.cash);
        return { withdrawn: 0, shortfall: amount - available, success: false };
    }

    getStatus() {
        const status = {
            day: this.currentDay, week: this.weekNumber,
            stockPrice: this.currentStockPrice,
            cash: this.cash,
            totalValue: this.getTotalValue(),
            totalPnl: this.getTotalPnl(),
            weeklyPnl: this.getWeeklyPnl(),
            leaps: null,
            shortCall: null
        };

        if (this.leapsPosition) {
            const l = this.leapsPosition;
            status.leaps = { strike: l.strike, dte: l.dte, value: l.value, delta: l.delta, theta: l.theta, intrinsic: l.intrinsic, extrinsic: l.extrinsic, pnl: l.getPnl(), costBasis: l.costBasis };
        }

        if (this.shortCall) {
            const c = this.shortCall;
            status.shortCall = { strike: c.strike, dte: c.dte, premiumCollected: c.premiumCollected, currentValue: c.optionValue, pnl: c.getPnl() };
        }

        return status;
    }
}
