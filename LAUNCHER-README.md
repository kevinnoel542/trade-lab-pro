# TradeVault Offline - Launcher Scripts

Complete automated launcher scripts for starting MySQL, Backend API, and Frontend Dev Server with a single command.

## 🚀 Quick Start

### Linux / macOS
```bash
./launcher.sh
```

### Windows
```bash
launcher.bat
```

---

## ✨ Features

✅ **Automatic MySQL Startup** - Starts MySQL service if not running  
✅ **Database Verification** - Confirms MySQL is accessible before proceeding  
✅ **Auto npm Install** - Installs dependencies on both frontend and backend  
✅ **Backend API Launch** - Starts Express server on port 3001  
✅ **Frontend Dev Server** - Launches Vite dev server on port 8081  
✅ **Health Checks** - Verifies each service is running  
✅ **Port Conflict Detection** - Warns if ports are already in use  
✅ **Automatic Cleanup** - Stops all services on script exit (Ctrl+C)  
✅ **Comprehensive Logging** - Creates log files for debugging  
✅ **Color-Coded Output** - Easy-to-read status messages  

---

## 📋 What It Does

### Step 1: Prerequisites Check
- Verifies Node.js, npm, and MySQL are installed
- Displays installed versions

### Step 2: Screenshots Directory
- Creates `~/TradeVault/screenshots/` if it doesn't exist
- Used for storing trade screenshots

### Step 3: MySQL Service
- Starts MySQL service (auto-detects system type)
- Verifies database connection
- Checks user credentials

### Step 4: Backend Server
- Installs npm dependencies in `server/` folder
- Starts Express API on **port 3001**
- Verifies API health endpoint
- Logs output to `/tmp/tradelab-backend.log`

### Step 5: Frontend Dev Server
- Installs npm dependencies in root folder
- Starts Vite dev server on **port 8081**
- Verifies server is responding
- Logs output to `/tmp/tradelab-frontend.log`

---

## 🔧 Configuration

Edit these values in the launcher scripts to customize:

### launcher.sh (Linux/macOS)
```bash
MYSQL_USER="tradevault"
MYSQL_PASSWORD="kevin098"
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
DB_NAME="tradevault"
BACKEND_PORT="3001"
FRONTEND_PORT="8081"
SCREENSHOTS_DIR="$HOME/TradeVault/screenshots"
```

### launcher.bat (Windows)
```batch
set MYSQL_USER=tradevault
set MYSQL_PASSWORD=kevin098
set MYSQL_HOST=localhost
set MYSQL_PORT=3306
set DB_NAME=tradevault
set BACKEND_PORT=3001
set FRONTEND_PORT=8081
set SCREENSHOTS_DIR=%USERPROFILE%\TradeVault\screenshots
```

---

## 📱 Access Your Application

After running the launcher, access your application at:

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:8081 | ✅ Main Application |
| **Backend API** | http://localhost:3001 | ✅ REST API |
| **API Health** | http://localhost:3001/api/health | ✅ Health Check |

---

## 📊 Available API Endpoints

Once the backend is running, you can access:

```
GET  /api/health                    - Server health check
GET  /api/accounts                  - List all trading accounts
GET  /api/accounts/:id              - Get account details
POST /api/accounts                  - Create new account
PUT  /api/accounts/:id              - Update account
GET  /api/transactions/:accountId   - List transactions
POST /api/transactions              - Create transaction
GET  /api/trades                    - List all trades
GET  /api/trades/:id                - Get trade details
POST /api/trades                    - Create new trade
PUT  /api/trades/:id                - Update trade
```

---

## 📝 Database Information

**Database Credentials (Default):**
- **Host:** localhost
- **Port:** 3306
- **User:** tradevault
- **Password:** kevin098
- **Database:** tradevault

**Database Tables:**
- `trading_accounts` - Trading account information
- `account_transactions` - Deposits and withdrawals
- `trades` - Trade entries with CRT analysis
- `key_levels` - Price levels (OB, FVG, RB, BB)
- `liquidity_context` - Market liquidity data
- `sessions` - Trading session information
- `emotions` - Trader emotional state
- `screenshots` - Screenshot references
- `strategy_versions` - Strategy versions

---

## 🗂️ File Locations

