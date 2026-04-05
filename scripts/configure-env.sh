#!/bin/bash

# TradeVault Environment Configuration Wizard - Linux/Mac
# Interactive configuration for .env files

set -e

echo "=================================================="
echo "  TradeVault Environment Configuration Wizard"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration Menu
while true; do
    echo -e "${BLUE}Configuration Options:${NC}"
    echo "1. Configure Backend (.env)"
    echo "2. Configure Frontend (.env)"
    echo "3. Configure Both"
    echo "4. View Current Configuration"
    echo "5. Reset to Defaults"
    echo "6. Exit"
    echo ""
    read -p "Select an option (1-6): " option
    echo ""

    case $option in
        1)
            echo -e "${YELLOW}Configuring Backend Server${NC}"
            echo ""
            read -p "MySQL Host (default: localhost): " mysql_host
            mysql_host=${mysql_host:-localhost}
            
            read -p "MySQL Port (default: 3306): " mysql_port
            mysql_port=${mysql_port:-3306}
            
            read -p "MySQL User (default: tradevault): " mysql_user
            mysql_user=${mysql_user:-tradevault}
            
            read -p "MySQL Password (default: kevin098): " -s mysql_password
            mysql_password=${mysql_password:-kevin098}
            echo ""
            
            read -p "MySQL Database (default: tradevault): " mysql_db
            mysql_db=${mysql_db:-tradevault}
            
            read -p "Server Port (default: 3001): " server_port
            server_port=${server_port:-3001}
            
            read -p "Screenshots Directory (default: ~/TradeVault/screenshots): " screenshots_dir
            screenshots_dir=${screenshots_dir:-~/TradeVault/screenshots}
            screenshots_dir="${screenshots_dir/#\~/$HOME}"
            
            read -p "Environment (development/production, default: development): " node_env
            node_env=${node_env:-development}
            
            # Update .env
            cd server
            if [ ! -f ".env" ]; then
                cp .env.example .env
            fi
            
            sed -i.bak "s/MYSQL_HOST=.*/MYSQL_HOST=$mysql_host/" .env
            sed -i.bak "s/MYSQL_PORT=.*/MYSQL_PORT=$mysql_port/" .env
            sed -i.bak "s/MYSQL_USER=.*/MYSQL_USER=$mysql_user/" .env
            sed -i.bak "s/MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$mysql_password/" .env
            sed -i.bak "s/MYSQL_DATABASE=.*/MYSQL_DATABASE=$mysql_db/" .env
            sed -i.bak "s|SCREENSHOTS_DIR=.*|SCREENSHOTS_DIR=$screenshots_dir|" .env
            sed -i.bak "s/PORT=.*/PORT=$server_port/" .env
            sed -i.bak "s/NODE_ENV=.*/NODE_ENV=$node_env/" .env
            
            rm -f .env.bak
            cd ..
            
            echo -e "${GREEN}✓ Backend configuration saved${NC}"
            mkdir -p "$screenshots_dir"
            echo -e "${GREEN}✓ Screenshots directory created/verified${NC}"
            echo ""
            ;;

        2)
            echo -e "${YELLOW}Configuring Frontend${NC}"
            echo ""
            read -p "API URL (default: http://localhost:3001): " api_url
            api_url=${api_url:-http://localhost:3001}
            
            read -p "API Mode (offline/cloud, default: offline): " api_mode
            api_mode=${api_mode:-offline}
            
            # Update .env
            if [ ! -f ".env" ]; then
                cat > .env << EOF
VITE_API_URL=$api_url
VITE_API_MODE=$api_mode
EOF
            else
                if grep -q "VITE_API_URL" .env; then
                    sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=$api_url|" .env
                else
                    echo "VITE_API_URL=$api_url" >> .env
                fi
                if grep -q "VITE_API_MODE" .env; then
                    sed -i.bak "s|VITE_API_MODE=.*|VITE_API_MODE=$api_mode|" .env
                else
                    echo "VITE_API_MODE=$api_mode" >> .env
                fi
                rm -f .env.bak
            fi
            
            echo -e "${GREEN}✓ Frontend configuration saved${NC}"
            echo ""
            ;;

        3)
            echo -e "${YELLOW}Configuring Both Backend and Frontend${NC}"
            echo ""
            # Reuse the logic from options 1 and 2
            option=1
            # Run option 1 logic
            read -p "MySQL Host (default: localhost): " mysql_host
            mysql_host=${mysql_host:-localhost}
            read -p "MySQL Port (default: 3306): " mysql_port
            mysql_port=${mysql_port:-3306}
            read -p "MySQL User (default: tradevault): " mysql_user
            mysql_user=${mysql_user:-tradevault}
            read -p "MySQL Password (default: kevin098): " -s mysql_password
            mysql_password=${mysql_password:-kevin098}
            echo ""
            read -p "MySQL Database (default: tradevault): " mysql_db
            mysql_db=${mysql_db:-tradevault}
            read -p "Server Port (default: 3001): " server_port
            server_port=${server_port:-3001}
            read -p "Screenshots Directory (default: ~/TradeVault/screenshots): " screenshots_dir
            screenshots_dir=${screenshots_dir:-~/TradeVault/screenshots}
            screenshots_dir="${screenshots_dir/#\~/$HOME}"
            read -p "Environment (development/production, default: development): " node_env
            node_env=${node_env:-development}
            
            # Update backend .env
            cd server
            if [ ! -f ".env" ]; then
                cp .env.example .env
            fi
            sed -i.bak "s/MYSQL_HOST=.*/MYSQL_HOST=$mysql_host/" .env
            sed -i.bak "s/MYSQL_PORT=.*/MYSQL_PORT=$mysql_port/" .env
            sed -i.bak "s/MYSQL_USER=.*/MYSQL_USER=$mysql_user/" .env
            sed -i.bak "s/MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$mysql_password/" .env
            sed -i.bak "s/MYSQL_DATABASE=.*/MYSQL_DATABASE=$mysql_db/" .env
            sed -i.bak "s|SCREENSHOTS_DIR=.*|SCREENSHOTS_DIR=$screenshots_dir|" .env
            sed -i.bak "s/PORT=.*/PORT=$server_port/" .env
            sed -i.bak "s/NODE_ENV=.*/NODE_ENV=$node_env/" .env
            rm -f .env.bak
            cd ..
            
            echo -e "${GREEN}✓ Backend configuration saved${NC}"
            mkdir -p "$screenshots_dir"
            echo -e "${GREEN}✓ Screenshots directory created/verified${NC}"
            
            # Update frontend .env
            api_url="http://localhost:$server_port"
            if [ ! -f ".env" ]; then
                cat > .env << EOF
