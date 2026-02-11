"""
Complete Trading Simulator - Python Version
Implements the full Turtle Strategy (LEAPS + Weekly Short Calls)

This is the reference implementation to verify all pricing logic
before porting to TypeScript/web version.
"""

import math
from datetime import datetime, timedelta
from typing import Optional, Dict, List


class LEAPSPosition:
    """Long LEAPS call option position"""

    def __init__(self, stock_price: float, strike: float, dte: int, vix: float = 15):
        """Initialize LEAPS position"""
        self.strike = strike
        self.dte = dte
        self.opening_stock_price = stock_price
        self.last_stock_price = stock_price

        # Calculate initial pricing
        self.value, self.delta, self.theta, self.extrinsic = self._calculate_initial_pricing(
            stock_price, strike, dte, vix
        )

        self.cost_basis = self.value
        self.intrinsic = max(0, stock_price - strike) * 100

    def _calculate_delta(self, percent_itm: float) -> float:
        """Calculate delta based on moneyness"""
        if percent_itm >= 15:
            return 0.95
        elif percent_itm >= 10:
            return 0.90 + (percent_itm - 10) / 5 * 0.05
        elif percent_itm >= 5:
            return 0.75 + (percent_itm - 5) / 5 * 0.15
        elif percent_itm >= 1:
            return 0.60 + (percent_itm - 1) / 4 * 0.15
        elif percent_itm >= 0:
            return 0.52 + percent_itm * 0.08
        elif percent_itm >= -1:
            return 0.52 + percent_itm * 0.08
        elif percent_itm >= -5:
            return 0.44 + (percent_itm + 1) / 4 * 0.14
        else:
            return max(0.10, 0.30 + (percent_itm + 5) / 5 * 0.20)

    def _calculate_extrinsic(self, percent_itm: float, dte: int, vix: float) -> float:
        """Calculate extrinsic value"""
        base_7dte = 450
        time_factor = math.sqrt(dte / 7)
        base_extrinsic = base_7dte * time_factor

        # Moneyness adjustment
        if percent_itm >= 10:
            itm_factor = max(0.10, 0.30 - (percent_itm - 10) * 0.04)
            moneyness_adjusted = base_extrinsic * itm_factor
        elif percent_itm >= 1:
            itm_factor = 1.0 - percent_itm * 0.07
            moneyness_adjusted = base_extrinsic * itm_factor
        elif percent_itm >= -5:
            moneyness_adjusted = base_extrinsic * (1.0 + abs(percent_itm) * 0.02)
        else:
            moneyness_adjusted = base_extrinsic * 0.5

        # VIX adjustment
        if percent_itm >= 10:
            vix_factor = 1.0
        elif percent_itm >= 5:
            vix_factor = 1.0 + (vix - 15) / 15 * 0.2
        else:
            vix_factor = 1.0 + (vix - 15) / 15 * 0.5

        return moneyness_adjusted * vix_factor

    def _calculate_initial_pricing(self, stock_price: float, strike: float, dte: int, vix: float):
        """Calculate initial LEAPS pricing"""
        intrinsic = max(0, stock_price - strike) * 100
        percent_itm = ((stock_price - strike) / stock_price) * 100

        delta = self._calculate_delta(percent_itm)
        extrinsic = self._calculate_extrinsic(percent_itm, dte, vix)
        total = intrinsic + extrinsic
        theta = -extrinsic / dte if dte > 0 else 0

        return total, delta, theta, extrinsic

    def advance_day(self, new_stock_price: float, vix: float = 15) -> Dict:
        """Update LEAPS value after one day using delta-based approach"""
        stock_change = new_stock_price - self.last_stock_price

        # Calculate impacts
        stock_impact = stock_change * self.delta * 100
        theta_impact = self.theta * 1  # 1 day

        # Update value
        self.value += stock_impact + theta_impact
        self.extrinsic += theta_impact  # theta is negative
        self.intrinsic = max(0, new_stock_price - self.strike) * 100

        # Update DTE
        self.dte -= 1

        # Recalculate theta
        if self.dte > 0:
            self.theta = -self.extrinsic / self.dte
        else:
            self.theta = 0

        # Update delta
        percent_itm = ((new_stock_price - self.strike) / new_stock_price) * 100
        self.delta = self._calculate_delta(percent_itm)

        # Track stock price
        self.last_stock_price = new_stock_price

        return {
            'value': self.value,
            'delta': self.delta,
            'theta': self.theta,
            'stock_impact': stock_impact,
            'theta_impact': theta_impact,
            'daily_pnl': stock_impact + theta_impact
        }

    def get_pnl(self) -> float:
        """Get unrealized P&L"""
        return self.value - self.cost_basis


