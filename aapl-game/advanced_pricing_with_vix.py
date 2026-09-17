"""
Advanced Trading Simulator with VIX Modeling
Adds realistic volatility dynamics for educational purposes

Key Features:
1. VIX spikes during market drops (inverse correlation)
2. VIX mean-reverts over time
3. Short call premiums affected by IV changes
4. Optional LEAPS vega for rolling decisions
"""

import math
from typing import Dict, Tuple


class VIXSimulator:
    """
    Simulates VIX behavior with realistic market dynamics

    Key Relationships:
    - Stock down 1% → VIX up ~10-15% (inverse correlation)
    - Stock down 5% → VIX spikes ~50-100%
    - VIX mean-reverts to long-term average (~15-18)
    - Half-life of mean reversion: ~10-20 days
    """

    def __init__(self, initial_vix: float = 15.0, mean_vix: float = 16.0):
        self.current_vix = initial_vix
        self.mean_vix = mean_vix
        self.vix_history = [initial_vix]

        # Calibration parameters
        self.inverse_correlation = -0.12  # Stock down 1% → VIX up 12%
        self.mean_reversion_speed = 0.08  # 8% per day pull toward mean
        self.vix_floor = 9.0  # VIX rarely goes below this
        self.vix_ceiling = 80.0  # Extreme panic level

    def update(self, stock_pct_change: float) -> float:
        """
        Update VIX based on stock movement and mean reversion

        Args:
            stock_pct_change: Stock percentage change (e.g., -2.5 for -2.5%)

        Returns:
            new_vix: Updated VIX level
        """
        old_vix = self.current_vix

        # Component 1: Inverse correlation with stock
        # More pronounced for down moves (fear is asymmetric)
        if stock_pct_change < 0:
            # Down moves: stronger VIX spike
            vix_change_from_stock = stock_pct_change * self.inverse_correlation * 1.5
        else:
            # Up moves: VIX drops but less dramatically
            vix_change_from_stock = stock_pct_change * self.inverse_correlation * 0.8

        # Component 2: Mean reversion
        # VIX wants to return to historical average
        distance_from_mean = self.current_vix - self.mean_vix
        mean_reversion_change = -distance_from_mean * self.mean_reversion_speed

        # Component 3: Volatility of volatility (VIX doesn't move smoothly)
        # Higher VIX = more volatile VIX
        vix_vol_factor = math.sqrt(self.current_vix / self.mean_vix)
        # We'll skip random component for deterministic simulation

        # Calculate new VIX
        total_change_pct = vix_change_from_stock + mean_reversion_change
        new_vix = old_vix * (1 + total_change_pct)

        # Apply floor and ceiling
        new_vix = max(self.vix_floor, min(self.vix_ceiling, new_vix))

        self.current_vix = new_vix
        self.vix_history.append(new_vix)

        return new_vix

    def get_iv_multiplier(self, base_vix: float = 15.0) -> float:
        """
        Get implied volatility multiplier for option pricing

        At VIX=15 (baseline): multiplier = 1.0
        At VIX=30 (elevated): multiplier = 2.0
        At VIX=50 (panic): multiplier = 3.33

        This affects extrinsic value of options
        """
        # Linear relationship: IV scales proportionally with VIX
        # In reality it's more complex, but this is educational
        return self.current_vix / base_vix

    def get_status(self) -> Dict:
        """Get current VIX status"""
        return {
            'current_vix': self.current_vix,
            'mean_vix': self.mean_vix,
            'iv_multiplier': self.get_iv_multiplier(),
            'regime': self._get_regime()
        }

    def _get_regime(self) -> str:
        """Classify current VIX regime"""
        if self.current_vix < 12:
            return "COMPLACENT"
        elif self.current_vix < 18:
            return "NORMAL"
        elif self.current_vix < 25:
            return "ELEVATED"
        elif self.current_vix < 35:
            return "HIGH"
        else:
            return "PANIC"


