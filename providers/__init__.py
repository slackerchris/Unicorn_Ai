"""
Image Provider Manager
Automatically selects the best available provider
"""

import os
from typing import Optional
from loguru import logger
from .base_provider import ImageProvider
from .replicate_provider import ReplicateProvider
from .comfyui_provider import ComfyUIProvider


class ImageProviderManager:
    """Manages multiple image providers and selects the best one"""
    
    def __init__(self):
        self.providers = []
        self.preferred_provider = os.getenv("IMAGE_PROVIDER", "auto")
        
        # Register available providers
        self.providers.append(ComfyUIProvider())
        self.providers.append(ReplicateProvider())
        
        logger.info(f"Initialized {len(self.providers)} image providers")
    
    async def get_provider(self) -> ImageProvider:
        """Get the best available provider"""
        
        # If a specific provider is requested
        if self.preferred_provider != "auto":
            for provider in self.providers:
                if self.preferred_provider.lower() in provider.get_name().lower():
                    if await provider.is_available():
                        logger.info(f"Using preferred provider: {provider.get_name()}")
                        return provider
                    else:
                        logger.warning(f"Preferred provider {provider.get_name()} not available")
        
        # Auto-select: try each provider in order
        for provider in self.providers:
            if await provider.is_available():
                logger.info(f"Auto-selected provider: {provider.get_name()}")
                return provider
        
        raise Exception("No image providers available. Please configure at least one.")
    
    async def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 512,
        height: int = 512,
        **kwargs
    ) -> bytes:
        """Generate an image using the best available provider"""
        
        provider = await self.get_provider()
        return await provider.generate_image(
            prompt,
            negative_prompt=negative_prompt,
            width=width,
            height=height,
            **kwargs
        )
