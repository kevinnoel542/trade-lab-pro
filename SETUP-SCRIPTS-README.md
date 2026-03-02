# TradeVault Setup Automation Scripts

Complete automation for offline setup on Windows and Linux/Mac. These scripts handle all the heavy lifting for configuring and running TradeVault.

## 📦 What's Included

| Script | Windows | Mac/Linux | Purpose |
|--------|---------|-----------|---------|
| `setup-offline` | `.bat` | `.sh` | **Full automated setup** - Database, configs, seed data |
| `start-servers` | `.bat` | `.sh` | **Quick server startup** - Backend + Frontend in one command |
| `configure-env` | `.bat` | `.sh` | **Advanced configuration** - Interactive .env editor |

---

## 🚀 Quick Start (Easiest)

### Step 1: Run Full Setup
Choose the version for your operating system:

**Windows:**
```cmd
setup-offline.bat
```

**Mac/Linux:**
```bash
chmod +x setup-offline.sh
./setup-offline.sh
```

### Step 2: Start Servers
After setup completes, run:

**Windows:**
```cmd
start-servers.bat
```

**Mac/Linux:**
```bash
./start-servers.sh
```

### Step 3: Access Application
Open your browser:
```
http://localhost:8081
```

That's it! Your TradeVault is ready to use. 🎉

---

## 📋 Detailed Usage

### `setup-offline.sh` / `setup-offline.bat`
**Complete automated setup script**

Performs all these steps automatically:
- ✅ Cleans node_modules and reinstalls dependencies
- ✅ Creates MySQL database and user
- ✅ Sets up database schema with all tables
- ✅ Creates screenshots directory
- ✅ Configures backend `.env`
- ✅ Configures frontend `.env`
- ✅ Seeds dummy trading data
- ✅ Verifies API connectivity

**Usage:**
```bash
# Linux/Mac
./setup-offline.sh

# Windows
setup-offline.bat
```

**What It Asks For:**
1. MySQL root password (your MySQL admin password)
2. MySQL tradevault user password (default: `kevin098`)
3. Screenshots directory path (default: `~/TradeVault/screenshots`)

**Time to Complete:** ~5-10 minutes (first run)

**Output:**
```
Configuration Summary:
MySQL Root Password: ****
MySQL User Password: ****
Screenshots Directory: /home/user/TradeVault/screenshots

[1/8] Cleaning and installing dependencies...
[2/8] Creating MySQL database and user...
[3/8] Configuring backend server...
[4/8] Creating screenshots directory...
[5/8] Setting up database schema...
[6/8] Seeding dummy data...
[7/8] Configuring frontend...
[8/8] Verifying API connection...

Setup Complete! ✓

Next Steps:
1. Start the backend server:
   cd server && npm start

2. In a new terminal, start the frontend:
   npm run dev

3. Open your browser to http://localhost:8081
```

---

### `start-servers.sh` / `start-servers.bat`
**Quick server startup script**

Starts both backend and frontend servers with a single command.

**Usage:**
```bash
# Linux/Mac
./start-servers.sh

# Windows
start-servers.bat
```

**What It Does:**
- Checks if MySQL is running
- Starts backend API server on port 3001
- Starts frontend dev server on port 8081
- Displays URLs and process information

**Output:**
```
==================================================
  Servers Running Successfully!
==================================================

Access Your Application:
  Frontend: http://localhost:8081
  Backend API: http://localhost:3001

Running Processes:
  Backend (PID: 1234)
  Frontend (PID: 5678)

To stop servers:
  Press Ctrl+C
```

**Linux/Mac:** Runs servers in foreground (press Ctrl+C to stop)
**Windows:** Opens new terminal windows for each server (close them to stop)

---

### `configure-env.sh` / `configure-env.bat`
**Interactive environment configuration wizard**

Advanced tool for customizing .env files without manual editing.

**Usage:**
```bash
# Linux/Mac
./configure-env.sh

# Windows
configure-env.bat
```