class AdvancedShortCall:
    """
    Short call with VIX-adjusted pricing
    Includes implied volatility impact on extrinsic value
    """

    def __init__(self, stock_price: float, strike: float, dte: int, vix: float, base_vix: float = 15.0):
        self.strike = strike
        self.dte = dte
        self.opening_stock_price = stock_price
        self.opening_vix = vix

        # Calculate premium with VIX
        self.premium_collected = self._calculate_premium_with_vix(
            stock_price, strike, dte, vix, base_vix
        )
        self.option_value = self.premium_collected

    def _calculate_premium_with_vix(
        self,
        stock_price: float,
        strike: float,
        dte: int,
        vix: float,
        base_vix: float = 15.0
    ) -> float:
        """
        Calculate option premium with VIX impact
        Returns total premium (use get_premium_breakdown for details)
        """
        breakdown = self._get_premium_breakdown(stock_price, strike, dte, vix, base_vix)
        return breakdown['total_premium']

    def _get_premium_breakdown(
        self,
        stock_price: float,
        strike: float,
        dte: int,
        vix: float,
        base_vix: float = 15.0
    ) -> Dict:
        """
        Calculate option premium with detailed VIX breakdown

        Returns breakdown showing:
        - Base premium (at VIX=15)
        - VIX premium (additional premium from elevated VIX)
        - Total premium
        """
        # Intrinsic value
        intrinsic = max(0, stock_price - strike) * 100

        # Base extrinsic (at VIX=15, 7 DTE, ATM)
        base_extrinsic_7dte = 450

        # Time factor
        time_factor = dte / 7

        # Moneyness factor (same as simplified model)
        distance_from_strike = stock_price - strike
        percent_diff = (distance_from_strike / strike) * 100
        abs_percent = abs(percent_diff)

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

        # Calculate BASE extrinsic (VIX = 15)
        base_extrinsic = base_extrinsic_7dte * time_factor * moneyness_factor

        # Calculate vega factor based on moneyness
        # ATM = 100%, 1 OTM = 80%, 2 OTM = 60%, 3+ OTM = 40%
        if abs_percent < 0.2:
            vega_factor = 1.0  # ATM
        elif abs_percent < 0.35:
            vega_factor = 0.8  # ~1 strike OTM
        elif abs_percent < 0.5:
            vega_factor = 0.6  # ~2 strikes OTM
        else:
            vega_factor = 0.4  # 3+ strikes OTM

        # IV Multiplier using hybrid approach (sqrt for realism, scaled for education)
        # baseMultiplier = sqrt(VIX / 15) * 1.3
        # ivMultiplier = 1.0 + (baseMultiplier - 1.0) * vegaFactor
        import math
        base_multiplier = math.sqrt(vix / base_vix) * 1.3
        iv_multiplier = 1.0 + (base_multiplier - 1.0) * vega_factor

        # Calculate extrinsic with IV impact
        total_extrinsic = base_extrinsic * iv_multiplier

        # VIX premium is the difference
        vix_premium = total_extrinsic - base_extrinsic

        return {
            'intrinsic': intrinsic,
            'base_extrinsic': base_extrinsic,
            'vix_premium': vix_premium,
            'total_extrinsic': total_extrinsic,
            'base_premium': intrinsic + base_extrinsic,
            'total_premium': intrinsic + total_extrinsic,
            'vega_factor': vega_factor,
            'iv_multiplier': iv_multiplier
        }

    def update_value(self, new_stock_price: float, new_vix: float, base_vix: float = 15.0) -> Dict:
        """Update option value with new stock price and VIX"""
        old_value = self.option_value

        # Decrease DTE
        self.dte -= 1
        if self.dte < 0:
            self.dte = 0

        # At expiration, only intrinsic value
        if self.dte == 0:
            self.option_value = max(0, new_stock_price - self.strike) * 100
        else:
            # Recalculate with current VIX
            self.option_value = self._calculate_premium_with_vix(
                new_stock_price, self.strike, self.dte, new_vix, base_vix
            )

        # Calculate P&L components
        price_impact = old_value - self.option_value  # From stock movement
        # Note: We can't easily separate VIX impact from price impact in this model
        # but we could add that detail if needed

        return {
            'option_value': self.option_value,
            'daily_pnl': old_value - self.option_value,
            'dte': self.dte,
            'current_vix': new_vix
        }

    def get_pnl(self) -> float:
        """Get current P&L"""
        return self.premium_collected - self.option_value


