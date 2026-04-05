@echo off
REM TradeVault Server Starter - Windows
REM Starts both backend and frontend servers

setlocal enabledelayedexpansion

cls
echo ==================================================
echo   TradeVault Offline - Starting Servers
echo ==================================================
echo.

REM Check if MySQL is running
echo Checking MySQL...
mysql -e "SELECT 1" >nul 2>&1
if errorlevel 1 (
    echo Error: MySQL is not running. Please start MySQL first.
    echo.
    echo You can start MySQL using:
    echo   - MySQL Installer/Services (search "Services" in Windows)
    echo   - Command line: net start MySQL80
    echo.
    pause
    exit /b 1
)
echo [✓] MySQL is running
echo.

REM Start backend
echo Starting Backend Server (port 3001)...
cd server
start "TradeVault Backend" cmd /k npm start
timeout /t 3 /nobreak
echo [✓] Backend started in new window
echo.

REM Start frontend
echo Starting Frontend Dev Server...
cd ..
start "TradeVault Frontend" cmd /k npm run dev
timeout /t 3 /nobreak
echo [✓] Frontend started in new window
echo.

REM Summary
echo ==================================================
echo   Servers Starting Successfully!
echo ==================================================
echo.
echo Access Your Application:
echo   Frontend: http://localhost:8081
echo   Backend API: http://localhost:3001
echo.
echo Two new terminal windows have been opened:
echo   - Backend Server (Backend window)
echo   - Frontend Dev Server (Frontend window)
echo.
echo To stop servers:
echo   Close the terminal windows or press Ctrl+C in each
echo.
pause
