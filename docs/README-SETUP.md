# 🚀 TradeVault Offline Setup - Quick Start Guide

Welcome! Your TradeVault offline setup is **complete and running**. This guide will help you get started.

## ⚡ Quick Access

| Document | Purpose |
|----------|---------|
| **SETUP-COMPLETE-REPORT.md** | 📊 Status report & what was done |
| **SETUP-SCRIPTS-README.md** | 📖 Complete script reference |
| **SETUP-GUIDE.md** | 📚 Detailed setup documentation |
| **SCRIPTS-SUMMARY.txt** | 🎯 Quick reference card |
| **OFFLINE-SETUP.md** | 📋 Original offline setup guide |

---

## 🎯 Start Using TradeVault Now

### Current Status: ✅ Everything Running

**Backend API:** http://localhost:3001  
**Frontend:** http://localhost:8081

### What to Do Next

1. **Open your browser:**
   ```
   http://localhost:8081
   ```

2. **See your trading data:**
   - 2 trading accounts (FTMO Challenge + Personal Live)
   - 24 pre-loaded trades with CRT analysis
   - Full trade management interface

3. **Create your first trade:**
   - Click "New Trade"
   - Enter trade details with CRT analysis
   - Upload a screenshot (saved to ~/TradeVault/screenshots/)
   - Submit and track

---

## 💾 Daily Startup

After your initial setup, just run this command each time you want to use TradeVault:

### Windows
```cmd
start-servers.bat
```

### Mac/Linux
```bash
./start-servers.sh
```

Then open http://localhost:8081 in your browser.

---

## ⚙️ Configure Settings

Need to change ports, database credentials, or screenshot directory?

### Windows
```cmd
configure-env.bat
```

### Mac/Linux
```bash
./configure-env.sh
```

---

## 📚 Documentation Map

### For Different Needs:

**"I want to understand what was set up"**
→ Read **SETUP-COMPLETE-REPORT.md**

**"I need help using the scripts"**
→ Read **SETUP-SCRIPTS-README.md**

**"I want detailed setup instructions"**
→ Read **SETUP-GUIDE.md**

**"I need a quick reference"**
→ Read **SCRIPTS-SUMMARY.txt**

**"I want the original offline setup details"**
→ Read **OFFLINE-SETUP.md**

---

## 🔧 What's Available

### Setup Scripts (Already Created)

**One-Time Setup:**
- `setup-offline.sh` (Mac/Linux)
- `setup-offline.bat` (Windows)

**Daily Startup:**
- `start-servers.sh` (Mac/Linux)
- `start-servers.bat` (Windows)

**Configuration:**
- `configure-env.sh` (Mac/Linux)
- `configure-env.bat` (Windows)

### Database

**Credentials:**
- Host: localhost
- Database: tradevault
- User: tradevault
- Password: kevin098

**Tables:** trades, accounts, transactions, key_levels, liquidity_context, sessions, emotions, screenshots, strategy_versions

**Dummy Data:** 2 accounts, 24 trades (ready to use)

### Storage

**Screenshots Directory:** ~/TradeVault/screenshots/
- Automatically organized by date/time
- Full local control over your data

---

## ✅ Verification

Everything is ready. To verify:

1. **Check Backend:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok","database":"connected"}`

2. **Check Frontend:**
   Open http://localhost:8081 in browser

3. **Check Database:**
   ```bash
   mysql -u tradevault -p
   # Password: kevin098
   # Then: use tradevault;
   # Then: show tables;
   ```

---

## 🆘 Need Help?

### Common Issues

**MySQL not running?**
- Mac: `brew services start mysql`
- Linux: `sudo systemctl start mysql`
- Windows: Search "Services" and start MySQL

**Port already in use?**
- Use `configure-env.sh/bat` to change ports
- Or: Close other apps using that port

**Scripts won't run?**
- Make sure they're executable: `chmod +x *.sh`
- Run in correct directory (project root)

**API not responding?**
- Check backend is running: `ps aux | grep node`
- Check MySQL is running
- Check `.env` files have correct credentials

### Get More Help

- See "Troubleshooting" in **SETUP-GUIDE.md**
- Check script comments for detailed info
- Review error messages carefully

---

## 📦 What You Have

✅ **Complete Offline Trading Journal**
- No cloud required
- Full CRT model
- Trade analysis & tracking
- Screenshot storage
- Account management
- Performance analytics
- Complete privacy (all local data)

✅ **Fully Automated Setup**
- One-command installation
- Cross-platform (Windows, Mac, Linux)
- Interactive configuration
- Daily quick-start scripts

✅ **Production Ready**
- Clean, documented code
- Proper database schema
- Error handling included
- Ready to extend

---

## 🎓 Learn More

### File Structure
```
project-root/
├── setup-offline.sh/bat     ← Full setup
├── start-servers.sh/bat     ← Daily startup
├── configure-env.sh/bat     ← Configuration
├── SETUP-COMPLETE-REPORT.md ← What was done
├── SETUP-SCRIPTS-README.md  ← Script guide
├── SETUP-GUIDE.md           ← Detailed docs
├── README-SETUP.md          ← This file
└── [more project files...]
```

### Key Directories
- `server/` - Backend API (Express.js)
- `src/` - Frontend (React)
- `~/TradeVault/screenshots/` - Your screenshots

---

## 🚀 Next Steps

1. ✅ **You are here:** Reading this guide
2. 🌐 **Open the app:** http://localhost:8081
3. 📊 **Explore your data:** View accounts and trades
4. ✏️ **Create a trade:** Test the full workflow
5. 💾 **Backup regularly:** Keep your data safe

---

## 📞 Quick Reference

| Task | Command (Mac/Linux) | Command (Windows) |
|------|-------------------|-----------------|
| Start servers | `./start-servers.sh` | `start-servers.bat` |
| Configure | `./configure-env.sh` | `configure-env.bat` |
| Full setup | `./setup-offline.sh` | `setup-offline.bat` |
| Test API | `curl http://localhost:3001/api/health` | `curl http://localhost:3001/api/health` |
| Open app | Browser: http://localhost:8081 | Browser: http://localhost:8081 |
| Check MySQL | `mysql -u tradevault -p` | `mysql -u tradevault -p` |

---

## 🎉 You're All Set!

Your TradeVault offline setup is complete and running. 

**Start trading now:** http://localhost:8081

Questions? Check the documentation files listed at the top.

Enjoy! 🚀

---

**Version:** 1.0  
**Setup Date:** February 20, 2026  
**Status:** ✅ Complete & Running
