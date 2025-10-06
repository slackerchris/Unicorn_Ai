# Viewing ComfyUI Prompts and Workflow - Guide

## Date: October 6, 2025

## Overview
Multiple ways to see exactly what's being sent to ComfyUI for image generation, including full prompts, negative prompts, and the complete workflow JSON.

## Methods to View ComfyUI Requests

### Method 1: Web UI Logs (Easiest)
**Real-time viewing of all prompts**

**Command**:
```bash
tail -f outputs/logs/webui.log | grep -A5 "ComfyUI"
```

**What You'll See**:
```
INFO | === ComfyUI Image Generation Request ===
INFO | Full Positive Prompt: Luna, A creative and dreamy assistant, photorealistic, young woman, casual style, friendly expression, selfie, smiling, casual outfit
INFO | Full Negative Prompt: ugly, deformed, blurry, low quality, text, watermark, distorted, malformed, disfigured, bad anatomy, wrong anatomy, extra limbs, missing limbs, [...]
INFO | Dimensions: 1024x1024
DEBUG | ✓ Injected BASE positive prompt (Node 6)
DEBUG | ✓ Injected REFINER positive prompt (Node 15)
DEBUG | ✓ Injected BASE negative prompt (Node 7)
DEBUG | ✓ Injected REFINER negative prompt (Node 16)
INFO | ComfyUI prompt queued: abc123def456
```

**Filter for just prompts**:
```bash
tail -f outputs/logs/webui.log | grep "Full.*Prompt"
```

### Method 2: Complete Workflow JSON (Debug Mode)
**Save the entire workflow sent to ComfyUI**

**Enable Debug Mode**:
```bash
export COMFYUI_DEBUG=true
```

**Or add to `.env` file**:
```bash
echo "COMFYUI_DEBUG=true" >> .env
```

**Then restart Web UI**:
```bash
pkill -f "python main.py"
python main.py
```

**Result**: Every image generation saves the complete workflow to:
```
outputs/logs/comfyui_last_workflow.json
```

**View the workflow**:
```bash
cat outputs/logs/comfyui_last_workflow.json | python3 -m json.tool | less
```

**Check specific prompts in workflow**:
```bash
# BASE positive prompt (Node 6)
cat outputs/logs/comfyui_last_workflow.json | python3 -c "import json,sys; w=json.load(sys.stdin); print('BASE Positive:', w['6']['inputs']['text'])"

# BASE negative prompt (Node 7)
cat outputs/logs/comfyui_last_workflow.json | python3 -c "import json,sys; w=json.load(sys.stdin); print('BASE Negative:', w['7']['inputs']['text'])"

# REFINER positive prompt (Node 15)
cat outputs/logs/comfyui_last_workflow.json | python3 -c "import json,sys; w=json.load(sys.stdin); print('REFINER Positive:', w['15']['inputs']['text'])"

# REFINER negative prompt (Node 16)
cat outputs/logs/comfyui_last_workflow.json | python3 -c "import json,sys; w=json.load(sys.stdin); print('REFINER Negative:', w['16']['inputs']['text'])"
```

### Method 3: ComfyUI Logs
**See what ComfyUI receives**

**Command**:
```bash
tail -f outputs/logs/comfyui.log
```

**What You'll See**:
- Prompt queue events
- Node execution
- Model loading
- Image generation progress

### Method 4: Real-Time Monitoring Script
**Watch all image generation activity**

**Create monitoring script**:
```bash
cat > monitor_image_gen.sh << 'EOF'
#!/bin/bash
echo "=== Monitoring ComfyUI Image Generation ==="
echo "Press Ctrl+C to stop"
echo ""

tail -f outputs/logs/webui.log | grep --line-buffered -E "(ComfyUI Image Generation|Full.*Prompt|Dimensions:|queued)" | while read line; do
    if [[ "$line" == *"Generation Request"* ]]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    fi
    echo "$line"
done
EOF

chmod +x monitor_image_gen.sh
```

**Run it**:
```bash
./monitor_image_gen.sh
```

### Method 5: Check Specific Log Entries
**Search for specific image generation**

**Find recent image generations**:
```bash
grep "ComfyUI Image Generation" outputs/logs/webui.log | tail -5
```

