#!/bin/bash
# Unicorn AI - Complete Startup Script
# Starts all services in the correct order

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "╔════════════════════════════════════════╗"
echo "║                                        ║"
echo "║        🦄 UNICORN AI STARTUP 🦄        ║"
echo "║                                        ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_wait=30
    local count=0
    
    echo -e "${YELLOW}⏳ Waiting for $name to start...${NC}"
    while [ $count -lt $max_wait ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi
        sleep 1
        count=$((count + 1))
        echo -n "."
    done
    echo -e "${RED}❌ $name failed to start within ${max_wait}s${NC}"
    return 1
}

# Function to stop existing services
stop_services() {
    echo -e "${CYAN}🛑 Stopping any existing services...${NC}"
    pkill -f "python.*main.py" 2>/dev/null && echo "  Stopped Web UI" || true
    pkill -f "python.*telegram_bot.py" 2>/dev/null && echo "  Stopped Telegram Bot" || true
    pkill -f "python.*tts_server.py" 2>/dev/null && echo "  Stopped TTS Service" || true
    pkill -f "python.*comfyui/main.py" 2>/dev/null && echo "  Stopped ComfyUI" || true
    sleep 2
}

# ==========================================
# STEP 1: PRE-FLIGHT CHECKS
# ==========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 STEP 1: Pre-flight Checks${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if Ollama is running
echo -e "${CYAN}🔍 Checking Ollama...${NC}"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ollama is running${NC}"
else
    echo -e "${RED}❌ Ollama is not running!${NC}"
    echo -e "${YELLOW}   Please start Ollama first: systemctl start ollama${NC}"
    exit 1
fi

# Check if required directories exist
echo -e "${CYAN}🔍 Checking directories...${NC}"
for dir in data/personas data/conversations outputs/logs outputs/voice_messages outputs/generated_images; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo -e "${GREEN}✅ Created $dir${NC}"
    fi
done

# Stop any existing services
stop_services

# ==========================================
# STEP 2: START COMFYUI (Optional)
# ==========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🎨 STEP 2: Image Generation (ComfyUI)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "comfyui" ] && [ -f "comfyui/main.py" ]; then
    echo -e "${CYAN}🚀 Starting ComfyUI server...${NC}"
    cd comfyui
    
    if [ -d "venv" ]; then
        source venv/bin/activate
        
        # AMD GPU environment variables for RX 6700 XT (gfx1031)
        export HSA_OVERRIDE_GFX_VERSION=10.3.0
        export MIOPEN_DISABLE_CACHE=1
        export PYTORCH_HIP_ALLOC_CONF=garbage_collection_threshold:0.9,max_split_size_mb:128
        export GPU_MAX_HEAP_SIZE=100
        export GPU_MAX_ALLOC_PERCENT=90
        
        # Use system ROCm if available
        if [ -d "/opt/rocm" ]; then
            export ROCM_PATH=/opt/rocm
            export LD_LIBRARY_PATH=$ROCM_PATH/lib:$LD_LIBRARY_PATH
        fi
        
        echo -e "${CYAN}   Starting on port 8188 with GPU and CORS enabled${NC}"
        nohup python main.py --normalvram --listen 0.0.0.0 --port 8188 --enable-cors-header "*" > ../outputs/logs/comfyui.log 2>&1 &
        
        COMFYUI_PID=$!
        echo -e "${GREEN}✅ ComfyUI started (PID: $COMFYUI_PID)${NC}"
        cd ..
        
        # Wait for ComfyUI to be ready
        if wait_for_service "http://localhost:8188" "ComfyUI"; then
            echo -e "${GREEN}   🎨 Image generation: ENABLED${NC}"
        else
            echo -e "${YELLOW}   ⚠️  ComfyUI slow to start, continuing anyway...${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  ComfyUI venv not found, skipping${NC}"
        cd ..
    fi
else
    echo -e "${YELLOW}⚠️  ComfyUI not installed${NC}"
    echo -e "${YELLOW}   Image generation will be DISABLED${NC}"
    echo -e "${YELLOW}   Run ./install_comfyui.sh to enable${NC}"
fi

# ==========================================
# STEP 3: START TTS SERVICE
# ==========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔊 STEP 3: Text-to-Speech Service${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "tts_service_coqui" ] && [ -f "tts_service_coqui/tts_server.py" ]; then
    echo -e "${CYAN}🚀 Starting TTS Service...${NC}"
    cd tts_service_coqui
    
    if [ -d "venv" ]; then
        source venv/bin/activate
        
        echo -e "${CYAN}   Starting on port 5050${NC}"
        nohup python tts_server.py > ../outputs/logs/tts_service.log 2>&1 &
        
        TTS_PID=$!
        echo -e "${GREEN}✅ TTS Service started (PID: $TTS_PID)${NC}"
        deactivate
        cd ..
        
        # Wait for TTS to be ready
        if wait_for_service "http://localhost:5050/health" "TTS Service"; then
            echo -e "${GREEN}   🔊 Text-to-Speech: ENABLED${NC}"
        else
            echo -e "${YELLOW}   ⚠️  TTS slow to start (model loading), continuing...${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  TTS venv not found, skipping${NC}"
        cd ..
    fi
else
    echo -e "${YELLOW}⚠️  TTS Service not installed${NC}"
    echo -e "${YELLOW}   Voice messages will be DISABLED${NC}"
fi

# ==========================================
# STEP 4: START WEB UI + API
# ==========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🌐 STEP 4: Web UI + API Server${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${CYAN}🚀 Starting Web UI server...${NC}"