**Menu Options:**
1. **Configure Backend** - Customize MySQL, ports, directories
2. **Configure Frontend** - Set API URL and mode
3. **Configure Both** - Configure both at once
4. **View Current Configuration** - Display current .env contents
5. **Reset to Defaults** - Restore default configuration
6. **Exit** - Close the wizard

**Example Workflow:**
```
Configuration Options:
1. Configure Backend (.env)
2. Configure Frontend (.env)
3. Configure Both
4. View Current Configuration
5. Reset to Defaults
6. Exit

Select an option (1-6): 1

Configuring Backend Server
MySQL Host (default: localhost): localhost
MySQL Port (default: 3306): 3306
MySQL User (default: tradevault): tradevault
MySQL Password (default: kevin098): kevin098
MySQL Database (default: tradevault): tradevault
Server Port (default: 3001): 3001
Screenshots Directory (default: ~/TradeVault/screenshots): ~/TradeVault/screenshots
Environment (development/production, default: development): development

✓ Backend configuration saved
✓ Screenshots directory created/verified
```

---

## 🔄 Common Workflows

### First Time Setup (Complete)
```bash
# 1. Run full setup
./setup-offline.sh (or setup-offline.bat)

# 2. Start servers
./start-servers.sh (or start-servers.bat)

# 3. Open browser to http://localhost:8081
```

### Reconfigure After Initial Setup
```bash
# Use the configuration wizard
./configure-env.sh (or configure-env.bat)

# Then restart servers
./start-servers.sh (or start-servers.bat)
```

### Reset Everything to Defaults
```bash
# Reset configuration
./configure-env.sh
# Select option 5: Reset to Defaults

# Or manually
rm server/.env .env
./configure-env.sh
```

### Change Database Credentials
```bash
# Use configuration wizard
./configure-env.sh
# Select option 1: Configure Backend
# Update MySQL User/Password
# Restart servers: ./start-servers.sh
```

### Use Different Screenshots Directory
```bash
./configure-env.sh
# Select option 1 or 3: Configure Backend
# Update Screenshots Directory
```

---

## 🔧 What Each Script Modifies

### `setup-offline.sh/bat` Creates/Modifies:
```
server/.env                 (Backend configuration)
.env                        (Frontend configuration)
~/TradeVault/screenshots/   (Screenshots directory)
MySQL Database:
  - tradevault (database)
  - tradevault@localhost (user)
  - trading_accounts table
  - account_transactions table
  - trades table
  - (and other core tables)
```

### `start-servers.sh/bat` Starts:
```
Backend: node server/index.js (port 3001)
Frontend: npm run dev (port 8081)
```

### `configure-env.sh/bat` Modifies:
```
server/.env  (backend configuration)
.env         (frontend configuration)
```

---

## ✅ Verification Checklist

After running the scripts, verify everything works:

- [ ] MySQL is running and accessible
- [ ] Backend API responds at `http://localhost:3001/api/health`
- [ ] Frontend loads at `http://localhost:8081`
- [ ] You can see trading accounts and trades in the UI
- [ ] Screenshots directory exists and is writable
- [ ] No errors in browser console (F12)
- [ ] No errors in terminal output

**Quick Test:**
```bash
# Test backend
curl http://localhost:3001/api/health

# Should return:
# {"status":"ok","database":"connected"}
```

---

## 🐛 Troubleshooting

### MySQL Not Found
**Error:** `mysql: command not found`
- MySQL is not installed or not in PATH
- Install MySQL from https://dev.mysql.com/downloads/mysql/
- Add MySQL to system PATH

### MySQL Connection Refused
**Error:** `Error: connect ECONNREFUSED 127.0.0.1:3306`
- MySQL server is not running
- **Mac:** `brew services start mysql`
- **Linux:** `sudo systemctl start mysql`
- **Windows:** Start MySQL from Services

### Port Already in Use
**Error:** `Error: listen EADDRINUSE :::3001`
- Another process is using port 3001
- Change port in `configure-env.sh/bat`
- Or stop the conflicting process: `lsof -i :3001 | kill -9 <PID>`

