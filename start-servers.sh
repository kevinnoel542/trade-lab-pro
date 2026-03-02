#!/bin/bash

# TradeVault Server Starter - Linux/Mac
# Starts both backend and frontend servers in the same terminal

set -e

echo "=================================================="
echo "  TradeVault Offline - Starting Servers"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if MySQL is running
echo -e "${BLUE}Checking MySQL...${NC}"
if ! mysql -e "SELECT 1" > /dev/null 2>&1; then
    echo "Error: MySQL is not running. Please start MySQL first."
    echo "On macOS: brew services start mysql"
    echo "On Linux: sudo systemctl start mysql"
    exit 1
fi
echo -e "${GREEN}✓ MySQL is running${NC}"
echo ""

# Start backend
echo -e "${BLUE}Starting Backend Server (port 3001)...${NC}"
cd server
npm start &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
sleep 3
echo ""

# Verify backend is running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
else
    echo "Warning: Backend API not responding yet. It may still be starting."
fi
echo ""

# Start frontend
echo -e "${BLUE}Starting Frontend Dev Server...${NC}"
cd ..
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
sleep 3
echo ""

# Summary
echo -e "${GREEN}=================================================="
echo "  Servers Running Successfully!"
echo "==================================================${NC}"
echo ""
echo -e "${BLUE}Access Your Application:${NC}"
echo "  Frontend: http://localhost:8081"
echo "  Backend API: http://localhost:3001"
echo ""
echo -e "${BLUE}Running Processes:${NC}"
echo "  Backend (PID: $BACKEND_PID)"
echo "  Frontend (PID: $FRONTEND_PID)"
echo ""
echo -e "${BLUE}To stop servers:${NC}"
echo "  Press Ctrl+C"
echo ""

# Wait for interrupt
wait
