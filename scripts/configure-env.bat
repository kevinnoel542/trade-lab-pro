@echo off
REM TradeVault Environment Configuration Wizard - Windows
REM Interactive configuration for .env files

setlocal enabledelayedexpansion

cls
echo ==================================================
echo   TradeVault Environment Configuration Wizard
echo ==================================================
echo.

:menu
cls
echo Configuration Options:
echo 1. Configure Backend (.env)
echo 2. Configure Frontend (.env)
echo 3. Configure Both
echo 4. View Current Configuration
echo 5. Reset to Defaults
echo 6. Exit
echo.
set /p option="Select an option (1-6): "
echo.

if "%option%"=="1" goto backend_config
if "%option%"=="2" goto frontend_config
if "%option%"=="3" goto both_config
if "%option%"=="4" goto view_config
if "%option%"=="5" goto reset_config
if "%option%"=="6" goto end
echo Invalid option. Please try again.
timeout /t 2 /nobreak
goto menu

:backend_config
cls
echo Configuring Backend Server
echo.
set /p mysql_host="MySQL Host (default: localhost): "
if "%mysql_host%"=="" set mysql_host=localhost

set /p mysql_port="MySQL Port (default: 3306): "
if "%mysql_port%"=="" set mysql_port=3306

set /p mysql_user="MySQL User (default: tradevault): "
if "%mysql_user%"=="" set mysql_user=tradevault

set /p mysql_password="MySQL Password (default: kevin098): "
if "%mysql_password%"=="" set mysql_password=kevin098

set /p mysql_db="MySQL Database (default: tradevault): "
if "%mysql_db%"=="" set mysql_db=tradevault

set /p server_port="Server Port (default: 3001): "
if "%server_port%"=="" set server_port=3001

set /p screenshots_dir="Screenshots Directory (default: C:\TradeVault\screenshots): "
if "%screenshots_dir%"=="" set screenshots_dir=C:\TradeVault\screenshots

set /p node_env="Environment (development/production, default: development): "
if "%node_env%"=="" set node_env=development

echo.
echo Updating server\.env...
cd server

if not exist .env (
    copy .env.example .env >nul
)

powershell -NoProfile -Command ^
    "$content = Get-Content '.env'; " ^
    "$content = $content -replace 'MYSQL_HOST=.*', 'MYSQL_HOST=%mysql_host%'; " ^
    "$content = $content -replace 'MYSQL_PORT=.*', 'MYSQL_PORT=%mysql_port%'; " ^
    "$content = $content -replace 'MYSQL_USER=.*', 'MYSQL_USER=%mysql_user%'; " ^
    "$content = $content -replace 'MYSQL_PASSWORD=.*', 'MYSQL_PASSWORD=%mysql_password%'; " ^
    "$content = $content -replace 'MYSQL_DATABASE=.*', 'MYSQL_DATABASE=%mysql_db%'; " ^
    "$content = $content -replace 'PORT=.*', 'PORT=%server_port%'; " ^
    "$content = $content -replace 'NODE_ENV=.*', 'NODE_ENV=%node_env%'; " ^
    "$content = $content -replace 'SCREENSHOTS_DIR=.*', 'SCREENSHOTS_DIR=%screenshots_dir%'; " ^
    "Set-Content '.env' $content"

cd ..
if not exist "%screenshots_dir%" (
    mkdir "%screenshots_dir%"
)

echo [✓] Backend configuration saved
echo [✓] Screenshots directory verified
echo.
pause
goto menu

:frontend_config
cls
echo Configuring Frontend
echo.
set /p api_url="API URL (default: http://localhost:3001): "
if "%api_url%"=="" set api_url=http://localhost:3001

set /p api_mode="API Mode (offline/cloud, default: offline): "
if "%api_mode%"=="" set api_mode=offline

echo.
echo Updating root \.env...

if not exist .env (
    (
        echo VITE_API_URL=%api_url%
        echo VITE_API_MODE=%api_mode%
    ) > .env
) else (
    powershell -NoProfile -Command ^
        "$content = Get-Content '.env'; " ^
        "if ($content -match 'VITE_API_URL') { $content = $content -replace 'VITE_API_URL=.*', 'VITE_API_URL=%api_url%' } else { $content += \"`nVITE_API_URL=%api_url%\" }; " ^
        "if ($content -match 'VITE_API_MODE') { $content = $content -replace 'VITE_API_MODE=.*', 'VITE_API_MODE=%api_mode%' } else { $content += \"`nVITE_API_MODE=%api_mode%\" }; " ^
        "Set-Content '.env' $content"
)

