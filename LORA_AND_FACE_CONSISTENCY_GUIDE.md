# LoRA and Face Consistency Guide

## 🎯 Goal
Generate images of Luna that consistently match your reference image (blonde hair, blue eyes, specific face).

## 📊 Options Ranked by Difficulty

### ⭐ Option 1: InstantID (RECOMMENDED - No Training!)
**Best for:** Immediate results without training

**Pros:**
- ✅ No training needed
- ✅ Use reference image directly
- ✅ Fast setup (~10 minutes)
- ✅ Very consistent faces

**Setup:**
```bash
cd ~/Documents/Git/Unicorn_Ai/comfyui/custom_nodes

# Install InstantID
git clone https://github.com/cubiq/ComfyUI_InstantID.git
cd ComfyUI_InstantID
pip install -r requirements.txt

# Download models (in comfyui folder):
# - instantid model
# - face analysis model
# See: https://github.com/cubiq/ComfyUI_InstantID
```

**Usage:**
1. Load your Luna reference image
2. Use InstantID node in workflow
3. Generate with any prompt
4. Face stays consistent!

---

### ⭐ Option 2: IPAdapter Face (Fast Setup)
**Best for:** Quick face consistency

**Pros:**
- ✅ Easy to use
- ✅ Works with existing SDXL
- ✅ Reference image based

**Setup:**
```bash
cd ~/Documents/Git/Unicorn_Ai/comfyui/custom_nodes

# Install IPAdapter
git clone https://github.com/cubiq/ComfyUI_IPAdapter_plus.git
cd ComfyUI_IPAdapter_plus
pip install -r requirements.txt
```

**Models needed:**
```bash
# Download to comfyui/models/ipadapter/
# - ip-adapter-faceid-plusv2_sdxl.bin
# From: https://huggingface.co/h94/IP-Adapter-FaceID
```

---

### ⭐ Option 3: Download Pre-Made LoRA (Easy)
**Best for:** If someone already trained Luna's look

**Steps:**
1. Go to https://civitai.com
2. Search for blonde woman, specific style
3. Download `.safetensors` file
4. Place in `comfyui/models/loras/`
5. Add LoRA loader node to workflow

**Workflow Update:**
```
Load Checkpoint
    ↓
Load LoRA (your downloaded LoRA)
    ↓
    weight: 0.7-1.0
    ↓
CLIP Text Encode (your prompt)
```

---

### ⭐ Option 4: Train Your Own LoRA (Best Quality, Most Work)
**Best for:** Perfect match to your reference

**Requirements:**
- 15-30 images of Luna's face
- ~30-60 minutes training time
- 12GB VRAM ✅ (you have this!)

#### Method A: Kohya_ss GUI (Recommended)

**Installation:**
```bash
cd ~
git clone https://github.com/bmaltais/kohya_ss.git
cd kohya_ss
./setup.sh
```

**Training Steps:**
1. Collect 15-30 reference images
2. Organize in folder: `training/luna/`
3. Open Kohya GUI: `./gui.sh`
4. Configure:
   - Base model: Your SDXL model
   - Training images: luna folder
   - Steps: 1500-3000
   - Learning rate: 0.0001
5. Start training (30-60 min)
6. Output: `luna_lora.safetensors`

**Dataset Prep:**
```
training/
└── luna/
    ├── 1_luna woman.jpg  (trigger word: luna)
    ├── 2_luna woman.jpg
    ├── 3_luna woman.jpg
    └── ... (15-30 images total)
```

#### Method B: Auto1111 Dreambooth

**If you prefer Automatic1111:**
```bash
# Install Auto1111 extension
# Extensions → Install from URL
# https://github.com/d8ahazard/sd_dreambooth_extension
```

---

## 🔧 Quick Start: InstantID Setup (DETAILED)

### Step 1: Install ComfyUI Manager (if not installed)
```bash
cd ~/Documents/Git/Unicorn_Ai/comfyui/custom_nodes
git clone https://github.com/ltdrdata/ComfyUI-Manager.git
# Restart ComfyUI
```

### Step 2: Install InstantID via Manager
1. Open ComfyUI in browser: http://localhost:8188
2. Click "Manager" button
3. Search "InstantID"
4. Click Install
5. Restart ComfyUI

### Step 3: Download Required Models
```bash
cd ~/Documents/Git/Unicorn_Ai/comfyui

# InstantID model
wget -P models/instantid/ https://huggingface.co/InstantX/InstantID/resolve/main/ip-adapter.bin

# Face analysis model  
wget -P models/insightface/ https://huggingface.co/MonsterMMORPG/tools/resolve/main/antelopev2.zip
cd models/insightface && unzip antelopev2.zip && cd ../..
```

### Step 4: Save Reference Image
```bash
# Save your Luna reference image to:
mkdir -p reference_images/
# Put luna.jpg there (the image you showed me)
```

### Step 5: Update Workflow
Use InstantID workflow example from ComfyUI Manager.

---

## 🎨 Workflow Integration

### Current Workflow (without face consistency):
```
Checkpoint → CLIP Encode → KSampler → VAE Decode → Save
```

### With InstantID:
```
Checkpoint → CLIP Encode ↘
                          KSampler → VAE Decode → Save
Reference Image → InstantID ↗
```

### With LoRA:
```
Checkpoint → Load LoRA → CLIP Encode → KSampler → VAE Decode → Save
              ↓
         (trigger: "luna woman")
```

---

## 📝 Which Should You Choose?

### Choose InstantID if:
- ✅ Want results NOW
- ✅ Don't want to train
- ✅ Have 1 good reference image
- ✅ Want easy setup

### Choose IPAdapter if:
- ✅ Want simple solution
- ✅ Reference image based
- ✅ Quick setup

### Download LoRA if:
- ✅ Can find existing one
- ✅ Want plug-and-play
- ✅ No training time

### Train LoRA if:
- ✅ Have many reference images
- ✅ Want PERFECT match
- ✅ Have 1 hour to train
- ✅ Want complete control

---

## 🚀 My Recommendation for You

**Start with InstantID:**
1. Install ComfyUI Manager
2. Install InstantID through manager
3. Download required models
4. Load your Luna reference image
5. Generate with InstantID enabled

**If that doesn't work perfectly, then:**
- Train a LoRA with Kohya_ss (you have the VRAM for it)
- 20-30 images of similar blonde women
- 30-60 minute training
- Perfect consistency afterward

---

## 📚 Resources

### InstantID:
- GitHub: https://github.com/cubiq/ComfyUI_InstantID
- Models: https://huggingface.co/InstantX/InstantID

### Kohya_ss (LoRA Training):
- GitHub: https://github.com/bmaltais/kohya_ss
- Guide: https://github.com/bmaltais/kohya_ss/wiki

### Pre-made LoRAs:
- CivitAI: https://civitai.com
- Hugging Face: https://huggingface.co/models?pipeline_tag=text-to-image

### IPAdapter:
- GitHub: https://github.com/cubiq/ComfyUI_IPAdapter_plus
- Models: https://huggingface.co/h94/IP-Adapter-FaceID

---

## 🎯 Next Steps

1. **Try InstantID first** (30 min setup, instant results)
2. **If not satisfied, train LoRA** (1 hour training, perfect results)
3. **Update your workflow JSON** to include the chosen method
4. **Save reference image** to `reference_images/luna.jpg`

Let me know which approach you want to try and I can help set it up!
