# TradeVault Project Summary

## Overview
**TradeVault** is an offline forex/crypto trading journal application built with a React/Vite frontend and Express.js/MySQL backend. It tracks trading accounts, individual trades with detailed metrics, and transactions.

---

## Backend Stack

### Technology
- **Server**: Express.js (Node.js)
- **Database**: MySQL 8.0+
- **File Storage**: Local filesystem for screenshots
- **Authentication**: Single-user offline mode (no auth required)

### Key Dependencies (server/package.json)
- `express` ^4.21.2 — REST API framework
- `mysql2` ^3.12.0 — Database driver with promise support
- `dotenv` ^16.4.7 — Environment configuration
- `cors` ^2.8.5 — Cross-origin request handling
- `multer` ^1.4.5-lts.1 — File upload handling for screenshots
- `uuid` ^11.1.0 — ID generation
- `nodemon` ^3.1.9 — Dev auto-reload

---

## Database Schema

### Tables

#### 1. **trading_accounts**
Represents user trading accounts (FTMO, Personal, etc.)

```sql
- id              CHAR(36) [UUID, PK]
- user_id         VARCHAR(100) [default: 'local']
- name            VARCHAR(255) [required]
- type            VARCHAR(50) [default: 'Personal']
- broker          VARCHAR(255) [nullable]
- initial_balance DECIMAL(15,2) [default: 0]
- current_balance DECIMAL(15,2) [default: 0]
- currency        VARCHAR(10) [default: 'USD']
- is_active       TINYINT(1) [default: 1]
- created_at      TIMESTAMP [auto]
- updated_at      TIMESTAMP [auto]
- INDEX: user_id
```

#### 2. **account_transactions**
Deposits and withdrawals for accounts

```sql
- id          CHAR(36) [UUID, PK]
- account_id  CHAR(36) [FK → trading_accounts, CASCADE]
- user_id     VARCHAR(100) [default: 'local']
- type        VARCHAR(20) [required] — 'deposit' or 'withdrawal'
- amount      DECIMAL(15,2) [required]
- note        TEXT [nullable]
- created_at  TIMESTAMP [auto]
- INDEX: account_id, user_id
```

#### 3. **trades**
Individual trade records with detailed analysis data

```sql
- id                    CHAR(36) [UUID, PK]
- user_id              VARCHAR(100) [default: 'local']
- account_id           CHAR(36) [FK → trading_accounts, CASCADE]
- trade_id             VARCHAR(50) [unique identifier]
- date                 DATE [required]
- session              VARCHAR(20) ['London', 'Asia', 'New York']
- pair                 VARCHAR(20) [e.g., 'EURUSD', 'NAS100', 'XAUUSD']
- direction            VARCHAR(10) ['Buy' or 'Sell']
- lot_size             DECIMAL(10,4)
- entry_price          DECIMAL(15,5)
- stop_loss            DECIMAL(15,5)
- take_profit          DECIMAL(15,5)
- exit_price           DECIMAL(15,5) [nullable]
- risk_amount          DECIMAL(15,2)
- risk_percent         DECIMAL(8,4) [max: 9999.9999]
- account_size         DECIMAL(15,2)
- strategy             VARCHAR(100) ['CRT', 'Liquidity Sweep', 'Order Block Entry', etc.]
- htf_timeframe        VARCHAR(10) ['H4', 'H1', 'D1', etc.]
- entry_timeframe      VARCHAR(10) ['M15', 'M5', 'H1', etc.]
- market_condition     VARCHAR(50) ['Trending', 'Ranging', etc.]
- confluences          JSON [array of confluence factors]
- screenshot_before    TEXT [URL path to before screenshot]
- screenshot_after     TEXT [URL path to after screenshot]
- notes                TEXT
- status               VARCHAR(20) ['Open' or 'Closed']
- dealing_range_high   DECIMAL(15,5) [nullable]
- dealing_range_low    DECIMAL(15,5) [nullable]
- equilibrium          DECIMAL(15,5) [nullable]
- trade_location       VARCHAR(20) [nullable]
- liquidity_sweep_type VARCHAR(50) [nullable]
- key_levels           JSON [array of key levels]
- entry_type           VARCHAR(100) ['FVG Mitigation', etc.]
- entry_quality        TINYINT [1-5 quality score]
- htf_bias_respected   TINYINT(1) [boolean]
- ltf_bos_confirmed    TINYINT(1) [boolean]
- mss_present          TINYINT(1) [boolean]
- created_at           TIMESTAMP [auto]
- updated_at           TIMESTAMP [auto]
- INDEX: account_id, user_id, date, pair
```

---

## API Endpoints

### Health Check
- **GET** `/api/health` → `{ status: 'ok', database: 'connected' }`

### Trading Accounts
- **GET** `/api/accounts` → List all accounts for user
- **POST** `/api/accounts` → Create new account
  - Body: `{ name, type, broker, initial_balance }`
- **PUT** `/api/accounts/:id` → Update account
  - Body: `{ name, type, broker }`
- **DELETE** `/api/accounts/:id` → Delete account

### Account Transactions
- **GET** `/api/transactions?account_id=<id>` → List deposits/withdrawals
- **POST** `/api/transactions` → Record deposit or withdrawal
  - Body: `{ account_id, type: 'deposit'|'withdrawal', amount, note }`

