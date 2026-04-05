@echo off
REM TradeVault Offline Setup Script for Windows
REM This script automates the complete offline setup process

setlocal enabledelayedexpansion

cls
echo ==================================================
echo   TradeVault Offline Setup Script
echo   Windows Version
echo ==================================================
echo.

REM Configuration
set /p MYSQL_ROOT_PASSWORD="Enter MySQL root password: "
set /p MYSQL_PASSWORD="Enter MySQL tradevault user password (default: kevin098): "
if "%MYSQL_PASSWORD%"=="" set MYSQL_PASSWORD=kevin098

set /p SCREENSHOTS_DIR="Enter path for screenshots directory (default: C:\TradeVault\screenshots): "
if "%SCREENSHOTS_DIR%"=="" set SCREENSHOTS_DIR=C:\TradeVault\screenshots

echo.
echo Configuration Summary:
echo MySQL Root Password: ****
echo MySQL User Password: ****
echo Screenshots Directory: %SCREENSHOTS_DIR%
echo.

REM Step 1: Clean node_modules and install dependencies
echo [1/8] Cleaning and installing dependencies...
if exist node_modules (
    for /d %%I in (node_modules\*) do (
        rmdir /s /q "%%I" 2>nul
    )
    rmdir /s /q node_modules 2>nul
)
call npm cache clean --force
call npm install
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)
echo [✓] Dependencies installed
echo.

REM Step 2: Create MySQL user and database
echo [2/8] Creating MySQL database and user...
mysql -u root -p%MYSQL_ROOT_PASSWORD% -e "CREATE USER IF NOT EXISTS 'tradevault'@'localhost' IDENTIFIED WITH mysql_native_password BY '%MYSQL_PASSWORD%';" >nul 2>&1
mysql -u root -p%MYSQL_ROOT_PASSWORD% -e "GRANT ALL PRIVILEGES ON tradevault.* TO 'tradevault'@'localhost'; FLUSH PRIVILEGES;" >nul 2>&1
echo [✓] MySQL user and database ready
echo.

REM Step 3: Setup server environment
echo [3/8] Configuring backend server...
cd server
if not exist .env (
    copy .env.example .env >nul
)

REM Update .env with correct credentials using PowerShell
powershell -NoProfile -Command ^
    "$content = Get-Content '.env'; " ^
    "$content = $content -replace 'MYSQL_USER=.*', 'MYSQL_USER=tradevault'; " ^
    "$content = $content -replace 'MYSQL_PASSWORD=.*', 'MYSQL_PASSWORD=%MYSQL_PASSWORD%'; " ^
    "$content = $content -replace 'SCREENSHOTS_DIR=.*', 'SCREENSHOTS_DIR=%SCREENSHOTS_DIR%'; " ^
    "Set-Content '.env' $content"

call npm install
if errorlevel 1 (
    echo Error: Failed to install server dependencies
    pause
    exit /b 1
)
echo [✓] Backend configured
cd ..
echo.

REM Step 4: Create screenshots directory
echo [4/8] Creating screenshots directory...
if not exist "%SCREENSHOTS_DIR%" (
    mkdir "%SCREENSHOTS_DIR%"
)
echo [✓] Screenshots directory created at: %SCREENSHOTS_DIR%
echo.

REM Step 5: Setup database schema
echo [5/8] Setting up database schema...
cd server
call npm run setup-db
if errorlevel 1 (
    echo Error: Failed to setup database
    pause
    exit /b 1
)
echo [✓] Database schema created
echo.

REM Step 6: Seed dummy data
echo [6/8] Seeding dummy data...
call node seed-dummy-data.js
if errorlevel 1 (
    echo Error: Failed to seed data
    pause
    exit /b 1
)
echo [✓] Dummy data seeded
cd ..
echo.

REM Step 7: Configure frontend
echo [7/8] Configuring frontend...
if not exist .env (
    (
        echo VITE_API_URL=http://localhost:3001
        echo VITE_API_MODE=offline
    ) > .env
) else (
    powershell -NoProfile -Command ^
        "$content = Get-Content '.env'; " ^
        "if ($content -match 'VITE_API_URL') { $content = $content -replace 'VITE_API_URL=.*', 'VITE_API_URL=http://localhost:3001' } else { $content += \"`nVITE_API_URL=http://localhost:3001\" }; " ^
        "if ($content -match 'VITE_API_MODE') { $content = $content -replace 'VITE_API_MODE=.*', 'VITE_API_MODE=offline' } else { $content += \"`nVITE_API_MODE=offline\" }; " ^
        "Set-Content '.env' $content"
)
echo [✓] Frontend configured
echo.

REM Step 8: Summary
echo ==================================================
echo   Setup Complete! [✓]
echo ==================================================
echo.
echo Next Steps:
echo 1. Start the backend server:
echo    cd server ^&^& npm start
echo.
echo 2. In a new terminal, start the frontend:
echo    npm run dev
echo.
echo 3. Open your browser to http://localhost:8081
echo.
echo Offline Setup Details:
echo   Backend API: http://localhost:3001
echo   Frontend: http://localhost:8081
echo   Database: MySQL (tradevault@localhost)
echo   Screenshots: %SCREENSHOTS_DIR%
echo.
echo Quick Start (All-in-One):
echo   start-servers.bat
echo.
pause