def demonstrate_vix_impact():
    """
    Demonstrate how VIX affects option pricing during market drops
    """
    print("=" * 80)
    print("VIX IMPACT DEMONSTRATION")
    print("Comparing option prices with and without VIX modeling")
    print("=" * 80)

    # Scenario: SPY at $590, sell 593 call (3 OTM)
    stock_price = 590.0
    strike = 593.0
    dte = 7

    # Initialize VIX simulator
    vix_sim = VIXSimulator(initial_vix=15.0)

    print(f"\nInitial Conditions:")
    print(f"  SPY: ${stock_price:.2f}")
    print(f"  Strike: ${strike:.2f} (3 OTM)")
    print(f"  DTE: {dte} days")
    print(f"  VIX: {vix_sim.current_vix:.2f}")

    # Calculate initial premium
    call_with_vix = AdvancedShortCall(stock_price, strike, dte, vix_sim.current_vix)

    print(f"\nInitial Short Call Premium: ${call_with_vix.premium_collected:.2f}")

    # Scenario 1: Stock drops 5% in one day (panic selloff)
    print("\n" + "=" * 80)
    print("SCENARIO 1: Stock Drops 5% (Panic Selloff)")
    print("=" * 80)

    new_stock_price = stock_price * 0.95  # -5%
    stock_pct_change = ((new_stock_price - stock_price) / stock_price) * 100

    # Update VIX
    new_vix = vix_sim.update(stock_pct_change)
    vix_change_pct = ((new_vix - 15.0) / 15.0) * 100

    print(f"\nStock Movement:")
    print(f"  Old SPY: ${stock_price:.2f}")
    print(f"  New SPY: ${new_stock_price:.2f} ({stock_pct_change:+.1f}%)")
    print(f"\nVIX Response:")
    print(f"  Old VIX: 15.00")
    print(f"  New VIX: {new_vix:.2f} ({vix_change_pct:+.1f}%)")
    print(f"  Regime: {vix_sim._get_regime()}")
    print(f"  IV Multiplier: {vix_sim.get_iv_multiplier():.2f}x")

    # Calculate new call value WITH VIX
    result_with_vix = call_with_vix.update_value(new_stock_price, new_vix)

    # Calculate what it would be WITHOUT VIX (using base VIX=15)
    call_without_vix = AdvancedShortCall(new_stock_price, strike, dte-1, 15.0)

    print(f"\nOption Value After Drop:")
    print(f"  WITHOUT VIX modeling: ${call_without_vix.premium_collected:.2f}")
    print(f"  WITH VIX modeling:    ${result_with_vix['option_value']:.2f}")
    print(f"  Difference:           ${result_with_vix['option_value'] - call_without_vix.premium_collected:+.2f}")

    print(f"\nP&L Impact:")
    print(f"  WITHOUT VIX: ${call_with_vix.premium_collected - call_without_vix.premium_collected:+.2f}")
    print(f"  WITH VIX:    ${call_with_vix.get_pnl():+.2f}")
    print(f"  VIX Cost:    ${(call_without_vix.premium_collected - result_with_vix['option_value']):+.2f}")

    # Key insight
    print("\n" + "=" * 80)
    print("KEY INSIGHT:")
    print("=" * 80)
    print("Even though the stock dropped and the call moved further OTM,")
    print("the VIX spike INCREASED the option's extrinsic value.")
    print("This is a critical risk of covered calls during selloffs!")

    # Scenario 2: VIX mean reversion over next week
    print("\n" + "=" * 80)
    print("SCENARIO 2: VIX Mean Reversion (Next 5 Days)")
    print("=" * 80)
    print("Stock stays flat, but VIX decays back toward mean")
    print()

    print(f"{'Day':<8} {'SPY':>8} {'VIX':>8} {'Call Value':>12} {'Daily P&L':>10}")
    print("-" * 60)

    current_spy = new_stock_price
    for day in range(1, 6):
        # Stock barely moves
        current_spy = current_spy * (1 + (0.002 if day % 2 == 0 else -0.002))  # ±0.2%
        stock_change = ((current_spy - new_stock_price) / new_stock_price) * 100

        # VIX mean reverts
        new_vix = vix_sim.update(0)  # No major stock move, just mean reversion

        # Update call value
        old_value = call_with_vix.option_value
        result = call_with_vix.update_value(current_spy, new_vix)
        daily_pnl = old_value - result['option_value']

        print(f"Day {day:<5} ${current_spy:>7.2f} {new_vix:>7.2f} ${result['option_value']:>11.2f} ${daily_pnl:>9.2f}")

    print("\n" + "=" * 80)
    print("OBSERVATION:")
    print("=" * 80)
    print("As VIX decays back toward mean, option value drops.")
    print("This helps the short call P&L even with minimal stock movement.")
    print("Theta decay + VIX decay = faster profit on short calls")


