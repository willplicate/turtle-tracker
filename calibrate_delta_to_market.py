"""
Calibrate delta model to match real market data from OptionStrat
"""

import math

def market_calibrated_delta(stock_price, strike, dte):
    """
    Delta calculator calibrated to real market data

    Key insight from OptionStrat:
    - $620 strike at $681.74 SPY (~9% ITM)
    - 189 DTE: delta = 0.802
    - 336 DTE: delta = 0.785
    - Difference: only 1.7 delta points over 147 days!

    This means DTE has a MUCH smaller effect than previously modeled.
    """
    percent_itm = ((stock_price - strike) / stock_price) * 100

    # Base delta from moneyness (this is the dominant factor)
    if percent_itm >= 15:
        base_delta = 0.95
    elif percent_itm >= 10:
        base_delta = 0.90 + (percent_itm - 10) / 5 * 0.05
    elif percent_itm >= 5:
        base_delta = 0.75 + (percent_itm - 5) / 5 * 0.15
    elif percent_itm >= 1:
        base_delta = 0.60 + (percent_itm - 1) / 4 * 0.15
    elif percent_itm >= 0:
        base_delta = 0.52 + percent_itm * 0.08
    elif percent_itm >= -1:
        base_delta = 0.52 + percent_itm * 0.08
    elif percent_itm >= -5:
        base_delta = 0.44 + (percent_itm + 1) / 4 * 0.14
    else:
        base_delta = max(0.10, 0.30 + (percent_itm + 5) / 5 * 0.20)

    # DTE adjustment - MUCH weaker than before!
    # Real market shows only ~1.7 delta points over 147 days
    # That's about 0.0116 points per day, or ~1 point per 86 days

    if percent_itm > 0:  # ITM option
        # For deep ITM options, DTE effect is minimal
        # Scale: 1 delta point per ~100 days difference

        # Reference DTE: 365 days
        dte_diff_from_year = (dte - 365) / 100.0  # How many 100-day increments from 1 year

        # Adjustment is very small: ~1 delta point per 100 days
        itm_strength = min(1.0, percent_itm / 15)
        delta_adjustment = dte_diff_from_year * 0.01 * itm_strength

        # Longer DTE = slightly lower delta
        adjusted_delta = base_delta - delta_adjustment

        return max(0.50, min(1.0, adjusted_delta))
    else:
        # OTM: longer DTE = slightly higher delta
        dte_diff_from_year = (dte - 365) / 100.0
        otm_strength = min(1.0, abs(percent_itm) / 15)
        delta_adjustment = dte_diff_from_year * 0.01 * otm_strength

        adjusted_delta = base_delta + delta_adjustment

        return max(0.0, min(0.50, adjusted_delta))


def test_against_market_data():
    """
    Test our calibrated model against real OptionStrat data
    """
    print("=" * 80)
    print("CALIBRATED MODEL VS. REAL MARKET DATA")
    print("=" * 80)
    print()

    # Real market data from OptionStrat
    print("OptionStrat Data: $620 strike at $681.74 SPY")
    print()

    stock = 681.74
    strike = 620
    itm = stock - strike
    pct_itm = (itm / stock) * 100

    print(f"Amount ITM: ${itm:.2f}")
    print(f"Percent ITM: {pct_itm:.2f}%")
    print()

    print(f"{'DTE':<8} {'Market Delta':<15} {'Model Delta':<15} {'Diff':<10}")
    print("-" * 55)

    # Real market data points
    market_data = [
        (189, 0.802),
        (336, 0.785),
    ]

    for dte, market_delta in market_data:
        model_delta = market_calibrated_delta(stock, strike, dte)
        diff = abs(market_delta - model_delta)
        print(f"{dte:<8} {market_delta:<15.3f} {model_delta:<15.3f} {diff:<10.3f}")

    print()
    print("=" * 80)
    print("KEY INSIGHT: DTE has minimal effect on delta!")
    print("Delta is primarily driven by MONEYNESS, not time.")
    print("=" * 80)
    print()


def test_user_scenario():
    """
    Test the user's original scenario with calibrated model
    """
    print("=" * 80)
    print("USER'S SCENARIO: $530 strike at $590 SPY")
    print("=" * 80)
    print()

    stock = 590
    strike = 530
    itm = stock - strike
    pct_itm = (itm / stock) * 100

    print(f"Amount ITM: ${itm}")
    print(f"Percent ITM: {pct_itm:.2f}%")
    print()

    print(f"{'DTE':<8} {'Delta':<10} {'Change from 200 DTE':<25}")
    print("-" * 50)

    reference_delta = market_calibrated_delta(stock, strike, 200)

    for dte in [50, 100, 200, 300, 450]:
        delta = market_calibrated_delta(stock, strike, dte)
        change = delta - reference_delta
        print(f"{dte:<8} {delta:<10.3f} {change:>+7.3f} ({change*1000:+.1f} basis points)")

    print()
    print("Notice: Delta changes are VERY SMALL with DTE!")
    print()


def test_rolling_scenarios():
    """
    Test when you should roll based on realistic criteria
    """
    print("=" * 80)
    print("ROLLING CRITERIA - REALISTIC")
    print("=" * 80)
    print()

    print("You should roll LEAPS when:")
    print("1. Delta drops below 0.75 (due to PRICE DROP)")
    print("2. DTE drops below 180 days (theta acceleration)")
    print()

    # Scenario: Started with $530 strike at $590 SPY, 365 DTE
    strike = 530
    initial_dte = 365

    print("Scenario: Started with $530 strike, 365 DTE")
    print()
    print(f"{'SPY Price':<12} {'DTE':<8} {'$ ITM':<10} {'% ITM':<10} {'Delta':<10} {'Roll?':<30}")
    print("-" * 90)

    scenarios = [
        # (spy_price, dte, description)
        (590, 365, "Initial position"),
        (590, 200, "6 months later (time decay only)"),
        (590, 179, "DTE < 180 - TIME TO ROLL!"),
        (580, 200, "Down $10 - still OK"),
        (570, 200, "Down $20 - getting low"),
        (560, 200, "Down $30 - delta critical"),
        (555, 200, "Down $35 - MUST ROLL (delta < 0.75)"),
    ]

    for spy, dte, desc in scenarios:
        itm = spy - strike
        pct_itm = (itm / spy) * 100
        delta = market_calibrated_delta(spy, strike, dte)

        # Determine if should roll
        roll_reason = []
        if delta < 0.75:
            roll_reason.append("Delta < 0.75")
        if dte < 180:
            roll_reason.append("DTE < 180")

        roll_msg = " & ".join(roll_reason) if roll_reason else "No"

        print(f"${spy:<11} {dte:<8} ${itm:<9} {pct_itm:>6.1f}%   {delta:<10.3f} {roll_msg:<30}")

    print()
    print("=" * 80)
    print("ROLLING RULES:")
    print("=" * 80)
    print()
    print("1. Roll when DELTA < 0.75:")
    print("   - This happens when PRICE DROPS, not time passing")
    print("   - You're losing market exposure")
    print("   - Roll to a deeper ITM strike to restore delta")
    print()
    print("2. Roll when DTE < 180:")
    print("   - Theta decay accelerates as expiration approaches")
    print("   - This is expensive to hold")
    print("   - Roll to a longer-dated LEAPS (e.g., 365+ DTE)")
    print()
    print("DTE effect on delta is MINIMAL - don't worry about it!")
    print("Focus on: (1) Price drops → delta drops, (2) Time → theta accelerates")
    print()


if __name__ == "__main__":
    test_against_market_data()
    print()
    test_user_scenario()
    print()
    test_rolling_scenarios()
