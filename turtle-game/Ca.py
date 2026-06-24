import numpy as np
from scipy.stats import norm

# --- Core Black-Scholes Formulas (Python version) ---

def normal_cdf(x):
    """Standard normal cumulative distribution function."""
    return norm.cdf(x)

def black_scholes_call(S, K, T, r, v):
    """
    Calculates the price of a European call option using the Black-Scholes model.
    :param S: Current stock price
    :param K: Strike price
    :param T: Time to expiration in years
    :param r: Risk-free interest rate (decimal)
    :param v: Volatility (decimal)
    :return: The estimated price of the call option.
    """
    if T <= 0 or v <= 0:
        return max(0, S - K)

    d1 = (np.log(S / K) + (r + (v**2) / 2) * T) / (v * np.sqrt(T))
    d2 = d1 - v * np.sqrt(T)

    price = S * normal_cdf(d1) - K * np.exp(-r * T) * normal_cdf(d2)
    return price

def black_scholes_delta(S, K, T, r, v):
    """
    Calculates the delta of a European call option.
    """
    if T <= 0 or v <= 0:
        return 1 if S > K else 0

    d1 = (np.log(S / K) + (r + (v**2) / 2) * T) / (v * np.sqrt(T))
    return normal_cdf(d1)

# --- Simulation Example: One Month Walkthrough ---

def run_one_month_example():
    """Demonstrates the calculation for a single month, mirroring the app's logic."""

    # --- 1. Initial Parameters (from the simulation setup) ---
    print("--- 1. Initial State ---")
    spy_price_start_of_month = 690
    spy_price_end_of_month = 705  # Let's assume a positive month
    leaps_strike = 630
    leaps_dte_start_of_month = 592
    short_call_otm_amount = 10
    base_short_call_premium_per_contract = 780
    risk_free_rate = 0.05
    base_iv = 0.22
    num_contracts = 1
    print(f"SPY at month start: ${spy_price_start_of_month}")
    print(f"SPY at month end:   ${spy_price_end_of_month}")
    print(f"LEAPS Strike: {leaps_strike}, DTE: {leaps_dte_start_of_month} days\n")

    # --- 2. Calculate Monthly IV and Short Call Premium ---
    print("--- 2. Short Call Leg ---")
    monthly_change_pct = (spy_price_end_of_month / spy_price_start_of_month) - 1
    iv_multiplier = 1.0 # Simplified from the app's tiered logic
    if monthly_change_pct > 0: iv_multiplier = 1.0
    else: iv_multiplier = 1.25
    
    monthly_iv = base_iv * iv_multiplier
    premium_adjustment_factor = monthly_iv / base_iv
    short_call_premium_collected = base_short_call_premium_per_contract * premium_adjustment_factor * num_contracts

    print(f"Monthly IV used for calculations: {monthly_iv:.2%}")
    print(f"Short call premium collected: ${short_call_premium_collected:,.2f}")

    # --- 3. Calculate Short Call Buyback Cost ---
    short_strike = spy_price_start_of_month + short_call_otm_amount
    short_call_buyback_cost = max(0, spy_price_end_of_month - short_strike) * 100 * num_contracts
    print(f"Short call strike price: ${short_strike}")
    print(f"Short call was ITM by: ${max(0, spy_price_end_of_month - short_strike):.2f}")
    print(f"Cost to buy back short call: ${short_call_buyback_cost:,.2f}")
    net_premium = short_call_premium_collected - short_call_buyback_cost
    print(f"Net premium from short call: ${net_premium:,.2f}\n")

    # --- 4. Calculate LEAPS Value Change ---
    print("--- 3. LEAPS Leg ---")
    leaps_dte_end_of_month = leaps_dte_start_of_month - 30
    T_start = leaps_dte_start_of_month / 365.0
    T_end = leaps_dte_end_of_month / 365.0

    # Value of the LEAPS contract at the start of the month
    leaps_value_start = black_scholes_call(spy_price_start_of_month, leaps_strike, T_start, risk_free_rate, monthly_iv) * 100 * num_contracts
    
    # Value of the LEAPS contract at the end of the month
    leaps_value_end = black_scholes_call(spy_price_end_of_month, leaps_strike, T_end, risk_free_rate, monthly_iv) * 100 * num_contracts
    
    leaps_pnl = leaps_value_end - leaps_value_start

    print(f"LEAPS DTE at month end: {leaps_dte_end_of_month} days")
    print(f"LEAPS value at month start: ${leaps_value_start:,.2f}")
    print(f"LEAPS value at month end:   ${leaps_value_end:,.2f}")
    print(f"LEAPS Profit/Loss for the month: ${leaps_pnl:,.2f}\n")

    # --- 5. Summary ---
    print("--- 4. Monthly Summary ---")
    total_pnl = net_premium + leaps_pnl
    print(f"Total P&L for the month (Net Premium + LEAPS P&L): ${total_pnl:,.2f}")

if __name__ == "__main__":
    run_one_month_example()
