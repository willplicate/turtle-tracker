"""
Delta Calculator with DTE sensitivity
Implements a more realistic delta that changes based on both moneyness AND time to expiration
"""

import math
from scipy.stats import norm


def black_scholes_delta(stock_price, strike, dte, volatility=0.15, risk_free_rate=0.04):
    """
    Calculate Black-Scholes delta for a call option

    Args:
        stock_price: Current stock price
        strike: Strike price
        dte: Days to expiration
        volatility: Implied volatility (annualized, default 15% for SPY)
        risk_free_rate: Risk-free rate (annualized, default 4%)

    Returns:
        delta: Option delta (0 to 1 for calls)
    """
    # Convert DTE to years
    T = dte / 365.0

    # Handle edge cases
    if T <= 0:
        # Expired option
        return 1.0 if stock_price > strike else 0.0

    if stock_price <= 0 or strike <= 0:
        return 0.0

    # Calculate d1
    d1 = (math.log(stock_price / strike) + (risk_free_rate + 0.5 * volatility**2) * T) / (volatility * math.sqrt(T))

    # Delta is N(d1) where N is cumulative normal distribution
    delta = norm.cdf(d1)

    return delta


def simplified_delta(stock_price, strike, dte, moneyness_weight=0.7, time_weight=0.3):
    """
    Simplified delta calculator that doesn't require scipy
    Uses a hybrid approach: primarily moneyness-based, with DTE adjustment

    Args:
        stock_price: Current stock price
        strike: Strike price
        dte: Days to expiration
        moneyness_weight: Weight for moneyness factor (default 0.7)
        time_weight: Weight for time factor (default 0.3)

    Returns:
        delta: Option delta (0 to 1 for calls)
    """
    # Calculate moneyness
    percent_itm = ((stock_price - strike) / stock_price) * 100

    # Base delta from moneyness (similar to your current model)
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

    # Time factor: shorter DTE = delta moves toward 0 or 1 (more certainty)
    # Longer DTE = delta moves toward 0.5 (more uncertainty)
    # This is the key improvement!

    # Target delta based on DTE (for deeply ITM options)
    # At DTE=0: delta=1.0 (certain)
    # At DTE=730 (2 years): delta pulls toward 0.5 (uncertain)

    if percent_itm > 0:  # ITM option
        # For ITM, longer DTE means delta decreases (more uncertainty)
        # Use exponential decay: as DTE increases, delta decreases
        dte_adjustment = math.exp(-dte / 730)  # 730 days = 2 years
        # dte_adjustment: 0 DTE = 1.0, 365 DTE = 0.606, 730 DTE = 0.368

        # Deep ITM: strong adjustment (delta decreases more with longer DTE)
        # Slightly ITM: weak adjustment (delta stays closer to base)
        itm_strength = min(1.0, percent_itm / 15)  # 0 to 1 based on how deep ITM

        # Adjusted delta: longer DTE pulls delta down from base_delta
        # Deep ITM with long DTE: significant decrease
        # Slightly ITM with long DTE: minimal decrease
        time_adjusted_delta = base_delta - (base_delta - 0.5) * (1 - dte_adjustment) * itm_strength * 0.5

    else:  # OTM option
        # For OTM, longer DTE means delta increases (more chance to get ITM)
        dte_adjustment = math.exp(-dte / 730)

        otm_strength = min(1.0, abs(percent_itm) / 15)

        # Adjusted delta: longer DTE pulls delta up from base_delta toward 0.5
        time_adjusted_delta = base_delta + (0.5 - base_delta) * (1 - dte_adjustment) * otm_strength * 0.5

    return time_adjusted_delta


def compare_deltas(stock_price, strike, dte):
    """
    Compare Black-Scholes delta vs simplified delta
    """
    bs_delta = black_scholes_delta(stock_price, strike, dte)
    simple_delta = simplified_delta(stock_price, strike, dte)

    percent_itm = ((stock_price - strike) / stock_price) * 100

    return {
        'stock_price': stock_price,
        'strike': strike,
        'percent_itm': percent_itm,
        'dte': dte,
        'black_scholes_delta': bs_delta,
        'simplified_delta': simple_delta,
        'difference': abs(bs_delta - simple_delta)
    }


