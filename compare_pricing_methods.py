#!/usr/bin/env python3
"""
Compare Black-Scholes (Ca.py) vs Empirical Pricing (our model)
Same position, same market conditions
"""

import math
import numpy as np
from scipy.stats import norm

# ===== BLACK-SCHOLES APPROACH (Ca.py) =====

def black_scholes_call(S, K, T, r, v):
    """Black-Scholes call option price"""
    if T <= 0 or v <= 0:
        return max(0, S - K)

    d1 = (np.log(S / K) + (r + (v**2) / 2) * T) / (v * np.sqrt(T))
    d2 = d1 - v * np.sqrt(T)

    price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return price

def black_scholes_delta(S, K, T, r, v):
    """Black-Scholes delta"""
    if T <= 0 or v <= 0:
        return 1 if S > K else 0

    d1 = (np.log(S / K) + (r + (v**2) / 2) * T) / (v * np.sqrt(T))
    return norm.cdf(d1)

# ===== EMPIRICAL APPROACH (Our Model) =====

def get_base_premium(dte):
    base_weekly = 650
    if dte <= 90:
        return base_weekly * math.sqrt(dte / 7)
    else:
        short_term = base_weekly * math.sqrt(90 / 7)
        days_above = dte - 90
        linear_bonus = days_above * 31.65
        return short_term + linear_bonus

def get_moneyness_multiplier(stock_price, strike, dte):
    distance = abs(stock_price - strike)
    percent_away = distance / stock_price

    if percent_away < 0.001: base = 1.00
    elif percent_away < 0.002: base = 1.00 - (percent_away - 0.001) / 0.001 * 0.02
    elif percent_away < 0.003: base = 0.98 - (percent_away - 0.002) / 0.001 * 0.02
    elif percent_away < 0.004: base = 0.96 - (percent_away - 0.003) / 0.001 * 0.02
    elif percent_away < 0.005: base = 0.94 - (percent_away - 0.004) / 0.001 * 0.02
    elif percent_away < 0.0075: base = 0.92 - (percent_away - 0.005) / 0.0025 * 0.07
    elif percent_away < 0.01: base = 0.85 - (percent_away - 0.0075) / 0.0025 * 0.05
    elif percent_away < 0.015: base = 0.80 - (percent_away - 0.01) / 0.005 * 0.15
    elif percent_away < 0.02: base = 0.65 - (percent_away - 0.015) / 0.005 * 0.20
    elif percent_away < 0.03: base = 0.45 - (percent_away - 0.02) / 0.01 * 0.15
    elif percent_away < 0.04: base = 0.30 - (percent_away - 0.03) / 0.01 * 0.15
    else: base = 0.15

    if dte < 90:
        return base
    elif dte < 300:
        transition = (dte - 90) / 210
        leaps_floor = 0.15 + (0.70 - 0.15) * transition
        return max(base, leaps_floor)
    else:
        return max(base, 0.70)

def get_volatility_multiplier(vix, stock_price, strike):
    base_vix = 15
    base_mult = (vix / base_vix) ** 1.3
    capped = min(base_mult, 5.0)

    moneyness = stock_price / strike
    percent_itm = (moneyness - 1) * 100

    if percent_itm >= 15:
        return 1.0 + (capped - 1.0) * 0.05
    elif percent_itm >= 10:
        factor = (percent_itm - 10) / 5
        reduction = 0.85 + factor * 0.10
        return 1.0 + (capped - 1.0) * (1.0 - reduction)
    elif percent_itm >= 5:
        factor = (percent_itm - 5) / 5
        reduction = 0.60 + factor * 0.25
        return 1.0 + (capped - 1.0) * (1.0 - reduction)
    elif percent_itm >= 2:
        factor = (percent_itm - 2) / 3
        reduction = 0.30 + factor * 0.30
        return 1.0 + (capped - 1.0) * (1.0 - reduction)

    return capped

def empirical_call_price(stock_price, strike, dte, vix):
    """Our empirical pricing model"""
    intrinsic = max(0, stock_price - strike) * 100

    base_premium = get_base_premium(dte)
    moneyness_mult = get_moneyness_multiplier(stock_price, strike, dte)
    time_mult = 1.0 if dte >= 7 else (0.35 if dte > 0 else 0.0)
    vol_mult = get_volatility_multiplier(vix, stock_price, strike)

    extrinsic = base_premium * moneyness_mult * time_mult * vol_mult
    total = intrinsic + extrinsic

    return total

def estimate_delta(stock_price, strike):
    """Rough delta estimation"""
    moneyness = stock_price / strike
    percent_itm = (moneyness - 1) * 100

    if percent_itm >= 20:
        return 0.98
    elif percent_itm >= 15:
        return 0.95 + (percent_itm - 15) / 5 * 0.03
    elif percent_itm >= 10:
        return 0.90 + (percent_itm - 10) / 5 * 0.05
    elif percent_itm >= 5:
        return 0.80 + (percent_itm - 5) / 5 * 0.10
    elif percent_itm >= 2:
        return 0.65 + (percent_itm - 2) / 3 * 0.15
    elif percent_itm >= -2:
        return 0.50 + percent_itm / 2 * 0.15
    else:
        return 0.30

