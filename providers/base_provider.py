"""
Image Provider Base Class
All image providers implement this interface
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any


class ImageProvider(ABC):
    """Base class for all image generation providers"""
    
    @abstractmethod
    async def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 512,
        height: int = 512,
        **kwargs
    ) -> bytes:
        """
        Generate an image from a text prompt.
        
        Args:
            prompt: Text description of the image to generate
            negative_prompt: Things to avoid in the image
            width: Image width in pixels
            height: Image height in pixels
            **kwargs: Provider-specific parameters
            
        Returns:
            bytes: Image data (PNG or JPEG)
        """
        pass
    
    @abstractmethod
    async def is_available(self) -> bool:
        """Check if the provider is available and configured"""
        pass
    
    @abstractmethod
    def get_name(self) -> str:
        """Get the provider name"""
        pass