def test_delta_scenarios():
    """
    Test delta calculations across various scenarios
    """
    print("=" * 100)
    print("DELTA CALCULATOR TEST - Various Scenarios")
    print("=" * 100)
    print()

    # Test cases
    scenarios = [
        # (stock_price, strike, dte, description)
        (590, 530, 200, "$60 ITM, 200 DTE (Your example)"),
        (590, 530, 360, "$60 ITM, 360 DTE"),
        (590, 530, 450, "$60 ITM, 450 DTE"),
        (590, 510, 200, "$80 ITM, 200 DTE"),
        (590, 510, 360, "$80 ITM, 360 DTE"),
        (590, 510, 450, "$80 ITM, 450 DTE"),
        (590, 490, 200, "$100 ITM (deepest), 200 DTE"),
        (590, 490, 360, "$100 ITM (deepest), 360 DTE"),
        (590, 490, 450, "$100 ITM (deepest), 450 DTE"),
        # What happens when price drops?
        (570, 530, 200, "$40 ITM (was $60), 200 DTE - price dropped $20"),
        (550, 530, 200, "$20 ITM (was $60), 200 DTE - price dropped $40"),
    ]

    print(f"{'Description':<45} {'%ITM':<8} {'DTE':<6} {'BS Delta':<10} {'Simple':<10} {'Diff':<8}")
    print("-" * 100)

    for stock, strike, dte, desc in scenarios:
        result = compare_deltas(stock, strike, dte)
        print(f"{desc:<45} {result['percent_itm']:>6.1f}% {result['dte']:>5} "
              f"{result['black_scholes_delta']:>9.3f} {result['simplified_delta']:>9.3f} "
              f"{result['difference']:>7.3f}")

    print()
    print("=" * 100)
    print("KEY INSIGHTS:")
    print("=" * 100)
    print("1. Longer DTE = Lower delta for ITM options (more uncertainty)")
    print("2. Shorter DTE = Higher delta for ITM options (more certainty, approaches 1.0)")
    print("3. When price drops, % ITM decreases, and delta decreases")
    print("4. This is critical for your trading rules - you'll need to roll/adjust when delta drops!")
    print()


def test_your_specific_case():
    """
    Test the specific case from your screenshot
    """
    print("=" * 100)
    print("YOUR SPECIFIC CASE: $530 strike, $590 SPY, 200 DTE")
    print("=" * 100)
    print()

    stock_price = 590
    strike = 530
    dte = 200

    percent_itm = ((stock_price - strike) / stock_price) * 100

    print(f"Stock Price: ${stock_price}")
    print(f"Strike: ${strike}")
    print(f"Amount ITM: ${stock_price - strike}")
    print(f"Percent ITM: {percent_itm:.2f}%")
    print(f"DTE: {dte} days")
    print()

    # Current (wrong) delta - just based on moneyness
    if percent_itm >= 10:
        old_delta = 0.85
    print(f"Current model delta (moneyness only): {old_delta:.3f}")
    print()

    # New calculations
    bs_delta = black_scholes_delta(stock_price, strike, dte)
    simple_delta = simplified_delta(stock_price, strike, dte)

    print(f"Black-Scholes delta (accurate): {bs_delta:.3f}")
    print(f"Simplified delta (DTE-aware): {simple_delta:.3f}")
    print()

    # Show how delta changes with DTE
    print("How delta changes with DTE (same strike, same stock price):")
    print(f"{'DTE':<6} {'Delta (BS)':<12} {'Delta (Simple)':<15}")
    print("-" * 40)
    for test_dte in [50, 100, 200, 300, 450, 600]:
        bs = black_scholes_delta(stock_price, strike, test_dte)
        simple = simplified_delta(stock_price, strike, test_dte)
        print(f"{test_dte:<6} {bs:<12.3f} {simple:<15.3f}")

    print()
    print("Notice: Delta DECREASES as DTE increases!")
    print()


if __name__ == "__main__":
    test_your_specific_case()
    print()
    test_delta_scenarios()
