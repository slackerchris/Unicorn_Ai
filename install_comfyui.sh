#!/bin/bash
# ComfyUI Installation Script for Unicorn AI
# This installs ComfyUI as a component of the Unicorn_Ai project

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMFYUI_DIR="$SCRIPT_DIR/comfyui"

echo "🦄 Installing ComfyUI for Unicorn AI..."
echo "========================================"
echo ""

# Check for GPU
echo "Checking GPU..."
if command -v nvidia-smi &> /dev/null; then
    echo "✅ NVIDIA GPU detected"
    GPU_TYPE="nvidia"
elif command -v rocm-smi &> /dev/null; then
    echo "✅ AMD GPU detected (ROCm)"
    GPU_TYPE="amd"
else
    echo "⚠️  No GPU detected - will use CPU (slow)"
    GPU_TYPE="cpu"
fi
echo ""

# Clone ComfyUI
if [ -d "$COMFYUI_DIR" ]; then
    echo "✅ ComfyUI directory already exists"
else
    echo "📦 Cloning ComfyUI..."
    git clone https://github.com/comfyanonymous/ComfyUI.git "$COMFYUI_DIR"
    echo "✅ ComfyUI cloned"
fi
echo ""

# Create Python virtual environment for ComfyUI
if [ -d "$COMFYUI_DIR/venv" ]; then
    echo "✅ ComfyUI venv already exists"
else
    echo "🐍 Creating Python virtual environment for ComfyUI..."
    cd "$COMFYUI_DIR"
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi
echo ""

# Install dependencies
echo "📦 Installing ComfyUI dependencies..."
cd "$COMFYUI_DIR"
source venv/bin/activate

pip install --upgrade pip

if [ "$GPU_TYPE" = "nvidia" ]; then
    echo "Installing for NVIDIA GPU..."
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
elif [ "$GPU_TYPE" = "amd" ]; then
    echo "Installing for AMD GPU (ROCm)..."
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm6.0
else
    echo "Installing for CPU..."
    pip install torch torchvision torchaudio
fi

pip install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Create model directories
echo "📁 Creating model directories..."
mkdir -p "$COMFYUI_DIR/models/checkpoints"
mkdir -p "$COMFYUI_DIR/models/vae"
mkdir -p "$COMFYUI_DIR/models/loras"
mkdir -p "$COMFYUI_DIR/models/controlnet"
mkdir -p "$COMFYUI_DIR/models/clip_vision"
mkdir -p "$COMFYUI_DIR/models/ipadapter"
mkdir -p "$COMFYUI_DIR/output"
echo "✅ Directories created"
echo ""

echo "✅ ComfyUI installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Download models (run: ./download_models.sh)"
echo "2. Start ComfyUI (run: ./start_comfyui.sh)"
echo "3. Test at: http://localhost:8188"
echo ""
