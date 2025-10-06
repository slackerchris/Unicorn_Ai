# Debug Panel for Image Generation

View detailed information about ComfyUI image generation directly in the Web UI!

## 🎯 What It Does

The debug panel shows you exactly what prompts were sent to ComfyUI for the last image generation, helping you:
- **Understand** how your persona's visual description is combined with user requests
- **Troubleshoot** image generation issues
- **Optimize** your prompts and persona descriptions
- **Learn** how prompt weighting works in practice

## 📍 How to Access

1. Open the **Model Manager** (gear icon at bottom)
2. Look for the **Service Control** section at the top
3. Click **"View Debug Info"** button

## 📊 What You'll See

### Generation Status
- ✅ **Success** or ❌ **Failed** indicator
- **Timestamp** of when the image was generated
- **Persona** name that was used
- **Dimensions** (width x height)

### Prompt Details

#### Original Prompt
The user's request exactly as typed:
```
a portrait photo of Luna reading a book in a cozy library
```

#### Full Prompt (Sent to ComfyUI)
The complete prompt including persona details and style:
```
Luna, A thoughtful conversationalist with deep knowledge of philosophy, 
science, and art, a portrait photo of Luna reading a book in a cozy 
library, (photorealistic:1.4), woman in mid-20s, athletic build, long 
flowing dark hair, warm friendly smile, casual modern clothing...
```

#### Negative Prompt
All the things to avoid in the image:
```
ugly, deformed, blurry, low quality, text, watermark, distorted, 
malformed, disfigured, bad anatomy...
```

#### Image Style
The persona's visual appearance description (if set):
```
(photorealistic:1.4), woman in mid-20s, athletic build, long flowing 
dark hair, warm friendly smile, casual modern clothing...
```

#### Error Information
If generation failed, you'll see the error message to help diagnose the issue.

## 🔍 Use Cases

### Debugging Failed Generations
If image generation isn't working:
1. Check debug panel for error message
2. See if prompts are being sent correctly
3. Verify persona visual description is included
4. Share error info if reporting issues

### Optimizing Prompts
Learn from successful generations:
1. See how your words get combined
2. Understand prompt structure
3. Test different persona visual descriptions
4. Experiment with prompt weighting syntax

### Understanding Prompt Weighting
See how weighted elements appear:
- `(photorealistic:1.4)` - emphasis on photorealism
- `(warm smile:1.2)` - subtle emphasis on smiling
- Compare original vs full prompt

## 💡 Tips

### Best Practices
- **Generate First**: Debug panel shows the *last* generation, so create an image first
- **Check Timestamps**: Make sure you're looking at the right generation
- **Copy Prompts**: You can select and copy text from the debug panel
- **Monitor Errors**: If you see repeated errors, restart ComfyUI

### What to Look For
- ✅ **Full prompts are detailed** - Good! Persona descriptions are working
- ❌ **Missing style info** - Check persona editor's "Visual Appearance" field
- ⚠️ **Error messages** - May indicate ComfyUI issues or invalid workflow

### Troubleshooting
- **"No image generation yet"** - Generate an image first
- **"Failed to load"** - API might need restart: `./service.sh restart api`
- **Old timestamp** - Generate a new image to update debug info
- **Empty prompts** - Check persona has visual description set

## 🆚 CLI Tools vs Web Panel

### Web UI Debug Panel (This Feature)
**Best for:**
- ✅ Quick checks during testing
- ✅ Visual, user-friendly display
- ✅ Comparing prompts side-by-side
- ✅ Non-technical users
- ✅ One-click access from web interface

**Limitations:**
- ⚠️ Only shows last generation
- ⚠️ Requires page refresh after restart

### CLI Tools (see QUICK_VIEW_COMFYUI_PROMPTS.md)
**Best for:**
- ✅ Live monitoring (tail -f)
- ✅ Historical searches (grep)
- ✅ Full workflow JSON (debug mode)
- ✅ Advanced troubleshooting
- ✅ System administrators

**Requires:**
- ⚠️ Terminal/SSH access
- ⚠️ Command-line knowledge

## 🔧 Technical Details

### Backend Implementation

**Endpoint**: `GET /comfyui/last-generation`

**Stored Data** (in `_last_image_generation` dict):
```python
{
    "timestamp": 1728234567.89,
    "persona": "Luna",
    "original_prompt": "user's exact request",
    "full_prompt": "complete prompt sent to ComfyUI",
    "negative_prompt": "things to avoid",
    "image_style": "persona visual description",
    "width": 1024,
    "height": 1024,
    "success": True,
    "error": None
}
```

### When Data is Stored
- ✅ Every time image generation starts (chat or direct endpoint)
- ✅ Updated with success/error status when complete
- ✅ Persists until next generation (in-memory, not saved to disk)

### Frontend Implementation
- **Modal Dialog**: Full-screen overlay with scrollable content
- **Styled Sections**: Color-coded boxes for each prompt type
- **Monospace Font**: Code-style display for prompts
- **Copy Support**: Click to select and copy any text
- **Responsive**: Works on desktop and mobile

## 📝 Related Documentation

- **QUICK_VIEW_COMFYUI_PROMPTS.md** - CLI tools for viewing prompts
- **COMFYUI_PROMPT_VIEWING_GUIDE.md** - Complete guide to all viewing methods
- **PROMPT_WEIGHTING_GUIDE.md** - How to use weighted prompts
- **PERSONA_MANAGEMENT.md** - Setting up persona visual descriptions

## 🎨 Example: What You'll See

```
🟢 Success

Time:        October 6, 2025 at 2:30 PM
Persona:     Luna
Dimensions:  1024x1024

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 Original Prompt
portrait of Luna in a library

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Full Prompt (Sent to ComfyUI)
Luna, A thoughtful conversationalist with deep knowledge of 
philosophy, science, and art, portrait of Luna in a library, 
(photorealistic:1.4), woman in mid-20s, athletic build, long 
flowing dark hair, warm friendly smile...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚫 Negative Prompt
ugly, deformed, blurry, low quality, text, watermark...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎨 Image Style
(photorealistic:1.4), woman in mid-20s, athletic build, 
long flowing dark hair, warm friendly smile...
```

---

**Quick Access**: Model Manager → Service Control → "View Debug Info" 🐛
