# 🎉 Unicorn AI - NVIDIA Migration Review

**Date:** October 5, 2025  
**Migration:** AMD RX 6700 XT → NVIDIA RTX A2000 12GB

---

## 🎯 Key Changes Required

### ✅ **GOOD NEWS: Your NVIDIA GPU is Detected!**
```
GPU: NVIDIA RTX A2000 12GB
Driver: 570.172.08
CUDA: 12.8
Memory: 12GB VRAM (perfect for AI work!)
```

---

## 📋 Action Items for NVIDIA Setup

### 🚨 **STEP 0: Install pip First!** 🚨

**Current Status:** `pip` is NOT installed on this system!

**Run this first:**
```bash
sudo apt update
sudo apt install python3-pip python3-venv
```

---

### 1. **Install Python Dependencies** 🔥 **CRITICAL**

**Current Status:** Core dependencies (FastAPI, etc.) are NOT installed

**Run this command:**
```bash
cd /home/chris/Documents/Git/Unicorn_Ai
pip3 install -r requirements.txt
```

---

### 2. **Install PyTorch with CUDA Support** 🔥 **CRITICAL**

**Current Status:** PyTorch is NOT installed (required for ComfyUI)

**Run this command:**
```bash
# Option 1: Install PyTorch with CUDA 12.x (recommended)
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Option 2: Or if you prefer CUDA 11.8
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**Verify installation:**
```bash
python3 -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA Available: {torch.cuda.is_available()}')"
# Should show: CUDA Available: True
```

---

### 3. **Update start_all.sh for NVIDIA** 🔧

**Current Issue:** The script has AMD-specific environment variables:
```bash
export HSA_OVERRIDE_GFX_VERSION=10.3.0  # AMD only
export MIOPEN_DISABLE_CACHE=1           # AMD only
export PYTORCH_HIP_ALLOC_CONF=...       # AMD only
export ROCM_PATH=/opt/rocm              # AMD only
```

**What to do:** These won't hurt NVIDIA, but they're unnecessary. You have two options:

**Option A: Leave it as-is** (simpler, won't cause problems)
- The AMD variables will be ignored by NVIDIA
- Keep the script compatible with both GPU types

**Option B: Clean it up** (more professional)
- Add GPU detection to set appropriate variables
- Remove AMD-specific settings when NVIDIA detected

---

### 4. **ComfyUI Status** 🎨

**Current Status:** ComfyUI is NOT installed yet (no comfyui/ directory found)

---

### 5. **Create .env Configuration File** 📝

**Current Status:** `config/.env` doesn't exist (only .env.example)

**Action:**
```bash
cd /home/chris/Documents/Git/Unicorn_Ai
cp config/.env.example config/.env
nano config/.env
```

**Key settings to configure:**
```bash
# Ollama Model (you have these installed)
OLLAMA_MODEL=dolphin-mistral:latest
# OR try: wizard-vicuna-uncensored:latest

# Ollama URL (default is fine)
OLLAMA_URL=http://localhost:11434

# Image Generation
IMAGE_PROVIDER=comfyui
COMFYUI_URL=http://localhost:8188

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your_token_here  # If you want Telegram bot

# Replicate (optional, costs money)
# REPLICATE_API_TOKEN=your_token_here
```

---

### 6. **Install ComfyUI with CUDA** 🎨

**Why:** ComfyUI needs to be installed (fresh install on this machine)

**Steps:**
```bash
# First, install PyTorch (see step 2)
pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# Then install/reinstall ComfyUI
bash install_comfyui.sh
```

The script will detect your NVIDIA GPU and install the correct version!

---

### 7. **Update Documentation** 📚

**Files to update:**
- `README.md` - Change GPU specs
- `PRODUCTION_STATUS.md` - Remove AMD warnings
- `docs/AMD_GPU_WORKING_FIX.md` - Mark as obsolete or archive

---

## 🚀 Quick Start on NVIDIA

Once you complete the above steps:

```bash
# 1. Create .env file
cp config/.env.example config/.env

# 2. Install PyTorch with CUDA
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# 3. Install ComfyUI (will auto-detect NVIDIA)
bash install_comfyui.sh

# 4. Start all services
bash start_all.sh

# 5. Test!
# Web UI: http://localhost:8000
# API Docs: http://localhost:8000/docs
# ComfyUI: http://localhost:8188
```

---

## 📊 Your Ollama Models Status

You have these models installed:
- ✅ `deepseek-coder-v2:latest` (8.9 GB) - Great for coding
- ✅ `mistral-small:latest` (14 GB) - Good general model
- ✅ `wizard-vicuna-uncensored:latest` (3.8 GB) - **Perfect for uncensored chat!**
- ✅ `CodeGemma:latest` (5.0 GB)
- ✅ `DeepSeek-R1:latest` (5.2 GB)
- ✅ `gemma3:latest` (3.3 GB)
- ✅ `llama3.2:latest` (2.0 GB)
- ✅ `Qwen3:latest` (5.2 GB)

**Note:** I don't see `dolphin-mistral` which the project uses by default.

**Recommendation:**
```bash
# Option 1: Install dolphin-mistral (recommended by project)
ollama pull dolphin-mistral

