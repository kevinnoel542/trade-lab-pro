#!/bin/bash

# TradeVault Server Starter - Linux/Mac
# Starts backend and frontend on fixed ports, clearing stale listeners first.

set -euo pipefail

echo "=================================================="
echo "  TradeVault Offline - Starting Servers"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKEND_PORT=3001
FRONTEND_PORT=8081
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""
FRONTEND_PID=""

mysql_is_running() {
    local out=""
    if command -v systemctl >/dev/null 2>&1; then
        if systemctl is-active --quiet mysql || systemctl is-active --quiet mariadb; then
            return 0
        fi
    fi

    if command -v mysqladmin >/dev/null 2>&1; then
        out="$(mysqladmin --protocol=tcp -h127.0.0.1 ping 2>&1 || true)"
        if echo "$out" | grep -qi "mysqld is alive\|Access denied"; then
            return 0
        fi
    fi

    if command -v mysql >/dev/null 2>&1; then
        out="$(mysql -e "SELECT 1" 2>&1 || true)"
        if echo "$out" | grep -qi "Access denied"; then
            return 0
        fi
    fi

    return 1
}

stop_port_if_busy() {
    local port="$1"
    local label="$2"

    if ! command -v lsof >/dev/null 2>&1; then
        return
    fi

    local pids
    pids="$(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}Port ${port} in use for ${label}. Stopping old process(es): ${pids}${NC}"
        # shellcheck disable=SC2086
        kill $pids 2>/dev/null || true
        sleep 1
    fi
}

cleanup() {
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
}

trap cleanup EXIT INT TERM

# Check if MySQL is running
echo -e "${BLUE}Checking MySQL...${NC}"
if ! mysql_is_running; then
    echo -e "${YELLOW}Warning: MySQL probe failed. Continuing startup anyway.${NC}"
    echo "If backend errors, verify MySQL service and credentials."
else
    echo -e "${GREEN}✓ MySQL is running${NC}"
fi
echo ""

# Start backend
echo -e "${BLUE}Starting Backend Server (port ${BACKEND_PORT})...${NC}"
stop_port_if_busy "$BACKEND_PORT" "backend"
cd "${PROJECT_ROOT}/server"
npm start &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
sleep 3
echo ""

# Verify backend is running
if curl -s "http://localhost:${BACKEND_PORT}/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
else
    echo "Warning: Backend API not responding yet. It may still be starting."
fi
echo ""

# Start frontend
echo -e "${BLUE}Starting Frontend Dev Server...${NC}"
stop_port_if_busy "$FRONTEND_PORT" "frontend"
cd "${PROJECT_ROOT}"
npm run dev -- --port "$FRONTEND_PORT" --strictPort --host 0.0.0.0 &
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
echo "  Frontend: http://localhost:${FRONTEND_PORT}"
echo "  Backend API: http://localhost:${BACKEND_PORT}"
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
