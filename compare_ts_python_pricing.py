#!/usr/bin/env python3
"""
Compare TypeScript LEAPS pricing vs Python pricer
Uses scenarios from the Monte Carlo CSV to validate both models match
"""

import subprocess
import json
import pandas as pd
from pathlib import Path

# Import the Python pricing function
import sys
sys.path.append('/Users/williamford/Documents/AI-Coding/Turtle Game')
from turtle_game.src.lib.pricing.options_pricing import calculate_option_price

def get_ts_price(stock_price: float, strike: float, dte: int, vix: float) -> dict:
    """Get price from TypeScript model via tsx execution"""

    # Create a small TypeScript test file
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

    # Write to temp file
    temp_file = Path('/tmp/test_pricing.ts')
    temp_file.write_text(ts_code)

    # Execute with tsx
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

def compare_pricing():
    """Compare TypeScript and Python pricing for key scenarios"""

    print("=" * 80)
    print("LEAPS PRICING COMPARISON: TypeScript vs Python")
    print("=" * 80)
    print()

    # Test scenarios from the CSV
    scenarios = [
        # Week 1 scenario
        {
            "name": "Week 1: 8% ITM, 365 DTE",
            "stock_price": 594.05,
            "strike": 550,  # ~8% ITM
            "dte": 365,
            "vix": 14.4,
        },
        # Week 10 scenario
        {
            "name": "Week 10: Similar ITM, 325 DTE",
            "stock_price": 576.98,
            "strike": 550,
            "dte": 325,  # 10 weeks later
            "vix": 22.0,
        },
        # Week 20 scenario
        {
            "name": "Week 20: Deep ITM, 225 DTE",
            "stock_price": 674.89,
            "strike": 550,
            "dte": 225,  # 20 weeks later
            "vix": 15.0,
        },
        # ATM LEAPS
        {
            "name": "ATM LEAPS: 365 DTE",
            "stock_price": 597.00,
            "strike": 597,
            "dte": 365,
            "vix": 15.8,
        },
        # Weekly comparison
        {
            "name": "ATM Weekly: 7 DTE",
            "stock_price": 597.00,
            "strike": 597,
            "dte": 7,
            "vix": 15.8,
        },
    ]

    results = []

    for scenario in scenarios:
        print(f"\n{scenario['name']}")
        print(f"  SPY: ${scenario['stock_price']:.2f}, Strike: ${scenario['strike']}, "
              f"DTE: {scenario['dte']}, VIX: {scenario['vix']}")
        print("-" * 80)

        # Get Python pricing
        py_price = calculate_option_price(
            stock_price=scenario['stock_price'],
            strike=scenario['strike'],
            dte=scenario['dte'],
            vix=scenario['vix'],
            is_call=True
        )

        # Get TypeScript pricing
        ts_price = get_ts_price(
            scenario['stock_price'],
            scenario['strike'],
            scenario['dte'],
            scenario['vix']
        )

        if ts_price is None:
            print("  ❌ TypeScript pricing failed")
            continue

        # Compare
        total_diff = ts_price['total'] - py_price['total']
        total_pct_diff = (total_diff / py_price['total']) * 100 if py_price['total'] > 0 else 0

        extrinsic_diff = ts_price['extrinsic'] - py_price['extrinsic']
        extrinsic_pct_diff = (extrinsic_diff / py_price['extrinsic']) * 100 if py_price['extrinsic'] > 0 else 0

        print(f"  Python:     Total=${py_price['total']:>7,.0f}  "
              f"Intrinsic=${py_price['intrinsic']:>7,.0f}  "
              f"Extrinsic=${py_price['extrinsic']:>7,.0f}  "
              f"Delta={py_price['delta']:.3f}")

        print(f"  TypeScript: Total=${ts_price['total']:>7,.0f}  "
              f"Intrinsic=${ts_price['intrinsic']:>7,.0f}  "
              f"Extrinsic=${ts_price['extrinsic']:>7,.0f}  "
              f"Delta={ts_price['delta']:.3f}")

        print(f"  Difference: Total=${total_diff:>7,.0f} ({total_pct_diff:+.1f}%)  "
              f"Extrinsic=${extrinsic_diff:>7,.0f} ({extrinsic_pct_diff:+.1f}%)")

        # Check if within acceptable range (±5%)
        if abs(total_pct_diff) <= 5.0:
            print(f"  ✅ MATCH (within 5%)")
        else:
            print(f"  ⚠️  MISMATCH (>{abs(total_pct_diff):.1f}% difference)")

        results.append({
            'scenario': scenario['name'],
            'py_total': py_price['total'],
            'ts_total': ts_price['total'],
            'diff': total_diff,
            'diff_pct': total_pct_diff,
        })

    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    matches = sum(1 for r in results if abs(r['diff_pct']) <= 5.0)
    print(f"Scenarios tested: {len(results)}")
    print(f"Matches (±5%): {matches}/{len(results)}")
    print(f"Mismatches: {len(results) - matches}/{len(results)}")

    if matches == len(results):
        print("\n✅ All pricing models match! TypeScript and Python are aligned.")
    else:
        print("\n⚠️  Some pricing discrepancies detected. Review differences above.")

if __name__ == "__main__":
    compare_pricing()
