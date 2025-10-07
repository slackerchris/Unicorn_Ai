#!/bin/bash
# Quick Start Guide for InstantID

echo "🎨 InstantID Setup - Quick Start Guide"
echo "======================================"
echo ""

# Check if already set up
if [ -f "$HOME/Documents/Git/Unicorn_Ai/comfyui/models/instantid/ip-adapter.bin" ]; then
    echo "✅ InstantID is already installed!"
    echo ""
    echo "Quick Commands:"
    echo "  View reference image: ls -lh reference_images/"
    echo "  Test workflow: Use workflows/instantid_luna.json in ComfyUI"
    echo "  Open ComfyUI: http://localhost:8188"
    exit 0
fi

echo "InstantID is not installed yet."
echo ""
echo "To install, run:"
echo "  ./setup_instantid.sh"
echo ""
echo "This will:"
echo "  1. Install ComfyUI Manager"
echo "  2. Install InstantID nodes"
echo "  3. Download required models (~2-3 GB)"
echo "  4. Set up reference image directory"
echo ""
echo "Estimated time: 10-15 minutes"
echo "Internet connection required for downloads"
echo ""
read -p "Do you want to install now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./setup_instantid.sh
else
    echo "Installation cancelled. Run ./setup_instantid.sh when ready."
fi
