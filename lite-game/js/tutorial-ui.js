// tutorial-ui.js — DOM controller for the lite tutorial game

// ─── Screen routing ───────────────────────────────────────────────────────────

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
}

// ─── Formatting ───────────────────────────────────────────────────────────────

const f$ = v => `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function fmtPnl(v, tag = 'span') {
    const cls = v >= 0 ? 'positive' : 'negative';
    const str = (v >= 0 ? '+' : '−') + `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `<${tag} class="${cls} mono">${str}</${tag}>`;
}

function fmtPct(v) {
    const cls = v >= 0 ? 'positive' : 'negative';
    return `<span class="${cls} mono">${v >= 0 ? '+' : ''}${v.toFixed(2)}%</span>`;
}

function fmtChg(v) {
    const cls = v >= 0 ? 'positive' : 'negative';
    return `<span class="${cls} mono">${v >= 0 ? '+' : ''}${v.toFixed(2)}%</span>`;
}

// ─── Week progress dots ───────────────────────────────────────────────────────

function weekDots(week, total, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    let html = '<div class="week-dots">';
    for (let i = 1; i <= total; i++) {
        if (i < week) html += '<span class="week-dot done"></span>';
        else if (i === week) html += '<span class="week-dot current"></span>';
        else html += '<span class="week-dot"></span>';
    }
    html += `<span style="font-size:11px;color:var(--text-tertiary);margin-left:6px;font-family:'IBM Plex Mono',monospace">Week ${week} of ${total}</span>`;
    html += '</div>';
    el.innerHTML = html;
}

// ─── Home screen ──────────────────────────────────────────────────────────────

function renderHome() {
    const p = ts.progress;
    setCard(1, true,  p.t1, 'Complete Tutorial 1 first');
    setCard(2, p.t1,  p.t2, 'Complete Tutorial 1 first');
    setCard(3, p.t2,  p.t3, 'Complete Tutorial 2 first');
}

function setCard(n, unlocked, done, lockMsg) {
    const overlay = document.getElementById(`lock-t${n}`);
    const btn     = document.getElementById(`t${n}-start-btn`);
    const badge   = document.getElementById(`t${n}-done-badge`);
    const lockText = overlay ? overlay.querySelector('.lock-msg') : null;

    if (overlay) overlay.style.display = unlocked ? 'none' : 'flex';
    if (lockText) lockText.textContent = lockMsg;
    if (btn) {
        btn.disabled = !unlocked;
        btn.textContent = done ? 'Play again →' : 'Start →';
    }
    if (badge) badge.style.display = done ? 'inline-flex' : 'none';
}

// Called by home card buttons
function startTutorialFlow(n) {
    startTutorial(n);
    showScreen(`screen-t${n}-intro`);
}

// ─── Tutorial 1 ───────────────────────────────────────────────────────────────

// Called from T1 intro "Start" button, and by "Next week" handler
function startT1Week() {
    const result = advanceT1Week();
    renderT1Week(result);
    showScreen('screen-t1-week');
}

function renderT1Week(r) {
    setText('t1-week-num',    r.week);
    setHTML('t1-current-price', `<span class="mono">${f$(r.closePrice)}</span>`);

    setText('t1-open-price',   f$(r.openPrice));
    setText('t1-close-price',  f$(r.closePrice));
    setHTML('t1-price-change', fmtChg(r.priceChangePct));

    setHTML('t1-week-share-pnl',  fmtPnl(r.weekSharePnl));
    setHTML('t1-total-share-pnl', fmtPnl(r.totalSharePnl));
    setText('t1-portfolio-value', f$(r.portfolioValue));

    setHTML('t1-right-portfolio',    `<span class="mono">${f$(r.portfolioValue)}</span>`);
    setHTML('t1-right-total-return', fmtPnl(r.totalSharePnl));
    setHTML('t1-right-return-pct',   fmtPct((r.totalSharePnl / START_CAPITAL) * 100));

    weekDots(r.week, TOTAL_WEEKS, 't1-week-dots');

    // Concept callout
    const conceptEl = document.getElementById('t1-concept-text');
    if (conceptEl) {
        if (r.week === TOTAL_WEEKS) {
            conceptEl.textContent = 'All 8 weeks done! A consistent bull market was very kind. But what happens in a sideways or falling market? Tutorial 2 shows how to earn income even then.';
        } else if (r.week <= 2) {
            conceptEl.textContent = 'The market is up. Your 100 shares grew in value — no action needed. Passive ownership works well when the market cooperates.';
        } else {
            conceptEl.textContent = `Week ${r.week} of 8. Your portfolio keeps climbing. Notice how every $1/share move = $100 in portfolio value (100 shares × $1).`;
        }
    }

    // Price chart
    const priceCanvas = document.getElementById('t1-price-chart');
    if (priceCanvas) {
        const closes = ts.ohlcHistory.map(d => d.close);
        drawPriceChart(priceCanvas, ts.ohlcHistory, calcEMA(closes, 5));
    }

    // P&L chart
    const pnlCanvas = document.getElementById('t1-pnl-chart');
    if (pnlCanvas && ts.portfolioHistory.length > 1) {
        drawPnlChart(pnlCanvas, ts.portfolioHistory.slice(1), START_CAPITAL);
    }

    // Button
    const btn = document.getElementById('t1-next-btn');
    if (btn) {
        if (r.week >= TOTAL_WEEKS) {
            btn.textContent = 'See summary →';
            btn.onclick = finishT1;
        } else {
            btn.textContent = 'Next week →';
            btn.onclick = startT1Week;
        }
    }
}

