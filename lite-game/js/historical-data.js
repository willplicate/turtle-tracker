// historical-data.js — real IWM weekly data for historical scenario playback
// Prices are weekly closes (approximate historical actuals), RVX = Russell 2000 volatility index.
// OHLC is generated synthetically from the weekly return using the same seeded random as scenarios.js.

const HISTORICAL_DATA = {

    // ── COVID Crash & Recovery — IWM Jan 2020 through Dec 2020 ─────────────────
    // Starts calm at $168, crashes 36% over 5 weeks (peak RVX 76), full recovery by Nov
    'covid-2020': {
        name: 'COVID Crash 2020',
        ticker: 'IWM',
        startPrice: 168,
        startVix: 17,
        weeks: [
            { close: 170, vix: 17 }, // W1  Jan 6
            { close: 173, vix: 16 }, // W2  Jan 13
            { close: 174, vix: 15 }, // W3  Jan 20
            { close: 175, vix: 16 }, // W4  Jan 27
            { close: 176, vix: 17 }, // W5  Feb 3
            { close: 175, vix: 16 }, // W6  Feb 10  still calm
            { close: 165, vix: 32 }, // W7  Feb 24  COVID fears spike
            { close: 148, vix: 52 }, // W8  Mar 2   severe selling begins
            { close: 130, vix: 65 }, // W9  Mar 9   oil crash + COVID
            { close: 107, vix: 76 }, // W10 Mar 16  worst week, limit-down opens
            { close: 110, vix: 68 }, // W11 Mar 23  CARES Act hope
            { close: 122, vix: 58 }, // W12 Mar 30  strong bounce
            { close: 130, vix: 50 }, // W13 Apr 6   continuing rally
            { close: 133, vix: 48 }, // W14 Apr 13
            { close: 130, vix: 50 }, // W15 Apr 20  oil went negative
            { close: 132, vix: 44 }, // W16 Apr 27
            { close: 130, vix: 42 }, // W17 May 4
            { close: 134, vix: 40 }, // W18 May 11
            { close: 136, vix: 38 }, // W19 May 18
            { close: 135, vix: 38 }, // W20 May 26
            { close: 138, vix: 35 }, // W21 Jun 1
            { close: 143, vix: 32 }, // W22 Jun 8   strong recovery
            { close: 140, vix: 36 }, // W23 Jun 15  second-wave fears
            { close: 142, vix: 33 }, // W24 Jun 22
            { close: 144, vix: 30 }, // W25 Jun 29
            { close: 147, vix: 29 }, // W26 Jul 6
            { close: 142, vix: 34 }, // W27 Jul 13  COVID cases surge
            { close: 144, vix: 30 }, // W28 Jul 20
            { close: 148, vix: 27 }, // W29 Jul 27
            { close: 152, vix: 26 }, // W30 Aug 3
            { close: 155, vix: 24 }, // W31 Aug 10
            { close: 158, vix: 23 }, // W32 Aug 17
            { close: 162, vix: 24 }, // W33 Aug 24
            { close: 165, vix: 23 }, // W34 Aug 31
            { close: 158, vix: 30 }, // W35 Sep 7   tech selloff / small-cap rotation
            { close: 153, vix: 28 }, // W36 Sep 14
            { close: 148, vix: 31 }, // W37 Sep 21  September volatility
            { close: 151, vix: 28 }, // W38 Sep 28
            { close: 155, vix: 27 }, // W39 Oct 5
            { close: 152, vix: 28 }, // W40 Oct 12
            { close: 145, vix: 32 }, // W41 Oct 19  pre-election fear
            { close: 140, vix: 38 }, // W42 Oct 26
            { close: 148, vix: 35 }, // W43 Nov 2   election week
            { close: 172, vix: 26 }, // W44 Nov 9   Pfizer vaccine announcement
            { close: 176, vix: 24 }, // W45 Nov 16
            { close: 179, vix: 23 }, // W46 Nov 23
            { close: 184, vix: 21 }, // W47 Nov 30  Moderna data
            { close: 186, vix: 22 }, // W48 Dec 7
            { close: 190, vix: 23 }, // W49 Dec 14  vaccine approval
            { close: 192, vix: 22 }, // W50 Dec 21
            { close: 188, vix: 25 }, // W51 Dec 28  holiday thin
            { close: 192, vix: 22 }, // W52 Dec 31
        ],
    },

    // ── 2022 Bear Market — IWM Jan 2022 through Dec 2022 ───────────────────────
    // Starts at $228, grinds down to $152 (Oct low), partial recovery to $168
    // Elevated RVX (27–42) throughout — tests your discipline on when to cover
    'bear-2022': {
        name: '2022 Bear Market',
        ticker: 'IWM',
        startPrice: 228,
        startVix: 27,
        weeks: [
            { close: 218, vix: 33 }, // W1  Jan 7   sharp January selloff
            { close: 213, vix: 32 }, // W2  Jan 14
            { close: 206, vix: 34 }, // W3  Jan 21
            { close: 207, vix: 32 }, // W4  Jan 28
            { close: 210, vix: 31 }, // W5  Feb 4
            { close: 204, vix: 35 }, // W6  Feb 11  Russia/Ukraine tensions
            { close: 208, vix: 32 }, // W7  Feb 18
            { close: 196, vix: 38 }, // W8  Feb 25  Russia invades Ukraine
            { close: 203, vix: 35 }, // W9  Mar 4   bounce
            { close: 207, vix: 32 }, // W10 Mar 11
            { close: 200, vix: 33 }, // W11 Mar 18
            { close: 194, vix: 34 }, // W12 Mar 25
            { close: 185, vix: 36 }, // W13 Apr 1   April decline begins
            { close: 178, vix: 38 }, // W14 Apr 8
            { close: 183, vix: 35 }, // W15 Apr 14  bounce
            { close: 188, vix: 32 }, // W16 Apr 22  Fed starts hiking aggressively
            { close: 181, vix: 36 }, // W17 Apr 29  May selloff
            { close: 173, vix: 40 }, // W18 May 6
            { close: 168, vix: 40 }, // W19 May 13
            { close: 178, vix: 35 }, // W20 May 20  Memorial Day bounce
            { close: 185, vix: 33 }, // W21 May 27
            { close: 171, vix: 42 }, // W22 Jun 3   June crash — recession fears
            { close: 163, vix: 40 }, // W23 Jun 10
            { close: 168, vix: 37 }, // W24 Jun 17  end of quarter
            { close: 178, vix: 30 }, // W25 Jun 24  July 4 rally
            { close: 183, vix: 28 }, // W26 Jul 1
            { close: 188, vix: 27 }, // W27 Jul 8
            { close: 185, vix: 28 }, // W28 Jul 15
            { close: 181, vix: 29 }, // W29 Jul 22  bear market rally fades
            { close: 174, vix: 34 }, // W30 Jul 29  Jackson Hole selloff
            { close: 168, vix: 35 }, // W31 Aug 5
            { close: 160, vix: 40 }, // W32 Aug 12  September selloff begins
            { close: 155, vix: 38 }, // W33 Sep 2
            { close: 152, vix: 38 }, // W34 Sep 9   year lows
            { close: 158, vix: 36 }, // W35 Sep 16  October bounce
            { close: 162, vix: 33 }, // W36 Sep 23
            { close: 168, vix: 30 }, // W37 Sep 30
            { close: 173, vix: 28 }, // W38 Oct 7
            { close: 176, vix: 29 }, // W39 Oct 14  CPI surprise
            { close: 170, vix: 32 }, // W40 Oct 21
            { close: 175, vix: 29 }, // W41 Oct 28  November rally
            { close: 180, vix: 28 }, // W42 Nov 4
            { close: 177, vix: 28 }, // W43 Nov 11  midterm elections
            { close: 180, vix: 27 }, // W44 Nov 18
            { close: 174, vix: 30 }, // W45 Nov 25  December decline
            { close: 170, vix: 28 }, // W46 Dec 2
            { close: 168, vix: 29 }, // W47 Dec 9
            { close: 172, vix: 28 }, // W48 Dec 16
            { close: 168, vix: 28 }, // W49 Dec 23
            { close: 166, vix: 28 }, // W50 Dec 30
            { close: 170, vix: 28 }, // W51
            { close: 168, vix: 28 }, // W52 Dec 31
        ],
    },

    // ── 2024 Bull Run — IWM Jan 2024 through Dec 2024 ──────────────────────────
    // Strong small-cap year: starts $195, July rotation spike, election rally, ends ~$228
    // RVX mostly below 22 — challenges you to collect enough premium in calm markets
    'bull-2024': {
        name: '2024 Bull Run',
        ticker: 'IWM',
        startPrice: 195,
        startVix: 17,
        weeks: [
            { close: 196, vix: 16 }, // W1  Jan 5
            { close: 192, vix: 20 }, // W2  Jan 12  January dip
            { close: 195, vix: 18 }, // W3  Jan 19
            { close: 195, vix: 18 }, // W4  Jan 26
            { close: 202, vix: 16 }, // W5  Feb 2   recovery
            { close: 205, vix: 15 }, // W6  Feb 9
            { close: 207, vix: 16 }, // W7  Feb 16
            { close: 210, vix: 15 }, // W8  Feb 23
            { close: 207, vix: 16 }, // W9  Mar 1
            { close: 202, vix: 19 }, // W10 Mar 8   slight pullback
            { close: 205, vix: 17 }, // W11 Mar 15
            { close: 207, vix: 16 }, // W12 Mar 22
            { close: 210, vix: 15 }, // W13 Mar 28  Q1 end
            { close: 212, vix: 15 }, // W14 Apr 5
            { close: 213, vix: 16 }, // W15 Apr 12
            { close: 205, vix: 22 }, // W16 Apr 19  April selloff
            { close: 200, vix: 23 }, // W17 Apr 26
            { close: 198, vix: 22 }, // W18 May 3
            { close: 202, vix: 20 }, // W19 May 10
            { close: 205, vix: 19 }, // W20 May 17
            { close: 208, vix: 18 }, // W21 May 24
            { close: 206, vix: 17 }, // W22 May 31
            { close: 202, vix: 17 }, // W23 Jun 7
            { close: 205, vix: 16 }, // W24 Jun 14
            { close: 210, vix: 17 }, // W25 Jun 21
            { close: 218, vix: 15 }, // W26 Jun 28  small-cap rotation begins
            { close: 225, vix: 14 }, // W27 Jul 5   rotation surge
            { close: 213, vix: 28 }, // W28 Jul 12  carry-trade unwind shock
            { close: 208, vix: 25 }, // W29 Jul 19
            { close: 218, vix: 20 }, // W30 Jul 26  recovery
            { close: 222, vix: 19 }, // W31 Aug 2
            { close: 225, vix: 18 }, // W32 Aug 9
            { close: 223, vix: 17 }, // W33 Aug 16
            { close: 228, vix: 16 }, // W34 Aug 23  new highs
            { close: 225, vix: 17 }, // W35 Aug 30
            { close: 218, vix: 19 }, // W36 Sep 6   slight pullback
            { close: 220, vix: 18 }, // W37 Sep 13
            { close: 222, vix: 17 }, // W38 Sep 20
            { close: 226, vix: 18 }, // W39 Sep 27  Q3 end
            { close: 218, vix: 22 }, // W40 Oct 4   pre-election anxiety
            { close: 215, vix: 24 }, // W41 Oct 11
            { close: 225, vix: 20 }, // W42 Oct 18
            { close: 238, vix: 17 }, // W43 Oct 25  Trump election win rally
            { close: 243, vix: 16 }, // W44 Nov 1
            { close: 240, vix: 18 }, // W45 Nov 8
            { close: 232, vix: 20 }, // W46 Nov 15  December selloff
            { close: 228, vix: 19 }, // W47 Nov 22
            { close: 225, vix: 20 }, // W48 Nov 29
            { close: 235, vix: 17 }, // W49 Dec 6
            { close: 230, vix: 17 }, // W50 Dec 13
            { close: 225, vix: 18 }, // W51 Dec 20
            { close: 228, vix: 17 }, // W52 Dec 27
        ],
    },
};

