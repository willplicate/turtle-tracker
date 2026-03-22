# 🐢 Turtle Trading - Compact Game

A streamlined, single-screen version of the Turtle Trading game with all information visible at once.

## 🎮 Try It

Open `index.html` in your browser:

```bash
open compact-game/index.html
```

## ✨ Features

### Single-Screen Layout
- **Left Panel**: Live options chain with bid/ask/strike prices
- **Center Panel**: Full-size candlestick chart with price history
- **Right Panel**: Position cards for LEAPS and Short Call + Weekly P&L
- **Header**: Account value, weekly P&L, and week counter

### Dark Theme
- Professional trading aesthetic with dark background
- Green for positive / Red for negative
- Easy on the eyes for extended play sessions

### Game Flow
1. Click "Start Trading" to begin
2. LEAPS position auto-opens (like the minimal game)
3. Click a strike in the options chain to select
4. Click the main action button to sell the call
5. Click "Run Week" to simulate price movement
6. Review results and continue to next week

### Visual Indicators
- **Options Chain**: Red = ITM strikes, Green = OTM strikes
- **Position Cards**: Green badge = open, Gray badge = closed
- **P&L**: Real-time color-coded profit/loss
- **Chart**: Historical candles (dimmed) + Game candles (bright)

## 🎯 Comparison to Minimal Game

| Feature | Minimal Game | Compact Game |
|---------|--------------|--------------|
| Layout | Multi-step screens | Single dashboard |
| Options Selection | Radio buttons | Clickable chain |
| Chart Size | Medium | Large (main focus) |
| Position Visibility | One at a time | Always visible |
| Theme | Black & white | Dark professional |
| Mobile Friendly | Yes | Desktop optimized |

## 📁 File Structure

```
compact-game/
└── index.html          # Complete game in single file
```

## 🔧 Technical Details

- **Same pricing engine** as the minimal game (validated vs real market)
- **Canvas-based charting** for performance
- **Pure vanilla JavaScript** - no dependencies
- **Responsive grid layout** using CSS Grid

## 🚀 Future Enhancements

- [ ] LEAPS rolling interface (slider for strike/DTE)
- [ ] VIX simulation (affects pricing)
- [ ] Multiple LEAPS positions
- [ ] Historical scenario playback
- [ ] Export trade log to CSV