function finishT1() {
    completeTutorial();
    renderT1Summary();
    showScreen('screen-t1-summary');
}

function renderT1Summary() {
    const s = getSummaryStats();
    setText('t1-sum-final', f$(s.portfolioValue));
    setHTML('t1-sum-return', fmtPnl(s.totalReturn));
    setHTML('t1-sum-pct', fmtPct(s.returnPct));

    const canvas = document.getElementById('t1-sum-chart');
    if (canvas && s.portfolioHistory.length > 1) {
        drawPnlChart(canvas, s.portfolioHistory.slice(1), START_CAPITAL);
    }
}

// ─── Tutorial 2 & 3: sell screen ─────────────────────────────────────────────

let _strikeOptions = [];   // current week's options, referenced by selectStrike(i)

function beginSellScreenFor(tutorial) {
    const options = beginSellWeek();
    _strikeOptions = options;
    renderSellScreen(options);
    showScreen('screen-sell');
}

function renderSellScreen(options) {
    const names = { 2: 'Premium Income', 3: 'The Full Picture' };
    setText('sell-tutorial-num',  ts.tutorial);
    setText('sell-tutorial-name', names[ts.tutorial] || '');
    setText('sell-week-num',      ts.week);

    setText('sell-share-price-right', f$(ts.sharePrice));
    setText('sell-shares-value',      f$(ts.sharePrice * SHARE_COUNT));

    weekDots(ts.week, TOTAL_WEEKS, 'sell-week-dots');

    // Price chart
    const canvas = document.getElementById('sell-price-chart');
    if (canvas) {
        const closes = ts.ohlcHistory.map(d => d.close);
        drawPriceChart(canvas, ts.ohlcHistory, calcEMA(closes, 5));
    }

    // Strike table
    renderStrikeTable(options);

    // Reset premium preview
    const preview = document.getElementById('sell-premium-preview');
    if (preview) {
        preview.innerHTML = `
            <div style="font-size:12px;color:var(--text-tertiary);padding:12px 14px;
                text-align:center;border:1px dashed var(--border);border-radius:8px;margin-bottom:12px">
                Select a strike above to see the premium breakdown
            </div>`;
    }

    // Disable run button until selection made
    const runBtn = document.getElementById('sell-run-btn');
    if (runBtn) {
        runBtn.disabled = true;
        runBtn.onclick = runAndShowResults;
    }
}

function renderStrikeTable(options) {
    const typeClasses = {
        'ITM':       'type-itm',
        'ATM':       'type-atm',
        'Near OTM':  'type-near-otm',
        'Far OTM':   'type-far-otm',
        'Uncovered': 'type-uncovered',
    };

    const rows = options.map((o, i) => `
        <tr class="strike-row" data-index="${i}" onclick="selectStrike(${i})">
            <td><span class="strike-type-badge ${typeClasses[o.type] || ''}">${o.type}</span></td>
            <td class="mono" style="text-align:right">${o.strike !== null ? f$(o.strike) : '—'}</td>
            <td class="mono" style="text-align:right">${o.premium > 0 ? f$(o.premium) : '—'}</td>
            <td class="strike-note">${o.note}</td>
        </tr>`).join('');

    const el = document.getElementById('sell-strike-table');
    if (el) {
        el.innerHTML = `
            <table class="strike-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th style="text-align:right">Strike</th>
                        <th style="text-align:right">Premium</th>
                        <th>Note</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>`;
    }
}

