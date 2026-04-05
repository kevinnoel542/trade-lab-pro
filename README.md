# 📈 TradeVault — CRT Performance Lab

> A professional offline-first trading journal and analytics platform built for serious forex and commodity traders. Log trades, track performance, and gain deep insights using the **Confluence-based Reversal Trading (CRT)** methodology.

---

## ✨ Features

- 📝 **Trade Journal** — Log trades with 30+ fields including entry/exit prices, session, strategy, lot size, risk, and CRT-specific analysis
- 📊 **Advanced Analytics** — Charts, win rate breakdowns by session/pair/strategy, cumulative P&L, profit factor, expectancy, and max drawdown
- 🗓️ **Trade Calendar** — Visual monthly calendar showing daily P&L at a glance
- 👤 **Multi-Account Management** — Manage Personal, Funded, Demo, Prop Firm, and Challenge accounts with real-time balance tracking
- 💹 **Auto-Calculations** — Pips, R-Multiples, P&L in dollars and percent, pip value — all calculated automatically
- 📄 **PDF Report Export** — Generate a professional 3-page performance report with KPIs, trade history, and CRT analysis
- 📂 **CSV Import / Export** — Export all trades or import from MetaTrader 5 history with smart column mapping
- 🌙 **Dark Theme** — Clean dark UI with a glassmorphism design built for long trading sessions
- 🔒 **Offline-First** — All data stays local on your machine, no cloud required

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| UI Components | Shadcn UI, Radix UI, Lucide React |
| Styling | Tailwind CSS (dark mode) |
| State / Data | TanStack React Query |
| Charts | Recharts |
| Routing | React Router v6 |
| PDF Export | jsPDF + jsPDF-autoTable |
| Backend | Node.js, Express.js |
| Database | MySQL |
| File Uploads | Multer |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18+
- [MySQL](https://dev.mysql.com/downloads/) 8.0+
- npm (comes with Node.js)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/tradevault.git
cd tradevault
```

---

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

---

### 3. Set Up the Database

Create the MySQL database and tables:

```bash
mysql -u root -p < server/schema.sql
```

This creates:
- `trading_accounts` — account metadata and balances
- `account_transactions` — deposits and withdrawals
- `trades` — full trade data (41 fields)

Optionally, seed the database with dummy trades for testing:

```bash
cd server
node seed-dummy-data.js
```

---

### 4. Configure Environment Variables

**Backend** — copy the example and fill in your MySQL credentials:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=tradevault
PORT=3001
SCREENSHOTS_DIR=./uploads/screenshots
```

**Frontend** — edit the root `.env` file:

```env
VITE_API_MODE=offline
VITE_API_URL=http://localhost:3001
```

---

### 5. Start the App

#### 🟢 Easy Way (Automated)

**Linux / Mac:**
```bash
./start-servers.sh
```

**Windows:**
```bat
start-servers.bat
```

#### 🔧 Manual Way

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

---

### 6. Open in Browser

| Service | URL |
|---|---|
| Frontend App | http://localhost:8080 |
| Backend API | http://localhost:3001 |
| API Health Check | http://localhost:3001/api/health |

---

## 📁 Project Structure

```
tradevault/
├── src/
│   ├── components/         # UI components (TradeForm, TradeTable, TradeCalendar, etc.)
│   ├── components/ui/      # Shadcn UI base components
│   ├── hooks/              # React hooks (use-trades, use-accounts, use-auth)
│   ├── lib/                # Utilities (api, csv-utils, pdf-report, trade-types)
│   ├── pages/              # App pages (Index, Analytics, Accounts, Auth)
│   └── main.tsx            # App entry point
│
├── server/
│   ├── index.js            # Express API server
│   ├── db.js               # MySQL connection pool
│   ├── schema.sql          # Database schema
│   ├── seed-dummy-data.js  # Test data seeder
│   └── .env.example        # Environment variable template
│
├── public/                 # Static assets
├── index.html              # HTML entry point
├── vite.config.ts          # Vite configuration
└── package.json            # Frontend dependencies
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/accounts` | Get all accounts |
| POST | `/api/accounts` | Create account |
| PUT | `/api/accounts/:id` | Update account |
| DELETE | `/api/accounts/:id` | Delete account |
| GET | `/api/accounts/:id/transactions` | Get transactions for account |
| POST | `/api/accounts/:id/transactions` | Add transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/trades` | Get all trades |
| GET | `/api/trades/:id` | Get single trade |
| POST | `/api/trades` | Create trade |
| PUT | `/api/trades/:id` | Update trade |
| DELETE | `/api/trades/:id` | Delete trade |
| GET | `/api/trades/summary` | Get analytics summary |
| POST | `/api/upload/screenshot` | Upload trade screenshot |

---

## 📊 Trade Fields

Each trade supports the following data:

| Category | Fields |
|---|---|
| **Basics** | Date, Pair, Session, Direction (Buy/Sell), Lot Size, Status (Open/Closed) |
| **Pricing** | Entry Price, Stop Loss, Take Profit, Exit Price |
| **Risk** | Risk Amount ($), Risk Percent (%), Account Size |
| **Results** | Pips, R-Multiple, P&L ($), P&L (%) |
| **Strategy** | Strategy, Market Condition, HTF Timeframe, Entry Timeframe |
| **CRT Analysis** | Dealing Range High/Low, Equilibrium, Trade Location, Liquidity Sweep Type, Key Levels |
| **Entry Quality** | Entry Type, Entry Quality (1–5), HTF Bias Respected, LTF BOS Confirmed, MSS Present |
| **Notes** | Confluences, Notes, Screenshot Before, Screenshot After |

---

## 📤 CSV Import / Export

### Export
Click **Export CSV** to download all trades with every field included.

### Import
Click **Import CSV** and select a file. Supports:
- **TradeVault exports** — direct field mapping
- **MetaTrader 5 history** — automatic column detection and mapping

---

## 📄 PDF Reports

Generate a professional performance report from the Analytics page. The report includes:
- **Page 1** — Cover with key performance indicators (Win Rate, P&L, R-Multiple, Profit Factor)
- **Page 2** — Full trade history table
- **Page 3** — CRT analysis breakdown (wins/losses by session, pair, strategy, entry type)

---

## 🧪 Running Tests

```bash
npm test
```

Tests are written with **Vitest** and **Testing Library**.

---

## 🔧 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend dev server |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run test suite |
| `npm run lint` | Run ESLint |

---

## 🙏 Acknowledgements

- [Shadcn UI](https://ui.shadcn.com/) — Beautiful, accessible component library
- [Recharts](https://recharts.org/) — Composable charting library for React
- [jsPDF](https://github.com/parallax/jsPDF) — PDF generation in the browser
- [TanStack Query](https://tanstack.com/query) — Powerful async state management

---

## 📃 License

This project is for personal use. All rights reserved.
