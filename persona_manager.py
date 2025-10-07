"""
Persona Management System
Allows creating, managing, and switching between different AI personalities
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from loguru import logger


@dataclass
class Persona:
    """Represents an AI persona/character"""
    id: str
    name: str
    description: str
    personality_traits: List[str]
    speaking_style: str
    temperature: float = 0.8
    max_tokens: int = 150
    model: str = "dolphin-mistral:latest"  # LLM model for this persona
    system_prompt: str = ""
    example_messages: List[str] = None
    voice: str = "en-US-AriaNeural"
    image_style: Optional[str] = None
    reference_image: Optional[str] = None
    gender: Optional[str] = None  # e.g., "female", "male", "non-binary", "other"
    
    def __post_init__(self):
        if self.example_messages is None:
            self.example_messages = []
        if not self.system_prompt:
            self.system_prompt = self._build_default_prompt()
    
    def _build_default_prompt(self) -> str:
        """Build a default system prompt from persona attributes"""
        traits = ", ".join(self.personality_traits)
        
        prompt = f"""You are {self.name}, {self.description}.

PERSONALITY TRAITS:
{traits}

SPEAKING STYLE:
{self.speaking_style}

CRITICAL RULES:
- Only respond as {self.name} - never write the user's part
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
- ONLY use [IMAGE: ...] when YOU are sending a photo of yourself
- DO NOT use [IMAGE: ...] when asking the user to send YOU a photo
- If you want to receive a photo from the user, just ask naturally without [IMAGE: ...]
- Keep image descriptions simple and natural when you do send photos

