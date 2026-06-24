// game-state.js — UI controller, screen transitions, event wiring

const TICKERS = {
    IWM: { name: 'iShares Russell 2000 ETF', price: 285, label: '~$285 / share' },
    SPY: { name: 'S&P 500 ETF', price: 760, label: '~$760 / share' },
};

const state = {
    screen: 'setup',
    simulator: null,
    vixSimulator: null,
    scenario: 'mystery',
    mysteryScenario: null,   // resolved randomly at game start; null outside mystery mode
    ticker: 'IWM',
    startingCapital: 20000,
    pricingMode: 'simple',
    incomeWithdrawal: false,
    withdrawalAmount: 500,
    totalWithdrawn: 0,
    withdrawalHistory: [],
    week: 0,
    priceHistory: [],
    vixHistory: [],
    ohlcHistory: [],
    emaHistory: [],
    vixEMAHistory: [],
    rulesEnabled: true,
    selectedStrike: null,
    selectedContracts: 1,
    selectedDte: 360,
    selectedItmAmount: 30,
    weeklyPnlLog: [],
    totalPremiumCollected: 0,
    totalShortCallNetPnl: 0,
    wins: 0,
    totalTrades: 0,
    portfolioValueHistory: [],
    pendingWeekResult: null,
    dailyMode: false,
    dayOfWeek: 0,
    dailyPrices: [],
    weeklyMoveCache: null,
    dailyDayResults: [],
    dailyWeekContext: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns the correct starting stock price — overridden for historical scenarios
function getEffectiveStartPrice() {
    if (typeof isHistoricalScenario === 'function' && isHistoricalScenario(state.scenario)) {
        return HISTORICAL_DATA[state.scenario]?.startPrice || TICKERS[state.ticker].price;
    }
    return TICKERS[state.ticker].price;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────
const fmt$ = (v, always = false) => {
    const abs = Math.abs(v);
    const s = abs >= 1000 ? `$${Math.round(abs).toLocaleString()}` : `$${Math.abs(v).toFixed(0)}`;
    if (always) return (v >= 0 ? '+' : '-') + s;
    return (v < 0 ? '-' : '') + s;
};
const fmtPct = v => (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
const fmtDelta = v => v.toFixed(2);
const fmtMono = (el, text) => { el.textContent = text; };

// ─── Screen management ────────────────────────────────────────────────────────
function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`screen-${name}`);
    if (el) el.classList.add('active');
    state.screen = name;
    updateStepBar(name);
}

function updateStepBar(screen) {
    const steps = ['setup', 'leaps', 'sell', 'results'];
    const mappedScreen = screen === 'daily' ? 'sell' : screen;
    const idx = steps.indexOf(mappedScreen);
    document.querySelectorAll('.step-tab').forEach((tab, i) => {
        tab.classList.remove('active', 'completed', 'future');
        if (i < idx) tab.classList.add('completed');
        else if (i === idx) tab.classList.add('active');
        else tab.classList.add('future');
    });
}

// ─── Setup screen ─────────────────────────────────────────────────────────────
function initSetupScreen() {
    // Capital input
    const capitalInput = document.getElementById('capital-input');
    capitalInput.value = state.startingCapital;
    capitalInput.addEventListener('input', () => {
        const v = parseInt(capitalInput.value) || 20000;
        state.startingCapital = Math.max(5000, Math.min(500000, v));
        updateSetupPreview();
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const v = parseInt(btn.dataset.value);
            state.startingCapital = v;
            capitalInput.value = v;
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateSetupPreview();
        });
    });

    // Ticker cards
    document.querySelectorAll('.ticker-card').forEach(card => {
        card.addEventListener('click', () => {
            state.ticker = card.dataset.ticker;
            document.querySelectorAll('.ticker-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            updateSetupPreview();
        });
    });

    // Scenario cards
    document.querySelectorAll('.scenario-card').forEach(card => {
        card.addEventListener('click', () => {
            state.scenario = card.dataset.scenario;
            document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            updateSetupPreview();
        });
    });

    // Pricing toggle
    document.querySelectorAll('.pricing-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.pricingMode = btn.dataset.mode;
            document.querySelectorAll('.pricing-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Decision frequency toggle
    document.querySelectorAll('.daily-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.dailyMode = btn.dataset.daily === 'true';
            document.querySelectorAll('.daily-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Income withdrawal toggle
    const withdrawalToggle = document.getElementById('income-withdrawal-toggle');
    const withdrawalAmountRow = document.getElementById('withdrawal-amount-row');
    const withdrawalAmountInput = document.getElementById('withdrawal-amount-input');

    withdrawalToggle?.addEventListener('change', () => {
        state.incomeWithdrawal = withdrawalToggle.checked;
        if (withdrawalAmountRow) withdrawalAmountRow.style.display = state.incomeWithdrawal ? 'block' : 'none';
        const previewRow = document.getElementById('prev-withdrawal-row');
        if (previewRow) previewRow.style.display = state.incomeWithdrawal ? 'flex' : 'none';
        updateSetupPreview();
    });

    withdrawalAmountInput?.addEventListener('input', () => {
        state.withdrawalAmount = Math.max(0, Math.min(10000, parseInt(withdrawalAmountInput.value) || 500));
        updateSetupPreview();
    });

    document.querySelectorAll('.withdrawal-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const v = parseInt(btn.dataset.amount);
            state.withdrawalAmount = v;
            if (withdrawalAmountInput) withdrawalAmountInput.value = v;
            document.querySelectorAll('.withdrawal-preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateSetupPreview();
        });
    });

    // CTA
    document.getElementById('btn-select-leaps').addEventListener('click', () => {
        initGame();
        showScreen('leaps');
        configureLeapsSlider();
        updateLeapsScreen();
    });

    updateSetupPreview();
    // Default selections
    document.querySelector('[data-preset="20000"]')?.classList.add('active');
    document.querySelector('[data-ticker="IWM"]')?.classList.add('active');
    document.querySelector('[data-scenario="mystery"]')?.classList.add('active');
    document.querySelector('[data-mode="simple"]')?.classList.add('active');
}

function updateSetupPreview() {
    const t = TICKERS[state.ticker];
    const stockPrice = getEffectiveStartPrice();
    const itm = 30;
    const strike = stockPrice - itm;
    const dte = 360;

    // Quick LEAPS cost estimate
    const dummyLeaps = new LEAPSPosition(stockPrice, strike, dte);
    const cost = dummyLeaps.value;
    const pct = (cost / state.startingCapital) * 100;
    const remaining = state.startingCapital - cost;

    document.getElementById('prev-capital').textContent = `$${state.startingCapital.toLocaleString()}`;
    document.getElementById('prev-ticker').textContent = `${state.ticker} — $${stockPrice}`;
    document.getElementById('prev-scenario').textContent = SCENARIOS[state.scenario]?.name || 'Mystery';
    document.getElementById('prev-pricing').textContent = state.pricingMode === 'simple' ? 'Simple' : 'Advanced';
    document.getElementById('leaps-est-cost').textContent = fmt$(cost);
    document.getElementById('leaps-est-pct').textContent = pct.toFixed(0) + '%';
    document.getElementById('leaps-est-remaining').textContent = fmt$(remaining);

    // Allocation bar
    const bar = document.getElementById('allocation-bar-fill');
    if (bar) bar.style.width = Math.min(100, pct) + '%';

    // Small account tip
    const tip = document.getElementById('small-account-tip');
    if (tip) tip.style.display = state.startingCapital < 10000 ? 'block' : 'none';

    // Withdrawal preview
    const prevWithdrawal = document.getElementById('prev-withdrawal');
    if (prevWithdrawal) prevWithdrawal.textContent = `$${state.withdrawalAmount.toLocaleString()}/week`;
}

// ─── Game init ────────────────────────────────────────────────────────────────
function initGame() {
    // Historical scenarios fix the ticker to IWM and override the start price
    if (typeof isHistoricalScenario === 'function' && isHistoricalScenario(state.scenario)) {
        state.ticker = 'IWM';
        document.querySelectorAll('.ticker-card').forEach(c => {
            c.classList.toggle('active', c.dataset.ticker === 'IWM');
        });
    }

    // Mystery: pick one real scenario at random each game so the player doesn't know
    // which regime they're in, but every week is driven by a coherent named scenario.
    if (state.scenario === 'mystery') {
        const options = ['bull', 'moderate-bull', 'bear', 'moderate-bear', 'choppy', 'high-vol', 'crash', 'bear-recovery'];
        state.mysteryScenario = options[Math.floor(Math.random() * options.length)];
    } else {
        state.mysteryScenario = null;
    }

    state.simulator = new TradingSimulator(state.startingCapital);
    state.simulator.currentStockPrice = getEffectiveStartPrice();
    state.simulator._pricingMode = state.pricingMode;

    const startVix = getScenarioStartingVix(state.mysteryScenario || state.scenario);
    state.vixSimulator = new VIXSimulator(startVix);
    state.simulator._vixSim = state.vixSimulator;

    const gameStartPrice = getEffectiveStartPrice();
    state.gameStartStockPrice = gameStartPrice;
    state.week = 0;
    state.priceHistory = [gameStartPrice];
    state.vixHistory = [startVix];
    state.ohlcHistory = [];
    state.emaHistory = [];
    state.vixEMAHistory = [];
    state.weeklyPnlLog = [];
    state.totalPremiumCollected = 0;
    state.totalShortCallNetPnl = 0;
    state.wins = 0;
    state.totalTrades = 0;
    state.portfolioValueHistory = [state.startingCapital];
    state.pendingWeekResult = null;
    state.dayOfWeek = 0;
    state.dailyPrices = [];
    state.weeklyMoveCache = null;
    state.dailyDayResults = [];
    state.dailyWeekContext = null;
    state.totalWithdrawn = 0;
    state.withdrawalHistory = [];

    // Sync mid-game withdrawal controls to current state
    syncResWithdrawalControls();

    seedHistoricalData(gameStartPrice, startVix);
}

// Seed 6 historical context candles so Screen 3 charts aren't blank on week 1.
// Candles have week <= 0 (pre-history) so they render muted with no labels.
function seedHistoricalData(endPrice, endVix) {
    const SEED = 6;
    const seedScenario = state.mysteryScenario || state.scenario;

    let p = endPrice * 0.96;
    let v = endVix;
    const ohlcs = [];
    const prices = [p];
    const vixes = [v];

    for (let i = 0; i < SEED; i++) {
        const move = generateWeeklyMove(seedScenario, p, v, 9000 + i);
        ohlcs.push({ ...move.ohlc, week: -(SEED - 1 - i) }); // -5, -4, -3, -2, -1, 0
        p = move.newPrice;
        v = move.newVix;
        prices.push(p);
        vixes.push(v);
    }

    // Force last seed price to match actual start so the chart connects cleanly
    prices[prices.length - 1] = endPrice;
    vixes[vixes.length - 1] = endVix;
    if (ohlcs.length > 0) ohlcs[ohlcs.length - 1].close = endPrice;

    state.ohlcHistory = ohlcs;          // 6 entries
    state.priceHistory = prices;         // 7 entries (length = ohlcHistory.length + 1) ✓
    state.vixHistory = vixes;
}

// ─── LEAPS screen ─────────────────────────────────────────────────────────────

// Scale the ITM slider range to the current ticker's stock price so that
// deep-ITM positions on SPY (~$760) are reachable, not just shallow ones.
function configureLeapsSlider() {
    const stockPrice = state.simulator?.currentStockPrice;
    if (!stockPrice) return;

    const minItm     = Math.max(5,  Math.round(stockPrice * 0.01));
    const maxItm     = Math.round(stockPrice * 0.28);
    const defaultItm = Math.round(stockPrice * 0.15);  // 15% ITM → delta ~0.82

    // Always reset to proportional default — user is entering a fresh LEAPS screen
    state.selectedItmAmount = defaultItm;

    const slider = document.getElementById('itm-slider');
    if (slider) {
        slider.min   = minItm;
        slider.max   = maxItm;
        slider.value = defaultItm;
    }

    // Roll screen slider — same range
    const rollSlider = document.getElementById('roll-itm-slider');
    if (rollSlider) {
        rollSlider.min = minItm;
        rollSlider.max = maxItm;
        if (parseInt(rollSlider.value) < minItm || parseInt(rollSlider.value) > maxItm) {
            rollSlider.value = defaultItm;
        }
    }

    // Update the min/max labels below the slider
    const minLabel = document.getElementById('itm-slider-min-label');
    const maxLabel = document.getElementById('itm-slider-max-label');
    if (minLabel) minLabel.textContent = `$${minItm} ITM (shallower)`;
    if (maxLabel) maxLabel.textContent = `$${maxItm} ITM (deeper)`;
}

function initLeapsScreen() {
    const itmSlider = document.getElementById('itm-slider');
    const contractsSlider = document.getElementById('contracts-slider');

    itmSlider?.addEventListener('input', () => {
        state.selectedItmAmount = parseInt(itmSlider.value);
        updateLeapsScreen();
    });

    contractsSlider?.addEventListener('input', () => {
        state.selectedContracts = parseInt(contractsSlider.value);
        updateLeapsScreen();
    });

    document.querySelectorAll('.dte-card').forEach(card => {
        card.addEventListener('click', () => {
            state.selectedDte = parseInt(card.dataset.dte);
            document.querySelectorAll('.dte-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            updateLeapsScreen();
        });
    });

    document.getElementById('btn-buy-leaps')?.addEventListener('click', () => {
        const strike = state.simulator.currentStockPrice - state.selectedItmAmount;
        const result = state.simulator.openLeaps(strike, state.selectedDte, state.selectedContracts);
        if (result.error) { alert(result.error); return; }
        // Set contracts (multiply cost by contracts)
        // Note: engine handles 1 contract; for multiple we open once and scale values
        showScreen('sell');
        updateSellScreen();
    });

    document.getElementById('btn-leaps-back')?.addEventListener('click', () => showScreen('setup'));
}

function updateLeapsScreen() {
    if (!state.simulator) return;
    const stockPrice = state.simulator.currentStockPrice;
    const strike = stockPrice - state.selectedItmAmount;

    const leaps = new LEAPSPosition(stockPrice, strike, state.selectedDte);
    const delta = leaps.delta;
    const theta = leaps.theta;
    const cost = leaps.value * state.selectedContracts;
    const remaining = state.startingCapital - cost;

    // Update slider display
    const itmDisplay = document.getElementById('itm-display');
    if (itmDisplay) itmDisplay.textContent = `$${strike} strike — $${state.selectedItmAmount} below current price`;

    const contractsDisplay = document.getElementById('contracts-display');
    if (contractsDisplay) contractsDisplay.textContent = `${state.selectedContracts} contract${state.selectedContracts > 1 ? 's' : ''} — controls ${state.selectedContracts * 100} shares`;

    // Preview panel
    setText('leaps-prev-strike', `$${strike}`);
    setText('leaps-prev-expiry', dteToExpiry(state.selectedDte));
    setText('leaps-prev-delta', fmtDelta(delta));
    setText('leaps-prev-theta', fmt$(theta) + '/day');
    setText('leaps-prev-theta-week', fmt$(theta * 5) + '/week');
    setText('leaps-prev-cost', fmt$(leaps.value));
    setText('leaps-prev-total', fmt$(cost));

    // Capital allocation
    const canAfford = cost <= state.startingCapital;
    const pct = (cost / state.startingCapital) * 100;
    setText('leaps-cap-start', fmt$(state.startingCapital));
    setText('leaps-cap-cost', fmt$(cost));
    setText('leaps-cap-remaining', canAfford ? fmt$(remaining) : `−${fmt$(Math.abs(remaining))} over budget`);
    const remainingEl = document.getElementById('leaps-cap-remaining');
    if (remainingEl) remainingEl.style.color = canAfford ? '' : 'var(--red)';
    const capBar = document.getElementById('leaps-cap-bar');
    if (capBar) {
        capBar.style.width = Math.min(100, pct) + '%';
        capBar.style.backgroundColor = canAfford ? '' : 'var(--red-border)';
    }

    const buyBtn = document.getElementById('btn-buy-leaps');
    if (buyBtn) {
        buyBtn.disabled = !canAfford;
        buyBtn.title = canAfford ? '' : 'LEAPS cost exceeds your starting capital';
    }

    // Weekly edge
    const typicalPremium = 150;
    setText('leaps-weekly-theta', fmt$(Math.abs(theta * 5)));
    setText('leaps-weekly-premium', `~${fmt$(typicalPremium)}`);
    setText('leaps-weekly-edge', `~${fmt$(typicalPremium - Math.abs(theta * 5))}`);

    // Health alerts
    updateLeapsHealthAlerts(delta, state.selectedDte, 'leaps-health');
}

function updateLeapsHealthAlerts(delta, dte, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    let deltaClass = 'alert-green', deltaMsg = `Good delta: ${fmtDelta(delta)}`;
    if (delta < 0.70) { deltaClass = 'alert-red alert-urgent'; deltaMsg = `⚠ Delta ${fmtDelta(delta)} — roll to a deeper strike now`; }
    else if (delta < 0.80) { deltaClass = 'alert-amber'; deltaMsg = `Delta slipping: ${fmtDelta(delta)} — consider rolling soon`; }

    let dteClass = 'alert-green', dteMsg = `Good DTE: ${dte} days`;
    if (dte < 180) { dteClass = 'alert-amber'; dteMsg = `DTE getting low — consider rolling soon`; }

    container.innerHTML = `
        <div class="health-alert ${deltaClass}">${deltaMsg}</div>
        <div class="health-alert ${dteClass}">${dteMsg}</div>
    `;
}

// ─── Sell screen ──────────────────────────────────────────────────────────────
function initSellScreen() {
    document.getElementById('rules-toggle')?.addEventListener('change', e => {
        state.rulesEnabled = e.target.checked;
        updateSellScreen();
    });

    document.getElementById('btn-run-week')?.addEventListener('click', runWeek);
    document.getElementById('btn-sell-reset')?.addEventListener('click', () => {
        if (confirm('Reset the game?')) location.reload();
    });
    document.getElementById('btn-skip-report-sell')?.addEventListener('click', showAnnualReport);
}

function updateSellScreen() {
    if (!state.simulator) return;
    const sim = state.simulator;

    // Guard: if no LEAPS exists (e.g. roll was partially executed), send back to Buy LEAPS
    if (!sim.leapsPosition) {
        showScreen('leaps');
        return;
    }

    const currentPrice = sim.currentStockPrice;
    const currentVix = state.vixSimulator.currentVix;
    const status = sim.getStatus();

    // Header bar
    setText('sell-header-price', `${state.ticker} $${currentPrice.toFixed(2)}`);
    setText('sell-header-vix', `${getVolLabel()} ${currentVix.toFixed(1)}`);
    setText('sell-header-capital', `Capital $${Math.round(sim.getTotalValue()).toLocaleString()}`);

    // Chart labels (reflect chosen ticker and vol index)
    setText('price-chart-label', `${state.ticker} price — weekly candles + EMA 15`);
    setText('vix-chart-label', `${getVolLabel()} volatility index + EMA 15`);

    // Charts
    const priceCanvas = document.getElementById('price-chart');
    const vixCanvas = document.getElementById('vix-chart');
    const ema = calculateEMA(state.priceHistory, 15);
    const vixEma = calculateEMA(state.vixHistory, 15);
    state.emaHistory = ema;
    state.vixEMAHistory = vixEma;

    if (priceCanvas) drawPriceChart(priceCanvas, state.ohlcHistory, ema);
    if (vixCanvas) drawVixChart(vixCanvas, state.vixHistory, vixEma);

    // Regime badge
    const regime = getRegimeLabel(currentVix);
    const regimeBadge = document.getElementById('regime-badge');
    if (regimeBadge) {
        regimeBadge.textContent = `${regime.label} — ${getVolLabel()} ${currentVix.toFixed(1)}`;
        regimeBadge.className = `regime-badge regime-${regime.colour}`;
    }

    // Rules signal
    const signal = state.rulesEnabled ? getRulesSignal(state.vixHistory, state.priceHistory) : null;
    const signalEl = document.getElementById('rules-signal');
    if (signalEl) {
        if (signal) {
            signalEl.style.display = 'block';
            signalEl.className = `rules-signal signal-${signal.colour}`;
            signalEl.innerHTML = `<strong>Rules engine suggests: ${signal.action}</strong> — ${signal.reason}`;
        } else {
            signalEl.style.display = 'none';
        }
    }

    // Strike table
    const strikes = generateStrikeOptions(currentPrice, currentVix, sim, state.selectedContracts);
    renderStrikeTable(strikes, signal, currentPrice);

    // Position panel
    if (status.leaps) {
        const l = status.leaps;
        setText('pos-strike', `$${l.strike}`);
        setText('pos-expiry', dteToExpiry(l.dte));
        setText('pos-delta', fmtDelta(l.delta));
        setText('pos-dte', `${l.dte} days`);
        setText('pos-theta', fmt$(l.theta) + '/day');
        setText('pos-leaps-value', fmt$(l.value));

        // LEAPS health alert in sidebar
        updateLeapsHealthAlerts(l.delta, l.dte, 'sell-leaps-health');
    }
    setText('pos-cash', fmt$(status.cash));
    setText('pos-total', fmt$(status.totalValue));

    // Week progress
    const weekProgress = document.getElementById('week-progress-sell');
    if (weekProgress) weekProgress.textContent = `Week ${state.week + 1} of 52`;

    // Running totals
    const avg = state.totalTrades > 0 ? state.totalPremiumCollected / state.totalTrades : 0;
    setText('total-premium', fmt$(state.totalPremiumCollected));
    setText('leaps-pnl-total', fmt$(status.leaps?.pnl || 0));
    setText('avg-per-week', fmt$(avg));
    const annReturn = annualisedReturn(state.startingCapital, status.totalValue + state.totalWithdrawn, state.week);
    setText('ann-return-sell', fmtPct(annReturn));
    setText('win-rate', state.totalTrades > 0 ? `${Math.round(state.wins / state.totalTrades * 100)}%` : '—');
}

function renderStrikeTable(strikes, signal, currentPrice) {
    const tbody = document.getElementById('strike-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const suggestedAction = signal?.action || '';

    strikes.forEach(row => {
        const isSuggested = (
            (suggestedAction.includes('ITM') && !suggestedAction.includes('Super') && row.type === 'ITM') ||
            (suggestedAction.includes('ATM') && row.type === 'ATM') ||
            (suggestedAction.includes('OTM') && row.type.includes('OTM')) ||
            (suggestedAction.includes('uncovered') && row.type === 'Uncovered')
        );

        const tr = document.createElement('tr');
        tr.className = 'strike-row' + (isSuggested ? ' suggested' : '');
        tr.dataset.strike = row.strike || 'null';
        tr.dataset.type = row.type;

        tr.innerHTML = `
            <td><input type="radio" name="strike-select" value="${row.strike || 'uncovered'}" ${isSuggested && !state.selectedStrike ? 'checked' : ''}></td>
            <td class="mono">${row.strike ? `$${row.strike}` : '—'}</td>
            <td><span class="strike-type-badge type-${row.type.toLowerCase().replace(' ', '-')}">${row.type}</span></td>
            <td class="mono">${row.premium > 0 ? fmt$(row.premium) : '—'}</td>
            <td class="strike-note">${row.note}</td>
        `;

        tr.addEventListener('click', () => {
            document.querySelectorAll('[name=strike-select]').forEach(r => r.checked = false);
            tr.querySelector('input[type=radio]').checked = true;
            document.querySelectorAll('.strike-row').forEach(r => r.classList.remove('selected'));
            tr.classList.add('selected');
            state.selectedStrike = row.strike;
        });

        tbody.appendChild(tr);
    });

    // Default select suggested or first
    const firstRadio = tbody.querySelector('input[type=radio]');
    if (firstRadio && !state.selectedStrike) {
        firstRadio.checked = true;
        const firstRow = strikes[0];
        state.selectedStrike = firstRow.strike;
    }
}

// ─── Run week ─────────────────────────────────────────────────────────────────
function runWeek() {
    const sim = state.simulator;
    const checkedRadio = document.querySelector('[name=strike-select]:checked');
    if (!checkedRadio) return;

    const strikeVal = checkedRadio.value;
    const isUncovered = strikeVal === 'uncovered';
    const strike = isUncovered ? null : parseFloat(strikeVal);

    // Sell the call (or skip if uncovered)
    let premiumThisWeek = 0;
    if (!isUncovered && strike) {
        const callResult = sim.sellWeeklyCall(strike, 5, state.selectedContracts);
        if (callResult.success) premiumThisWeek = callResult.premium;
    }

    // Generate this week's price move (historical scenarios use real data)
    const currentVix = state.vixSimulator.currentVix;
    const move = (typeof isHistoricalScenario === 'function' && isHistoricalScenario(state.scenario))
        ? getHistoricalMove(state.scenario, state.week, sim.currentStockPrice)
        : generateWeeklyMove(state.mysteryScenario || state.scenario, sim.currentStockPrice, currentVix, state.week);
    const weekStartLeapsValue = sim.leapsPosition?.value || 0;
    const weekStartCallValue = sim.shortCall?.optionValue || 0;
    const startPrice = sim.currentStockPrice;

    // ── Daily mode: cache move + daily prices, advance day 1, show daily screen
    if (state.dailyMode) {
        state.weeklyMoveCache = move;
        state.dailyPrices = getDailyPrices(move.ohlc, state.week);
        state.dailyDayResults = [];
        state.dayOfWeek = 0;
        state.dailyWeekContext = {
            isUncovered,
            originalIsUncovered: isUncovered,
            strike,
            originalStrike: strike,
            premiumThisWeek,
            lastCallPremium: premiumThisWeek,
            weekStartLeapsValue,
            weekStartCallValue: sim.shortCall?.optionValue || 0,
            weekStartPrice: startPrice,
            callClosed: false,
            callBuybackCost: 0,
            rolls: 0,
            rollLog: [],  // [{day, action, oldStrike, buybackCost, newStrike, newPremium}]
        };
        state.dailyDayResults.push(sim.advanceDay(state.dailyPrices[0]));
        state.dayOfWeek = 1;
        showScreen('daily');
        renderDailyResult();
        return;
    }

    // ── Weekly mode: simulate all 5 days ──────────────────────────────────────
    const dayResults = [];
    for (let d = 1; d <= 5; d++) {
        const dayPrice = startPrice + (move.newPrice - startPrice) * (d / 5);
        dayResults.push(sim.advanceDay(dayPrice));
    }
    // Save for the day-by-day summary on the results screen (no rolls in weekly mode)
    state.dailyDayResults = dayResults;
    state.dailyWeekContext = {
        isUncovered, originalIsUncovered: isUncovered,
        strike, originalStrike: strike,
        premiumThisWeek, lastCallPremium: premiumThisWeek,
        weekStartLeapsValue, weekStartCallValue: 0,
        weekStartPrice: startPrice,
        callClosed: false, callBuybackCost: 0, rolls: 0,
        rollLog: [],
    };

    // If the call expired during simulation, pull its actual P&L from the day results.
    // finalPnl = premiumCollected - intrinsicAtExpiry (negative when call went ITM).
    let expiredCallFinalPnl = null;
    let expiredCallIntrinsic = 0;
    if (!isUncovered) {
        for (const dr of dayResults) {
            if (dr.shortCall?.expired) {
                expiredCallFinalPnl = dr.shortCall.finalPnl;
                expiredCallIntrinsic = premiumThisWeek - expiredCallFinalPnl;
                break;
            }
        }
    }

    // Update VIX — historical scenarios use embedded data directly
    state.priceHistory.push(move.newPrice);
    if (typeof isHistoricalScenario === 'function' && isHistoricalScenario(state.scenario)) {
        state.vixSimulator.currentVix = move.newVix;
        state.vixHistory.push(move.newVix);
    } else {
        state.vixSimulator.update(move.priceChangePct);
        state.vixHistory.push(state.vixSimulator.currentVix);
    }
    state.ohlcHistory.push({ ...move.ohlc, week: state.week + 1 });

    // Calculate week results
    const status = sim.getStatus();
    const weeklyPnl = sim.getWeeklyPnl();
    const leapsPnl = (sim.leapsPosition?.value || 0) - weekStartLeapsValue;
    const thetaDecay = sim.leapsPosition?.theta ? Math.abs(sim.leapsPosition.theta) * 5 : 0;

    // True short call P&L: use finalPnl if it expired, otherwise unrealised change.
    const trueCallPnl = isUncovered ? 0
        : expiredCallFinalPnl !== null ? expiredCallFinalPnl
        : premiumThisWeek - (sim.shortCall?.optionValue || 0);

    // Determine outcome type
    let outcomeType, outcomeMsg;
    if (isUncovered) {
        outcomeType = leapsPnl >= 0 ? 'blue' : 'neutral';
        outcomeMsg = leapsPnl >= 0 ? 'Uncovered — LEAPS gained value' : 'Uncovered — LEAPS lost value this week';
    } else if (expiredCallFinalPnl !== null) {
        // Call expired — distinguish OTM (truly worthless) from ITM-but-net-positive
        if (expiredCallIntrinsic === 0) {
            outcomeType = 'green';
            outcomeMsg = 'Good week — call expired worthless. You kept the full premium.';
        } else if (expiredCallFinalPnl >= 0) {
            outcomeType = 'green';
            outcomeMsg = 'Call expired slightly ITM — premium collected exceeded the buyback cost.';
        } else {
            outcomeType = weeklyPnl >= 0 ? 'amber' : 'red';
            outcomeMsg = 'Call went ITM — the short call cost you money on the hedge.';
        }
    } else {
        outcomeType = weeklyPnl >= 0 ? 'green' : 'amber';
        outcomeMsg = weeklyPnl >= 0 ? 'Positive week — premium is working.' : 'Challenging week — market moved against you.';
    }

    // Decompose premium into intrinsic + extrinsic at time of sale
    const intrinsicAtSale = isUncovered ? 0 : Math.max(0, startPrice - (strike || 0)) * 100;
    const extrinsicAtSale = isUncovered ? 0 : premiumThisWeek - intrinsicAtSale;

    state.pendingWeekResult = {
        weeklyPnl, leapsPnl, trueCallPnl,
        expiredCallFinalPnl, expiredCallIntrinsic,
        premiumCollected: premiumThisWeek, thetaDecay, outcomeType, outcomeMsg,
        weekStartPrice: startPrice,
        intrinsicAtSale, extrinsicAtSale,
        isUncovered, strike, weekStartLeapsValue, status, move,
        dayActivity: { days: state.dailyDayResults.slice(), rollLog: [], weekStartPrice: startPrice, isUncovered },
    };

    if (!isUncovered && premiumThisWeek > 0) state.totalPremiumCollected += premiumThisWeek;
    if (!isUncovered) state.totalShortCallNetPnl += trueCallPnl;
    state.totalTrades++;
    if (weeklyPnl > 0) state.wins++;
    state.weeklyPnlLog.push(weeklyPnl);
    state.portfolioValueHistory.push(status.totalValue);

    // Income withdrawal — deduct after recording trading P&L so the breakdown shows true weekly trading result
    if (state.incomeWithdrawal) {
        const result = sim.processWithdrawal(state.withdrawalAmount);
        state.withdrawalHistory.push({ week: state.week, ...result });
        state.totalWithdrawn += result.withdrawn;
        state.pendingWeekResult.withdrawal = result;
        state.pendingWeekResult.postWithdrawalTotal = sim.getTotalValue();
        state.pendingWeekResult.postWithdrawalCash = sim.cash;
        state.portfolioValueHistory[state.portfolioValueHistory.length - 1] = sim.getTotalValue();
    }

    // Reset short call if still open (it expired at end of week)
    if (sim.shortCall && sim.shortCall.dte === 0) sim.shortCall = null;

    sim.resetWeek();
    state.week++;

    showScreen('results');
    updateResultsScreen();

    // Check end conditions using post-withdrawal value
    const currentValue = sim.getTotalValue();
    if (state.week >= 52) {
        setTimeout(() => showAnnualReport(), 2000);
    } else if (state.incomeWithdrawal ? currentValue <= 0 : currentValue < state.startingCapital * 0.10) {
        setTimeout(() => showGameOver(), 1000);
    }
}

// ─── Daily mode ───────────────────────────────────────────────────────────────
function runDay() {
    const sim = state.simulator;
    const dayIndex = state.dayOfWeek;  // 0-based index into dailyPrices

    if (dayIndex >= 5) { finalizeDailyWeek(); return; }

    const dayResult = sim.advanceDay(state.dailyPrices[dayIndex]);
    state.dailyDayResults.push(dayResult);
    state.dayOfWeek++;

    if (state.dayOfWeek >= 5) {
        finalizeDailyWeek();
    } else {
        renderDailyResult();
    }
}

function finalizeDailyWeek() {
    const sim = state.simulator;
    const ctx = state.dailyWeekContext;
    const move = state.weeklyMoveCache;

    // Update price/VIX/OHLC history — same as runWeek's post-loop update
    state.priceHistory.push(move.newPrice);
    if (typeof isHistoricalScenario === 'function' && isHistoricalScenario(state.scenario)) {
        state.vixSimulator.currentVix = move.newVix;
        state.vixHistory.push(move.newVix);
    } else {
        state.vixSimulator.update(move.priceChangePct);
        state.vixHistory.push(state.vixSimulator.currentVix);
    }
    state.ohlcHistory.push({ ...move.ohlc, week: state.week + 1 });

    const status = sim.getStatus();
    const weeklyPnl = sim.getWeeklyPnl();
    const leapsPnl = (sim.leapsPosition?.value || 0) - ctx.weekStartLeapsValue;
    const thetaDecay = sim.leapsPosition?.theta ? Math.abs(sim.leapsPosition.theta) * 5 : 0;

    // Find expiry event across all day results
    let expiredCallFinalPnl = null;
    let expiredCallIntrinsic = 0;
    for (const dr of state.dailyDayResults) {
        if (dr.shortCall?.expired) {
            expiredCallFinalPnl = dr.shortCall.finalPnl;
            expiredCallIntrinsic = Math.max(0, ctx.lastCallPremium - expiredCallFinalPnl);
            break;
        }
    }

    // Net call P&L: captures all opens/closes/rolls via cash accounting
    const trueCallPnl = ctx.originalIsUncovered ? 0 : weeklyPnl - leapsPnl;
    const managedCall = ctx.callClosed || ctx.rolls > 0;

    // Outcome message
    let outcomeType, outcomeMsg;
    if (ctx.originalIsUncovered) {
        outcomeType = leapsPnl >= 0 ? 'blue' : 'neutral';
        outcomeMsg = leapsPnl >= 0 ? 'Uncovered — LEAPS gained value' : 'Uncovered — LEAPS lost value this week';
    } else if (ctx.callClosed) {
        outcomeType = weeklyPnl >= 0 ? 'blue' : 'amber';
        outcomeMsg = weeklyPnl >= 0
            ? 'You closed the short call mid-week and locked in a profit.'
            : 'You closed the short call mid-week, but the week was still a loss.';
    } else if (ctx.rolls > 0 && expiredCallFinalPnl !== null) {
        const rollDir = ctx.strike > (ctx.originalStrike || 0) ? 'up' : 'down';
        if (expiredCallIntrinsic <= 0.5) {
            outcomeType = 'green';
            outcomeMsg = `Good adjustment — you rolled ${rollDir} and the new call expired worthless.`;
        } else if (expiredCallFinalPnl >= 0) {
            outcomeType = 'green';
            outcomeMsg = `You rolled ${rollDir} — net positive despite the new call expiring ITM.`;
        } else {
            outcomeType = weeklyPnl >= 0 ? 'amber' : 'red';
            outcomeMsg = rollDir === 'up'
                ? 'You rolled up, but the market kept rising past the new strike.'
                : 'You rolled down, but the market kept falling past the new strike.';
        }
    } else if (expiredCallFinalPnl !== null) {
        if (expiredCallIntrinsic <= 0.5) {
            outcomeType = 'green';
            outcomeMsg = 'Good week — call expired worthless. You kept the full premium.';
        } else if (expiredCallFinalPnl >= 0) {
            outcomeType = 'green';
            outcomeMsg = 'Call expired slightly ITM — premium collected exceeded the buyback cost.';
        } else {
            outcomeType = weeklyPnl >= 0 ? 'amber' : 'red';
            outcomeMsg = 'Call went ITM — the short call cost you money on the hedge.';
        }
    } else {
        outcomeType = weeklyPnl >= 0 ? 'green' : 'amber';
        outcomeMsg = weeklyPnl >= 0 ? 'Positive week — premium is working.' : 'Challenging week — market moved against you.';
    }

    const intrinsicAtSale = ctx.originalIsUncovered ? 0 : Math.max(0, (ctx.saleStockPrice || ctx.weekStartPrice) - (ctx.originalStrike || 0)) * 100;
    const extrinsicAtSale = ctx.originalIsUncovered ? 0 : ctx.premiumThisWeek - intrinsicAtSale;

    state.pendingWeekResult = {
        weeklyPnl, leapsPnl, trueCallPnl,
        expiredCallFinalPnl, expiredCallIntrinsic,
        premiumCollected: ctx.premiumThisWeek,
        thetaDecay, outcomeType, outcomeMsg,
        weekStartPrice: ctx.weekStartPrice,
        intrinsicAtSale, extrinsicAtSale,
        isUncovered: ctx.originalIsUncovered,
        managedCall,
        strike: ctx.originalStrike,
        finalStrike: ctx.strike,
        weekStartLeapsValue: ctx.weekStartLeapsValue,
        status, move,
        dayActivity: {
            days: state.dailyDayResults.slice(),
            rollLog: ctx.rollLog || [],
            weekStartPrice: ctx.weekStartPrice,
            isUncovered: ctx.originalIsUncovered,
        },
    };

    if (!ctx.originalIsUncovered && ctx.premiumThisWeek > 0) state.totalPremiumCollected += ctx.premiumThisWeek;
    if (!ctx.originalIsUncovered) state.totalShortCallNetPnl += trueCallPnl;
    state.totalTrades++;
    if (weeklyPnl > 0) state.wins++;
    state.weeklyPnlLog.push(weeklyPnl);
    state.portfolioValueHistory.push(status.totalValue);

    if (state.incomeWithdrawal) {
        const result = sim.processWithdrawal(state.withdrawalAmount);
        state.withdrawalHistory.push({ week: state.week, ...result });
        state.totalWithdrawn += result.withdrawn;
        state.pendingWeekResult.withdrawal = result;
        state.pendingWeekResult.postWithdrawalTotal = sim.getTotalValue();
        state.pendingWeekResult.postWithdrawalCash = sim.cash;
        state.portfolioValueHistory[state.portfolioValueHistory.length - 1] = sim.getTotalValue();
    }

    if (sim.shortCall && sim.shortCall.dte === 0) sim.shortCall = null;

    sim.resetWeek();
    state.week++;

    // Clear daily state
    state.dayOfWeek = 0;
    state.dailyPrices = [];
    state.weeklyMoveCache = null;
    state.dailyDayResults = [];
    state.dailyWeekContext = null;

    showScreen('results');
    updateResultsScreen();

    const currentValue = sim.getTotalValue();
    if (state.week >= 52) {
        setTimeout(() => showAnnualReport(), 2000);
    } else if (state.incomeWithdrawal ? currentValue <= 0 : currentValue < state.startingCapital * 0.10) {
        setTimeout(() => showGameOver(), 1000);
    }
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function renderDailyResult() {
    const sim = state.simulator;
    const ctx = state.dailyWeekContext;
    const day = state.dayOfWeek;  // 1–5 (days completed so far)

    // Reset action message at start of new week
    if (day === 1) {
        const msgEl = document.getElementById('daily-action-msg');
        if (msgEl) { msgEl.style.display = 'none'; msgEl.textContent = ''; }
    }

    // Top-bar
    const currentPrice = sim.currentStockPrice;
    setText('sell-header-price', `${state.ticker} $${currentPrice.toFixed(2)}`);
    setText('sell-header-vix', `${getVolLabel()} ${state.vixSimulator.currentVix.toFixed(1)}`);
    setText('sell-header-capital', `Capital $${Math.round(sim.getTotalValue()).toLocaleString()}`);

    // Outcome banner
    const weekPnl = sim.getWeeklyPnl();
    const banner = document.getElementById('daily-banner');
    if (banner) {
        banner.textContent = `Day ${day} of 5 — ${DAY_NAMES[day - 1]} · Week ${state.week + 1} of 52`;
        banner.className = 'outcome-banner outcome-' + (weekPnl >= 0 ? 'green' : 'amber');
    }

    // Price action row
    const priceDiff = currentPrice - ctx.weekStartPrice;
    const pricePct = (priceDiff / ctx.weekStartPrice) * 100;
    setText('daily-price-open', `$${ctx.weekStartPrice.toFixed(2)}`);
    setText('daily-price-today', `$${currentPrice.toFixed(2)}`);
    const changeEl = document.getElementById('daily-price-change');
    if (changeEl) {
        const sign = priceDiff >= 0 ? '+' : '';
        changeEl.textContent = `${sign}$${Math.abs(priceDiff).toFixed(2)} (${sign}${pricePct.toFixed(1)}%)`;
        changeEl.className = 'mono price-action-change-val ' + (priceDiff >= 0 ? 'positive' : 'negative');
    }

    // P&L cards
    const pnlEl = document.getElementById('daily-pnl-sofar');
    if (pnlEl) {
        pnlEl.textContent = fmt$(weekPnl, true);
        pnlEl.style.color = weekPnl >= 0 ? 'var(--green)' : 'var(--red)';
    }
    setText('daily-total-value', fmt$(sim.getTotalValue()));

    // Position table — day's change and week-to-date P&L for each leg
    const lastResult = state.dailyDayResults[state.dailyDayResults.length - 1];

    const leapsRow = document.getElementById('daily-row-leaps');
    if (leapsRow && sim.leapsPosition) {
        const cells = leapsRow.querySelectorAll('.mono');
        if (cells[0]) cells[0].textContent = fmt$(sim.leapsPosition.value);

        // Day's change
        const lp = lastResult?.leaps?.dailyPnl || 0;
        const lpDayEl = document.getElementById('daily-leaps-day-pnl');
        if (lpDayEl) {
            lpDayEl.textContent = fmt$(lp, true);
            lpDayEl.className = 'mono pnl-cell ' + (lp >= 0 ? 'positive' : 'negative');
        }

        // Week P&L (current value minus value at week open)
        const leapsWeekPnl = sim.leapsPosition.value - ctx.weekStartLeapsValue;
        const lpWeekEl = document.getElementById('daily-leaps-week-pnl');
        if (lpWeekEl) {
            lpWeekEl.textContent = fmt$(leapsWeekPnl, true);
            lpWeekEl.className = 'mono pnl-cell ' + (leapsWeekPnl >= 0 ? 'positive' : 'negative');
        }
    }

    const callRow = document.getElementById('daily-row-call');
    if (callRow) {
        const cells = callRow.querySelectorAll('.mono');
        if (sim.shortCall) {
            if (cells[0]) cells[0].textContent = fmt$(sim.shortCall.optionValue);

            // Day's change (call decaying = positive for us)
            const cp = lastResult?.shortCall?.dailyPnl || 0;
            const cpDayEl = document.getElementById('daily-call-day-pnl');
            if (cpDayEl) {
                cpDayEl.textContent = fmt$(cp, true);
                cpDayEl.className = 'mono pnl-cell ' + (cp >= 0 ? 'positive' : 'negative');
            }

            // Week P&L = premium collected - current value
            const callWeekPnl = ctx.premiumThisWeek - sim.shortCall.optionValue;
            const cpWeekEl = document.getElementById('daily-call-week-pnl');
            if (cpWeekEl) {
                cpWeekEl.textContent = fmt$(callWeekPnl, true);
                cpWeekEl.className = 'mono pnl-cell ' + (callWeekPnl >= 0 ? 'positive' : 'negative');
            }
        } else {
            if (cells[0]) cells[0].textContent = ctx.isUncovered ? 'No call' : 'Closed';
            ['daily-call-day-pnl', 'daily-call-week-pnl'].forEach(id => {
                const el = document.getElementById(id);
                if (el) { el.textContent = '—'; el.className = 'mono pnl-cell'; }
            });
        }
    }

    // Alert: short call ITM warning
    const alertEl = document.getElementById('daily-alert');
    if (alertEl) {
        if (sim.shortCall && ctx.strike && currentPrice > ctx.strike) {
            const depth = currentPrice - ctx.strike;
            const pct = (depth / ctx.weekStartPrice) * 100;
            alertEl.style.display = 'block';
            alertEl.className = pct > 2 ? 'health-alert alert-red' : 'health-alert alert-amber';
            alertEl.textContent = `Short call $${depth.toFixed(2)} ITM (${pct.toFixed(1)}%) — consider rolling up or closing.`;
        } else {
            alertEl.style.display = 'none';
        }
    }

    // Continue button label
    const continueBtn = document.getElementById('btn-daily-continue');
    if (continueBtn) {
        continueBtn.textContent = day >= 4
            ? 'Close out week (Friday) →'
            : `Continue to ${DAY_NAMES[day]} →`;
    }

    // Close/Roll buttons
    const hasCall = !!sim.shortCall;
    const closeBtn    = document.getElementById('btn-daily-close-call');
    const rollUpBtn   = document.getElementById('btn-daily-roll-up');
    const rollDownBtn = document.getElementById('btn-daily-roll-down');
    const rollGroup   = document.getElementById('btn-daily-roll-group');
    const sellCallBtn = document.getElementById('btn-daily-sell-call');
    if (closeBtn)    { closeBtn.disabled = !hasCall; closeBtn.style.display = hasCall ? '' : 'none'; }
    if (rollGroup)   rollGroup.style.display = hasCall ? '' : 'none';
    if (sellCallBtn) sellCallBtn.style.display = hasCall ? 'none' : '';
    if (rollUpBtn)   rollUpBtn.disabled = !hasCall || (5 - day) < 1;
    if (rollDownBtn) rollDownBtn.disabled = !hasCall || (5 - day) < 1;

    // Day progress dots
    const dotsEl = document.getElementById('daily-day-dots');
    if (dotsEl) {
        dotsEl.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const isDone = i < day;
            const isCurrent = i === day;
            const dot = document.createElement('div');
            dot.style.cssText = [
                'width:30px', 'height:30px', 'border-radius:50%',
                'display:flex', 'align-items:center', 'justify-content:center',
                'font-size:12px', 'font-weight:600',
                `background:${isDone ? 'var(--accent)' : isCurrent ? 'var(--accent-dark)' : 'var(--bg-tertiary)'}`,
                `color:${i <= day ? '#fff' : 'var(--text-tertiary)'}`,
                `border:2px solid ${isCurrent ? 'var(--accent-dark)' : isDone ? 'var(--accent)' : 'var(--border)'}`,
            ].join(';');
            dot.textContent = 'MTWTF'[i - 1];
            dotsEl.appendChild(dot);
        }
    }

    // Right panel: position info
    if (sim.leapsPosition) {
        setText('daily-rp-strike', `$${sim.leapsPosition.strike}`);
        setText('daily-rp-delta', fmtDelta(sim.leapsPosition.delta));
        setText('daily-rp-dte', `${sim.leapsPosition.dte} days`);
    }
    const callRpRow = document.getElementById('daily-rp-call-row');
    const callRpPremiumRow = document.getElementById('daily-rp-call-premium-row');
    const callRpValueRow = document.getElementById('daily-rp-call-value-row');
    if (sim.shortCall) {
        setText('daily-rp-call-strike', `$${ctx.strike}`);
        setText('daily-rp-call-premium', fmt$(ctx.premiumThisWeek));
        setText('daily-rp-call-value', fmt$(sim.shortCall.optionValue));
        if (callRpRow) callRpRow.style.display = '';
        if (callRpPremiumRow) callRpPremiumRow.style.display = '';
        if (callRpValueRow) callRpValueRow.style.display = '';
    } else {
        if (callRpRow) callRpRow.style.display = 'none';
        if (callRpPremiumRow) callRpPremiumRow.style.display = 'none';
        if (callRpValueRow) callRpValueRow.style.display = 'none';
    }
    setText('daily-rp-cash', fmt$(sim.cash));

    if (sim.leapsPosition) {
        updateLeapsHealthAlerts(sim.leapsPosition.delta, sim.leapsPosition.dte, 'daily-rp-health');
    }
}

function initDailyScreen() {
    document.getElementById('btn-daily-continue')?.addEventListener('click', runDay);

    document.getElementById('btn-daily-close-call')?.addEventListener('click', () => {
        const sim = state.simulator;
        if (!sim.shortCall) return;
        const ctx = state.dailyWeekContext;
        const buybackCost = sim.shortCall.optionValue;
        const oldStrike = ctx.strike;
        sim.closeShortCall();
        ctx.callClosed = true;
        ctx.callBuybackCost = buybackCost;
        ctx.isUncovered = true;
        ctx.strike = null;
        ctx.lastCallPremium = 0;
        const todayCallPnl = state.dailyDayResults[state.dayOfWeek - 1]?.shortCall?.dailyPnl || 0;
        ctx.rollLog.push({ day: state.dayOfWeek, action: 'close', oldStrike, buybackCost, todayCallPnl });

        const msgEl = document.getElementById('daily-action-msg');
        if (msgEl) {
            msgEl.style.display = 'block';
            msgEl.className = 'health-alert alert-blue';
            msgEl.textContent = `Short call closed — bought back for ${fmt$(buybackCost)}. LEAPS running free for the rest of the week.`;
        }
        renderDailyResult();
    });

    document.getElementById('btn-daily-sell-call')?.addEventListener('click', () => {
        const ctx = state.dailyWeekContext;
        if (!ctx?.isUncovered) return;
        const sim = state.simulator;
        const atmStrike = Math.round(sim.currentStockPrice);
        const remainingDte = Math.max(1, 5 - state.dayOfWeek);
        const result = sim.sellWeeklyCall(atmStrike, remainingDte, state.selectedContracts || 1);
        if (!result.success) return;
        ctx.isUncovered = false;
        ctx.originalIsUncovered = false;
        ctx.strike = atmStrike;
        ctx.originalStrike = atmStrike;
        ctx.saleStockPrice = sim.currentStockPrice;
        ctx.lastCallPremium = result.premium;
        ctx.premiumThisWeek = (ctx.premiumThisWeek || 0) + result.premium;
        ctx.rollLog.push({ day: state.dayOfWeek, action: 'sell_call', newStrike: atmStrike, newPremium: result.premium });
        const msgEl = document.getElementById('daily-action-msg');
        if (msgEl) {
            msgEl.style.display = 'block';
            msgEl.className = 'health-alert alert-green';
            msgEl.textContent = `Sold $${atmStrike} call (ATM) for ${fmt$(result.premium)} with ${remainingDte} DTE remaining.`;
        }
        renderDailyResult();
    });

    document.getElementById('btn-daily-roll-up')?.addEventListener('click', () => {
        const sim = state.simulator;
        if (!sim.shortCall) return;
        const ctx = state.dailyWeekContext;
        const oldStrike = ctx.strike;
        const buybackCost = sim.shortCall.optionValue;
        sim.closeShortCall();

        const newStrike = Math.round(sim.currentStockPrice * 1.015);
        const remainingDte = Math.max(1, 5 - state.dayOfWeek);
        const newCallResult = sim.sellWeeklyCall(newStrike, remainingDte, state.selectedContracts);

        if (newCallResult.success) {
            ctx.rolls = (ctx.rolls || 0) + 1;
            ctx.strike = newStrike;
            ctx.lastCallPremium = newCallResult.premium;
            const todayCallPnl = state.dailyDayResults[state.dayOfWeek - 1]?.shortCall?.dailyPnl || 0;
            ctx.rollLog.push({ day: state.dayOfWeek, action: 'roll_up', oldStrike, buybackCost, todayCallPnl, newStrike, newPremium: newCallResult.premium });

            const msgEl = document.getElementById('daily-action-msg');
            if (msgEl) {
                msgEl.style.display = 'block';
                msgEl.className = 'health-alert alert-amber';
                msgEl.textContent = `Rolled up — closed $${oldStrike} call (${fmt$(buybackCost)}) · sold $${newStrike} call for ${fmt$(newCallResult.premium)}.`;
            }
        }
        renderDailyResult();
    });

    document.getElementById('btn-daily-roll-down')?.addEventListener('click', () => {
        const sim = state.simulator;
        if (!sim.shortCall) return;
        const ctx = state.dailyWeekContext;
        const oldStrike = ctx.strike;
        const buybackCost = sim.shortCall.optionValue;

        // New strike: ~1% OTM at current (lower) price — collects more premium than far-OTM original
        const newStrike = Math.round(sim.currentStockPrice * 1.01);

        // Guard: new strike must stay above LEAPS strike to avoid a problematic spread
        if (sim.leapsPosition && newStrike <= sim.leapsPosition.strike) {
            const msgEl = document.getElementById('daily-action-msg');
            if (msgEl) {
                msgEl.style.display = 'block';
                msgEl.className = 'health-alert alert-red';
                msgEl.textContent = `Can't roll down — new strike ($${newStrike}) would be at or below your LEAPS strike ($${Math.round(sim.leapsPosition.strike)}). Close the call instead.`;
            }
            return;
        }

        sim.closeShortCall();
        const remainingDte = Math.max(1, 5 - state.dayOfWeek);
        const newCallResult = sim.sellWeeklyCall(newStrike, remainingDte, state.selectedContracts);

        if (newCallResult.success) {
            ctx.rolls = (ctx.rolls || 0) + 1;
            ctx.strike = newStrike;
            ctx.lastCallPremium = newCallResult.premium;
            const todayCallPnl = state.dailyDayResults[state.dayOfWeek - 1]?.shortCall?.dailyPnl || 0;
            ctx.rollLog.push({ day: state.dayOfWeek, action: 'roll_down', oldStrike, buybackCost, todayCallPnl, newStrike, newPremium: newCallResult.premium });

            const netCredit = newCallResult.premium - buybackCost;
            const msgEl = document.getElementById('daily-action-msg');
            if (msgEl) {
                msgEl.style.display = 'block';
                msgEl.className = 'health-alert alert-blue';
                msgEl.textContent = `Rolled down — closed $${oldStrike} call (${fmt$(buybackCost)}) · sold $${newStrike} call for ${fmt$(newCallResult.premium)} · net ${netCredit >= 0 ? 'credit' : 'debit'} ${fmt$(Math.abs(netCredit))}.`;
            }
        }
        renderDailyResult();
    });
}

// ─── Results screen ───────────────────────────────────────────────────────────
function syncResWithdrawalControls() {
    const toggle = document.getElementById('res-withdrawal-toggle');
    if (toggle) toggle.checked = state.incomeWithdrawal;
    // Highlight the active preset button
    document.querySelectorAll('.res-withdrawal-preset-btn').forEach(b => {
        b.style.background = parseInt(b.dataset.amount) === state.withdrawalAmount ? 'var(--accent-light)' : 'var(--bg-tertiary)';
        b.style.borderColor = parseInt(b.dataset.amount) === state.withdrawalAmount ? 'var(--accent)' : 'var(--border-strong)';
        b.style.color = parseInt(b.dataset.amount) === state.withdrawalAmount ? 'var(--accent-dark)' : '';
    });
}

function initResultsScreen() {
    document.getElementById('btn-next-week')?.addEventListener('click', () => {
        state.selectedStrike = null;
        showScreen('sell');
        updateSellScreen();
    });

    document.getElementById('btn-adjust-leaps')?.addEventListener('click', () => {
        showScreen('roll');
        updateRollScreen();
    });

    document.getElementById('btn-results-reset')?.addEventListener('click', () => {
        if (confirm('Reset the game?')) location.reload();
    });

    document.getElementById('btn-skip-report-results')?.addEventListener('click', showAnnualReport);

    // Mid-game withdrawal controls
    document.getElementById('res-withdrawal-toggle')?.addEventListener('change', (e) => {
        state.incomeWithdrawal = e.target.checked;
        syncResWithdrawalControls();
    });

    document.querySelectorAll('.res-withdrawal-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.withdrawalAmount = parseInt(btn.dataset.amount);
            syncResWithdrawalControls();
        });
    });
}

function updateResultsScreen() {
    const r = state.pendingWeekResult;
    if (!r) return;
    const status = r.status;

    // Update topbar to show week's closing price
    const closePrice = r.move?.newPrice || state.simulator.currentStockPrice;
    const priceChange = r.move?.priceChangePct || 0;
    const displayTotal = r.postWithdrawalTotal ?? r.status.totalValue;
    const displayCash = r.postWithdrawalCash ?? r.status.cash;
    setText('sell-header-price', `${state.ticker} $${closePrice.toFixed(2)}`);
    setText('sell-header-vix', `${getVolLabel()} ${state.vixHistory[state.vixHistory.length - 1].toFixed(1)}`);
    setText('sell-header-capital', `Capital $${Math.round(displayTotal).toLocaleString()}`);

    // Outcome banner
    const banner = document.getElementById('outcome-banner');
    if (banner) {
        banner.className = `outcome-banner outcome-${r.outcomeType}`;
        banner.innerHTML = `<strong>${r.outcomeMsg}</strong>`;
    }

    // Price action row
    const openPrice = r.weekStartPrice || closePrice;
    const priceDollar = closePrice - openPrice;
    const priceSign = priceDollar >= 0 ? '+' : '';
    const priceChangeClass = priceDollar >= 0 ? 'positive' : 'negative';
    setText('res-price-open', `$${openPrice.toFixed(2)}`);
    setText('res-price-close', `$${closePrice.toFixed(2)}`);
    const changeEl = document.getElementById('res-price-change');
    if (changeEl) {
        changeEl.textContent = `${priceSign}$${Math.abs(priceDollar).toFixed(2)}  (${priceSign}${priceChange.toFixed(1)}%)`;
        changeEl.className = `mono price-action-change-val ${priceChangeClass}`;
    }

    // P&L cards
    setText('res-weekly-pnl', fmt$(r.weeklyPnl, true));
    const trueTotalValue = status.totalValue + state.totalWithdrawn;
    const totalPnl = trueTotalValue - state.startingCapital;
    const totalPct = (totalPnl / state.startingCapital) * 100;
    setText('res-total-return', `${fmt$(totalPnl, true)} (${fmtPct(totalPct)})`);

    // P&L breakdown table
    const startLeaps = r.weekStartLeapsValue;
    const endLeaps = status.leaps?.value || 0;
    const leapsPnl = endLeaps - startLeaps;

    // Short call row: use the true finalPnl when the call expired so the
    // intrinsic debit paid on an ITM expiry is visible (not hidden as +premium).
    let callStartVal, callEndVal, callPnlDisplay;
    if (r.isUncovered && !r.managedCall) {
        callStartVal = 0; callEndVal = 0; callPnlDisplay = 0;
    } else if (r.managedCall) {
        callStartVal = r.premiumCollected;
        callEndVal = Math.max(0, r.premiumCollected - r.trueCallPnl);
        callPnlDisplay = r.trueCallPnl;
    } else if (r.expiredCallFinalPnl !== null && r.expiredCallFinalPnl !== undefined) {
        callStartVal = r.premiumCollected;       // credit received
        callEndVal = r.expiredCallIntrinsic;     // debit paid at expiry (0 if OTM)
        callPnlDisplay = r.expiredCallFinalPnl;  // net = credit − debit
    } else {
        callStartVal = r.premiumCollected;
        callEndVal = status.shortCall?.currentValue || 0;
        callPnlDisplay = r.premiumCollected - callEndVal;
    }

    updatePnlRow('row-leaps', startLeaps, endLeaps, leapsPnl);
    updatePnlRow('row-call', callStartVal, callEndVal, callPnlDisplay);
    updatePnlRow('row-theta', 0, 0, -(r.thetaDecay || 0), true);
    updatePnlRow('row-net', 0, 0, r.weeklyPnl, false, true);

    // Withdrawal summary section (separate from trading P&L)
    const withdrawalSummary = document.getElementById('withdrawal-summary');
    if (withdrawalSummary) {
        if (state.incomeWithdrawal && r.withdrawal) {
            withdrawalSummary.style.display = 'block';
            const box = document.getElementById('withdrawal-summary-box');
            const amountEl = document.getElementById('ws-amount');
            const remainingEl = document.getElementById('ws-remaining');
            const missedMsg = document.getElementById('withdrawal-missed-msg');
            const lowMsg = document.getElementById('withdrawal-low-msg');
            const cashReserve = displayCash;
            const cashPct = ((cashReserve / state.startingCapital) * 100).toFixed(1);
            const weeksOfCash = cashReserve > 0 ? Math.floor(cashReserve / state.withdrawalAmount) : 0;

            if (r.withdrawal.success) {
                if (box) { box.className = 'withdrawal-summary-box'; }
                if (amountEl) {
                    amountEl.textContent = fmt$(-r.withdrawal.withdrawn, true);
                    amountEl.className = 'mono withdrawal-amount';
                }
                if (missedMsg) missedMsg.style.display = 'none';
                if (lowMsg) {
                    if (weeksOfCash <= 6 && weeksOfCash > 0) {
                        lowMsg.style.display = 'block';
                        lowMsg.textContent = `Cash reserve is low — covers ~${weeksOfCash} more withdrawal${weeksOfCash === 1 ? '' : 's'}. Consider selling a call to collect premium, rolling the LEAPS to a later expiry (which can release cash), or pausing withdrawals.`;
                    } else {
                        lowMsg.style.display = 'none';
                    }
                }
            } else {
                if (box) { box.className = 'withdrawal-summary-box missed'; }
                if (amountEl) {
                    amountEl.textContent = `Missed — $${Math.round(r.withdrawal.shortfall).toLocaleString()} shortfall`;
                    amountEl.className = 'mono withdrawal-amount missed';
                }
                if (missedMsg) {
                    missedMsg.style.display = 'block';
                    missedMsg.textContent = 'Insufficient cash to cover this week\'s withdrawal. Sell a call to collect premium, roll the LEAPS to a later expiry to release cash, or pause withdrawals.';
                }
                if (lowMsg) lowMsg.style.display = 'none';
            }
            if (remainingEl) {
                remainingEl.textContent = `${fmt$(cashReserve)}  (${cashPct}%)`;
                remainingEl.style.color = cashReserve < 0 ? 'var(--red)' : cashReserve < state.withdrawalAmount * 6 ? 'var(--amber)' : 'var(--text-primary)';
            }
            setText('ws-total-withdrawn', fmt$(state.totalWithdrawn));

            // True total = pot + everything withdrawn — what the account would be if no income had been taken
            const totalInclWithdrawals = displayTotal + state.totalWithdrawn;
            const truePct = ((totalInclWithdrawals / state.startingCapital) * 100).toFixed(1);
            const trueTotalEl = document.getElementById('ws-true-total');
            if (trueTotalEl) {
                trueTotalEl.textContent = `${fmt$(totalInclWithdrawals)}  (${truePct}%)`;
                trueTotalEl.style.color = totalInclWithdrawals >= state.startingCapital ? 'var(--green)' : 'var(--red)';
            }

            // Net capital this week = trading P&L minus what was taken out
            const withdrawn = r.withdrawal.success ? r.withdrawal.withdrawn : 0;
            const netThisWeek = r.weeklyPnl - withdrawn;
            const netEl = document.getElementById('ws-net-change');
            if (netEl) {
                const netPct = ((netThisWeek / displayTotal) * 100).toFixed(1);
                netEl.textContent = `${fmt$(netThisWeek, true)}  (${netPct}%)`;
                netEl.style.color = netThisWeek >= 0 ? 'var(--green)' : 'var(--red)';
            }

        } else {
            withdrawalSummary.style.display = 'none';
        }
    }

    // Cumulative P&L chart
    const pnlCanvas = document.getElementById('pnl-chart');
    if (pnlCanvas) drawPnlChart(pnlCanvas, state.portfolioValueHistory, state.startingCapital);

    // Stats sidebar
    const avg = state.totalTrades > 0 ? state.totalPremiumCollected / state.totalTrades : 0;
    setText('res-avg-week', fmt$(avg));
    const annReturn = annualisedReturn(state.startingCapital, displayTotal + state.totalWithdrawn, state.week);
    setText('res-ann-return', fmtPct(annReturn));
    setText('res-total-premium', fmt$(state.totalPremiumCollected));
    setText('res-win-rate', state.totalTrades > 0 ? `${Math.round(state.wins / state.totalTrades * 100)}%` : '—');
    setText('res-wins', `${state.wins}/${state.totalTrades}`);
    setText('res-week-progress', `Week ${state.week} of 52`);

    // Short call sold card
    const callSection = document.getElementById('res-short-call-section');
    if (callSection) {
        if (r.isUncovered) {
            callSection.style.display = 'none';
        } else {
            callSection.style.display = '';
            // At-entry stats
            const pct = r.strike ? (r.strike - r.weekStartPrice) / r.weekStartPrice * 100 : 0;
            const callType = pct < -1 ? 'ITM' : pct < 0.5 ? 'ATM' : pct < 1.5 ? 'Near OTM' : 'Far OTM';
            const breakeven = (r.strike || 0) + r.premiumCollected / 100;
            const cushionPerShare = breakeven - r.weekStartPrice;
            setText('res-call-strike', `$${r.strike}`);
            setText('res-call-type', callType);
            setText('res-call-premium', fmt$(r.premiumCollected));
            setText('res-call-intrinsic', fmt$(r.intrinsicAtSale));
            setText('res-call-extrinsic', fmt$(r.extrinsicAtSale));
            const moneyDistance = (r.strike || 0) - r.weekStartPrice;
            const otmRow = document.getElementById('res-call-otm-row');
            if (otmRow) otmRow.style.display = Math.abs(moneyDistance) < 0.5 ? 'none' : '';
            const otmLabel = document.getElementById('res-call-otm-label');
            if (otmLabel) otmLabel.textContent = moneyDistance > 0 ? 'OTM distance' : 'ITM depth (at entry)';
            setText('res-call-otm-dist', `$${Math.abs(moneyDistance).toFixed(2)} / share`);
            setText('res-call-extrinsic-buf', `$${(r.extrinsicAtSale / 100).toFixed(2)} / share`);
            setText('res-call-cushion', `$${cushionPerShare.toFixed(2)} / share`);
            setText('res-call-breakeven', `$${breakeven.toFixed(2)}`);

            // End-of-week current status
            const endPrice = r.status?.stockPrice || r.weekStartPrice;
            const currentCallValue = r.status?.shortCall
                ? r.status.shortCall.currentValue
                : r.expiredCallIntrinsic || 0;
            const effectiveStrike = r.finalStrike || r.strike || 0;
            const currentIntrinsicPerContract = Math.max(0, endPrice - effectiveStrike) * 100;
            const currentITMDepth = endPrice - effectiveStrike;
            const currentPct = r.strike ? (r.strike - endPrice) / endPrice * 100 : 0;
            const currentType = r.expiredCallFinalPnl !== null
                ? (currentITMDepth > 0.01 ? 'Expired ITM' : 'Expired worthless ✓')
                : (currentPct < -3 ? 'Deep ITM ⚠' : currentPct < -0.5 ? 'ITM' : currentPct < 0.5 ? 'ATM' : 'OTM');

            const currentTypeEl = document.getElementById('res-call-current-type');
            if (currentTypeEl) {
                currentTypeEl.textContent = currentType;
                currentTypeEl.style.color = currentITMDepth > 1 && r.expiredCallFinalPnl === null
                    ? 'var(--red)' : currentType.includes('Expired worthless') ? 'var(--green)' : '';
            }
            const costRow = document.getElementById('res-call-cost-row');
            if (costRow) {
                const costEl = document.getElementById('res-call-cost-to-close');
                if (costEl) {
                    costEl.textContent = r.expiredCallFinalPnl !== null ? '—' : fmt$(currentCallValue);
                    costEl.style.color = currentCallValue > r.premiumCollected ? 'var(--red)' : '';
                }
            }
            const itmDepthRow = document.getElementById('res-call-itm-depth-row');
            if (itmDepthRow) {
                itmDepthRow.style.display = currentITMDepth > 0.5 ? '' : 'none';
                setText('res-call-itm-depth', `$${currentITMDepth.toFixed(2)} / share`);
                const itmDepthEl = document.getElementById('res-call-itm-depth');
                if (itmDepthEl) itmDepthEl.style.color = 'var(--red)';
            }
        }
    }

    // LEAPS health
    if (status.leaps) {
        updateLeapsHealthAlerts(status.leaps.delta, status.leaps.dte, 'res-leaps-health');
        setText('res-leaps-delta', fmtDelta(status.leaps.delta));
        setText('res-leaps-dte', `${status.leaps.dte} days`);
        setText('res-leaps-value', fmt$(status.leaps.value));
        setText('res-leaps-pnl', fmt$(status.leaps.pnl, true));
    }

    // Capital position (use post-withdrawal values when withdrawal mode is on)
    setText('res-leaps-val-cap', fmt$(status.leaps?.value || 0));
    setText('res-cash-reserve', fmt$(displayCash));
    setText('res-total-account', fmt$(displayTotal));
    const cashPct = displayTotal > 0 ? (displayCash / displayTotal * 100).toFixed(1) : '0.0';
    setText('res-cash-pct', `${cashPct}%`);

    // Withdrawal tracker card — always visible so toggle is accessible
    const wCard = document.getElementById('withdrawal-stats-card');
    if (wCard) {
        wCard.style.display = 'block';
        syncResWithdrawalControls();
        if (state.incomeWithdrawal && r.withdrawal) {
            setText('res-withdrawal-this-week', r.withdrawal.success ? fmt$(r.withdrawal.withdrawn) : 'Missed');
            setText('res-total-withdrawn', fmt$(state.totalWithdrawn));
            const missedCount = state.withdrawalHistory.filter(w => !w.success).length;
            setText('res-missed-weeks', `${missedCount}`);
        } else if (!state.incomeWithdrawal) {
            setText('res-withdrawal-this-week', '—');
        }
    }

    // Mirror total withdrawn in Capital Position block (only shown when non-zero)
    const capWithdrawnRow = document.getElementById('res-cap-withdrawn-row');
    const capTotalInclRow = document.getElementById('res-cap-total-incl-row');
    if (capWithdrawnRow) {
        if (state.totalWithdrawn > 0) {
            setText('res-cap-withdrawn', fmt$(state.totalWithdrawn));
            capWithdrawnRow.style.display = '';
            const totalIncl = state.simulator.getTotalValue() + state.totalWithdrawn;
            setText('res-cap-total-incl', fmt$(totalIncl));
            if (capTotalInclRow) capTotalInclRow.style.display = '';
        } else {
            capWithdrawnRow.style.display = 'none';
            if (capTotalInclRow) capTotalInclRow.style.display = 'none';
        }
    }

    // Market comparison — buy & hold vs strategy
    const bahStartPrice = state.gameStartStockPrice || closePrice;
    const bahCurrentPrice = closePrice;
    const bahChangePct = ((bahCurrentPrice - bahStartPrice) / bahStartPrice * 100);
    const bahSign = bahChangePct >= 0 ? '+' : '';
    const bahPortfolioValue = state.startingCapital * (bahCurrentPrice / bahStartPrice);
    const bahPortfolioPnl = bahPortfolioValue - state.startingCapital;
    const bahPortfolioPct = (bahPortfolioPnl / state.startingCapital * 100).toFixed(1);
    const bahPortfolioSign = bahPortfolioPnl >= 0 ? '+' : '';
    setText('res-bah-start-label', `${state.ticker} at start`);
    setText('res-bah-start-price', `$${bahStartPrice.toFixed(2)}`);
    const bahCurrentEl = document.getElementById('res-bah-current-price');
    if (bahCurrentEl) {
        bahCurrentEl.textContent = `$${bahCurrentPrice.toFixed(2)} (${bahSign}${bahChangePct.toFixed(1)}%)`;
        bahCurrentEl.style.color = bahChangePct >= 0 ? 'var(--green)' : 'var(--red)';
    }
    const bahValueEl = document.getElementById('res-bah-value');
    if (bahValueEl) {
        bahValueEl.textContent = `${fmt$(bahPortfolioValue)} (${bahPortfolioSign}${bahPortfolioPct}%)`;
        bahValueEl.style.color = bahPortfolioPnl >= 0 ? 'var(--green)' : 'var(--red)';
    }
    const bahStrategyEl = document.getElementById('res-bah-strategy');
    if (bahStrategyEl) {
        const strategyPnl = trueTotalValue - state.startingCapital;
        const strategyPct = (strategyPnl / state.startingCapital * 100).toFixed(1);
        const strategySign = strategyPnl >= 0 ? '+' : '';
        bahStrategyEl.textContent = `${fmt$(trueTotalValue)} (${strategySign}${strategyPct}%)`;
        bahStrategyEl.style.color = strategyPnl >= 0 ? 'var(--green)' : 'var(--red)';
    }

    // Next week signal
    const signal = getRulesSignal(state.vixHistory, state.priceHistory);
    const nextSignalEl = document.getElementById('next-week-signal');
    if (nextSignalEl && signal) {
        nextSignalEl.textContent = `${signal.action} — ${signal.reason}`;
        nextSignalEl.className = `next-signal signal-${signal.colour}`;
    }

    renderDayLog();
}

function renderDayLog() {
    const logEl = document.getElementById('res-day-log');
    const bodyEl = document.getElementById('res-day-log-body');
    if (!logEl || !bodyEl) return;

    const r = state.pendingWeekResult;
    const da = r?.dayActivity;
    if (!da || !da.days || da.days.length === 0) { logEl.style.display = 'none'; return; }

    logEl.style.display = '';

    const days = da.days;
    const rollLog = da.rollLog || [];
    const startPrice = da.weekStartPrice;
    const hasCalls = !da.isUncovered;

    // Build lookup: events keyed by day number (1 = after Monday, etc.)
    const eventsByDay = {};
    for (const evt of rollLog) {
        (eventsByDay[evt.day] = eventsByDay[evt.day] || []).push(evt);
    }

    const MONO = "font-family:'IBM Plex Mono',monospace";
    const G = 'color:var(--green)';
    const R = 'color:var(--red)';
    const colColor = (v) => v >= 0 ? G : R;
    const colSign  = (v) => (v >= 0 ? '+' : '') + fmt$(v);
    const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const numCols = hasCalls ? 5 : 4;

    const rows = [];

    // Header
    let hdr = '<tr style="border-bottom:1px solid var(--border);color:var(--text-tertiary);text-align:right;">';
    hdr += '<th style="text-align:left;padding:4px 6px;font-weight:500;">Day</th>';
    hdr += '<th style="padding:4px 6px;font-weight:500;">Price</th>';
    hdr += '<th style="padding:4px 6px;font-weight:500;">LEAPS</th>';
    if (hasCalls) hdr += '<th style="padding:4px 6px;font-weight:500;">Short call</th>';
    hdr += '<th style="padding:4px 6px;font-weight:500;">Net</th>';
    hdr += '</tr>';

    let leapsCum = 0, callCum = 0;

    for (let i = 0; i < days.length; i++) {
        const dr = days[i];
        const prevPrice = i === 0 ? startPrice : days[i - 1].stockPrice;
        const priceChg = dr.stockPrice - prevPrice;
        const leapsPnl = dr.leaps ? (dr.leaps.dailyPnl || 0) : 0;
        // shortCall.dailyPnl = oldValue − newValue: positive when it decays (good for us)
        const callPnl  = dr.shortCall ? (dr.shortCall.dailyPnl || 0) : 0;
        const netPnl   = dr.dailyPnl || 0;
        leapsCum += leapsPnl;
        callCum  += callPnl;

        // Short call cell content
        let callCell = '';
        if (hasCalls) {
            if (dr.shortCall && dr.shortCall.expired) {
                callCell = dr.shortCall.finalPnl >= 0
                    ? '<span style="' + G + '">expired OTM</span>'
                    : '<span style="' + R + '">exp ITM ' + fmt$(dr.shortCall.finalPnl, true) + '</span>';
            } else {
                callCell = '<span style="' + colColor(callPnl) + '">' + colSign(callPnl) + '</span>';
            }
        }

        let row = '<tr style="border-bottom:1px solid var(--bg-tertiary);">';
        row += '<td style="padding:4px 6px;font-weight:500;' + MONO + '">' + DAY_NAMES[i] + '</td>';
        row += '<td style="padding:4px 6px;text-align:right;' + MONO + '">$' + dr.stockPrice.toFixed(2)
             + ' <span style="font-size:11px;' + colColor(priceChg) + '">(' + (priceChg >= 0 ? '+' : '') + priceChg.toFixed(2) + ')</span></td>';
        row += '<td style="padding:4px 6px;text-align:right;' + MONO + ';' + colColor(leapsPnl) + '">' + colSign(leapsPnl) + '</td>';
        if (hasCalls) row += '<td style="padding:4px 6px;text-align:right;' + MONO + '">' + callCell + '</td>';
        row += '<td style="padding:4px 6px;text-align:right;' + MONO + ';' + colColor(netPnl) + '">' + colSign(netPnl) + '</td>';
        row += '</tr>';
        rows.push(row);

        // Events after this day (rolls/closes/new sells)
        for (const evt of (eventsByDay[i + 1] || [])) {
            // sell_call = entered a new short call while uncovered
            if (evt.action === 'sell_call') {
                const dte = Math.max(1, 5 - evt.day);
                const erow = '<tr style="background:var(--bg-secondary);">'
                    + '<td colspan="' + numCols + '" style="padding:3px 8px 3px 20px;font-size:11px;color:var(--text-secondary);">'
                    + '<span style="color:var(--green);font-weight:600;">Sold call</span>'
                    + ' — sold $' + evt.newStrike + ' call (ATM) for ' + fmt$(evt.newPremium) + ' · ' + dte + ' DTE'
                    + '</td></tr>';
                rows.push(erow);
                continue;
            }

            const label = evt.action === 'close' ? 'Closed call'
                : evt.action === 'roll_up' ? 'Rolled up ↑'
                : 'Rolled down ↓';
            const labelColor = evt.action === 'close' ? 'var(--text-secondary)'
                : evt.action === 'roll_up' ? 'var(--amber)' : 'var(--accent)';

            // todayCallPnl = oldValue − newValue (negative when call appreciated against us)
            // openValue = what the call was worth at the START of this day
            const openValue = (evt.todayCallPnl !== undefined && evt.buybackCost)
                ? evt.buybackCost + evt.todayCallPnl : null;
            const todayRise  = openValue !== null ? -evt.todayCallPnl : 0; // positive = call got more expensive

            let openCtx = '';
            if (openValue !== null && openValue > 1 && todayRise > 5) {
                openCtx = ' <span style="color:var(--text-tertiary)">'
                    + '(day open ' + fmt$(openValue) + ' · +' + fmt$(todayRise) + ' today)</span>';
            }

            let detail = 'closed $' + evt.oldStrike + ' call at ' + fmt$(evt.buybackCost) + openCtx;
            if (evt.newStrike) {
                const net = evt.newPremium - evt.buybackCost;
                const netStr = (net >= 0 ? 'net credit ' : 'net debit ')
                    + '<span style="' + colColor(net) + '">' + fmt$(Math.abs(net)) + '</span>';
                detail += ' · opened $' + evt.newStrike + ' call for ' + fmt$(evt.newPremium) + ' · ' + netStr;
            }
            // No trailing cash amount for close-only — P&L already in the day row above

            let erow = '<tr style="background:var(--bg-secondary);">';
            erow += '<td colspan="' + numCols + '" style="padding:3px 8px 3px 20px;font-size:11px;color:var(--text-secondary);">';
            erow += '<span style="color:' + labelColor + ';font-weight:600;">' + label + '</span> — ' + detail;
            erow += '</td></tr>';
            rows.push(erow);
        }
    }

    // Totals row
    let tot = '<tr style="border-top:2px solid var(--border);font-weight:600;">';
    const totalPnl = days.reduce((s, d) => s + (d.dailyPnl || 0), 0);
    tot += '<td colspan="2" style="padding:5px 6px;font-size:12px;">Week total</td>';
    tot += '<td style="padding:5px 6px;text-align:right;' + MONO + ';' + colColor(leapsCum) + '">' + colSign(leapsCum) + '</td>';
    if (hasCalls) tot += '<td style="padding:5px 6px;text-align:right;' + MONO + ';' + colColor(callCum) + '">' + colSign(callCum) + '</td>';
    tot += '<td style="padding:5px 6px;text-align:right;' + MONO + ';' + colColor(totalPnl) + '">' + colSign(totalPnl) + '</td>';
    tot += '</tr>';

    bodyEl.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
        + '<thead>' + hdr + '</thead>'
        + '<tbody>' + rows.join('') + tot + '</tbody>'
        + '</table>';
}

function updatePnlRow(rowId, startVal, endVal, pnl, skipValues = false, isNet = false) {
    const row = document.getElementById(rowId);
    if (!row) return;
    if (!skipValues) {
        const cells = row.querySelectorAll('.mono');
        if (cells[0]) cells[0].textContent = fmt$(startVal);
        if (cells[1]) cells[1].textContent = fmt$(endVal);
    }
    const pnlCell = row.querySelector('.pnl-cell');
    if (pnlCell) {
        pnlCell.textContent = fmt$(pnl, true);
        pnlCell.className = 'mono pnl-cell ' + (pnl >= 0 ? 'positive' : 'negative');
    }
    if (isNet) row.classList.add('net-row');
}

// ─── Roll screen ──────────────────────────────────────────────────────────────
function initRollScreen() {
    document.getElementById('btn-execute-roll')?.addEventListener('click', executeRoll);
    document.getElementById('btn-cancel-roll')?.addEventListener('click', () => {
        showScreen('results');
        updateResultsScreen();
    });

    document.getElementById('roll-itm-slider')?.addEventListener('input', updateRollScreen);
    document.getElementById('roll-contracts-slider')?.addEventListener('input', updateRollScreen);
    document.querySelectorAll('.roll-dte-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.roll-dte-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            updateRollScreen();
        });
    });
}

