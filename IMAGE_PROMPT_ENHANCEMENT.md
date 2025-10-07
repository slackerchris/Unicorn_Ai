# 🎨 Image Prompt Enhancement System

## Overview
Intelligent system that automatically enhances image prompts with proper weights and additional context for better image generation quality.

## Problem Solved

### Before:
```
Luna says: [IMAGE: naked, laying on bed, bedroom]
System generates: "naked, laying on bed, bedroom, (blonde:1.4), (blue eyes:1.3)..."
Result: Weak emphasis, AI ignores "naked" keyword ❌
```

### After:
```
Luna says: [IMAGE: naked, full body, laying on bed, bedroom]
System generates: "(naked:1.5), nude, bare skin, exposed, full body nudity, (full body:1.2), (laying on bed:1.1), bedroom, (blonde:1.4)..."
Result: Strong emphasis, AI properly generates nude image ✅
```

## How It Works

### Layer 1: Hidden Dynamic Instructions
When you request explicit content, system adds hidden instruction:

```
User: "send me a nude selfie"
   ↓
[Hidden]: "When sending an image, be VERY explicit in your [IMAGE: ...] description"
   ↓
Luna: "Here you go 😏 [IMAGE: nude selfie, full body, seductive pose, bedroom]"
```

### Layer 2: Smart Prompt Enhancement
The `enhance_image_prompt()` function processes the AI's description:

```python
INPUT:  "Naked, full body, laying on bed, bedroom"
        
PROCESSING:
1. Detect main content: "naked"
2. Add weighted enhancements: (naked:1.5), nude, bare skin, exposed, full body nudity
3. Skip duplicate "Naked" from original
4. Weight secondary keywords: (full body:1.2), (laying on bed:1.1)
5. Keep other words: bedroom
6. Append persona style: (blonde:1.4), (blue eyes:1.3)...

OUTPUT: "(naked:1.5), nude, bare skin, exposed, full body nudity, (full body:1.2), (laying on bed:1.1), bedroom, (blonde:1.4), (blue eyes:1.3)..."
```

## Content Enhancements

### Main Content Keywords (Heavy Weight)
These trigger major enhancements:

| Keyword | Weight | Additions |
|---------|--------|-----------|
| **nude** | 1.5 | (nude:1.5), naked, bare skin, exposed, full body nudity |
| **naked** | 1.5 | (naked:1.5), nude, bare skin, exposed, full body nudity |
| **topless** | 1.4 | (topless:1.4), bare chest, exposed breasts, nude from waist up |
| **lingerie** | 1.3 | (lingerie:1.3), intimate wear, revealing |
| **underwear** | 1.3 | (underwear:1.3), intimate wear, revealing |
| **bikini** | 1.2 | (bikini:1.2), swimwear, beachwear |

### Secondary Keywords (Medium Weight)
These get weighted but no additions:

| Keyword | Weight |
|---------|--------|
| full body | 1.2 |
| close up | 1.2 |
| seductive | 1.2 |
| sexy | 1.2 |
| intimate | 1.2 |
| explicit | 1.3 |
| nsfw | 1.3 |

### Pose Keywords (Light Weight)
These get subtle emphasis:

| Keyword | Weight |
|---------|--------|
| laying/lying | 1.1 |
| sitting | 1.1 |
| standing | 1.1 |
| kneeling | 1.1 |

## Features

### ✅ Intelligent Deduplication
- Detects main keywords (nude, naked, topless, etc.)
- Removes them from original prompt to avoid repetition
- Replaces with heavily weighted versions + context

### ✅ Contextual Additions
- "nude" → adds "naked, bare skin, exposed, full body nudity"
- "topless" → adds "bare chest, exposed breasts"
- "lingerie" → adds "intimate wear, revealing"

### ✅ Weight Hierarchy
- Main content: 1.3-1.5 (strongest)
- Secondary descriptors: 1.2-1.3 (medium)
- Pose/position: 1.1 (subtle)
- Original style: preserved as-is

