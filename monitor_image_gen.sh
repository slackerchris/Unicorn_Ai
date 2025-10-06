#!/bin/bash
# Monitor ComfyUI Image Generation Activity
# Shows real-time prompts being sent to ComfyUI

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   ComfyUI Image Generation Monitor                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Watching: outputs/logs/webui.log"
echo "Press Ctrl+C to stop"
echo ""

# Check if log file exists
if [ ! -f "outputs/logs/webui.log" ]; then
    echo "❌ Error: outputs/logs/webui.log not found"
    echo "Make sure the Web UI is running and you're in the correct directory"
    exit 1
fi

# Monitor the log file
tail -f outputs/logs/webui.log | grep --line-buffered -E "(ComfyUI Image Generation|Full Positive Prompt|Full Negative Prompt|Dimensions:|Injected|queued|retrieved)" | while read line; do
    # Add visual separator for new generation request
    if [[ "$line" == *"Generation Request"* ]]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🎨 NEW IMAGE GENERATION"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi
    
    # Color code different types of log lines
    if [[ "$line" == *"Full Positive Prompt"* ]]; then
        echo "✅ $line"
    elif [[ "$line" == *"Full Negative Prompt"* ]]; then
        echo "🚫 $line"
    elif [[ "$line" == *"Dimensions"* ]]; then
        echo "📏 $line"
    elif [[ "$line" == *"Injected"* ]]; then
        echo "   ↳ $line"
    elif [[ "$line" == *"queued"* ]]; then
        echo "⏳ $line"
    elif [[ "$line" == *"retrieved"* ]]; then
        echo "✨ $line"
        echo ""
    else
        echo "$line"
    fi
done
