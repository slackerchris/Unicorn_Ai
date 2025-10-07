# InstantID Integration for Unicorn AI

## 📁 Files Created

### 1. Setup Scripts
- **setup_instantid.sh** - Full installation script
- **quickstart_instantid.sh** - Interactive quick start

### 2. Workflow
- **workflows/instantid_luna.json** - InstantID workflow for Luna

### 3. Documentation
- **LORA_AND_FACE_CONSISTENCY_GUIDE.md** - Complete guide

## 🚀 Quick Start

### Step 1: Install InstantID
```bash
cd ~/Documents/Git/Unicorn_Ai
./setup_instantid.sh
```

**What it does:**
- Installs ComfyUI Manager
- Installs InstantID custom nodes
- Downloads required models (~2-3 GB)
- Creates reference_images/ directory

**Time:** ~10-15 minutes

### Step 2: Add Reference Image
```bash
# Save your Luna reference image as:
cp /path/to/your/luna/image.jpg reference_images/luna.jpg
```

**The image you showed me should go here!**

### Step 3: Test the Workflow

#### Option A: Manual Test in ComfyUI
1. Open ComfyUI: http://localhost:8188
2. Click "Load" button
3. Select `workflows/instantid_luna.json`
4. Click "Queue Prompt"
5. See Luna's face consistently!

#### Option B: Use from Python/API
The workflow will automatically use InstantID when available.

## 🎨 How It Works

### Traditional Workflow (Current):
```
Prompt → Checkpoint → CLIP → KSampler → Image
```
**Problem:** Face changes every time

### InstantID Workflow (New):
```
Reference Image (luna.jpg)
    ↓
Face Analysis
    ↓
Prompt → Checkpoint → CLIP → InstantID → KSampler → Image
                                  ↑
                          (face guidance)
```
**Result:** Luna's face stays consistent!

## 📊 Workflow Nodes Explained

### Node 1: Load Reference Image
- Loads `luna.jpg` from reference_images/
- This is your source face

### Node 5: Face Analysis
- Extracts facial features from reference
- Creates face embedding

### Node 6: InstantID Model
- Loads the InstantID adapter
- Applies face consistency

### Node 8: Apply InstantID
- **weight: 0.8** (face influence strength)
  - 0.0 = no face consistency
  - 1.0 = maximum face consistency
  - 0.8 = recommended balance

### Node 10: KSampler
- Same as before
- Now guided by face features

## 🔧 Integration with Your App

### Automatic Integration
Once InstantID is installed, you can:

#### Option 1: Use InstantID Workflow
```python
# In main.py, update image_manager to use:
workflow_path = "workflows/instantid_luna.json"
```

#### Option 2: Switch Based on Persona
```python
if persona.name == "Luna" and os.path.exists("reference_images/luna.jpg"):
    workflow_path = "workflows/instantid_luna.json"
else:
    workflow_path = "workflows/character_generation.json"
```

### Manual Control
Add a persona field:
```json
{
  "id": "luna",
  "name": "Luna",
  "use_instantid": true,
  "reference_image": "reference_images/luna.jpg"
}
```

## ⚙️ Configuration

### Adjust Face Strength
In `workflows/instantid_luna.json`, node 8:
```json
"weight": 0.8  // Change this value
```

**Values:**
- **0.5-0.6**: Subtle face influence
- **0.7-0.8**: Balanced (recommended)
- **0.9-1.0**: Strong face match

### Adjust Image Quality
Node 10 (KSampler):
```json
"steps": 30,     // More steps = better quality
"cfg": 7.5,      // Prompt adherence
"sampler_name": "euler"
```

## 📝 Testing

### Test 1: Basic Generation
```bash
# Generate with simple prompt
Prompt: "portrait photo"
Expected: Luna's face, blonde hair, blue eyes
```

### Test 2: Different Outfits
```bash
Prompt: "wearing red dress"
Prompt: "in casual sweater"
Prompt: "business suit"
Expected: Same face, different outfits
```

### Test 3: Different Poses
```bash
Prompt: "looking at camera"
Prompt: "side profile"  
Prompt: "smiling"
Expected: Same face, different angles
```

## 🐛 Troubleshooting

### Issue: "InstantID nodes not found"
**Solution:**
```bash
cd ~/Documents/Git/Unicorn_Ai/comfyui/custom_nodes
git clone https://github.com/cubiq/ComfyUI_InstantID.git
./service.sh restart comfyui
```

### Issue: "Face analysis failed"
**Solution:**
```bash
# Reinstall insightface
cd ~/Documents/Git/Unicorn_Ai/comfyui
source venv/bin/activate
pip install --upgrade insightface onnxruntime-gpu
deactivate
```

### Issue: "Reference image not found"
**Solution:**
```bash
# Check reference image exists
ls -lh reference_images/luna.jpg

# If not, copy it:
cp /path/to/image.jpg reference_images/luna.jpg
```

### Issue: "Face doesn't match"
**Solutions:**
1. Increase weight in node 8 (try 0.9)
2. Use clearer reference image
3. Ensure reference shows face clearly

## 🎯 Next Steps

1. **Run setup:**
   ```bash
   ./setup_instantid.sh
   ```

2. **Copy reference image:**
   ```bash
   cp /path/to/luna/image.jpg reference_images/luna.jpg
   ```

3. **Test in ComfyUI:**
   - Open http://localhost:8188
   - Load `workflows/instantid_luna.json`
   - Generate test image

4. **Integrate with app:**
   - Update image_manager.py
   - Set workflow path for Luna
   - Enjoy consistent faces!

## 📚 Alternative: Train LoRA

If InstantID doesn't give perfect results, you can train a LoRA:

```bash
# See LORA_AND_FACE_CONSISTENCY_GUIDE.md for details
# Requires: 20-30 reference images
# Time: 30-60 minutes training
# Result: Perfect face consistency
```

---

**Questions?** Check LORA_AND_FACE_CONSISTENCY_GUIDE.md for more details!
