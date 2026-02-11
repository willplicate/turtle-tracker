#!/usr/bin/env python3
"""
Interactive LEAPS Pricing Model Tester
Run this to test different scenarios without editing code
"""

from leaps_pricing_model_v2 import LEAPSPosition

def main():
    print("=" * 80)
    print("INTERACTIVE LEAPS PRICING MODEL TESTER")
    print("=" * 80)
    print()

    # Get user inputs
    print("Enter scenario parameters:")
    print("-" * 40)

    strike = float(input("LEAPS Strike Price (e.g., 510): ") or "510")
    monday_spy = float(input("Monday SPY Price (e.g., 580.90): ") or "580.90")
    friday_spy = float(input("Friday SPY Price (e.g., 585.00): ") or "585.00")
    dte = int(input("Days to Expiration (e.g., 366): ") or "366")
    vix = float(input("VIX Level (e.g., 15): ") or "15")

    print()
    print("=" * 80)
    print("TESTING SCENARIO")
    print("=" * 80)
    print(f"Strike: ${strike:.2f}")
    print(f"Monday SPY: ${monday_spy:.2f}")
    print(f"Friday SPY: ${friday_spy:.2f}")
    print(f"Stock Change: ${friday_spy - monday_spy:+.2f}")
    print(f"DTE: {dte} days")
    print(f"VIX: {vix}")
    print()

    # Create LEAPS position
    leaps = LEAPSPosition(monday_spy, strike, dte, vix)

    print("MONDAY (Opening):")
    print("-" * 40)
    intrinsic_monday = max(0, monday_spy - strike) * 100
    percent_itm = ((monday_spy - strike) / monday_spy) * 100
    print(f"Value:      ${leaps.value:,.2f}")
    print(f"Intrinsic:  ${intrinsic_monday:,.2f}")
    print(f"Extrinsic:  ${leaps.extrinsic:.2f} ({leaps.extrinsic/leaps.value*100:.1f}% of value)")
    print(f"Delta:      {leaps.delta:.3f}")
    print(f"Theta:      ${leaps.theta:.2f}/day")
    print(f"% ITM:      {percent_itm:.2f}%")
    print()

    # Simulate the week
    week_start_value = leaps.value
    stock_change_per_day = (friday_spy - monday_spy) / 4

    print("DAILY PROGRESSION:")
    print("-" * 80)
    print(f"{'Day':<10} {'SPY Price':<12} {'Value':<12} {'Delta':<8} {'Daily P&L':<12}")
    print("-" * 80)

    days = ['Tuesday', 'Wednesday', 'Thursday', 'Friday']
    for i, day in enumerate(days, 1):
        new_spy = monday_spy + stock_change_per_day * i
        result = leaps.advance_day(new_spy, vix)
        daily_pnl = result['stock_impact'] + result['theta_impact']

        print(f"{day:<10} ${new_spy:<11.2f} ${result['value']:<11,.2f} "
              f"{result['delta']:<7.3f} ${daily_pnl:+.2f}")

    print()
    print("=" * 80)
    print("FRIDAY (Week End):")
    print("-" * 40)
    intrinsic_friday = max(0, friday_spy - strike) * 100
    print(f"Value:      ${leaps.value:,.2f}")
    print(f"Intrinsic:  ${intrinsic_friday:,.2f}")
    print(f"Extrinsic:  ${leaps.extrinsic:.2f}")
    print(f"Delta:      {leaps.delta:.3f}")
    print(f"Theta:      ${leaps.theta:.2f}/day")
    print()

    print("=" * 80)
    print("WEEKLY P&L BREAKDOWN")
    print("=" * 80)

    weekly_pnl = leaps.value - week_start_value
    stock_change = friday_spy - monday_spy

    # Use average delta for calculation
    avg_delta = leaps.delta
    expected_stock_impact = stock_change * avg_delta * 100
    expected_theta_impact = leaps.theta * 4  # 4 days
    expected_pnl = expected_stock_impact + expected_theta_impact

    print()
    print("Educational Calculation (shown to users):")
    print(f"  Stock Impact:  ${stock_change:.2f} × {avg_delta:.2f} × 100 = ${expected_stock_impact:+.2f}")
    print(f"  Theta (4 days): ${leaps.theta:.2f}/day × 4 = ${expected_theta_impact:+.2f}")
    print(f"  Expected P&L:  ${expected_pnl:+.2f}")
    print()
    print("Actual Results:")
    print(f"  Actual P&L:    ${weekly_pnl:+.2f}")
    print(f"  Difference:    ${abs(weekly_pnl - expected_pnl):.2f}")
    print()

    if abs(weekly_pnl - expected_pnl) < 20:
        print("✅ EXCELLENT! P&L closely matches educational calculation!")
    else:
        print("⚠️  Note: Difference due to delta changing during the week")

    print()
    print("=" * 80)

    # Ask if user wants to test another scenario
    print()
    another = input("Test another scenario? (y/n): ").lower()
    if another == 'y':
        print("\n\n")
        main()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTesting cancelled.")
    except Exception as e:
        print(f"\nError: {e}")
