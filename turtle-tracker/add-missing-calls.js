// Paste into the browser console on the tracker page (turtle-tracker-six.vercel.app).
// Appends IBKR weeks 13-15 (from the IBKR Trade Confirmation, Sep 1 - Oct 8 2026) to the
// open IBKR $250 LEAPS. Amounts are gross for 2 contracts, matching the existing rows.
// Idempotent: a call with the same strike + open date is skipped. Does not touch anything else.
(() => {
  const leaps = portfolio.leaps.find(l => l.accountName === 'IBKR' && l.strike === 250 && l.status !== 'closed');
  if (!leaps) { console.error('IBKR $250 LEAPS not found - nothing changed'); return; }
  const rows = [
    { strike: 285, expiration: '2026-09-25', openDate: '2026-09-21', openPremium: 510, closeDate: '2026-09-24', closePremium: 14 },
    { strike: 280, expiration: '2026-10-02', openDate: '2026-09-24', openPremium: 730, closeDate: '2026-10-02', closePremium: 360 },
    { strike: 281, expiration: '2026-10-09', openDate: '2026-10-02', openPremium: 600, closeDate: '2026-10-07', closePremium: 70 },
  ];
  let added = 0;
  rows.forEach((r, i) => {
    const dup = portfolio.calls.some(c => c.parentLeapsId === leaps.id && c.strike === r.strike && c.openDate === r.openDate);
    if (dup) { console.log('skip (already there):', r.strike, r.openDate); return; }
    portfolio.calls.push({
      id: 'CALL_' + (Date.now() + i), type: 'SHORT_CALL', parentLeapsId: leaps.id, symbol: 'IWM',
      strike: r.strike, expiration: r.expiration, openDate: r.openDate, openStockPrice: 0,
      openPremium: r.openPremium, closeDate: r.closeDate, closePremium: r.closePremium, status: 'closed',
    });
    added++;
  });
  saveData(); updateDisplay();
  console.log(`Added ${added} call(s) to ${leaps.id}`);
})();