class ShortCallPosition:
    """Short weekly call option position"""

    def __init__(self, stock_price: float, strike: float, dte: int, vix: float = 15):
        """Initialize short call position"""
        self.strike = strike
        self.dte = dte
        self.opening_stock_price = stock_price
        self.last_stock_price = stock_price

        # Calculate initial value (premium collected)
        self.value = self._calculate_weekly_call_value(stock_price, strike, dte, vix)
        self.premium_collected = self.value

        # For short positions, we track the LIABILITY (negative)
        # Premium collected is a credit, so initial position value is negative
        self.current_value = -self.value

    def _calculate_weekly_call_value(self, stock_price: float, strike: float, dte: int, vix: float) -> float:
        """Calculate weekly call option value"""
        intrinsic = max(0, stock_price - strike) * 100

        # Calculate extrinsic
        percent_from_strike = ((stock_price - strike) / strike) * 100

        # Base extrinsic for ATM 7 DTE
        base_7dte = 150

        # Time factor (square root of time)
        time_factor = math.sqrt(dte / 7) if dte > 0 else 0
        base_extrinsic = base_7dte * time_factor

        # Moneyness factor
        if abs(percent_from_strike) <= 0.5:
            # ATM
            moneyness_factor = 1.0
        elif percent_from_strike > 0.5:
            # ITM
            moneyness_factor = max(0.3, 1.0 - (percent_from_strike - 0.5) * 0.15)
        else:
            # OTM
            moneyness_factor = max(0.3, 1.0 - (abs(percent_from_strike) - 0.5) * 0.15)

        extrinsic = base_extrinsic * moneyness_factor

        # VIX factor
        vix_factor = vix / 15
        extrinsic *= vix_factor

        return intrinsic + extrinsic

    def advance_day(self, new_stock_price: float, vix: float = 15) -> Dict:
        """Update short call value after one day"""
        # Recalculate the option's value
        old_value = -self.current_value  # Flip sign to get option value

        self.dte -= 1
        if self.dte < 0:
            self.dte = 0

        new_option_value = self._calculate_weekly_call_value(new_stock_price, self.strike, self.dte, vix)

        # For short position, we want the negative (it's a liability)
        self.current_value = -new_option_value

        # Daily P&L is the change in our liability
        # If option value goes down, we profit (positive P&L)
        # If option value goes up, we lose (negative P&L)
        daily_pnl = -(new_option_value - old_value)

        self.last_stock_price = new_stock_price

        return {
            'option_value': new_option_value,
            'current_value': self.current_value,
            'daily_pnl': daily_pnl
        }

    def get_pnl(self) -> float:
        """Get P&L on short call"""
        # P&L = premium collected - current liability
        # Since current_value is negative, we add it
        return self.premium_collected + self.current_value

    def close(self, stock_price: float, vix: float = 15) -> float:
        """Close the position and return P&L"""
        closing_cost = self._calculate_weekly_call_value(stock_price, self.strike, self.dte, vix)
        pnl = self.premium_collected - closing_cost
        return pnl