function updateRollScreen() {
    const sim = state.simulator;
    if (!sim || !sim.leapsPosition) return;

    const stockPrice = sim.currentStockPrice;
    const itmSlider = document.getElementById('roll-itm-slider');
    const itmAmount = itmSlider ? parseInt(itmSlider.value) : 30;
    const newStrike = Math.round(stockPrice - itmAmount);
    const dteCard = document.querySelector('.roll-dte-card.active');
    const newDte = dteCard ? parseInt(dteCard.dataset.dte) : 360;

    const currentLeaps = sim.leapsPosition;
    const newLeaps = new LEAPSPosition(stockPrice, newStrike, newDte, currentLeaps.contracts);

    const rollCost = newLeaps.value - currentLeaps.value;
    const cashAfter = sim.cash - rollCost;

    setText('roll-itm-display', `$${itmAmount} ITM`);
    setText('roll-current-strike', `$${Math.round(currentLeaps.strike)}`);
    setText('roll-current-dte', `${currentLeaps.dte} days`);
    setText('roll-current-delta', fmtDelta(currentLeaps.delta));
    setText('roll-current-value', fmt$(currentLeaps.value));
    setText('roll-available-capital', fmt$(sim.cash + currentLeaps.value));

    setText('roll-new-strike', `$${newStrike}`);
    setText('roll-new-expiry', dteToExpiry(newDte));
    setText('roll-new-delta', fmtDelta(newLeaps.delta));
    setText('roll-new-cost', fmt$(newLeaps.value));
    setText('roll-net-cost', fmt$(rollCost, true));
    setText('roll-cash-after', fmt$(cashAfter));

    updateLeapsHealthAlerts(newLeaps.delta, newDte, 'roll-health');
}

