#!/bin/bash
# Test Image Generation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔════════════════════════════════════════╗"
echo "║   🖼️  IMAGE GENERATION TEST 🖼️         ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Web UI is running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Web UI is not running!${NC}"
    echo -e "${YELLOW}   Start it with: bash start_all.sh${NC}"
    exit 1
fi

# Check if ComfyUI is running
if ! curl -s http://localhost:8188 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  ComfyUI is not running${NC}"
    echo -e "${YELLOW}   Image generation will fail${NC}"
fi

echo -e "${CYAN}🎨 Testing image generation...${NC}"
echo -e "${YELLOW}   Prompt: beautiful sunset over mountains${NC}"
echo -e "${YELLOW}   Size: 512x512${NC}"
echo -e "${YELLOW}   This may take 5-60 seconds depending on CPU/GPU${NC}"
echo ""

# Generate image
START_TIME=$(date +%s)

curl -s -X POST \
    "http://localhost:8000/generate-image?prompt=beautiful+sunset+over+mountains&width=512&height=512" \
    -o /tmp/unicorn_test_image.png

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${CYAN}⏱️  Generation took: ${DURATION} seconds${NC}"
echo ""

# Check result
FILE_TYPE=$(file -b /tmp/unicorn_test_image.png)

if [[ $FILE_TYPE == *"PNG image"* ]]; then
    echo -e "${GREEN}✅ SUCCESS! Image generated!${NC}"
    echo -e "${GREEN}   File: /tmp/unicorn_test_image.png${NC}"
    echo -e "${GREEN}   Type: $FILE_TYPE${NC}"
    echo ""
    echo -e "${CYAN}📂 Opening image...${NC}"
    
    # Try to open the image
    if command -v xdg-open > /dev/null; then
        xdg-open /tmp/unicorn_test_image.png
    elif command -v eog > /dev/null; then
        eog /tmp/unicorn_test_image.png &
    elif command -v gwenview > /dev/null; then
        gwenview /tmp/unicorn_test_image.png &
    else
        echo -e "${YELLOW}   View manually: /tmp/unicorn_test_image.png${NC}"
    fi
    
elif [[ $FILE_TYPE == *"JSON"* ]]; then
    echo -e "${RED}❌ FAILED! Got error response${NC}"
    echo -e "${YELLOW}Error details:${NC}"
    cat /tmp/unicorn_test_image.png | python3 -m json.tool 2>/dev/null || cat /tmp/unicorn_test_image.png
    echo ""
    echo -e "${CYAN}💡 Possible fixes:${NC}"
    echo -e "   1. Enable CPU mode: nano config/.env (add COMFYUI_USE_CPU=1)"
    echo -e "   2. Check ComfyUI logs: tail -f outputs/logs/comfyui.log"
    echo -e "   3. See docs/IMAGE_GEN_AMD_FIX.md for more options"
    exit 1
else
    echo -e "${RED}❌ FAILED! Unknown response${NC}"
    echo -e "${YELLOW}File type: $FILE_TYPE${NC}"
    head -20 /tmp/unicorn_test_image.png
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Image generation is working!${NC}"
echo -e "${CYAN}Try it in the Web UI by chatting:${NC}"
echo -e '   "Send me a selfie!"'
echo -e '   "Draw me a picture of a cat"'
echo ""