# Option 2: OR update .env to use wizard-vicuna-uncensored instead
OLLAMA_MODEL=wizard-vicuna-uncensored:latest
```

---

## ⚡ Expected Performance Improvements

### NVIDIA RTX A2000 12GB vs AMD RX 6700 XT:
- ✅ **Better AI/ML support** (CUDA is industry standard)
- ✅ **More stable ComfyUI** (no ROCm compatibility issues!)
- ✅ **Faster image generation** (CUDA optimizations)
- ✅ **Better PyTorch support** (native CUDA)
- ✅ **No more HIP errors!** 🎉

---

## 🎯 What Will Work Immediately

1. ✅ **Ollama** - Already working (runs on CPU by default)
2. ✅ **Web UI** - Will work once you install dependencies
3. ✅ **Text Chat** - Will work immediately
4. ✅ **Voice TTS** - Will work (uses Edge TTS, no GPU needed)
5. ✅ **Persona System** - Will work immediately

---

## ⚠️ What Needs Setup First

1. ❌ **Image Generation** - Needs PyTorch + ComfyUI reinstall
2. ⚠️ **Config File** - Need to create .env from .env.example
3. ⚠️ **Telegram Bot** - Optional, needs token in .env

---

## 🛠️ Cleanup Recommendations

### Files to Archive/Remove (AMD-specific):
- `docs/AMD_GPU_WORKING_FIX.md` → Archive this
- `docs/IMAGE_GEN_AMD_FIX.md` → No longer needed

### Files to Update:
- `README.md` → Update hardware specs
- `PRODUCTION_STATUS.md` → Remove AMD warnings
- `start_all.sh` → (Optional) Clean up AMD variables

---

## 🎬 Next Steps (Recommended Order)

```bash
# Step 0: Install pip (REQUIRED FIRST!)
sudo apt update
sudo apt install python3-pip python3-venv

# Step 1: Install core dependencies
cd /home/chris/Documents/Git/Unicorn_Ai
pip3 install -r requirements.txt

# Step 2: Install PyTorch with CUDA
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Step 3: Verify CUDA is working
python3 -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA Available: {torch.cuda.is_available()}')"
# Should show: CUDA Available: True

# Step 4: Create config file
cp config/.env.example config/.env
nano config/.env  # Edit as needed

# Step 5: Install ComfyUI
bash install_comfyui.sh

# Step 6: Download Ollama model if needed
ollama pull dolphin-mistral

# Step 7: Start everything!
bash start_all.sh

# Step 8: Test in browser
# Web UI: http://localhost:8000
# API Docs: http://localhost:8000/docs
# ComfyUI: http://localhost:8188
```

---

## 💡 Tips for NVIDIA

1. **Monitor GPU usage:**
   ```bash
   watch -n 1 nvidia-smi
   ```

2. **Check CUDA is working in PyTorch:**
   ```bash
   python3 -c "import torch; print(torch.cuda.get_device_name(0))"
   # Should output: NVIDIA RTX A2000 12GB
   ```

3. **ComfyUI will be MUCH faster** on NVIDIA than AMD was

4. **No more ROCm headaches!** 🎉

---

## 📞 If You Need Help

Check these logs:
- Web UI: `outputs/logs/webui.log`
- ComfyUI: `outputs/logs/comfyui.log`
- Telegram: `outputs/logs/telegram.log`

Or look at:
- `docs/SETUP_GUIDE.md`
- `QUICKSTART.md`

---

## Summary Checklist

- [ ] **Install pip** (`sudo apt install python3-pip python3-venv`)
- [ ] **Install core dependencies** (`pip3 install -r requirements.txt`)
- [ ] **Install PyTorch with CUDA** support
- [ ] **Verify CUDA works** in PyTorch
- [ ] **Create `config/.env`** from example
- [ ] **Install ComfyUI** (`bash install_comfyui.sh`)
- [ ] **Download dolphin-mistral** model (or configure alternate)
- [ ] **Test startup** with `bash start_all.sh`
- [ ] **Test image generation**
- [ ] **Update README.md** with new GPU specs
- [ ] **Archive AMD-specific docs**

**Status:** Fresh setup needed on this NVIDIA machine. This is essentially a new installation! 🚀