def compare_with_without_vix_multiday():
    """
    Compare a multi-day scenario with and without VIX
    """
    print("\n" + "=" * 80)
    print("MULTI-DAY COMPARISON: WITH vs WITHOUT VIX")
    print("=" * 80)

    # Setup
    stock_price = 590.0
    strike = 593.0
    dte = 7

    # Track two scenarios
    vix_sim = VIXSimulator(initial_vix=15.0)
    call_with_vix = AdvancedShortCall(stock_price, strike, dte, 15.0)
    call_without_vix = AdvancedShortCall(stock_price, strike, dte, 15.0)

    # Simulate week with volatility
    price_path = [
        (590.0, "Monday - Flat"),
        (585.5, "Tuesday - Drop 4.5%"),  # Big drop
        (587.0, "Wednesday - Small bounce"),
        (586.0, "Thursday - Slight drop"),
        (588.0, "Friday - Recovery")
    ]

    print(f"\n{'Day':<25} {'SPY':>8} {'VIX':>8} {'With VIX':>12} {'Without VIX':>12} {'Difference':>12}")
    print("-" * 90)

    previous_spy = stock_price

    for i, (spy, day_label) in enumerate(price_path):
        if i == 0:
            print(f"{day_label:<25} ${spy:>7.2f} {vix_sim.current_vix:>7.2f} "
                  f"${call_with_vix.option_value:>11.2f} ${call_without_vix.option_value:>11.2f} ${0:>11.2f}")
            previous_spy = spy
            continue

        # Calculate stock change
        stock_pct_change = ((spy - previous_spy) / previous_spy) * 100

        # Update VIX
        new_vix = vix_sim.update(stock_pct_change)

        # Update both calls
        call_with_vix.update_value(spy, new_vix)
        call_without_vix.update_value(spy, 15.0)  # Fixed VIX

        difference = call_with_vix.option_value - call_without_vix.option_value

        print(f"{day_label:<25} ${spy:>7.2f} {new_vix:>7.2f} "
              f"${call_with_vix.option_value:>11.2f} ${call_without_vix.option_value:>11.2f} ${difference:>11.2f}")

        previous_spy = spy

    # Final P&L comparison
    print("\n" + "=" * 90)
    print("FINAL P&L COMPARISON")
    print("=" * 90)

    pnl_with_vix = call_with_vix.get_pnl()
    pnl_without_vix = call_without_vix.get_pnl()

    print(f"Starting Premium: ${call_with_vix.premium_collected:.2f}")
    print(f"\nFinal P&L WITH VIX:    ${pnl_with_vix:+.2f}")
    print(f"Final P&L WITHOUT VIX: ${pnl_without_vix:+.2f}")
    print(f"Impact of VIX:         ${pnl_with_vix - pnl_without_vix:+.2f}")

    if pnl_with_vix < pnl_without_vix:
        print("\n⚠️  VIX modeling shows WORSE P&L due to volatility spike during drop")
        print("    This is the realistic risk of covered calls in volatile markets!")
    else:
        print("\n✅ VIX modeling shows BETTER P&L due to volatility decay")