# Check if venv exists and activate it
if [ -d "venv" ]; then
    source venv/bin/activate
    nohup python main.py > outputs/logs/webui.log 2>&1 &
    WEBUI_PID=$!
else
    # Fallback to system python3
    nohup python3 main.py > outputs/logs/webui.log 2>&1 &
    WEBUI_PID=$!
fi

echo -e "${GREEN}✅ Web UI started (PID: $WEBUI_PID)${NC}"

# Wait for Web UI to be ready
wait_for_service "http://localhost:8000/health" "Web UI"

# ==========================================
# STEP 5: START TELEGRAM BOT (Optional)
# ==========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}💬 STEP 5: Telegram Bot${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f "telegram_bot.py" ]; then
    # Check if Telegram token is configured
    if grep -q "TELEGRAM_BOT_TOKEN" config/.env 2>/dev/null; then
        TOKEN=$(grep TELEGRAM_BOT_TOKEN config/.env | cut -d'=' -f2)
        if [ ! -z "$TOKEN" ] && [ "$TOKEN" != "your_token_here" ]; then
            echo -e "${CYAN}🚀 Starting Telegram bot...${NC}"
            
            # Use venv if available
            if [ -d "venv" ]; then
                source venv/bin/activate
                nohup python telegram_bot.py > outputs/logs/telegram.log 2>&1 &
            else
                nohup python3 telegram_bot.py > outputs/logs/telegram.log 2>&1 &
            fi
            
            TELEGRAM_PID=$!
            echo -e "${GREEN}✅ Telegram bot started (PID: $TELEGRAM_PID)${NC}"
            sleep 2
        else
            echo -e "${YELLOW}⚠️  Telegram token not configured${NC}"
            echo -e "${YELLOW}   Bot will not start${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No Telegram configuration found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  telegram_bot.py not found${NC}"
fi

# ==========================================
# STEP 6: SYSTEM STATUS
# ==========================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 STEP 6: System Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

sleep 2

# Get system status
echo -e "${CYAN}🔍 Checking all services...${NC}"
echo ""

# Check Ollama
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ollama:          http://localhost:11434${NC}"
else
    echo -e "${RED}❌ Ollama:          OFFLINE${NC}"
fi

# Check Web UI
if check_port 8000; then
    echo -e "${GREEN}✅ Web UI:          http://localhost:8000${NC}"
    echo -e "${GREEN}   API Docs:        http://localhost:8000/docs${NC}"
    echo -e "${GREEN}   Health Check:    http://localhost:8000/health${NC}"
else
    echo -e "${RED}❌ Web UI:          OFFLINE${NC}"
fi

# Check ComfyUI
if check_port 8188; then
    echo -e "${GREEN}✅ ComfyUI:         http://localhost:8188${NC}"
else
    echo -e "${YELLOW}⚠️  ComfyUI:         DISABLED${NC}"
fi

# Check TTS Service
if check_port 5050; then
    echo -e "${GREEN}✅ TTS Service:     http://localhost:5050${NC}"
else
    echo -e "${YELLOW}⚠️  TTS Service:     DISABLED${NC}"
fi

# Check Telegram Bot
if pgrep -f "telegram_bot.py" > /dev/null; then
    echo -e "${GREEN}✅ Telegram Bot:    RUNNING${NC}"
else
    echo -e "${YELLOW}⚠️  Telegram Bot:    DISABLED${NC}"
fi

# ==========================================
# FINAL STATUS
# ==========================================
echo ""
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 UNICORN AI IS RUNNING! 🎉${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}📋 Quick Start Guide:${NC}"
echo ""
echo -e "  ${GREEN}1. Open Web UI:${NC}"
echo -e "     ${BLUE}http://localhost:8000${NC}"
echo ""
echo -e "  ${GREEN}2. Available Personas:${NC}"
echo -e "     🌙 Luna    - Friendly & caring"
echo -e "     💻 Nova    - Tech-savvy assistant"
echo -e "     🧘 Sage    - Wise mentor"
echo -e "     ⚡ Alex    - Energetic buddy"
echo ""
echo -e "  ${GREEN}3. Features:${NC}"
echo -e "     ✨ Real-time chat"
echo -e "     🎨 Image generation $([ -f "comfyui/main.py" ] && echo "(enabled)" || echo "(disabled)")"
echo -e "     🔊 Voice responses"
echo -e "     📝 Custom personas"
echo ""
echo -e "${CYAN}📝 Process IDs:${NC}"
[ ! -z "$WEBUI_PID" ] && echo -e "  Web UI:     ${WEBUI_PID}"
[ ! -z "$COMFYUI_PID" ] && echo -e "  ComfyUI:    ${COMFYUI_PID}"
[ ! -z "$TTS_PID" ] && echo -e "  TTS:        ${TTS_PID}"
[ ! -z "$TELEGRAM_PID" ] && echo -e "  Telegram:   ${TELEGRAM_PID}"
echo ""
echo -e "${CYAN}📁 Log Files:${NC}"
echo -e "  outputs/logs/webui.log"
echo -e "  outputs/logs/comfyui.log"
echo -e "  outputs/logs/tts_service.log"
echo -e "  outputs/logs/telegram.log"
echo ""
echo -e "${CYAN}🛑 To stop all services:${NC}"
echo -e "  ${BLUE}bash stop_services.sh${NC}"
echo ""
echo -e "${GREEN}🦄 Enjoy your AI companion!${NC}"
echo ""

# Open browser automatically (optional)
if command -v xdg-open > /dev/null; then
    sleep 2
    echo -e "${CYAN}🌐 Opening browser...${NC}"
    xdg-open http://localhost:8000 > /dev/null 2>&1 &
fi
