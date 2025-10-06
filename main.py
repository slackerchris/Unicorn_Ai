"""
Unicorn AI - Main Backend
Phase 1: Basic text chat with Ollama
Phase 3: Image generation support
Phase 4: Voice messages (TTS)
Phase 5: Persona management
"""

import os
import re
from typing import Optional, List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse, HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv
from loguru import logger
import sys
from providers import ImageProviderManager
from tts_service import TTSService
from coqui_tts_client import coqui_tts_client
from persona_manager import get_persona_manager, Persona
from memory_manager import memory_manager

# Load environment variables
load_dotenv("config/.env")

# Configure logging
logger.remove()
logger.add(sys.stderr, level="INFO")
logger.add("outputs/logs/unicorn_ai.log", rotation="10 MB", retention="7 days", level="DEBUG")

# Global flag for image generation state
import asyncio
_image_generation_in_progress = False
_image_generation_lock = asyncio.Lock()

# Initialize FastAPI
app = FastAPI(
    title="Unicorn AI",
    description="Self-hosted AI companion with text, images, and voice",
    version="0.6.0 - Phase 6: Web UI"
)

# Mount static files for Web UI
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# CORS for Web UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
# Note: Model, temperature, and tokens are now persona-specific
# Each persona can use different settings

# Image generation
image_manager = ImageProviderManager()

# Persona management (must be initialized first)
persona_manager = get_persona_manager()

# Voice generation (TTS) - will be dynamically updated based on active persona
current_persona = persona_manager.get_current_persona()
tts_service = TTSService(voice=current_persona.voice)


class ChatRequest(BaseModel):
    message: str
    persona_id: Optional[str] = None  # Optional persona ID to use
    session_id: Optional[str] = "web_default"  # Session ID for memory
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class PersonaInfo(BaseModel):
    id: str
    name: str
    description: str
    personality_traits: List[str]
    speaking_style: str
    model: str  # LLM model used by this persona
    voice: str
    is_current: bool = False


class CreatePersonaRequest(BaseModel):
    id: str
    name: str
    description: str
    personality_traits: List[str]
    speaking_style: str
    temperature: Optional[float] = 0.8
    max_tokens: Optional[int] = 150
    voice: Optional[str] = "en-US-AriaNeural"
    model: Optional[str] = "dolphin-mistral:latest"
    image_style: Optional[str] = ""


class ChatResponse(BaseModel):
    response: str
    persona: str
    model: str
    tokens_used: Optional[int] = None
    has_image: bool = False
    image_prompt: Optional[str] = None
    image_url: Optional[str] = None


def get_user_profile() -> dict:
    """Load user profile if it exists."""
    import json
    profile_path = "data/user_profile.json"
    
    if os.path.exists(profile_path):
        try:
            with open(profile_path, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}


async def build_system_prompt(persona: Persona) -> str:
    """
    Build the system prompt for the AI companion using a Persona object.
    Includes user profile information if available.
    """
    prompt = persona.system_prompt
    
    # Add user profile context if available
    user_profile = await get_user_profile()
    if user_profile and user_profile.get('name'):
        profile_context = "\n\n--- User Information ---\n"
        
        if user_profile.get('name'):
            profile_context += f"User's name: {user_profile['name']}\n"
        if user_profile.get('preferred_name'):
            profile_context += f"Prefers to be called: {user_profile['preferred_name']}\n"
        if user_profile.get('pronouns'):
            profile_context += f"Pronouns: {user_profile['pronouns']}\n"
        if user_profile.get('interests'):
            profile_context += f"Interests: {', '.join(user_profile['interests'])}\n"
        if user_profile.get('facts'):
            profile_context += f"Important facts: {', '.join(user_profile['facts'])}\n"
        
        prefs = user_profile.get('preferences', {})
        if prefs:
            profile_context += f"Communication style: {prefs.get('formality', 'casual')}"
            if prefs.get('humor'):
                profile_context += ", appreciates humor"
            if prefs.get('emojis'):
                profile_context += ", likes emojis"
            profile_context += "\n"
        
        profile_context += "Remember and use this information naturally in conversation.\n"
        prompt += profile_context
    
    return prompt


def get_persona_for_request(persona_id: Optional[str] = None) -> Persona:
    """
    Get the persona to use for a request.
    Uses specified persona_id or current persona if not specified.
    """
    if persona_id:
        persona = persona_manager.get_persona(persona_id)
        if not persona:
            raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found")
        return persona
    return persona_manager.get_current_persona()


