#!/bin/bash
# Setup InstantID for Face-Consistent Image Generation

set -e

COMFYUI_DIR="$HOME/Documents/Git/Unicorn_Ai/comfyui"

echo "🎨 Setting up InstantID for Luna face consistency"
echo "=================================================="
echo ""

# Step 1: Install ComfyUI Manager
echo "📦 Step 1: Installing ComfyUI Manager..."
cd "$COMFYUI_DIR/custom_nodes"
if [ ! -d "ComfyUI-Manager" ]; then
    git clone https://github.com/ltdrdata/ComfyUI-Manager.git
    echo "✅ ComfyUI Manager installed"
else
    echo "✅ ComfyUI Manager already installed"
fi

# Step 2: Install InstantID
echo ""
echo "📦 Step 2: Installing InstantID..."
if [ ! -d "ComfyUI_InstantID" ]; then
    git clone https://github.com/cubiq/ComfyUI_InstantID.git
    cd ComfyUI_InstantID
    
    # Activate ComfyUI venv and install requirements
    cd "$COMFYUI_DIR"
    source venv/bin/activate
    pip install insightface onnxruntime-gpu
    deactivate
    
    echo "✅ InstantID installed"
else
    echo "✅ InstantID already installed"
fi

# Step 3: Create model directories
echo ""
echo "📁 Step 3: Creating model directories..."
mkdir -p "$COMFYUI_DIR/models/instantid"
mkdir -p "$COMFYUI_DIR/models/insightface/models/antelopev2"
echo "✅ Directories created"

# Step 4: Download InstantID models
echo ""
echo "📥 Step 4: Downloading InstantID models..."
cd "$COMFYUI_DIR/models/instantid"

if [ ! -f "ip-adapter.bin" ]; then
    echo "Downloading InstantID IP-Adapter..."
    wget -q --show-progress https://huggingface.co/InstantX/InstantID/resolve/main/ip-adapter.bin
    echo "✅ IP-Adapter downloaded"
else
    echo "✅ IP-Adapter already exists"
fi

if [ ! -f "ControlNetModel/config.json" ]; then
    echo "Downloading InstantID ControlNet..."
    mkdir -p ControlNetModel
    cd ControlNetModel
    wget -q --show-progress https://huggingface.co/InstantX/InstantID/resolve/main/ControlNetModel/config.json
    wget -q --show-progress https://huggingface.co/InstantX/InstantID/resolve/main/ControlNetModel/diffusion_pytorch_model.safetensors
    cd ..
    echo "✅ ControlNet downloaded"
else
    echo "✅ ControlNet already exists"
fi

# Step 5: Download face analysis models
echo ""
echo "📥 Step 5: Downloading face analysis models..."
cd "$COMFYUI_DIR/models/insightface/models/antelopev2"

if [ ! -f "1k3d68.onnx" ]; then
    echo "Downloading antelopev2 models (this may take a few minutes)..."
    wget -q --show-progress https://huggingface.co/MonsterMMORPG/tools/resolve/main/1k3d68.onnx
    wget -q --show-progress https://huggingface.co/MonsterMMORPG/tools/resolve/main/2d106det.onnx
    wget -q --show-progress https://huggingface.co/MonsterMMORPG/tools/resolve/main/genderage.onnx
    wget -q --show-progress https://huggingface.co/MonsterMMORPG/tools/resolve/main/glintr100.onnx
    wget -q --show-progress https://huggingface.co/MonsterMMORPG/tools/resolve/main/scrfd_10g_bnkps.onnx
    echo "✅ Face analysis models downloaded"
else
    echo "✅ Face analysis models already exist"
fi

# Step 6: Create reference images directory
echo ""
echo "📁 Step 6: Setting up reference images..."
cd "$HOME/Documents/Git/Unicorn_Ai"
mkdir -p reference_images
echo "✅ Reference images directory created"
echo ""
echo "📝 IMPORTANT: Place your Luna reference image in:"
echo "   $HOME/Documents/Git/Unicorn_Ai/reference_images/luna.jpg"

# Step 7: Restart ComfyUI
echo ""
echo "🔄 Step 7: Restarting ComfyUI..."
cd "$HOME/Documents/Git/Unicorn_Ai"
./service.sh restart comfyui

echo ""
echo "✅ Setup Complete!"
echo ""
echo "Next Steps:"
echo "1. Place your Luna reference image at: reference_images/luna.jpg"
echo "2. Open ComfyUI: http://localhost:8188"
echo "3. Load the InstantID workflow (will be created next)"
echo "4. Generate images with consistent Luna face!"
