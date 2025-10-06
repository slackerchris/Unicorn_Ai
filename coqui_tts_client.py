"""
TTS Client for Coqui TTS Service
Communicates with the standalone TTS service running on port 5050
"""
import httpx
import base64
from pathlib import Path
from loguru import logger

class CoquiTTSClient:
    """Client for Coqui TTS Service"""
    
    def __init__(self, service_url: str = "http://localhost:5050"):
        self.service_url = service_url
        self.timeout = 30.0  # 30 seconds timeout for TTS generation
    
    async def check_health(self) -> bool:
        """Check if TTS service is running"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.service_url}/health",
                    timeout=5.0
                )
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"TTS service health check failed: {e}")
            return False
    
    async def generate_audio_file(self, text: str, output_path: str) -> dict:
        """
        Generate audio and save to file
        
        Args:
            text: Text to convert to speech
            output_path: Full path where to save audio file
        
        Returns:
            dict with status and path
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.service_url}/generate-file",
                    json={
                        "text": text,
                        "output_path": output_path
                    },
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"Audio generated: {result['path']}")
                    return result
                else:
                    logger.error(f"TTS service error: {response.status_code} - {response.text}")
                    return {"status": "error", "error": response.text}
        
        except Exception as e:
            logger.error(f"Error calling TTS service: {e}")
            return {"status": "error", "error": str(e)}
    
    async def generate_audio_base64(self, text: str) -> dict:
        """
        Generate audio and return as base64
        
        Args:
            text: Text to convert to speech
        
        Returns:
            dict with status and audio_base64
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.service_url}/generate",
                    json={"text": text},
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"Audio generated (base64)")
                    return result
                else:
                    logger.error(f"TTS service error: {response.status_code} - {response.text}")
                    return {"status": "error", "error": response.text}
        
        except Exception as e:
            logger.error(f"Error calling TTS service: {e}")
            return {"status": "error", "error": str(e)}
    
    async def generate_audio_bytes(self, text: str) -> bytes:
        """
        Generate audio and return raw bytes
        
        Args:
            text: Text to convert to speech
        
        Returns:
            Audio data as bytes (or empty bytes on error)
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.service_url}/generate?return_audio=true",
                    json={"text": text},
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    logger.info(f"Audio generated ({len(response.content)} bytes)")
                    return response.content
                else:
                    logger.error(f"TTS service error: {response.status_code}")
                    return b""
        
        except Exception as e:
            logger.error(f"Error calling TTS service: {e}")
            return b""

# Global instance
coqui_tts_client = CoquiTTSClient()
