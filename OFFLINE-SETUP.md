# TradeVault — Offline Setup Guide

> Run TradeVault **100% offline** on your PC with MySQL + local file storage.  
> No cloud, no accounts, no internet required after setup.

---

## 📋 Prerequisites

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **MySQL** | 8.0+ | [dev.mysql.com/downloads](https://dev.mysql.com/downloads/mysql/) |
| **Git** | Any | [git-scm.com](https://git-scm.com/) |

---

## 🚀 Quick Start (5 minutes)

### Step 1 — Clone & Install

```bash
# Clone the repository
git clone <your-repo-url> tradevault
cd tradevault

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 2 — Configure MySQL

1. Open MySQL command line (or MySQL Workbench):
```sql
-- Create a dedicated user (optional but recommended)
CREATE USER 'tradevault'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON tradevault.* TO 'tradevault'@'localhost';
FLUSH PRIVILEGES;
```

2. Create your `.env` file in the `server/` folder:
```bash
cd server
cp .env.example .env
```

3. Edit `server/.env` with your MySQL credentials:
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=tradevault
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=tradevault

PORT=3001

# Where screenshots are saved on your PC
# Windows example: C:/TradeVault/screenshots
# Mac/Linux example: /home/yourname/TradeVault/screenshots
SCREENSHOTS_DIR=C:/TradeVault/screenshots
```

### Step 3 — Create Database Tables

```bash
cd server
npm run setup-db
```

You should see:
```
✅ Connected to MySQL
✅ Database "tradevault" and tables created successfully
```

### Step 4 — Start the Backend

```bash
cd server
npm run dev    # with auto-restart on changes
# or
npm start      # without auto-restart
```

You should see:
```
╔═══════════════════════════════════════════════════╗
║   TradeVault Server running on port 3001          ║
║   Screenshots: C:/TradeVault/screenshots          ║
║   API: http://localhost:3001/api/health            ║
╚═══════════════════════════════════════════════════╝
```

### Step 5 — Start the Frontend

Open a **new terminal**:
```bash
# From the project root
npm run dev
```

Open your browser to **http://localhost:8080**

---

## 📁 Local File Storage (Screenshots)

Screenshots are saved to your PC in a structured folder hierarchy:

```
SCREENSHOTS_DIR/
├── 2025/
│   ├── 01/
│   │   ├── 15/
│   │   │   ├── 143022/
│   │   │   │   ├── before.png    ← Screenshot before entry
│   │   │   │   └── after.png     ← Screenshot after exit
│   │   │   └── 160510/
│   │   │       ├── before.jpg
│   │   │       └── after.jpg
│   │   └── 16/
│   │       └── ...
│   └── 02/
│       └── ...
└── 2026/
    └── ...
```

**Structure**: `year/month/day/HHMMSS/before|after.ext`

The server serves these files at `http://localhost:3001/screenshots/...` so the frontend can display them.

---

## 🔌 Switching Frontend to Offline Mode

To switch the frontend from cloud to your local backend, you need to update the data hooks. Here's the approach:

### Option A: Environment Variable Switch

Add to your root `.env`:
```env
VITE_API_MODE=offline
VITE_API_URL=http://localhost:3001
```

Then create `src/lib/api.ts`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### Option B: Replace Hooks (Full Offline)

Replace `src/hooks/use-trades.ts` to call REST API instead of Supabase:
```typescript
// Replace supabase imports with fetch calls
const fetchTrades = async () => {
  const res = await fetch(`http://localhost:3001/api/trades?account_id=${accountId}`);
  const data = await res.json();
  setTrades(data);
};
```

Same for `src/hooks/use-accounts.ts` and screenshot uploads in `TradeForm.tsx`.

---

## 🗄️ Database Schema

The MySQL schema mirrors the cloud database exactly:

| Table | Purpose |
|-------|---------|
| `trading_accounts` | Your trading accounts (funded, demo, personal) |
| `account_transactions` | Deposits & withdrawals per account |
| `trades` | All trade entries with full CRT analysis data |

### Key Differences from Cloud

| Feature | Cloud (Supabase) | Offline (MySQL) |
|---------|-----------------|-----------------|
| Auth | Email/password login | No auth (single user) |
| User ID | UUID from auth | `'local'` constant |
| Screenshots | Cloud storage bucket | Local filesystem |
| Database | PostgreSQL | MySQL 8 |
| Access | Any device + internet | Your PC only |

---

## 📊 API Endpoints Reference

All endpoints are at `http://localhost:3001/api/`

### Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List all accounts |
| POST | `/api/accounts` | Create account (`name`, `type`, `broker`, `initial_balance`) |
| PUT | `/api/accounts/:id` | Update account (`name`, `type`, `broker`) |
| DELETE | `/api/accounts/:id` | Delete account (cascades trades & transactions) |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions?account_id=xxx` | List transactions |
| POST | `/api/transactions` | Add transaction (`account_id`, `type`, `amount`, `note`) |

### Trades
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trades?account_id=xxx` | List trades for account |
| POST | `/api/trades` | Create trade (supports file upload for screenshots) |
| PUT | `/api/trades/:id` | Update trade fields |
| DELETE | `/api/trades/:id` | Delete trade |
| GET | `/api/trades/closed-summary` | Closed trades for balance calculation |

### Utility
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check server + DB connection |
| POST | `/api/upload-screenshot` | Upload a screenshot file |

---

## 🔄 Data Migration (Cloud → Offline)

To move your existing cloud data to MySQL:

1. **Export from cloud** using the CSV Export button in TradeVault
2. **Import to MySQL** using the CSV Import button after switching to offline mode

Or manually:
```bash
# Export trades from the app's CSV export feature
# Then import via MySQL command line:
mysql -u tradevault -p tradevault < your_export.sql
```

---

## 🛠️ Troubleshooting

### "ECONNREFUSED" error
- Make sure MySQL is running: `sudo systemctl start mysql` (Linux) or check MySQL service in Windows Services
- Verify credentials in `server/.env`

### "ER_NOT_SUPPORTED_AUTH_MODE"
MySQL 8 uses `caching_sha2_password` by default. Fix:
```sql
ALTER USER 'tradevault'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
```

### Screenshots not showing
- Check `SCREENSHOTS_DIR` path in `.env` exists and is writable
- Verify the server is running (screenshots are served by Express)

### Port conflicts
- Change `PORT` in `server/.env` (default: 3001)
- Change frontend port in `vite.config.ts` (default: 8080)

---

## 📦 Backup Strategy

### Database Backup
```bash
# Full backup
mysqldump -u tradevault -p tradevault > backup_$(date +%Y%m%d).sql

# Restore from backup
mysql -u tradevault -p tradevault < backup_20250115.sql
```

### Screenshots Backup
Simply copy your `SCREENSHOTS_DIR` folder to your backup location:
```bash
# Windows
xcopy /E /I "C:\TradeVault\screenshots" "D:\Backups\TradeVault\screenshots"

# Linux/Mac
cp -r ~/TradeVault/screenshots ~/Backups/TradeVault/
```

### Full Backup Script (save as `backup.bat` on Windows)
```batch
@echo off
set BACKUP_DIR=D:\Backups\TradeVault\%date:~-4,4%%date:~-10,2%%date:~-7,2%
mkdir "%BACKUP_DIR%" 2>nul
mysqldump -u tradevault -p tradevault > "%BACKUP_DIR%\database.sql"
xcopy /E /I "C:\TradeVault\screenshots" "%BACKUP_DIR%\screenshots"
echo Backup complete: %BACKUP_DIR%
```

---

## 🖥️ Running as Windows Service (Auto-start)

To have the server start automatically with Windows:

1. Install `pm2` globally:
```bash
npm install -g pm2
```

2. Start the server with pm2:
```bash
cd server
pm2 start index.js --name tradevault
pm2 save
pm2 startup   # Follow the instructions to add to Windows startup
```

---

## ✅ Checklist

- [ ] Node.js 18+ installed
- [ ] MySQL 8+ installed and running
- [ ] `server/.env` configured with your MySQL credentials
- [ ] Database tables created (`npm run setup-db`)
- [ ] `SCREENSHOTS_DIR` path set and folder is writable
- [ ] Backend running on port 3001
- [ ] Frontend running on port 8080
- [ ] Test: open http://localhost:3001/api/health → `{"status":"ok"}`
- [ ] Test: open http://localhost:8080 → TradeVault loads

---

*Built for traders who want full control of their data. 🏦*
