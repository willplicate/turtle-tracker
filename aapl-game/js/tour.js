// js/tour.js — Giorgio's guided walkthrough of the Setup and Sell-call screens.
// Pure DOM overlay: no dependency on engine/game-state internals, just CSS selectors.

(function () {
    const TOURS = {
        'screen-setup': [
            {
                targets: ['#capital-input', '.preset-group', '#session-preview-top', '#estimated-shares-cost-card'],
                text: "Let's start here — this is how much cash you're bringing to the table. Type an amount or tap a preset. Everything you set on the left shows up here on the right, live — watch this capital number, and the estimated shares cost below it, update as you change it."
            },
            {
                targets: ['#prev-scenario'],
                text: "This is your trading window — a random 52-week stretch pulled from three years of real AAPL price history. It really happened, but which 52 weeks you get is random. Reset the game and you'll land in a different stretch."
            },
            {
                targets: ['.position-type-btn', '#leaps-est-cost', '#leaps-est-pct', '#allocation-bar-fill', '#leaps-est-remaining'],
                text: "Pick your position: buy 100 real AAPL shares outright, or use a LEAPS — a long-dated call option — for a leveraged Poor Man's Covered Call. Either way, you'll sell a weekly call against it. Switch it here and watch this box update too — it shows how much of your account the position eats up, and what's left in reserve, so keep enough cash spare to manage the trade if things move against you."
            },
            {
                targets: ['.pricing-btn:not(.position-type-btn)'],
                text: "For basic mode, just leave these as they are. Eventually, if you want a day-by-day account, you can switch to daily mode."
            },
            {
                targets: ['#income-withdrawal-section'],
                text: "If you want to try out automatically withdrawing income to see how that affects your balance, choose a weekly withdrawal amount. You can switch it off during the game."
            }
        ],
        'screen-leaps': () => (typeof state !== 'undefined' && state.positionType === 'leaps') ? [
            {
                targets: ['#itm-section', '#leaps-prev-delta-theta-rows'],
                text: "The deeper in the money your call is, the more you have to spend upfront. Deeper ITM also means more delta — closer to owning 100 shares — and this shows the amount per $ move your LEAPS value will increase, minus the theta cost for the week."
            },
            {
                targets: ['#dte-section', '#leaps-prev-expiry-row', '#leaps-prev-cost-total-rows'],
                text: "Choose a DTE and watch the price move — more time until expiry costs more upfront, but decays slower."
            },
            {
                targets: ['#contracts-field-label', '#contracts-display', '#contracts-slider', '#leaps-capital-allocation-card'],
                text: "Slide the number of contracts to see how much of your account is going to be allocated."
            }
        ] : [
            {
                targets: ['#contracts-field-label', '#contracts-display', '#contracts-slider'],
                text: "If you select shares, this is how you control how many you buy, in multiples of 100."
            }
        ],
        'screen-sell': [
            {
                targets: ['#price-chart'],
                text: "This is your trading floor for the week — AAPL's price chart, drawn from the same real historical window your game picked."
            },
            {
                targets: ['#vix-chart', '#regime-badge'],
                text: "The volatility read and the regime badge tell you how nervous the market is right now. Higher volatility means fatter option premiums, but bigger, faster moves too."
            },
            {
                targets: ['#regime-badge'],
                text: "Here is where you can tell the IV Rank. Higher = better premiums but more stock movement."
            },
            {
                targets: ['.strike-table'],
                text: "Pick your strike here. Each row is a different call you could sell against your position — further from the price means less premium but a safer cushion."
            },
            {
                targets: ['.strike-table tbody tr:last-child', '#btn-run-week', '#btn-sell-reset'],
                text: "When you've selected your strike (remember you can go uncovered), click \"Run this week.\""
            },
            {
                targets: ['#pos-strike-row', '#pos-total', '#pos-cash'],
                text: "Your position panel is your scoreboard for the week: your long position's value, cash reserve, and total account."
            },
            {
                targets: ['#total-premium', '#leaps-pnl-total', '#win-rate'],
                text: "Running totals for the whole game live down here — premium collected, P&L, and your win rate so far."
            }
        ],
        'screen-results': [
            {
                targets: ['.price-action-row'],
                text: "This shows you how much the stock moved this week."
            },
            {
                targets: ['.breakdown-table'],
                text: "P&L will show the breakdown of P&L by underlying shares or LEAPS, and the P&L of the short calls."
            },
            {
                targets: ['#res-day-log'],
                text: "This is the day-by-day breakdown of P&L."
            },
            {
                targets: ['#res-capital-position-section'],
                text: "This shows how much your shares or LEAPS are worth now, how much cash you have, and your total. Pay attention to cash because you need it to roll down or make withdrawals."
            },
            {
                targets: ['#res-market-comparison-section'],
                text: "This compares buy and hold to selling calls."
            },
            {
                targets: ['#withdrawal-stats-card'],
                text: "Adjust the income you want to withdraw here, or turn it on/off using the Active button."
            }
        ]
    };

    const SEEN_KEY_PREFIX = 'aapl_tour_seen_';

    const root = document.getElementById('tour-root');
    const scrim = document.getElementById('tour-scrim');
    const textEl = document.getElementById('tour-text');
    const dotsEl = document.getElementById('tour-dots');
    const btnNext = document.getElementById('tour-next');
    const btnBack = document.getElementById('tour-back');
    const btnSkip = document.getElementById('tour-skip');
    const btnHowItWorks = document.getElementById('btn-how-it-works');

    if (!root) return;

    let activeSteps = null;
    let activeScreenId = null;
    let activeIndex = 0;
    let spotlightEls = [];
    let repositionHandler = null;

    function clearSpotlights() {
        spotlightEls.forEach(el => el.remove());
        spotlightEls = [];
        scrim.style.clipPath = '';
    }

    // Merge rects that touch, overlap, or sit within `gap` of each other into
    // their bounding union, so a stack of adjacent controls (e.g. a label,
    // its live value, and a slider right below it) reads as one continuous
    // highlight instead of separate boxes with a dimmed stripe between them.
    function mergeCloseRects(rects, gap) {
        const merged = rects.slice();
        let changed = true;
        while (changed) {
            changed = false;
            outer:
            for (let i = 0; i < merged.length; i++) {
                for (let j = i + 1; j < merged.length; j++) {
                    const a = merged[i], b = merged[j];
                    const ax0 = a.left - gap, ay0 = a.top - gap;
                    const ax1 = a.left + a.width + gap, ay1 = a.top + a.height + gap;
                    const bx0 = b.left, by0 = b.top;
                    const bx1 = b.left + b.width, by1 = b.top + b.height;
                    const overlaps = !(bx0 > ax1 || bx1 < ax0 || by0 > ay1 || by1 < ay0);
                    if (overlaps) {
                        const left = Math.min(a.left, b.left);
                        const top = Math.min(a.top, b.top);
                        const right = Math.max(a.left + a.width, b.left + b.width);
                        const bottom = Math.max(a.top + a.height, b.top + b.height);
                        merged.splice(j, 1);
                        merged.splice(i, 1);
                        merged.push({ left, top, width: right - left, height: bottom - top });
                        changed = true;
                        break outer;
                    }
                }
            }
        }
        return merged;
    }

    function positionSpotlights(step) {
        clearSpotlights();
        const pad = 8;
        let rects = [];
        step.targets.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.width === 0 && r.height === 0) return;
                rects.push({
                    left: r.left - pad,
                    top: r.top - pad,
                    width: r.width + pad * 2,
                    height: r.height + pad * 2
                });
            });
        });
        rects = mergeCloseRects(rects, 12);

        // Punch real holes in the scrim via clip-path (evenodd) so the
        // highlighted control(s) stay genuinely clickable/typable — clipped-away
        // area doesn't receive pointer events, unlike a masked/overlaid element.
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let path = `M0,0 L${vw},0 L${vw},${vh} L0,${vh} Z`;
        rects.forEach(r => {
            const x0 = r.left, y0 = r.top, x1 = r.left + r.width, y1 = r.top + r.height;
            path += ` M${x0},${y0} L${x1},${y0} L${x1},${y1} L${x0},${y1} Z`;
        });
        scrim.style.clipPath = `path(evenodd, "${path}")`;

        // Visual ring around each hole — border only, no fill/shadow, so
        // adjacent highlights never darken each other.
        rects.forEach(r => {
            const box = document.createElement('div');
            box.className = 'tour-spotlight';
            box.style.left = r.left + 'px';
            box.style.top = r.top + 'px';
            box.style.width = r.width + 'px';
            box.style.height = r.height + 'px';
            root.appendChild(box);
            spotlightEls.push(box);
        });
    }

    function renderDots() {
        dotsEl.innerHTML = '';
        activeSteps.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'tour-dot' + (i === activeIndex ? ' active' : '');
            dotsEl.appendChild(dot);
        });
    }

    function showStep(index) {
        activeIndex = index;
        const step = activeSteps[index];
        textEl.textContent = step.text;
        renderDots();
        btnBack.style.visibility = index === 0 ? 'hidden' : 'visible';
        btnNext.textContent = index === activeSteps.length - 1 ? 'Got it' : 'Next';

        // Scroll using the middle target selector so multi-target steps that span
        // a range (e.g. a table row plus buttons below it) end up centered rather
        // than anchored to just the first element.
        const midSelector = step.targets[Math.floor((step.targets.length - 1) / 2)];
        const scrollTarget = document.querySelector(midSelector);
        if (scrollTarget) {
            scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        positionSpotlights(step);
    }

    function getSteps(screenId) {
        const entry = TOURS[screenId];
        return typeof entry === 'function' ? entry() : entry;
    }

    function startTour(screenId) {
        const steps = getSteps(screenId);
        if (!steps || !steps.length) return;
        activeSteps = steps;
        activeScreenId = screenId;
        root.hidden = false;
        document.addEventListener('keydown', onKeydown);
        repositionHandler = () => positionSpotlights(activeSteps[activeIndex]);
        window.addEventListener('scroll', repositionHandler, true);
        window.addEventListener('resize', repositionHandler);
        showStep(0);
        localStorage.setItem(SEEN_KEY_PREFIX + screenId, '1');
    }

    function endTour() {
        activeSteps = null;
        activeScreenId = null;
        root.hidden = true;
        clearSpotlights();
        document.removeEventListener('keydown', onKeydown);
        if (repositionHandler) {
            window.removeEventListener('scroll', repositionHandler, true);
            window.removeEventListener('resize', repositionHandler);
            repositionHandler = null;
        }
    }

    function onKeydown(e) {
        if (e.key === 'Escape') endTour();
        if (e.key === 'ArrowRight') btnNext.click();
        if (e.key === 'ArrowLeft' && activeIndex > 0) btnBack.click();
    }

    btnNext.addEventListener('click', () => {
        if (activeIndex >= activeSteps.length - 1) {
            endTour();
        } else {
            showStep(activeIndex + 1);
        }
    });

    btnBack.addEventListener('click', () => {
        if (activeIndex > 0) showStep(activeIndex - 1);
    });

    btnSkip.addEventListener('click', endTour);
    scrim.addEventListener('click', () => {}); // absorb clicks, don't dismiss accidentally

    if (btnHowItWorks) {
        btnHowItWorks.addEventListener('click', () => {
            const activeScreen = document.querySelector('.screen.active');
            const steps = activeScreen && getSteps(activeScreen.id);
            if (steps && steps.length) {
                startTour(activeScreen.id);
            }
        });
    }

    // Auto-launch the walkthrough the first time a player lands on a tour-covered screen.
    const observedScreens = document.querySelectorAll('.screen');
    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            const el = m.target;
            if (!el.classList.contains('active')) return;

            // The player advanced past the tour's own screen (e.g. clicking
            // "Run this week" while a step's control was still live) — the open
            // tour is now showing stale steps for a screen that's no longer
            // visible, so close it rather than leave it stranded.
            if (activeSteps && el.id !== activeScreenId) {
                endTour();
            }

            const steps = getSteps(el.id);
            if (steps && steps.length) {
                const seenKey = SEEN_KEY_PREFIX + el.id;
                if (!localStorage.getItem(seenKey) && !activeSteps) {
                    setTimeout(() => startTour(el.id), 300);
                }
            }
        });
    });
    observedScreens.forEach(el => {
        observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    });

    // If Setup is already the active screen on load, offer the tour too.
    document.addEventListener('DOMContentLoaded', () => {
        const setupScreen = document.getElementById('screen-setup');
        if (setupScreen && setupScreen.classList.contains('active') && !localStorage.getItem(SEEN_KEY_PREFIX + 'screen-setup')) {
            setTimeout(() => startTour('screen-setup'), 500);
        }
    });
})();