function executeRoll() {
    const sim = state.simulator;
    const itmSlider = document.getElementById('roll-itm-slider');
    const itmAmount = itmSlider ? parseInt(itmSlider.value) : 30;
    const dteCard = document.querySelector('.roll-dte-card.active');
    const newDte = dteCard ? parseInt(dteCard.dataset.dte) : 360;
    const newStrike = Math.round(sim.currentStockPrice - itmAmount);

    const rollErrEl = document.getElementById('roll-error-msg');

    const rollContracts = sim.leapsPosition ? sim.leapsPosition.contracts : (state.selectedContracts || 1);

    // Pre-check: simulate cost without touching positions
    const prospective = new LEAPSPosition(sim.currentStockPrice, newStrike, newDte, rollContracts);
    const availableCapital = sim.cash + (sim.leapsPosition ? sim.leapsPosition.value : 0);
    if (prospective.value > availableCapital) {
        const shortfall = prospective.value - availableCapital;
        if (rollErrEl) {
            rollErrEl.textContent = `Insufficient capital — new LEAPS costs ${fmt$(prospective.value)} but you only have ${fmt$(availableCapital)} available (shortfall: ${fmt$(shortfall)}).`;
            rollErrEl.style.display = '';
        }
        return;
    }
    if (rollErrEl) rollErrEl.style.display = 'none';

    sim.closeLeaps();
    const result = sim.openLeaps(newStrike, newDte, rollContracts);
    if (result.error) {
        // Should not happen after pre-check, but guard anyway
        if (rollErrEl) { rollErrEl.textContent = result.error; rollErrEl.style.display = ''; }
        return;
    }
    state.selectedContracts = rollContracts;

    // Refresh pending result so the results screen shows post-roll cash and LEAPS values
    if (state.pendingWeekResult) {
        const newStatus = sim.getStatus();
        state.pendingWeekResult.status = newStatus;
        state.pendingWeekResult.postWithdrawalCash = sim.cash;
        state.pendingWeekResult.postWithdrawalTotal = sim.getTotalValue();
    }

    showScreen('results');
    updateResultsScreen();
}

