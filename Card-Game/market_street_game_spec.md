# Market Street — Game Spec for Claude Code

## Overview

A 2-4 player browser-based card and dice game teaching options trading strategy through the analogy of market traders selling vegetables. Players manage a market stall (their "anchor" — equivalent to a LEAPS position) and make weekly deals (equivalent to selling covered calls) while navigating changing weather (market regimes).

The game runs entirely in a single HTML file with embedded CSS and JS. No backend required. Designed for iPad (touch-friendly, min 768px width). 

---

## Aesthetic Direction

**Style:** 8-bit Farmville. Think early Facebook Farmville meets Game Boy Color.

**Font:** Press Start 2P (Google Fonts) — use throughout for all text.

**Colour palette (strict 8-bit):**
- Background: `#8BBE6A` (grass green)
- UI panels: `#F5DEB3` (wheat/parchment)
- Borders: `#8B4513` (wood brown, 4px pixel-style)
- Sunny accent: `#FFD700`
- Storm accent: `#4A6FA5`
- Rainbow accent: `#FF69B4`
- Cloudy accent: `#A0A0A0`
- Coin gold: `#FFD700`
- Danger red: `#CC0000`
- Success green: `#228B22`

**UI elements:**
- All buttons: pixel-border style (no border-radius, box-shadow offset for depth)
- Panel backgrounds: parchment texture via CSS (repeating gradient noise)
- Weather zone at top of screen: animated CSS weather matching current regime
- Characters rendered as large emoji inside pixel-art frames

**Animations (CSS only):**
- Dice: spin + bounce on roll
- Coins: fly from centre to player's coin pile with arc trajectory
- Tokens: pop in/out of player board
- Cards: flip face-up on reveal
- Weather transition: cross-fade with particle effect (rain drops, sun rays, rainbow arc)
- Regime change: screen flash + fanfare text popup

---

## Game Structure

### Players
- 2-4 players, human (no AI opponent needed in v1)
- Each player has a named player board on screen
- Turn order is fixed, clockwise

### Season
- 24 rounds (one "year" of market weeks)
- Progress bar at top showing current round / 24
- Game ends after round 24, highest NAV wins

### Starting conditions (each player)
- 1 Plot (anchor) — starting token value: 10
- 20 coins
- Current regime: ☀️ Sunny

---

## Core Data Structures

```javascript
const WEATHER = {
  SUNNY: 'sunny',
  CLOUDY: 'cloudy', 
  STORM: 'storm',
  RAINBOW: 'rainbow'
}

const CUSTOMERS = {
  NELLY: 'nelly',      // nervous, down move
  RITA: 'rita',        // regular, flat/small move  
  HARRY: 'harry',      // happy, up move
  BARRY: 'barry'       // big spender, big up move
}

const DEALS = {
  ROOT_VEG: 'root_veg',       // 🥕 defensive
  GOOD_VEG: 'good_veg',       // 🍅 balanced
  EXOTIC_FRUIT: 'exotic',     // 🍓 bold
  NO_DEAL: 'no_deal'          // 🌙 uncovered
}
```

---

## Weather Cards

Each weather card governs two rolls per round.

