#!/bin/bash
# Download essential models for ComfyUI
# This downloads lightweight models suitable for character generation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMFYUI_DIR="$SCRIPT_DIR/comfyui"

# Auto-detect models location from extra_model_paths.yaml
if [ -f "$COMFYUI_DIR/extra_model_paths.yaml" ]; then
    MODELS_DIR=$(grep "base_path:" "$COMFYUI_DIR/extra_model_paths.yaml" | head -1 | sed 's/.*base_path: *//' | sed 's|/$||')
    echo "📦 Using models location from config: $MODELS_DIR"
else
    # Default fallback
    MODELS_DIR="$HOME/.local/share/ComfyUI"
    echo "📦 No config found, using default: $MODELS_DIR"
    echo "   Run ./detect_models.sh first to configure"
fi

echo ""
echo "📦 Downloading AI models for Unicorn AI..."
echo ""
echo "=========================================="
echo ""
echo "⚠️  This will download ~6-8GB of models"
echo "This may take 10-30 minutes depending on your internet speed"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi
echo ""

# Function to download with progress
download_file() {
    local url=$1
    local output=$2
    local name=$3
    
    echo "📥 Downloading: $name"
    echo "   URL: $url"
    
    if [ -f "$output" ]; then
        echo "   ✅ Already exists, skipping"
    else
        wget -c "$url" -O "$output" --progress=bar:force:noscroll
        echo "   ✅ Downloaded"
    fi
    echo ""
}

# 1. Main Checkpoint - Realistic Vision V5.1 (smaller, good quality)
echo "1/4 - Main Model (Realistic Vision)"
download_file \
    "https://huggingface.co/SG161222/Realistic_Vision_V5.1_noVAE/resolve/main/Realistic_Vision_V5.1.safetensors" \
    "$MODELS_DIR/checkpoints/realisticVision_v51.safetensors" \
    "Realistic Vision V5.1"

# 2. VAE (for better colors/quality)
echo "2/4 - VAE Model"
download_file \
    "https://huggingface.co/stabilityai/sd-vae-ft-mse-original/resolve/main/vae-ft-mse-840000-ema-pruned.safetensors" \
    "$MODELS_DIR/vae/vae-ft-mse-840000-ema-pruned.safetensors" \
    "SD VAE"

# 3. IPAdapter (for character consistency)
echo "3/4 - IPAdapter (Character Consistency)"
mkdir -p "$MODELS_DIR/ipadapter"
download_file \
    "https://huggingface.co/h94/IP-Adapter/resolve/main/models/ip-adapter_sd15.safetensors" \
    "$MODELS_DIR/ipadapter/ip-adapter_sd15.safetensors" \
    "IPAdapter SD1.5"

# 4. CLIP Vision (required for IPAdapter)
echo "4/4 - CLIP Vision Model"
download_file \
    "https://huggingface.co/h94/IP-Adapter/resolve/main/models/image_encoder/model.safetensors" \
    "$MODELS_DIR/clip_vision/clip_vision_model.safetensors" \
    "CLIP Vision"

echo ""
echo "✅ All models downloaded!"
echo ""
echo "📊 Disk space used:"
du -sh "$MODELS_DIR"
echo ""
echo "📋 Next steps:"
echo "1. Start ComfyUI: ./start_comfyui.sh"
echo "2. Open browser: http://localhost:8188"
echo "3. Test image generation"
echo ""
