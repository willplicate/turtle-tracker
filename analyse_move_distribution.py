"""
analyse_move_distribution.py
Port the JS scenario engine exactly and measure weekly + daily move distributions.
"""

import math
import statistics
from collections import defaultdict

# ── RNG (exact JS port) ──────────────────────────────────────────────────────

def seeded_random(seed):
    x = math.sin(seed + 1) * 10000
    return x - math.floor(x)

def normal_random(u1, u2):
    safe = max(u1, 1e-10)
    z = math.sqrt(-2 * math.log(safe)) * math.cos(2 * math.pi * u2)
    return max(-3.5, min(3.5, z))   # ±3.5σ clamp

# ── VIX dynamics (exact JS port) ─────────────────────────────────────────────

def update_vix(current_vix, target_vix, weekly_return, noise_amplitude, r3, r4, vix_cap):
    reversion   = (target_vix - current_vix) * 0.030
    stock_effect = -weekly_return * 60 if weekly_return < 0 else -weekly_return * 50
    noise        = normal_random(r3, r4) * noise_amplitude
    return max(9, min(vix_cap, current_vix + reversion + stock_effect + noise))

# ── Weekly move generator (exact JS port) ────────────────────────────────────

SCENARIOS = {
    'easy':          {'drift': 0.004,  'vix_base': 14},
    'medium':        {'drift': 0.000,  'vix_base': 20},
    'hard':          {'drift': 0.000,  'vix_base': 28},
    'bull':          {'drift': 0.005,  'vix_base': 14},
    'moderate-bull': {'drift': 0.003,  'vix_base': 16},
    'bear':          {'drift': -0.010, 'vix_base': 28},
    'moderate-bear': {'drift': -0.005, 'vix_base': 22},
    'choppy':        {'drift': 0.000,  'vix_base': 24},
    'high-vol':      {'drift': 0.000,  'vix_base': 35},
    'crash':         {'drift': -0.050, 'vix_base': 50},
    'bear-recovery': {'drift': -0.015, 'vix_base': 35},
}

