#!/bin/bash
# Start Unicorn AI Web UI
# Phase 6: Web Interface

set -e

echo "🦄 Starting Unicorn AI Web UI..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/chris/Documents/Git/Unicorn_Ai"
cd "$PROJECT_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Check if Ollama is running
echo "🔍 Checking Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Ollama not responding. Make sure it's running!${NC}"
    echo "   Start it with: sudo systemctl start ollama"
    exit 1
fi

# Check if static files exist
if [ ! -f "static/index.html" ]; then
    echo -e "${YELLOW}⚠️  Web UI files not found in static/!${NC}"
    exit 1
fi

# Check if personas exist
if [ ! -d "data/personas" ]; then
    echo -e "${BLUE}📁 Creating personas directory...${NC}"
    mkdir -p data/personas
fi

# Kill any existing instances
echo "🔍 Checking for existing instances..."
if pgrep -f "python main.py" > /dev/null; then
    echo "⚠️  Stopping existing instance..."
    pkill -f "python main.py"
    sleep 2
fi

# Start the API server with Web UI
echo -e "${GREEN}🚀 Starting Unicorn AI API + Web UI...${NC}"
nohup python main.py > outputs/logs/webui.log 2>&1 &
API_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if it's running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Unicorn AI is running!${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}🌐 Web UI:${NC}       http://localhost:8000"
    echo -e "${BLUE}📚 API Docs:${NC}     http://localhost:8000/docs"
    echo -e "${BLUE}🏥 Health:${NC}       http://localhost:8000/health"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${GREEN}✨ Open your browser and navigate to: http://localhost:8000${NC}"
    echo ""
    echo "📋 Process ID: $API_PID"
    echo "📁 Logs: outputs/logs/webui.log"
    echo ""
    echo "To stop the server:"
    echo "  pkill -f 'python main.py'"
    echo ""
else
    echo -e "${YELLOW}⚠️  Server started but not responding. Check logs:${NC}"
    echo "  tail -f outputs/logs/webui.log"
    exit 1
fi

# Optional: Open browser automatically
if command -v xdg-open > /dev/null 2>&1; then
    echo "🌐 Opening browser..."
    xdg-open http://localhost:8000 2>/dev/null &
elif command -v open > /dev/null 2>&1; then
    echo "🌐 Opening browser..."
    open http://localhost:8000 2>/dev/null &
fi

echo "🦄 Enjoy chatting with your AI companion!"