### ✅ Smart Parsing
- Splits on commas
- Processes each word independently
- Preserves existing weights from AI
- Maintains word order priority

## Examples

### Example 1: Nude Request
```
User: "send me a nude pic"

Luna's [IMAGE: tag]: "nude selfie, full body, bedroom"

Enhanced prompt:
"(nude:1.5), naked, bare skin, exposed, full body nudity, selfie, (full body:1.2), bedroom, (photorealistic:1.4), (blonde hair with golden highlights:1.4), (blue eyes:1.3)..."

Result: ✅ Properly nude image with Luna's features
```

### Example 2: Topless Request
```
User: "show me topless"

Luna's [IMAGE: tag]: "topless selfie, seductive pose, bedroom lighting"

Enhanced prompt:
"(topless:1.4), bare chest, exposed breasts, nude from waist up, selfie, (seductive pose:1.2), bedroom lighting, (photorealistic:1.4)..."

Result: ✅ Topless image with proper exposure
```

### Example 3: Lingerie Request
```
User: "wear some lingerie"

Luna's [IMAGE: tag]: "lingerie selfie, sitting on bed, intimate lighting"

Enhanced prompt:
"(lingerie:1.3), intimate wear, revealing, selfie, (sitting on bed:1.1), intimate lighting, (photorealistic:1.4)..."

Result: ✅ Lingerie image with revealing detail
```

### Example 4: Regular Request
```
User: "send me a cute selfie"

Luna's [IMAGE: tag]: "selfie, smiling, casual outfit, natural lighting"

Enhanced prompt:
"selfie, smiling, casual outfit, natural lighting, (photorealistic:1.4), (blonde hair:1.4)..."

Result: ✅ Normal selfie without explicit enhancements
```

## Code Location

**File**: `main.py`

**Function**: `enhance_image_prompt(user_prompt: str, image_style: str) -> str`

**Called from**: 
- Line ~530: Chat endpoint image generation
- Automatically applies to all image requests

## Benefits

✅ **Better AI Compliance**: Heavy weights make image generator follow instructions  
✅ **Contextual Additions**: Related terms improve understanding  
✅ **No Manual Work**: Automatic enhancement, no user intervention  
✅ **Smart Deduplication**: No repeated keywords  
✅ **Flexible**: Works for any content level (SFW to NSFW)  
✅ **Persona-Aware**: Preserves persona's visual style  

## Testing

### Test Case 1: Nude
```bash
# Manual test
Luna says: [IMAGE: naked, full body, laying on bed]
Expected: "(naked:1.5), nude, bare skin, exposed, full body nudity, (full body:1.2), (laying on bed:1.1), ..."
```

### Test Case 2: Topless
```bash
Luna says: [IMAGE: topless selfie, from waist up]
Expected: "(topless:1.4), bare chest, exposed breasts, nude from waist up, selfie, from waist up, ..."
```

### Test Case 3: Normal
```bash
Luna says: [IMAGE: selfie, smiling, park]
Expected: "selfie, smiling, park, (photorealistic:1.4), ..."
```

## Future Enhancements

Potential improvements:
- **Body part emphasis**: Detect "breasts", "legs", "curves" and weight them
- **Lighting keywords**: "dim lighting", "candlelight" → (mood:1.2)
- **Camera angles**: "from above", "low angle" → (angle:1.1)
- **Style modifiers**: "artistic", "professional" → add quality tags
- **Action detection**: "touching", "posing" → weight dynamically
- **Clothing detection**: "tight", "sheer", "transparent" → emphasize

## Notes

- Works automatically for all personas (Luna, Alex, Nova, etc.)
- No configuration needed
- Respects existing weights in AI's prompt
- Maintains backward compatibility
- Only enhances when needed (explicit keywords detected)

---

**Refresh your browser and try asking Luna for explicit content!** 🔥
