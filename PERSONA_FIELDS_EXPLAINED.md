# Persona Fields Explained - What Actually Affects the LLM?

**Date:** October 6, 2025

This guide explains which fields in your persona configuration files actually impact how the AI behaves, and which ones are just for display/organization.

---

## Fields That DIRECTLY Affect LLM Behavior ✅

These fields are sent to the LLM and change how it responds:

### 1. **`system_prompt`** 🔥 MOST IMPORTANT
- **Impact:** MAXIMUM - This is THE field that controls behavior
- **What it does:** Sent directly to the LLM as instructions
- **Used in:** Every single chat message
- **Example:**
  ```json
  "system_prompt": "You are Luna, a fun, flirty, and adventurous girlfriend..."
  ```
- **Why it matters:** This is the AI's "personality instruction manual"

### 2. **`model`** 🔥 CRITICAL
- **Impact:** HIGH - Different models = completely different AI
- **What it does:** Selects which LLM model to use
- **Used in:** Every chat (Line 316 in main.py: `model = persona.model`)
- **Example:**
  ```json
  "model": "ollama.com/huihui_ai/qwen2.5-1m-abliterated:7b"
  ```
- **Why it matters:** Each model has different capabilities, knowledge, and personality
- **Note:** Different personas can use different models!

### 3. **`temperature`** 🌡️
- **Impact:** MEDIUM - Controls randomness/creativity
- **What it does:** Sent to Ollama's API options
- **Used in:** Line 314: `temp = temperature if temperature is not None else persona.temperature`
- **Range:** 0.0 (predictable) to 2.0 (creative/chaotic)
- **Examples:**
  - `0.3` - Focused, consistent (good for factual answers)
  - `0.7` - Balanced
  - `0.8` - Creative and varied (good for roleplay)
  - `1.2` - Very creative (can be incoherent)
- **Why it matters:** Higher = more creative but less predictable