**Get full details of last generation**:
```bash
grep -A10 "ComfyUI Image Generation" outputs/logs/webui.log | tail -15
```

**Search by persona name**:
```bash
grep "Full Positive Prompt.*Luna" outputs/logs/webui.log
```

## Enhanced Logging Features

### What's Logged:

1. **Full Positive Prompt**
   - Complete character description
   - Includes: persona name, description, image_style, user request
   - Not truncated (full text)

2. **Full Negative Prompt**
   - All quality control terms
   - Complete list of things to avoid
   - Both chat and generate-image versions

3. **Dimensions**
   - Width and height sent to workflow

4. **Node Injection Confirmation**
   - Which workflow nodes were updated
   - Confirms BASE and REFINER prompts set

5. **Prompt Queue ID**
   - Unique ID for tracking in ComfyUI

6. **Debug Workflow JSON** (if enabled)
   - Complete workflow with all settings
   - Exact JSON sent to ComfyUI API

## Log Levels

### INFO Level (Default)
Shows:
- Image generation requests
- Full prompts
- Dimensions
- Queue IDs
- Image retrieval

### DEBUG Level
Shows everything from INFO plus:
- Node injection details
- Workflow format conversions
- Individual node updates

**Enable DEBUG logging**:
Edit `main.py` to change logger level:
```python
# At the top of main.py
logger.remove()
logger.add(sys.stderr, level="DEBUG")
```

## Example Output

### Standard Generation:
```
2025-10-06 12:34:56.789 | INFO | === ComfyUI Image Generation Request ===
2025-10-06 12:34:56.790 | INFO | Full Positive Prompt: Jessica, dominant, strict dommie Mommy, photorealistic, mature woman, 40s, elegant appearance, long blonde hair, sophisticated style, warm maternal expression, selfie, smiling, casual outfit
2025-10-06 12:34:56.791 | INFO | Full Negative Prompt: ugly, deformed, blurry, low quality, text, watermark, distorted, malformed, disfigured, bad anatomy, wrong anatomy, extra limbs, missing limbs, floating limbs, disconnected limbs, mutation, mutated, gross proportions, bad proportions, poorly drawn, cartoon, anime, sketches, worst quality, low resolution, noise, grainy, signature, username, artist name
2025-10-06 12:34:56.792 | INFO | Dimensions: 1024x1024
2025-10-06 12:34:56.850 | INFO | Unloading Ollama models to free VRAM...
2025-10-06 12:34:56.875 | INFO | Ollama models unloaded
2025-10-06 12:34:56.876 | DEBUG | ✓ Injected BASE positive prompt (Node 6)
2025-10-06 12:34:56.877 | DEBUG | ✓ Injected REFINER positive prompt (Node 15)
2025-10-06 12:34:56.878 | DEBUG | ✓ Injected BASE negative prompt (Node 7)
2025-10-06 12:34:56.879 | DEBUG | ✓ Injected REFINER negative prompt (Node 16)
2025-10-06 12:34:56.880 | DEBUG | Set dimensions: 1024x1024
2025-10-06 12:34:56.921 | INFO | ComfyUI prompt queued: 3fa85f64-5717-4562-b3fc-2c963f66afa6
2025-10-06 12:35:23.456 | INFO | ComfyUI image retrieved: ComfyUI_00042_.png
```

### With Debug Mode Enabled:
```
2025-10-06 12:34:56.881 | INFO | Debug: Saved complete workflow to outputs/logs/comfyui_last_workflow.json
```

## Workflow JSON Structure

When debug mode is enabled, the saved workflow shows:

```json
{
  "6": {
    "inputs": {
      "text": "Full positive prompt here...",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "7": {
    "inputs": {
      "text": "Full negative prompt here...",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "15": {
    "inputs": {
      "text": "Same positive prompt for refiner...",
      "clip": ["12", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "16": {
    "inputs": {
      "text": "Same negative prompt for refiner...",
      "clip": ["12", 1]
    },
    "class_type": "CLIPTextEncode"
  }
  // ... other nodes ...
}
```

## Useful Commands

### Monitor Just Prompts (Live):
```bash
tail -f outputs/logs/webui.log | grep --line-buffered "Full.*Prompt"
```

### See Last 5 Image Generations:
```bash
grep -B2 "Full Positive Prompt" outputs/logs/webui.log | tail -15
```