def demonstrate_premium_breakdown():
    """
    Show premium breakdown at different VIX levels and strikes
    This is what the user will see in the game
    """
    print("\n" + "=" * 80)
    print("PREMIUM BREAKDOWN DEMONSTRATION")
    print("How VIX affects premiums at different strike positions")
    print("=" * 80)

    stock_price = 590.0
    strikes = [
        (590, "ATM"),
        (591, "1 OTM"),
        (592, "2 OTM"),
        (593, "3 OTM")
    ]
    vix_levels = [15, 20, 30, 40]

    for vix in vix_levels:
        vix_sim = VIXSimulator(initial_vix=vix)
        regime = vix_sim._get_regime()

        print(f"\n{'='*80}")
        print(f"VIX = {vix} ({regime})")
        print(f"{'='*80}")
        print(f"{'Strike':<10} {'Position':<10} {'Base Premium':<15} {'VIX Premium':<15} {'Total Premium':<15} {'VIX Impact':<10}")
        print("-" * 80)

        for strike, position in strikes:
            call = AdvancedShortCall(stock_price, strike, 7, vix)
            breakdown = call._get_premium_breakdown(stock_price, strike, 7, vix)

            vix_impact_pct = (breakdown['vix_premium'] / breakdown['base_premium']) * 100 if breakdown['base_premium'] > 0 else 0

            print(f"${strike:<9} {position:<10} ${breakdown['base_premium']:<14.2f} "
                  f"${breakdown['vix_premium']:<14.2f} ${breakdown['total_premium']:<14.2f} "
                  f"+{vix_impact_pct:<8.1f}%")

    # Show a detailed example for one specific case
    print("\n" + "=" * 80)
    print("DETAILED EXAMPLE: What the user sees in the game")
    print("=" * 80)

    stock_price = 590.0
    strike = 593  # 3 OTM
    vix = 28

    vix_sim = VIXSimulator(initial_vix=vix)
    call = AdvancedShortCall(stock_price, strike, 7, vix)
    breakdown = call._get_premium_breakdown(stock_price, strike, 7, vix)

    print(f"""
╔════════════════════════════════════════════════════════════╗
║  SHORT CALL PREMIUM BREAKDOWN                              ║
╠════════════════════════════════════════════════════════════╣
║  Strike: ${strike} (3 OTM)                                    ║
║  Current VIX: {vix} ({vix_sim._get_regime()})                                  ║
╠════════════════════════════════════════════════════════════╣
║  Base Premium (VIX=15):        ${breakdown['base_premium']:>8.2f}              ║
║  VIX Premium Supplement:       ${breakdown['vix_premium']:>8.2f}   ⚠️ +{(breakdown['vix_premium']/breakdown['base_premium']*100):.1f}%  ║
║  ───────────────────────────────────────────────────────   ║
║  TOTAL PREMIUM:                ${breakdown['total_premium']:>8.2f}              ║
╚════════════════════════════════════════════════════════════╝

💡 Educational Note:
   Due to elevated volatility (VIX={vix}), you're collecting an extra
   ${breakdown['vix_premium']:.2f} compared to normal market conditions.

   This is the "fear premium" - but remember:
   • If stock drops further, VIX may spike more
   • Your short call could INCREASE in value despite moving OTM
   • This is a key risk of covered calls during volatile markets!
""")

    # Show what happens during a drop
    print("\n" + "=" * 80)
    print("SCENARIO: Stock drops 3% with current VIX=28")
    print("=" * 80)

    new_stock = stock_price * 0.97
    stock_change_pct = -3.0

    # VIX response to -3% drop
    new_vix = vix_sim.update(stock_change_pct)

    # Old call value
    old_value = breakdown['total_premium']

    # New call value
    new_call = AdvancedShortCall(new_stock, strike, 6, new_vix)  # 1 day passed
    new_breakdown = new_call._get_premium_breakdown(new_stock, strike, 6, new_vix)

    print(f"""
Stock Movement: ${stock_price:.2f} → ${new_stock:.2f} ({stock_change_pct:+.1f}%)
VIX Response:   {vix:.1f} → {new_vix:.1f} ({((new_vix-vix)/vix*100):+.1f}%)

Call Value Change:
  Yesterday:  ${old_value:.2f} (collected)
  Today:      ${new_breakdown['total_premium']:.2f} (current value)

  Expected P&L without VIX: ~+${old_value - new_breakdown['base_premium']:.2f} ✅
  Actual P&L with VIX:       +${old_value - new_breakdown['total_premium']:.2f} ⚠️

  VIX Cost You: ${(new_breakdown['total_premium'] - new_breakdown['base_premium']) - breakdown['vix_premium']:.2f}

🎓 Teaching Moment:
   The call moved further OTM (good for you), BUT VIX spiked higher
   (bad for you). The VIX spike partially offset the gains from the
   stock move. This is why covered calls can struggle in selloffs!
""")


if __name__ == "__main__":
    demonstrate_premium_breakdown()
    print("\n" + "=" * 80)
    print("ORIGINAL DEMONSTRATIONS")
    print("=" * 80)
    demonstrate_vix_impact()
    compare_with_without_vix_multiday()
