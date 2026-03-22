# 🐢 Turtle Trade Tracker v2.0

A web-based trade tracker for LEAPS + Short Call (Poor Man's Covered Call) strategies with **Alpha Vantage integration** for live price data.

---

## Quick Start

### 1. Open the Tracker
Double-click `index.html` or:
```bash
open turtle-tracker/index.html  # macOS
```

### 2. Import Your Trades (Choose One Method)

#### Method A: CSV Import (Easiest)
1. Go to **Data / API** tab
2. Copy the contents of `your-trades.csv` (or your own CSV)
3. Paste into the **"Import from TastyTrade CSV"** box
4. Click **[ Import CSV ]**

**CSV Format:**
```csv
Date,Action,Symbol,Strike,Expiration,StockPrice,Premium,Notes
2025-01-09,STO,IWM,263,2025-01-16,220.0,139,Initial call
2025-01-15,BTC,IWM,263,2025-01-16,222.0,230,Rolled to 269
2025-01-15,STO,IWM,269,2025-01-23,222.0,230,Rolled up
2025-01-23,EXP,IWM,269,2025-01-23,224.0,0,Expired worthless
```

**Actions:**
- `BTO` = Buy LEAPS (Buy To Open)
- `STO` = Sell call (Sell To Open)  
- `BTC` = Buy back call (Buy To Close)
- `EXP` = Expired worthless

#### Method B: JSON Import
Paste the contents of `your-trades-import.json` into the JSON box.

### 3. Fetch Live IWM Price
1. API key is pre-configured
2. Click **[🔄 Refresh IWM Price]** on dashboard
3. Current price appears in header

---

## How Import Works

### CSV Import Logic
The parser reads your CSV and:

1. **BTO rows** → Creates LEAPS position
2. **STO rows** → Opens new short call
3. **BTC rows** → Closes matching open call (same strike)
4. **EXP rows** → Closes call with $0 buyback

**Important:** The CSV needs actual buyback costs, not net amounts. If your tastytrade CSV shows net credits for rolls, you'll need to break them out:

```
❌ Wrong (net):
2025-01-15,STO,IWM,269,2025-01-23,222.0,-91,Rolled 263→269

✅ Correct (individual legs):
2025-01-15,BTC,IWM,263,2025-01-16,222.0,230,Bought back 263
2025-01-15,STO,IWM,269,2025-01-23,222.0,139,Sold 269
```

---

## Understanding Your Numbers

You mentioned: **$1,458 total credits, with $450 still open**

This means:
```
Realized P&L:   $1,458 - $450 = $1,008
Unrealized:     $450 (current $249 call)
```

If that's the case, update `your-trades.csv` with your actual buyback costs:

```csv
2025-01-15,BTC,IWM,263,2025-01-16,222.0,ACTUAL_BUYBACK_COST,Rolled
```

---

## Tabs Explained

| Tab | Purpose |
|-----|---------|
| **Dashboard** | Combined strategy P&L (calls + LEAPS) |
| **LEAPS Tracker** | Log LEAPS value over time with IWM price |
| **Short Calls** | Weekly call history with P&L per trade |
| **Combined P&L** | Week-by-week analysis of both legs |
| **Data / API** | Import/export, API configuration |

---

## Daily/Weekly Workflow

1. **Check IWM price**: Click refresh button
2. **Log LEAPS value**: LEAPS Tracker → [+ Log LEAPS Value]
   - IWM price: Auto-filled from API
   - LEAPS value: Enter from tastytrade/broker
3. **Review combined P&L**: See total strategy performance

---

## Alpha Vantage API

**Pre-configured with your key**: `VAD1Q74JGQ6JTG42`

**Free tier limits:** 25 calls/day
- Fetch IWM price: 1 call
- Fetch historical: 1 call
- That's plenty for daily/weekly tracking

**Alpha Vantage does NOT have options data** (free tier), so you'll enter LEAPS values manually.

---

## Your Current Situation

From the import file:

| Metric | Value |
|--------|-------|
| LEAPS Cost | $7,745 |
| LEAPS Current | $6,900 |
| **LEAPS Unrealized** | **-$845** |
| Short Call Net | ~-$75 (estimated) |
| **Combined P&L** | **-$920** |

**But you said credits = $1,458** - update the CSV with actual buyback costs and re-import!

---

## Tips

1. **Update the CSV** with your actual buyback costs
2. **Re-import** to get accurate P&L
3. **Log LEAPS value weekly** - use your broker's mark
4. **Check Combined P&L** - that's your true performance
5. **Export monthly** - keep backups

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Import fails | Check CSV format matches template |
| Wrong P&L | Verify buyback costs in CSV are actual amounts, not net |
| API not working | Key is pre-configured; check browser console for errors |
| LEAPS value wrong | Update in LEAPS Tracker tab |
