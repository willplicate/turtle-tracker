"""
Compare IWM Weekly Call Pricing: Simulator vs Real Market
"""
import math

def calculate_weekly_call_current(stock_price, strike, dte, vix=15):
    """Current simulator formula (NO price scaling)"""
    intrinsic = max(0, stock_price - strike) * 100
    distance_from_strike = stock_price - strike
    percent_diff = (distance_from_strike / strike) * 100

    base_extrinsic_7dte = 450  # Fixed for all tickers!
    time_factor = dte / 7

    abs_percent = abs(percent_diff)

    # Moneyness factor
    if abs_percent < 0.1:
        moneyness_factor = 1.0
    elif abs_percent < 0.2:
        moneyness_factor = 1.0 - (abs_percent - 0.1) * 0.4
    elif abs_percent < 0.35:
        moneyness_factor = 0.96 - (abs_percent - 0.2) * 0.8
    elif abs_percent < 0.5:
        moneyness_factor = 0.84 - (abs_percent - 0.35) * 1.2
    else:
        moneyness_factor = max(0.3, 0.66 - (abs_percent - 0.5) * 0.8)

    base_extrinsic = base_extrinsic_7dte * time_factor * moneyness_factor

    # Vega factor
    if abs_percent < 0.2:
        vega_factor = 1.0
    elif abs_percent < 0.35:
        vega_factor = 0.8
    elif abs_percent < 0.5:
        vega_factor = 0.6
    else:
        vega_factor = 0.4

    # VIX multiplier
    base_multiplier = math.sqrt(vix / 15.0) * 1.3
    iv_multiplier = 1.0 + (base_multiplier - 1.0) * vega_factor

    total_extrinsic = base_extrinsic * iv_multiplier
    vix_premium = total_extrinsic - base_extrinsic

    return {
        'intrinsic': intrinsic,
        'base_extrinsic': base_extrinsic,
        'vix_premium': vix_premium,
        'total': intrinsic + total_extrinsic,
        'per_share': (intrinsic + total_extrinsic) / 100
    }


def calculate_weekly_call_fixed(stock_price, strike, dte, vix=15):
    """FIXED formula WITH price scaling (like LEAPS)"""
    intrinsic = max(0, stock_price - strike) * 100
    distance_from_strike = stock_price - strike
    percent_diff = (distance_from_strike / strike) * 100

    # ADD PRICE SCALING (like we did for LEAPS!)
    SPY_BASE_PRICE = 590.0
    base_extrinsic_7dte_SPY = 450
    price_scale_factor = math.sqrt(stock_price / SPY_BASE_PRICE)
    base_extrinsic_7dte = base_extrinsic_7dte_SPY * price_scale_factor

    time_factor = dte / 7

    abs_percent = abs(percent_diff)

    # Moneyness factor (same as before)
    if abs_percent < 0.1:
        moneyness_factor = 1.0
    elif abs_percent < 0.2:
        moneyness_factor = 1.0 - (abs_percent - 0.1) * 0.4
    elif abs_percent < 0.35:
        moneyness_factor = 0.96 - (abs_percent - 0.2) * 0.8
    elif abs_percent < 0.5:
        moneyness_factor = 0.84 - (abs_percent - 0.35) * 1.2
    else:
        moneyness_factor = max(0.3, 0.66 - (abs_percent - 0.5) * 0.8)

    base_extrinsic = base_extrinsic_7dte * time_factor * moneyness_factor

    # Vega factor
    if abs_percent < 0.2:
        vega_factor = 1.0
    elif abs_percent < 0.35:
        vega_factor = 0.8
    elif abs_percent < 0.5:
        vega_factor = 0.6
    else:
        vega_factor = 0.4

    # VIX multiplier
    base_multiplier = math.sqrt(vix / 15.0) * 1.3
    iv_multiplier = 1.0 + (base_multiplier - 1.0) * vega_factor

    total_extrinsic = base_extrinsic * iv_multiplier
    vix_premium = total_extrinsic - base_extrinsic

    return {
        'intrinsic': intrinsic,
        'base_extrinsic': base_extrinsic,
        'vix_premium': vix_premium,
        'total': intrinsic + total_extrinsic,
        'per_share': (intrinsic + total_extrinsic) / 100,
        'price_scale_factor': price_scale_factor
    }


print("=" * 90)
print("IWM WEEKLY CALL PRICING COMPARISON")
print("=" * 90)
print()