echo [✓] Frontend configuration saved
echo.
pause
goto menu

:both_config
cls
echo Configuring Backend Server
echo.
set /p mysql_host="MySQL Host (default: localhost): "
if "%mysql_host%"=="" set mysql_host=localhost

set /p mysql_port="MySQL Port (default: 3306): "
if "%mysql_port%"=="" set mysql_port=3306

set /p mysql_user="MySQL User (default: tradevault): "
if "%mysql_user%"=="" set mysql_user=tradevault

set /p mysql_password="MySQL Password (default: kevin098): "
if "%mysql_password%"=="" set mysql_password=kevin098

set /p mysql_db="MySQL Database (default: tradevault): "
if "%mysql_db%"=="" set mysql_db=tradevault

set /p server_port="Server Port (default: 3001): "
if "%server_port%"=="" set server_port=3001

set /p screenshots_dir="Screenshots Directory (default: C:\TradeVault\screenshots): "
if "%screenshots_dir%"=="" set screenshots_dir=C:\TradeVault\screenshots

set /p node_env="Environment (development/production, default: development): "
if "%node_env%"=="" set node_env=development

echo.
echo Updating server\.env...
cd server

if not exist .env (
    copy .env.example .env >nul
)

powershell -NoProfile -Command ^
    "$content = Get-Content '.env'; " ^
    "$content = $content -replace 'MYSQL_HOST=.*', 'MYSQL_HOST=%mysql_host%'; " ^
    "$content = $content -replace 'MYSQL_PORT=.*', 'MYSQL_PORT=%mysql_port%'; " ^
    "$content = $content -replace 'MYSQL_USER=.*', 'MYSQL_USER=%mysql_user%'; " ^
    "$content = $content -replace 'MYSQL_PASSWORD=.*', 'MYSQL_PASSWORD=%mysql_password%'; " ^
    "$content = $content -replace 'MYSQL_DATABASE=.*', 'MYSQL_DATABASE=%mysql_db%'; " ^
    "$content = $content -replace 'PORT=.*', 'PORT=%server_port%'; " ^
    "$content = $content -replace 'NODE_ENV=.*', 'NODE_ENV=%node_env%'; " ^
    "$content = $content -replace 'SCREENSHOTS_DIR=.*', 'SCREENSHOTS_DIR=%screenshots_dir%'; " ^
    "Set-Content '.env' $content"

cd ..

if not exist "%screenshots_dir%" (
    mkdir "%screenshots_dir%"
)

echo [✓] Backend configuration saved
echo [✓] Screenshots directory verified

echo.
echo Updating root \.env...
set api_url=http://localhost:%server_port%

if not exist .env (
    (
        echo VITE_API_URL=%api_url%
        echo VITE_API_MODE=offline
    ) > .env
) else (
    powershell -NoProfile -Command ^
        "$content = Get-Content '.env'; " ^
        "if ($content -match 'VITE_API_URL') { $content = $content -replace 'VITE_API_URL=.*', 'VITE_API_URL=%api_url%' } else { $content += \"`nVITE_API_URL=%api_url%\" }; " ^
        "if ($content -match 'VITE_API_MODE') { $content = $content -replace 'VITE_API_MODE=.*', 'VITE_API_MODE=offline' } else { $content += \"`nVITE_API_MODE=offline\" }; " ^
        "Set-Content '.env' $content"
)

echo [✓] Frontend configuration saved
echo.
pause
goto menu

:view_config
cls
echo Current Backend Configuration (server\.env):
echo.
if exist "server\.env" (
    type server\.env
) else (
    echo Backend .env not found
)
echo.
echo.
echo Current Frontend Configuration (root \.env):
echo.
if exist ".env" (
    type .env
) else (
    echo Frontend .env not found
)
echo.
pause
goto menu

:reset_config
cls
echo Resetting to Default Configuration
echo.
set /p confirm="Are you sure? (y/n): "
if /i "%confirm%"=="y" (
    echo.
    echo Resetting backend...
    cd server
    copy .env.example .env >nul
    cd ..
    
    echo Resetting frontend...
    (
        echo VITE_API_URL=http://localhost:3001
        echo VITE_API_MODE=offline
    ) > .env
    
    echo.
    echo [✓] Configuration reset to defaults
) else (
    echo Reset cancelled
)
echo.
pause
goto menu

:end
echo.
echo Configuration wizard closed
exit /b 0