class TradingSimulator:
    """Complete trading simulator"""

    def __init__(self, starting_capital: float = 20000):
        """Initialize simulator"""
        self.starting_capital = starting_capital
        self.cash = starting_capital
        self.leaps_position: Optional[LEAPSPosition] = None
        self.short_call: Optional[ShortCallPosition] = None

        self.current_day = 0
        self.current_stock_price = 590.0
        self.current_vix = 15.0

        # Track weekly P&L
        self.week_start_value = starting_capital
        self.trade_history: List[Dict] = []

    def get_total_value(self) -> float:
        """Get total portfolio value"""
        total = self.cash

        if self.leaps_position:
            total += self.leaps_position.value

        if self.short_call:
            # Short call is a liability (negative value)
            total += self.short_call.current_value

        return total

    def get_weekly_pnl(self) -> float:
        """Get P&L for current week"""
        return self.get_total_value() - self.week_start_value

    def get_total_pnl(self) -> float:
        """Get total P&L since start"""
        return self.get_total_value() - self.starting_capital

    def open_leaps(self, strike: float, dte: int, vix: float = None) -> Dict:
        """Open a LEAPS position"""
        if vix is None:
            vix = self.current_vix

        if self.leaps_position:
            return {'error': 'LEAPS position already exists'}

        leaps = LEAPSPosition(self.current_stock_price, strike, dte, vix)

        if leaps.value > self.cash:
            return {'error': 'Insufficient cash'}

        self.cash -= leaps.value
        self.leaps_position = leaps

        self.trade_history.append({
            'day': self.current_day,
            'action': 'OPEN_LEAPS',
            'strike': strike,
            'dte': dte,
            'cost': leaps.value,
            'stock_price': self.current_stock_price
        })

        return {
            'success': True,
            'cost': leaps.value,
            'delta': leaps.delta,
            'theta': leaps.theta
        }

    def sell_weekly_call(self, strike: float, dte: int = 7, vix: float = None) -> Dict:
        """Sell a weekly call"""
        if vix is None:
            vix = self.current_vix

        if self.short_call:
            return {'error': 'Short call position already exists'}

        short_call = ShortCallPosition(self.current_stock_price, strike, dte, vix)

        self.cash += short_call.premium_collected
        self.short_call = short_call

        self.trade_history.append({
            'day': self.current_day,
            'action': 'SELL_CALL',
            'strike': strike,
            'dte': dte,
            'premium': short_call.premium_collected,
            'stock_price': self.current_stock_price
        })

        return {
            'success': True,
            'premium': short_call.premium_collected
        }

    def advance_day(self, new_stock_price: float, vix: float = None) -> Dict:
        """Advance one day"""
        if vix is None:
            vix = self.current_vix
        else:
            self.current_vix = vix

        self.current_day += 1
        old_total_value = self.get_total_value()

        results = {
            'day': self.current_day,
            'stock_price': new_stock_price,
            'vix': vix,
            'leaps': None,
            'short_call': None
        }

        # Update LEAPS
        if self.leaps_position:
            leaps_result = self.leaps_position.advance_day(new_stock_price, vix)
            results['leaps'] = leaps_result

        # Update short call
        if self.short_call:
            call_result = self.short_call.advance_day(new_stock_price, vix)
            results['short_call'] = call_result

            # Auto-expire if DTE reaches 0
            if self.short_call.dte == 0:
                pnl = self.short_call.get_pnl()
                self.short_call = None
                results['short_call']['expired'] = True
                results['short_call']['final_pnl'] = pnl

        self.current_stock_price = new_stock_price

        # Calculate total daily P&L
        new_total_value = self.get_total_value()
        results['daily_pnl'] = new_total_value - old_total_value
        results['total_value'] = new_total_value
        results['weekly_pnl'] = self.get_weekly_pnl()

        return results

    def reset_week(self):
        """Reset weekly P&L tracking"""
        self.week_start_value = self.get_total_value()

    def get_status(self) -> Dict:
        """Get current portfolio status"""
        status = {
            'day': self.current_day,
            'stock_price': self.current_stock_price,
            'vix': self.current_vix,
            'cash': self.cash,
            'total_value': self.get_total_value(),
            'total_pnl': self.get_total_pnl(),
            'weekly_pnl': self.get_weekly_pnl(),
            'leaps': None,
            'short_call': None
        }

        if self.leaps_position:
            status['leaps'] = {
                'strike': self.leaps_position.strike,
                'dte': self.leaps_position.dte,
                'value': self.leaps_position.value,
                'delta': self.leaps_position.delta,
                'theta': self.leaps_position.theta,
                'pnl': self.leaps_position.get_pnl()
            }

        if self.short_call:
            status['short_call'] = {
                'strike': self.short_call.strike,
                'dte': self.short_call.dte,
                'premium_collected': self.short_call.premium_collected,
                'current_liability': -self.short_call.current_value,
                'pnl': self.short_call.get_pnl()
            }

        return status