```
TradeVault Project/
├── launcher.sh              ← Run on Linux/macOS
├── launcher.bat             ← Run on Windows
├── server/
│   ├── .env                 ← MySQL credentials
│   └── index.js             ← Backend API (port 3001)
├── src/
│   └── main.tsx             ← Frontend App (port 8081)
└── ~/TradeVault/
    └── screenshots/         ← Screenshot storage
```

---

## 🔍 Monitoring & Logs

### View Backend Logs (Linux/macOS)
```bash
tail -f /tmp/tradelab-backend.log
```

### View Frontend Logs (Linux/macOS)
```bash
tail -f /tmp/tradelab-frontend.log
```

### Check Running Processes (Linux/macOS)
```bash
ps aux | grep -E "node|npm" | grep -v grep
```

### Check Port Usage (Linux/macOS)
```bash
lsof -i :3001      # Backend port
lsof -i :8081      # Frontend port
```

### Check Port Usage (Windows)
```cmd
netstat -ano | find ":3001"
netstat -ano | find ":8081"
```

---

## 🛑 Stopping Services

### Linux/macOS
Press `Ctrl+C` in the launcher terminal - it will automatically:
- Kill the Node.js backend process
- Kill the Vite dev server
- Display shutdown confirmation

### Windows
1. Go to Backend window and press `Ctrl+C`
2. Go to Frontend window and press `Ctrl+C`
3. Or use Task Manager to end `node.exe` processes

---

## ❌ Troubleshooting

### MySQL Connection Error
```
ERROR: Could not connect to MySQL
```
**Solution:**
- Ensure MySQL is running: `mysql -u root -p`
- Check credentials in launcher script
- Verify user `tradevault` exists: `mysql -u tradevault -p`

### Port Already in Use
```
Port 3001 is already in use
```
**Solution:**
- Kill existing process: `kill $(lsof -t -i :3001)` (Linux/Mac)
- Or use Task Manager to end Node processes (Windows)
- Change port in launcher script

### npm Install Fails
```
npm ERR! code E...
```
**Solution:**
```bash
npm cache clean --force
npm install
```

### MySQL Service Won't Start
**Linux:**
```bash
sudo systemctl start mysql
sudo systemctl status mysql
```

**macOS with Homebrew:**
```bash
brew services start mysql
brew services list
```

**Windows:**
```cmd
net start MySQL80
```

### Frontend Not Loading
- Wait 5-10 seconds for Vite to compile
- Check console for errors in Frontend window
- View logs: `tail -f /tmp/tradelab-frontend.log`

---

## 💾 Backup Your Data

### Backup MySQL Database
```bash
mysqldump -u tradevault -p tradevault > tradevault-backup.sql
```

### Restore from Backup
```bash
mysql -u tradevault -p tradevault < tradevault-backup.sql
```

### Backup Screenshots
```bash
tar -czf screenshots-backup.tar.gz ~/TradeVault/screenshots/
```

---

## 🔐 Security Notes

⚠️ **Important:**
- These scripts use default credentials for local development
- Change `MYSQL_PASSWORD` before using in production
- Screenshots directory should be on secure local storage
- Database is not accessible from the internet (localhost only)

---

## 📚 Additional Resources

- **OFFLINE-SETUP.md** - Detailed setup instructions
- **SETUP-GUIDE.md** - Step-by-step configuration guide
- **SETUP-SCRIPTS-README.md** - Setup automation scripts reference

---

## ✅ Checklist After Running Launcher

- [ ] MySQL service is running
- [ ] Backend API is responding at http://localhost:3001/api/health
- [ ] Frontend loads at http://localhost:8081
- [ ] Can see trading accounts in the app
- [ ] Screenshots directory exists and is writable

---

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs:**
   ```bash
   tail -f /tmp/tradelab-backend.log
   tail -f /tmp/tradelab-frontend.log
   ```

2. **Verify services are running:**
   ```bash
   curl http://localhost:3001/api/health
   curl http://localhost:8081
   ```

3. **Check database connection:**
   ```bash
   mysql -u tradevault -p -e "SELECT COUNT(*) FROM tradevault.trades;"
   ```

4. **Review the setup documentation:**
   - See OFFLINE-SETUP.md for detailed information
   - See SETUP-GUIDE.md for troubleshooting

---

## 📦 Requirements

- **MySQL 8.0+** (with user `tradevault`)
- **Node.js 18+**
- **npm 8+** or **bun**
- **4GB RAM** minimum
- **500MB disk space** (plus screenshots storage)

---

Created: February 20, 2026  
Version: 1.0  
License: Proprietary
