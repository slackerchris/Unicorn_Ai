# AMD GPU / ROCm Image Generation Fix

## 🔧 Problem
Your AMD GPU (RX 6700 XT) is having HIP/ROCm kernel errors when generating images with ComfyUI:
```
RuntimeError: HIP error: invalid device function
```

## ✅ Solutions (Pick One)

---

### **Option 1: Use CPU Mode** (Recommended - Easy)

**Pros:** Works immediately, stable, free  
**Cons:** Slower (30-60 seconds per image vs 5-10 seconds on GPU)

**Setup:**
```bash
# Edit config file
nano config/.env

# Add this line at the bottom:
COMFYUI_USE_CPU=1

# Save (Ctrl+X, Y, Enter)

# Restart ComfyUI
bash stop_all.sh
bash start_all.sh
```

Now image generation will work! It's slower but stable.

---

### **Option 2: Fix AMD GPU Environment** (Medium Difficulty)

The startup script now sets these automatically:
- `AMD_SERIALIZE_KERNEL=3` - Better error reporting
- `TORCH_USE_HIP_DSA=1` - Device-side assertions

**Try restarting to see if it helps:**
```bash
bash stop_all.sh
bash start_all.sh
```

**If still not working, try:**
```bash
# Check ROCm version
rocm-smi

# Update PyTorch with correct ROCm version
cd comfyui
source venv/bin/activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/rocm5.7

# Restart
bash stop_all.sh
bash start_all.sh
```

---

### **Option 3: Use Replicate API** (Cloud - Costs Money)

**Pros:** Fast, high quality, no local GPU issues  
**Cons:** Costs ~$0.005 per image (~$0.20 for 40 images)

**Setup:**
```bash
# 1. Get API token
# Go to: https://replicate.com/account/api-tokens
# Sign up (free tier available)
# Copy your token

# 2. Edit config
nano config/.env

# 3. Add these lines:
IMAGE_PROVIDER=replicate
REPLICATE_API_TOKEN=r8_your_token_here

# 4. Restart
bash stop_all.sh
bash start_all.sh
```

ComfyUI won't be used, images generated in cloud instead.

---

### **Option 4: Disable Image Generation**

Just use Unicorn AI for chat & voice, skip images:

```bash
# Stop ComfyUI
pkill -f "comfyui/main.py"

# It will still work for chat & voice
# Just won't generate images
```

---

## 🧪 Test After Fixing

Once you pick an option and restart, test with:

```bash
# Test via API
curl -X POST "http://localhost:8000/generate-image?prompt=beautiful+sunset&width=512&height=512" -o test.png
file test.png  # Should say "PNG image data" not "JSON"
```

Or in the Web UI chat:
- "Send me a selfie!"
- "Draw me a picture of a sunset"

---

## 📊 Performance Comparison

| Method | Speed | Quality | Cost | Stability |
|--------|-------|---------|------|-----------|
| **AMD GPU** | ⚡ Fast (5-10s) | ⭐⭐⭐⭐⭐ | Free | ⚠️ Issues |
| **CPU Mode** | 🐌 Slow (30-60s) | ⭐⭐⭐⭐⭐ | Free | ✅ Stable |
| **Replicate** | ⚡ Fast (8-15s) | ⭐⭐⭐⭐⭐ | $0.005/img | ✅ Stable |

---

## 💡 Recommendation

**Start with Option 1 (CPU mode)** to see if you like image generation:
- Free
- Works immediately
- You can fix GPU later if you want speed

**Then consider Replicate** if CPU is too slow and you don't mind small cost.

**Fix GPU** as a fun project later when you have time.

---

## 📝 Current Startup Script Changes

The `start_all.sh` script now:
- ✅ Checks for `COMFYUI_USE_CPU=1` in config/.env
- ✅ Sets AMD environment variables automatically
- ✅ Falls back gracefully on errors

Just add `COMFYUI_USE_CPU=1` to your config and restart!
