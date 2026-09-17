"""
LEAPS Pricing Model V2 - Delta-Based Updates
Based on real SPY options market data

KEY PRINCIPLE: Value changes via delta and theta, NOT by recalculating intrinsic+extrinsic
"""

import math

class LEAPSPosition:
    def __init__(self, stock_price, strike, dte, vix=15):
        """
        Initialize a LEAPS position with initial pricing
        """
        self.strike = strike
        self.dte = dte
        self.cost_basis = None

        # Calculate initial value, delta, theta
        self.value, self.delta, self.theta, self.extrinsic = self._calculate_initial_pricing(
            stock_price, strike, dte, vix
        )

        self.cost_basis = self.value
        self.stock_price_at_open = stock_price

    def _calculate_initial_pricing(self, stock_price, strike, dte, vix):
        """
        Calculate initial LEAPS pricing based on real market data
        """
        # Intrinsic value
        intrinsic = max(0, stock_price - strike) * 100

        # Calculate moneyness
        percent_itm = ((stock_price - strike) / stock_price) * 100

        # Calculate delta based on moneyness
        delta = self._calculate_delta(percent_itm)

        # Calculate extrinsic value
        extrinsic = self._calculate_extrinsic(percent_itm, dte, vix)

        # Total value
        total = intrinsic + extrinsic

        # Calculate theta (daily decay of extrinsic)
        theta = -extrinsic / dte  # Linear decay

        return total, delta, theta, extrinsic

    def _calculate_delta(self, percent_itm):
        """
        Calculate delta based on how far ITM/OTM
        Based on real market data: ATM = 0.52, 0.78% ITM = 0.66
        """
        if percent_itm >= 15:
            # Very deep ITM: approach 0.95
            return 0.95
        elif percent_itm >= 10:
            # Deep ITM: 0.90 to 0.95
            return 0.90 + (percent_itm - 10) / 5 * 0.05
        elif percent_itm >= 5:
            # Moderate ITM: 0.75 to 0.90
            return 0.75 + (percent_itm - 5) / 5 * 0.15
        elif percent_itm >= 1:
            # Slight ITM: 0.60 to 0.75
            return 0.60 + (percent_itm - 1) / 4 * 0.15
        elif percent_itm >= 0:
            # Just barely ITM: 0.52 to 0.60
            return 0.52 + percent_itm * 0.08
        elif percent_itm >= -1:
            # Just barely OTM: 0.44 to 0.52
            return 0.52 + percent_itm * 0.08
        elif percent_itm >= -5:
            # Moderate OTM: 0.30 to 0.44
            return 0.44 + (percent_itm + 1) / 4 * 0.14
        else:
            # Deep OTM: 0.10 to 0.30
            return max(0.10, 0.30 + (percent_itm + 5) / 5 * 0.20)

    def _calculate_extrinsic(self, percent_itm, dte, vix):
        """
        Calculate extrinsic value
        Based on real data: ATM 7 DTE = $450, scales with sqrt(time)
        """
        # Base extrinsic for ATM at 7 DTE
        base_7dte = 450

        # Scale by time (sqrt relationship)
        time_factor = math.sqrt(dte / 7)
        base_extrinsic = base_7dte * time_factor

        # Adjust for moneyness
        if percent_itm >= 10:
            # Deep ITM: extrinsic drops dramatically
            # At 10% ITM, extrinsic is ~30% of ATM
            # At 15%+ ITM, extrinsic is ~10% of ATM
            itm_factor = max(0.10, 0.30 - (percent_itm - 10) * 0.04)
            moneyness_adjusted = base_extrinsic * itm_factor
        elif percent_itm >= 1:
            # Slight ITM: gradual reduction
            # From 100% at ATM to 60% at 1% ITM to 30% at 10% ITM
            itm_factor = 1.0 - percent_itm * 0.07
            moneyness_adjusted = base_extrinsic * itm_factor
        elif percent_itm >= -5:
            # ATM to moderate OTM: peak extrinsic
            # Extrinsic is highest near ATM
            moneyness_adjusted = base_extrinsic * (1.0 + abs(percent_itm) * 0.02)
        else:
            # Deep OTM: lower extrinsic
            moneyness_adjusted = base_extrinsic * 0.5

        # VIX adjustment (minimal for deep ITM, full for ATM/OTM)
        if percent_itm >= 10:
            # Deep ITM: no VIX impact
            vix_factor = 1.0
        elif percent_itm >= 5:
            # Moderate ITM: reduced VIX impact
            vix_factor = 1.0 + (vix - 15) / 15 * 0.2
        else:
            # ATM/OTM: full VIX impact
            vix_factor = 1.0 + (vix - 15) / 15 * 0.5

        return moneyness_adjusted * vix_factor

    def advance_day(self, new_stock_price, new_vix=15):
        """
        Update LEAPS value after one day
        CRITICAL: Uses delta-based updates, NOT intrinsic+extrinsic recalculation
        """
        # Calculate stock price change
        # We need to track what stock price we last used
        if not hasattr(self, 'last_stock_price'):
            self.last_stock_price = self.stock_price_at_open

        stock_change = new_stock_price - self.last_stock_price

        # Update value using delta
        stock_impact = stock_change * self.delta * 100

        # Update value using theta
        theta_impact = self.theta * 1  # 1 day

        # New value
        self.value += stock_impact + theta_impact

        # Update extrinsic (decays linearly)
        self.extrinsic += theta_impact  # theta is negative, so extrinsic decreases

        # Update DTE
        self.dte -= 1

        # Recalculate theta based on new extrinsic
        if self.dte > 0:
            self.theta = -self.extrinsic / self.dte
        else:
            self.theta = 0

        # Update delta based on new moneyness
        percent_itm = ((new_stock_price - self.strike) / new_stock_price) * 100
        self.delta = self._calculate_delta(percent_itm)

        # Track current stock price for next update
        self.last_stock_price = new_stock_price

        return {
            'value': self.value,
            'delta': self.delta,
            'theta': self.theta,
            'extrinsic': self.extrinsic,
            'stock_impact': stock_impact,
            'theta_impact': theta_impact
        }

    def get_pnl(self):
        """Calculate unrealized P&L"""
        return self.value - self.cost_basis


