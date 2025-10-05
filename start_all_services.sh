#!/bin/bash
# Start all Unicorn AI services (API, Telegram Bot, and ComfyUI)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🦄 Starting Unicorn AI - All Services"
echo "====================================="
echo ""

# Check if ComfyUI is installed
if [ ! -d "comfyui" ]; then
    echo "⚠️  ComfyUI not installed"
    echo "Run ./install_comfyui.sh to install it"
    echo ""
    echo "Starting without ComfyUI (images won't work)..."
    SKIP_COMFYUI=true
fi

# Start ComfyUI first (if installed)
if [ "$SKIP_COMFYUI" != "true" ]; then
    echo "1️⃣  Starting ComfyUI..."
    cd comfyui
    source venv/bin/activate
    python main.py --listen 0.0.0.0 --port 8188 > ../outputs/logs/comfyui.log 2>&1 &
    COMFYUI_PID=$!
    deactivate
    cd ..
    echo "   ✅ ComfyUI started (PID: $COMFYUI_PID)"
    echo "   🌐 UI: http://localhost:8188"
    sleep 3
else
    COMFYUI_PID=""
fi

# Start FastAPI backend
echo ""
echo "2️⃣  Starting API Backend..."
venv/bin/python main.py > outputs/logs/api.log 2>&1 &
API_PID=$!
echo "   ✅ API started (PID: $API_PID)"
echo "   🌐 API: http://localhost:8000"
sleep 2

# Start Telegram bot
echo ""
echo "3️⃣  Starting Telegram Bot..."
venv/bin/python telegram_bot.py > outputs/logs/telegram_bot.log 2>&1 &
BOT_PID=$!
echo "   ✅ Bot started (PID: $BOT_PID)"
sleep 2

# Save PIDs
echo "$COMFYUI_PID $API_PID $BOT_PID" > outputs/logs/pids.txt

echo ""
echo "🎉 All services started!"
echo ""
echo "📊 Service Status:"
echo "   ComfyUI:  ${COMFYUI_PID:-Not running}"
echo "   API:      $API_PID"
echo "   Bot:      $BOT_PID"
echo ""
echo "📱 Open Telegram and chat with your bot!"
echo ""
echo "📋 Logs:"
if [ "$SKIP_COMFYUI" != "true" ]; then
    echo "   ComfyUI: tail -f outputs/logs/comfyui.log"
fi
echo "   API:     tail -f outputs/logs/api.log"
echo "   Bot:     tail -f outputs/logs/telegram_bot.log"
echo ""
echo "🛑 To stop all services:"
echo "   ./stop_services.sh"
echo ""