// ─── Game over / Annual report ────────────────────────────────────────────────
function showGameOver() {
    showScreen('gameover');
    const status = state.simulator.getStatus();
    const totalLoss = status.totalValue - state.startingCapital;
    const lossPct = (totalLoss / state.startingCapital * 100).toFixed(1);
    setText('go-start', fmt$(state.startingCapital));
    setText('go-final', fmt$(status.totalValue));
    setText('go-loss', fmt$(totalLoss, true));
    setText('go-weeks', `${state.week}`);
    setText('go-pct', `${lossPct}%`);
    document.getElementById('btn-play-again-go')?.addEventListener('click', () => location.reload());
}

function showAnnualReport() {
    showScreen('annual');
    const status = state.simulator.getStatus();
    // True gain includes any cash that was withdrawn — so withdrawal users see the
    // same strategy performance number as non-withdrawal users.
    const trueGain = (status.totalValue - state.startingCapital) + state.totalWithdrawn;
    const trueGainPct = (trueGain / state.startingCapital * 100).toFixed(1);
    const sign = trueGain >= 0 ? '+' : '';
    const annReturn = annualisedReturn(state.startingCapital, state.startingCapital + trueGain, state.week);

    setText('ar-start',      fmt$(state.startingCapital));
    setText('ar-end',        fmt$(status.totalValue));
    setText('ar-total-gain', `${fmt$(trueGain, true)} (${sign}${trueGainPct}%)`);
    setText('ar-ann-return', fmtPct(annReturn));
    const shortCallLosses = state.totalPremiumCollected - state.totalShortCallNetPnl;
    const leapsPnlVal = status.leaps?.pnl || 0;
    setText('ar-premium',     fmt$(state.totalPremiumCollected, true));
    setText('ar-call-losses', shortCallLosses > 0 ? fmt$(-shortCallLosses, true) : fmt$(0, true));
    setText('ar-call-net',    fmt$(state.totalShortCallNetPnl, true));
    setText('ar-leaps-pnl',   fmt$(leapsPnlVal, true));
    setText('ar-net-pnl',     fmt$(trueGain, true));
    const applyColor = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.style.color = val > 0 ? 'var(--green)' : val < 0 ? 'var(--red)' : '';
    };
    applyColor('ar-premium',     state.totalPremiumCollected);
    applyColor('ar-call-losses', -shortCallLosses);
    applyColor('ar-call-net',    state.totalShortCallNetPnl);
    applyColor('ar-leaps-pnl',   leapsPnlVal);
    applyColor('ar-net-pnl',     trueGain);
    applyColor('ar-total-gain',  trueGain);

    const incomeSection = document.getElementById('ar-income-section');
    if (incomeSection) incomeSection.style.display = state.incomeWithdrawal ? 'block' : 'none';
    if (state.incomeWithdrawal) {
        const yieldPct = ((state.totalWithdrawn / state.startingCapital) * 100).toFixed(1);
        const weeklyAvg = Math.round(state.totalWithdrawn / Math.max(state.week, 1));
        setText('ar-total-withdrawn', fmt$(state.totalWithdrawn));
        setText('ar-income-yield',    `${yieldPct}%`);
        setText('ar-weekly-avg',      fmt$(weeklyAvg));
    }

    // Withdrawal rows in Performance section — show whenever any withdrawals occurred
    const hasWithdrawals = state.totalWithdrawn > 0;
    const arWithdrawnRow  = document.getElementById('ar-withdrawn-row');
    const arEffectiveRow  = document.getElementById('ar-effective-row');
    if (arWithdrawnRow)  arWithdrawnRow.style.display  = hasWithdrawals ? '' : 'none';
    if (arEffectiveRow)  arEffectiveRow.style.display  = hasWithdrawals ? '' : 'none';
    if (hasWithdrawals) {
        setText('ar-withdrawn-display', fmt$(state.totalWithdrawn));
        const effectiveEnd = status.totalValue + state.totalWithdrawn;
        setText('ar-effective-value',   fmt$(effectiveEnd));
        const effectiveEl = document.getElementById('ar-effective-value');
        if (effectiveEl) effectiveEl.style.color = effectiveEnd >= state.startingCapital ? 'var(--green)' : 'var(--red)';
    }

    // Benchmark comparison — owning N×100 shares (matching number of LEAPS contracts)
    const startPrice    = state.gameStartStockPrice || status.stockPrice;
    const endPrice      = status.stockPrice;
    const contracts     = state.simulator?.leapsPosition?.contracts || state.selectedContracts || 1;
    const shareCount    = contracts * 100;
    const sharesCost    = startPrice * shareCount;
    const sharesPnl     = (endPrice - startPrice) * shareCount;
    const sharesPct     = ((endPrice - startPrice) / startPrice * 100).toFixed(1);
    const sharesPctSign = parseFloat(sharesPct) >= 0 ? '+' : '';
    const ticker        = state.ticker || 'IWM';
    const sharesLabel   = shareCount === 100 ? '100 shares' : `${shareCount} shares (${contracts}×100)`;
    setText('ar-bm-section-title', `vs. owning ${sharesLabel}`);
    setText('ar-bm-price-label',   `${ticker} price: start → end`);
    setText('ar-bm-cost-label',    `${sharesLabel} cost`);
    setText('ar-bm-pnl-label',     `${sharesLabel} P&L (no premium)`);
    setText('ar-bm-prices', `$${startPrice.toFixed(2)} → $${endPrice.toFixed(2)} (${sharesPctSign}${sharesPct}%)`);
    setText('ar-bm-cost',   fmt$(sharesCost));
    const sharesPnlEl = document.getElementById('ar-bm-shares-pnl');
    if (sharesPnlEl) {
        sharesPnlEl.textContent = `${fmt$(sharesPnl, true)} (${sharesPctSign}${sharesPct}%)`;
        sharesPnlEl.style.color = sharesPnl >= 0 ? 'var(--green)' : 'var(--red)';
    }
    const stratPnlEl = document.getElementById('ar-bm-strategy-pnl');
    if (stratPnlEl) {
        stratPnlEl.textContent = `${fmt$(trueGain, true)} (${sign}${trueGainPct}%) on ${fmt$(state.startingCapital)}`;
        stratPnlEl.style.color = trueGain >= 0 ? 'var(--green)' : 'var(--red)';
    }

    let grade = 'D';
    if (annReturn > 20) grade = 'A';
    else if (annReturn > 10) grade = 'B';
    else if (annReturn > 0) grade = 'C';
    setText('ar-grade', grade);

    const pnlCanvas = document.getElementById('ar-pnl-chart');
    if (pnlCanvas) drawPnlChart(pnlCanvas, state.portfolioValueHistory, state.startingCapital);

    const endingValue = Math.round(status.totalValue);
    const keepLabel = document.getElementById('ar-keep-balance-label');
    if (keepLabel) keepLabel.textContent = fmt$(endingValue);

    document.getElementById('btn-keep-balance-ar')?.addEventListener('click', () => {
        state.startingCapital = Math.max(5000, endingValue);
        const capitalInput = document.getElementById('capital-input');
        if (capitalInput) capitalInput.value = state.startingCapital;
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        updateSetupPreview();
        showScreen('setup');
    });
    document.getElementById('btn-play-again-ar')?.addEventListener('click', () => location.reload());

    const btnAnalyse = document.getElementById('btn-get-analysis');
    if (btnAnalyse) {
        btnAnalyse.addEventListener('click', () => runAiAnalysis());
    }
}