async def chat_with_ollama(message: str, persona: Persona, session_id: str = "default", temperature: Optional[float] = None, max_tokens: Optional[int] = None) -> dict:
    """
    Send a message to Ollama and get a response using the specified persona.
    Each persona can use a different LLM model based on their role.
    Now includes memory context for conversation continuity.
    """
    global _image_generation_in_progress
    
    # Wait if image generation is in progress (with timeout)
    if _image_generation_in_progress:
        logger.info("Waiting for image generation to complete before chat...")
        timeout = 60  # Max 60 seconds wait
        elapsed = 0
        while _image_generation_in_progress and elapsed < timeout:
            await asyncio.sleep(0.5)
            elapsed += 0.5
        
        if elapsed >= timeout:
            logger.warning("Image generation timeout - proceeding with chat anyway")
        else:
            logger.info("Image generation complete, resuming chat")
    
    url = f"{OLLAMA_BASE_URL}/api/generate"
    
    # Use persona settings or defaults
    temp = temperature if temperature is not None else persona.temperature
    tokens = max_tokens if max_tokens is not None else persona.max_tokens
    model = persona.model  # Each persona can use a different LLM!
    
    # Build prompt with user profile context
    system_prompt = await build_system_prompt(persona)
    
    # Get conversation context from memory (if enabled)
    memory_context = memory_manager.build_context(
        session_id=session_id,
        persona_id=persona.id,
        current_message=message,
        max_recent=5,
        max_relevant=3
    )
    
    # Build full prompt with memory context
    if memory_context:
        full_prompt = f"{system_prompt}\n\n{memory_context}\n\nUser: {message}\n\n{persona.name}:"
    else:
        full_prompt = f"{system_prompt}\n\nUser: {message}\n\n{persona.name}:"
    
    payload = {
        "model": model,
        "prompt": full_prompt,
        "stream": False,
        "options": {
            "temperature": temp,
            "num_predict": tokens,
            "stop": ["\nUser:", "\n\n", "User:", f"\n{persona.name}:"],  # Stop at conversation breaks
        }
    }
    
    logger.info(f"Using model '{model}' for persona '{persona.name}' (Memory: {'ON' if memory_manager.is_memory_enabled(session_id) else 'OFF'})")  # Log which model is being used
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            result = response.json()
            
            logger.info(f"Ollama response received: {result.get('done', False)}")
            return result
            
    except httpx.TimeoutException:
        logger.error("Ollama request timed out")
        raise HTTPException(status_code=504, detail="AI model timed out")
    except httpx.HTTPError as e:
        logger.error(f"Ollama HTTP error: {e}")
        raise HTTPException(status_code=500, detail=f"AI model error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@app.get("/api/status")
async def api_status():
    """API status endpoint"""
    current_persona = persona_manager.get_current_persona()
    return {
        "status": "online",
        "service": "Unicorn AI",
        "version": "0.6.0",
        "phase": "6 - Web UI with Custom Personas",
        "current_persona": {
            "id": current_persona.id,
            "name": current_persona.name,
            "model": current_persona.model
        },
        "total_personas": len(persona_manager.personas)
    }


@app.get("/health")
async def health_check():
    """Detailed health check including Ollama status"""
    current_persona = persona_manager.get_current_persona()
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            ollama_status = "online" if response.status_code == 200 else "error"
    except Exception:
        ollama_status = "offline"
    
    return {
        "api": "online",
        "ollama": ollama_status,
        "current_persona": {
            "id": current_persona.id,
            "name": current_persona.name,
            "model": current_persona.model
        }
    }


@app.post("/generate-image")
async def generate_image(prompt: str, width: int = 512, height: int = 512, persona_id: Optional[str] = None):
    """
    Generate an image from a text prompt using current or specified persona's style.
    
    Example:
        curl -X POST "http://localhost:8000/generate-image?prompt=beautiful+woman+selfie"
    """
    logger.info(f"Image generation requested: {prompt}")
    
    # Get persona for character-consistent generation
    persona = get_persona_for_request(persona_id)
    
    try:
        # Build character-consistent prompt using persona details
        character_prompt = f"{persona.name}, {persona.description}, {prompt}"
        if persona.image_style:
            character_prompt += f", {persona.image_style}"
        
        # Generate image
        image_data = await image_manager.generate_image(
            prompt=character_prompt,
            negative_prompt="ugly, deformed, blurry, low quality, distorted, malformed, disfigured, bad anatomy, wrong anatomy, extra limbs, missing limbs, floating limbs, disconnected limbs, mutation, mutated, gross proportions, bad proportions, poorly drawn, cartoon, anime, sketches, worst quality, low resolution, noise, grainy",
            width=width,
            height=height
        )
        
        logger.info(f"Image generated successfully for persona: {persona.name}")
        
        return Response(content=image_data, media_type="image/png")
        
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@app.get("/generate-voice")
async def generate_voice(text: str):
    """
    Generate voice message from text using Coqui TTS service.
    
    Example:
        curl "http://localhost:8000/generate-voice?text=Hey%20there!" \
          --output voice.wav
    """
    logger.info(f"Voice generation requested: {text[:50]}...")
    
    try:
        # Check if TTS service is running
        if not await coqui_tts_client.check_health():
            raise HTTPException(
                status_code=503,
                detail="TTS service is not running. Start it with: ./tts_service_coqui/start_tts_service.sh"
            )
        
        # Generate audio file
        from pathlib import Path
        
        # Use absolute path for TTS service
        output_dir = Path(__file__).parent / "outputs" / "voice_messages"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        output_path = output_dir / f"voice_{hash(text)}.wav"
        
        result = await coqui_tts_client.generate_audio_file(text, str(output_path.absolute()))
        
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
        
        logger.info(f"Voice generated successfully: {output_path}")
        
        # Return the audio file
        return FileResponse(
            output_path,
            media_type="audio/wav",
            filename="voice_message.wav"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Voice generation failed: {str(e)}")


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint - send a message and get a response.
    
    Example:
        curl -X POST http://localhost:8000/chat \
          -H "Content-Type: application/json" \
          -d '{"message": "Hi! How are you today?", "persona_id": "luna", "session_id": "user123"}'
    """
    logger.info(f"Received message: {request.message[:50]}...")
    
    # Get the persona to use
    persona = get_persona_for_request(request.persona_id)
    logger.info(f"Using persona: {persona.name} ({persona.id})")
    
    # Store user message in memory
    memory_manager.add_message(
        session_id=request.session_id,
        persona_id=persona.id,
        role="user",
        content=request.message
    )
    
    # Get response from Ollama (with memory context)
    result = await chat_with_ollama(
        request.message,
        persona,
        request.session_id,
        request.temperature,
        request.max_tokens
    )
    
    # Extract response
    ai_response = result.get("response", "").strip()
    
    # Remove the persona name if it appears at the start (sometimes Ollama includes it)
    if ai_response.startswith(f"{persona.name}:"):
        ai_response = ai_response[len(f"{persona.name}:"):].strip()
    
    # Check if response contains image request
    has_image = False
    image_prompt = None
    image_url = None
    image_match = re.search(r'\[IMAGE:\s*([^\]]+)\]', ai_response, re.IGNORECASE)
    
    if image_match:
        has_image = True
        image_prompt = image_match.group(1).strip()
        logger.info(f"Image requested: {image_prompt}")
        
        # Generate the image
        global _image_generation_in_progress
        
        try:
            # Acquire lock to ensure only one image at a time
            async with _image_generation_lock:
                _image_generation_in_progress = True
                logger.info("Image generation started - Ollama models will be unloaded")
                
                try:
                    # Build character-consistent prompt using persona details
                    character_prompt = f"{persona.name}, {persona.description}, {image_prompt}"
                    if persona.image_style:
                        character_prompt += f", {persona.image_style}"
                    
                    # Generate image (this will unload Ollama internally)
                    image_data = await image_manager.generate_image(
                        prompt=character_prompt,
                        negative_prompt="ugly, deformed, blurry, low quality, text, watermark, distorted, malformed, disfigured, bad anatomy, wrong anatomy, extra limbs, missing limbs, floating limbs, disconnected limbs, mutation, mutated, gross proportions, bad proportions, poorly drawn, cartoon, anime, sketches, worst quality, low resolution, noise, grainy, signature, username, artist name",
                        width=1024,
                        height=1024
                    )
                    
                    # Save image with timestamp
                    import time
                    timestamp = int(time.time())
                    filename = f"{persona.id}_{timestamp}.png"
                    filepath = f"outputs/generated_images/{filename}"
                    
                    with open(filepath, 'wb') as f:
                        f.write(image_data)
                    
                    image_url = f"/outputs/generated_images/{filename}"
                    logger.info(f"Image saved: {filepath}")
                    
                finally:
                    # Always clear flag even if generation fails
                    _image_generation_in_progress = False
                    logger.info("Image generation complete - Ollama will reload on next chat")
            
        except Exception as e:
            logger.error(f"Image generation failed: {e}")
            # Continue without image
    
    # Store AI response in memory
    memory_manager.add_message(
        session_id=request.session_id,
        persona_id=persona.id,
        role="assistant",
        content=ai_response
    )
    
    logger.info(f"Sending response: {ai_response[:50]}...")
    
    return ChatResponse(
        response=ai_response,
        persona=persona.name,
        model=persona.model,
        tokens_used=result.get("eval_count", 0),
        has_image=has_image,
        image_prompt=image_prompt,
        image_url=image_url
    )


# Persona Management Endpoints

@app.get("/personas")
async def list_personas():
    """
    List all available personas.
    
    Example:
        curl http://localhost:8000/personas
    """
    current_persona = persona_manager.get_current_persona()
    personas = []
    
    for persona in persona_manager.personas.values():
        personas.append({
            "id": persona.id,
            "name": persona.name,
            "description": persona.description,
            "personality_traits": persona.personality_traits,
            "speaking_style": persona.speaking_style,
            "model": persona.model,
            "voice": persona.voice,
            "is_current": (persona.id == current_persona.id)
        })
    
    return {
        "personas": personas,
        "current": {
            "id": current_persona.id,
            "name": current_persona.name,
            "description": current_persona.description,
            "personality_traits": current_persona.personality_traits,
            "speaking_style": current_persona.speaking_style,
            "model": current_persona.model,
            "voice": current_persona.voice,
            "is_current": True
        }
    }


@app.get("/personas/{persona_id}")
async def get_persona(persona_id: str):
    """
    Get detailed information about a specific persona.
    
    Example:
        curl http://localhost:8000/personas/luna
    """
    persona = persona_manager.get_persona(persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found")
    
    return {
        "id": persona.id,
        "name": persona.name,
        "description": persona.description,
        "personality_traits": persona.personality_traits,
        "speaking_style": persona.speaking_style,
        "temperature": persona.temperature,
        "max_tokens": persona.max_tokens,
        "model": persona.model,
        "voice": persona.voice,
        "image_style": persona.image_style,
        "reference_image": persona.reference_image,
        "example_messages": persona.example_messages,
        "is_current": (persona.id == persona_manager.current_persona_id)
    }


@app.post("/personas/{persona_id}/activate")
async def activate_persona(persona_id: str):
    """
    Set a persona as the current active persona.
    
    Example:
        curl -X POST http://localhost:8000/personas/nova/activate
    """
    if not persona_manager.set_current_persona(persona_id):
        raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found")
    
    persona = persona_manager.get_current_persona()
    
    # Update TTS voice to match persona
    global tts_service
    tts_service = TTSService(voice=persona.voice)
    
    return {
        "success": True,
        "message": f"Activated persona: {persona.name}",
        "persona": {
            "id": persona.id,
            "name": persona.name,
            "voice": persona.voice
        }
    }


@app.get("/personas/current/info")
async def get_current_persona():
    """
    Get information about the currently active persona.
    
    Example:
        curl http://localhost:8000/personas/current/info
    """
    persona = persona_manager.get_current_persona()
    
    return {
        "id": persona.id,
        "name": persona.name,
        "description": persona.description,
        "personality_traits": persona.personality_traits,
        "voice": persona.voice
    }


@app.post("/personas/create")
async def create_persona_endpoint(request: CreatePersonaRequest):
    """
    Create a new custom persona.
    
    Example:
        curl -X POST http://localhost:8000/personas/create \
          -H "Content-Type: application/json" \
          -d '{
            "id": "custom",
            "name": "Custom",
            "description": "My custom persona",
            "personality_traits": ["friendly", "helpful"],
            "speaking_style": "casual and warm",
            "temperature": 0.8,
            "voice": "en-US-AriaNeural"
          }'
    """
    try:
        persona = persona_manager.create_persona(
            persona_id=request.id,
            name=request.name,
            description=request.description,
            personality_traits=request.personality_traits,
            speaking_style=request.speaking_style,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            voice=request.voice,
            model=request.model,
            image_style=request.image_style
        )
        
        logger.info(f"Created new persona: {persona.name} ({persona.id})")
        
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
                "model": persona.model,
                "temperature": persona.temperature,
                "max_tokens": persona.max_tokens,
                "image_style": persona.image_style
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create persona: {e}")
        raise HTTPException(status_code=500, detail="Failed to create persona")


@app.put("/personas/{persona_id}")
async def update_persona_endpoint(persona_id: str, request: CreatePersonaRequest):
    """
    Update an existing persona.
    
    Example:
        curl -X PUT http://localhost:8000/personas/custom \
          -H "Content-Type: application/json" \
          -d '{"name": "Updated Name", ...}'
    """
    try:
        persona = persona_manager.get_persona(persona_id)
        if not persona:
            raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found")
        
        # Update persona fields
        persona.name = request.name
        persona.description = request.description
        persona.personality_traits = request.personality_traits
        persona.speaking_style = request.speaking_style
        persona.temperature = request.temperature
        persona.max_tokens = request.max_tokens
        persona.voice = request.voice
        if request.model:
            persona.model = request.model
        if request.image_style is not None:
            persona.image_style = request.image_style
        
        # Save updated persona
        persona_manager.save_persona(persona)
        
        logger.info(f"Updated persona: {persona.name} ({persona.id})")
        
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
                "model": persona.model,
                "temperature": persona.temperature,
                "max_tokens": persona.max_tokens,
                "image_style": persona.image_style
            }
        }
    except Exception as e:
        logger.error(f"Failed to update persona: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update persona: {str(e)}")


@app.get("/user/profile")
async def get_user_profile():
    """Get user profile."""
    import json
    profile_path = "data/user_profile.json"
    
    if os.path.exists(profile_path):
        with open(profile_path, 'r') as f:
            return json.load(f)
    else:
        return {
            "name": "",
            "preferred_name": "",
            "pronouns": "",
            "interests": [],
            "preferences": {
                "formality": "casual",
                "humor": True,
                "emojis": True
            },
            "facts": []
        }


@app.post("/user/profile")
async def update_user_profile(profile: dict):
    """Update user profile."""
    import json
    profile_path = "data/user_profile.json"
    
    with open(profile_path, 'w') as f:
        json.dump(profile, f, indent=2)
    
    logger.info(f"Updated user profile: {profile.get('name', 'Unknown')}")
    return {"success": True, "message": "Profile updated"}


# Memory Management Endpoints

@app.get("/memory/status/{session_id}")
async def get_memory_status(session_id: str, persona_id: str = "luna"):
    """Get memory status for a session."""
    stats = memory_manager.get_memory_stats(session_id, persona_id)
    return {
        "enabled": stats["enabled"],
        "recent_messages": stats["recent_messages"],
        "total_stored": stats["total_stored"]
    }


@app.post("/memory/toggle/{session_id}")
async def toggle_memory(session_id: str, enabled: bool):
    """Enable or disable memory for a session."""
    memory_manager.set_memory_enabled(session_id, enabled)
    status = "enabled" if enabled else "disabled"
    logger.info(f"Memory {status} for session {session_id}")
    return {
        "success": True,
        "enabled": enabled,
        "message": f"Memory {status}"
    }


@app.delete("/memory/clear/{session_id}")
async def clear_memory(session_id: str):
    """Clear recent conversation memory for a session."""
    memory_manager.clear_session(session_id)
    return {
        "success": True,
        "message": "Conversation memory cleared"
    }


@app.delete("/personas/{persona_id}")
async def delete_persona_endpoint(persona_id: str):
    """
    Delete a persona.
    
    Example:
        curl -X DELETE http://localhost:8000/personas/custom
    """
    # Prevent deletion of default personas
    if persona_id in ["luna", "nova", "sage", "alex"]:
        raise HTTPException(status_code=400, detail="Cannot delete default personas")
    
    try:
        success = persona_manager.delete_persona(persona_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found")
        
        return {
            "success": True,
            "message": f"Deleted persona: {persona_id}"
        }
    except Exception as e:
        logger.error(f"Failed to delete persona: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete persona")


# ==========================================
# OLLAMA MODEL MANAGEMENT
# ==========================================

@app.get("/ollama/models")
async def get_ollama_models():
    """
    Get list of available Ollama models.
    
    Example:
        curl http://localhost:8000/ollama/models
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:11434/api/tags")
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "models": data.get("models", [])
                }
            else:
                raise HTTPException(status_code=502, detail="Failed to connect to Ollama")
    except Exception as e:
        logger.error(f"Failed to get Ollama models: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ollama/pull")
