# Persona Model Change Fix

## Issue
Users couldn't change the LLM model for personas through the web UI. While the model field was being sent and saved correctly, it wasn't being returned in API responses, making it appear like the change hadn't worked.

## Root Cause
Three API endpoints were missing the `model` field in their response objects:
1. `GET /personas/{persona_id}` - Get single persona
2. `POST /personas/create` - Create new persona  
3. `PUT /personas/{persona_id}` - Update persona

## Changes Made

### File: `main.py`

#### 1. GET /personas/{persona_id} (lines 556-570)
**Added:** `"model": persona.model,` to response dict

```python
return {
    "id": persona.id,
    "name": persona.name,
    "description": persona.description,
    "personality_traits": persona.personality_traits,
    "speaking_style": persona.speaking_style,
    "temperature": persona.temperature,
    "max_tokens": persona.max_tokens,
    "model": persona.model,  # ← ADDED THIS
    "voice": persona.voice,
    "image_style": persona.image_style,
    "reference_image": persona.reference_image,
    "example_messages": persona.example_messages,
    "is_current": (persona.id == persona_manager.current_persona_id)
}
```

#### 2. POST /personas/create (lines 654-668)
**Added:** `"model": persona.model,` to response persona dict

```python
return {
    "success": True,
    "message": f"Created persona: {persona.name}",
    "persona": {
        "id": persona.id,
        "name": persona.name,
        "description": persona.description,
        "personality_traits": persona.personality_traits,
        "speaking_style": persona.speaking_style,
        "voice": persona.voice,
        "model": persona.model,  # ← ADDED THIS
        "temperature": persona.temperature,
        "max_tokens": persona.max_tokens
    }
}
```

#### 3. PUT /personas/{persona_id} (lines 705-719)
**Added:** `"model": persona.model,` to response persona dict

```python
return {
    "success": True,
    "message": f"Updated persona: {persona.name}",
    "persona": {
        "id": persona.id,
        "name": persona.name,
        "description": persona.description,
        "personality_traits": persona.personality_traits,
        "speaking_style": persona.speaking_style,
        "voice": persona.voice,
        "model": persona.model,  # ← ADDED THIS
        "temperature": persona.temperature,
        "max_tokens": persona.max_tokens
    }
}
```

## What Was Already Working
- ✅ Backend: Model field storage in persona files
- ✅ Backend: Model field in create/update request handling
- ✅ Backend: Chat endpoint uses correct model per persona
- ✅ Backend: GET /personas list endpoint includes model
- ✅ Frontend: Model selector populated with available Ollama models
- ✅ Frontend: Model field sent in create/update requests
- ✅ Frontend: Edit persona form pre-fills model field
- ✅ Frontend: Chat messages display model name (🤖 model-name)

## What Was Broken
- ❌ API responses missing model field
- ❌ Frontend couldn't verify model changes
- ❌ Appeared like model wasn't saving (but it was!)

## Testing Performed

### 1. API Level Tests
```bash
# Update Luna's model to mistral-small
curl -X PUT http://localhost:8000/personas/luna \
  -H "Content-Type: application/json" \
  -d '{"id": "luna", "name": "Luna", ..., "model": "mistral-small:latest"}'
# Response now includes: "model": "mistral-small:latest" ✅

# Verify model saved to file
cat data/personas/luna.json | grep model
# "model": "mistral-small:latest" ✅

# Verify model returned on GET
curl http://localhost:8000/personas/luna | grep model
# "model": "mistral-small:latest" ✅

# Test chat uses correct model
curl -X POST http://localhost:8000/chat -d '{"message": "test"}'
# "model": "mistral-small:latest" ✅
```

### 2. UI Level Tests (To Perform)
1. Open persona editor for existing persona
2. Verify current model is displayed in dropdown
3. Change model to different one
4. Save changes
5. Verify success message
6. Open editor again - verify new model is selected
7. Send chat message - verify new model shown in message metadata

## Impact
- **Scope:** All persona create/edit operations
- **Severity:** Medium (feature appeared broken but data was saving)
- **Fix:** Low risk - only adds field to response objects
- **Backwards Compatible:** Yes - adding fields doesn't break existing code

## Files Modified
- `main.py` - 3 response objects updated

## Next Steps
1. Restart Web UI service
2. Test persona model changes through UI
3. Verify model changes persist across sessions
4. Confirm chat uses updated model