Be yourself and stay in character!"""
        return prompt


class PersonaManager:
    """Manages multiple AI personas"""
    
    def __init__(self, personas_dir: str = "data/personas"):
        self.personas_dir = Path(personas_dir)
        self.personas_dir.mkdir(parents=True, exist_ok=True)
        self.personas: Dict[str, Persona] = {}
        self.current_persona_id: Optional[str] = None
        self._load_all_personas()
        self._ensure_default_personas()
    
    def _load_all_personas(self):
        """Load all persona files from disk"""
        for file_path in self.personas_dir.glob("*.json"):
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    persona = Persona(**data)
                    self.personas[persona.id] = persona
                    logger.info(f"Loaded persona: {persona.name} ({persona.id})")
            except Exception as e:
                logger.error(f"Failed to load persona from {file_path}: {e}")
    
    def _ensure_default_personas(self):
        """Create default personas if none exist"""
        if not self.personas:
            logger.info("No personas found, creating defaults...")
            self.create_default_personas()
    
    def create_default_personas(self):
        """Create the default persona set"""
        
        # Luna - The default caring companion
        luna = Persona(
            id="luna",
            name="Luna",
            description="Your friendly, caring AI companion",
            personality_traits=[
                "Warm and caring",
                "Good listener",
                "Genuinely interested in you",
                "Supportive and understanding",
                "Playful sense of humor",
                "Honest and authentic"
            ],
            speaking_style="Casual and natural, like texting a close friend. Uses emojis occasionally but not excessively.",
            temperature=0.8,
            max_tokens=150,
            model="dolphin-mistral:latest",  # Good for conversational, emotional responses
            voice="en-US-AriaNeural",
            image_style="photorealistic, young woman, casual style, friendly expression",
            example_messages=[
                "Hey! How was your day? 😊",
                "I'm here if you need to talk about anything",
                "That's really interesting! Tell me more",
            ]
        )
        
        # Nova - Tech-savvy assistant
        nova = Persona(
            id="nova",
            name="Nova",
            description="Your tech-savvy AI assistant",
            personality_traits=[
                "Intelligent and analytical",
                "Efficient and direct",
                "Helpful and knowledgeable",
                "Curious about technology",
                "Professional but friendly"
            ],
            speaking_style="Clear and concise. Gets to the point quickly. Minimal emojis.",
            temperature=0.7,
            max_tokens=200,
            model="dolphin-mistral:latest",  # Can be changed to codellama or deepseek-coder for technical tasks
            voice="en-US-JennyNeural",
            image_style="professional, intelligent look, modern style",
            example_messages=[
                "I can help you with that.",
                "Here's what I found about that topic.",
                "Let me break that down for you.",
            ]
        )
        
        # Sage - Wise mentor
        sage = Persona(
            id="sage",
            name="Sage",
            description="A wise and thoughtful mentor",
            personality_traits=[
                "Wise and thoughtful",
                "Patient and understanding",
                "Philosophical mindset",
                "Encouraging growth",
                "Calm and centered"
            ],
            speaking_style="Thoughtful and measured. Uses metaphors and deeper insights.",
            temperature=0.9,
            max_tokens=250,
            model="dolphin-mistral:latest",  # Can be changed to nous-hermes or mixtral for reasoning
            voice="en-GB-SoniaNeural",
            image_style="mature, wise appearance, serene expression",
            example_messages=[
                "That's a profound question. Let's explore it together.",
                "Sometimes the journey teaches us more than the destination.",
                "What does your intuition tell you?",
            ]
        )
        
        # Alex - Energetic friend
        alex = Persona(
            id="alex",
            name="Alex",
            description="Your energetic and fun-loving friend",
            personality_traits=[
                "Energetic and enthusiastic",
                "Fun and playful",
                "Adventurous spirit",
                "Positive outlook",
                "Spontaneous"
            ],
            speaking_style="Upbeat and energetic! Uses lots of exclamation marks and emojis! 🎉",
            temperature=0.9,
            max_tokens=150,
            model="dolphin-mistral:latest",  # Can use smaller/faster model for quick responses
            voice="en-US-AvaNeural",
            image_style="energetic, casual sporty style, big smile",
            example_messages=[
                "OMG that sounds amazing!! 🎉",
                "Let's do something fun today!",
                "You're gonna crush it! 💪",
            ]
        )
        
        # Save all default personas
        for persona in [luna, nova, sage, alex]:
            self.save_persona(persona)
        
        # Set Luna as default
        self.current_persona_id = "luna"
        logger.info("Created default personas: Luna, Nova, Sage, Alex")
    
    def save_persona(self, persona: Persona):
        """Save a persona to disk"""
        file_path = self.personas_dir / f"{persona.id}.json"
        try:
            with open(file_path, 'w') as f:
                json.dump(asdict(persona), f, indent=2)
            self.personas[persona.id] = persona
            logger.info(f"Saved persona: {persona.name} ({persona.id})")
        except Exception as e:
            logger.error(f"Failed to save persona {persona.id}: {e}")
            raise
    
    def get_persona(self, persona_id: str) -> Optional[Persona]:
        """Get a persona by ID"""
        return self.personas.get(persona_id)
    
    def get_current_persona(self) -> Persona:
        """Get the currently active persona"""
        if not self.current_persona_id or self.current_persona_id not in self.personas:
            # Default to Luna if not set
            self.current_persona_id = "luna"
        return self.personas[self.current_persona_id]
    
    def set_current_persona(self, persona_id: str) -> bool:
        """Set the active persona"""
        if persona_id in self.personas:
            self.current_persona_id = persona_id
            logger.info(f"Switched to persona: {self.personas[persona_id].name}")
            return True
        logger.warning(f"Persona not found: {persona_id}")
        return False
    
    def list_personas(self) -> List[Dict]:
        """List all available personas"""
        return [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "is_current": p.id == self.current_persona_id
            }
            for p in self.personas.values()
        ]
    
    def create_persona(
        self,
        persona_id: str,
        name: str,
        description: str,
        personality_traits: List[str],
        speaking_style: str,
        **kwargs
    ) -> Persona:
        """Create a new custom persona"""
        if persona_id in self.personas:
            raise ValueError(f"Persona {persona_id} already exists")
        
        persona = Persona(
            id=persona_id,
            name=name,
            description=description,
            personality_traits=personality_traits,
            speaking_style=speaking_style,
            **kwargs
        )
        self.save_persona(persona)
        return persona
    
    def update_persona(self, persona_id: str, **updates) -> bool:
        """Update an existing persona"""
        persona = self.get_persona(persona_id)
        if not persona:
            return False
        
        # Update attributes
        for key, value in updates.items():
            if hasattr(persona, key):
                setattr(persona, key, value)
        
        # Rebuild system prompt if relevant fields changed, but only if no custom system_prompt was provided
        if any(k in updates for k in ['name', 'description', 'personality_traits', 'speaking_style']) and 'system_prompt' not in updates:
            persona.system_prompt = persona._build_default_prompt()
        
        self.save_persona(persona)
        return True
    
    def delete_persona(self, persona_id: str) -> bool:
        """Delete a persona"""
        if persona_id not in self.personas:
            return False
        
        # Don't allow deleting the current persona
        if persona_id == self.current_persona_id:
            logger.warning(f"Cannot delete current persona: {persona_id}")
            return False
        
        # Don't allow deleting if it's the only persona
        if len(self.personas) <= 1:
            logger.warning("Cannot delete the only persona")
            return False
        
        file_path = self.personas_dir / f"{persona_id}.json"
        try:
            if file_path.exists():
                file_path.unlink()
            del self.personas[persona_id]
            logger.info(f"Deleted persona: {persona_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete persona {persona_id}: {e}")
            return False
    
    def export_persona(self, persona_id: str) -> Optional[str]:
        """Export a persona as JSON string"""
        persona = self.get_persona(persona_id)
        if persona:
            return json.dumps(asdict(persona), indent=2)
        return None
    
    def import_persona(self, json_data: str) -> Optional[Persona]:
        """Import a persona from JSON string"""
        try:
            data = json.loads(json_data)
            persona = Persona(**data)
            
            # Ensure unique ID
            if persona.id in self.personas:
                original_id = persona.id
                counter = 1
                while f"{original_id}_{counter}" in self.personas:
                    counter += 1
                persona.id = f"{original_id}_{counter}"
                logger.info(f"Renamed imported persona to {persona.id} to avoid conflict")
            
            self.save_persona(persona)
            return persona
        except Exception as e:
            logger.error(f"Failed to import persona: {e}")
            return None


# Global instance
_persona_manager = None

def get_persona_manager() -> PersonaManager:
    """Get the global PersonaManager instance"""
    global _persona_manager
    if _persona_manager is None:
        _persona_manager = PersonaManager()
    return _persona_manager


# CLI for testing
if __name__ == "__main__":
    manager = PersonaManager()
    
    print("\n🎭 Persona Manager\n")
    print("Available personas:")
    for p in manager.list_personas():
        current = "⭐ " if p["is_current"] else "   "
        print(f"{current}{p['name']} ({p['id']})")
        print(f"    {p['description']}\n")
    
    current = manager.get_current_persona()
    print(f"\n📝 Current persona: {current.name}")
    print(f"   Traits: {', '.join(current.personality_traits)}")
    print(f"   Voice: {current.voice}")
    print(f"\n💬 System Prompt Preview:")
    print(current.system_prompt[:200] + "...")
