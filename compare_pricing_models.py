#!/usr/bin/env python3
"""
Compare TypeScript and Python LEAPS pricing
Implements the UPDATED pricing model in Python to match TypeScript
"""

import math
import subprocess
import json
from pathlib import Path

# ============================================================================
# PYTHON IMPLEMENTATION OF UPDATED PRICING MODEL
# ============================================================================

def get_base_premium(dte):
    """
    Base premium with enhanced LEAPS scaling
    Matches TypeScript: optionsPricing.ts lines 39-59
    """
    base_weekly = 650  # $650 for 7 DTE at ATM, VIX 15

    if dte <= 90:
        # Short-term: use sqrt scaling
        return base_weekly * math.sqrt(dte / 7)
    else:
        # Long-term: transition from sqrt to linear
        short_term_premium = base_weekly * math.sqrt(90 / 7)  # $2,347
        days_above_90 = dte - 90
        linear_bonus = days_above_90 * 31.65  # Linear scaling for LEAPS
        return short_term_premium + linear_bonus


def get_moneyness_multiplier(stock_price, strike, dte):
    """
    DTE-aware moneyness multiplier
    Matches TypeScript: optionsPricing.ts lines 49-95
    """
    distance = abs(stock_price - strike)
    percent_away = distance / stock_price

    # Base multiplier (for weeklies)
    if percent_away < 0.001:
        base = 1.00
    elif percent_away < 0.002:
        base = 1.00 - (percent_away - 0.001) / 0.001 * 0.02
    elif percent_away < 0.003:
        base = 0.98 - (percent_away - 0.002) / 0.001 * 0.02
    elif percent_away < 0.004:
        base = 0.96 - (percent_away - 0.003) / 0.001 * 0.02
    elif percent_away < 0.005:
        base = 0.94 - (percent_away - 0.004) / 0.001 * 0.02
    elif percent_away < 0.0075:
        base = 0.92 - (percent_away - 0.005) / 0.0025 * 0.07
    elif percent_away < 0.01:
        base = 0.85 - (percent_away - 0.0075) / 0.0025 * 0.05
    elif percent_away < 0.015:
        base = 0.80 - (percent_away - 0.01) / 0.005 * 0.15
    elif percent_away < 0.02:
        base = 0.65 - (percent_away - 0.015) / 0.005 * 0.20
    elif percent_away < 0.03:
        base = 0.45 - (percent_away - 0.02) / 0.01 * 0.15
    elif percent_away < 0.04:
        base = 0.30 - (percent_away - 0.03) / 0.01 * 0.15
    else:
        base = 0.15

    # DTE adjustment for LEAPS
    if dte < 90:
        return base
    elif dte < 300:
        # Intermediate: gradual transition
        transition_factor = (dte - 90) / 210
        leaps_floor = 0.15 + (0.70 - 0.15) * transition_factor
        return max(base, leaps_floor)
    else:
        # LEAPS: preserve 70% minimum
        return max(base, 0.70)


def get_time_multiplier(dte):
    """Time multiplier based on DTE"""
    if dte >= 7:
        return 1.00
    elif dte >= 5:
        return 0.90
    elif dte >= 3:
        return 0.75
    elif dte >= 1:
        return 0.60
    elif dte > 0:
        return 0.35
    else:
        return 0.00


def get_volatility_multiplier(vix, stock_price, strike):
    """VIX multiplier with ITM reduction"""
    base_vix = 15
    base_mult = (vix / base_vix) ** 1.3
    capped = min(base_mult, 5.0)

    # Reduce VIX sensitivity for ITM options
    moneyness = stock_price / strike
    percent_itm = (moneyness - 1) * 100

    if percent_itm >= 10:
        itm_factor = min((percent_itm - 10) / 10, 1.0)
        return 1.0 + (capped - 1.0) * (1.0 - itm_factor * 0.8)
    elif percent_itm >= 5:
        itm_factor = (percent_itm - 5) / 5
        return 1.0 + (capped - 1.0) * (1.0 - itm_factor * 0.4)
    else:
        return capped


def calculate_intrinsic(stock_price, strike):
    """Calculate intrinsic value for call"""
    return max(0, stock_price - strike) * 100


