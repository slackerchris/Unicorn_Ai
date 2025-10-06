# How to See What's Sent to ComfyUI - Quick Guide

## Simple Answer: Yes! Multiple Ways

### 1. Quick View - Watch Prompts Live (Easiest)
```bash
tail -f outputs/logs/webui.log | grep "Full.*Prompt"
```

**You'll see**:
```
Full Positive Prompt: Jessica, dominant, strict dommie Mommy, photorealistic, mature woman, 40s, selfie, smiling
Full Negative Prompt: ugly, deformed, blurry, low quality, text, watermark, distorted, bad anatomy, [...]
```

---

### 2. Nice Formatted Monitor (Recommended)
```bash
./monitor_image_gen.sh
```

**Shows**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 NEW IMAGE GENERATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Full Positive Prompt: [full text]
🚫 Full Negative Prompt: [full text]
📏 Dimensions: 1024x1024
   ↳ Injected BASE positive prompt (Node 6)
   ↳ Injected REFINER positive prompt (Node 15)
   ↳ Injected BASE negative prompt (Node 7)
   ↳ Injected REFINER negative prompt (Node 16)
⏳ ComfyUI prompt queued: abc123
✨ ComfyUI image retrieved: ComfyUI_00042_.png
```

---

### 3. Full Workflow JSON (Debug Mode)

**Enable it**:
```bash
export COMFYUI_DEBUG=true
```

**Restart Web UI**:
```bash
pkill -f "python main.py"
python main.py
```

**Every generation saves to**: `outputs/logs/comfyui_last_workflow.json`

**View it**:
```bash
cat outputs/logs/comfyui_last_workflow.json | python3 -m json.tool | less
```

**Extract just prompts**:
```bash
python3 << 'EOF'
import json
with open('outputs/logs/comfyui_last_workflow.json') as f:
    w = json.load(f)
    print("Positive:", w['6']['inputs']['text'])
    print("\nNegative:", w['7']['inputs']['text'])
EOF
```

---

### 4. Check Past Generations

**Last 5 image generations**:
```bash
grep -A10 "ComfyUI Image Generation" outputs/logs/webui.log | tail -50
```

**Search for specific persona**:
```bash
grep "Full Positive Prompt.*Jessica" outputs/logs/webui.log
```

---

## What's Logged (After Restart)

✅ **Full positive prompt** - Complete character description  
✅ **Full negative prompt** - All quality control terms  
✅ **Dimensions** - Width and height  
✅ **Node injection** - Which workflow nodes were updated  
✅ **Queue ID** - Tracking ID for ComfyUI  
✅ **Complete workflow JSON** - (if debug mode enabled)

---

## To Apply New Logging

**Restart the Web UI**:
```bash
pkill -f "python main.py"
cd /home/chris/Documents/Git/Unicorn_Ai
python main.py
```

Then use any of the commands above!

---

## Examples

### See just positive prompts:
```bash
tail -f outputs/logs/webui.log | grep "Full Positive Prompt"
```

### See both prompts side by side:
```bash
tail -f outputs/logs/webui.log | grep -E "Full (Positive|Negative) Prompt"
```

### Count today's generations:
```bash
grep "ComfyUI Image Generation" outputs/logs/webui.log | grep "$(date +%Y-%m-%d)" | wc -l
```

---

## Files Changed
- `providers/comfyui_provider.py` - Enhanced logging
- `monitor_image_gen.sh` - New monitoring script (created)

## Full Documentation
See `COMFYUI_PROMPT_VIEWING_GUIDE.md` for complete details and advanced options.

---

**TL;DR**: 
1. Restart Web UI
2. Run `./monitor_image_gen.sh`
3. Generate an image
4. Watch the prompts appear in real-time! 🎨
