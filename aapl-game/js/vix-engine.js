// vix-engine.js — translated from advanced_pricing_with_vix.py

class VIXSimulator {
    constructor(initialVix = 15.0, meanVix = 16.0) {
        this.currentVix = initialVix;
        this.meanVix = meanVix;
        this.vixHistory = [initialVix];
        this.inverseCorrelation = -0.12;
        this.meanReversionSpeed = 0.08;
        this.vixFloor = 9.0;
        this.vixCeiling = 80.0;
    }

    update(stockPctChange) {
        let vixChangeFromStock;
        if (stockPctChange < 0) {
            vixChangeFromStock = stockPctChange * this.inverseCorrelation * 1.5;
        } else {
            vixChangeFromStock = stockPctChange * this.inverseCorrelation * 0.8;
        }

        const distanceFromMean = this.currentVix - this.meanVix;
        const meanReversionChange = -distanceFromMean * this.meanReversionSpeed;
        const totalChangePct = vixChangeFromStock + meanReversionChange;
        let newVix = this.currentVix * (1 + totalChangePct);
        newVix = Math.max(this.vixFloor, Math.min(this.vixCeiling, newVix));

        this.currentVix = newVix;
        this.vixHistory.push(newVix);
        return newVix;
    }

    getIvMultiplier(baseVix = 15.0) {
        return this.currentVix / baseVix;
    }

    getStatus() {
        return { currentVix: this.currentVix, meanVix: this.meanVix, ivMultiplier: this.getIvMultiplier(), regime: this._getRegime() };
    }

    _getRegime() {
        if (this.currentVix < 12) return 'COMPLACENT';
        if (this.currentVix < 18) return 'NORMAL';
        if (this.currentVix < 25) return 'ELEVATED';
        if (this.currentVix < 35) return 'HIGH';
        return 'PANIC';
    }
}

class AdvancedShortCall {
    constructor(stockPrice, strike, dte, vix, baseVix = 15.0) {
        this.strike = strike;
        this.dte = dte;
        this.openingStockPrice = stockPrice;
        this.openingVix = vix;
        this.baseVix = baseVix;
        this.premiumCollected = this._calculatePremiumWithVix(stockPrice, strike, dte, vix, baseVix);
        this.optionValue = this.premiumCollected;
    }

    _calculatePremiumWithVix(stockPrice, strike, dte, vix, baseVix = 15.0) {
        return this._getPremiumBreakdown(stockPrice, strike, dte, vix, baseVix).totalPremium;
    }

    _getPremiumBreakdown(stockPrice, strike, dte, vix, baseVix = 15.0) {
        const intrinsic = Math.max(0, stockPrice - strike) * 100;
        const baseExtrinsic7dte = 450;
        const timeFactor = dte / 7;
        const distanceFromStrike = stockPrice - strike;
        const percentDiff = (distanceFromStrike / strike) * 100;
        const absPercent = Math.abs(percentDiff);

        let moneynessFactor;
        if (absPercent < 0.1) moneynessFactor = 1.0;
        else if (absPercent < 0.2) moneynessFactor = 1.0 - (absPercent - 0.1) * 0.4;
        else if (absPercent < 0.35) moneynessFactor = 0.96 - (absPercent - 0.2) * 0.8;
        else if (absPercent < 0.5) moneynessFactor = 0.84 - (absPercent - 0.35) * 1.2;
        else moneynessFactor = Math.max(0.3, 0.66 - (absPercent - 0.5) * 0.8);

        const baseExtrinsic = baseExtrinsic7dte * timeFactor * moneynessFactor;

        let vegaFactor;
        if (absPercent < 0.2) vegaFactor = 1.0;
        else if (absPercent < 0.35) vegaFactor = 0.8;
        else if (absPercent < 0.5) vegaFactor = 0.6;
        else vegaFactor = 0.4;

        const baseMultiplier = Math.sqrt(vix / baseVix) * 1.3;
        const ivMultiplier = 1.0 + (baseMultiplier - 1.0) * vegaFactor;
        const totalExtrinsic = baseExtrinsic * ivMultiplier;
        const vixPremium = totalExtrinsic - baseExtrinsic;

        return { intrinsic, baseExtrinsic, vixPremium, totalExtrinsic, basePremium: intrinsic + baseExtrinsic, totalPremium: intrinsic + totalExtrinsic, vegaFactor, ivMultiplier };
    }

    updateValue(newStockPrice, newVix, baseVix = 15.0) {
        const oldValue = this.optionValue;
        this.dte = Math.max(0, this.dte - 1);

        if (this.dte === 0) {
            this.optionValue = Math.max(0, newStockPrice - this.strike) * 100;
        } else {
            this.optionValue = this._calculatePremiumWithVix(newStockPrice, this.strike, this.dte, newVix, baseVix);
        }

        return { optionValue: this.optionValue, dailyPnl: oldValue - this.optionValue, dte: this.dte, currentVix: newVix };
    }

    getPnl() {
        return this.premiumCollected - this.optionValue;
    }
}