function selectStrike(index) {
    const o = _strikeOptions[index];
    if (!o) return;

    // Highlight row
    document.querySelectorAll('#sell-strike-table .strike-row').forEach((row, i) => {
        row.classList.toggle('selected', i === index);
    });

    // Update state
    sellCall(o.strike);

    // Update premium preview
    const preview = document.getElementById('sell-premium-preview');
    if (!preview) return;

    if (o.strike === null) {
        // Uncovered
        preview.innerHTML = `
            <div class="preview-card" style="background:var(--purple-light);border-color:var(--purple-border);margin-bottom:12px">
                <div class="preview-row">
                    <span class="preview-label">No call sold</span>
                    <span class="preview-value mono" style="color:var(--purple)">Uncovered</span>
                </div>
                <div class="preview-row">
                    <span class="preview-label">Income this week</span>
                    <span class="preview-value mono">$0.00</span>
                </div>
                <div style="font-size:12px;color:var(--purple);margin-top:8px;line-height:1.5">
                    Full participation in share moves — no income, no upside cap.
                </div>
            </div>`;
    } else {
        const itmNote = o.strike < ts.sharePrice
            ? `<strong>ITM</strong>: $${o.intrinsic.toFixed(0)} is intrinsic — the call is already in-the-money. The remaining $${o.extrinsic.toFixed(0)} is time value.`
            : `<strong>OTM/ATM</strong>: all $${o.premium.toFixed(0)} is extrinsic (time value). If price stays below $${o.strike} at expiry, this decays to zero and you keep it all.`;

        preview.innerHTML = `
            <div class="preview-card" style="margin-bottom:12px">
                <div class="preview-row">
                    <span class="preview-label">Strike</span>
                    <span class="preview-value mono">${f$(o.strike)}</span>
                </div>
                <div class="preview-row">
                    <span class="preview-label">Total premium <span class="tooltip-trigger" onclick="showTip('premium',event)">?</span></span>
                    <span class="preview-value mono positive">+${f$(o.premium)}</span>
                </div>
                <div class="preview-row">
                    <span class="preview-label">Intrinsic <span class="tooltip-trigger" onclick="showTip('intrinsic',event)">?</span></span>
                    <span class="preview-value mono">${f$(o.intrinsic)}</span>
                </div>
                <div class="preview-row">
                    <span class="preview-label">Extrinsic <span class="tooltip-trigger" onclick="showTip('extrinsic',event)">?</span></span>
                    <span class="preview-value mono">${f$(o.extrinsic)}</span>
                </div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:10px;line-height:1.5">
                    ${itmNote}
                </div>
            </div>`;
    }

    // Enable run button
    const runBtn = document.getElementById('sell-run-btn');
    if (runBtn) runBtn.disabled = false;
}

// ─── Tutorial 2 & 3: results screen ──────────────────────────────────────────

function runAndShowResults() {
    const result = runWeek();
    renderResultsScreen(result);
    showScreen('screen-results');
}

