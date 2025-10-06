# Prompt Weighting Guide for Unicorn AI

## What is Prompt Weighting?

Prompt weighting is a feature of Stable Diffusion/SDXL that allows you to control how much attention the AI pays to specific parts of your prompt. This helps create more accurate images by emphasizing important features.

## How It Works

### Basic Syntax

**Increase Attention:**
- `(text)` - Multiply attention by 1.1 (10% increase)
- `((text))` - Multiply by 1.1 × 1.1 = 1.21 (21% increase)
- `(((text)))` - Multiply by 1.1³ = 1.331 (33% increase)

**Decrease Attention:**
- `[text]` - Multiply attention by 0.9 (10% decrease)
- `[[text]]` - Multiply by 0.9 × 0.9 = 0.81 (19% decrease)

**Specific Weight:**
- `(text:1.5)` - Multiply attention by exactly 1.5 (50% increase)
- `(text:0.8)` - Multiply attention by 0.8 (20% decrease)
- `(text:2.0)` - Double the attention (100% increase)

### Range Recommendations

- **Subtle changes**: 1.0 - 1.3
- **Moderate emphasis**: 1.3 - 1.5
- **Strong emphasis**: 1.5 - 2.0
- **Extreme** (use cautiously): 2.0+

## Where to Use Prompt Weighting

### 1. In Persona's Image Style Field

When creating or editing a persona, you can use weighting in the "Visual Appearance / Image Style" field:

**Example**:
```
(photorealistic:1.3), (beautiful young woman:1.2), 25 years old, 
(long dark hair:1.1), (green eyes:1.3), (detailed face:1.4), 
wearing casual dress, natural lighting, (8k uhd:1.2), 
(professional photography:1.1)
```

### 2. In Direct Image Generation

When using the `/generate-image` API endpoint, include weighting in your prompt:

```json
{
  "prompt": "(portrait:1.3), (smiling woman:1.2), professional lighting",
  "persona_id": "luna",
  "width": 1024,
  "height": 1024
}
```

### 3. In Chat-Based Image Requests

When the AI generates images via `[IMAGE: description]`, you can include weights:

**AI Response**:
```
Sure! Here's a photo 😊 [IMAGE: (selfie:1.2), (smiling:1.3), casual outfit, natural lighting]
```

## Practical Examples

### Example 1: Emphasizing Facial Features
**Without Weighting**:
```
photorealistic, young woman, blue eyes, detailed face, long blonde hair
```

**With Weighting**:
```
photorealistic, young woman, (blue eyes:1.4), (detailed face:1.5), 
(long blonde hair:1.2)
```

**Result**: More focus on eyes and face details, hair slightly emphasized.

---

### Example 2: Character Portrait
**Without Weighting**:
```
woman, 30 years old, professional attire, confident expression, office background
```

**With Weighting**:
```
(woman:1.2), 30 years old, (professional attire:1.3), 
(confident expression:1.4), (office background:0.8)
```

**Result**: Emphasizes the woman, her attire, and expression. Background is de-emphasized.

---

### Example 3: Specific Style
**Without Weighting**:
```
photorealistic, 8k uhd, professional photography, detailed skin texture, 
natural lighting, high quality
```

**With Weighting**:
```
(photorealistic:1.4), (8k uhd:1.2), (professional photography:1.3), 
(detailed skin texture:1.5), natural lighting, (high quality:1.2)
```

**Result**: Strong emphasis on realism, detail, and quality.

---

### Example 4: Luna's Enhanced Image Style
**Current Luna**:
```
photorealistic, 8k uhd, professional photography, beautiful young woman, 
fit body, long hair, detailed face
```

**With Weighting**:
```
(photorealistic:1.4), (8k uhd:1.2), (professional photography:1.3), 
(beautiful young woman:1.3), (fit body:1.2), (long hair:1.1), 
(detailed face:1.5), (perfect skin:1.2), natural lighting
```

**Result**: Much stronger emphasis on realism, face details, and overall quality.

---

### Example 5: Clothing Emphasis
**Without Weighting**:
```
woman wearing red dress, elegant style, evening setting
```

**With Weighting**:
```
woman wearing (red dress:1.5), (elegant style:1.3), evening setting
```

**Result**: The red dress becomes a focal point, elegant style emphasized.

---

### Example 6: De-emphasizing Background
**Without Weighting**:
```
woman, detailed face, cityscape background, evening light
```

**With Weighting**:
```
(woman:1.3), (detailed face:1.5), [cityscape background:0.7], evening light
```

Or:
```
(woman:1.3), (detailed face:1.5), (cityscape background:0.7), evening light
```

**Result**: Focus on the woman and face, background is less prominent.

## Best Practices