def generate_weekly_move(scenario, current_price, current_vix, week):
    r1 = seeded_random(week * 7 + 1)
    r2 = seeded_random(week * 7 + 2)
    r3 = seeded_random(week * 7 + 3)
    r4 = seeded_random(week * 7 + 4)
    r5 = seeded_random(week * 7 + 5)

    cfg = SCENARIOS.get(scenario, SCENARIOS['moderate-bull'])
    blended_vix = cfg['vix_base'] * 0.6 + current_vix * 0.4
    sigma = blended_vix / 100 / math.sqrt(52) * 0.75

    if scenario == 'bull':
        weekly_return = cfg['drift'] + sigma * normal_random(r1, r2)
        if r5 > 0.88: weekly_return -= 0.015 + r5 * 0.015
        new_vix = update_vix(current_vix, 14, weekly_return, 0.9, r3, r4, 45)

    elif scenario == 'moderate-bull':
        weekly_return = cfg['drift'] + sigma * normal_random(r1, r2)
        if r5 > 0.85: weekly_return -= 0.012 + r5 * 0.018
        new_vix = update_vix(current_vix, 16, weekly_return, 1.1, r3, r4, 50)

    elif scenario == 'bear':
        weekly_return = cfg['drift'] + sigma * normal_random(r1, r2)
        if r5 > 0.85: weekly_return += 0.015 + r5 * 0.015
        weekly_return = max(-0.11, min(0.11, weekly_return))
        new_vix = update_vix(current_vix, 28, weekly_return, 1.5, r3, r4, 42)

    elif scenario == 'moderate-bear':
        weekly_return = cfg['drift'] + sigma * normal_random(r1, r2)
        if r5 > 0.87: weekly_return += 0.012 + r5 * 0.015
        weekly_return = max(-0.09, min(0.09, weekly_return))
        new_vix = update_vix(current_vix, 22, weekly_return, 1.2, r3, r4, 38)

    elif scenario == 'choppy':
        weekly_return = sigma * normal_random(r1, r2)
        weekly_return = max(-0.08, min(0.08, weekly_return))
        new_vix = update_vix(current_vix, 24, weekly_return, 1.8, r3, r4, 38)

    elif scenario == 'high-vol':
        weekly_return = sigma * normal_random(r1, r2)
        new_vix = update_vix(current_vix, 35, weekly_return, 2.2, r3, r4, 65)

    elif scenario == 'crash':
        if week < 5:
            weekly_return = -0.04 - r1 * 0.05 + r2 * 0.015
            new_vix = min(80, current_vix * 1.12 + r3 * 6)
        elif week < 11:
            weekly_return = sigma * normal_random(r1, r2) - 0.008   # removed ×2 multiplier
            new_vix = update_vix(current_vix, 55, weekly_return, 2.0, r3, r4, 80)
        elif week < 22:
            weekly_return = 0.012 + sigma * normal_random(r1, r2) * 1.1
            new_vix = update_vix(current_vix, 28, weekly_return, 1.5, r3, r4, 70)
        else:
            weekly_return = 0.007 + sigma * normal_random(r1, r2)
            new_vix = update_vix(current_vix, 18, weekly_return, 1.2, r3, r4, 50)

    elif scenario == 'bear-recovery':
        if week < 6:
            weekly_return = -0.025 + sigma * normal_random(r1, r2) * 1.2
            new_vix = min(70, current_vix * 1.08 + r2 * 4)
        elif week < 10:
            weekly_return = 0.015 + sigma * normal_random(r1, r2)
            new_vix = update_vix(current_vix, 25, weekly_return, 1.3, r3, r4, 55)
        else:
            weekly_return = 0.018 + sigma * normal_random(r1, r2) * 0.8
            new_vix = update_vix(current_vix, 14, weekly_return, 1.0, r3, r4, 45)

    elif scenario == 'easy':
        weekly_return = 0.004 + sigma * normal_random(r1, r2)
        if r5 > 0.92: weekly_return -= 0.015 + r5 * 0.015
        new_vix = update_vix(current_vix, 14, weekly_return, 0.7, r3, r4, 40)

    elif scenario == 'medium':
        if week < 15:   drift, vix_target = 0.005, 16
        elif week < 29: drift, vix_target = -0.004, 24
        elif week < 41: drift, vix_target = 0.000, 20
        else:           drift, vix_target = 0.004, 16
        weekly_return = drift + sigma * normal_random(r1, r2)
        new_vix = update_vix(current_vix, vix_target, weekly_return, 1.1, r3, r4, 45)

    elif scenario == 'hard':
        drop1 = 6  + math.floor(seeded_random(201) * 16)
        drop2 = 26 + math.floor(seeded_random(202) * 16)
        in_recovery = lambda w, dw: dw < w <= dw + 3
        is_drop = week == drop1 or week == drop2
        is_rec  = in_recovery(week, drop1) or in_recovery(week, drop2)

        if is_drop:
            weekly_return = -0.05 - r1 * 0.04 + r2 * 0.01
            new_vix = min(75, current_vix * 1.15 + r3 * 8)
        elif is_rec:
            weekly_return = 0.020 + r1 * 0.015
            new_vix = update_vix(current_vix, 22, weekly_return, 1.3, r3, r4, 60)
        else:
            weekly_return = sigma * normal_random(r1, r2) * 1.1
            new_vix = update_vix(current_vix, 28, weekly_return, 1.8, r3, r4, 55)

    else:
        weekly_return = sigma * normal_random(r1, r2)
        new_vix = current_vix

    new_vix = max(9, min(80, new_vix))
    return weekly_return * 100, new_vix   # return as percent

# ── Daily price distribution (NEW linear approach) ───────────────────────────

def get_daily_moves(weekly_pct, week):
    """
    Returns the 5 daily % moves (Mon–Fri) under the new linear + noise approach.
    Daily move = (1/5 of weekly move) ± 1% noise, Friday forced to make up the rest.
    """
    r1 = seeded_random(week * 31 + 77)
    r2 = seeded_random(week * 31 + 78)
    r3 = seeded_random(week * 31 + 79)
    r4 = seeded_random(week * 31 + 80)

    noise_pct = 1.0   # ±1% of price
    avg = weekly_pct / 5

    # Simulate absolute prices for a $285 stock
    price = 285.0
    open_p = price
    noise  = open_p * (noise_pct / 100)

    # Same formula as JS getDailyPrices
    weekMove = open_p * (weekly_pct / 100)
    d = [
        open_p + weekMove * 0.20 + (r1 - 0.5) * noise * 2,
        open_p + weekMove * 0.40 + (r2 - 0.5) * noise * 2,
        open_p + weekMove * 0.60 + (r3 - 0.5) * noise * 2,
        open_p + weekMove * 0.80 + (r4 - 0.5) * noise * 2,
        open_p + weekMove,            # Friday = close
    ]
    # Compute day-to-day % moves
    prev = open_p
    moves = []
    for dp in d:
        moves.append((dp - prev) / prev * 100)
        prev = dp
    return moves

# ── Simulation ────────────────────────────────────────────────────────────────

