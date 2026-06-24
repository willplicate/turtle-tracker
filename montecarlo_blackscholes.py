#!/usr/bin/env python3
"""
Monte Carlo PMCC Simulator using Black-Scholes Pricing
Compare against our empirical pricing model
"""

import numpy as np
import pandas as pd
from scipy.stats import norm
import random

# ===== BLACK-SCHOLES PRICING =====

def black_scholes_call(S, K, T, r, sigma):
    """
    Black-Scholes call option price
    S: spot price
    K: strike price
    T: time to expiration (years)
    r: risk-free rate
    sigma: volatility (annualized)
    """
    if T <= 0:
        return max(0, S - K)

    if sigma <= 0:
        return max(0, S - K)

    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)

    call_price = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return call_price

def black_scholes_delta(S, K, T, r, sigma):
    """Black-Scholes delta for call option"""
    if T <= 0:
        return 1.0 if S > K else 0.0

    if sigma <= 0:
        return 1.0 if S > K else 0.0

    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    return norm.cdf(d1)

def vix_to_iv(vix):
    """Convert VIX level to implied volatility (annualized)"""
    # VIX is already in % terms, so just divide by 100
    return vix / 100.0

# ===== MARKET SIMULATION (Same as our TypeScript) =====

class SeededRNG:
    """Seeded random number generator matching our TypeScript implementation"""
    def __init__(self, seed):
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)

    def random(self):
        return random.random()

    def normal(self, mean=0, std=1):
        return np.random.normal(mean, std)

def generate_vix(current_vix, weekly_return, rng):
    """Generate next week's VIX (matches our TypeScript logic)"""
    # VIX mean reversion
    mean_vix = 16.0
    reversion_speed = 0.15

    # VIX increases when market drops
    price_impact = -weekly_return * 50  # -1% SPY → +0.5 VIX

    # Mean reversion component
    reversion = (mean_vix - current_vix) * reversion_speed

    # Random noise
    noise = rng.normal(0, 1.5)

    new_vix = current_vix + reversion + price_impact + noise
    return max(9.0, min(80.0, new_vix))

def generate_weekly_return(ytd_return, vol_state, rng):
    """Generate weekly return with soft caps (matches our TypeScript)"""
    # Base weekly std dev (2% = ~18.5% annual)
    base_std = 0.020
    current_std = vol_state['current_std']

    # Generate return
    weekly_return = rng.normal(0.002, current_std)  # ~10% annual drift

    # Soft cap at +/-8% weekly
    if weekly_return > 0.08:
        excess = weekly_return - 0.08
        weekly_return = 0.08 + excess * 0.3
    elif weekly_return < -0.08:
        excess = weekly_return + 0.08
        weekly_return = -0.08 + excess * 0.3

    # YTD soft cap (prevent +50% years)
    projected_ytd = ytd_return + weekly_return
    if projected_ytd > 0.35:
        dampening = max(0.3, 1.0 - (projected_ytd - 0.35) * 2)
        weekly_return *= dampening

    return weekly_return

def update_volatility_state(vol_state, weekly_return, rng):
    """Update volatility clustering state"""
    new_state = vol_state.copy()

    # Trigger high vol on large drops
    if weekly_return < -0.03:
        new_state['weeks_in_high_vol'] = 4
        new_state['current_std'] = new_state['base_std'] * 1.5

    # Decay high vol regime
    if new_state['weeks_in_high_vol'] > 0:
        new_state['weeks_in_high_vol'] -= 1
        if new_state['weeks_in_high_vol'] == 0:
            new_state['current_std'] = new_state['base_std']

    return new_state

def classify_regime(vix, price, price_history, vix_history):
    """Classify market regime (matches our TypeScript)"""
    # VIX level
    if vix < 12:
        vix_level = "Low VIX"
    elif vix < 20:
        vix_level = "Normal VIX"
    else:
        vix_level = "High VIX"

    # VIX trend
    if len(vix_history) >= 2:
        vix_change = vix - vix_history[-2]
        if vix_change > 1:
            vix_trend = "Rising"
        elif vix_change < -1:
            vix_trend = "Falling"
        else:
            vix_trend = "Flat"
    else:
        vix_trend = "Flat"

    # Price vs MA
    if len(price_history) >= 20:
        ma20 = np.mean(price_history[-20:])
        price_trend = "Above MA" if price > ma20 else "Below MA"
    else:
        price_trend = "Above MA"

    return f"{vix_level} {vix_trend}, {price_trend}"

# ===== MONTE CARLO SIMULATION =====

