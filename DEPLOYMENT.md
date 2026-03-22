# 🚀 Deployment Guide

## Deploy to Vercel (Recommended)

### Option 1: Vercel CLI (Fastest)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd "/Users/williamford/Documents/AI-Coding/Turtle Game"
   vercel --prod
   ```

### Option 2: Vercel Git Integration (Auto-deploy)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment with localStorage save"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Framework: `Other` (static site)
   - Root Directory: `./` (leave as is)
   - Build Command: (leave empty)
   - Output Directory: `compact-game`

3. **Deploy:**
   - Vercel will auto-deploy on every push to main

### Option 3: Vercel Drag & Drop (Easiest)

1. **Build locally:**
   ```bash
   # Nothing to build - it's a static HTML file!
   ```

2. **Go to [vercel.com](https://vercel.com)**

3. **Drag and drop** the `compact-game` folder onto the dashboard

---

## Data Storage

### How Saving Works

The game now uses **localStorage** for persistence:

- ✅ Game state auto-saves after every action
- ✅ Data persists across browser sessions
- ✅ No backend required - completely free!
- ❌ Data is browser-specific (won't sync across devices)

### Saved Data Includes:
- Account balance
- LEAPS position details
- Short call position
- Week number and price history
- Game phase

### To Clear Save:
Click **Reset** button in-game, or:
```javascript
localStorage.removeItem('turtleGame_save')
```

---

## GitHub Repository Setup

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/turtle-trading-game.git
git branch -M main
git push -u origin main
```

---

## Custom Domain (Optional)

1. Buy a domain (Namecheap, Cloudflare, etc.)
2. In Vercel dashboard: **Project → Settings → Domains**
3. Add your domain and follow DNS instructions

---

## Troubleshooting

### Changes not showing?
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Check Vercel deployment logs

### Save data lost?
- localStorage is cleared if user clears browser data
- Consider adding JSON export/import feature for backups

### Want user accounts later?
- Easy to add Supabase later for cloud saves
- localStorage code can be swapped out gradually