# Real market data from OptionStrat
print("REAL MARKET (OptionStrat):")
print("  IWM $265 Call, 5 DTE")
print("  IWM current price: $264.63")
print("  Distance from strike: -$0.37 (slightly OTM)")
print("  IV: 22.9%")
print("  Market price: $3.27/share = $327 per contract")
print()

# Simulate similar scenario
iwm_price = 264.63
strike = 265
dte = 5
vix = 23  # Approximate IV from screenshot

print("SIMULATOR - CURRENT (No Price Scaling):")
current = calculate_weekly_call_current(iwm_price, strike, dte, vix)
print(f"  IWM ${strike} Call, {dte} DTE at IWM ${iwm_price}")
print(f"  Base extrinsic: ${current['base_extrinsic']:.2f}")
print(f"  VIX premium: ${current['vix_premium']:.2f}")
print(f"  Total per contract: ${current['total']:.2f}")
print(f"  Per share: ${current['per_share']:.2f}")
print()
diff_current = current['total'] - 327
diff_pct_current = (diff_current / 327) * 100
print(f"  Difference from market: ${diff_current:+.2f} ({diff_pct_current:+.1f}%)")
print()

print("SIMULATOR - FIXED (With Price Scaling):")
fixed = calculate_weekly_call_fixed(iwm_price, strike, dte, vix)
print(f"  IWM ${strike} Call, {dte} DTE at IWM ${iwm_price}")
print(f"  Price scale factor: {fixed['price_scale_factor']:.3f} (sqrt({iwm_price:.0f}/590))")
print(f"  Base extrinsic: ${fixed['base_extrinsic']:.2f}")
print(f"  VIX premium: ${fixed['vix_premium']:.2f}")
print(f"  Total per contract: ${fixed['total']:.2f}")
print(f"  Per share: ${fixed['per_share']:.2f}")
print()
diff_fixed = fixed['total'] - 327
diff_pct_fixed = (diff_fixed / 327) * 100
print(f"  Difference from market: ${diff_fixed:+.2f} ({diff_pct_fixed:+.1f}%)")
print()

print("=" * 90)
print("GAME SCENARIO FROM SCREENSHOT")
print("=" * 90)
print()

# User's game scenario
game_iwm = 245.35
game_strike = 245
game_dte = 7
game_vix = 20  # Estimated from VIX premium

print(f"Setup: IWM ${game_strike} (ATM), {game_dte} DTE at IWM ${game_iwm}")
print()

print("CURRENT SIMULATOR (No Price Scaling):")
game_current = calculate_weekly_call_current(game_iwm, game_strike, game_dte, game_vix)
print(f"  Total: ${game_current['total']:.2f} (${game_current['per_share']:.2f}/share)")
print(f"  Game shows: $663.80 (${6.64:.2f}/share)")
print()

print("FIXED SIMULATOR (With Price Scaling):")
game_fixed = calculate_weekly_call_fixed(game_iwm, game_strike, game_dte, game_vix)
print(f"  Price scale factor: {game_fixed['price_scale_factor']:.3f}")
print(f"  Total: ${game_fixed['total']:.2f} (${game_fixed['per_share']:.2f}/share)")
print()

reduction = ((game_current['total'] - game_fixed['total']) / game_current['total']) * 100
print(f"Reduction: {reduction:.1f}% (brings IWM calls down to realistic levels)")
print()

print("=" * 90)
print("COMPARISON TABLE: SPY vs IWM Weekly Calls")
print("=" * 90)
print()

print("ATM, 7 DTE, VIX=15:")
print()
print(f"{'Ticker':<8} {'Price':<10} {'Current':<15} {'Fixed':<15} {'$/share'}")
print("-" * 90)

# SPY
spy_current = calculate_weekly_call_current(590, 590, 7, 15)
spy_fixed = calculate_weekly_call_fixed(590, 590, 7, 15)
print(f"SPY      $590       ${spy_current['total']:<14.2f} ${spy_fixed['total']:<14.2f} ${spy_fixed['per_share']:.2f}")

# IWM
iwm_current = calculate_weekly_call_current(250, 250, 7, 15)
iwm_fixed = calculate_weekly_call_fixed(250, 250, 7, 15)
print(f"IWM      $250       ${iwm_current['total']:<14.2f} ${iwm_fixed['total']:<14.2f} ${iwm_fixed['per_share']:.2f}")

print()
print("NOTES:")
print("  - Current method uses same base ($450) for both tickers")
print("  - Fixed method scales: IWM gets sqrt(250/590) = 0.65x the base")
print("  - This matches real market behavior (IWM options are cheaper)")
print()

print("RECOMMENDATION: Apply sqrt price scaling to weekly calls (same as LEAPS)")
print()
