# TradeVault Offline - Quick Start Guide

## 🚀 One-Command Startup

### Linux/macOS
```bash
./launcher.sh
```

### Windows
```bash
launcher.bat
```

That's it! The launcher will:
1. ✅ Start MySQL database
2. ✅ Install dependencies (backend & frontend)
3. ✅ Start Backend API (port 3001)
4. ✅ Start Frontend Dev Server (port 8081)
5. ✅ Verify everything is working

---

## 📱 Access Your App

Once the launcher completes, open your browser:

**Frontend Application:** http://localhost:8081

You should see:
- Trading accounts (FTMO Challenge, Personal Live)
- 24 sample trades with CRT analysis
- Performance summary
- Trade form to add new trades

---

## 🔌 Available Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:8081 | Main trading journal app |
| Backend API | http://localhost:3001 | REST API for data |
| API Health | http://localhost:3001/api/health | Check API status |
| Accounts API | http://localhost:3001/api/accounts | List trading accounts |
| Trades API | http://localhost:3001/api/trades | List all trades |

---

## 💾 Your Data

**Database:** tradevault (MySQL)
- User: `tradevault`
- Password: `kevin098`
- Host: localhost:3306

**Screenshots:** ~/TradeVault/screenshots/
- Auto-organized by date and time
- Stores all uploaded trade screenshots

---

## 🛑 Stop Services

### Linux/macOS
Press `Ctrl+C` in the launcher terminal

### Windows
Press `Ctrl+C` in the Backend or Frontend window

---

## 📚 Full Documentation

- **LAUNCHER-README.md** - Complete launcher guide with troubleshooting
- **OFFLINE-SETUP.md** - Detailed offline setup instructions
- **SETUP-GUIDE.md** - Configuration and customization guide

---

## ⚡ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+C | Stop services (in terminal) |
| Alt+Tab | Switch between Backend/Frontend windows (Windows) |

---

## 🔍 Quick Checks

### Verify Backend is Running
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok","database":"connected"}
```

### Verify Frontend is Running
```bash
curl http://localhost:8081 | head -20
# Should return HTML content
```

### Check MySQL Connection
```bash
mysql -u tradevault -p -e "SELECT COUNT(*) as trades FROM tradevault.trades;"
# Should return: 24
```

---

## ⚙️ Customization

To change ports, database credentials, or screenshot directory, edit:

- **launcher.sh** (Linux/macOS) - Lines 23-30
- **launcher.bat** (Windows) - Lines 17-24

Then run the launcher again.

---

## 🆘 Common Issues

### MySQL Not Running
```bash
# macOS with Homebrew
brew services start mysql

# Linux with systemd
sudo systemctl start mysql

# Windows
net start MySQL80
```

### Port Already in Use
Launcher will ask if you want to kill the existing process. Select "y" to proceed.

### npm Install Takes Too Long
This is normal on first run. It downloads all dependencies (~500MB). Subsequent runs will be much faster.

---

## 📊 Sample Data

The launcher seeds your database with:
- **2 Trading Accounts:** FTMO Challenge & Personal Live
- **24 Trades:** Full CRT analysis with entry/exit details
- **Ready to Use:** No additional setup needed

---

## 🎓 Next Steps

1. **Explore the App** - Check out the sample trades and features
2. **Create a Trade** - Use the trade form to add your first manual trade
3. **Upload Screenshots** - Add trade screenshots for reference
4. **View Analytics** - Check performance metrics and statistics
5. **Customize** - Modify accounts, add more trades, customize settings

---

## 📞 Need Help?

1. Check **LAUNCHER-README.md** for detailed troubleshooting
2. Review **OFFLINE-SETUP.md** for setup questions
3. View logs in `/tmp/tradelab-*.log` for errors

---

**Created:** February 20, 2026  
**Version:** 1.0  
**Status:** ✅ Ready to Use