function renderResultsScreen(r) {
    const names = { 2: 'Premium Income', 3: 'The Full Picture' };
    setText('results-tutorial-num',  ts.tutorial);
    setText('results-tutorial-name', names[ts.tutorial] || '');
    setText('results-week-num-topbar', `Week ${r.week} of 8`);
    setHTML('results-price-topbar', `<span class="mono">${f$(r.closePrice)}</span>`);

    weekDots(r.week, TOTAL_WEEKS, 'results-week-dots');

    // Outcome banner
    const banner = document.getElementById('results-banner');
    if (banner) {
        let cls, txt;
        if (r.wasUncovered) {
            const up = r.weekSharePnl >= 0;
            cls = up ? 'outcome-green' : 'outcome-red';
            txt = up
                ? `Uncovered — shares rose ${r.priceChangePct.toFixed(2)}%. Full upside, no premium.`
                : `Uncovered — shares fell ${Math.abs(r.priceChangePct).toFixed(2)}%. No premium to soften it.`;
        } else if (r.callExpiredITM) {
            cls = 'outcome-amber';
            txt = `Call went ITM at $${r.strike} — you owe $${r.intrinsicPaid.toFixed(0)} intrinsic. Premium of $${r.premium.toFixed(0)} offsets this.`;
        } else {
            cls = 'outcome-green';
            txt = `Call expired worthless — you keep the full $${r.premium.toFixed(0)} premium. Price stayed below $${r.strike}.`;
        }
        banner.className = `outcome-banner ${cls}`;
        banner.innerHTML = txt;
    }

    // Price move
    setText('results-open-price',  f$(r.openPrice));
    setText('results-close-price', f$(r.closePrice));
    setHTML('results-price-change', fmtChg(r.priceChangePct));

    // P&L breakdown table
    renderBreakdown(r);

    // Running totals
    setHTML('results-total-premium',   fmtPnl(r.totalPremium));
    setHTML('results-total-share-pnl', fmtPnl(r.totalSharePnl));
    setHTML('results-total-net',       fmtPnl(r.totalNetPnl));
    setText('results-portfolio-value', f$(r.portfolioValue));

    // Educational explanation
    renderExplanation(r);

    // Charts
    const priceCanvas = document.getElementById('results-price-chart');
    if (priceCanvas) {
        const closes = ts.ohlcHistory.map(d => d.close);
        drawPriceChart(priceCanvas, ts.ohlcHistory, calcEMA(closes, 5));
    }
    const pnlCanvas = document.getElementById('results-pnl-chart');
    if (pnlCanvas && ts.portfolioHistory.length > 1) {
        drawPnlChart(pnlCanvas, ts.portfolioHistory.slice(1), START_CAPITAL);
    }

    // Next/finish button
    const btn = document.getElementById('results-next-btn');
    if (btn) {
        if (r.week >= TOTAL_WEEKS) {
            btn.textContent = 'See summary →';
            btn.onclick = () => {
                completeTutorial();
                renderTutorialSummary();
                showScreen(`screen-t${ts.tutorial}-summary`);
            };
        } else {
            btn.textContent = 'Next week →';
            btn.onclick = () => beginSellScreenFor(ts.tutorial);
        }
    }
}

function renderBreakdown(r) {
    const el = document.getElementById('results-breakdown');
    if (!el) return;

    const shareStart = f$(r.openPrice * SHARE_COUNT);
    const shareEnd   = f$(r.closePrice * SHARE_COUNT);
    const sharePnlCls = r.weekSharePnl >= 0 ? 'positive' : 'negative';
    const sharePnlStr = (r.weekSharePnl >= 0 ? '+' : '−') + `$${Math.abs(r.weekSharePnl).toFixed(2)}`;

    let callRow = '';
    if (!r.wasUncovered) {
        const callPnlCls = r.weekCallPnl >= 0 ? 'positive' : 'negative';
        const callPnlStr = (r.weekCallPnl >= 0 ? '+' : '−') + `$${Math.abs(r.weekCallPnl).toFixed(2)}`;
        const startCell  = `+${f$(r.premium)} <span style="font-size:11px;color:var(--text-tertiary)">(collected)</span>`;
        const endCell    = r.callExpiredITM
            ? `−${f$(r.intrinsicPaid)} <span style="font-size:11px;color:var(--text-tertiary)">(ITM)</span>`
            : `$0.00 <span style="font-size:11px;color:var(--text-tertiary)">(worthless)</span>`;

        callRow = `
            <tr>
                <td>Short call ($${r.strike} strike)</td>
                <td class="mono">${startCell}</td>
                <td class="mono">${endCell}</td>
                <td class="mono ${callPnlCls}">${callPnlStr}</td>
            </tr>`;
    }

    const netCls = r.weekNetPnl >= 0 ? 'positive' : 'negative';
    const netStr = (r.weekNetPnl >= 0 ? '+' : '−') + `$${Math.abs(r.weekNetPnl).toFixed(2)}`;

    el.innerHTML = `
        <table class="breakdown-table">
            <thead>
                <tr>
                    <th>Position</th>
                    <th>Start of week</th>
                    <th>End / cost</th>
                    <th>P&L</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>100 shares of DEMO</td>
                    <td class="mono">${shareStart}</td>
                    <td class="mono">${shareEnd}</td>
                    <td class="mono ${sharePnlCls}">${sharePnlStr}</td>
                </tr>
                ${callRow}
                <tr class="net-row">
                    <td><strong>Net this week</strong></td>
                    <td class="mono"></td>
                    <td class="mono"></td>
                    <td class="mono ${netCls}"><strong>${netStr}</strong></td>
                </tr>
            </tbody>
        </table>`;
}

