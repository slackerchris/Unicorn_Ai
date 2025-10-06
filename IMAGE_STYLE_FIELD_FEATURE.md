# Visual Appearance / Image Style Field - Feature Addition

## Date: October 6, 2025

## Overview
Added a "Visual Appearance / Image Style" field to the persona editor, allowing users to describe how their persona looks for consistent image generation.

## User Request
> "is there a way to set a description of what the persona looks like?"

## Changes Made

### 1. HTML - Added Image Style Field
**File**: `static/index.html`
**Location**: After the Voice selector, before Temperature slider

**Added Field**:
```html
<div class="setting-group">
    <label for="personaImageStyle">Visual Appearance / Image Style</label>
    <textarea 
        id="personaImageStyle" 
        class="text-input"
        placeholder="e.g., photorealistic, young woman, long dark hair, casual style, friendly expression, modern clothing"
        rows="3"
    ></textarea>
    <p class="setting-description">Description of how the persona looks (used for image generation). Include details like age, appearance, clothing style, expression, etc.</p>
</div>
```

**Field Properties**:
- **Type**: Textarea (multi-line input)
- **Rows**: 3 lines
- **Optional**: Not required, but recommended for consistent image generation
- **Placeholder**: Example description showing the format

### 2. JavaScript - Integration
**File**: `static/app.js`

#### Added to Edit Persona Function:
```javascript
document.getElementById('personaImageStyle').value = this.currentPersona.image_style || '';
```
Loads existing image_style when editing a persona.

#### Added to Save/Create Function:
```javascript
const imageStyleEl = form.querySelector('#personaImageStyle');
const imageStyle = imageStyleEl.value.trim();
```
Gets the value from the form.

#### Added to API Payload:
```javascript
body: JSON.stringify({
    // ... other fields ...
    image_style: imageStyle,
    // ... other fields ...
})
```
Sends to backend when creating/updating persona.

### 3. Version Bump
Updated cache version from v=10 to v=11 for both CSS and JS.

## How It Works

### Backend (Already Existed)
The `image_style` field was already part of the Persona data structure in `persona_manager.py`:

```python
@dataclass
class Persona:
    # ... other fields ...
    image_style: Optional[str] = None
    # ... other fields ...
```

### Image Generation Integration
When generating images, the `image_style` is automatically added to the prompt:

**In `main.py` (line ~319)**:
```python
character_prompt = f"{persona.name}, {persona.description}, {prompt}"
if persona.image_style:
    character_prompt += f", {persona.image_style}"
```

**In `main.py` (line ~451)** (chat-based image generation):
```python
character_prompt = f"{persona.name}, {persona.description}, {image_prompt}"
if persona.image_style:
    character_prompt += f", {persona.image_style}"
```

### Complete Prompt Flow:
1. User requests image via chat or API
2. System builds prompt: `{persona.name}, {persona.description}, {user_prompt}`
3. If `image_style` exists, adds: `, {persona.image_style}`
4. Enhanced negative prompt is added
5. Prompt is sent to SDXL workflow in ComfyUI
6. Image generated with consistent character appearance

## Usage Examples

### Example 1: Young Professional Woman
```
photorealistic, young woman, 28 years old, long dark brown hair, professional business attire, 
confident expression, modern office style, wearing glasses, intelligent look
```

### Example 2: Casual Male Character
```
photorealistic, man in his early 30s, short blonde hair, casual hoodie and jeans, 
friendly smile, relaxed posture, modern streetwear style, athletic build
```

### Example 3: Fantasy Character
```
photorealistic portrait, woman with ethereal appearance, long flowing silver hair, 
mystical robes, serene expression, magical aura, fantasy style, elegant features
```

### Example 4: Existing Persona (Jessica/Mommy)
```
photorealistic, mature woman, 40s, elegant appearance, long blonde hair, 
sophisticated style, warm maternal expression, professional yet approachable, 
wearing casual but refined clothing
```

## UI Location

**Persona Editor Modal** (Create/Edit Persona):
1. Name *
2. Description *
3. Personality Traits *
4. Speaking Style *
5. AI Model (LLM)
6. Voice
7. **Visual Appearance / Image Style** ← NEW
8. Temperature (Creativity)
9. Max Response Length

## Benefits

### 1. Character Consistency
- Ensures the same persona always generates similar-looking images
- Maintains visual identity across multiple image generations
- Character details remain consistent in different scenarios

### 2. Better Image Quality
- More detailed descriptions lead to better SDXL results
- Specific details help the AI understand exactly what to generate
- Reduces random variations in appearance

### 3. User Control
- Users can define exactly how they want their persona to look
- Can specify age, hair color, clothing style, expression, etc.
- Full creative control over character appearance

### 4. Easier Persona Creation
- Clear field with helpful placeholder examples
- Guidance text explains what to include
- Optional - doesn't break existing personas without it

## Validation

### Field is Optional
- Not marked as required (unlike name, description, traits, speaking style)
- Can be left empty for personas that don't need images
- Existing personas without image_style continue to work

