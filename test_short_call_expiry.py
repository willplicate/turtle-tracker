"""
Test Short Call Expiry Behavior
Verify that short calls that expire OTM return full premium as profit
"""

import sys
sys.path.append('/Users/williamford/Documents/AI-Coding/Turtle Game')

from simplified_trading_simulator import ShortCallPosition

def test_otm_expiry():
    """Test: Short call expires OTM - should keep full premium"""
    print("=" * 80)
    print("TEST: Short Call Expires OTM")
    print("=" * 80)
    print()

    # Monday: Sell 593 call when SPY is 590
    monday_spy = 590.0
    strike = 593

    short_call = ShortCallPosition(monday_spy, strike, dte=4)  # 4 DTE (expires Friday)

    print(f"MONDAY: Sold {strike} call at SPY ${monday_spy}")
    print(f"  Premium Collected: ${short_call.premium_collected:.2f}")
    print(f"  Strike: ${strike}")
    print(f"  DTE: 4 (expires Friday)")
    print()

    # Simulate days where SPY stays below strike
    days = [
        ('Tuesday', 590.5),
        ('Wednesday', 591.2),
        ('Thursday', 591.8),
        ('Friday', 592.0),  # DTE becomes 0 - EXPIRATION
    ]

    print("Daily Updates:")
    print(f"{'Day':<12} {'SPY':>8} {'Option Value':>15} {'Daily P&L':>12}")
    print("-" * 50)

    for day_name, spy in days:
        result = short_call.advance_day(spy)
        print(f"{day_name:<12} ${spy:>7.2f} ${result['option_value']:>14.2f} ${result['daily_pnl']:>11.2f}")

    print()
    print("=" * 80)
    print("FRIDAY EXPIRY - ANALYSIS")
    print("=" * 80)

    final_spy = 592.0
    intrinsic_at_expiry = max(0, final_spy - strike) * 100

    print(f"Final SPY: ${final_spy}")
    print(f"Strike: ${strike}")
    print(f"Intrinsic at Expiry: ${intrinsic_at_expiry:.2f}")
    print()
    print(f"Premium Collected: ${short_call.premium_collected:.2f}")
    print(f"Option Final Value: ${short_call.option_value:.2f}")
    print(f"Final P&L: ${short_call.get_pnl():.2f}")
    print()

    expected_pnl = short_call.premium_collected
    actual_pnl = short_call.get_pnl()

    print("EXPECTED BEHAVIOR:")
    print(f"  Call expires OTM (SPY ${final_spy} < Strike ${strike})")
    print(f"  Should be worthless (intrinsic = $0)")
    print(f"  Expected P&L = Premium Collected = ${expected_pnl:.2f}")
    print()
    print("ACTUAL RESULT:")
    print(f"  Actual P&L = ${actual_pnl:.2f}")
    print()

    if abs(actual_pnl - expected_pnl) < 1.0:
        print("✅ PASS: Short call correctly returns full premium when expires OTM")
    else:
        print(f"❌ FAIL: Expected ${expected_pnl:.2f}, got ${actual_pnl:.2f}")
        print(f"   Difference: ${abs(actual_pnl - expected_pnl):.2f}")

    print("=" * 80)


def test_itm_expiry():
    """Test: Short call expires ITM - should lose money"""
    print()
    print("=" * 80)
    print("TEST: Short Call Expires ITM")
    print("=" * 80)
    print()

    # Monday: Sell 593 call when SPY is 590
    monday_spy = 590.0
    strike = 593

    short_call = ShortCallPosition(monday_spy, strike, dte=4)  # 4 DTE (expires Friday)

    print(f"MONDAY: Sold {strike} call at SPY ${monday_spy}")
    print(f"  Premium Collected: ${short_call.premium_collected:.2f}")
    print(f"  Strike: ${strike}")
    print(f"  DTE: 4 (expires Friday)")
    print()

    # Simulate days where SPY goes ABOVE strike
    days = [
        ('Tuesday', 592.0),
        ('Wednesday', 593.5),
        ('Thursday', 594.8),
        ('Friday', 595.0),  # DTE becomes 0 - EXPIRATION, ITM!
    ]

    print("Daily Updates:")
    print(f"{'Day':<12} {'SPY':>8} {'Option Value':>15} {'Daily P&L':>12}")
    print("-" * 50)

    for day_name, spy in days:
        result = short_call.advance_day(spy)
        print(f"{day_name:<12} ${spy:>7.2f} ${result['option_value']:>14.2f} ${result['daily_pnl']:>11.2f}")

    print()
    print("=" * 80)
    print("FRIDAY EXPIRY - ANALYSIS")
    print("=" * 80)

    final_spy = 595.0
    intrinsic_at_expiry = max(0, final_spy - strike) * 100

    print(f"Final SPY: ${final_spy}")
    print(f"Strike: ${strike}")
    print(f"Amount ITM: ${final_spy - strike:.2f}")
    print(f"Intrinsic at Expiry: ${intrinsic_at_expiry:.2f}")
    print()
    print(f"Premium Collected: ${short_call.premium_collected:.2f}")
    print(f"Option Final Value: ${short_call.option_value:.2f}")
    print(f"Final P&L: ${short_call.get_pnl():.2f}")
    print()

    expected_pnl = short_call.premium_collected - intrinsic_at_expiry
    actual_pnl = short_call.get_pnl()

    print("EXPECTED BEHAVIOR:")
    print(f"  Call expires ${final_spy - strike:.2f} ITM")
    print(f"  We owe: ${intrinsic_at_expiry:.2f}")
    print(f"  Expected P&L = ${short_call.premium_collected:.2f} - ${intrinsic_at_expiry:.2f} = ${expected_pnl:.2f}")
    print()
    print("ACTUAL RESULT:")
    print(f"  Actual P&L = ${actual_pnl:.2f}")
    print()

    if abs(actual_pnl - expected_pnl) < 1.0:
        print("✅ PASS: Short call correctly calculates loss when expires ITM")
    else:
        print(f"❌ FAIL: Expected ${expected_pnl:.2f}, got ${actual_pnl:.2f}")
        print(f"   Difference: ${abs(actual_pnl - expected_pnl):.2f}")

    print("=" * 80)


if __name__ == "__main__":
    test_otm_expiry()
    test_itm_expiry()