### DO:
✅ **Emphasize key features**: Face, eyes, important characteristics
✅ **Boost quality terms**: photorealistic, 8k, detailed, professional
✅ **Use moderate values**: 1.2-1.5 for most cases
✅ **Weight important subjects**: Main character, focal points
✅ **Test and iterate**: Try different weights to see what works best

### DON'T:
❌ **Over-weight everything**: Too many high weights cancel each other out
❌ **Use extreme values**: Above 2.0 can cause distortions
❌ **Weight negative concepts**: Use the negative prompt for things to avoid
❌ **Ignore balance**: Some elements should be neutral (1.0)
❌ **Stack too many parentheses**: `((((text))))` is usually too much

## Common Weight Values

| Purpose | Weight | Example |
|---------|--------|---------|
| **Subtle emphasis** | 1.1 | `(long hair:1.1)` |
| **Moderate emphasis** | 1.2-1.3 | `(detailed face:1.3)` |
| **Strong emphasis** | 1.4-1.5 | `(photorealistic:1.5)` |
| **Very strong** | 1.6-2.0 | `(perfect eyes:1.8)` |
| **Slight reduction** | 0.9 | `(background:0.9)` |
| **Moderate reduction** | 0.7-0.8 | `(background:0.7)` |
| **Strong reduction** | 0.5-0.6 | `(text:0.5)` |

## How SDXL Processes Weights

### CLIP Encoder
SDXL uses CLIP to encode text prompts into embeddings. The weighting syntax modifies these embeddings:

1. **Parse prompt**: Identifies weighted sections
2. **Adjust embeddings**: Multiplies token embeddings by weight values
3. **Normalize**: Prevents extreme values from breaking the model
4. **Generate**: Uses adjusted embeddings to guide image generation

### Both BASE and REFINER
Since our workflow uses SDXL BASE + REFINER:
- **Node 6 (BASE positive)**: Receives weighted prompt
- **Node 15 (REFINER positive)**: Receives same weighted prompt
- Both stages respect the weights for consistent results

## Examples for Different Personas

### Luna (Flirty, Fun)
```
(photorealistic:1.4), (beautiful young woman:1.3), (20-25 years old:1.1),
(long flowing hair:1.2), (bright eyes:1.4), (warm smile:1.3),
(detailed face:1.5), (natural beauty:1.2), (fit body:1.1),
casual style, (natural lighting:1.2), (8k uhd:1.2), professional photography
```

### Nova (Professional, Tech)
```
(photorealistic:1.3), (professional woman:1.3), (30 years old:1.1),
(intelligent look:1.4), (confident expression:1.3), (wearing glasses:1.2),
(business attire:1.3), (modern style:1.2), (detailed face:1.4),
office setting, (professional photography:1.3), (high quality:1.2)
```

### Sage (Wise, Mature)
```
(photorealistic:1.3), (mature woman:1.2), (40-50 years old:1.1),
(wise expression:1.4), (serene face:1.3), (kind eyes:1.3),
(elegant appearance:1.2), (sophisticated style:1.2), (detailed face:1.4),
natural setting, soft lighting, (professional photography:1.2)
```

### Mommy/Jessica (Dominant, Elegant)
```
(photorealistic:1.4), (mature woman:1.3), (40s:1.1), (elegant appearance:1.3),
(long blonde hair:1.2), (sophisticated style:1.4), (confident expression:1.4),
(detailed face:1.5), (perfect skin:1.2), (commanding presence:1.3),
professional yet approachable, (high quality:1.3), (8k uhd:1.2)
```

## Testing Prompt Weights

### Quick Test Method:
1. Edit a persona's "Visual Appearance / Image Style" field
2. Add weights to key terms
3. Generate an image
4. Compare with previous unweighted version
5. Adjust weights as needed

### A/B Testing:
**Prompt A (No weights)**:
```
photorealistic, young woman, long dark hair, blue eyes, smiling
```

**Prompt B (With weights)**:
```
(photorealistic:1.4), young woman, (long dark hair:1.2), (blue eyes:1.5), 
(smiling:1.3)
```

Generate both and compare results!

## Advanced Techniques

### Gradient Weighting
Different strengths for related concepts:
```
(beautiful woman:1.3), (detailed face:1.5), (perfect eyes:1.4), 
(natural skin:1.2), (soft features:1.1)
```
Strongest on eyes, moderate on face, subtle on features.

### Quality Stacking
Emphasize multiple quality terms:
```
(photorealistic:1.4), (8k uhd:1.3), (professional photography:1.3),
(high quality:1.2), (detailed:1.3), (sharp focus:1.2)
```

### Feature Isolation
De-emphasize everything except main subject:
```
(woman:1.5), (detailed face:1.6), [background:0.6], [props:0.7], 
[environment:0.7]
```

