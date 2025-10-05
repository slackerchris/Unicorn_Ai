#!/bin/bash
# Quick setup script for Telegram bot

echo "🦄 Unicorn AI - Telegram Bot Setup"
echo "=================================="
echo ""

# Check if token is set
if grep -q "^TELEGRAM_BOT_TOKEN=.*[0-9]" config/.env; then
    echo "✅ Bot token is already configured!"
    echo ""
    TOKEN=$(grep "^TELEGRAM_BOT_TOKEN=" config/.env | cut -d= -f2)
    echo "Token: ${TOKEN:0:20}...${TOKEN: -10}"
    echo ""
else
    echo "❌ Bot token not configured yet"
    echo ""
    echo "📋 To set up your bot:"
    echo ""
    echo "1. Open Telegram"
    echo "2. Search for: @BotFather"
    echo "3. Send: /newbot"
    echo "4. Follow the prompts"
    echo "5. Copy the token you receive"
    echo ""
    echo "Then run:"
    echo "  nano config/.env"
    echo ""
    echo "And change this line:"
    echo "  # TELEGRAM_BOT_TOKEN=your_bot_token_here"
    echo ""
    echo "To this (remove the # and add your actual token):"
    echo "  TELEGRAM_BOT_TOKEN=1234567890:ABCdef..."
    echo ""
    echo "Save with: Ctrl+X, Y, Enter"
    echo ""
    exit 1
fi

echo "Starting services..."
echo ""

# Check if API is already running
if pgrep -f "python main.py" > /dev/null; then
    echo "✅ API is already running"
else
    echo "Starting API..."
    venv/bin/python main.py > outputs/logs/api.log 2>&1 &
    sleep 3
fi

# Check if bot is already running
if pgrep -f "python telegram_bot.py" > /dev/null; then
    echo "⚠️  Bot is already running"
    echo "Stopping old bot..."
    pkill -f "python telegram_bot.py"
    sleep 2
fi

echo "Starting Telegram bot..."
venv/bin/python telegram_bot.py > outputs/logs/telegram_bot.log 2>&1 &
BOT_PID=$!

sleep 3

# Check if bot is running
if ps -p $BOT_PID > /dev/null; then
    echo "✅ Telegram bot is running (PID: $BOT_PID)"
    echo ""
    echo "📱 Open Telegram and find your bot"
    echo "💬 Send /start to begin chatting"
    echo ""
    echo "Logs:"
    echo "  Bot: tail -f outputs/logs/telegram_bot.log"
    echo "  API: tail -f outputs/logs/api.log"
else
    echo "❌ Bot failed to start"
    echo ""
    echo "Check the logs:"
    echo "  tail -20 outputs/logs/telegram_bot.log"
    exit 1
fi