def run_single_path(config, rng, path_id):
    """
    Run a single 52-week path using Black-Scholes pricing
    """
    # Initialize
    cash = config['starting_cash']
    current_price = config['initial_price']
    current_vix = config['initial_vix']
    risk_free_rate = 0.05  # 5% risk-free rate

    # Volatility clustering state
    vol_state = {
        'base_std': 0.020,
        'current_std': 0.020,
        'weeks_in_high_vol': 0,
    }

    # Buy initial LEAPS
    initial_strike = round(current_price * 0.92)  # 8% ITM
    initial_dte = 365
    initial_iv = vix_to_iv(current_vix)

    initial_leaps_price = black_scholes_call(
        current_price,
        initial_strike,
        initial_dte / 365.0,
        risk_free_rate,
        initial_iv
    ) * 100

    leaps_allocation = config['starting_cash'] * config['leaps_allocation']
    leaps_quantity = max(1, int(leaps_allocation / initial_leaps_price))
    leaps_cost = initial_leaps_price * leaps_quantity

    # LEAPS position
    leaps_strike = initial_strike
    leaps_dte = initial_dte
    cash -= leaps_cost

    # Short call position
    short_call_strike = None
    short_call_dte = 0
    short_call_premium = 0

    # Tracking
    history = []
    price_history = [current_price]
    vix_history = [current_vix]
    account_values = [config['starting_cash']]

    # Weekly loop
    for week in range(1, config['num_weeks'] + 1):
        # Generate market movement
        ytd_return = (current_price / config['initial_price'] - 1)
        weekly_return = generate_weekly_return(ytd_return, vol_state, rng)
        new_price = current_price * (1 + weekly_return)
        new_vix = generate_vix(current_vix, weekly_return, rng)
        vol_state = update_volatility_state(vol_state, weekly_return, rng)

        # Update LEAPS
        leaps_dte = max(0, leaps_dte - 7)
        iv = vix_to_iv(new_vix)

        leaps_value = black_scholes_call(
            new_price,
            leaps_strike,
            leaps_dte / 365.0,
            risk_free_rate,
            iv
        ) * 100 * leaps_quantity

        leaps_delta = black_scholes_delta(
            new_price,
            leaps_strike,
            leaps_dte / 365.0,
            risk_free_rate,
            iv
        )

        # Update/expire short call
        short_call_value = 0
        if short_call_strike is not None:
            short_call_dte = max(0, short_call_dte - 7)

            if short_call_dte <= 0:
                # Expired - settle
                if new_price > short_call_strike:
                    intrinsic = (new_price - short_call_strike) * 100
                    cash -= intrinsic * leaps_quantity
                short_call_strike = None
                short_call_premium = 0
            else:
                # Still active
                short_call_value = black_scholes_call(
                    new_price,
                    short_call_strike,
                    short_call_dte / 365.0,
                    risk_free_rate,
                    iv
                ) * 100 * leaps_quantity

        # Account value
        account_value = cash + leaps_value - short_call_value

        # Check blowup
        if account_value < config['starting_cash'] * config['blowup_threshold']:
            return {
                'path_id': path_id,
                'blown_up': True,
                'blowup_week': week,
                'final_value': account_value,
                'history': history,
            }

        # Check LEAPS rolling
        needs_time_roll = leaps_dte < config['leaps_roll_dte_threshold']
        needs_delta_roll = leaps_delta < config['leaps_roll_delta_threshold']

        if needs_time_roll or needs_delta_roll:
            # Sell current LEAPS
            cash += leaps_value

            if needs_time_roll:
                new_strike = round(new_price * 0.92)
                new_dte = 365
                roll_type = 'TIME'
            else:
                new_strike = round(new_price * 0.88)
                new_dte = leaps_dte
                roll_type = 'DELTA'

            # Buy new LEAPS
            new_leaps_price = black_scholes_call(
                new_price,
                new_strike,
                new_dte / 365.0,
                risk_free_rate,
                iv
            ) * 100

            new_cost = new_leaps_price * leaps_quantity
            cash -= new_cost

            leaps_strike = new_strike
            leaps_dte = new_dte

            # Recalculate account value
            new_leaps_value = black_scholes_call(
                new_price,
                leaps_strike,
                leaps_dte / 365.0,
                risk_free_rate,
                iv
            ) * 100 * leaps_quantity

            account_value = cash + new_leaps_value - short_call_value

            history.append({
                'week': week,
                'price': new_price,
                'vix': new_vix,
                'leaps_value': new_leaps_value,
                'leaps_delta': black_scholes_delta(new_price, leaps_strike, leaps_dte / 365.0, risk_free_rate, iv),
                'short_call_value': short_call_value,
                'short_call_premium': short_call_premium,
                'account_value': account_value,
                'cash': cash,
                'weekly_return': weekly_return * 100,
                'regime': classify_regime(new_vix, new_price, price_history, vix_history),
                'action': f'Rolled LEAPS {roll_type} to {leaps_strike} (DTE={leaps_dte})',
            })

            price_history.append(new_price)
            vix_history.append(new_vix)
            account_values.append(account_value)
            current_price = new_price
            current_vix = new_vix
            continue

        # Sell new short call (if none active)
        action = 'No action'
        if short_call_strike is None:
            # Simple rule: sell 0.4% OTM call
            call_strike = round(new_price * 1.004)

            call_premium = black_scholes_call(
                new_price,
                call_strike,
                7 / 365.0,
                risk_free_rate,
                iv
            ) * 100

            short_call_strike = call_strike
            short_call_dte = 7
            short_call_premium = call_premium

            cash += call_premium * leaps_quantity
            short_call_value = call_premium * leaps_quantity

            action = f'Sell {call_strike}C (+{((call_strike/new_price - 1)*100):.1f}%)'

        # Record week
        history.append({
            'week': week,
            'price': new_price,
            'vix': new_vix,
            'leaps_value': leaps_value,
            'leaps_delta': leaps_delta,
            'short_call_value': short_call_value,
            'short_call_premium': short_call_premium,
            'account_value': account_value,
            'cash': cash,
            'weekly_return': weekly_return * 100,
            'regime': classify_regime(new_vix, new_price, price_history, vix_history),
            'action': action,
        })

        price_history.append(new_price)
        vix_history.append(new_vix)
        account_values.append(account_value)
        current_price = new_price
        current_vix = new_vix

    # Final settlement
    final_leaps_value = black_scholes_call(
        current_price,
        leaps_strike,
        leaps_dte / 365.0,
        risk_free_rate,
        vix_to_iv(current_vix)
    ) * 100 * leaps_quantity

    final_short_value = 0
    if short_call_strike is not None:
        final_short_value = black_scholes_call(
            current_price,
            short_call_strike,
            short_call_dte / 365.0,
            risk_free_rate,
            vix_to_iv(current_vix)
        ) * 100 * leaps_quantity

    final_value = cash + final_leaps_value - final_short_value

    return {
        'path_id': path_id,
        'blown_up': False,
        'final_value': final_value,
        'history': history,
    }

