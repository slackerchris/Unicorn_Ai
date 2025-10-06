# Workflow Update: SDXL Character Profile

## Date: October 6, 2025

## Overview
Updated the image generation system to use the SDXL dual-stage workflow (`sdxl_Character_profile_api.json`) instead of the basic single-stage workflow (`character_generation.json`).

## Changes Made

### 1. ComfyUI Provider Update
**File**: `providers/comfyui_provider.py`
**Line**: ~24

**Before**:
```python
self.workflow_path = os.getenv(
    "COMFYUI_WORKFLOW",
    "workflows/character_generation.json"
)
```

**After**:
```python
self.workflow_path = os.getenv(
    "COMFYUI_WORKFLOW",
    "workflows/sdxl_Character_profile_api.json"
)
```

### 2. SDXL Workflow Negative Prompts
**File**: `workflows/sdxl_Character_profile_api.json`

Updated both BASE and REFINER negative prompt nodes:

**Node 7 (BASE Negative Prompt)**:
```json
{
  "inputs": {
    "text": "ugly, deformed, blurry, low quality, text, watermark, distorted, malformed, disfigured, bad anatomy, wrong anatomy, extra limbs, missing limbs, floating limbs, disconnected limbs, mutation, mutated, gross proportions, bad proportions, poorly drawn, cartoon, anime, sketches, worst quality, low resolution, noise, grainy, signature, username, artist name",
    "clip": ["4", 1]
  },
  "class_type": "CLIPTextEncode",
  "_meta": {
    "title": "CLIP Text Encode (Negative - BASE)"
  }
}
```

**Node 16 (REFINER Negative Prompt)**:
```json
{
  "inputs": {
    "text": "ugly, deformed, blurry, low quality, text, watermark, distorted, malformed, disfigured, bad anatomy, wrong anatomy, extra limbs, missing limbs, floating limbs, disconnected limbs, mutation, mutated, gross proportions, bad proportions, poorly drawn, cartoon, anime, sketches, worst quality, low resolution, noise, grainy, signature, username, artist name",
    "clip": ["12", 1]
  },
  "class_type": "CLIPTextEncode",
  "_meta": {
    "title": "CLIP Text Encode (Negative - REFINER)"
  }
}
```

## SDXL Workflow Architecture

### Two-Stage Generation Process:

**Stage 1: BASE Model** (Steps 0-20)
- Uses: `sd_xl_base_1.0.safetensors`
- Node 6: Positive prompt (character description)
- Node 7: Negative prompt (enhanced)
- Node 10: KSampler Advanced
  - Steps: 25
  - Start: 0, End: 20
  - Returns with leftover noise: enabled

**Stage 2: REFINER Model** (Steps 20-25)
- Uses: `sd_xl_refiner_1.0.safetensors`
- Node 15: Positive prompt (same as BASE)
- Node 16: Negative prompt (enhanced)
- Node 11: KSampler Advanced
  - Steps: 25
  - Start: 20, End: 10000
  - Refines details from BASE output

### Benefits of SDXL Dual-Stage:

1. **Higher Quality**: SDXL produces more detailed, photorealistic images
2. **Better Anatomy**: BASE + REFINER process improves body proportions
3. **Finer Details**: REFINER stage enhances textures, faces, lighting
4. **Larger Resolution**: Native 1024x1024 (vs 512x512 in old workflow)
5. **More Control**: Separate CLIP encoders for BASE and REFINER
6. **Professional Results**: SDXL is state-of-the-art for image generation

## Workflow Comparison

### Old Workflow (`character_generation.json`):
- Single-stage generation
- Uses: `realisticVision_v51.safetensors` (Stable Diffusion 1.5)
- Resolution: 512x512
- Node 3: Single negative prompt
- 20 steps total
- Good for: Quick tests, basic generation

### New Workflow (`sdxl_Character_profile_api.json`):
- Dual-stage generation (BASE + REFINER)
- Uses: SDXL 1.0 BASE + REFINER models
- Resolution: 1024x1024
- Nodes 7 & 16: Dual negative prompts
- 25 steps total (20 BASE + 5 REFINER)
- Good for: High-quality character portraits, production use

## ComfyUI Node Structure