function buildAnalysisPrompt() {
    const status = state.simulator.getStatus();
    const trueGain = (status.totalValue - state.startingCapital) + state.totalWithdrawn;
    const gainPct = (trueGain / state.startingCapital * 100).toFixed(1);
    const annReturn = annualisedReturn(state.startingCapital, state.startingCapital + trueGain, state.week);
    const winRate = state.totalTrades > 0 ? (state.wins / state.totalTrades * 100).toFixed(0) : 0;
    const leapsPnl = status.leaps?.pnl || 0;
    let grade = 'D';
    if (annReturn > 20) grade = 'A';
    else if (annReturn > 10) grade = 'B';
    else if (annReturn > 0) grade = 'C';

    const scenarioName = (typeof SCENARIOS !== 'undefined' && SCENARIOS[state.scenario]?.name) || state.scenario;
    const weeklyLog = state.weeklyPnlLog.map(v => Math.round(v)).join(', ');

    let withdrawalLine = '';
    if (state.incomeWithdrawal && state.totalWithdrawn > 0) {
        const yieldPct = ((state.totalWithdrawn / state.startingCapital) * 100).toFixed(1);
        const weeklyAvg = Math.round(state.totalWithdrawn / Math.max(state.week, 1));
        const effectiveEnd = status.totalValue + state.totalWithdrawn;
        withdrawalLine = `\n- Income withdrawn: $${state.totalWithdrawn.toLocaleString()} (${yieldPct}% yield, ~$${weeklyAvg}/week avg)\n- Portfolio shows $${status.totalValue.toLocaleString()} but portfolio + withdrawals = $${Math.round(effectiveEnd).toLocaleString()} (the account balance is lower than the gain figure because cash was taken out)`;
    }

    const bmStartPrice  = state.gameStartStockPrice || status.stockPrice;
    const bmEndPrice    = status.stockPrice;
    const bmContracts   = state.selectedContracts || 1;
    const bmShareCount  = bmContracts * 100;
    const bmSharesCost  = Math.round(bmStartPrice * bmShareCount);
    const bmSharesPnl   = Math.round((bmEndPrice - bmStartPrice) * bmShareCount);
    const bmSharesPct   = ((bmEndPrice - bmStartPrice) / bmStartPrice * 100).toFixed(1);
    const bmSharesSign  = parseFloat(bmSharesPct) >= 0 ? '+' : '';
    const benchmarkLine = `\n- Benchmark: owning ${bmShareCount} shares (equivalent to ${bmContracts} LEAPS contract${bmContracts > 1 ? 's' : ''}) would have cost $${bmSharesCost.toLocaleString()}, IWM moved $${bmStartPrice.toFixed(2)} → $${bmEndPrice.toFixed(2)} (${bmSharesSign}${bmSharesPct}%), shares P&L = $${bmSharesPnl.toLocaleString()}. The PMCC used $${state.startingCapital.toLocaleString()} capital vs $${bmSharesCost.toLocaleString()} for shares.`;

    const shortCallLosses = state.totalPremiumCollected - state.totalShortCallNetPnl;

    return `You are a trading mentor reviewing a student's year of paper-trading a Poor Man's Covered Call strategy (LEAPS deep ITM call + weekly short call). Be honest but encouraging.

Important simulator constraints: this is a weekly-resolution simulator. The player makes exactly one decision per week — which strike to sell (or go uncovered). There are no intraweek adjustments, no stop-losses, and no ability to close positions early. All feedback must respect these constraints. Do not suggest managing positions intraweek.

Game data:
- Scenario: ${scenarioName}
- Starting capital: $${state.startingCapital.toLocaleString()}
- Portfolio value at end: $${status.totalValue.toLocaleString()}
- Total strategy gain: $${Math.round(trueGain).toLocaleString()} (${gainPct}%)
- Annualised return: ${annReturn.toFixed(1)}%
- Grade: ${grade}
- Short call credits received: $${Math.round(state.totalPremiumCollected).toLocaleString()}
- Short call losses (ITM expiries): -$${Math.round(shortCallLosses).toLocaleString()}
- Net short call P&L: $${Math.round(state.totalShortCallNetPnl).toLocaleString()}
- LEAPS P&L: $${Math.round(leapsPnl).toLocaleString()}
- Win rate: ${winRate}% (${state.wins} of ${state.totalTrades} weeks profitable)${withdrawalLine}${benchmarkLine}

Weekly P&L log ($): ${weeklyLog}

Please give a concise debrief (under 300 words) covering:
1. Overall verdict on this run — was it a good year for this strategy?
2. What the P&L pattern reveals (consistency, big wins/losses, worst stretches)
3. One or two things they likely did well
4. One or two concrete things to try differently next time — only suggest things the player could actually change (strike selection, going uncovered vs covered, LEAPS roll timing)

Write in plain prose, no bullet lists, no markdown headers.`;
}

