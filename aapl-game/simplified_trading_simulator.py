"""
Simplified Trading Simulator - Educational Version
Easy-to-understand pricing model for teaching the Turtle Strategy

Key Simplifications:
1. Fixed theta decay (no square-root time scaling)
2. Minimal VIX impact (disabled for deep ITM LEAPS)
3. Simple linear calculations
4. Weekly P&L resets every Monday
"""

import math
from typing import Optional, Dict, List


class LEAPSPosition:
    """Long LEAPS call option - Simplified Educational Model"""

    def __init__(self, stock_price: float, strike: float, dte: int):
        """Initialize LEAPS position with simplified pricing"""
        self.strike = strike
        self.dte = dte
        self.opening_stock_price = stock_price
        self.last_stock_price = stock_price

        # Calculate initial value
        self.intrinsic = max(0, stock_price - strike) * 100
        self.delta = self._calculate_simple_delta(stock_price, strike)
        self.extrinsic = self._calculate_simple_extrinsic(stock_price, strike, dte)
        self.value = self.intrinsic + self.extrinsic

        # Fixed theta - simple linear decay
        self.theta = -self.extrinsic / dte if dte > 0 else 0

        self.cost_basis = self.value

    def _calculate_simple_delta(self, stock_price: float, strike: float) -> float:
        """
        Simplified delta calculation
        Deep ITM (>10%): 0.85-0.90
        Moderate ITM (5-10%): 0.75-0.85
        Slight ITM (0-5%): 0.60-0.75
        """
        percent_itm = ((stock_price - strike) / stock_price) * 100

        if percent_itm >= 15:
            return 0.90
        elif percent_itm >= 10:
            return 0.85
        elif percent_itm >= 5:
            return 0.75 + (percent_itm - 5) / 5 * 0.10  # Linear 0.75 to 0.85
        elif percent_itm >= 0:
            return 0.60 + percent_itm / 5 * 0.15  # Linear 0.60 to 0.75
        else:
            # OTM - not typical for LEAPS strategy
            return max(0.50, 0.60 + percent_itm / 5 * 0.10)

    def _calculate_simple_extrinsic(self, stock_price: float, strike: float, dte: int) -> float:
        """
        Simplified extrinsic calculation
        Rule: $2-3 per day for deep ITM LEAPS (~120 DTE)
        Scales with time remaining
        """
        percent_itm = ((stock_price - strike) / stock_price) * 100

        # Base: $2.50/day for a typical LEAPS position
        daily_extrinsic = 2.50

        # Adjustment for moneyness
        if percent_itm >= 12:
            # Very deep ITM: lower extrinsic ($2/day)
            daily_extrinsic = 2.0
        elif percent_itm >= 8:
            # Deep ITM: moderate extrinsic ($2.5/day)
            daily_extrinsic = 2.5
        elif percent_itm >= 5:
            # Moderate ITM: higher extrinsic ($3/day)
            daily_extrinsic = 3.0
        else:
            # Slight ITM or ATM: highest extrinsic ($3.5/day)
            daily_extrinsic = 3.5

        # Total extrinsic = daily rate × days remaining
        return daily_extrinsic * dte

    def advance_day(self, new_stock_price: float) -> Dict:
        """
        Update LEAPS value after one day
        Simple delta + theta model
        """
        stock_change = new_stock_price - self.last_stock_price

        # Stock impact: stock_change × delta × 100
        stock_impact = stock_change * self.delta * 100

        # Theta impact: fixed daily decay
        theta_impact = self.theta

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
            self.extrinsic = 0

        # Update delta (changes as moneyness changes)
        self.delta = self._calculate_simple_delta(new_stock_price, self.strike)

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
    """Short weekly call - Simplified Educational Model"""

    def __init__(self, stock_price: float, strike: float, dte: int = 7):
        """Initialize short weekly call with simplified pricing"""
        self.strike = strike
        self.dte = dte
        self.opening_stock_price = stock_price

        # Calculate premium (what we collect)
        self.premium_collected = self._calculate_simple_weekly_premium(stock_price, strike, dte)

        # Current value of the option (our liability)
        self.option_value = self.premium_collected

    def _calculate_simple_weekly_premium(self, stock_price: float, strike: float, dte: int) -> float:
        """
        Simplified weekly call pricing
        Base: ATM 7 DTE = $450 (matches real SPY market data)
        Scales with moneyness and time
        """
        # Intrinsic value
        intrinsic = max(0, stock_price - strike) * 100

        # Extrinsic value
        distance_from_strike = stock_price - strike
        percent_diff = (distance_from_strike / strike) * 100

        # Base extrinsic for 7 DTE ATM (real market data: $450)
        base_extrinsic_7dte = 450

        # Time scaling (linear for weeklies)
        time_factor = dte / 7

        # Moneyness factor - refined for $1 strikes on high-priced stocks
        # At SPY $590, each $1 = 0.17%, so we need fine granularity
        abs_percent = abs(percent_diff)

        if abs_percent < 0.1:
            # Very close to ATM
            moneyness_factor = 1.0
        elif abs_percent < 0.2:
            # 0.1-0.2% away (~1 strike on SPY $600)
            moneyness_factor = 1.0 - (abs_percent - 0.1) * 0.4  # 1.0 to 0.96
        elif abs_percent < 0.35:
            # 0.2-0.35% away (~2 strikes)
            moneyness_factor = 0.96 - (abs_percent - 0.2) * 0.8  # 0.96 to 0.84
        elif abs_percent < 0.5:
            # 0.35-0.5% away (~3 strikes)
            moneyness_factor = 0.84 - (abs_percent - 0.35) * 1.2  # 0.84 to 0.66
        else:
            # Further away
            moneyness_factor = max(0.3, 0.66 - (abs_percent - 0.5) * 0.8)

        extrinsic = base_extrinsic_7dte * time_factor * moneyness_factor

        return intrinsic + extrinsic

    def advance_day(self, new_stock_price: float) -> Dict:
        """Update short call value after one day"""
        old_option_value = self.option_value

        # Decrease DTE
        self.dte -= 1
        if self.dte < 0:
            self.dte = 0

        # At expiration (DTE=0), option is worth only intrinsic value (no extrinsic)
        if self.dte == 0:
            self.option_value = max(0, new_stock_price - self.strike) * 100
        else:
            # Recalculate option value
            self.option_value = self._calculate_simple_weekly_premium(new_stock_price, self.strike, self.dte)

        # Daily P&L for short position:
        # If option value decreases, we profit (positive)
        # If option value increases, we lose (negative)
        daily_pnl = old_option_value - self.option_value

        return {
            'option_value': self.option_value,
            'daily_pnl': daily_pnl,
            'dte': self.dte
        }

    def get_pnl(self) -> float:
        """Get P&L on short call"""
        return self.premium_collected - self.option_value

    def expires(self, stock_price: float) -> float:
        """Calculate final P&L at expiration"""
        intrinsic_at_expiry = max(0, stock_price - self.strike) * 100
        return self.premium_collected - intrinsic_at_expiry


