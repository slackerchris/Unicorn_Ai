#!/bin/bash
# Service Manager - Start/Stop/Restart individual services

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

show_help() {
    echo "Unicorn AI Service Manager"
    echo ""
    echo "Usage: ./service.sh [command] [service]"
    echo ""
    echo "Commands:"
    echo "  start [service]   - Start a service"
    echo "  stop [service]    - Stop a service"
    echo "  restart [service] - Restart a service"
    echo "  status            - Show status of all services"
    echo ""
    echo "Services:"
    echo "  api       - FastAPI backend (main.py)"
    echo "  comfyui   - ComfyUI image generation"
    echo "  tts       - Coqui TTS service"
    echo "  telegram  - Telegram bot"
    echo "  all       - All services"
    echo ""
    echo "Examples:"
    echo "  ./service.sh start api"
    echo "  ./service.sh restart comfyui"
    echo "  ./service.sh status"
}

check_service() {
    case $1 in
        api)
            # Check for main.py in Unicorn_Ai directory (not comfyui subdirectory)
            pgrep -f "python main.py" | while read pid; do
                pwdx $pid 2>/dev/null | grep -q "Unicorn_Ai$" && ! pwdx $pid 2>/dev/null | grep -q "comfyui" && echo "✅ Running" && exit 0
            done
            [ $? -eq 0 ] || echo "❌ Stopped"
            ;;
        comfyui)
            # Check for main.py with --port 8188
            ps aux | grep "python main.py.*8188" | grep -v grep > /dev/null && echo "✅ Running" || echo "❌ Stopped"
            ;;
        tts)
            pgrep -f "tts_server.py" > /dev/null && echo "✅ Running" || echo "❌ Stopped"
            ;;
        telegram)
            pgrep -f "telegram_bot.py" > /dev/null && echo "✅ Running" || echo "❌ Stopped"
            ;;
    esac
}

start_service() {
    case $1 in
        api)
            echo "🚀 Starting API server..."
            source venv/bin/activate
            nohup python main.py > outputs/logs/api.log 2>&1 &
            sleep 2
            echo "   Status: $(check_service api)"
            ;;
        comfyui)
            echo "🚀 Starting ComfyUI..."
            if [ ! -d "comfyui" ]; then
                echo "   ❌ ComfyUI not installed. Run ./install_comfyui.sh"
                return 1
            fi
            nohup ./start_comfyui.sh > outputs/logs/comfyui.log 2>&1 &
            sleep 5
            echo "   Status: $(check_service comfyui)"
            ;;
        tts)
            echo "🚀 Starting TTS service..."
            cd tts_service_coqui
            source venv/bin/activate
            nohup python tts_server.py > ../outputs/logs/tts.log 2>&1 &
            deactivate
            cd ..
            sleep 2
            echo "   Status: $(check_service tts)"
            ;;
        telegram)
            echo "🚀 Starting Telegram bot..."
            source venv/bin/activate
            nohup python telegram_bot.py > outputs/logs/telegram.log 2>&1 &
            sleep 2
            echo "   Status: $(check_service telegram)"
            ;;
        all)
            start_service tts
            start_service comfyui
            start_service api
            ;;
    esac
}

stop_service() {
    case $1 in
        api)
            echo "🛑 Stopping API server..."
            # Kill only the main API (port 8000), not ComfyUI (port 8188)
            # Find the process listening on port 8000
            lsof -ti:8000 2>/dev/null | xargs -r kill
            sleep 1
            echo "   Status: $(check_service api)"
            ;;
        comfyui)
            echo "🛑 Stopping ComfyUI..."
            # Kill only ComfyUI (port 8188)
            lsof -ti:8188 2>/dev/null | xargs -r kill
            sleep 1
            echo "   Status: $(check_service comfyui)"
            ;;
        tts)
            echo "🛑 Stopping TTS service..."
            pkill -f "tts_server.py"
            sleep 1
            echo "   Status: $(check_service tts)"
            ;;
        telegram)
            echo "🛑 Stopping Telegram bot..."
            pkill -f "telegram_bot.py"
            sleep 1
            echo "   Status: $(check_service telegram)"
            ;;
        all)
            stop_service telegram
            stop_service api
            stop_service comfyui
            stop_service tts
            ;;
    esac
}

restart_service() {
    echo "🔄 Restarting $1..."
    stop_service $1
    sleep 2
    start_service $1
}

show_status() {
    echo "Unicorn AI Service Status"
    echo "========================="
    echo "API Server:    $(check_service api)"
    echo "ComfyUI:       $(check_service comfyui)"
    echo "TTS Service:   $(check_service tts)"
    echo "Telegram Bot:  $(check_service telegram)"
    echo ""
    echo "Ports:"
    echo "  8000: $(ss -tuln | grep :8000 > /dev/null && echo '✅ Open' || echo '❌ Closed')"
    echo "  8188: $(ss -tuln | grep :8188 > /dev/null && echo '✅ Open' || echo '❌ Closed')"
    echo "  5050: $(ss -tuln | grep :5050 > /dev/null && echo '✅ Open' || echo '❌ Closed')"
}

# Main command handling
case ${1:-status} in
    start)
        if [ -z "$2" ]; then
            echo "Error: Please specify a service"
            show_help
            exit 1
        fi
        start_service $2
        ;;
    stop)
        if [ -z "$2" ]; then
            echo "Error: Please specify a service"
            show_help
            exit 1
        fi
        stop_service $2
        ;;
    restart)
        if [ -z "$2" ]; then
            echo "Error: Please specify a service"
            show_help
            exit 1
        fi
        restart_service $2
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Error: Unknown command '$1'"
        show_help
        exit 1
        ;;
esac
