# Thinking Tags Removal Fix

**Date:** October 6, 2025  
**Issue:** Some AI models show their "thinking" process before the actual response

## Problem

Certain AI models (especially reasoning-focused models like DeepSeek, QwQ, or fine-tuned reasoning models) output their internal reasoning process in XML-like tags before providing the actual response. This creates a poor user experience where users see the model's "thoughts" before the answer.

### Example of unwanted output:
```
<thinking>
The user is asking about the weather. I should provide a friendly response 
and maybe suggest what to wear. Let me think about the current season...
</thinking>

Hey! The weather today is sunny and warm! Perfect for a light jacket! ☀️
```

### What users should see:
```
Hey! The weather today is sunny and warm! Perfect for a light jacket! ☀️
```

## Common Thinking Tag Patterns

Different models use different formats:
- `<think>...</think>`
- `<thinking>...</thinking>`
- `<reasoning>...</reasoning>`
- `<thought>...</thought>`

## Solution Implemented

Added automatic filtering in the chat response processing to remove all thinking tags before sending the response to the user.

### Location: `main.py` (Lines 563-575)

```python
# Extract response
ai_response = result.get("response", "").strip()

# Remove the persona name if it appears at the start (sometimes Ollama includes it)
if ai_response.startswith(f"{persona.name}:"):
    ai_response = ai_response[len(f"{persona.name}:"):].strip()

# Remove reasoning/thinking tags that some models output
# Patterns: <think>...</think>, <thinking>...</thinking>, <reasoning>...</reasoning>
ai_response = re.sub(r'<think>.*?</think>', '', ai_response, flags=re.IGNORECASE | re.DOTALL)
ai_response = re.sub(r'<thinking>.*?</thinking>', '', ai_response, flags=re.IGNORECASE | re.DOTALL)
ai_response = re.sub(r'<reasoning>.*?</reasoning>', '', ai_response, flags=re.IGNORECASE | re.DOTALL)
ai_response = re.sub(r'<thought>.*?</thought>', '', ai_response, flags=re.IGNORECASE | re.DOTALL)

# Clean up any extra whitespace left after removing tags
ai_response = re.sub(r'\n\s*\n\s*\n', '\n\n', ai_response).strip()
```

## How It Works

1. **Regex Pattern Matching**: Uses regex to find and remove XML-style thinking tags
2. **Case Insensitive**: Handles both `<Think>` and `<think>` variations
3. **DOTALL Flag**: Removes multi-line thinking blocks
4. **Multiple Patterns**: Covers all common thinking tag variations
5. **Whitespace Cleanup**: Removes extra blank lines left after tag removal

## Benefits

✅ **Cleaner Responses**: Users only see the actual response, not the model's reasoning  
✅ **Works Everywhere**: Applied to both Web UI and Telegram bot (both use the same API endpoint)  
✅ **Universal**: Works with any model that uses these tag patterns  
✅ **Preserves Content**: Only removes thinking tags, keeps all actual response text  
✅ **Automatic**: No configuration needed, works transparently  

## Models That May Use Thinking Tags

### Reasoning Models:
- **DeepSeek-R1** series
- **QwQ** (Qwen with Questions)
- **Marco-o1** 
- Fine-tuned reasoning models based on Llama/Mistral

### Standard Models:
- Most standard chat models (Llama, Mistral, etc.) **don't** use these tags
- Your current personas (Luna, Alex, Nova, Sage) likely won't trigger this unless you switch to a reasoning model

## Testing

To verify the fix is working:

1. **Use a reasoning model** (if available):
   ```bash
   ollama pull deepseek-r1:8b
   ```

2. **Ask a question** that would trigger reasoning:
   ```
   "Explain step by step how to solve: if x + 5 = 12, what is x?"
   ```

3. **Check response**: Should see only the answer, not the step-by-step thinking process

4. **Check logs**: The thinking tags will still appear in server logs but not in user-facing responses

## Technical Details

### Regex Breakdown

```python
r'<think>.*?</think>'
```
- `<think>` - Matches opening tag
- `.*?` - Non-greedy match of any content (including newlines with DOTALL)
- `</think>` - Matches closing tag
- `flags=re.IGNORECASE` - Case insensitive (`<Think>`, `<THINK>`, etc.)
- `flags=re.DOTALL` - `.` matches newlines (multi-line blocks)

### Whitespace Cleanup

```python
r'\n\s*\n\s*\n'
```
- Replaces 3+ newlines (with optional spaces) with just 2 newlines
- Prevents large blank spaces after tag removal

## Where It Applies

✅ **Web UI** - All chat responses  
✅ **Telegram Bot** - All chat responses  
✅ **Voice Messages** - Text-to-speech input is cleaned  
✅ **Image Generation** - Image prompts are cleaned  
✅ **Memory Storage** - Cleaned responses are stored in memory  

## Future Enhancements

If models start using different thinking tag formats, add them to the filter:

```python
# Example: Adding new patterns
ai_response = re.sub(r'<internal>.*?</internal>', '', ai_response, flags=re.IGNORECASE | re.DOTALL)
ai_response = re.sub(r'<scratchpad>.*?</scratchpad>', '', ai_response, flags=re.IGNORECASE | re.DOTALL)
```

## Related Files

- **main.py** - Primary fix location (chat endpoint)
- **telegram_bot.py** - Uses cleaned responses from API
- **static/app.js** - Displays cleaned responses in Web UI

## Notes

- This is a **post-processing filter**, not a model-level change
- Thinking tags are still generated by the model, just not shown to users
- If you want to see the thinking process for debugging, check the server logs
- This doesn't affect token usage (thinking tokens are still counted)

## Performance Impact

- **Minimal**: Regex filtering is very fast (<1ms)
- **No API calls**: Processing happens locally
- **No model changes**: Doesn't affect model behavior or quality

## Debugging

If you still see thinking tags appearing:

1. **Check the pattern**: Model might use a different format
2. **Check logs**: Look at `outputs/logs/webui.log` for raw model output
3. **Add new pattern**: Update the regex patterns in `main.py`
4. **Test manually**: Try the regex in Python console

Example test:
```python
import re
text = "<thinking>Test</thinking>Hello"
cleaned = re.sub(r'<thinking>.*?</thinking>', '', text, flags=re.IGNORECASE | re.DOTALL)
print(cleaned)  # Should print "Hello"
```

## Conclusion

This fix ensures that regardless of which model you use, users will always see clean, polished responses without internal reasoning processes cluttering the conversation. The fix is transparent, automatic, and works across all interfaces (Web UI, Telegram, Voice).
