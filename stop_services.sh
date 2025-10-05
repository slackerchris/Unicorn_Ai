#!/bin/bash
# Stop all Unicorn AI services

cd "$(dirname "$0")"

echo "🛑 Stopping Unicorn AI services..."

# Try to read PIDs from file
if [ -f "outputs/logs/pids.txt" ]; then
    PIDS=$(cat outputs/logs/pids.txt)
    for PID in $PIDS; do
        if kill -0 $PID 2>/dev/null; then
            echo "Stopping process $PID..."
            kill $PID
        fi
    done
    rm outputs/logs/pids.txt
fi

# Also kill by name as backup
pkill -f "python main.py"
pkill -f "python telegram_bot.py"

echo "✅ All services stopped"
