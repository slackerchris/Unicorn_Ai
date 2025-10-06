# Portable Model Configuration

## 🎯 Problem Solved!

The setup is now **portable across machines**. No more hardcoded paths!

---

## 🔧 How It Works

### 1. **Template File** (committed to git):
`comfyui/extra_model_paths.yaml.example`
- Example configuration
- Shows the structure
- Not machine-specific

### 2. **Actual Config** (NOT in git):
`comfyui/extra_model_paths.yaml`
- Auto-generated per machine
- Contains actual paths for that system
- Excluded via `.gitignore`

### 3. **Detection Script**:
`detect_models.sh`
- Auto-detects existing ComfyUI installations
- Generates machine-specific config
- Handles multiple scenarios

---

## 🚀 Setup on Any Machine

### Initial Setup (This Machine - Already Done ✅):
```bash
bash detect_models.sh
```
Result: Uses `/home/chris/.local/share/ComfyUI/`

### Setup on New Machine:
```bash
# 1. Clone the repo
git clone <repo-url>
cd Unicorn_Ai

# 2. Detect models location
bash detect_models.sh
```

The script will:
- ✅ Auto-detect existing ComfyUI at `~/.local/share/ComfyUI/`
- ✅ Or detect at `~/ComfyUI/`
- ✅ Or detect at `~/ai-models/comfyui/`
- ✅ Or let you choose a custom path
- ✅ Generate `extra_model_paths.yaml` with correct paths
- ✅ Show what models are available

---

## 📂 What Gets Committed vs Not

### ✅ Committed to Git:
```
comfyui/extra_model_paths.yaml.example  ← Template
detect_models.sh                         ← Auto-detection script
download_models.sh                       ← Downloads to detected location
comfyui/.gitignore                       ← Excludes machine-specific files
```

### ❌ NOT Committed (Machine-Specific):
```
comfyui/extra_model_paths.yaml          ← Generated per machine
comfyui/models/*                         ← Model files (too large)
/home/username/.local/share/ComfyUI/    ← System models location
```

---

## 🌍 Cross-Machine Scenarios

### Scenario 1: Developer's Laptop
```bash
$ bash detect_models.sh
🔍 Detecting ComfyUI models location...
✅ Found: /home/alice/.local/share/ComfyUI
✅ Using detected path
📝 Generating configuration file...
```

Generated config:
```yaml
base_path: /home/alice/.local/share/ComfyUI/
```

### Scenario 2: Production Server
```bash
$ bash detect_models.sh
🔍 Detecting ComfyUI models location...
✅ Found: /opt/ai-models/comfyui
✅ Using detected path
📝 Generating configuration file...
```

Generated config:
```yaml
base_path: /opt/ai-models/comfyui/
```

### Scenario 3: Fresh Install
```bash
$ bash detect_models.sh
🔍 Detecting ComfyUI models location...
⚠️  No existing ComfyUI installation detected

Where would you like to store models?
  1. /home/bob/.local/share/ComfyUI (recommended)
  2. /home/bob/ai-models/comfyui
  3. Custom path
Choose [1-3]: 1

📁 Creating directory structure...
✅ Created: /home/bob/.local/share/ComfyUI
```

---

## 🔄 Integration with Other Scripts

### `download_models.sh` - Auto-detects location:
```bash
# Reads from extra_model_paths.yaml
MODELS_DIR=$(grep "base_path:" comfyui/extra_model_paths.yaml ...)

# Downloads to the detected location
wget ... -O "$MODELS_DIR/checkpoints/model.safetensors"
```

### `start_all.sh` - No changes needed:
```bash
# ComfyUI automatically reads extra_model_paths.yaml
# Models are found regardless of location
```

---

## 🎨 Example Workflow

### On Machine 1 (Your Current Machine):
```bash
# Already configured
$ ls comfyui/extra_model_paths.yaml
base_path: /home/chris/.local/share/ComfyUI/

# Models available
$ bash start_all.sh
✅ Using models from /home/chris/.local/share/ComfyUI/
```

### Push to Git:
```bash
$ git add .
$ git commit -m "Portable model configuration"
$ git push
```

Note: `extra_model_paths.yaml` is **NOT pushed** (in .gitignore)

### On Machine 2 (Different User/Machine):
```bash
$ git clone <repo>
$ cd Unicorn_Ai

# No extra_model_paths.yaml exists yet
$ bash detect_models.sh
✅ Found: /home/bob/.local/share/ComfyUI
📝 Generating configuration file...

# Now configured for Machine 2
$ bash start_all.sh
✅ Using models from /home/bob/.local/share/ComfyUI/
```

---

## 🛠️ Advanced: Multiple Model Locations

The `extra_model_paths.yaml` supports multiple locations:

```yaml
# Machine 1 location
machine1_models:
    base_path: /home/chris/.local/share/ComfyUI/
    checkpoints: checkpoints/

# Shared network location
network_models:
    base_path: /mnt/nas/ai-models/
    checkpoints: checkpoints/

# Project-specific models
project_models:
    base_path: /home/chris/Documents/Git/Unicorn_Ai/comfyui/models/
    loras: loras/
```

ComfyUI will check **all configured locations** for models!

---

## 📊 Comparison

| Approach | Portable? | Git Size | Easy Setup? |
|----------|-----------|----------|-------------|
| **Hardcoded paths** | ❌ No | Small | ❌ Breaks on new machine |
| **Models in repo** | ✅ Yes | ❌ Huge (27GB+) | ✅ Easy |
| **Auto-detection** | ✅ Yes | ✅ Small | ✅ Easy |

**Our approach: Auto-detection** = Best of both worlds! ✨

---

## 🐛 Troubleshooting

### Config file has wrong path:
```bash
# Just re-run detection
bash detect_models.sh
```

### Want to use different location:
```bash
# Delete existing config
rm comfyui/extra_model_paths.yaml

# Run detection again
bash detect_models.sh
# Choose different option
```

### Manual override:
```bash
# Edit directly
nano comfyui/extra_model_paths.yaml
# Change base_path to your desired location
```

---

## ✅ Summary

**Before:**
- ❌ Hardcoded: `/home/chris/.local/share/ComfyUI/`
- ❌ Breaks on other machines
- ❌ Manual editing required

**After:**
- ✅ Auto-detects model location
- ✅ Works on any machine
- ✅ One command: `bash detect_models.sh`
- ✅ Config excluded from git
- ✅ Template included for reference

**Result:** Truly portable setup! 🎉