function renderExplanation(r) {
    const el = document.getElementById('results-explanation');
    if (!el) return;

    let text = '';

    if (ts.tutorial === 2) {
        // Bear market — price always falls
        if (r.callExpiredITM) {
            // Possible with ITM strike (price fell but not past the ITM strike)
            text = `The price fell, but your ${r.strike} strike was already in-the-money — the call is still ITM at expiry. You owe $${r.intrinsicPaid.toFixed(0)}. But you collected $${r.premium.toFixed(0)} up front, so the net call P&L is $${r.weekCallPnl.toFixed(0)}.`;
        } else {
            text = `Price fell $${Math.abs(r.weekSharePnl / SHARE_COUNT).toFixed(2)}/share — shares lost $${Math.abs(r.weekSharePnl).toFixed(0)}. But your call expired worthless and you keep the full $${r.premium.toFixed(0)} premium. That extrinsic value decayed to zero at expiry — that's theta working for you.`;
        }
    } else {
        // T3 — mixed market
        if (r.wasUncovered) {
            text = r.weekSharePnl >= 0
                ? `You went uncovered. The market went up — full share upside, no premium to show for it. Sometimes going uncovered is the right call.`
                : `You went uncovered. The market went down — full share loss, no premium buffer. This is the cost of skipping the call.`;
        } else if (r.callExpiredITM) {
            text = `Price rallied past your $${r.strike} strike. The call went ITM — you owed $${r.intrinsicPaid.toFixed(0)} at expiry. You still kept the $${r.premium.toFixed(0)} premium you collected. Net call result: $${r.weekCallPnl.toFixed(0)}. Your upside was capped at $${r.strike}/share.`;
        } else {
            text = `Price stayed below your $${r.strike} strike. The call expired worthless — the $${r.premium.toFixed(0)} extrinsic value decayed to zero at expiry. You keep it all. This is what covered call sellers are betting on every week.`;
        }
    }

    el.innerHTML = `
        <div class="card" style="background:var(--accent-light);border-color:#B8D6F5;margin-top:0">
            <div class="card-title" style="color:var(--accent-dark)">What happened</div>
            <p style="font-size:13px;color:var(--accent-dark);line-height:1.6">${text}</p>
        </div>`;
}

// ─── Tutorial summaries ───────────────────────────────────────────────────────

