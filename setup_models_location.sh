#!/bin/bash
# Setup centralized AI models location for Unicorn AI
# This keeps large model files separate from the project code

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🗂️  Setting up centralized AI models location${NC}"
echo "=============================================="
echo ""

# Recommended location: ~/ai-models/
DEFAULT_MODELS_DIR="$HOME/ai-models"

echo "Where would you like to store AI models?"
echo ""
echo "Recommended locations:"
echo "  1. ~/ai-models (default) - In your home directory"
echo "  2. /opt/ai-models - System-wide (requires sudo)"
echo "  3. Custom path"
echo ""
read -p "Enter path [default: $DEFAULT_MODELS_DIR]: " MODELS_DIR
MODELS_DIR=${MODELS_DIR:-$DEFAULT_MODELS_DIR}

# Expand ~ to home directory
MODELS_DIR="${MODELS_DIR/#\~/$HOME}"

echo ""
echo -e "${CYAN}📁 Creating models directory structure...${NC}"

# Create the main structure
mkdir -p "$MODELS_DIR/comfyui/checkpoints"
mkdir -p "$MODELS_DIR/comfyui/vae"
mkdir -p "$MODELS_DIR/comfyui/loras"
mkdir -p "$MODELS_DIR/comfyui/embeddings"
mkdir -p "$MODELS_DIR/comfyui/ipadapter"
mkdir -p "$MODELS_DIR/comfyui/clip_vision"
mkdir -p "$MODELS_DIR/comfyui/controlnet"
mkdir -p "$MODELS_DIR/comfyui/upscale_models"

echo -e "${GREEN}✅ Directory structure created at: $MODELS_DIR${NC}"
echo ""

# Update ComfyUI extra_model_paths.yaml
COMFYUI_DIR="$(dirname "$0")/comfyui"
EXTRA_PATHS_FILE="$COMFYUI_DIR/extra_model_paths.yaml"

echo -e "${CYAN}📝 Configuring ComfyUI to use external models...${NC}"

cat > "$EXTRA_PATHS_FILE" << EOF
# ComfyUI External Model Paths Configuration
# This allows ComfyUI to use models stored outside the project directory

unicorn_ai:
    base_path: $MODELS_DIR/comfyui/
    
    checkpoints: checkpoints/
    vae: vae/
    loras: loras/
    embeddings: embeddings/
    hypernetworks: hypernetworks/
    upscale_models: upscale_models/
    controlnet: controlnet/
    clip_vision: clip_vision/
    ipadapter: ipadapter/
    style_models: style_models/
    text_encoders: text_encoders/
    unet: unet/
EOF

echo -e "${GREEN}✅ ComfyUI configured to use: $MODELS_DIR/comfyui/${NC}"
echo ""

# Create a .gitignore for the comfyui models directory
echo "# Models are stored externally" > "$COMFYUI_DIR/models/.gitignore"
echo "*" >> "$COMFYUI_DIR/models/.gitignore"
echo "!.gitignore" >> "$COMFYUI_DIR/models/.gitignore"

# Update download_models.sh
echo -e "${CYAN}📝 Updating download_models.sh to use new location...${NC}"

DOWNLOAD_SCRIPT="$(dirname "$0")/download_models.sh"
if [ -f "$DOWNLOAD_SCRIPT" ]; then
    # Backup original
    cp "$DOWNLOAD_SCRIPT" "${DOWNLOAD_SCRIPT}.backup"
    
    # Update the MODELS_DIR variable
    sed -i "s|^MODELS_DIR=.*|MODELS_DIR=\"$MODELS_DIR/comfyui\"|" "$DOWNLOAD_SCRIPT"
    
    echo -e "${GREEN}✅ download_models.sh updated${NC}"
else
    echo -e "${YELLOW}⚠️  download_models.sh not found${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                        ║${NC}"
echo -e "${GREEN}║        ✅ SETUP COMPLETE! ✅           ║${NC}"
echo -e "${GREEN}║                                        ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo ""
echo -e "${CYAN}📊 Models will be stored at:${NC}"
echo -e "   ${YELLOW}$MODELS_DIR/comfyui/${NC}"
echo ""
echo -e "${CYAN}💾 Current disk usage:${NC}"
du -sh "$MODELS_DIR" 2>/dev/null || echo "   0 bytes (empty)"
echo ""
echo -e "${CYAN}📋 Next steps:${NC}"
echo "1. Download models:"
echo "   bash download_models.sh"
echo ""
echo "2. Models will be downloaded to:"
echo "   $MODELS_DIR/comfyui/"
echo ""
echo "3. These models can be shared across multiple projects!"
echo ""
echo -e "${YELLOW}💡 Tip: Add this to your backup exclusions (models can be re-downloaded)${NC}"