# ===== COMPARISON =====

def compare_pricing():
    print("=" * 90)
    print("PRICING METHOD COMPARISON")
    print("=" * 90)
    print()

    # Test Case 1: Deep ITM LEAPS (typical position)
    print("TEST CASE 1: LEAPS Position (Deep ITM, Long DTE)")
    spy = 690
    strike = 630
    dte = 365
    vix = 16

    # Convert VIX to IV (rough approximation: IV ≈ VIX%)
    iv = vix / 100
    r = 0.05
    T = dte / 365.0

    print(f"  SPY: ${spy}, Strike: ${strike}, DTE: {dte} days")
    print(f"  Moneyness: {((spy - strike) / spy * 100):.1f}% ITM")
    print(f"  VIX: {vix} (IV: {iv:.2%})")
    print()

    # Black-Scholes
    bs_price = black_scholes_call(spy, strike, T, r, iv) * 100
    bs_delta = black_scholes_delta(spy, strike, T, r, iv)
    bs_intrinsic = max(0, spy - strike) * 100
    bs_extrinsic = bs_price - bs_intrinsic

    print(f"  BLACK-SCHOLES:")
    print(f"    Total:      ${bs_price:,.0f}")
    print(f"    Intrinsic:  ${bs_intrinsic:,.0f}")
    print(f"    Extrinsic:  ${bs_extrinsic:,.0f}")
    print(f"    Delta:      {bs_delta:.3f}")
    print()

    # Empirical
    emp_price = empirical_call_price(spy, strike, dte, vix)
    emp_delta = estimate_delta(spy, strike)
    emp_intrinsic = max(0, spy - strike) * 100
    emp_extrinsic = emp_price - emp_intrinsic

    print(f"  EMPIRICAL (Our Model):")
    print(f"    Total:      ${emp_price:,.0f}")
    print(f"    Intrinsic:  ${emp_intrinsic:,.0f}")
    print(f"    Extrinsic:  ${emp_extrinsic:,.0f}")
    print(f"    Delta:      {emp_delta:.3f}")
    print()

    diff = emp_price - bs_price
    diff_pct = (diff / bs_price) * 100
    print(f"  DIFFERENCE: ${diff:+,.0f} ({diff_pct:+.1f}%)")
    print()
    print("=" * 90)
    print()

    # Test Case 2: Shorter DTE (closer to expiration)
    print("TEST CASE 2: Same Position After 6 Months (DTE = 183)")
    spy2 = 705
    dte2 = 183
    vix2 = 18
    iv2 = vix2 / 100
    T2 = dte2 / 365.0

    print(f"  SPY: ${spy2}, Strike: ${strike}, DTE: {dte2} days")
    print(f"  Moneyness: {((spy2 - strike) / spy2 * 100):.1f}% ITM")
    print(f"  VIX: {vix2} (IV: {iv2:.2%})")
    print()

    # Black-Scholes
    bs_price2 = black_scholes_call(spy2, strike, T2, r, iv2) * 100
    bs_delta2 = black_scholes_delta(spy2, strike, T2, r, iv2)
    bs_intrinsic2 = max(0, spy2 - strike) * 100
    bs_extrinsic2 = bs_price2 - bs_intrinsic2

    print(f"  BLACK-SCHOLES:")
    print(f"    Total:      ${bs_price2:,.0f}")
    print(f"    Intrinsic:  ${bs_intrinsic2:,.0f}")
    print(f"    Extrinsic:  ${bs_extrinsic2:,.0f}")
    print(f"    Delta:      {bs_delta2:.3f}")
    print()

    # Empirical
    emp_price2 = empirical_call_price(spy2, strike, dte2, vix2)
    emp_delta2 = estimate_delta(spy2, strike)
    emp_intrinsic2 = max(0, spy2 - strike) * 100
    emp_extrinsic2 = emp_price2 - emp_intrinsic2

    print(f"  EMPIRICAL (Our Model):")
    print(f"    Total:      ${emp_price2:,.0f}")
    print(f"    Intrinsic:  ${emp_intrinsic2:,.0f}")
    print(f"    Extrinsic:  ${emp_extrinsic2:,.0f}")
    print(f"    Delta:      {emp_delta2:.3f}")
    print()

    diff2 = emp_price2 - bs_price2
    diff_pct2 = (diff2 / bs_price2) * 100
    print(f"  DIFFERENCE: ${diff2:+,.0f} ({diff_pct2:+.1f}%)")
    print()
    print("=" * 90)
    print()

    # Theta decay comparison
    print("THETA DECAY COMPARISON (6 months)")
    bs_theta = bs_price - bs_price2
    emp_theta = emp_price - emp_price2

    print(f"  Black-Scholes theta decay: ${bs_theta:,.0f} (${bs_theta/26:.0f}/week)")
    print(f"  Empirical theta decay:     ${emp_theta:,.0f} (${emp_theta/26:.0f}/week)")
    print(f"  Difference:                ${emp_theta - bs_theta:+,.0f}")
    print()

if __name__ == "__main__":
    compare_pricing()
