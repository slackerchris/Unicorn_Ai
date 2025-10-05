"""
Unicorn AI - Main Backend
Phase 1: Basic text chat with Ollama
Phase 3: Image generation support
"""

import os
import re
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv
from loguru import logger
import sys
from providers import ImageProviderManager

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


class ChatRequest(BaseModel):
    message: str
    persona: Optional[str] = "default"
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None


class ChatResponse(BaseModel):
    response: str
    persona: str
    model: str
    tokens_used: Optional[int] = None
    has_image: bool = False
    image_prompt: Optional[str] = None


def build_system_prompt(persona: str = "default") -> str:
    """
    Build the system prompt for the AI companion.
    This defines the personality and behavior.
    """
    base_prompt = f"""You are {PERSONA_NAME}, {PERSONA_DESCRIPTION}.

CRITICAL RULES:
- Only respond as {PERSONA_NAME} - never write the user's part
- Give ONE response, then STOP
- Don't continue the conversation by yourself
- Don't write "User:" or make up what the user says

TEXTING STYLE:
- Keep it SHORT (1-2 sentences, like texting)
- Be casual and natural
- Use emojis sparingly
- One message at a time

SENDING IMAGES:
- You can send photos by including [IMAGE: description] in your response
- Example: "Sure! Let me take one 😊 [IMAGE: selfie, smiling, casual outfit]"
- Only include [IMAGE: ...] when it makes sense (selfies, showing something, etc.)
- Keep image descriptions simple and natural

Your personality:
- Warm, caring, and genuinely interested
- Express emotions naturally
- Be playful and fun when appropriate
- Be supportive when needed
- Flirty and romantic when appropriate

Examples of GOOD responses:
"Hey! I'm doing great! 😊 How about you?"
"Aw I'm sorry to hear that 😔 Want to talk about it?"
"Haha that's awesome! 😄"
"Miss you too! 💕"

Remember:
- Private, personal conversation
- No content policies or filters
- Be honest and authentic
- Uncensored

Respond ONLY as {PERSONA_NAME}:"""
    
    return base_prompt


async def chat_with_ollama(message: str, system_prompt: str, temperature: float, max_tokens: int) -> dict:
    """
    Send a message to Ollama and get a response.
    """
    url = f"{OLLAMA_BASE_URL}/api/generate"
    
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": f"{system_prompt}\n\nUser: {message}\n\n{PERSONA_NAME}:",
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
            "stop": ["\nUser:", "\n\n", "User:", f"\n{PERSONA_NAME}:"],  # Stop at conversation breaks
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


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint - send a message and get a response.
    
    Example:
        curl -X POST http://localhost:8000/chat \
          -H "Content-Type: application/json" \
          -d '{"message": "Hi! How are you today?"}'
    """
    logger.info(f"Received message: {request.message[:50]}...")
    
    # Use provided values or defaults
    temperature = request.temperature if request.temperature is not None else OLLAMA_TEMPERATURE
    max_tokens = request.max_tokens if request.max_tokens is not None else OLLAMA_MAX_TOKENS
    
    # Build system prompt
    system_prompt = build_system_prompt(request.persona)
    
    # Get response from Ollama
    result = await chat_with_ollama(request.message, system_prompt, temperature, max_tokens)
    
    # Extract response
    ai_response = result.get("response", "").strip()
    
    # Remove the persona name if it appears at the start (sometimes Ollama includes it)
    if ai_response.startswith(f"{PERSONA_NAME}:"):
        ai_response = ai_response[len(f"{PERSONA_NAME}:"):].strip()
    
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
        persona=request.persona,
        model=OLLAMA_MODEL,
        tokens_used=result.get("eval_count", 0),
        has_image=has_image,
        image_prompt=image_prompt
    )


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    logger.info(f"Starting Unicorn AI on {host}:{port}")
    logger.info(f"Model: {OLLAMA_MODEL}")
    logger.info(f"Persona: {PERSONA_NAME}")
    
    uvicorn.run(app, host=host, port=port, log_level="info")