### No Length Limit
- Can be as detailed or brief as needed
- Textarea allows multi-line descriptions
- Longer descriptions generally produce better results

## API Integration

### Create Persona Endpoint
`POST /personas/create`

**Request Body** (now includes image_style):
```json
{
    "id": "custom-character",
    "name": "Custom Character",
    "description": "A helpful assistant",
    "personality_traits": ["friendly", "creative", "helpful"],
    "speaking_style": "Casual and warm",
    "model": "dolphin-mistral:latest",
    "voice": "en-US-AriaNeural",
    "image_style": "photorealistic, young woman, casual style",
    "temperature": 0.8,
    "max_tokens": 150
}
```

### Update Persona Endpoint
`PUT /personas/{persona_id}`

Same structure as create, image_style can be updated.

### Get Persona Endpoint
`GET /personas/{persona_id}`

**Response** (includes image_style):
```json
{
    "id": "custom-character",
    "name": "Custom Character",
    // ... other fields ...
    "image_style": "photorealistic, young woman, casual style",
    // ... other fields ...
}
```

## Default Personas

The built-in personas already have image_style defined:

**Luna** (`persona_manager.py` line ~121):
```python
image_style="photorealistic, young woman, casual style, friendly expression"
```

**Nova** (line ~146):
```python
image_style="professional, intelligent look, modern style"
```

**Sage** (line ~171):
```python
image_style="mature, wise appearance, serene expression"
```

**Alex** (line ~196):
```python
image_style="energetic, casual sporty style, big smile"
```

## Best Practices

### What to Include:
1. **Style/Realism**: photorealistic, artistic, cinematic
2. **Age**: young woman, mature man, teenager, etc.
3. **Physical Features**: hair color/length, eye color, build
4. **Clothing**: casual, professional, fantasy, modern, vintage
5. **Expression**: friendly, serious, confident, playful
6. **Details**: accessories, makeup, hairstyle

### What to Avoid:
- Contradictory descriptions (both "young" and "elderly")
- Negative terms (use negative prompts for what NOT to show)
- Too generic ("nice looking person")
- NSFW content (filtered by negative prompts)

### Tips:
- Be specific but concise
- Front-load important details (AI pays more attention to start)
- Use commas to separate attributes
- Include style keywords (photorealistic, professional photography)
- Consider lighting and mood if important

## Testing

### To Test:
1. Open web UI
2. Edit an existing persona or create a new one
3. Fill in the "Visual Appearance / Image Style" field
4. Save the persona
5. Request an image from that persona via chat
6. Verify the image matches the description

### Test Personas:
Create test persona with detailed appearance:
- Name: "Test Character"
- Image Style: "photorealistic, young woman, 25 years old, long red hair, green eyes, wearing blue dress, smiling, outdoor lighting"

Generate image and verify it matches the description.

## Backward Compatibility

### Existing Personas
- ✅ Personas without image_style continue to work
- ✅ Image generation still works (just less specific)
- ✅ All existing APIs unchanged

### New Personas
- Can include image_style for better consistency
- Optional field - not required
- Enhances quality but not mandatory

## Future Enhancements

### Potential Improvements:
1. **Image Style Presets**: Dropdown with common styles
2. **Template Wizard**: Step-by-step appearance builder
3. **Visual Examples**: Show example images for different styles
4. **AI Suggestions**: Auto-generate image_style from description
5. **Reference Images**: Upload image and extract description
6. **Style Mixing**: Combine multiple preset styles

### Advanced Features:
- **LoRA Integration**: Use specific LoRA models for character
- **IPAdapter**: Reference image for facial consistency
- **Character Cards**: Visual preview of how persona looks
- **Appearance Variations**: Multiple outfits/expressions for same persona

## Related Files

1. **static/index.html** - Added textarea field in persona editor
2. **static/app.js** - Added field loading and saving logic
3. **persona_manager.py** - Already had image_style in Persona class
4. **main.py** - Already uses image_style in image generation

## Troubleshooting

### Image Style Not Applied
- Check persona has image_style set (not empty)
- Verify it's saved (reload persona and check field)
- Check logs for prompt construction

### Images Don't Match Description
- Be more specific in description
- Check enhanced negative prompts aren't conflicting
- Verify SDXL workflow is active
- Try different wording or add more details

### Field Not Showing
- Clear browser cache (version updated to v=11)
- Refresh page (Ctrl+F5)
- Check browser console for errors

## Conclusion

The Visual Appearance / Image Style field provides users with fine-grained control over how their personas look in generated images. This feature:

- ✅ Maintains character consistency across generations
- ✅ Improves image quality with detailed descriptions
- ✅ Easy to use with helpful guidance
- ✅ Optional - doesn't break existing functionality
- ✅ Fully integrated with SDXL workflow
- ✅ Works with enhanced negative prompts

**Status**: ✅ COMPLETE - Ready for use after restart
**Version**: v=11
**Impact**: Enhanced persona customization and image consistency
**Breaking Changes**: None - fully backward compatible

Users can now create personas with detailed visual descriptions, ensuring their AI companions look exactly how they envision them! 🎨👤
