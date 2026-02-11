# 🐢 Turtle Trading Game

An educational trading simulator for learning the Turtle Strategy (LEAPS + weekly covered calls).

## 🎮 Try It Live

**Minimal Game:** [Deploy to get URL]

## 🚀 Quick Start

### Play the Minimal Game Locally

Open `turtle-game/minimal-game.html` in your browser. No build required!

```bash
open turtle-game/minimal-game.html
```

### Run the Full TypeScript Game (In Development)

```bash
cd turtle-game
npm install
npm run dev
```

## ✨ What's Working

- **Minimal Game** (`turtle-game/minimal-game.html`)
  - Complete standalone HTML game
  - Validated pricing engine (7.8% error vs real market data)
  - Multi-week rolling with LEAPS + weekly calls
  - Historical context candles
  - Black & white candlestick charts
  - Full P&L breakdown

- **Pricing Models**
  - Python reference implementation (`simplified_trading_simulator.py`)
  - TypeScript implementation (`turtle-game/src/lib/pricing/simplifiedPricing.ts`)
  - Both match exactly

## 📚 Documentation

- `CONTEXT.md` - Current session summary and progress
- `turtle-spec.md` - Full game specification (4 phases)
- `START_FRESH.md` - Previous session context

## 🎯 Roadmap

See the task list for detailed development plan:

### Phase 1: Foundation (Current)
- [x] Validated pricing engine
- [x] Minimal working game
- [x] Historical context candles

### Phase 2: Tutorial Mode (Next)
- [ ] Tutorial 1: Shares vs LEAPS
- [ ] Tutorial 2: Introducing Weekly Calls
- [ ] Tutorial 3: Time and Moneyness
- [ ] Tutorial 4: Capital Deployment

### Phase 3-6: Coming Soon
- Demonstration Scenarios
- Challenge Modes
- Free Play Mode
- Polish & Features

## 🧪 Testing

### Python Tests
```bash
python3 simplified_trading_simulator.py
python3 test_short_call_expiry.py
python3 test_weekly_call_pricing.py
```

### TypeScript Tests
```bash
cd turtle-game
npx tsx src/lib/pricing/testSimplifiedPricing.ts
npx tsx src/lib/pricing/testShortCallExpiry.ts
```

## 🛠 Tech Stack

- **Frontend:** TypeScript + Vite
- **Styling:** Tailwind CSS
- **Charts:** Canvas API (minimal game), lightweight-charts (full game)
- **State:** Plain TypeScript objects (for now)

## 📊 Pricing Model

Simplified educational model (not Black-Scholes):
- Base extrinsic: $450 (7 DTE ATM)
- Refined moneyness curve for $1 strike increments
- Simple delta/theta calculations
- 7.8% average error vs real SPY options data

## 🤝 Contributing

This is an educational project. Feedback welcome!

## 📝 License

MIT

---

Built with Claude Code ⚡