def run_test_scenario():
    """Run a test scenario to verify all pricing logic"""
    print("=" * 80)
    print("TRADING SIMULATOR - TEST SCENARIO")
    print("=" * 80)
    print()

    # Initialize simulator
    sim = TradingSimulator(starting_capital=20000)

    # Day 0 (Monday): Open positions
    print("DAY 0 (MONDAY) - Opening Positions")
    print(f"Starting Capital: ${sim.cash:,.2f}")
    print(f"SPY: ${sim.current_stock_price:.2f}")
    print()

    # Buy LEAPS
    leaps_result = sim.open_leaps(strike=510, dte=366)
    print(f"Opened LEAPS:")
    print(f"  Strike: $510")
    print(f"  Cost: ${leaps_result['cost']:,.2f}")
    print(f"  Delta: {leaps_result['delta']:.3f}")
    print(f"  Theta: ${leaps_result['theta']:.2f}/day")
    print()

    # Sell weekly call
    call_result = sim.sell_weekly_call(strike=593, dte=5)
    print(f"Sold Weekly Call:")
    print(f"  Strike: $593")
    print(f"  Premium Collected: ${call_result['premium']:.2f}")
    print()

    status = sim.get_status()
    print(f"Cash after trades: ${status['cash']:,.2f}")
    print(f"Total Portfolio Value: ${status['total_value']:,.2f}")
    print()
    print("=" * 80)
    print()

    # Simulate 5 days (Monday to Friday)
    stock_prices = [590.0, 591.5, 592.8, 594.2, 595.0]

    print("DAILY PROGRESSION:")
    print(f"{'Day':<10} {'SPY':<10} {'LEAPS P&L':<12} {'Call P&L':<12} {'Daily P&L':<12} {'Weekly P&L':<12}")
    print("-" * 80)

    for i, spy in enumerate(stock_prices[1:], 1):
        result = sim.advance_day(spy)

        day_name = ['Tuesday', 'Wednesday', 'Thursday', 'Friday'][i-1]
        leaps_pnl = result['leaps']['daily_pnl'] if result['leaps'] else 0
        call_pnl = result['short_call']['daily_pnl'] if result['short_call'] else 0

        print(f"{day_name:<10} ${spy:<9.2f} ${leaps_pnl:<11.2f} ${call_pnl:<11.2f} "
              f"${result['daily_pnl']:<11.2f} ${result['weekly_pnl']:<11.2f}")

    print()
    print("=" * 80)
    print("FINAL STATUS (FRIDAY)")
    print("=" * 80)

    final_status = sim.get_status()
    print(f"Total Portfolio Value: ${final_status['total_value']:,.2f}")
    print(f"Weekly P&L: ${final_status['weekly_pnl']:.2f}")
    print(f"Total P&L: ${final_status['total_pnl']:.2f}")
    print()

    if final_status['leaps']:
        print("LEAPS Position:")
        print(f"  Value: ${final_status['leaps']['value']:,.2f}")
        print(f"  Delta: {final_status['leaps']['delta']:.3f}")
        print(f"  P&L: ${final_status['leaps']['pnl']:.2f}")
        print()

    if final_status['short_call']:
        print("Short Call Position:")
        print(f"  Premium Collected: ${final_status['short_call']['premium_collected']:.2f}")
        print(f"  Current Liability: ${final_status['short_call']['current_liability']:.2f}")
        print(f"  P&L: ${final_status['short_call']['pnl']:.2f}")
        print()

    print("=" * 80)


if __name__ == "__main__":
    run_test_scenario()