async function runAiAnalysis() {
    const btn = document.getElementById('btn-get-analysis');
    const outputEl = document.getElementById('ar-ai-output');
    const errorEl = document.getElementById('ar-ai-error');

    // Browsers block direct API calls from file:// (CORS origin: null).
    // The local proxy server.js handles this — run: node server.js
    if (window.location.protocol === 'file:') {
        showAiError('Open the game via the local server to use AI analysis.\n\nIn your terminal:\n  node server.js\n\nThen open http://localhost:3000');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Analysing…';
    outputEl.style.display = 'none';
    errorEl.style.display = 'none';

    try {
        const response = await fetch('/api/analyse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: buildAnalysisPrompt() }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err?.error?.message || `API error ${response.status}`);
        }

        outputEl.textContent = '';
        outputEl.style.display = 'block';

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // keep incomplete last line
            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6).trim();
                if (data === '[DONE]') break;
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                        outputEl.textContent += parsed.delta.text;
                    }
                } catch { /* skip malformed lines */ }
            }
        }
    } catch (err) {
        showAiError(err.message || 'Request failed. Check your API key and try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Analyse run';
    }
}

function showAiError(msg) {
    const el = document.getElementById('ar-ai-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

// ─── Tooltips / Info bubbles ──────────────────────────────────────────────────
const TOOLTIPS = {
    delta: 'How much the LEAPS moves per $1 move in IWM. 0.84 means you capture 84 cents of every $1 rally.',
    dte: 'Days to expiry. More time = slower theta decay. Roll before DTE drops below 180.',
    theta: 'Daily cost of holding the LEAPS. Covered by premium you collect from selling calls.',
    itm: 'In the money — strike is below current price. Deeper ITM = higher delta = more expensive.',
    otm: 'Out of the money — strike is above current price. Cheaper, more upside room, less premium.',
    'cash-reserve': 'Cash kept back to fund LEAPS rolls during downturns. Keep at least 50% of account as cash.',
    'ann-return': 'Your weekly average P&L extrapolated to a full year. Based on trades completed so far.',
    rvx: `Volatility index (${state.ticker === 'SPY' ? 'VIX' : 'RVX'}) for ${state.ticker}. High reading = fearful market = sell closer strikes for more premium.`,
    ema: `Exponential moving average. Shows trend direction of the volatility index. Rising EMA = volatility increasing.`,
    withdrawal: 'Each week, this amount is deducted from your cash reserve after trading. If cash is insufficient, the withdrawal is skipped and flagged. Game ends when your total pot reaches $0.',
};

function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const key = btn.dataset.tooltip;
            const text = TOOLTIPS[key] || '';
            let tip = btn.nextElementSibling;
            if (tip?.classList.contains('tooltip-bubble')) {
                tip.remove(); return;
            }
            tip = document.createElement('div');
            tip.className = 'tooltip-bubble';
            tip.textContent = text;
            btn.parentNode.insertBefore(tip, btn.nextSibling);
        });
    });
    document.addEventListener('click', () => {
        document.querySelectorAll('.tooltip-bubble').forEach(t => t.remove());
    });
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function getVolLabel() {
    return state.ticker === 'SPY' ? 'VIX' : 'RVX';
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function dteToExpiry(dte) {
    const d = new Date();
    d.setDate(d.getDate() + dte);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function annualisedReturn(start, current, weeks) {
    if (weeks === 0) return 0;
    const weeklyReturn = (current - start) / start / weeks;
    return weeklyReturn * 52 * 100;
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
    initSetupScreen();
    initLeapsScreen();
    initSellScreen();
    initDailyScreen();
    initResultsScreen();
    initRollScreen();
    showScreen('setup');
});
