#!/bin/bash
# Start both the API backend and Telegram bot

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd "$(dirname "$0")"

# Check if .env exists
if [ ! -f "config/.env" ]; then
    echo "❌ Error: config/.env not found"
    echo "Copy config/.env.example to config/.env and configure it"
    exit 1
fi

# Check if TELEGRAM_BOT_TOKEN is set
if ! grep -q "TELEGRAM_BOT_TOKEN=.*[0-9]" config/.env; then
    echo "❌ Error: TELEGRAM_BOT_TOKEN not set in config/.env"
    echo ""
    echo "Please follow these steps:"
    echo "1. Read TELEGRAM_SETUP.md"
    echo "2. Create a bot with @BotFather on Telegram"
    echo "3. Add your token to config/.env"
    exit 1
fi

echo -e "${BLUE}🦄 Starting Unicorn AI...${NC}"
echo ""

# Start the API backend
echo -e "${GREEN}Starting API backend...${NC}"
venv/bin/python main.py > outputs/logs/api.log 2>&1 &
API_PID=$!
echo "API backend started (PID: $API_PID)"

# Wait for API to be ready
echo "Waiting for API to start..."
sleep 3

# Check if API is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API backend is running${NC}"
else
    echo "❌ API backend failed to start"
    echo "Check outputs/logs/api.log for errors"
    kill $API_PID 2>/dev/null
    exit 1
fi

# Start the Telegram bot
echo ""
echo -e "${GREEN}Starting Telegram bot...${NC}"
venv/bin/python telegram_bot.py > outputs/logs/telegram.log 2>&1 &
BOT_PID=$!
echo "Telegram bot started (PID: $BOT_PID)"

# Wait a moment for bot to initialize
sleep 2

echo ""
echo -e "${GREEN}✅ Unicorn AI is now online!${NC}"
echo ""
echo "📱 Open Telegram and find your bot"
echo "💬 Send /start to begin chatting"
echo ""
echo "Logs:"
echo "  API: outputs/logs/api.log"
echo "  Bot: outputs/logs/telegram.log"
echo ""
echo "To stop:"
echo "  kill $API_PID $BOT_PID"
echo ""
echo "PIDs saved to outputs/logs/pids.txt"
echo "$API_PID $BOT_PID" > outputs/logs/pids.txt

# Keep script running to show that services are active
echo "Press Ctrl+C to stop all services"
trap "echo 'Stopping services...'; kill $API_PID $BOT_PID 2>/dev/null; exit" INT TERM

# Wait for processes
wait
