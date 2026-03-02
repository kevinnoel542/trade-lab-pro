#!/bin/bash

################################################################################
# TradeVault Offline - Complete Launcher Script
# Starts MySQL, Backend Server, and Frontend Dev Server
# Usage: ./launcher.sh
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MYSQL_USER="tradevault"
MYSQL_PASSWORD="kevin098"
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
DB_NAME="tradevault"
BACKEND_PORT="3001"
FRONTEND_PORT="8081"
SCREENSHOTS_DIR="$HOME/TradeVault/screenshots"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         TradeVault Offline - Complete Launcher                ║"
echo "║     MySQL + Backend Server + Frontend Dev Server               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

################################################################################
# Step 1: Check Prerequisites
################################################################################

echo -e "${YELLOW}[1/5]${NC} Checking prerequisites..."

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL is not installed or not in PATH${NC}"
    echo "Please install MySQL 8.0+ and add it to your PATH"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
echo -e "${GREEN}✅ npm $(npm --version)${NC}"
echo -e "${GREEN}✅ MySQL installed${NC}"

################################################################################
# Step 2: Create Screenshots Directory
################################################################################

echo -e "${YELLOW}[2/5]${NC} Creating screenshots directory..."

if [ ! -d "$SCREENSHOTS_DIR" ]; then
    mkdir -p "$SCREENSHOTS_DIR"
    echo -e "${GREEN}✅ Created directory: $SCREENSHOTS_DIR${NC}"
else
    echo -e "${GREEN}✅ Directory exists: $SCREENSHOTS_DIR${NC}"
fi

################################################################################
# Step 3: Start MySQL Service
################################################################################

echo -e "${YELLOW}[3/5]${NC} Starting MySQL service..."

# Check if MySQL is already running
if mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -h"$MYSQL_HOST" -P"$MYSQL_PORT" -e "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✅ MySQL is already running${NC}"
else
    echo "Attempting to start MySQL service..."
    
    # Try different methods to start MySQL based on the system
    if command -v brew &> /dev/null; then
        # macOS with Homebrew
        brew services start mysql &> /dev/null && echo -e "${GREEN}✅ Started MySQL with Homebrew${NC}" || echo -e "${YELLOW}⚠️  Could not start MySQL (may already be running)${NC}"
    elif command -v systemctl &> /dev/null; then
        # Linux with systemd
        sudo systemctl start mysql &> /dev/null && echo -e "${GREEN}✅ Started MySQL with systemctl${NC}" || echo -e "${YELLOW}⚠️  Could not start MySQL (may already be running)${NC}"
    elif [ -f /usr/local/mysql/support-files/mysql.server ]; then
        # macOS manual start
        sudo /usr/local/mysql/support-files/mysql.server start &> /dev/null && echo -e "${GREEN}✅ Started MySQL${NC}" || echo -e "${YELLOW}⚠️  Could not start MySQL${NC}"
    else
        echo -e "${YELLOW}⚠️  Please ensure MySQL is running manually${NC}"
    fi
fi

# Verify MySQL connection
sleep 2
if mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -h"$MYSQL_HOST" -P"$MYSQL_PORT" -e "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✅ MySQL connection verified${NC}"
else
    echo -e "${RED}❌ Could not connect to MySQL${NC}"
    echo "Please ensure MySQL is running with user '$MYSQL_USER' and password set"
    exit 1
fi

################################################################################
# Step 4: Start Backend Server
################################################################################

echo -e "${YELLOW}[4/5]${NC} Starting Backend Server (port $BACKEND_PORT)..."

# Check if backend port is already in use
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port $BACKEND_PORT is already in use${NC}"
    read -p "Kill existing process and start new one? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f "node.*server" || true
        sleep 1
    else
        echo -e "${YELLOW}⚠️  Skipping backend start${NC}"
    fi
fi

# Start backend
cd server
npm install --silent > /dev/null 2>&1 &
BACKEND_PID=$!

# Wait for npm install to complete
wait $BACKEND_PID 2>/dev/null || true

echo "Starting backend server..."
npm start > /tmp/tradelab-backend.log 2>&1 &
BACKEND_PID=$!

# Give the server time to start
sleep 3

# Check if backend is responding
if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend running (PID: $BACKEND_PID)${NC}"
    echo -e "${GREEN}   API: http://localhost:$BACKEND_PORT${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may still be starting...${NC}"
    echo -e "   Log file: /tmp/tradelab-backend.log"
fi

cd ..

################################################################################
# Step 5: Start Frontend Dev Server
################################################################################

echo -e "${YELLOW}[5/5]${NC} Starting Frontend Dev Server..."

# Check if frontend port is already in use
if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port $FRONTEND_PORT is already in use${NC}"
    read -p "Kill existing process and start new one? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkill -f "vite" || true
        sleep 1
    else
        echo -e "${YELLOW}⚠️  Skipping frontend start${NC}"
    fi
fi

# Start frontend
npm install --silent > /dev/null 2>&1 &
FRONTEND_INSTALL_PID=$!

# Wait for npm install to complete
wait $FRONTEND_INSTALL_PID 2>/dev/null || true

echo "Starting frontend dev server..."
npm run dev > /tmp/tradelab-frontend.log 2>&1 &
FRONTEND_PID=$!

# Give the server time to start
sleep 5

# Check if frontend is responding
if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend running (PID: $FRONTEND_PID)${NC}"
    echo -e "${GREEN}   URL: http://localhost:$FRONTEND_PORT${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend may still be starting...${NC}"
    echo -e "   Log file: /tmp/tradelab-frontend.log"
fi

################################################################################
# Final Status
################################################################################

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    🎉 STARTUP COMPLETE! 🎉                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${GREEN}MySQL Database:${NC}"
echo "  Host: $MYSQL_HOST:$MYSQL_PORT"
echo "  User: $MYSQL_USER"
echo "  Database: $DB_NAME"
echo ""

echo -e "${GREEN}Backend API:${NC}"
echo "  URL: http://localhost:$BACKEND_PORT"
echo "  Health: http://localhost:$BACKEND_PORT/api/health"
echo "  Process ID: $BACKEND_PID"
echo ""

echo -e "${GREEN}Frontend Application:${NC}"
echo "  URL: http://localhost:$FRONTEND_PORT"
echo "  Process ID: $FRONTEND_PID"
echo ""

echo -e "${GREEN}Screenshots Directory:${NC}"
echo "  Path: $SCREENSHOTS_DIR"
echo ""

echo -e "${YELLOW}Logs:${NC}"
echo "  Backend: /tmp/tradelab-backend.log"
echo "  Frontend: /tmp/tradelab-frontend.log"
echo ""

echo -e "${YELLOW}To stop all services, run:${NC}"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""

echo -e "${YELLOW}To view logs, run:${NC}"
echo "  tail -f /tmp/tradelab-backend.log   # Backend logs"
echo "  tail -f /tmp/tradelab-frontend.log  # Frontend logs"
echo ""

################################################################################
# Cleanup on Exit
################################################################################

cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Backend stopped${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    fi
    
    echo -e "${GREEN}All services stopped${NC}"
}

trap cleanup EXIT

# Keep script running
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"
while true; do
    sleep 1
done