function renderTutorialSummary() {
    const n = ts.tutorial;
    const s = getSummaryStats();

    setText(`t${n}-sum-final`, f$(s.portfolioValue));
    setHTML(`t${n}-sum-return`, fmtPnl(s.totalReturn));
    setHTML(`t${n}-sum-pct`,    fmtPct(s.returnPct));

    if (n >= 2) {
        setHTML(`t${n}-sum-premium`,  fmtPnl(s.totalPremium));
        setHTML(`t${n}-sum-share-pnl`, fmtPnl(s.totalSharePnl));
        if (n === 3) {
            const winRate = Math.round((s.weekWins / TOTAL_WEEKS) * 100);
            setHTML('t3-sum-winrate', `<span class="mono">${s.weekWins}/${TOTAL_WEEKS} weeks (${winRate}%)</span>`);
        }
    }

    const canvas = document.getElementById(`t${n}-sum-chart`);
    if (canvas && s.portfolioHistory.length > 1) {
        drawPnlChart(canvas, s.portfolioHistory.slice(1), START_CAPITAL);
    }
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────

const TIPS = {
    premium:   'The price you receive when selling the call. Equal to intrinsic + extrinsic value. You collect it immediately and keep it regardless of what happens at expiry.',
    intrinsic: 'How far in-the-money the strike is × 100 shares. A $98 call when stock is at $100 has $200 intrinsic. If the call expires ITM you owe this back.',
    extrinsic: 'The time and volatility component of the premium. Always decays to zero at expiry — this is your income as a covered call seller. Also called theta or time value.',
    itm:       'In-the-money: the call strike is below the current price. ITM calls have intrinsic value and are more expensive.',
    otm:       'Out-of-the-money: the call strike is above the current price. OTM calls have only extrinsic (time) value.',
    atm:       'At-the-money: the call strike equals the current price. ATM calls have maximum extrinsic value.',
    theta:     'The daily erosion of an option\'s time value. As a seller, theta works in your favour — the option loses value every day.',
};

let _activeTip = null;

function showTip(key, e) {
    e.stopPropagation();
    if (_activeTip) { _activeTip.remove(); _activeTip = null; }
    const text = TIPS[key];
    if (!text) return;

    const tip = document.createElement('div');
    tip.className = 'tooltip-bubble';
    tip.style.cssText = 'position:absolute;z-index:500;max-width:260px;left:0;top:24px;';
    tip.textContent = text;

    const parent = e.currentTarget.parentNode;
    parent.style.position = 'relative';
    parent.appendChild(tip);
    _activeTip = tip;

    setTimeout(() => {
        document.addEventListener('click', () => {
            if (_activeTip) { _activeTip.remove(); _activeTip = null; }
        }, { once: true });
    }, 0);
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function setHTML(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = val;
}

// ─── Covered call payoff diagram ─────────────────────────────────────────────

function drawCoveredCallDiagram(canvas) {
    if (!canvas) return;
    if (canvas.offsetWidth > 0) canvas.width = canvas.offsetWidth;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Scenario: 100 shares bought at $100, ATM $100 call sold for $162
    const PURCHASE = 100, STRIKE = 100, PREMIUM = 162, SHARES = 100;
    const P_MIN = 84, P_MAX = 118;
    const PNL_MIN = -1800, PNL_MAX = 700;

    const pad = { top: 16, bottom: 38, left: 58, right: 110 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;

    const xOf = p   => pad.left + (p - P_MIN)   / (P_MAX - P_MIN)   * cW;
    const yOf = pnl => pad.top  + cH - (pnl - PNL_MIN) / (PNL_MAX - PNL_MIN) * cH;

    const xStrike = xOf(STRIKE);
    const y0      = yOf(0);

    // ── Zero line ────────────────────────────────────────────────────────────
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#e4e4e4';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, y0); ctx.lineTo(pad.left + cW, y0); ctx.stroke();

    // ── Strike vertical line ─────────────────────────────────────────────────
    ctx.strokeStyle = '#e4e4e4';
    ctx.beginPath(); ctx.moveTo(xStrike, pad.top); ctx.lineTo(xStrike, pad.top + cH); ctx.stroke();
    ctx.setLineDash([]);

    // ── Shaded zones ─────────────────────────────────────────────────────────
    // Red zone above strike: upside the covered call seller gives up
    const xMax = xOf(P_MAX);
    ctx.fillStyle = 'rgba(163,45,45,0.06)';
    ctx.beginPath();
    ctx.moveTo(xStrike, yOf(PREMIUM));
    ctx.lineTo(xMax,    yOf(PREMIUM));
    ctx.lineTo(xMax,    yOf((P_MAX - PURCHASE) * SHARES));
    ctx.lineTo(xStrike, yOf((STRIKE - PURCHASE) * SHARES));
    ctx.closePath();
    ctx.fill();

    // Blue zone below strike: premium buffer over shares-only
    const xMin = xOf(P_MIN);
    ctx.fillStyle = 'rgba(55,138,221,0.07)';
    ctx.beginPath();
    ctx.moveTo(xMin,    yOf((P_MIN - PURCHASE) * SHARES + PREMIUM));
    ctx.lineTo(xStrike, yOf(PREMIUM));
    ctx.lineTo(xStrike, yOf((STRIKE - PURCHASE) * SHARES));
    ctx.lineTo(xMin,    yOf((P_MIN - PURCHASE) * SHARES));
    ctx.closePath();
    ctx.fill();

    // ── Y-axis labels ─────────────────────────────────────────────────────────
    ctx.font = '10px IBM Plex Mono, monospace';
    ctx.fillStyle = '#bbb';
    ctx.textAlign = 'right';
    [[-1500, '-$1,500'], [-500, '-$500'], [0, '$0'], [500, '+$500']].forEach(([v, lbl]) => {
        const y = yOf(v);
        if (y >= pad.top && y <= pad.top + cH) ctx.fillText(lbl, pad.left - 6, y + 3);
    });

    // Y axis spine
    ctx.beginPath(); ctx.strokeStyle = '#e4e4e4'; ctx.lineWidth = 1;
    ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + cH); ctx.stroke();

    // ── X-axis labels ─────────────────────────────────────────────────────────
    ctx.fillStyle = '#bbb';
    ctx.textAlign = 'center';
    [85, 90, 95, 100, 105, 110, 115].forEach(p => {
        const x = xOf(p);
        if (x >= pad.left && x <= pad.left + cW) {
            ctx.fillText(`$${p}`, x, pad.top + cH + 14);
        }
    });
    ctx.fillStyle = '#ccc';
    ctx.font = '10px IBM Plex Sans, sans-serif';
    ctx.fillText('Stock price at expiry', pad.left + cW / 2, pad.top + cH + 28);

    // Clip subsequent drawing to chart area so lines don't overflow
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.left - 1, pad.top - 1, cW + 2, cH + 2);
    ctx.clip();

    // ── Shares-only line (grey, dashed) ───────────────────────────────────────
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xOf(P_MIN), yOf((P_MIN - PURCHASE) * SHARES));
    ctx.lineTo(xOf(P_MAX), yOf((P_MAX - PURCHASE) * SHARES));
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Covered call line (blue, solid) ───────────────────────────────────────
    ctx.strokeStyle = '#378ADD';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xOf(P_MIN), yOf((P_MIN - PURCHASE) * SHARES + PREMIUM));
    ctx.lineTo(xStrike,    yOf(PREMIUM));   // below strike: same slope, shifted up
    ctx.lineTo(xOf(P_MAX), yOf(PREMIUM));   // above strike: flat
    ctx.stroke();

    ctx.restore(); // end clip

    // Kink dot at strike
    ctx.beginPath();
    ctx.fillStyle = '#378ADD';
    ctx.arc(xStrike, yOf(PREMIUM), 4, 0, Math.PI * 2);
    ctx.fill();

    // Breakeven dot (where covered call crosses zero)
    const breakeven = PURCHASE - PREMIUM / SHARES;  // $98.38
    ctx.beginPath();
    ctx.fillStyle = '#378ADD';
    ctx.arc(xOf(breakeven), y0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '9px IBM Plex Mono, monospace';
    ctx.fillStyle = '#378ADD';
    ctx.textAlign = 'center';
    ctx.fillText(`BE $${breakeven.toFixed(2)}`, xOf(breakeven), y0 - 8);

    // ── Right-side labels ─────────────────────────────────────────────────────
    const lx = pad.left + cW + 10;
    ctx.textAlign = 'left';

    // Covered call label (at the flat portion)
    ctx.font = '12px IBM Plex Sans, sans-serif';
    ctx.fillStyle = '#378ADD';
    ctx.fillText('Covered call', lx, yOf(PREMIUM) + 4);
    ctx.font = '10px IBM Plex Mono, monospace';
    ctx.fillText('max +$162', lx, yOf(PREMIUM) + 17);

    // "Shares only" label inside chart at a safe visible position (~$92 area)
    const sharesLabelP = 92;
    const sharesLabelY = yOf((sharesLabelP - PURCHASE) * SHARES);
    ctx.font = '11px IBM Plex Sans, sans-serif';
    ctx.fillStyle = '#bbb';
    ctx.textAlign = 'left';
    ctx.fillText('Shares only', xOf(sharesLabelP) + 4, sharesLabelY - 6);

    // ── Annotation labels inside chart ────────────────────────────────────────
    // "Capped upside" label in red zone (midpoint above strike)
    const midAboveX = (xStrike + xOf(Math.min(P_MAX, 112))) / 2;
    ctx.font = '10px IBM Plex Sans, sans-serif';
    ctx.fillStyle = 'rgba(163,45,45,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('Upside capped', midAboveX, yOf(PREMIUM) - 18);

    // "Premium buffer" label in blue zone
    const midBelowX = (xOf(P_MIN) + xStrike) / 2;
    ctx.fillStyle = 'rgba(55,138,221,0.55)';
    ctx.fillText('+$162 buffer', midBelowX, yOf(-600));

    // Strike price label at top of vertical line
    ctx.fillStyle = '#aaa';
    ctx.font = '10px IBM Plex Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('$100 strike', xStrike, pad.top + 11);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    renderHome();
    drawCoveredCallDiagram(document.getElementById('home-diagram'));
});