### Trades
- **GET** `/api/trades?account_id=<id>` → List trades
- **POST** `/api/trades` → Create trade (with optional file upload for before/after screenshots)
  - Body (multipart/form-data):
    ```json
    {
      "account_id": "uuid",
      "trade_id": "T260106-ABC1",
      "date": "2026-01-06",
      "session": "London",
      "pair": "EURUSD",
      "direction": "Buy",
      "lot_size": 0.5,
      "entry_price": 1.08500,
      "stop_loss": 1.08300,
      "take_profit": 1.09100,
      "exit_price": 1.09000,
      "risk_amount": 100,
      "risk_percent": 1.5,
      "account_size": 100000,
      "strategy": "CRT",
      "htf_timeframe": "H4",
      "entry_timeframe": "M15",
      "market_condition": "Trending",
      "confluences": ["FVG", "Order Block"],
      "key_levels": ["OB", "FVG"],
      "notes": "Clean execution",
      "status": "Closed",
      "entry_type": "FVG Mitigation",
      "entry_quality": 4,
      "htf_bias_respected": true,
      "ltf_bos_confirmed": true,
      "mss_present": true
    }
    ```
  - Files: `before` and `after` (optional)
- **PUT** `/api/trades/:id` → Update trade
  - Body: Any of the above fields
- **DELETE** `/api/trades/:id` → Delete trade

### Summary/Analytics
- **GET** `/api/trades/closed-summary` → Returns closed trades for balance calculations
  - Returns: `[{ entry_price, exit_price, stop_loss, direction, risk_amount, account_id }]`

### Screenshot Upload
- **POST** `/api/upload-screenshot?type=before|after` → Upload screenshot standalone
  - Accepts multipart file in `before`, `after`, or `file` field
  - Returns: `{ url: "/screenshots/YYYY/MM/DD/HHmmss/filename" }`

---

## Environment Variables

### server/.env (or server/.env.example)

```bash
# ─── MySQL Connection ───
MYSQL_HOST=localhost              # MySQL server hostname
MYSQL_PORT=3306                   # MySQL port
MYSQL_USER=root                   # MySQL user
MYSQL_PASSWORD=kevin098           # MySQL password
MYSQL_DATABASE=tradevault         # Database name

# ─── Server ───
PORT=3001                         # Backend API port

# ─── Local Screenshot Storage ───
SCREENSHOTS_DIR=./screenshots     # Directory for trade screenshots
                                  # Can be absolute path like: C:/TradeVault/screenshots
```

### Root .env (Frontend)

```bash
# Intentionally left empty to allow dynamic API URL resolution
# The app uses the same hostname as the browser (localhost for dev, phone IP for WiFi)
# Uncomment only if you have a fixed remote server:
# VITE_API_URL=http://localhost:3001

VITE_API_MODE=offline            # Offline-only mode (no cloud sync)
```

---

## Frontend Stack

### Technology
- **Build Tool**: Vite 7.3.1
- **Framework**: React 18.3.1 + TypeScript
- **UI**: shadcn-ui with Tailwind CSS
- **State Management**: TanStack React Query (TQ)
- **Routing**: React Router DOM 6
- **Charts**: Recharts 2.15.4
- **Forms**: React Hook Form + Zod validation
- **PDF Export**: jsPDF + jsPDF AutoTable
- **Dev**: Vitest for testing

### Vite Config
- **Dev Server**: Port 8080 (host: `::`), configured for network access
- **HMR Overlay**: Disabled for better UX
- **Path Alias**: `@` → `./src`

### Key npm Scripts
```bash
npm run dev          # Start Vite dev server (port 8080)
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run Vitest
npm test:watch       # Watch mode tests
```

---

## How to Start the Project

### Prerequisites
1. **Node.js** (v16+) and npm
2. **MySQL** 8.0+ running locally
3. Database already created or script to run (see below)

### Setup Steps

#### 1. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies (from root)
cd ..
npm install
```

#### 2. Set Up Database
```bash
# Create database and schema
mysql -u root -p < server/schema.sql

# (Optional) Seed dummy data
node server/seed-dummy-data.js
```

#### 3. Configure Environment
```bash
# Copy example to actual config
cp server/.env.example server/.env

# Edit server/.env with your MySQL credentials:
# - MYSQL_HOST
# - MYSQL_USER
# - MYSQL_PASSWORD
# - SCREENSHOTS_DIR (optional)

# Root .env is fine as-is for offline mode
```

#### 4. Start Development Servers

**Option A: Automated (Linux/macOS)**
```bash
chmod +x start-servers.sh
./start-servers.sh
```

**Option B: Automated (Windows)**
```bash
start-servers.bat
```

**Option C: Manual (All Platforms)**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

### Access Points
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Screenshots**: http://localhost:3001/screenshots/...

### Development Scripts

**Backend**
- `npm start` (from `server/`) — Run server once
- `npm run dev` (from `server/`) — Run with auto-reload (nodemon)

**Frontend**
- `npm run dev` — Vite dev server with HMR
- `npm run build` — Optimize production bundle
- `npm run lint` — Check code style

---

## Key Features

1. **Multi-Account Support**: Manage multiple trading accounts simultaneously
2. **Detailed Trade Logging**: Capture all trade parameters and analysis data
3. **Risk Management**: Track risk per trade (amount, percentage)
4. **Screenshot Storage**: Attach before/after screenshots to trades
5. **Trade Analysis**: Mark confluences, key levels, entry type, and quality
6. **Transaction Tracking**: Log deposits and withdrawals
7. **Offline-First**: All data stored locally in MySQL
8. **Responsive UI**: Works on desktop and mobile via network access

---

## Notes

- **Single-User Mode**: Uses hardcoded `user_id = 'local'` for offline use
- **Screenshot Organization**: Automatically organizes by `YEAR/MONTH/DAY/TIME/`
- **JSON Columns**: `confluences` and `key_levels` stored as JSON in MySQL
- **Type Casting**: Server handles JSON→JS object conversion automatically
- **Error Handling**: Unhandled promise rejections logged but don't crash the server
- **CORS Enabled**: Allows requests from any origin for local network testing