### Count Image Generations Today:
```bash
grep "ComfyUI Image Generation" outputs/logs/webui.log | grep "$(date +%Y-%m-%d)" | wc -l
```

### Find Longest Prompt:
```bash
grep "Full Positive Prompt:" outputs/logs/webui.log | awk -F': ' '{print length($2), $2}' | sort -rn | head -1
```

### Check for Specific Terms in Prompts:
```bash
grep "Full Positive Prompt:.*casual" outputs/logs/webui.log
```

### View Debug Workflow Prettified:
```bash
cat outputs/logs/comfyui_last_workflow.json | python3 -m json.tool | less
```

### Extract All Prompts from Workflow:
```bash
python3 << 'EOF'
import json
with open('outputs/logs/comfyui_last_workflow.json') as f:
    w = json.load(f)
    print("=== BASE Positive (Node 6) ===")
    print(w.get('6', {}).get('inputs', {}).get('text', 'Not found'))
    print("\n=== BASE Negative (Node 7) ===")
    print(w.get('7', {}).get('inputs', {}).get('text', 'Not found'))
    print("\n=== REFINER Positive (Node 15) ===")
    print(w.get('15', {}).get('inputs', {}).get('text', 'Not found'))
    print("\n=== REFINER Negative (Node 16) ===")
    print(w.get('16', {}).get('inputs', {}).get('text', 'Not found'))
EOF
```

## Troubleshooting

### Not Seeing Full Prompts?
**Solution**: Restart Web UI to apply new logging:
```bash
pkill -f "python main.py"
python main.py
```

### Want More Details?
**Solution**: Enable DEBUG logging in main.py

### Debug File Not Created?
**Solution**: Make sure `COMFYUI_DEBUG=true` is set and restart

### Logs Too Verbose?
**Solution**: Filter what you need:
```bash
tail -f outputs/logs/webui.log | grep "Full Positive Prompt"
```

## Configuration

### Environment Variables:

**COMFYUI_DEBUG**
- Default: `false`
- Enable: `export COMFYUI_DEBUG=true`
- Effect: Saves complete workflow JSON for every generation

**COMFYUI_URL**
- Default: `http://localhost:8188`
- Override: `export COMFYUI_URL=http://custom:8188`

**COMFYUI_WORKFLOW**
- Default: `workflows/sdxl_Character_profile_api.json`
- Override: `export COMFYUI_WORKFLOW=workflows/custom.json`

### .env File Example:
```bash
# Enable debug mode to save workflow JSON
COMFYUI_DEBUG=true

# ComfyUI connection
COMFYUI_URL=http://localhost:8188

# Workflow file
COMFYUI_WORKFLOW=workflows/sdxl_Character_profile_api.json
```

## Log Rotation

**Prevent logs from growing too large**:

Create a logrotate config:
```bash
sudo tee /etc/logrotate.d/unicorn_ai << EOF
/home/chris/Documents/Git/Unicorn_Ai/outputs/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 644 chris chris
}
EOF
```

**Or manually rotate logs**:
```bash
cd outputs/logs
mv webui.log webui.log.$(date +%Y%m%d)
mv comfyui.log comfyui.log.$(date +%Y%m%d)
# Logs will be recreated on next write
```

## Summary

### Quick Reference:

| What You Want | Command |
|---------------|---------|
| **View prompts live** | `tail -f outputs/logs/webui.log \| grep "Full.*Prompt"` |
| **Last generation** | `grep -A10 "ComfyUI Image Generation" outputs/logs/webui.log \| tail -15` |
| **Enable debug** | `export COMFYUI_DEBUG=true` then restart |
| **View workflow** | `cat outputs/logs/comfyui_last_workflow.json \| python3 -m json.tool` |
| **Monitor live** | `./monitor_image_gen.sh` |

### Files Modified:
- `providers/comfyui_provider.py` - Enhanced logging

### New Features:
- ✅ Full prompt logging (not truncated)
- ✅ Clear generation request markers
- ✅ Node injection confirmation
- ✅ Optional debug workflow JSON export
- ✅ Organized log structure

**Status**: ✅ Active immediately (restart to apply)
**Impact**: Better visibility into image generation
**Performance**: Negligible (only logging)
