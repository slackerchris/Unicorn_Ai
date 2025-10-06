#!/bin/bash
# Unicorn AI - Simple Install Script
# For NVIDIA GPU systems

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🦄 Unicorn AI - Simple Install${NC}"
echo "================================"
echo ""

# 1. Check NVIDIA GPU
if ! command -v nvidia-smi &> /dev/null; then
    echo -e "${RED}❌ NVIDIA GPU not detected${NC}"
    exit 1
fi
echo -e "${GREEN}✅ NVIDIA GPU detected${NC}"

# 2. Check Ollama
if ! command -v ollama &> /dev/null; then
    echo -e "${RED}❌ Ollama not installed${NC}"
    echo "Install from: https://ollama.ai"
    exit 1
fi
echo -e "${GREEN}✅ Ollama installed${NC}"

# 3. Create venv if needed
if [ ! -d "venv" ]; then
    echo -e "${CYAN}Creating virtual environment...${NC}"
    python3 -m venv venv
fi
echo -e "${GREEN}✅ Virtual environment ready${NC}"

# 4. Install dependencies
echo -e "${CYAN}Installing dependencies...${NC}"
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
pip install -q torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
echo -e "${GREEN}✅ Dependencies installed${NC}"

# 5. Verify CUDA
CUDA_CHECK=$(python -c "import torch; print(torch.cuda.is_available())" 2>/dev/null)
if [ "$CUDA_CHECK" != "True" ]; then
    echo -e "${YELLOW}⚠️  CUDA not available - image generation may not work${NC}"
else
    echo -e "${GREEN}✅ CUDA working${NC}"
fi

# 6. Create config if needed
if [ ! -f "config/.env" ]; then
    if [ -f "config/.env.example" ]; then
        cp config/.env.example config/.env
        echo -e "${GREEN}✅ Config created${NC}"
    fi
fi

# 7. Check for models
echo ""
echo -e "${CYAN}Checking for AI models...${NC}"
if [ -d "$HOME/.local/share/ComfyUI/checkpoints" ]; then
    MODEL_COUNT=$(ls -1 "$HOME/.local/share/ComfyUI/checkpoints"/*.safetensors 2>/dev/null | wc -l)
    if [ $MODEL_COUNT -gt 0 ]; then
        echo -e "${GREEN}✅ Found $MODEL_COUNT models at ~/.local/share/ComfyUI/${NC}"
        
        # Configure to use them
        cat > comfyui/extra_model_paths.yaml << EOF
system_comfyui:
    base_path: $HOME/.local/share/ComfyUI/
    checkpoints: checkpoints/
    vae: vae/
    loras: loras/
    clip: clip/
    clip_vision: clip_vision/
EOF
        echo -e "${GREEN}✅ Configured to use existing models${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No models found${NC}"
    echo -e "${CYAN}   Install ComfyUI: bash install_comfyui.sh${NC}"
fi

# 8. Check Ollama model
echo ""
echo -e "${CYAN}Checking Ollama models...${NC}"
if ollama list | grep -q "dolphin-mistral"; then
    echo -e "${GREEN}✅ dolphin-mistral installed${NC}"
else
    echo -e "${YELLOW}⚠️  dolphin-mistral not found${NC}"
    read -p "Download now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ollama pull dolphin-mistral
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════╗${NC}"
echo -e "${GREEN}║      ✅ Installation Complete      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Start the system:${NC}"
echo "  bash start_all.sh"
echo ""
echo -e "${CYAN}Then open:${NC}"
echo "  http://localhost:8000"
