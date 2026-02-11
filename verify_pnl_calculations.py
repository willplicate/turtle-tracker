"""
Verify P&L and Account Balance Calculations
Reproduces the game's P&L logic to identify calculation issues
"""

def calculate_option_price_simple(stock_price, strike, dte, vix, moneyness_mult):
    """Simplified pricing for testing"""
    intrinsic = max(0, stock_price - strike) * 100

    base_premium = 150 * (dte / 7) ** 0.5
    vol_mult = (vix / 15) ** 1.3
    time_mult = 1.0 if dte >= 7 else 0.90

    extrinsic = base_premium * moneyness_mult * time_mult * vol_mult
    total = intrinsic + extrinsic

    return round(total)

def test_account_balance_tracking():
    """Test if account balance properly accumulates across multiple weeks"""
    print("=" * 80)
    print("ACCOUNT BALANCE TRACKING TEST")
    print("=" * 80)
    print()

    # Starting conditions
    initial_cash = 25000
    cash = initial_cash

    print(f"Starting Cash: ${cash:,.2f}")
    print()

    # Week 1
    print("WEEK 1:")
    print("-" * 40)

    # Buy LEAPS
    leaps_cost = 2000
    cash -= leaps_cost
    leaps_week_start_value = leaps_cost
    print(f"  Buy LEAPS for ${leaps_cost:,.2f}")
    print(f"  Cash after purchase: ${cash:,.2f}")

    # Sell short call
    short_call_premium = 150
    cash += short_call_premium
    short_call_week_start_value = short_call_premium
    print(f"  Sell short call for ${short_call_premium:,.2f}")
    print(f"  Cash after sale: ${cash:,.2f}")

    # End of Week 1 (Friday)
    leaps_week_end_value = 2100  # Gained $100
    short_call_week_end_value = 20  # Decayed to $20, profit = $150 - $20 = $130

    week1_leaps_pnl = leaps_week_end_value - leaps_week_start_value  # $100
    week1_short_call_pnl = short_call_week_start_value - short_call_week_end_value  # $130
    week1_total_pnl = week1_leaps_pnl + week1_short_call_pnl  # $230

    print(f"\n  Friday close:")
    print(f"    LEAPS value: ${leaps_week_end_value:,.2f} (P&L: +${week1_leaps_pnl:,.2f})")
    print(f"    Short call value: ${short_call_week_end_value:,.2f} (P&L: +${week1_short_call_pnl:,.2f})")
    print(f"    Week 1 Total P&L: +${week1_total_pnl:,.2f}")

    account_value_week1 = cash + leaps_week_end_value - short_call_week_end_value
    print(f"    Account Value: ${account_value_week1:,.2f}")
    print(f"    Total Profit: ${account_value_week1 - initial_cash:,.2f}")

    # User closes short call position (buys it back)
    # IMPORTANT: Did user close this? If not, profit is unrealized!
    buyback_cost = short_call_week_end_value
    cash -= buyback_cost
    short_call_realized_pnl = short_call_premium - buyback_cost  # $130

    print(f"\n  Buy back short call for ${buyback_cost:,.2f}")
    print(f"  Cash after buyback: ${cash:,.2f}")
    print(f"  Realized P&L from short call: +${short_call_realized_pnl:,.2f}")

    print("\n" + "=" * 80)
    print()

    # Week 2
    print("WEEK 2:")
    print("-" * 40)

    # Start Week 2 with existing LEAPS
    leaps_week_start_value = leaps_week_end_value  # $2100

    # Sell new short call
    short_call_premium = 157
    cash += short_call_premium
    short_call_week_start_value = short_call_premium
    print(f"  Sell new short call for ${short_call_premium:,.2f}")
    print(f"  Cash after sale: ${cash:,.2f}")

    # End of Week 2 (Friday)
    leaps_week_end_value = 2250  # Gained $150 this week
    short_call_week_end_value = 20  # Decayed to $20, profit = $157 - $20 = $137

    week2_leaps_pnl = leaps_week_end_value - leaps_week_start_value  # $150
    week2_short_call_pnl = short_call_week_start_value - short_call_week_end_value  # $137
    week2_total_pnl = week2_leaps_pnl + week2_short_call_pnl  # $287

    print(f"\n  Friday close:")
    print(f"    LEAPS value: ${leaps_week_end_value:,.2f} (P&L: +${week2_leaps_pnl:,.2f})")
    print(f"    Short call value: ${short_call_week_end_value:,.2f} (P&L: +${week2_short_call_pnl:,.2f})")
    print(f"    Week 2 Total P&L: +${week2_total_pnl:,.2f}")

    account_value_week2 = cash + leaps_week_end_value - short_call_week_end_value
    print(f"    Account Value: ${account_value_week2:,.2f}")

    # Total profit calculation
    total_profit = account_value_week2 - initial_cash
    print(f"\n  Total Profit (2 weeks): +${total_profit:,.2f}")

    # Expected vs actual
    expected_total = week1_total_pnl + week2_total_pnl  # $517
    print(f"  Expected Total: +${expected_total:,.2f}")

    print("\n" + "=" * 80)
    print()

    # User's reported issue
    print("USER'S REPORTED ISSUE:")
    print("-" * 40)
    print(f"  User sees account balance: $25,287 (showing Week 2 profit only: $287)")
    print(f"  User expects: $25,567 (both weeks: $567)")
    print(f"\n  DIAGNOSIS:")
    print(f"    - The issue is likely that Week 1's short call was NOT closed/bought back")
    print(f"    - If the position wasn't closed, the $130 profit from Week 1 remains unrealized")
    print(f"    - Account value would only show the most recent week's P&L")
    print(f"\n  OR:")
    print(f"    - There's a bug in how cash is updated when closing positions")
    print(f"    - The realized P&L might not be adding to cash properly")

    print("\n" + "=" * 80)