def simulate_scenario(scenario, n_games=200):
    """Run n_games × 52-week simulations, collect weekly + daily move distributions."""
    weekly_pcts   = []
    daily_pcts    = []
    vix_values    = []
    weekly_absmax = []   # max |weekly pct| per game

    for game in range(n_games):
        price = 285.0
        vix   = SCENARIOS.get(scenario, {}).get('vix_base', 20)
        # Use game index as a week offset so each game sees different seeds
        offset = game * 1000

        game_max = 0
        for w in range(52):
            week = offset + w
            pct, new_vix = generate_weekly_move(scenario, price, vix, week)
            weekly_pcts.append(pct)
            vix_values.append(vix)

            daily = get_daily_moves(pct, week)
            daily_pcts.extend(daily)

            game_max = max(game_max, abs(pct))
            price *= (1 + pct / 100)
            vix = new_vix

        weekly_absmax.append(game_max)

    return weekly_pcts, daily_pcts, vix_values, weekly_absmax

def percentile(data, p):
    data_s = sorted(data)
    idx = (len(data_s) - 1) * p / 100
    lo, hi = int(idx), math.ceil(idx)
    if lo == hi: return data_s[lo]
    return data_s[lo] + (data_s[hi] - data_s[lo]) * (idx - lo)

def print_dist(label, data, unit='%'):
    abs_data = [abs(x) for x in data]
    print(f"\n  {label}")
    print(f"    mean:    {statistics.mean(data):+.2f}{unit}   stdev: {statistics.stdev(data):.2f}{unit}")
    print(f"    median:  {statistics.median(data):+.2f}{unit}")
    print(f"    p5/p95:  {percentile(data,5):+.2f} / {percentile(data,95):+.2f}{unit}")
    print(f"    p1/p99:  {percentile(data,1):+.2f} / {percentile(data,99):+.2f}{unit}")
    print(f"    min/max: {min(data):+.2f} / {max(data):+.2f}{unit}")
    print(f"    |move| > 5%:  {sum(1 for x in data if abs(x) > 5):4d} / {len(data)} ({100*sum(1 for x in data if abs(x)>5)/len(data):.1f}%)")
    print(f"    |move| > 10%: {sum(1 for x in data if abs(x) > 10):4d} / {len(data)} ({100*sum(1 for x in data if abs(x)>10)/len(data):.1f}%)")

# ── Real-world benchmarks ─────────────────────────────────────────────────────
# IWM historical weekly returns (approximate, from major regimes):
#   2019 bull:  mean +0.4%/wk, stdev 1.8%,  max weekly ~+6%
#   2022 bear:  mean -0.5%/wk, stdev 2.9%,  max weekly ~-9%
#   2020 crash: mean -0.8%/wk, stdev 6.0%,  max weekly ~-17%
# IWM historical DAILY returns (2018-2023):
#   stdev ~1.1-1.5%/day, 99th pctile |move| ~3-4%, max single day ~±7% (March 2020)

BENCHMARKS = {
    'weekly_stdev': {
        'easy/bull': '1.5–2.0%',
        'moderate': '2.0–3.0%',
        'bear':     '2.5–4.0%',
        'crash':    '5.0–8.0%',
    },
    'daily_99p_abs': {
        'normal': '3–4%',
        'volatile': '5–7%',
    }
}

# ── Run ───────────────────────────────────────────────────────────────────────

scenarios_to_test = ['easy', 'bull', 'moderate-bull', 'bear', 'moderate-bear',
                     'choppy', 'high-vol', 'crash', 'medium', 'hard']

print("=" * 70)
print("MOVE DISTRIBUTION ANALYSIS — 200 games × 52 weeks each")
print("=" * 70)
print()
print("REAL IWM BENCHMARKS:")
print("  Weekly stdev:  bull ~1.8%, bear ~3%, crash ~6%")
print("  Daily  stdev:  normal ~1.1%, volatile ~1.5%")
print("  Daily |>5%|:   very rare (0.1-0.5% of days) except crash")
print("  Daily |>3%|:   occasional (~1-3% of days in bear markets)")

for sc in scenarios_to_test:
    wp, dp, vx, wmax = simulate_scenario(sc, n_games=200)
    print(f"\n{'='*70}")
    print(f"SCENARIO: {sc.upper()}")
    print(f"  VIX range: {min(vx):.1f} – {max(vx):.1f}  (mean {statistics.mean(vx):.1f})")
    print_dist("Weekly % moves", wp)
    print_dist("Daily  % moves (new linear path)", dp)
    over3 = sum(1 for x in dp if abs(x) > 3)
    over5 = sum(1 for x in dp if abs(x) > 5)
    print(f"    daily |>3%|:  {over3}/{len(dp)} = {100*over3/len(dp):.2f}%  (target: <3% for bear)")
    print(f"    daily |>5%|:  {over5}/{len(dp)} = {100*over5/len(dp):.2f}%  (target: <0.5%)")
    print(f"  Worst single week per game: median {percentile(wmax,50):.1f}%, p95 {percentile(wmax,95):.1f}%")
