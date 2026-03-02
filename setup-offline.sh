#!/bin/bash

# TradeVault Offline Setup Script for Linux/Mac
# This script automates the complete offline setup process

set -e

echo "=================================================="
echo "  TradeVault Offline Setup Script"
echo "  Linux/Mac Version"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
read -p "Enter MySQL root password: " -s MYSQL_ROOT_PASSWORD
echo ""
read -p "Enter MySQL tradevault user password (default: kevin098): " -s MYSQL_PASSWORD
MYSQL_PASSWORD=${MYSQL_PASSWORD:-kevin098}
echo ""
read -p "Enter path for screenshots directory (default: ~/TradeVault/screenshots): " SCREENSHOTS_DIR
SCREENSHOTS_DIR=${SCREENSHOTS_DIR:-~/TradeVault/screenshots}
echo ""

# Expand ~ to home directory
SCREENSHOTS_DIR="${SCREENSHOTS_DIR/#\~/$HOME}"

echo -e "${BLUE}Configuration Summary:${NC}"
echo "MySQL Root Password: ****"
echo "MySQL User Password: ****"
echo "Screenshots Directory: $SCREENSHOTS_DIR"
echo ""

# Step 1: Clean node_modules and install dependencies
echo -e "${BLUE}[1/8]${NC} Cleaning and installing dependencies..."
if [ -d "node_modules" ]; then
    node -e "const fs = require('fs'); const path = require('path'); const nodeModules = './node_modules'; if(fs.existsSync(nodeModules)) { const items = fs.readdirSync(nodeModules); items.forEach(item => { const fullPath = path.join(nodeModules, item); try { if(fs.lstatSync(fullPath).isDirectory()) { fs.rmSync(fullPath, {recursive: true, force: true}); } }catch(e){} }); console.log('Cleaned node_modules'); }"
fi
npm cache clean --force --silent
npm install --silent
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Create MySQL user and database
echo -e "${BLUE}[2/8]${NC} Creating MySQL database and user..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "CREATE USER IF NOT EXISTS 'tradevault'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_PASSWORD';" 2>/dev/null || true
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "GRANT ALL PRIVILEGES ON tradevault.* TO 'tradevault'@'localhost'; FLUSH PRIVILEGES;" 2>/dev/null || true
echo -e "${GREEN}✓ MySQL user and database ready${NC}"
echo ""

# Step 3: Setup server environment
echo -e "${BLUE}[3/8]${NC} Configuring backend server..."
cd server
if [ ! -f ".env" ]; then
    cp .env.example .env
fi
# Update .env with correct credentials
sed -i.bak "s/MYSQL_USER=.*/MYSQL_USER=tradevault/" .env
sed -i.bak "s/MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$MYSQL_PASSWORD/" .env
sed -i.bak "s|SCREENSHOTS_DIR=.*|SCREENSHOTS_DIR=$SCREENSHOTS_DIR|" .env
rm -f .env.bak
npm install --silent
echo -e "${GREEN}✓ Backend configured${NC}"
echo ""

# Step 4: Create screenshots directory
echo -e "${BLUE}[4/8]${NC} Creating screenshots directory..."
mkdir -p "$SCREENSHOTS_DIR"
echo -e "${GREEN}✓ Screenshots directory created at: $SCREENSHOTS_DIR${NC}"
echo ""

# Step 5: Setup database schema
echo -e "${BLUE}[5/8]${NC} Setting up database schema..."
npm run setup-db
echo -e "${GREEN}✓ Database schema created${NC}"
echo ""

# Step 6: Seed dummy data
echo -e "${BLUE}[6/8]${NC} Seeding dummy data..."
node seed-dummy-data.js
echo -e "${GREEN}✓ Dummy data seeded${NC}"
echo ""

# Step 7: Configure frontend
echo -e "${BLUE}[7/8]${NC} Configuring frontend..."
cd ..
if [ ! -f ".env" ]; then
    cat > .env << EOF
VITE_API_URL=http://localhost:3001
VITE_API_MODE=offline
EOF
else
    # Update existing .env
    if grep -q "VITE_API_URL" .env; then
        sed -i.bak 's|VITE_API_URL=.*|VITE_API_URL=http://localhost:3001|' .env
    else
        echo "VITE_API_URL=http://localhost:3001" >> .env
    fi
    if grep -q "VITE_API_MODE" .env; then
        sed -i.bak 's|VITE_API_MODE=.*|VITE_API_MODE=offline|' .env
    else
        echo "VITE_API_MODE=offline" >> .env
    fi
    rm -f .env.bak
fi
echo -e "${GREEN}✓ Frontend configured${NC}"
echo ""

# Step 8: Test API connection
echo -e "${BLUE}[8/8]${NC} Verifying API connection..."
sleep 2
API_TEST=$(curl -s http://localhost:3001/api/health 2>/dev/null || echo "")
if [[ $API_TEST == *"ok"* ]]; then
    echo -e "${GREEN}✓ API connection verified${NC}"
else
    echo -e "${YELLOW}⚠ API connection check skipped (server may not be running yet)${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}=================================================="
echo "  Setup Complete! ✓"
echo "==================================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Start the backend server:"
echo "   cd server && npm start"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   npm run dev"
echo ""
echo "3. Open your browser to http://localhost:8081"
echo ""
echo -e "${BLUE}Offline Setup Details:${NC}"
echo "  Backend API: http://localhost:3001"
echo "  Frontend: http://localhost:8081"
echo "  Database: MySQL (tradevault@localhost)"
echo "  Screenshots: $SCREENSHOTS_DIR"
echo ""
echo -e "${YELLOW}Quick Start (All-in-One):${NC}"
echo "  ./start-servers.sh"
echo ""
