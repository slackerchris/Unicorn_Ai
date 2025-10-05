"""
Text-to-Speech service using Microsoft Edge TTS
Provides high-quality voice synthesis for Luna's voice messages
"""
import asyncio
import os
from pathlib import Path
import edge_tts
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Voice options - you can change this to customize Luna's voice
# Some good female voices:
# - en-US-AvaNeural (casual, friendly)
# - en-US-JennyNeural (professional, warm)
# - en-US-AriaNeural (expressive, natural)
# - en-GB-SoniaNeural (British, elegant)
DEFAULT_VOICE = "en-US-AriaNeural"

class TTSService:
    """Text-to-Speech service using Microsoft Edge TTS"""
    
    def __init__(self, voice: str = DEFAULT_VOICE, output_dir: str = "outputs/voice_messages"):
        self.voice = voice
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    async def text_to_speech(self, text: str, output_filename: Optional[str] = None) -> str:
        """
        Convert text to speech and save as MP3 file
        
        Args:
            text: The text to convert to speech
            output_filename: Optional custom filename (without path)
            
        Returns:
            Path to the generated audio file
        """
        try:
            # Generate filename if not provided
            if output_filename is None:
                import hashlib
                text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
                output_filename = f"voice_{text_hash}.mp3"
            
            output_path = self.output_dir / output_filename
            
            # Generate speech
            logger.info(f"Generating speech with voice {self.voice}")
            communicate = edge_tts.Communicate(text, self.voice)
            await communicate.save(str(output_path))
            
            logger.info(f"Generated voice message: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"TTS generation failed: {e}")
            raise
    
    def text_to_speech_sync(self, text: str, output_filename: Optional[str] = None) -> str:
        """
        Synchronous wrapper for text_to_speech
        
        Args:
            text: The text to convert to speech
            output_filename: Optional custom filename
            
        Returns:
            Path to the generated audio file
        """
        return asyncio.run(self.text_to_speech(text, output_filename))
    
    @staticmethod
    async def list_voices():
        """List all available voices"""
        voices = await edge_tts.list_voices()
        return voices
    
    @staticmethod
    def list_voices_sync():
        """Synchronous wrapper to list available voices"""
        return asyncio.run(TTSService.list_voices())


# Example usage
if __name__ == "__main__":
    # Test the TTS service
    tts = TTSService()
    
    test_text = "Hey! This is Luna. I'm testing my voice messages. How do I sound?"
    
    print(f"Generating speech with voice: {DEFAULT_VOICE}")
    audio_file = tts.text_to_speech_sync(test_text)
    print(f"✅ Audio generated: {audio_file}")
    
    # List available voices
    print("\n📋 Available female voices (sample):")
    voices = TTSService.list_voices_sync()
    female_voices = [v for v in voices if 'Female' in v.get('Gender', '')][:10]
    for voice in female_voices:
        print(f"  - {voice['ShortName']}: {voice.get('FriendlyName', 'N/A')}")
