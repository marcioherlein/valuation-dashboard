# VAL-X · Buy-Side Valuation Terminal

A Bloomberg-style DCF valuation dashboard. Dark, data-dense, professional.
Built with Next.js + Recharts + Tailwind.

---

## 🚀 Deploy in 5 Steps (No coding required)

### Step 1 — Get the code onto GitHub

1. Go to **github.com** → click **+** (top right) → **New repository**
2. Name it `valuation-dashboard` → click **Create repository**
3. You'll see a page with setup instructions. Click the **"uploading an existing file"** link
4. Drag and drop **all the files from this folder** into the GitHub uploader
5. Click **"Commit changes"**

### Step 2 — Deploy to Vercel

1. Go to **vercel.com** → sign in with your GitHub account
2. Click **"Add New Project"**
3. Find your `valuation-dashboard` repo and click **Import**
4. Vercel auto-detects Next.js — just click **Deploy**
5. In ~2 minutes you'll get a live URL like `valuation-dashboard.vercel.app`

### Step 3 — Done ✓

Your dashboard is live. Every time you push changes to GitHub, Vercel automatically redeploys.

---

## 🏃 Run Locally (Optional)

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## ➕ How to Add a New Company

Adding a new company takes **2 file edits** — no code changes needed.

### File 1: Create `data/TICKER.json`

Copy `data/NIO.json` and fill in your company's data.
The key fields to update:

```json
{
  "id": "AAPL",              ← must match the filename
  "name": "Apple Inc.",
  "ticker": "AAPL",
  "exchange": "NASDAQ",
  "price": 195.00,
  "recommendation": "BUY",   ← BUY | AVOID | HOLD | SELL
  "valuation": {
    "base": 210.00,
    "upside": 280.00,
    "upsideToBase": 7.7,
    "upsideToBull": 43.6,
    ...
  },
  "scenarios": {
    "base": {
      "forecast": [
        { "year": 2026, "revenue": 420.0, "ebit": 120.0, "fcff": 95.0, "pvFCFF": 86.0 },
        ...
      ]
    }
  },
  "risks": [...],
  ...
}
```

### File 2: Add a line to `data/companies.json`

```json
[
  { ...NIO entry... },
  {
    "id": "AAPL",
    "name": "Apple Inc.",
    "ticker": "AAPL",
    "exchange": "NASDAQ",
    "sector": "Technology",
    "country": "USA",
    "recommendation": "BUY",
    "price": 195.00,
    "baseValue": 210.00,
    "upsideValue": 280.00,
    "upsideToBase": 7.7,
    "asOfDate": "2026-02-20",
    "currency": "USD"
  }
]
```

Save both files → commit to GitHub → Vercel auto-deploys in ~2 minutes.

---

## 📁 Project Structure

```
valuation-dashboard/
│
├── app/
│   ├── layout.tsx          ← Root HTML wrapper
│   ├── globals.css         ← Bloomberg terminal theme + fonts
│   ├── page.tsx            ← Home page (company grid)
│   └── company/[id]/
│       └── page.tsx        ← Individual company report page
│
├── components/
│   ├── TopBar.tsx          ← Sticky header with live clock
│   ├── CompanyCard.tsx     ← Card on home page
│   └── CompanyReport.tsx   ← Full tabbed report (charts, tables, etc.)
│
├── data/
│   ├── companies.json      ← ⭐ Index of all companies (edit to add new ones)
│   └── NIO.json            ← ⭐ Full valuation data for NIO
│
├── types/
│   └── index.ts            ← TypeScript data shapes (don't need to edit)
│
├── package.json
├── tailwind.config.js
└── vercel.json
```

---

## 🎨 Dashboard Features

| Section | What it shows |
|---|---|
| **Summary** | Price vs intrinsic value spectrum, reverse DCF, EV bridge, catalysts |
| **Forecast** | Interactive Base/Upside toggle · Revenue, EBIT, FCFF charts + table |
| **Drivers** | Volume KPIs, quarterly revenue build, breakeven evidence |
| **DCF Inputs** | CAPM build, scenario assumptions (growth path + margin path) |
| **Risks** | Risk register + management questions |

---

## ⚠️ Disclaimer

Educational only. Not investment advice.