### 4. **`max_tokens`** 📏
- **Impact:** MEDIUM - Controls response length
- **What it does:** Limits how long responses can be
- **Used in:** Line 315: `tokens = max_tokens if max_tokens is not None else persona.max_tokens`
- **Sent to:** Ollama as `num_predict`
- **Examples:**
  - `80` - Very short (Alex's quick replies)
  - `150` - Short paragraph
  - `300` - Medium (Luna's default)
  - `500` - Longer responses
- **Why it matters:** Too low = cut off responses, too high = rambling

### 5. **`name`** (Indirectly)
- **Impact:** LOW - Used in prompt formatting
- **What it does:** Added to stop tokens and prompt formatting
- **Used in:** Line 354: `f"{persona.name}:"` and stop tokens
- **Why it matters:** Helps the model know when to stop generating

---

## Fields That DON'T Affect LLM Behavior ❌

These are for display, organization, or other features (not the LLM's text generation):

### 6. **`description`** 📝
- **Where shown:** Web UI persona list, API responses
- **NOT sent to LLM:** Never included in prompts
- **Purpose:** Helps YOU know what the persona is about
- **Example:** `"Friendly and caring AI companion"`

### 7. **`personality_traits`** 🎭
- **Where shown:** Web UI display only
- **NOT sent to LLM:** Not included in prompts (unless you manually add them to `system_prompt`)
- **Purpose:** Visual reference for you
- **Example:** `["empathetic", "caring", "supportive"]`
- **Note:** These do NOTHING unless you write them into the `system_prompt`!

### 8. **`speaking_style`** 💬
- **Where shown:** Web UI display only
- **NOT sent to LLM:** Not included in prompts
- **Purpose:** Visual reference
- **Example:** `"Warm and friendly, like a close friend"`
- **Note:** Write this info into `system_prompt` if you want it to affect behavior!

### 9. **`example_messages`** 💭
- **Where shown:** Web UI display only
- **NOT sent to LLM:** Currently not used in prompts
- **Purpose:** Shows you what kind of responses to expect
- **Could be used:** For few-shot learning (not implemented yet)

### 10. **`id`** 🆔
- **Purpose:** Internal identifier for the persona file
- **Used for:** File naming, API calls, persona switching
- **Example:** `"luna"` (matches filename `luna.json`)

---

## Fields for Other Features (Not Text Generation) 🎨

### 11. **`voice`** 🔊
- **Feature:** Text-to-Speech
- **What it does:** Selects which TTS voice to use
- **Example:** `"en-US-AriaNeural"`
- **Only affects:** Voice messages, not text responses

### 12. **`image_style`** 🖼️
- **Feature:** Image Generation
- **What it does:** Controls how the persona looks in selfies
- **Example:** `"(beautiful young woman:1.4), (blonde hair:1.3)..."`
- **Only affects:** Generated images via ComfyUI

### 13. **`reference_image`** 📸
- **Feature:** InstantID face consistency (if enabled)
- **What it does:** Provides a reference face for image generation
- **Currently:** Not actively used (InstantID not fully integrated)

### 14. **`gender`** ⚧️
- **Feature:** Display/organization
- **What it does:** Shows gender in UI
- **Does NOT:** Affect LLM behavior (unless mentioned in `system_prompt`)

---

## The Real Breakdown

### What Actually Controls AI Behavior:

```
system_prompt (99% of behavior)
    ↓
model (which AI brain to use)
    ↓
temperature (creativity level)
    ↓
max_tokens (response length limit)
```

### What's Just For Show:

```
description, personality_traits, speaking_style, example_messages
↓
These are displayed in the Web UI but NEVER sent to the LLM
```

---

## Common Misconceptions

### ❌ MYTH: "personality_traits controls how the AI acts"
**REALITY:** Those tags are just for display. Write the personality into `system_prompt` instead!

### ❌ MYTH: "speaking_style makes the AI talk that way"
**REALITY:** It's just a label. Put the speaking instructions in `system_prompt`!

### ❌ MYTH: "description affects the AI's behavior"
**REALITY:** Description is only shown to YOU in the UI.

---

## How to Actually Change Behavior

### Want Luna to be more playful?
✅ **Edit the `system_prompt`:**
```json
"system_prompt": "You are Luna, a SUPER playful and mischievous girlfriend..."
```

❌ **Don't just change:**
```json
"personality_traits": ["playful", "mischievous"]  // THIS DOES NOTHING
```

### Want shorter responses?
✅ **Lower `max_tokens`:**
```json
"max_tokens": 100
```

✅ **AND add to `system_prompt`:**
```json
"system_prompt": "...Keep responses SHORT - 1-2 sentences max!"
```

### Want more creative responses?
✅ **Increase `temperature`:**
```json
"temperature": 0.9  // Or even 1.0-1.2 for wild creativity
```

### Want different knowledge/capabilities?
✅ **Change the `model`:**
```json
"model": "dolphin-mistral:latest"  // Different AI = different knowledge
```

---

## Code Reference

Here's where these fields are actually used in `main.py`:

```python
# Line 314-316: The ONLY persona settings sent to LLM
temp = temperature if temperature is not None else persona.temperature
tokens = max_tokens if max_tokens is not None else persona.max_tokens
model = persona.model

# Line 320: Build the system prompt (uses system_prompt)
system_prompt = await build_system_prompt(persona)

# Line 346-358: Send to Ollama
payload = {
    "model": model,              # ← Uses model field
    "prompt": full_prompt,       # ← Built from system_prompt
    "stream": False,
    "options": {
        "temperature": temp,     # ← Uses temperature field
        "num_predict": tokens,   # ← Uses max_tokens field
        "stop": ["\nUser:", "\n\n", "User:", f"\n{persona.name}:"],
    }
}
```

**That's it!** Everything else is just metadata for display purposes.

---

## Quick Reference Table

| Field | Affects LLM? | Where Used | Impact |
|-------|-------------|------------|--------|
| `system_prompt` | ✅ YES | Sent to LLM | 🔥 MAXIMUM |
| `model` | ✅ YES | Ollama API | 🔥 HIGH |
| `temperature` | ✅ YES | Ollama API | 🌡️ MEDIUM |
| `max_tokens` | ✅ YES | Ollama API | 📏 MEDIUM |
| `name` | ✅ PARTIAL | Stop tokens | 📝 LOW |
| `description` | ❌ NO | UI display | - |
| `personality_traits` | ❌ NO | UI display | - |
| `speaking_style` | ❌ NO | UI display | - |
| `example_messages` | ❌ NO | UI display | - |
| `voice` | ❌ NO | TTS only | 🔊 |
| `image_style` | ❌ NO | Images only | 🖼️ |
| `gender` | ❌ NO | UI display | - |

---

## Pro Tips

### 1. Focus on `system_prompt`
This is your main control. Spend time crafting it well!

### 2. Test different `temperature` values
Start at 0.7-0.8, adjust based on results:
- Too boring? Increase temperature
- Too chaotic? Decrease temperature

### 3. Use `max_tokens` wisely
- Chat/texting: 80-150 tokens (short and snappy)
- Conversations: 200-300 tokens (natural length)
- Stories/explanations: 400-600 tokens (detailed)

### 4. Try different models
Each model has a different "personality":
- **Qwen**: Creative, good at roleplay
- **Dolphin**: Uncensored, direct
- **Mistral**: Balanced, good reasoning
- **Llama**: General purpose

### 5. Don't rely on display fields
If you want something to affect behavior, put it in `system_prompt`!

---

## Conclusion

**Bottom line:**
- ✅ Write good `system_prompt` → Controls behavior
- ✅ Pick right `model` → Controls capabilities
- ✅ Tune `temperature` → Controls creativity
- ✅ Set `max_tokens` → Controls length
- ❌ Don't waste time on display fields if you want to change AI behavior!

The display fields (`description`, `personality_traits`, `speaking_style`) are nice for organization, but they're not magic. The LLM only sees what's in `system_prompt` and the technical parameters (`model`, `temperature`, `max_tokens`).
