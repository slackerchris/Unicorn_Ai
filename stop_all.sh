#!/bin/bash
# Unicorn AI - Stop All Services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔════════════════════════════════════════╗"
echo "║     🛑 STOPPING UNICORN AI 🛑          ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Function to stop process
stop_process() {
    local process_name=$1
    local search_pattern=$2
    
    if pgrep -f "$search_pattern" > /dev/null; then
        echo -e "${YELLOW}🛑 Stopping $process_name...${NC}"
        pkill -f "$search_pattern"
        sleep 1
        
        if pgrep -f "$search_pattern" > /dev/null; then
            echo -e "${RED}   Force killing $process_name...${NC}"
            pkill -9 -f "$search_pattern"
        fi
        echo -e "${GREEN}✅ $process_name stopped${NC}"
    else
        echo -e "${YELLOW}⚠️  $process_name not running${NC}"
    fi
}

# Stop all services
stop_process "Web UI" "python.*main.py"
stop_process "Telegram Bot" "python.*telegram_bot.py"
stop_process "ComfyUI" "python.*comfyui/main.py"

echo ""
echo -e "${GREEN}✅ All services stopped!${NC}"
echo ""
