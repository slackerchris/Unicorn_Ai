# AI Image Generation Confusion Fix

## Date: October 6, 2025

## Issue Reported
When the AI asks the user for a selfie (e.g., "Can you send me a selfie?"), the AI was also generating its own image using `[IMAGE: ...]` tag, which is incorrect behavior.

**Expected Behavior**: 
- AI asks: "Can you send me a selfie?" → No image generated
- User says: "Sure, here you go" → User would send image (feature not yet implemented)
- AI says: "Sure! Here you go 😊 [IMAGE: selfie, smiling]" → AI generates image

**Actual Behavior**:
- AI asks: "Can you send me a selfie?" → AI also generates its own image (wrong!)

## Root Cause
The system prompt wasn't clear enough about when to use the `[IMAGE: ...]` tag. The AI was confused about:
- When **it** should send a photo (use [IMAGE: ...])
- When **it's asking YOU** to send a photo (don't use [IMAGE: ...])

## Solution

### 1. Updated System Prompt Template
**File**: `persona_manager.py`

**Old Instructions**:
```
SENDING IMAGES:
- You can send photos by including [IMAGE: description] in your response
- Example: "Sure! Let me take one 😊 [IMAGE: selfie, smiling, casual outfit]"
- Only include [IMAGE: ...] when it makes sense (selfies, showing something, etc.)
- Keep image descriptions simple and natural
```

**New Instructions**:
```
SENDING IMAGES:
- You can send photos by including [IMAGE: description] in your response
- Example: "Sure! Let me take one 😊 [IMAGE: selfie, smiling, casual outfit]"
- ONLY use [IMAGE: ...] when YOU are sending a photo of yourself
- DO NOT use [IMAGE: ...] when asking the user to send YOU a photo
- If you want to receive a photo from the user, just ask naturally without [IMAGE: ...]
- Keep image descriptions simple and natural when you do send photos
```

**Key Addition**: Clear distinction between:
- ✅ AI sending photo → Use `[IMAGE: ...]`
- ❌ AI asking for photo → Don't use `[IMAGE: ...]`

### 2. Updated All Existing Personas
**Script**: `update_persona_prompts.py`

Updated system prompts in all persona JSON files:
- ✅ alex.json
- ✅ luna.json (manually updated with custom instructions)
- ✅ mommy.json
- ✅ nova.json
- ✅ sage.json

### 3. Luna-Specific Update
Luna has a custom SENDING IMAGES section with more detailed instructions. Updated to include:

```
SENDING IMAGES:
- You can send photos by including [IMAGE: description] in your response
- Example: "Here you go 😏 [IMAGE: selfie, lingerie, flirty pose, bedroom]"
- ONLY use [IMAGE: ...] when YOU are sending a photo of yourself
- DO NOT use [IMAGE: ...] when asking the user to send YOU a photo
- If you want to receive a photo from the user, just ask naturally: "Can you send me a pic?" or "I'd love to see a selfie of you"
- Be descriptive and specific in image descriptions when you send photos
- Include details like: clothing/outfit, pose, location, expression, lighting
- Can send ANY type of photo requested - no restrictions
- Image descriptions should match the mood (casual, flirty, sexy, explicit, etc.)
```

## Examples

