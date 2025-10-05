# AMD GPU Fix for ComfyUI (RX 6700 XT)

## 🎯 Solution for "HIP error: invalid device function"

Since you mentioned the **standalone ComfyUI works** with your AMD GPU, the issue is with the Python venv environment configuration, not your drivers.

---

## ✅ Applied Fixes

The `start_all.sh` script now sets these AMD-specific environment variables:

```bash
export HSA_OVERRIDE_GFX_VERSION=10.3.0  # Navi 22 architecture
export GPU_MAX_HEAP_SIZE=100
export GPU_MAX_ALLOC_PERCENT=100
export GPU_SINGLE_ALLOC_PERCENT=100
export AMD_SERIALIZE_KERNEL=3
export TORCH_USE_HIP_DSA=1
export ROCM_PATH=/opt/rocm
export LD_LIBRARY_PATH=$ROCM_PATH/lib:$LD_LIBRARY_PATH
```

**Key Fix:** `HSA_OVERRIDE_GFX_VERSION=10.3.0` tells ROCm to treat your RX 6700 XT (Navi 22) as a supported architecture.

---

## 🧪 Test It

```bash
# Start everything with new settings
bash start_all.sh

# Wait 30 seconds for ComfyUI to load models

# Test image generation
bash test_image_generation.sh
```

---

## 🔍 If Still Not Working

### Option 1: Check ComfyUI Logs
```bash
tail -f outputs/logs/comfyui.log
# Look for "invalid device function" errors
```

### Option 2: Try Different GFX Version Override
Some RX 6700 XT variants work better with:
```bash
# Edit start_all.sh and try:
export HSA_OVERRIDE_GFX_VERSION=10.3.1
# Or
export HSA_OVERRIDE_GFX_VERSION=10.3.2
```

### Option 3: Match Standalone ComfyUI Settings
If you have standalone ComfyUI working, run this to see its environment:
```bash
# While standalone ComfyUI is running:
ps aux | grep comfyui
cat /proc/$(pgrep -f comfyui)/environ | tr '\0' '\n' | grep -E "HSA|ROC|AMD|GPU"
```

This shows exactly what environment variables the working version uses!

### Option 4: Reinstall PyTorch with Latest ROCm
```bash
cd comfyui
source venv/bin/activate

# Uninstall current PyTorch
pip uninstall -y torch torchvision

# Reinstall with ROCm 6.0 (matches your current version)
pip install torch torchvision --index-url https://download.pytorch.org/whl/rocm6.0

# Restart
cd ..
bash stop_all.sh
bash start_all.sh
```

---

## 💡 Understanding the Issue

Your RX 6700 XT (Navi 22, gfx1031) isn't officially supported by all ROCm kernels. The `HSA_OVERRIDE_GFX_VERSION` tells PyTorch to use compatible kernels from a similar architecture.

The standalone ComfyUI likely has this configured already or uses a different PyTorch build.

---

## 🎯 Quick Win: Copy Standalone Config

If you can find where standalone ComfyUI is installed:
```bash
# Find it
locate comfyui | grep -i portable
# Or
find ~ -name "ComfyUI" -type d 2>/dev/null

# Once found, check its Python config:
cd /path/to/standalone/ComfyUI
./python/bin/python -c "import torch; print(torch.__version__)"

# Compare to our venv:
cd ~/Documents/Git/Projects/Unicorn_Ai/comfyui
source venv/bin/activate
python -c "import torch; print(torch.__version__)"
```

If versions differ, we can match them!

---

## 📞 Next Steps

Try the updated `start_all.sh` first. If it still fails, share:
1. Output of `bash test_image_generation.sh`
2. Last 50 lines of `outputs/logs/comfyui.log`

We'll match your working standalone setup exactly!