### Roll 1 — Direction die (d6)
Returns: market move (tokens added/subtracted from ALL players' plots) + customer who arrives

### ☀️ SUNNY
| Roll | Token Move | Customer |
|------|-----------|----------|
| 1 | -2 | 😰 Nelly |
| 2 | -1 | 😰 Nelly |
| 3 | +1 | 👩 Rita |
| 4 | +2 | 😄 Harry |
| 5 | +2 | 😄 Harry |
| 6 | +3 | 🤑 Barry |

### ☁️ CLOUDY
| Roll | Token Move | Customer |
|------|-----------|----------|
| 1 | -2 | 😰 Nelly |
| 2 | -1 | 😰 Nelly |
| 3 | -1 | 👩 Rita |
| 4 | +1 | 👩 Rita |
| 5 | +1 | 😄 Harry |
| 6 | +2 | 😄 Harry |

### 🌧️ STORM
| Roll | Token Move | Customer |
|------|-----------|----------|
| 1 | -3 | 😰 Nelly (nobody else dares) |
| 2 | -2 | 😰 Nelly |
| 3 | -2 | 😰 Nelly |
| 4 | -1 | 😰 Nelly |
| 5 | -1 | 👩 Rita |
| 6 | +1 | 👩 Rita |

### 🌈 RAINBOW
| Roll | Token Move | Customer |
|------|-----------|----------|
| 1 | +1 | 😄 Harry |
| 2 | +2 | 😄 Harry |
| 3 | +2 | 😄 Harry |
| 4 | +3 | 🤑 Barry |
| 5 | +3 | 🤑 Barry |
| 6 | +4 | 🤑 Barry |

---

### Roll 2 — Regime change die (d6)
Rolled AFTER market settlement. Determines if weather changes for NEXT round.

| Current | Stay | Change |
|---------|------|--------|
| ☀️ Sunny | 2-6 | 1 → ☁️ Cloudy |
| ☁️ Cloudy | 3-4 | 1-2 → 🌧️ Storm, 5-6 → ☀️ Sunny |
| 🌧️ Storm | 1-3 | 4-5 → ☁️ Cloudy, 6 → 🌈 Rainbow |
| 🌈 Rainbow | 1-3 | 4-6 → ☀️ Sunny |

---

## Deal Card Payouts

Coins earned based on deal played × customer who arrived:

| Deal | 😰 Nelly | 👩 Rita | 😄 Harry | 🤑 Barry |
|------|---------|--------|---------|---------|
| 🥕 Root Veg | 4 | 3 | 2 | 1 |
| 🍅 Good Veg | 2 | 3 | 3 | 2 |
| 🍓 Exotic Fruit | 1 | 2 | 4 | 6 |
| 🌙 No Deal | 0 | 0 | 0 | 0 |

---

## Order of Play (each round)

1. **Deal phase:** All players secretly select their Deal card (face down). Tap to select, confirm button to lock in. 
2. **Reveal:** All deal cards flip face-up simultaneously (CSS flip animation)
3. **Roll 1:** One player taps the dice (animated roll). Result determines token move + customer.
4. **Settlement:** 
   - All players' plot tokens adjust (up or down) based on token move
   - Each player collects coins based on their deal × customer table
   - Coin animation flies to each player's pile
5. **Roll 2:** Same player rolls regime die. Weather changes or stays.
6. **Weather transition** (if changed): animated transition, new weather card displayed
7. Round counter increments. Next round begins.

---

## Economy

### Tokens
- Track plot (anchor) value
- Start at 10 per plot
- Move up/down each round based on Roll 1
- If plot reaches 0 tokens → plot is worthless, must be abandoned
- Player can buy a new plot (see below)
- **Token multiplier: 3x for NAV calculation**

### Coins
- Weekly income from deals
- Used to buy additional plots
- 1 coin = 1 coin in NAV calculation

### Plot Costs (second plot onwards)
| Weather | Cost |
|---------|------|
| ☀️ Sunny | 15 coins |
| ☁️ Cloudy | 10 coins |
| 🌧️ Storm | 6 coins |
| 🌈 Rainbow | 12 coins |

Buying a plot in Storm is cheap but risky — value may keep falling. New plot always starts at 10 tokens regardless of when purchased.

### NAV (Account Value) — displayed prominently per player
```
NAV = coins + (total tokens across all plots × 3)
```

---

## Player Board UI (per player)

Each player has a panel showing:
- Player name + emoji avatar
- Current deal card selected (hidden until reveal)
- Plot count + token value per plot (visual token stack)
- Coin pile (visual coin stack)
- **NAV total** (large, prominent — this is the score)
- Buy Plot button (greyed out if insufficient coins)

---

## Weather Zone UI

Top third of screen. Animated based on current regime:
- ☀️ Sunny: animated sun rays, yellow sky, birds
- ☁️ Cloudy: drifting grey clouds, muted colours
- 🌧️ Storm: falling rain CSS animation, dark sky, lightning flash on regime entry
- 🌈 Rainbow: rainbow arc CSS gradient, brightening sky

Current regime name displayed in large pixel font.
Current round / 24 progress bar below weather zone.

---

## Dice UI

Large pixel-art style d6 in centre of screen.
Tap to roll — spin animation (CSS transform rotate), settles on result.
Result displayed large with customer face emoji + coin payout preview before confirming.

---

## Customer Reveal

When Roll 1 settles, a popup shows:
- Large customer emoji + name
- Flavour text (one line, humorous — see below)
- Each player's coin payout based on their deal
- Confirm button to proceed

---

## Humour / Flavour Text

One-liner displayed on customer reveal. Rotate randomly from a list per customer:

**😰 Nelly arrives:**
- "She's back. She smells of cabbage and existential dread."
- "Nelly doesn't trust the weather. She doesn't trust anything."
- "Nelly brought exact change. Of course she did."

**🤑 Barry arrives:**
- "Barry has arrived. Barry is wearing sunglasses. It is raining."
- "Barry doesn't ask the price. Barry never asks the price."
- "Barry bought everything. Barry doesn't know what half of it is."

**👩 Rita arrives:**
- "Regular Rita. Reliable Rita. Rita has a loyalty card."
- "Rita brought her own bag. Rita always brings her own bag."

**😄 Harry arrives:**
- "Harry is in a great mood. Harry is always in a great mood."
- "Harry tipped you. Nobody tips at a market stall."

**Regime change flavour text:**
- Storm arrives: "The weather has turned. Your neighbour who predicted this is insufferable."
- Rainbow arrives: "The sun is out. Barry is back. Your neighbour who sold everything last week is very quiet."
- Storm from Cloudy: "It got worse. Of course it got worse."

---

## Win Condition

After round 24:
- Final NAV calculated for all players
- Winner podium displayed with pixel-art fireworks CSS animation
- NAV breakdown shown (coins + token value)
- "Play Again" button resets all state

---

## Technical Notes

- Single HTML file, all CSS and JS embedded
- No external dependencies except Google Fonts (Press Start 2P)
- All game state in a JS object, no localStorage needed
- Touch-friendly: all tap targets minimum 48px
- iPad landscape optimised (1024×768 minimum)
- No backend, no build step — open in browser and play