### SDXL Workflow Nodes:
- **Node 4**: CheckpointLoaderSimple (BASE model)
- **Node 5**: EmptyLatentImage (1024x1024)
- **Node 6**: CLIPTextEncode (BASE positive)
- **Node 7**: CLIPTextEncode (BASE negative) ← Enhanced
- **Node 10**: KSamplerAdvanced (BASE generation)
- **Node 12**: CheckpointLoaderSimple (REFINER model)
- **Node 15**: CLIPTextEncode (REFINER positive)
- **Node 16**: CLIPTextEncode (REFINER negative) ← Enhanced
- **Node 11**: KSamplerAdvanced (REFINER generation)
- **Node 17**: VAEDecode (convert latent to image)
- **Node 19**: SaveImage (output)

### Dynamic Prompt Injection:
The `comfyui_provider.py` dynamically updates these nodes:
- Node 6 & 15: Receives the character prompt from chat
- Node 7 & 16: Receives the enhanced negative prompt
- Node 5: Receives width/height dimensions

## Model Requirements

### SDXL Models Needed:
1. **sd_xl_base_1.0.safetensors** (6.94 GB)
   - Main generation model
   - Must be in `ComfyUI/models/checkpoints/`

2. **sd_xl_refiner_1.0.safetensors** (6.08 GB)
   - Detail refinement model
   - Must be in `ComfyUI/models/checkpoints/`

### Verification:
```bash
ls -lh ~/ComfyUI/models/checkpoints/sd_xl*.safetensors
```

## Performance Considerations

### VRAM Usage:
- SDXL BASE: ~5-6 GB VRAM
- SDXL REFINER: ~5-6 GB VRAM
- Total peak: ~8-10 GB VRAM (models unload between stages)
- Your RTX A2000: 12 GB VRAM ✅ Sufficient

### Generation Time:
- SDXL is slower than SD 1.5 (higher quality = more computation)
- Expected: 30-60 seconds per image (depending on GPU)
- Trade-off: Worth it for significantly better quality

### Optimization:
- `--normalvram` flag already set in `start_all.sh`
- Ollama models unloaded during generation
- ComfyUI will unload BASE when loading REFINER

## Testing

### Quick Test Command:
```bash
curl -X POST http://localhost:8000/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "beautiful portrait",
    "persona_id": "default",
    "width": 1024,
    "height": 1024
  }'
```

### Expected Results:
- Higher resolution (1024x1024)
- Better facial details
- More realistic lighting
- Improved anatomy
- Professional quality

## Rollback Instructions

If you need to revert to the old workflow:

1. **Edit `providers/comfyui_provider.py`**:
   ```python
   self.workflow_path = os.getenv(
       "COMFYUI_WORKFLOW",
       "workflows/character_generation.json"
   )
   ```

2. **Or set environment variable**:
   ```bash
   export COMFYUI_WORKFLOW="workflows/character_generation.json"
   ```

3. **Restart Web UI**:
   ```bash
   pkill -f "python main.py"
   python main.py
   ```

## Configuration Override

You can change the workflow without editing code:

**In `.env` file** (create if it doesn't exist):
```bash
COMFYUI_WORKFLOW=workflows/sdxl_Character_profile_api.json
```

**Or via environment variable**:
```bash
export COMFYUI_WORKFLOW=workflows/sdxl_Character_profile_api.json
python main.py
```

## Related Updates

This change works together with:
1. **Enhanced Negative Prompts** (see `NEGATIVE_PROMPT_ENHANCEMENT.md`)
2. **VRAM Management** (Ollama unload during generation)
3. **Dynamic Prompt Injection** (persona-based character consistency)

## Conclusion

The switch to SDXL dual-stage workflow provides:
- ✅ Higher quality images (1024x1024 vs 512x512)
- ✅ Better anatomy and proportions
- ✅ More professional results
- ✅ Enhanced detail refinement
- ✅ Compatible with existing VRAM management
- ✅ Works with enhanced negative prompts

**Status**: ✅ COMPLETE - Active immediately after restart
**Impact**: Significantly improved image quality
**Breaking Changes**: None - API interface unchanged
**Performance**: Slightly slower but much higher quality

## Next Steps

After restart, test image generation:
1. Use web UI to generate a persona image
2. Compare quality with previous generations
3. Verify VRAM usage stays within limits
4. Check generation time is acceptable
5. Enjoy the improved quality! 🎨