async def pull_ollama_model(request: dict):
    """
    Pull/download a new Ollama model.
    
    This streams the download progress from Ollama.
    
    Example:
        curl -X POST http://localhost:8000/ollama/pull \
          -H "Content-Type: application/json" \
          -d '{"model": "llama3.2:latest"}'
    """
    try:
        model_name = request.get("model")
        if not model_name:
            raise HTTPException(status_code=400, detail="Model name is required")
        
        logger.info(f"📥 Starting download of model: {model_name}")
        
        # Use streaming to get real-time progress
        async def stream_pull():
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST",
                    "http://localhost:11434/api/pull",
                    json={"name": model_name}
                ) as response:
                    async for line in response.aiter_lines():
                        if line:
                            yield f"data: {line}\n\n"
        
        return StreamingResponse(
            stream_pull(),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        logger.error(f"Failed to pull model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/ollama/models/{model_name:path}")
async def delete_ollama_model(model_name: str):
    """
    Delete an Ollama model.
    
    Example:
        curl -X DELETE http://localhost:8000/ollama/models/llama3.2:latest
    """
    try:
        logger.info(f"🗑️ Deleting model: {model_name}")
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                "http://localhost:11434/api/delete",
                json={"name": model_name}
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Model deleted: {model_name}")
                return {
                    "success": True,
                    "message": f"Model '{model_name}' deleted successfully"
                }
            else:
                raise HTTPException(status_code=502, detail="Failed to delete model from Ollama")
    except Exception as e:
        logger.error(f"Failed to delete model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# HUGGING FACE INTEGRATION
# ==========================================

@app.get("/huggingface/search")
async def search_huggingface_models(query: str = "", limit: int = 20):
    """
    Search Hugging Face for GGUF models.
    
    Example:
        curl "http://localhost:8000/huggingface/search?query=llama&limit=10"
    """
    try:
        import json
        
        # Search Hugging Face API for GGUF models
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Search for models with GGUF in the name or tags
            search_query = f"{query} GGUF" if query else "GGUF"
            
            response = await client.get(
                "https://huggingface.co/api/models",
                params={
                    "search": search_query,
                    "limit": limit,
                    "sort": "downloads",
                    "direction": -1,
                    "filter": "text-generation"
                }
            )
            
            if response.status_code == 200:
                models = response.json()
                
                # Filter and format results
                results = []
                for model in models:
                    # Only include models that likely have GGUF files
                    model_id = model.get("id", "")
                    if "gguf" in model_id.lower() or "GGUF" in model_id:
                        results.append({
                            "id": model_id,
                            "author": model.get("author", ""),
                            "model_name": model_id.split("/")[-1] if "/" in model_id else model_id,
                            "downloads": model.get("downloads", 0),
                            "likes": model.get("likes", 0),
                            "tags": model.get("tags", []),
                            "last_modified": model.get("lastModified", ""),
                            "url": f"https://huggingface.co/{model_id}"
                        })
                
                return {
                    "success": True,
                    "count": len(results),
                    "models": results
                }
            else:
                raise HTTPException(status_code=502, detail="Failed to search Hugging Face")
                
    except Exception as e:
        logger.error(f"Failed to search Hugging Face: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/huggingface/model/{owner}/{repo}/files")
async def get_huggingface_model_files(owner: str, repo: str):
    """
    Get list of GGUF files for a specific Hugging Face model.
    
    Example:
        curl "http://localhost:8000/huggingface/model/TheBloke/Llama-2-7B-Chat-GGUF/files"
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get file tree from Hugging Face API
            response = await client.get(
                f"https://huggingface.co/api/models/{owner}/{repo}/tree/main"
            )
            
            if response.status_code == 200:
                files = response.json()
                
                # Filter for GGUF files
                gguf_files = []
                for file in files:
                    if file.get("type") == "file" and file.get("path", "").endswith(".gguf"):
                        size_gb = file.get("size", 0) / (1024**3)
                        gguf_files.append({
                            "path": file.get("path"),
                            "size": file.get("size", 0),
                            "size_gb": round(size_gb, 2),
                            "download_url": f"https://huggingface.co/{owner}/{repo}/resolve/main/{file.get('path')}"
                        })
                
                # Sort by size (smaller first for easier testing)
                gguf_files.sort(key=lambda x: x["size"])
                
                return {
                    "success": True,
                    "model_id": f"{owner}/{repo}",
                    "count": len(gguf_files),
                    "files": gguf_files
                }
            else:
                raise HTTPException(status_code=404, detail="Model not found on Hugging Face")
                
    except Exception as e:
        logger.error(f"Failed to get Hugging Face model files: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/huggingface/import")
async def import_huggingface_model(request: dict):
    """
    Download a GGUF file from Hugging Face and import it to Ollama.
    
    Request body:
    {
        "download_url": "https://huggingface.co/...",
        "model_name": "my-custom-model",
        "file_name": "model.gguf"
    }
    """
    try:
        download_url = request.get("download_url")
        model_name = request.get("model_name")
        file_name = request.get("file_name")
        
        if not all([download_url, model_name, file_name]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Sanitize model name (lowercase, replace spaces/special chars with hyphens)
        model_name = re.sub(r'[^a-z0-9-]', '-', model_name.lower())
        
        # Create downloads directory
        downloads_dir = "downloads/huggingface"
        os.makedirs(downloads_dir, exist_ok=True)
        
        file_path = os.path.join(downloads_dir, file_name)
        
        # Download the GGUF file
        logger.info(f"Downloading {file_name} from Hugging Face...")
        
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("GET", download_url) as response:
                if response.status_code != 200:
                    raise HTTPException(status_code=502, detail="Failed to download from Hugging Face")
                
                total_size = int(response.headers.get("content-length", 0))
                downloaded = 0
                
                with open(file_path, "wb") as f:
                    async for chunk in response.aiter_bytes(chunk_size=8192):
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Log progress every 100MB
                        if downloaded % (100 * 1024 * 1024) == 0:
                            progress = (downloaded / total_size * 100) if total_size > 0 else 0
                            logger.info(f"Download progress: {progress:.1f}% ({downloaded / (1024**3):.2f} GB)")
        
        logger.info(f"Download complete: {file_path}")
        
        # Create Modelfile
        modelfile_path = os.path.join(downloads_dir, f"{model_name}.Modelfile")
        with open(modelfile_path, "w") as f:
            f.write(f"FROM {os.path.abspath(file_path)}\n")
            f.write("PARAMETER temperature 0.8\n")
            f.write("PARAMETER top_p 0.9\n")
            f.write("PARAMETER top_k 40\n")
        
        logger.info(f"Created Modelfile: {modelfile_path}")
        
        # Import to Ollama using 'ollama create'
        import subprocess
        result = subprocess.run(
            ["ollama", "create", model_name, "-f", modelfile_path],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            logger.info(f"Successfully imported {model_name} to Ollama")
            
            # Clean up downloaded files
            try:
                os.remove(file_path)
                os.remove(modelfile_path)
                logger.info("Cleaned up temporary files")
            except:
                pass
            
            return {
                "success": True,
                "message": f"Successfully imported {model_name}",
                "model_name": model_name
            }
        else:
            error_msg = result.stderr or result.stdout
            logger.error(f"Failed to import to Ollama: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Failed to import to Ollama: {error_msg}")
            
    except Exception as e:
        logger.error(f"Failed to import Hugging Face model: {e}")
        # Clean up partial downloads
        try:
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
        except:
            pass
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/", response_class=HTMLResponse)
async def root():
    """
    Serve the Web UI - Phase 6!
    """
    try:
        with open("static/index.html", "r") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(
            content="<h1>Unicorn AI</h1><p>Web UI not found. Make sure static/index.html exists.</p>",
            status_code=404
        )


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    current_persona = persona_manager.get_current_persona()
    
    logger.info(f"🦄 Starting Unicorn AI on {host}:{port}")
    logger.info(f"📊 Loaded {len(persona_manager.personas)} personas")
    logger.info(f"🎭 Current persona: {current_persona.name} (Model: {current_persona.model})")
    logger.info(f"🌐 Web UI: http://localhost:{port}")
    logger.info(f"📚 API Docs: http://localhost:{port}/docs")
    
    uvicorn.run(app, host=host, port=port, log_level="info")
