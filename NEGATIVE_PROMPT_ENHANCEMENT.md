# Negative Prompt Enhancement - Update Summary

## Date: October 6, 2025

## Overview
Updated the negative prompts used in image generation to provide better quality control and avoid common image generation artifacts.

## Changes Made

### Previous Negative Prompts:

**Generate Image Endpoint (`/generate-image`)**:
```
"ugly, deformed, blurry, low quality"
```

**Chat Image Generation**:
```
"ugly, deformed, blurry, low quality, text, watermark"
```

### New Enhanced Negative Prompts:

**Generate Image Endpoint (`/generate-image`)**:
```
"ugly, deformed, blurry, low quality, distorted, malformed, disfigured, bad anatomy, 
wrong anatomy, extra limbs, missing limbs, floating limbs, disconnected limbs, mutation, 
mutated, gross proportions, bad proportions, poorly drawn, cartoon, anime, sketches, 
worst quality, low resolution, noise, grainy"
```

**Chat Image Generation**:
```
"ugly, deformed, blurry, low quality, text, watermark, distorted, malformed, disfigured, 
bad anatomy, wrong anatomy, extra limbs, missing limbs, floating limbs, disconnected limbs, 
mutation, mutated, gross proportions, bad proportions, poorly drawn, cartoon, anime, sketches, 
worst quality, low resolution, noise, grainy, signature, username, artist name"
```

## What These Terms Help Prevent

### Anatomy Issues:
- **bad anatomy, wrong anatomy**: Prevents incorrect body structure
- **extra limbs, missing limbs**: Avoids duplicate or absent body parts
- **floating limbs, disconnected limbs**: Ensures limbs are properly attached
- **gross proportions, bad proportions**: Maintains realistic body proportions

### Quality Issues:
- **worst quality, low resolution**: Encourages higher quality generation
- **noise, grainy**: Reduces visual noise and graininess
- **blurry**: Promotes sharper, clearer images

### Deformation Issues:
- **deformed, distorted, malformed, disfigured**: Prevents various types of visual distortion
- **mutation, mutated**: Avoids bizarre or unnatural variations

### Artistic Style Issues:
- **cartoon, anime, sketches**: Maintains realistic/photorealistic style
- **poorly drawn**: Encourages better rendering quality

### Unwanted Text/Watermarks (Chat only):
- **text, watermark**: Prevents text overlays
- **signature, username, artist name**: Removes artist attribution marks

## Technical Details

### File Modified:
- **`/home/chris/Documents/Git/Unicorn_Ai/main.py`**
  - Line ~325: Generate image endpoint
  - Line ~457: Chat image generation

### Integration:
- Negative prompts are passed to the `image_manager.generate_image()` function
- ComfyUI provider injects these into both BASE and REFINER stages of SDXL workflow
- Works with existing workflow files without modification

### Workflow Files:
The following workflow file is now being used:
- **`workflows/sdxl_Character_profile_api.json`** (ACTIVE)
  - Node 7 = BASE negative prompt (CLIPTextEncode)
  - Node 16 = REFINER negative prompt (CLIPTextEncode)
  - Both nodes updated with enhanced negative prompts

Legacy workflow (no longer used):
- `workflows/character_generation.json` (old basic workflow)

## Expected Results

### Before:
- Occasional anatomy errors (extra fingers, wrong proportions)
- Sometimes blurry or low-quality outputs
- Possible text artifacts in images
- Inconsistent quality

### After:
- Better anatomy accuracy (correct limbs, proportions)
- Consistently sharper, higher-quality images
- Reduced text/watermark artifacts
- More realistic/photorealistic style
- Fewer visual distortions and mutations

## Testing Recommendations

1. **Test with Personas**: Generate images for different personas to verify improvement
2. **Compare Before/After**: Check existing vs new images for quality differences
3. **Edge Cases**: Test with complex prompts (multiple people, specific poses)
4. **Portrait Generation**: Verify face/body anatomy is correct
5. **Full Body Shots**: Check limb count and proportions

## Usage

### No Action Required:
- Changes are automatically applied to all image generation
- Both `/generate-image` endpoint and chat-based generation use enhanced prompts
- No configuration changes needed

### Customization:
If you want to customize negative prompts in the future, edit these lines in `main.py`:
- **Line ~325**: Generate image endpoint negative prompt
- **Line ~457**: Chat image generation negative prompt

## Related Files

1. **main.py**: Contains the negative prompt strings (line ~325 and ~457)
2. **providers/comfyui_provider.py**: 
   - Default workflow changed to `sdxl_Character_profile_api.json` (line ~24)
   - Injects negative prompts into Node 7 (BASE) and Node 16 (REFINER)
3. **workflows/sdxl_Character_profile_api.json**: 
   - SDXL workflow with dual-stage generation (BASE + REFINER)
   - Default negative prompts updated in both nodes
   - Uses SDXL 1.0 BASE and REFINER models

## Notes

- Negative prompts are weighted equally with positive prompts in SDXL
- More specific negative terms generally yield better results
- ComfyUI applies these to both BASE and REFINER stages for consistent quality
- The prompts are designed for realistic/photorealistic generation
- If anime/cartoon style is desired, those terms should be removed from negatives

## Future Enhancements

Potential improvements for future versions:
1. **Configurable Negative Prompts**: Allow users to customize via UI
2. **Style-Specific Negatives**: Different negatives for anime vs realistic
3. **Persona-Level Negatives**: Each persona can have custom negative prompts
4. **Weight Control**: Add ability to weight negative terms
5. **Presets**: Common negative prompt presets (realistic, anime, artistic, etc.)

## Conclusion

The enhanced negative prompts provide significantly better control over image quality and anatomy accuracy. The changes are transparent to users and automatically improve all image generation without requiring configuration changes.

**Status**: ✅ COMPLETE - Active immediately after Web UI restart
**Impact**: Improved image quality across all generation types
**Breaking Changes**: None - fully backward compatible