VITE_API_URL=$api_url
VITE_API_MODE=offline
EOF
            else
                if grep -q "VITE_API_URL" .env; then
                    sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=$api_url|" .env
                else
                    echo "VITE_API_URL=$api_url" >> .env
                fi
                if grep -q "VITE_API_MODE" .env; then
                    sed -i.bak "s|VITE_API_MODE=.*|VITE_API_MODE=offline|" .env
                else
                    echo "VITE_API_MODE=offline" >> .env
                fi
                rm -f .env.bak
            fi
            
            echo -e "${GREEN}✓ Frontend configuration saved${NC}"
            echo ""
            ;;

        4)
            echo -e "${BLUE}Current Backend Configuration (.env in server/):${NC}"
            if [ -f "server/.env" ]; then
                cat server/.env
            else
                echo "Backend .env not found"
            fi
            echo ""
            echo -e "${BLUE}Current Frontend Configuration (.env in root):${NC}"
            if [ -f ".env" ]; then
                cat .env
            else
                echo "Frontend .env not found"
            fi
            echo ""
            ;;

        5)
            echo -e "${YELLOW}Resetting to Default Configuration${NC}"
            echo ""
            read -p "Are you sure? (y/n): " confirm
            if [ "$confirm" = "y" ]; then
                cd server
                cp .env.example .env
                cd ..
                cat > .env << EOF
VITE_API_URL=http://localhost:3001
VITE_API_MODE=offline
EOF
                echo -e "${GREEN}✓ Configuration reset to defaults${NC}"
            else
                echo "Reset cancelled"
            fi
            echo ""
            ;;

        6)
            echo -e "${GREEN}Configuration wizard closed${NC}"
            exit 0
            ;;

        *)
            echo -e "${YELLOW}Invalid option. Please try again.${NC}"
            echo ""
            ;;
    esac
done