def run_monte_carlo(config, num_paths=1000):
    """Run Monte Carlo simulation with Black-Scholes pricing"""
    print(f"Running {num_paths} paths with Black-Scholes pricing...")
    print(f"Configuration:")
    print(f"  Starting cash: ${config['starting_cash']:,}")
    print(f"  LEAPS allocation: {config['leaps_allocation']*100:.0f}%")
    print(f"  Initial SPY: ${config['initial_price']}")
    print(f"  Initial VIX: {config['initial_vix']}")
    print(f"  DTE roll threshold: {config['leaps_roll_dte_threshold']}")
    print(f"  Delta roll threshold: {config['leaps_roll_delta_threshold']}")
    print()

    results = []
    for i in range(num_paths):
        if (i + 1) % 100 == 0:
            print(f"  Path {i+1}/{num_paths}...")

        rng = SeededRNG(config['seed'] + i)
        result = run_single_path(config, rng, i)
        results.append(result)

    # Calculate statistics
    surviving = [r for r in results if not r['blown_up']]
    final_values = [r['final_value'] for r in surviving]

    if len(final_values) == 0:
        print("\n⚠️  ALL PATHS BLEW UP!")
        return

    median_final = np.median(final_values)
    mean_final = np.mean(final_values)
    std_final = np.std(final_values)

    survival_rate = len(surviving) / len(results) * 100
    winners = [v for v in final_values if v > config['starting_cash']]
    win_rate = len(winners) / len(final_values) * 100

    print("\n" + "="*60)
    print("BLACK-SCHOLES MONTE CARLO RESULTS")
    print("="*60)
    print(f"Paths: {num_paths}")
    print(f"Survival rate: {survival_rate:.1f}%")
    print(f"Win rate: {win_rate:.1f}% (of surviving)")
    print()
    print(f"Median final value: ${median_final:,.0f}")
    print(f"Mean final value: ${mean_final:,.0f}")
    print(f"Std dev: ${std_final:,.0f}")
    print()
    print(f"Median return: {((median_final/config['starting_cash'] - 1)*100):+.1f}%")
    print(f"5th percentile: ${np.percentile(final_values, 5):,.0f}")
    print(f"95th percentile: ${np.percentile(final_values, 95):,.0f}")
    print("="*60)

    # Save sample path to CSV
    sample_path = results[0]
    df = pd.DataFrame(sample_path['history'])
    output_file = f'/Users/williamford/Downloads/blackscholes_path_0.csv'

    # Format columns to match our TypeScript output
    df_out = pd.DataFrame({
        'Week': df['week'],
        'SPY Price': df['price'].round(2),
        'VIX': df['vix'].round(1),
        'Weekly Return %': df['weekly_return'].round(2),
        'LEAPS Value': df['leaps_value'].round(0),
        'LEAPS Delta': df['leaps_delta'].round(3),
        'Call Premium Collected': df['short_call_premium'].round(0),
        'Call Current Value': df['short_call_value'].round(0),
        'Account Value': df['account_value'].round(2),
        'Cash': df['cash'].round(2),
        'Regime': df['regime'],
        'Action': df['action'],
    })

    df_out.to_csv(output_file, index=False)
    print(f"\nSample path saved to: {output_file}")

    return {
        'results': results,
        'median_final': median_final,
        'mean_final': mean_final,
        'survival_rate': survival_rate,
        'win_rate': win_rate,
    }

if __name__ == "__main__":
    config = {
        'seed': 42,
        'num_weeks': 52,
        'starting_cash': 35000,
        'leaps_allocation': 0.40,
        'initial_price': 590,
        'initial_vix': 16,
        'blowup_threshold': 0.10,
        'leaps_roll_delta_threshold': 0.70,
        'leaps_roll_dte_threshold': 180,
    }

    run_monte_carlo(config, num_paths=1000)
