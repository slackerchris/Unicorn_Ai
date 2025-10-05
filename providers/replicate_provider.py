"""
Replicate Provider - Uses Replicate's cloud API
Free tier: Limited, then pay per generation
Good models: Stable Diffusion, SDXL, etc.
"""

import os
import httpx
from typing import Optional
from loguru import logger
from .base_provider import ImageProvider


class ReplicateProvider(ImageProvider):
    """Image generation using Replicate API"""
    
    def __init__(self):
        self.api_token = os.getenv("REPLICATE_API_TOKEN")
        self.base_url = "https://api.replicate.com/v1"
        # Using SDXL by default - great quality
        self.model = os.getenv(
            "REPLICATE_MODEL",
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b"
        )
    
    async def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 1024,
        height: int = 1024,
        **kwargs
    ) -> bytes:
        """Generate image using Replicate API"""
        
        if not self.api_token:
            raise ValueError("REPLICATE_API_TOKEN not set")
        
        logger.info(f"Generating image with Replicate: {prompt[:50]}...")
        
        # Prepare request
        headers = {
            "Authorization": f"Token {self.api_token}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "version": self.model.split(":")[-1],
            "input": {
                "prompt": prompt,
                "width": width,
                "height": height,
                "num_outputs": 1,
            }
        }
        
        if negative_prompt:
            payload["input"]["negative_prompt"] = negative_prompt
        
        # Start generation
        async with httpx.AsyncClient(timeout=120.0) as client:
            # Create prediction
            response = await client.post(
                f"{self.base_url}/predictions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            prediction = response.json()
            
            prediction_id = prediction["id"]
            logger.info(f"Prediction started: {prediction_id}")
            
            # Poll for completion
            max_attempts = 60  # 60 seconds max
            for attempt in range(max_attempts):
                await asyncio.sleep(1)
                
                response = await client.get(
                    f"{self.base_url}/predictions/{prediction_id}",
                    headers=headers
                )
                response.raise_for_status()
                prediction = response.json()
                
                status = prediction["status"]
                
                if status == "succeeded":
                    # Download the image
                    image_url = prediction["output"][0]
                    logger.info(f"Image generated: {image_url}")
                    
                    img_response = await client.get(image_url)
                    img_response.raise_for_status()
                    return img_response.content
                
                elif status == "failed":
                    error = prediction.get("error", "Unknown error")
                    raise Exception(f"Image generation failed: {error}")
            
            raise TimeoutError("Image generation timed out")
    
    async def is_available(self) -> bool:
        """Check if Replicate API is configured"""
        return bool(self.api_token)
    
    def get_name(self) -> str:
        return "Replicate (Cloud)"


import asyncio  # Import at module level for the provider
