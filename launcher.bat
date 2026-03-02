@echo off
REM ============================================================================
REM TradeVault Offline - Complete Launcher Script (Windows)
REM Starts MySQL, Backend Server, and Frontend Dev Server
REM Usage: launcher.bat
REM ============================================================================

setlocal enabledelayedexpansion

REM Color codes
set GREEN=[92m
set YELLOW=[93m
set RED=[91m
set BLUE=[94m
set NC=[0m

REM Configuration
set MYSQL_USER=tradevault
set MYSQL_PASSWORD=kevin098
set MYSQL_HOST=localhost
set MYSQL_PORT=3306
set DB_NAME=tradevault
set BACKEND_PORT=3001
set FRONTEND_PORT=8081
set SCREENSHOTS_DIR=%USERPROFILE%\TradeVault\screenshots

REM Title
title TradeVault Offline - Launcher
cls

echo.
echo ========================================================================
echo          TradeVault Offline - Complete Launcher (Windows)
echo     MySQL + Backend Server + Frontend Dev Server
echo ========================================================================
echo.

REM ============================================================================
REM Step 1: Check Prerequisites
REM ============================================================================

echo [1/5] Checking prerequisites...

REM Check if MySQL is installed
mysql --version >nul 2>&1
if errorlevel 1 (
    echo %RED%ERROR: MySQL is not installed or not in PATH%NC%
    echo Please install MySQL 8.0+ and add it to your PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%ERROR: Node.js is not installed%NC%
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo %RED%ERROR: npm is not installed%NC%
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo %GREEN%✓ Node.js %NODE_VERSION%%NC%
echo %GREEN%✓ npm %NPM_VERSION%%NC%
echo %GREEN%✓ MySQL installed%NC%
echo.

REM ============================================================================
REM Step 2: Create Screenshots Directory
REM ============================================================================

echo [2/5] Creating screenshots directory...

if not exist "%SCREENSHOTS_DIR%" (
    mkdir "%SCREENSHOTS_DIR%"
    echo %GREEN%✓ Created directory: %SCREENSHOTS_DIR%%NC%
) else (
    echo %GREEN%✓ Directory exists: %SCREENSHOTS_DIR%%NC%
)
echo.

REM ============================================================================
REM Step 3: Start MySQL Service
REM ============================================================================

echo [3/5] Starting MySQL service...

REM Check if MySQL is running
mysql -u%MYSQL_USER% -p%MYSQL_PASSWORD% -h%MYSQL_HOST% -P%MYSQL_PORT% -e "SELECT 1" >nul 2>&1
if errorlevel 0 (
    echo %GREEN%✓ MySQL is already running%NC%
) else (
    echo Attempting to start MySQL service...
    
    REM Try to start MySQL service
    net start MySQL80 >nul 2>&1
    if errorlevel 0 (
        echo %GREEN%✓ Started MySQL service%NC%
        timeout /t 2 /nobreak >nul
    ) else (
        echo %YELLOW%WARNING: Could not start MySQL service (may already be running)%NC%
    )
)

REM Verify connection
timeout /t 2 /nobreak >nul
mysql -u%MYSQL_USER% -p%MYSQL_PASSWORD% -h%MYSQL_HOST% -P%MYSQL_PORT% -e "SELECT 1" >nul 2>&1
if errorlevel 1 (
    echo %RED%ERROR: Could not connect to MySQL%NC%
    echo Please ensure MySQL is running with the correct credentials
    pause
    exit /b 1
)

echo %GREEN%✓ MySQL connection verified%NC%
echo.

REM ============================================================================
REM Step 4: Start Backend Server
REM ============================================================================

echo [4/5] Starting Backend Server (port %BACKEND_PORT%)...

REM Check if port is in use and kill if necessary
netstat -ano | find ":%BACKEND_PORT%" >nul
if errorlevel 0 (
    echo %YELLOW%WARNING: Port %BACKEND_PORT% is already in use%NC%
    set /p KILL_BACKEND="Kill existing process? (y/n): "
    if /i "!KILL_BACKEND!"=="y" (
        taskkill /F /IM node.exe >nul 2>&1
        timeout /t 1 /nobreak >nul
    ) else (
        echo Skipping backend start
    )
)

REM Install dependencies
cd server
echo Installing dependencies...
npm install --silent >nul 2>&1

REM Start backend server
echo Starting backend server...
start "TradeVault Backend" npm start
timeout /t 3 /nobreak >nul

REM Check if backend is responding
curl -s http://localhost:%BACKEND_PORT%/api/health >nul 2>&1
if errorlevel 0 (
    echo %GREEN%✓ Backend running (port %BACKEND_PORT%)%NC%
    echo %GREEN%  API: http://localhost:%BACKEND_PORT%%NC%
) else (
    echo %YELLOW%WARNING: Backend may still be starting...%NC%
)

cd ..
echo.

REM ============================================================================
REM Step 5: Start Frontend Dev Server
REM ============================================================================

echo [5/5] Starting Frontend Dev Server (port %FRONTEND_PORT%)...

REM Check if port is in use
netstat -ano | find ":%FRONTEND_PORT%" >nul
if errorlevel 0 (
    echo %YELLOW%WARNING: Port %FRONTEND_PORT% is already in use%NC%
    set /p KILL_FRONTEND="Kill existing process? (y/n): "
    if /i "!KILL_FRONTEND!"=="y" (
        taskkill /F /IM node.exe >nul 2>&1
        timeout /t 1 /nobreak >nul
    ) else (
        echo Skipping frontend start
    )
)

REM Install dependencies
echo Installing dependencies...
npm install --silent >nul 2>&1

REM Start frontend server
echo Starting frontend dev server...
start "TradeVault Frontend" npm run dev
timeout /t 5 /nobreak >nul

REM Check if frontend is responding
curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
if errorlevel 0 (
    echo %GREEN%✓ Frontend running (port %FRONTEND_PORT%)%NC%
    echo %GREEN%  URL: http://localhost:%FRONTEND_PORT%%NC%
) else (
    echo %YELLOW%WARNING: Frontend may still be starting...%NC%
)

echo.

REM ============================================================================
REM Final Status
REM ============================================================================

cls
echo.
echo ========================================================================
echo                    ^!^!^! STARTUP COMPLETE ^!^!^!
echo ========================================================================
echo.

echo %GREEN%MySQL Database:%NC%
echo   Host: %MYSQL_HOST%:%MYSQL_PORT%
echo   User: %MYSQL_USER%
echo   Database: %DB_NAME%
echo.

echo %GREEN%Backend API:%NC%
echo   URL: http://localhost:%BACKEND_PORT%
echo   Health: http://localhost:%BACKEND_PORT%/api/health
echo.

echo %GREEN%Frontend Application:%NC%
echo   URL: http://localhost:%FRONTEND_PORT%
echo.

echo %GREEN%Screenshots Directory:%NC%
echo   Path: %SCREENSHOTS_DIR%
echo.

echo %YELLOW%Open these in your browser:%NC%
echo   Frontend: http://localhost:%FRONTEND_PORT%
echo   Backend API: http://localhost:%BACKEND_PORT%/api/accounts
echo.

echo %YELLOW%To stop all services:%NC%
echo   1. Close the Backend window (or press Ctrl+C)
echo   2. Close the Frontend window (or press Ctrl+C)
echo.

echo %YELLOW%To view all open windows:%NC%
echo   Alt+Tab to switch between Backend and Frontend windows
echo.

echo %YELLOW%Note: Keep this window open while services are running%NC%
echo.

pause
endlocal
