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
from fastapi.responses import Response, FileResponse
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
    version="0.1.0 - Phase 1"
)

# CORS for future web UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "dolphin-mistral")
OLLAMA_TEMPERATURE = float(os.getenv("OLLAMA_TEMPERATURE", "0.8"))
OLLAMA_MAX_TOKENS = int(os.getenv("OLLAMA_MAX_TOKENS", "150"))  # Reduced for shorter messages
PERSONA_NAME = os.getenv("PERSONA_NAME", "Luna")
PERSONA_DESCRIPTION = os.getenv("PERSONA_DESCRIPTION", "Your friendly, caring AI companion")

# Image generation
image_manager = ImageProviderManager()

# Voice generation (TTS)
tts_voice = os.getenv("TTS_VOICE", "en-US-AriaNeural")
tts_service = TTSService(voice=tts_voice)

# Persona management
persona_manager = get_persona_manager()


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
    voice: str
    is_current: bool = False


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
    """
    url = f"{OLLAMA_BASE_URL}/api/generate"
    
    # Use persona settings or defaults
    temp = temperature if temperature is not None else persona.temperature
    tokens = max_tokens if max_tokens is not None else persona.max_tokens
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": f"{persona.system_prompt}\n\nUser: {message}\n\n{persona.name}:",
        "stream": False,
        "options": {
            "temperature": temp,
            "num_predict": tokens,
            "stop": ["\nUser:", "\n\n", "User:", f"\n{persona.name}:"],  # Stop at conversation breaks
        }
    }
    
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


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Unicorn AI",
        "version": "0.1.0",
        "phase": "1 - Basic Text Chat",
        "model": OLLAMA_MODEL,
        "persona": PERSONA_NAME
    }


@app.get("/health")
async def health_check():
    """Detailed health check including Ollama status"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            ollama_status = "online" if response.status_code == 200 else "error"
    except Exception:
        ollama_status = "offline"
    
    return {
        "api": "online",
        "ollama": ollama_status,
        "model": OLLAMA_MODEL,
        "persona": PERSONA_NAME
    }


@app.post("/generate-image")
async def generate_image(prompt: str, width: int = 512, height: int = 512):
    """
    Generate an image from a text prompt.
    
    Example:
        curl -X POST "http://localhost:8000/generate-image?prompt=beautiful+woman+selfie"
    """
    logger.info(f"Image generation requested: {prompt}")
    
    try:
        # Build character-consistent prompt
        character_prompt = f"{PERSONA_NAME}, {PERSONA_DESCRIPTION}, {prompt}"
        
        # Generate image
        image_data = await image_manager.generate_image(
            prompt=character_prompt,
            negative_prompt="ugly, deformed, blurry, low quality",
            width=width,
            height=height
        )
        
        logger.info("Image generated successfully")
        
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
        model=OLLAMA_MODEL,
        tokens_used=result.get("eval_count", 0),
        has_image=has_image,
        image_prompt=image_prompt
    )


# Persona Management Endpoints

@app.get("/personas", response_model=List[PersonaInfo])
async def list_personas():
    """
    List all available personas.
    
    Example:
        curl http://localhost:8000/personas
    """
    current_persona = persona_manager.get_current_persona()
    personas = []
    
    for persona in persona_manager.personas.values():
        personas.append(PersonaInfo(
            id=persona.id,
            name=persona.name,
            description=persona.description,
            personality_traits=persona.personality_traits,
            speaking_style=persona.speaking_style,
            voice=persona.voice,
            is_current=(persona.id == current_persona.id)
        ))
    
    return personas


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


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    logger.info(f"Starting Unicorn AI on {host}:{port}")
    logger.info(f"Model: {OLLAMA_MODEL}")
    logger.info(f"Persona: {PERSONA_NAME}")
    
    uvicorn.run(app, host=host, port=port, log_level="info")
