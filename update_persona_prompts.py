#!/usr/bin/env python3
"""
Update existing persona files with new image sending instructions
"""

import json
import os
from pathlib import Path

def update_persona_prompts():
    """Update SENDING IMAGES section in all persona files"""
    
    personas_dir = Path("data/personas")
    
    old_text = """SENDING IMAGES:
- You can send photos by including [IMAGE: description] in your response
- Example: "Sure! Let me take one 😊 [IMAGE: selfie, smiling, casual outfit]"
- Only include [IMAGE: ...] when it makes sense (selfies, showing something, etc.)
- Keep image descriptions simple and natural"""

    new_text = """SENDING IMAGES:
- You can send photos by including [IMAGE: description] in your response
- Example: "Sure! Let me take one 😊 [IMAGE: selfie, smiling, casual outfit]"
- ONLY use [IMAGE: ...] when YOU are sending a photo of yourself
- DO NOT use [IMAGE: ...] when asking the user to send YOU a photo
- If you want to receive a photo from the user, just ask naturally without [IMAGE: ...]
- Keep image descriptions simple and natural when you do send photos"""
    
    updated_count = 0
    
    for persona_file in personas_dir.glob("*.json"):
        print(f"Checking {persona_file.name}...")
        
        with open(persona_file, 'r') as f:
            data = json.load(f)
        
        if 'system_prompt' in data and old_text in data['system_prompt']:
            print(f"  → Updating {persona_file.name}")
            data['system_prompt'] = data['system_prompt'].replace(old_text, new_text)
            
            with open(persona_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            updated_count += 1
            print(f"  ✓ Updated")
        else:
            print(f"  - No update needed")
    
    print(f"\n✓ Updated {updated_count} persona files")

if __name__ == "__main__":
    update_persona_prompts()