class TradingSimulator:
    """Simplified Trading Simulator with Weekly P&L Reset"""

    def __init__(self, starting_capital: float = 20000):
        """Initialize simulator"""
        self.starting_capital = starting_capital
        self.cash = starting_capital
        self.leaps_position: Optional[LEAPSPosition] = None
        self.short_call: Optional[ShortCallPosition] = None

        self.current_day = 0
        self.current_stock_price = 590.0

        # Weekly P&L tracking (resets every Monday)
        self.week_start_value = starting_capital
        self.week_number = 0

        # Overall tracking
        self.trade_history: List[Dict] = []

    def get_total_value(self) -> float:
        """Get total portfolio value"""
        total = self.cash

        if self.leaps_position:
            total += self.leaps_position.value

        if self.short_call:
            # Short call is a liability
            total -= self.short_call.option_value

        return total

    def get_weekly_pnl(self) -> float:
        """Get P&L for current week (resets Monday)"""
        return self.get_total_value() - self.week_start_value

    def get_total_pnl(self) -> float:
        """Get total P&L since start"""
        return self.get_total_value() - self.starting_capital

    def reset_week(self):
        """Reset weekly P&L counter (call this every Monday)"""
        self.week_start_value = self.get_total_value()
        self.week_number += 1

    def open_leaps(self, strike: float, dte: int) -> Dict:
        """Open a LEAPS position"""
        if self.leaps_position:
            return {'error': 'LEAPS position already exists'}

        leaps = LEAPSPosition(self.current_stock_price, strike, dte)

        if leaps.value > self.cash:
            return {'error': 'Insufficient cash', 'required': leaps.value, 'available': self.cash}

        self.cash -= leaps.value
        self.leaps_position = leaps

        self.trade_history.append({
            'day': self.current_day,
            'week': self.week_number,
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
            'theta': leaps.theta,
            'intrinsic': leaps.intrinsic,
            'extrinsic': leaps.extrinsic
        }

    def sell_weekly_call(self, strike: float, dte: int = 7) -> Dict:
        """Sell a weekly call"""
        if self.short_call:
            return {'error': 'Short call position already exists'}

        if not self.leaps_position:
            return {'error': 'Must have LEAPS position first (this is a covered strategy)'}

        short_call = ShortCallPosition(self.current_stock_price, strike, dte)

        self.cash += short_call.premium_collected
        self.short_call = short_call

        self.trade_history.append({
            'day': self.current_day,
            'week': self.week_number,
            'action': 'SELL_CALL',
            'strike': strike,
            'dte': dte,
            'premium': short_call.premium_collected,
            'stock_price': self.current_stock_price
        })

        return {
            'success': True,
            'premium': short_call.premium_collected,
            'strike': strike,
            'dte': dte
        }

    def advance_day(self, new_stock_price: float) -> Dict:
        """Advance one day"""
        self.current_day += 1
        old_total_value = self.get_total_value()

        results = {
            'day': self.current_day,
            'week': self.week_number,
            'stock_price': new_stock_price,
            'leaps': None,
            'short_call': None
        }

        # Update LEAPS
        if self.leaps_position:
            leaps_result = self.leaps_position.advance_day(new_stock_price)
            results['leaps'] = leaps_result

        # Update short call
        if self.short_call:
            call_result = self.short_call.advance_day(new_stock_price)
            results['short_call'] = call_result

            # Auto-expire if DTE reaches 0
            if self.short_call.dte == 0:
                final_pnl = self.short_call.expires(new_stock_price)
                self.short_call = None
                results['short_call']['expired'] = True
                results['short_call']['final_pnl'] = final_pnl

        self.current_stock_price = new_stock_price

        # Calculate daily P&L
        new_total_value = self.get_total_value()
        results['daily_pnl'] = new_total_value - old_total_value
        results['total_value'] = new_total_value
        results['weekly_pnl'] = self.get_weekly_pnl()
        results['total_pnl'] = self.get_total_pnl()

        return results

    def get_status(self) -> Dict:
        """Get current portfolio status"""
        status = {
            'day': self.current_day,
            'week': self.week_number,
            'stock_price': self.current_stock_price,
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
                'intrinsic': self.leaps_position.intrinsic,
                'extrinsic': self.leaps_position.extrinsic,
                'pnl': self.leaps_position.get_pnl()
            }

        if self.short_call:
            status['short_call'] = {
                'strike': self.short_call.strike,
                'dte': self.short_call.dte,
                'premium_collected': self.short_call.premium_collected,
                'current_value': self.short_call.option_value,
                'pnl': self.short_call.get_pnl()
            }

        return status

    def print_status(self):
        """Print current status in readable format"""
        status = self.get_status()

        print(f"\n{'='*60}")
        print(f"Day {status['day']} | Week {status['week']} | SPY: ${status['stock_price']:.2f}")
        print(f"{'='*60}")
        print(f"Cash: ${status['cash']:,.2f}")
        print(f"Total Value: ${status['total_value']:,.2f}")
        print(f"Weekly P&L: ${status['weekly_pnl']:,.2f}")
        print(f"Total P&L: ${status['total_pnl']:,.2f}")

        if status['leaps']:
            l = status['leaps']
            print(f"\nLEAPS ({l['strike']} strike, {l['dte']} DTE):")
            print(f"  Value: ${l['value']:,.2f} | P&L: ${l['pnl']:,.2f}")
            print(f"  Delta: {l['delta']:.2f} | Theta: ${l['theta']:.2f}/day")
            print(f"  Intrinsic: ${l['intrinsic']:,.2f} | Extrinsic: ${l['extrinsic']:,.2f}")

        if status['short_call']:
            c = status['short_call']
            print(f"\nShort Call ({c['strike']} strike, {c['dte']} DTE):")
            print(f"  Premium Collected: ${c['premium_collected']:.2f}")
            print(f"  Current Value: ${c['current_value']:.2f}")
            print(f"  P&L: ${c['pnl']:.2f}")


def run_weekly_scenario():
    """Run a full week scenario with weekly P&L reset"""
    print("=" * 80)
    print("SIMPLIFIED TRADING SIMULATOR - WEEKLY SCENARIO")
    print("Educational Model with Weekly P&L Reset")
    print("=" * 80)

    sim = TradingSimulator(starting_capital=20000)

    # Monday: Open positions
    print("\n📅 WEEK 1 - MONDAY: Opening Positions")
    print(f"Starting Capital: ${sim.cash:,.2f} | SPY: ${sim.current_stock_price:.2f}")

    # Open LEAPS
    leaps = sim.open_leaps(strike=510, dte=120)
    print(f"\n✅ Opened LEAPS:")
    print(f"   Strike: $510 | Cost: ${leaps['cost']:,.2f}")
    print(f"   Delta: {leaps['delta']:.2f} | Theta: ${leaps['theta']:.2f}/day")
    print(f"   Intrinsic: ${leaps['intrinsic']:,.2f} | Extrinsic: ${leaps['extrinsic']:,.2f}")

    # Sell weekly call
    call = sim.sell_weekly_call(strike=593, dte=5)
    print(f"\n✅ Sold Weekly Call:")
    print(f"   Strike: $593 | Premium: ${call['premium']:.2f}")

    sim.print_status()

    # Simulate Mon-Fri
    print("\n" + "="*80)
    print("DAILY PROGRESSION")
    print("="*80)
    print(f"{'Day':<12} {'SPY':>8} {'LEAPS Δ':>10} {'Call Δ':>10} {'Daily P&L':>12} {'Weekly P&L':>12}")
    print("-"*80)

    # Week 1: Market moves up
    stock_prices = [
        ('Tuesday', 591.5),
        ('Wednesday', 592.8),
        ('Thursday', 594.2),
        ('Friday', 595.0)
    ]

    for day_name, spy in stock_prices:
        result = sim.advance_day(spy)

        leaps_pnl = result['leaps']['daily_pnl'] if result['leaps'] else 0
        call_pnl = result['short_call']['daily_pnl'] if result['short_call'] else 0

        print(f"{day_name:<12} ${spy:>7.2f} ${leaps_pnl:>9.2f} ${call_pnl:>9.2f} "
              f"${result['daily_pnl']:>11.2f} ${result['weekly_pnl']:>11.2f}")

    sim.print_status()

    # Save Week 1 P&L
    week1_pnl = sim.get_weekly_pnl()

    # RESET FOR WEEK 2
    print("\n" + "="*80)
    print("📅 WEEK 2 - MONDAY: Weekly P&L Reset")
    print("="*80)
    sim.reset_week()
    print(f"Week 1 Final P&L: ${week1_pnl:.2f}")
    print(f"Week 2 Starting Value: ${sim.week_start_value:,.2f}")
    print(f"Week 2 P&L: ${sim.get_weekly_pnl():.2f} (reset to $0)")

    # Sell another weekly call for Week 2
    sim.advance_day(595.5)  # Monday
    call2 = sim.sell_weekly_call(strike=598, dte=5)
    print(f"\n✅ Sold Weekly Call: Strike $598 | Premium: ${call2['premium']:.2f}")

    # Week 2: Market moves down
    week2_prices = [
        ('Tuesday', 594.8),
        ('Wednesday', 593.5),
        ('Thursday', 592.0),
        ('Friday', 591.2)
    ]

    print("\n" + "="*80)
    print("WEEK 2 PROGRESSION")
    print("="*80)
    print(f"{'Day':<12} {'SPY':>8} {'LEAPS Δ':>10} {'Call Δ':>10} {'Daily P&L':>12} {'Weekly P&L':>12}")
    print("-"*80)

    for day_name, spy in week2_prices:
        result = sim.advance_day(spy)

        leaps_pnl = result['leaps']['daily_pnl'] if result['leaps'] else 0
        call_pnl = result['short_call']['daily_pnl'] if result['short_call'] else 0

        print(f"{day_name:<12} ${spy:>7.2f} ${leaps_pnl:>9.2f} ${call_pnl:>9.2f} "
              f"${result['daily_pnl']:>11.2f} ${result['weekly_pnl']:>11.2f}")

    sim.print_status()

    # Final Summary
    week2_pnl = sim.get_weekly_pnl()
    total_pnl = sim.get_total_pnl()

    print("\n" + "="*80)
    print("📊 FINAL SUMMARY")
    print("="*80)
    print(f"Week 1 P&L: ${week1_pnl:,.2f}")
    print(f"Week 2 P&L: ${week2_pnl:,.2f}")
    print(f"Total P&L: ${total_pnl:,.2f}")
    print(f"Final Value: ${sim.get_total_value():,.2f}")
    print("\n✅ Note: Weekly P&L resets each Monday, but total P&L is cumulative")
    print("="*80)


if __name__ == "__main__":
    run_weekly_scenario()