def calculate_option_price_python(stock_price, strike, dte, vix):
    """Complete pricing calculation - Python implementation"""
    intrinsic = calculate_intrinsic(stock_price, strike)

    base_premium = get_base_premium(dte)
    moneyness_mult = get_moneyness_multiplier(stock_price, strike, dte)
    time_mult = get_time_multiplier(dte)
    vol_mult = get_volatility_multiplier(vix, stock_price, strike)

    extrinsic = base_premium * moneyness_mult * time_mult * vol_mult
    total = intrinsic + extrinsic

    return {
        'intrinsic': round(intrinsic),
        'extrinsic': round(extrinsic),
        'total': round(total),
    }


# ============================================================================
# TYPESCRIPT CALLER
# ============================================================================

def get_ts_price(stock_price, strike, dte, vix):
    """Get price from TypeScript model"""
    ts_code = f"""
import {{ calculateOptionPrice }} from './turtle-game/src/lib/pricing/optionsPricing';

const result = calculateOptionPrice({{
  stockPrice: {stock_price},
  strike: {strike},
  dte: {dte},
  vix: {vix},
  isCall: true,
}});

console.log(JSON.stringify(result));
"""

    temp_file = Path('/tmp/test_pricing.ts')
    temp_file.write_text(ts_code)

    result = subprocess.run(
        ['npx', 'tsx', str(temp_file)],
        capture_output=True,
        text=True,
        cwd='/Users/williamford/Documents/AI-Coding/Turtle Game'
    )

    if result.returncode != 0:
        print(f"TypeScript error: {result.stderr}")
        return None

    return json.loads(result.stdout.strip())


# ============================================================================
# COMPARISON
# ============================================================================

def main():
    print("=" * 90)
    print("LEAPS PRICING VALIDATION: TypeScript vs Python (Updated Model)")
    print("=" * 90)
    print()

    # Test scenarios from Monte Carlo simulation
    scenarios = [
        ("Week 1: 8% ITM, 365 DTE", 594.05, 550, 365, 14.4),
        ("Week 10: 5% ITM, 325 DTE", 576.98, 550, 325, 22.0),
        ("Week 20: 23% ITM, 225 DTE", 674.89, 550, 225, 15.0),
        ("ATM LEAPS: 365 DTE", 597.00, 597, 365, 15.8),
        ("ATM Weekly: 7 DTE", 597.00, 597, 7, 15.8),
        ("Validation Test: Original", 597.59, 550, 365, 15.8),
    ]

    mismatches = []

    for name, stock, strike, dte, vix in scenarios:
        print(f"\n{name}")
        print(f"  Input: SPY=${stock:.2f}, Strike=${strike}, DTE={dte}, VIX={vix}")
        print("-" * 90)

        # Python
        py = calculate_option_price_python(stock, strike, dte, vix)

        # TypeScript
        ts = get_ts_price(stock, strike, dte, vix)

        if not ts:
            print("  ❌ TypeScript failed")
            continue

        # Compare
        diff = ts['total'] - py['total']
        pct = (diff / py['total'] * 100) if py['total'] > 0 else 0

        print(f"  Python:     Total=${py['total']:>8,}  "
              f"Intrinsic=${py['intrinsic']:>8,}  Extrinsic=${py['extrinsic']:>8,}")
        print(f"  TypeScript: Total=${ts['total']:>8,}  "
              f"Intrinsic=${ts['intrinsic']:>8,}  Extrinsic=${ts['extrinsic']:>8,}")
        print(f"  Difference: ${diff:>8,} ({pct:+.2f}%)", end="  ")

        if abs(pct) <= 2.0:
            print("✅ MATCH")
        else:
            print("⚠️  MISMATCH")
            mismatches.append((name, pct))

    print("\n" + "=" * 90)
    print("SUMMARY")
    print("=" * 90)
    print(f"Scenarios tested: {len(scenarios)}")
    print(f"Matches (±2%): {len(scenarios) - len(mismatches)}/{len(scenarios)}")

    if not mismatches:
        print("\n✅ All models match! TypeScript and Python are aligned.")
    else:
        print(f"\n⚠️  {len(mismatches)} mismatch(es) detected:")
        for name, pct in mismatches:
            print(f"  - {name}: {pct:+.2f}%")


if __name__ == "__main__":
    main()
