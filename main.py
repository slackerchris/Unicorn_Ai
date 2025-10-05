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
from fastapi.responses import Response, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv
from loguru import logger
import sys
from providers import ImageProviderManager
from tts_service import TTSService
from persona_manager import get_persona_manager, Persona

# Load environment variables
load_dotenv("config/.env")

# Configure logging
logger.remove()
logger.add(sys.stderr, level="INFO")
logger.add("outputs/logs/unicorn_ai.log", rotation="10 MB", retention="7 days", level="DEBUG")

# Initialize FastAPI
app = FastAPI(
    title="Unicorn AI",
    description="Self-hosted AI companion with text, images, and voice",
    version="0.6.0 - Phase 6: Web UI"
)

# Mount static files for Web UI
app.mount("/static", StaticFiles(directory="static"), name="static")

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


class ChatResponse(BaseModel):
    response: str
    persona: str
    model: str
    tokens_used: Optional[int] = None
    has_image: bool = False
    image_prompt: Optional[str] = None


def build_system_prompt(persona: Persona) -> str:
    """
    Build the system prompt for the AI companion using a Persona object.
    """
    return persona.system_prompt


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


async def chat_with_ollama(message: str, persona: Persona, temperature: Optional[float] = None, max_tokens: Optional[int] = None) -> dict:
    """
    Send a message to Ollama and get a response using the specified persona.
    Each persona can use a different LLM model based on their role.
    """
    url = f"{OLLAMA_BASE_URL}/api/generate"
    
    # Use persona settings or defaults
    temp = temperature if temperature is not None else persona.temperature
    tokens = max_tokens if max_tokens is not None else persona.max_tokens
    model = persona.model  # Each persona can use a different LLM!
    
    payload = {
        "model": model,
        "prompt": f"{persona.system_prompt}\n\nUser: {message}\n\n{persona.name}:",
        "stream": False,
        "options": {
            "temperature": temp,
            "num_predict": tokens,
            "stop": ["\nUser:", "\n\n", "User:", f"\n{persona.name}:"],  # Stop at conversation breaks
        }
    }
    
    logger.info(f"Using model '{model}' for persona '{persona.name}'")  # Log which model is being used
    
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
            negative_prompt="ugly, deformed, blurry, low quality",
            width=width,
            height=height
        )
        
        logger.info(f"Image generated successfully for persona: {persona.name}")
        
        return Response(content=image_data, media_type="image/png")
        
    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@app.post("/generate-voice")
async def generate_voice(text: str):
    """
    Generate voice message from text using TTS.
    
    Example:
        curl -X POST "http://localhost:8000/generate-voice?text=Hey%20there!" \
          --output voice.mp3
    """
    logger.info(f"Voice generation requested: {text[:50]}...")
    
    try:
        # Generate voice message
        audio_path = await tts_service.text_to_speech(text)
        
        logger.info(f"Voice generated successfully: {audio_path}")
        
        # Return the audio file
        return FileResponse(
            audio_path,
            media_type="audio/mpeg",
            filename="voice_message.mp3"
        )
        
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
          -d '{"message": "Hi! How are you today?", "persona_id": "luna"}'
    """
    logger.info(f"Received message: {request.message[:50]}...")
    
    # Get the persona to use
    persona = get_persona_for_request(request.persona_id)
    logger.info(f"Using persona: {persona.name} ({persona.id})")
    
    # Get response from Ollama
    result = await chat_with_ollama(
        request.message,
        persona,
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
    image_match = re.search(r'\[IMAGE:\s*([^\]]+)\]', ai_response, re.IGNORECASE)
    
    if image_match:
        has_image = True
        image_prompt = image_match.group(1).strip()
        logger.info(f"Image requested: {image_prompt}")
    
    logger.info(f"Sending response: {ai_response[:50]}...")
    
    return ChatResponse(
        response=ai_response,
        persona=persona.name,
        model=persona.model,
        tokens_used=result.get("eval_count", 0),
        has_image=has_image,
        image_prompt=image_prompt
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
            model=request.model
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
                "temperature": persona.temperature,
                "max_tokens": persona.max_tokens
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to create persona: {e}")
        raise HTTPException(status_code=500, detail="Failed to create persona")


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
