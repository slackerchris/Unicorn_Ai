#!/bin/bash
# Unicorn AI - NVIDIA Setup Script
# Fresh installation for NVIDIA GPU systems

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
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
echo "║     🦄 UNICORN AI NVIDIA SETUP 🦄      ║"
echo "║                                        ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running on NVIDIA
echo -e "${CYAN}🔍 Checking for NVIDIA GPU...${NC}"
if command -v nvidia-smi &> /dev/null; then
    GPU_INFO=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -n1)
    echo -e "${GREEN}✅ Found: $GPU_INFO${NC}"
else
    echo -e "${RED}❌ NVIDIA GPU not detected!${NC}"
    echo -e "${YELLOW}   This script is for NVIDIA systems${NC}"
    exit 1
fi

# Check for pip
echo -e "${CYAN}🔍 Checking for pip...${NC}"
if ! command -v pip3 &> /dev/null; then
    echo -e "${YELLOW}⚠️  pip not found. Installing...${NC}"
    echo -e "${CYAN}   This requires sudo access${NC}"
    sudo apt update
    sudo apt install -y python3-pip python3-venv
    echo -e "${GREEN}✅ pip installed${NC}"
else
    echo -e "${GREEN}✅ pip found${NC}"
fi

# Check for Ollama
echo -e "${CYAN}🔍 Checking for Ollama...${NC}"
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✅ Ollama found${NC}"
    
    # Check if ollama service is running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Ollama is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Ollama is installed but not running${NC}"
        echo -e "${CYAN}   Starting Ollama service...${NC}"
        # Try to start as service or standalone
        if systemctl status ollama &> /dev/null; then
            sudo systemctl start ollama
        else
            echo -e "${YELLOW}   Run 'ollama serve' in another terminal${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Ollama not found${NC}"
    echo -e "${CYAN}   Install from: https://ollama.ai${NC}"
    echo -e "${RED}   Ollama is REQUIRED. Exiting.${NC}"
    exit 1
fi

# Create directories
echo -e "${CYAN}📁 Creating directories...${NC}"
mkdir -p data/personas data/conversations
mkdir -p outputs/logs outputs/voice_messages outputs/generated_images
mkdir -p config
echo -e "${GREEN}✅ Directories created${NC}"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo -e "${CYAN}🐍 Creating Python virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
else
    echo -e "${GREEN}✅ Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo -e "${CYAN}🔌 Activating virtual environment...${NC}"
source venv/bin/activate
echo -e "${GREEN}✅ Virtual environment activated${NC}"

# Upgrade pip in venv
echo -e "${CYAN}⬆️  Upgrading pip...${NC}"
pip install --upgrade pip
echo -e "${GREEN}✅ pip upgraded${NC}"

# Install core dependencies
echo -e "${CYAN}📦 Installing core dependencies...${NC}"
pip install -r requirements.txt
echo -e "${GREEN}✅ Core dependencies installed${NC}"

# Install PyTorch with CUDA
echo -e "${CYAN}🔥 Installing PyTorch with CUDA 12.1...${NC}"
echo -e "${YELLOW}   This may take a few minutes...${NC}"
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
echo -e "${GREEN}✅ PyTorch installed${NC}"

# Verify CUDA
echo -e "${CYAN}🔍 Verifying CUDA support...${NC}"
CUDA_CHECK=$(python -c "import torch; print(torch.cuda.is_available())" 2>/dev/null)
if [ "$CUDA_CHECK" = "True" ]; then
    GPU_NAME=$(python -c "import torch; print(torch.cuda.get_device_name(0))" 2>/dev/null)
    echo -e "${GREEN}✅ CUDA is working! GPU: $GPU_NAME${NC}"
else
    echo -e "${RED}❌ CUDA not detected by PyTorch${NC}"
    echo -e "${YELLOW}   Image generation may not work properly${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f "config/.env" ]; then
    echo -e "${CYAN}📝 Creating config/.env...${NC}"
    if [ -f "config/.env.example" ]; then
        cp config/.env.example config/.env
        echo -e "${GREEN}✅ Created config/.env from example${NC}"
        echo -e "${YELLOW}⚠️  Edit config/.env to customize settings${NC}"
    else
        # Create a basic .env
        cat > config/.env << 'EOF'
# Unicorn AI Configuration

# Ollama Settings
OLLAMA_MODEL=dolphin-mistral:latest
OLLAMA_URL=http://localhost:11434

# Image Generation
IMAGE_PROVIDER=comfyui
COMFYUI_URL=http://localhost:8188

# Optional: Telegram Bot
# TELEGRAM_BOT_TOKEN=your_token_here

# Optional: Replicate (cloud image generation, costs money)
# REPLICATE_API_TOKEN=your_token_here
EOF
        echo -e "${GREEN}✅ Created basic config/.env${NC}"
    fi
else
    echo -e "${GREEN}✅ config/.env already exists${NC}"
fi

# Check for dolphin-mistral model
echo -e "${CYAN}🔍 Checking for dolphin-mistral model...${NC}"
if ollama list | grep -q "dolphin-mistral"; then
    echo -e "${GREEN}✅ dolphin-mistral found${NC}"
else
    echo -e "${YELLOW}⚠️  dolphin-mistral not found${NC}"
    read -p "Download dolphin-mistral model? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${CYAN}📥 Downloading dolphin-mistral (this will take a while)...${NC}"
        ollama pull dolphin-mistral
        echo -e "${GREEN}✅ Model downloaded${NC}"
    else
        echo -e "${YELLOW}⚠️  You can download it later with: ollama pull dolphin-mistral${NC}"
    fi
fi

# Ask about ComfyUI
echo ""
echo -e "${CYAN}🎨 ComfyUI Setup${NC}"
echo -e "${YELLOW}   ComfyUI enables AI image generation${NC}"
read -p "Install ComfyUI now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}📥 Installing ComfyUI...${NC}"
    bash install_comfyui.sh
    echo -e "${GREEN}✅ ComfyUI installed${NC}"
else
    echo -e "${YELLOW}⚠️  You can install it later with: bash install_comfyui.sh${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════╗"
echo "║                                        ║"
echo "║       ✅ SETUP COMPLETE! ✅            ║"
echo "║                                        ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}🚀 Next Steps:${NC}"
echo ""
echo -e "${YELLOW}1. Review/edit config:${NC}"
echo -e "   nano config/.env"
echo ""
echo -e "${YELLOW}2. Start all services:${NC}"
echo -e "   bash start_all.sh"
echo ""
echo -e "${YELLOW}3. Open in browser:${NC}"
echo -e "   Web UI:    ${GREEN}http://localhost:8000${NC}"
echo -e "   API Docs:  ${GREEN}http://localhost:8000/docs${NC}"
echo -e "   ComfyUI:   ${GREEN}http://localhost:8188${NC}"
echo ""
echo -e "${CYAN}📚 Documentation:${NC}"
echo -e "   - README.md"
echo -e "   - QUICKSTART.md"
echo -e "   - NVIDIA_MIGRATION_REVIEW.md"
echo ""
echo -e "${PURPLE}💡 Note: The virtual environment is in ./venv${NC}"
echo -e "${PURPLE}   It's automatically activated by start_all.sh${NC}"
echo ""
echo -e "${GREEN}🎉 Enjoy your AI companion!${NC}"