### npm install Fails
**Error:** `npm ERR! code ENOTEMPTY`
- Corrupted node_modules directory
- Scripts automatically clean this up
- Manual fix: `rm -rf node_modules && npm install`

### Permission Denied
**Error:** `Permission denied: ./setup-offline.sh`
- Script is not executable on Mac/Linux
- Fix: `chmod +x setup-offline.sh`

### Screenshots Directory Not Writable
**Error:** `EACCES: permission denied`
- Directory doesn't exist or insufficient permissions
- Script creates it automatically
- Manual fix: `mkdir -p ~/TradeVault/screenshots && chmod 755 ~/TradeVault/screenshots`

---

## 📁 Directory Structure After Setup

```
trade-lab-pro-main/
├── setup-offline.sh
├── setup-offline.bat
├── start-servers.sh
├── start-servers.bat
├── configure-env.sh
├── configure-env.bat
├── SETUP-SCRIPTS-README.md
├── SETUP-GUIDE.md
│
├── server/
│   ├── .env                    (Created by setup)
│   ├── index.js                (Backend server)
│   ├── db.js                   (Database connection)
│   └── ...
│
├── src/
│   ├── components/
│   ├── hooks/
│   └── lib/api.ts              (API client)
│
├── .env                        (Created by setup)
├── package.json
└── ...

~/TradeVault/screenshots/       (Created by setup)
└── 2026/02/20/120000/...       (Screenshot storage)
```

---

## 🔒 Security Notes

### Default Passwords
- The scripts use `kevin098` as the default MySQL password
- **For production:** Change these in `configure-env.sh/bat`
- Never commit passwords to git (`.env` is in `.gitignore`)

### MySQL User Privileges
- Scripts create `tradevault@localhost` user with full privileges on `tradevault` database
- This user can only connect from localhost (not from internet)
- Safe for local development

---

## 📊 Database Details

The setup creates these tables:
- `trading_accounts` - Your trading accounts
- `account_transactions` - Deposits/withdrawals
- `trades` - Trade entries with CRT analysis
- `key_levels` - Support/resistance levels
- `liquidity_context` - Market liquidity data
- `sessions` - Trading sessions
- `emotions` - Trade emotions
- `screenshots` - Screenshot metadata
- `strategy_versions` - Strategy versioning

---

## 🚀 Advanced Usage

### Run Setup Without Interaction
Pre-set environment variables:
```bash
MYSQL_ROOT_PASSWORD=yourpass \
MYSQL_PASSWORD=userpass \
SCREENSHOTS_DIR=/custom/path \
./setup-offline.sh
```

### Custom Ports
```bash
./configure-env.sh
# Select option 1: Configure Backend
# Change Server Port to desired value
```

### Different Database
Modify in `configure-env.sh/bat`:
- MySQL Host
- MySQL Port
- Database name

### Production Deployment
```bash
# 1. Use configure-env
./configure-env.sh
# Select option 1
# Set Node_ENV to "production"
# Use strong password

# 2. Build frontend
npm run build

# 3. Use PM2 or similar for process management
```

---

## 📞 Support & Documentation

- **Quick Setup:** See section above
- **Detailed Guide:** Read `SETUP-GUIDE.md`
- **Offline Setup Details:** Read `OFFLINE-SETUP.md`
- **Troubleshooting:** See "Troubleshooting" section above

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 20, 2026 | Initial scripts created |

---

## 📄 License

Part of the TradeVault offline setup automation suite.

---

## ✨ Quick Reference

| Need | Command |
|------|---------|
| **First setup** | `./setup-offline.sh` or `setup-offline.bat` |
| **Start servers** | `./start-servers.sh` or `start-servers.bat` |
| **Configure .env** | `./configure-env.sh` or `configure-env.bat` |
| **Reset config** | `./configure-env.sh` → Option 5 |
| **Test API** | `curl http://localhost:3001/api/health` |
| **Open app** | Browser: `http://localhost:8081` |
| **Stop servers** | `Ctrl+C` in terminal/window |

Enjoy using TradeVault! 🚀