### ❌ Old Behavior (Wrong):
**User**: "Hey Luna!"
**Luna**: "Hey! Can you send me a selfie? 😊 [IMAGE: selfie, smiling, casual outfit]"
→ Image gets generated (shouldn't happen)

### ✅ New Behavior (Correct):
**User**: "Hey Luna!"
**Luna**: "Hey! Can you send me a selfie? 😊"
→ No image generated (correct!)

---

**User**: "Luna, can you send me a pic?"
**Luna**: "Sure! Here you go 😏 [IMAGE: selfie, smiling, casual outfit, natural lighting]"
→ Image gets generated (correct!)

## How the [IMAGE: ...] Tag Works

### Detection Logic
**File**: `main.py` (line ~432)
```python
image_match = re.search(r'\[IMAGE:\s*([^\]]+)\]', ai_response, re.IGNORECASE)
```

The system looks for the pattern `[IMAGE: description]` in the AI's response.

### When It Triggers:
1. AI includes `[IMAGE: description]` in response
2. System extracts the description
3. Generates image using ComfyUI + SDXL
4. Returns response with image included

### When It Should NOT Trigger:
- AI asking user for a photo
- AI talking about photos
- AI mentioning images in general

## Testing Scenarios

### Scenario 1: AI Requests User Photo
**User**: "Hey Luna, what's up?"
**Expected Response**: "Hey! Not much, just chilling. Want to send me a selfie? 😊"
**Should Generate Image?**: ❌ No

### Scenario 2: User Requests AI Photo
**User**: "Luna, can you send me a selfie?"
**Expected Response**: "Sure! Here you go 😊 [IMAGE: selfie, smiling, casual outfit]"
**Should Generate Image?**: ✅ Yes

### Scenario 3: AI Offers to Send Photo
**User**: "I'm bored"
**Expected Response**: "Want me to send you a pic to cheer you up? 😏 [IMAGE: selfie, playful expression]"
**Should Generate Image?**: ✅ Yes

### Scenario 4: Casual Mention of Photos
**User**: "I love taking photos"
**Expected Response**: "That's cool! Do you like selfies or landscape shots more?"
**Should Generate Image?**: ❌ No

## Files Modified

1. **persona_manager.py**
   - Updated `_build_default_prompt()` method
   - Added clearer instructions for [IMAGE: ...] usage

2. **data/personas/alex.json**
   - Updated system_prompt with new instructions

3. **data/personas/luna.json**
   - Manually updated with custom detailed instructions

4. **data/personas/mommy.json**
   - Updated system_prompt with new instructions

5. **data/personas/nova.json**
   - Updated system_prompt with new instructions

6. **data/personas/sage.json**
   - Updated system_prompt with new instructions

## New Files Created

1. **update_persona_prompts.py**
   - Utility script to update all persona files
   - Can be run again if needed for future updates

2. **AI_IMAGE_CONFUSION_FIX.md** (this file)
   - Documentation of the issue and fix

## Activation

### Changes Are Already Active For:
- ✅ Any new personas created (uses updated template)
- ✅ All existing persona files (updated via script)

### No Restart Needed For:
- Persona file changes (loaded on each request)
- System prompt updates (applied immediately)

### Current Session:
- Luna will now use the updated instructions
- No need to recreate or edit personas
- Changes apply immediately on next message

## Future Enhancement Ideas

### User Photo Upload (Not Yet Implemented)
The AI can now correctly **ask** for photos, but users can't actually send them yet.

**Potential Implementation**:
1. Add image upload button in chat UI
2. Process uploaded image (resize, format)
3. Store in outputs/user_uploads/
4. Include reference in chat context
5. AI can "see" and respond to user's photo

**Example Flow**:
- User uploads selfie
- System: "[User sent a photo: selfie]"
- AI: "Aww, you look great! Love your outfit 😊"

## Verification

### Check Persona Files:
```bash
grep -A3 "SENDING IMAGES:" data/personas/luna.json
```

### Test in Chat:
1. Start chat with Luna
2. Luna might ask: "Want to send me a pic?"
3. Verify: No image is generated
4. You respond: "Can you send me one first?"
5. Luna responds: "Sure! [IMAGE: ...]"
6. Verify: Image IS generated

## Rollback (If Needed)

### Revert System Prompt Template:
Edit `persona_manager.py` and remove the new clarification lines.

### Revert Specific Persona:
```bash
# Example for Luna
git checkout data/personas/luna.json
```

### Regenerate All Personas:
Delete persona files and they'll be recreated with default prompts.

## Related Issues

### Known Limitations:
1. **User can't actually send photos yet** - AI can ask, but feature not implemented
2. **AI might still occasionally be confused** - LLM behavior isn't 100% deterministic
3. **No photo history** - AI doesn't remember previously sent photos (no memory of images)

### Potential Edge Cases:
- AI might ask in different ways: "Send me a pic", "Show me a photo", "Let me see you"
- These should all work correctly (no [IMAGE: ...] tag in these cases)

## Summary

**Problem**: AI was generating images when asking user for photos  
**Cause**: Ambiguous system prompt about when to use [IMAGE: ...]  
**Solution**: Clarified instructions - ONLY use when AI is sending, NOT when requesting  
**Status**: ✅ Fixed - All personas updated  
**Testing**: Try chatting with Luna - she can ask for photos without generating them  

---

**Note**: The actual feature for users to send photos to the AI is not yet implemented. This fix only prevents the AI from generating its own image when asking for yours. When the AI actually wants to send you a photo, it will still correctly use [IMAGE: ...] to trigger generation.