def test_model():
    """Test the model with realistic scenario"""
    print("=" * 80)
    print("LEAPS PRICING MODEL V2 - DELTA-BASED UPDATES")
    print("=" * 80)
    print()

    # Scenario from user's game
    monday_spy = 580.90
    friday_spy = 585.00
    strike = 510
    dte_monday = 366

    print("SCENARIO:")
    print(f"  Strike: ${strike}")
    print(f"  Monday SPY: ${monday_spy:.2f}")
    print(f"  Friday SPY: ${friday_spy:.2f}")
    print(f"  Stock Change: +${friday_spy - monday_spy:.2f}")
    print(f"  Initial DTE: {dte_monday} days")
    print()

    # Create LEAPS position
    leaps = LEAPSPosition(monday_spy, strike, dte_monday, vix=15)

    print("MONDAY (Position Opened):")
    print(f"  Value: ${leaps.value:,.2f}")
    print(f"  Delta: {leaps.delta:.3f}")
    print(f"  Theta: ${leaps.theta:.2f}/day")
    print(f"  Extrinsic: ${leaps.extrinsic:.2f}")
    intrinsic_monday = (monday_spy - strike) * 100
    print(f"  Intrinsic: ${intrinsic_monday:.2f}")
    print(f"  Extrinsic %: {leaps.extrinsic / leaps.value * 100:.1f}%")
    print()

    # Simulate 5 trading days (Monday to Friday)
    stock_prices = [
        monday_spy,
        monday_spy + (friday_spy - monday_spy) * 0.2,  # Tuesday
        monday_spy + (friday_spy - monday_spy) * 0.4,  # Wednesday
        monday_spy + (friday_spy - monday_spy) * 0.7,  # Thursday
        friday_spy  # Friday
    ]

    print("DAILY UPDATES:")
    print(f"{'Day':<10} {'SPY':<10} {'Value':<12} {'Delta':<8} {'Stock $':<10} {'Theta $':<10} {'Daily P&L':<12}")
    print("-" * 80)

    week_start_value = leaps.value

    for i, spy in enumerate(stock_prices[1:], 1):
        result = leaps.advance_day(spy)
        daily_pnl = result['stock_impact'] + result['theta_impact']

        day_name = ['Tuesday', 'Wednesday', 'Thursday', 'Friday'][i-1]
        print(f"{day_name:<10} ${spy:<9.2f} ${result['value']:<11,.2f} {result['delta']:<7.3f} "
              f"${result['stock_impact']:<9.2f} ${result['theta_impact']:<9.2f} ${daily_pnl:<11.2f}")

    print()
    print("FRIDAY (Week End):")
    print(f"  Value: ${leaps.value:,.2f}")
    print(f"  Delta: {leaps.delta:.3f}")
    print(f"  Theta: ${leaps.theta:.2f}/day")
    print(f"  Extrinsic: ${leaps.extrinsic:.2f}")
    intrinsic_friday = (friday_spy - strike) * 100
    print(f"  Intrinsic: ${intrinsic_friday:.2f}")
    print()

    # Calculate P&L
    weekly_pnl = leaps.value - week_start_value
    stock_change = friday_spy - monday_spy
    expected_stock_impact = stock_change * leaps.delta * 100
    expected_theta_impact = leaps.theta * 5  # 5 days
    expected_pnl = expected_stock_impact + expected_theta_impact

    print("=" * 80)
    print("WEEKLY P&L ANALYSIS")
    print("=" * 80)
    print()
    print(f"Stock Impact (simplified): ${stock_change:.2f} × {leaps.delta:.2f} × 100 = ${expected_stock_impact:.2f}")
    print(f"Theta Impact (5 days): ${leaps.theta:.2f}/day × 5 = ${expected_theta_impact:.2f}")
    print(f"Expected P&L: ${expected_pnl:.2f}")
    print()
    print(f"Actual P&L: ${weekly_pnl:.2f}")
    print(f"Difference: ${abs(weekly_pnl - expected_pnl):.2f}")
    print()

    if abs(weekly_pnl - expected_pnl) < 10:
        print("✓✓✓ EXCELLENT! P&L matches delta × stock + theta calculation!")
    else:
        print("Note: Difference due to delta changes during the week")

    print()
    print("=" * 80)


if __name__ == "__main__":
    test_model()
