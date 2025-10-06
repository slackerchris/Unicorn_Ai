#!/bin/bash
# Start ComfyUI server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMFYUI_DIR="$SCRIPT_DIR/comfyui"

if [ ! -d "$COMFYUI_DIR" ]; then
    echo "❌ ComfyUI not installed. Run ./install_comfyui.sh first"
    exit 1
fi

echo "🚀 Starting ComfyUI..."
cd "$COMFYUI_DIR"

# Activate venv and start with low VRAM mode
source venv/bin/activate
python main.py --listen 0.0.0.0 --port 8188 --lowvram