### Style Enforcement
Strong style emphasis:
```
(photorealistic:1.6), (realistic skin texture:1.5), (RAW photo:1.4),
(DSLR quality:1.3), [artistic:0.5], [painting:0.5], [illustration:0.5]
```

## Updating Existing Personas

### Via Web UI:
1. Click "Edit" on a persona
2. Find "Visual Appearance / Image Style" field
3. Add weights to important terms
4. Save persona

**Example Update for Luna**:
```
Before:
photorealistic, 8k uhd, professional photography, beautiful young woman, 
fit body, long hair, detailed face

After:
(photorealistic:1.4), (8k uhd:1.2), (professional photography:1.3), 
(beautiful young woman:1.3), (fit body:1.2), (long hair:1.1), 
(detailed face:1.5), (natural beauty:1.2), (perfect skin:1.3)
```

### Via JSON File:
Edit `data/personas/luna.json`:
```json
{
  "image_style": "(photorealistic:1.4), (beautiful young woman:1.3), (detailed face:1.5), (long hair:1.2)"
}
```

## Troubleshooting

### Problem: No visible difference
**Solution**: 
- Increase weight values (try 1.5+)
- Weight more distinctive features
- Ensure SDXL workflow is active (not old SD 1.5)

### Problem: Image looks distorted
**Solution**:
- Reduce weight values (keep under 1.8)
- Don't weight too many things
- Balance weights (not everything at 1.5+)

### Problem: Feature still not prominent
**Solution**:
- Increase specific weight: `(feature:1.8)`
- Add related terms: `(blue eyes:1.5), (bright eyes:1.4), (detailed eyes:1.5)`
- Use negative prompt to exclude competing features

### Problem: Weights seem ignored
**Solution**:
- Check SDXL workflow is being used (not old workflow)
- Verify ComfyUI is receiving the weights (check logs)
- Some features need higher weights (try 1.6-1.8)

## Verification

### Check if weighting is active:
1. Enable debug mode: `export COMFYUI_DEBUG=true`
2. Generate an image with weights
3. Check `outputs/logs/comfyui_last_workflow.json`
4. Look at Node 6 and 15 inputs - weights should be preserved

**Example**:
```bash
cat outputs/logs/comfyui_last_workflow.json | python3 -c "import json,sys; w=json.load(sys.stdin); print(w['6']['inputs']['text'])"
```

Should show weights like `(photorealistic:1.4)`.

## Compatibility

### ✅ Works With:
- SDXL BASE + REFINER workflow (current default)
- SDXL CLIP encoder
- All persona image styles
- Chat-based image generation
- Direct API image generation

### ❌ May Not Work With:
- Very old Stable Diffusion 1.5 models (limited support)
- Some custom nodes (depending on implementation)

## Current Status

**✅ Already Supported!**

The system already passes prompts directly to SDXL's CLIP encoder, which natively supports prompt weighting. No code changes needed - just start using the syntax!

### How to Use Right Now:

1. **Edit Luna's appearance**:
   ```bash
   # Via web UI: Edit Luna → Visual Appearance field
   # Add weights to her image_style
   ```

2. **Or edit JSON directly**:
   ```bash
   nano data/personas/luna.json
   # Update "image_style" field with weights
   ```

3. **Generate image and test!**

## Example Weight Progression

### Level 1: No Weights (Current)
```
photorealistic, beautiful young woman, detailed face
```

### Level 2: Basic Weights
```
(photorealistic:1.2), (beautiful young woman:1.2), (detailed face:1.3)
```

### Level 3: Moderate Weights
```
(photorealistic:1.4), (beautiful young woman:1.3), (detailed face:1.5), 
(perfect skin:1.2)
```

### Level 4: Advanced Weights
```
(photorealistic:1.5), (8k uhd:1.3), (professional photography:1.3),
(beautiful young woman:1.4), (fit body:1.2), (detailed face:1.6),
(perfect eyes:1.5), (natural skin texture:1.3), (soft lighting:1.2)
```

## Resources

- **Weight Calculator**: Parentheses = ×1.1 per level
- **Brackets**: Square brackets = ×0.9 per level
- **Specific**: `(text:X)` where X is exact multiplier
- **Range**: 0.1 (minimal) to 2.0 (extreme)

## Summary

**Prompt weighting is already supported!** 

Just add the syntax to:
- Persona's image_style field
- Direct image generation prompts
- AI's [IMAGE: description] tags

Start with moderate weights (1.2-1.4) and adjust based on results. Emphasize faces, quality terms, and key features for best results.

---

**Ready to try?** Edit Luna's image_style with weights and generate an image to see the difference! 🎨