def test_vix_factors_calculation():
    """Test the 'VIX and other factors' calculation in LEAPS P&L"""
    print("\n" + "=" * 80)
    print("VIX & OTHER FACTORS CALCULATION TEST")
    print("=" * 80)
    print()

    # Scenario: LEAPS position over a week
    print("SCENARIO: LEAPS position from Monday to Friday")
    print("-" * 40)

    # Monday (start of week)
    monday_spy = 600.00
    monday_vix = 15.0
    strike = 567
    dte_monday = 365

    # Simplified pricing
    monday_value = 2000
    monday_delta = 0.85
    monday_theta = -5.0

    print(f"\nMonday:")
    print(f"  SPY: ${monday_spy:.2f}")
    print(f"  VIX: {monday_vix:.2f}")
    print(f"  LEAPS value: ${monday_value:.2f}")
    print(f"  Delta: {monday_delta:.2f}")
    print(f"  Theta: ${monday_theta:.2f}/day")

    # Friday (end of week)
    friday_spy = 610.00  # Up $10
    friday_vix = 20.0    # VIX spiked
    dte_friday = 358     # 7 days passed

    friday_value = 2500  # Actual value
    friday_delta = 0.87
    friday_theta = -6.5

    price_change = friday_spy - monday_spy  # $10

    print(f"\nFriday:")
    print(f"  SPY: ${friday_spy:.2f} (change: +${price_change:.2f})")
    print(f"  VIX: {friday_vix:.2f} (change: +{friday_vix - monday_vix:.2f})")
    print(f"  LEAPS value: ${friday_value:.2f}")
    print(f"  Actual P&L: +${friday_value - monday_value:.2f}")

    print(f"\nCURRENT CALCULATION (in the code):")
    print("-" * 40)

    # This is what the code does (lines 505-506 in GameScreen.ts)
    delta_pnl = price_change * friday_delta * 100  # Using FRIDAY's delta
    theta_cost = monday_theta * 7  # 7 days of decay

    print(f"  Delta P&L: ${price_change:.2f} × {friday_delta:.2f} × 100 = ${delta_pnl:.2f}")
    print(f"  Theta cost: ${monday_theta:.2f}/day × 7 = ${theta_cost:.2f}")

    simplified_total = delta_pnl + theta_cost
    actual_pnl = friday_value - monday_value
    other_factors = actual_pnl - simplified_total

    print(f"  Simplified total: ${simplified_total:.2f}")
    print(f"  Actual P&L: ${actual_pnl:.2f}")
    print(f"  VIX & other factors: ${other_factors:.2f}")

    print(f"\n  PROBLEM:")
    print(f"    - Using Friday's delta instead of an average over the week")
    print(f"    - VIX change from 15 to 20 significantly increases option value")
    print(f"    - This volatility expansion is captured in 'other factors'")
    print(f"    - But it can be very large and confusing!")

    print(f"\n  SOLUTION OPTIONS:")
    print(f"    1. Remove 'VIX & other factors' line entirely")
    print(f"    2. Just show: Delta P&L, Theta cost, and Actual P&L")
    print(f"    3. Simplify to only show Actual P&L")

    print("\n" + "=" * 80)

def main():
    test_account_balance_tracking()
    test_vix_factors_calculation()

    print("\n" + "=" * 80)
    print("RECOMMENDATIONS")
    print("=" * 80)
    print()
    print("1. ACCOUNT BALANCE ISSUE:")
    print("   - Verify that cash is properly updated when closing positions")
    print("   - Check if stateManager.ts lines 263, 280 are being called")
    print("   - The cash += currentValue should add realized profit")
    print()
    print("2. VIX & OTHER FACTORS ISSUE:")
    print("   - Remove the 'VIX & other factors' line (lines 522-534 in GameScreen.ts)")
    print("   - Just show Delta P&L, Theta cost, and Actual P&L")
    print("   - This makes the calculation clearer and less confusing")
    print()
    print("=" * 80)

if __name__ == "__main__":
    main()