function isHistoricalScenario(scenario) {
    return scenario in HISTORICAL_DATA;
}

// Returns the same shape as generateWeeklyMove() but draws from embedded historical data.
// currentPrice should equal the previous week's close (or startPrice for week 0).
function getHistoricalMove(scenario, weekIdx, currentPrice) {
    const histData = HISTORICAL_DATA[scenario];
    if (!histData || weekIdx >= histData.weeks.length) {
        return generateWeeklyMove('moderate-bull', currentPrice, 20, weekIdx + 500);
    }

    const weekData = histData.weeks[weekIdx];
    const newPrice = weekData.close;
    const weeklyReturn = (newPrice - currentPrice) / currentPrice;
    const newVix = weekData.vix;

    // Synthetic intra-week OHLC using seeded random (seeds offset to avoid aliasing with scenarios.js)
    const r4 = seededRandom(weekIdx * 7 + 94);
    const r5 = seededRandom(weekIdx * 7 + 95);
    const open = currentPrice;
    const close = newPrice;
    const rangeBase = Math.abs(newPrice - currentPrice);
    const range = (rangeBase > currentPrice * 0.002 ? rangeBase : currentPrice * 0.008) * (1.5 + r5 * 0.5);
    const high = Math.max(open, close) + range * r4 * 0.4;
    const low  = Math.min(open, close) - range * (1 - r4) * 0.4;

    return {
        newPrice,
        priceChangePct: weeklyReturn * 100,
        newVix,
        ohlc: { open, high, low, close },
    };
}
