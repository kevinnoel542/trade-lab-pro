# TradeVault Offline Setup Guide

Complete automated setup scripts for TradeVault offline mode on Windows and Linux/Mac.

## 📋 Prerequisites

Before running the setup scripts, ensure you have:

1. **Node.js** (v16+) - [Download](https://nodejs.org/)
2. **MySQL Server** (v8.0+) - [Download](https://dev.mysql.com/downloads/mysql/)
3. **Git** (optional, but recommended)

### Installation Verification

```bash
# Check Node.js
node --version
npm --version

# Check MySQL
mysql --version
```

---

## 🚀 Quick Setup (Recommended)

### For Linux/Mac

1. **Make the setup script executable:**
   ```bash
   chmod +x setup-offline.sh
   ```

2. **Run the setup script:**
   ```bash
   ./setup-offline.sh
   ```

3. **Follow the prompts** to enter:
   - MySQL root password
   - MySQL tradevault user password (default: `kevin098`)
   - Screenshots directory path (default: `~/TradeVault/screenshots`)

### For Windows

1. **Open Command Prompt** as Administrator

2. **Navigate to the project directory:**
   ```cmd
   cd path\to\trade-lab-pro-main
   ```

3. **Run the setup script:**
   ```cmd
   setup-offline.bat
   ```

4. **Follow the prompts** to enter the same information as above

---

## ✅ What the Setup Scripts Do

The automation scripts perform all these steps automatically:

1. ✓ Clean and reinstall Node.js dependencies
2. ✓ Create MySQL database user (`tradevault`)
3. ✓ Create database schema with all tables
4. ✓ Create screenshots directory
5. ✓ Configure backend `.env` file
6. ✓ Configure frontend `.env` file
7. ✓ Seed dummy trading data
8. ✓ Verify API connectivity

---

## 🎯 Starting the Application

### Automated Start (Recommended)

After setup is complete, use the server starter scripts:

**Linux/Mac:**
```bash
chmod +x start-servers.sh
./start-servers.sh
```

**Windows:**
```cmd
start-servers.bat
```

This will:
- Start the backend API server (port 3001)
- Start the frontend dev server (port 8081)
- Display URLs to access your application

### Manual Start

If you prefer to start servers manually:

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

## 🌐 Access Your Application

Once servers are running, open your browser to:

**Frontend:** http://localhost:8081

You should see:
- Two trading accounts with dummy data
- 24 pre-loaded trades with CRT analysis
- Full trading interface ready to use

**API Documentation:** http://localhost:3001/api/

---

## 📁 Directory Structure After Setup

```
trade-lab-pro-main/
├── server/
│   ├── .env                    (Backend configuration)
│   ├── db.js                   (Database connection)
│   └── index.js                (Express server)
├── src/
│   ├── components/             (React components)
│   ├── hooks/                  (Custom hooks)
│   └── lib/api.ts              (API client)
├── .env                        (Frontend configuration)
├── setup-offline.sh/bat        (Setup automation)
└── start-servers.sh/bat        (Server launcher)

~/TradeVault/screenshots/       (Local screenshot storage)
└── 2026/02/20/120000/...      (Organized by date/time)
```

---

## 🔧 Configuration Files

### Backend (.env in server/)
```env
MYSQL_HOST=localhost
MYSQL_PORT=3001
MYSQL_USER=tradevault
MYSQL_PASSWORD=kevin098
MYSQL_DATABASE=tradevault
SCREENSHOTS_DIR=/home/kevin/TradeVault/screenshots
PORT=3001
NODE_ENV=development
```

### Frontend (.env in root)
```env
VITE_API_URL=http://localhost:3001
VITE_API_MODE=offline
```

---

## 📊 Database Schema

The setup creates these tables automatically:

- `trading_accounts` - Your trading accounts
- `account_transactions` - Deposits and withdrawals
- `trades` - Trade entries with full CRT analysis
- `key_levels` - Support/resistance levels (OB, FVG, RB, BB)
- `liquidity_context` - Market liquidity analysis
- `sessions` - Trading sessions
- `emotions` - Trade emotions/psychology
- `screenshots` - Trade screenshots metadata
- `strategy_versions` - Strategy versioning

---

## 🐛 Troubleshooting

### MySQL Connection Error
**Error:** `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Solution:**
- Ensure MySQL server is running
- Check MySQL credentials in `server/.env`
- Verify MySQL is listening on port 3306

**Mac:** `brew services start mysql`
**Linux:** `sudo systemctl start mysql`
**Windows:** Search "Services" and start MySQL

### Port Already in Use
**Error:** `Error: listen EADDRINUSE :::3001`

**Solution:**
- Change the port in `server/.env` or `server/index.js`
- Or kill the existing process:
  ```bash
  # Find process using port 3001
  lsof -i :3001
  # Kill it
  kill -9 <PID>
  ```

### npm install Fails
**Error:** Directory conflicts in node_modules

**Solution:**
```bash
# Clean everything
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Screenshots Directory Doesn't Exist
**Error:** `ENOENT: no such file or directory`

**Solution:**
- Verify the path in `server/.env` exists
- Ensure proper permissions to create/write to directory
- Create manually:
  ```bash
  mkdir -p ~/TradeVault/screenshots
  chmod 755 ~/TradeVault/screenshots
  ```

---

## 📝 Dummy Data Included

After setup, you have:

**Trading Accounts:**
1. FTMO Challenge - $100,000 starting capital
2. Personal Live - $5,000 starting capital

**Sample Trades:**
- 16 closed trades (8 wins, 3 losses per account)
- 2 open trades
- Full CRT analysis on each trade
- Screenshots metadata ready

---

## 🔄 Resetting the Setup

To completely reset and start over:

```bash
# Mac/Linux
rm -rf ~/TradeVault/screenshots
mysql -u root -p -e "DROP DATABASE tradevault;"
rm server/.env .env

# Then run setup again
./setup-offline.sh
```

```cmd
REM Windows
rmdir /s /q C:\TradeVault\screenshots
mysql -u root -p -e "DROP DATABASE tradevault;"
del server\.env .env

REM Then run setup again
setup-offline.bat
```

---

## 🚀 Production Deployment

For production deployment:

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Use PM2 or similar for process management:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name "tradevault-api"
   pm2 start "npm run preview" --name "tradevault-frontend"
   ```

3. Backup your database regularly:
   ```bash
   mysqldump -u tradevault -p tradevault > backup.sql
   ```

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the OFFLINE-SETUP.md for detailed setup info
3. Check server logs: `server/index.js` output
4. Check browser console for frontend errors

---

## 📄 License

Part of the TradeVault offline setup automation suite.
