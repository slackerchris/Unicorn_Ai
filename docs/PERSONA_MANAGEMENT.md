# Persona Management System

## Overview
Unicorn AI now supports multiple AI personalities! You can chat with different characters, each with their own unique personality, speaking style, and voice.

## Default Personas

### 🌙 Luna (Default)
- **Description**: Your friendly, caring AI companion
- **Personality**: Warm, caring, supportive, playful
- **Speaking Style**: Casual and natural, like texting a close friend
- **Voice**: en-US-AriaNeural (expressive, natural)
- **Best For**: Emotional support, casual chatting, companionship

### 💻 Nova
- **Description**: Your tech-savvy AI assistant
- **Personality**: Intelligent, analytical, efficient, helpful
- **Speaking Style**: Clear and concise, gets to the point
- **Voice**: en-US-JennyNeural (professional, warm)
- **Best For**: Technical help, productivity, direct answers

### 🧘 Sage
- **Description**: A wise and thoughtful mentor
- **Personality**: Wise, patient, philosophical, encouraging
- **Speaking Style**: Thoughtful and measured, uses metaphors
- **Voice**: en-GB-SoniaNeural (British, elegant)
- **Best For**: Life advice, deeper conversations, mentorship

### ⚡ Alex
- **Description**: Your energetic and fun-loving friend
- **Personality**: Energetic, enthusiastic, adventurous, positive
- **Speaking Style**: Upbeat with lots of exclamation marks and emojis!
- **Voice**: en-US-AvaNeural (casual, friendly)
- **Best For**: Motivation, fun conversations, energy boost

## Usage

### Via Telegram Bot

**List Available Personas:**
```
/persona
```

**Switch Persona:**
```
/persona nova
/persona sage
/persona alex
/persona luna
```

Once you switch, all your future messages will be answered by that persona!

### Via API

**List All Personas:**
```bash
curl http://localhost:8000/personas
```

**Get Persona Details:**
```bash
curl http://localhost:8000/personas/nova
```

**Activate a Persona:**
```bash
curl -X POST http://localhost:8000/personas/nova/activate
```

**Get Current Persona:**
```bash
curl http://localhost:8000/personas/current/info
```

**Chat with Specific Persona:**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "persona_id": "sage"}'
```

## How It Works

### Persona Attributes
Each persona has:
- **Name & Description**: Who they are
- **Personality Traits**: Key characteristics
- **Speaking Style**: How they communicate
- **System Prompt**: Instructions for the AI model
- **Temperature**: Creativity level (0.7-0.9)
- **Max Tokens**: Response length (150-250)
- **Voice**: TTS voice for voice messages
- **Image Style**: Style for generated images
- **Example Messages**: Sample responses

### System Architecture

1. **PersonaManager** (`persona_manager.py`)
   - Loads personas from `data/personas/*.json`
   - Manages current active persona
   - Provides CRUD operations

2. **Main API** (`main.py`)
   - Integrates persona manager
   - Uses persona's system prompt for chat
   - Switches TTS voice when persona changes
   - Exposes persona management endpoints

3. **Telegram Bot** (`telegram_bot.py`)
   - Stores per-user persona preferences
   - `/persona` command to list/switch
   - Uses user's chosen persona for all chats

### Per-User Personas

In Telegram, each user can have their own preferred persona:
- User A can chat with Luna
- User B can chat with Nova
- Preferences are stored per-user
- Independent of global default

## Creating Custom Personas

### Method 1: Via JSON File

Create a file in `data/personas/mycharacter.json`:

```json
{
  "id": "mycharacter",
  "name": "My Character",
  "description": "A brief description",
  "personality_traits": [
    "Trait 1",
    "Trait 2",
    "Trait 3"
  ],
  "speaking_style": "How they talk",
  "temperature": 0.8,
  "max_tokens": 150,
  "voice": "en-US-AriaNeural",
  "image_style": "style description",
  "example_messages": [
    "Example 1",
    "Example 2"
  ]
}
```

Restart the API server to load it.

### Method 2: Via Python API

```python
from persona_manager import get_persona_manager

manager = get_persona_manager()

persona = manager.create_persona(
    persona_id="robin",
    name="Robin",
    description="Your witty and sarcastic companion",
    personality_traits=[
        "Quick-witted",
        "Sarcastic humor",
        "Intelligent",
        "Playful teasing"
    ],
    speaking_style="Sharp wit with playful sarcasm. Lots of clever comebacks.",
    temperature=0.9,
    voice="en-GB-RyanNeural"
)
```

### Method 3: Copy & Modify Existing

```bash
cd data/personas
cp luna.json mycharacter.json
# Edit mycharacter.json with your changes
```

## Advanced Features

### Export/Import Personas

**Export:**
```python
from persona_manager import get_persona_manager

manager = get_persona_manager()
json_data = manager.export_persona("luna")
# Save to file or share
```

**Import:**
```python
json_data = open("shared_persona.json").read()
persona = manager.import_persona(json_data)
```

### Update Existing Persona

```python
manager = get_persona_manager()
manager.update_persona("luna", 
    temperature=0.9,
    speaking_style="Even more casual!"
)
```

### Delete Persona

```python
manager.delete_persona("mycharacter")
```

Note: Cannot delete current persona or the only persona.

## Voice Mapping

Each persona can have its own voice for TTS:

| Persona | Voice | Characteristics |
|---------|-------|----------------|
| Luna | en-US-AriaNeural | Expressive, natural |
| Nova | en-US-JennyNeural | Professional, warm |
| Sage | en-GB-SoniaNeural | British, elegant |
| Alex | en-US-AvaNeural | Casual, energetic |

When you switch persona in Telegram, the voice automatically changes!

## Image Generation

Each persona can have an `image_style` that affects generated images:

- **Luna**: "photorealistic, young woman, casual style, friendly expression"
- **Nova**: "professional, intelligent look, modern style"
- **Sage**: "mature, wise appearance, serene expression"
- **Alex**: "energetic, casual sporty style, big smile"

This ensures images match the persona's character.

## Tips & Best Practices

### When to Use Which Persona

**Luna** - When you need:
- Emotional support
- Someone to vent to
- Casual friendly chat
- Companionship

**Nova** - When you need:
- Technical help
- Quick answers
- Productivity assistance
- Professional tone

**Sage** - When you need:
- Life advice
- Deep conversations
- Philosophical discussions
- Mentorship

**Alex** - When you need:
- Motivation
- Energy boost
- Fun light-hearted chat
- Positive vibes

### Conversation Tips

1. **Stay consistent** - Chat with one persona per conversation
2. **Match the tone** - Respond in a way that fits their style
3. **Experiment** - Try different personas for different moods
4. **Customize** - Create your own persona that fits your needs

## Technical Details

### File Structure
```
data/personas/
├── luna.json       # Friendly companion
├── nova.json       # Tech assistant
├── sage.json       # Wise mentor
└── alex.json       # Energetic friend
```

### System Prompt Template

Each persona's system prompt includes:
- Character introduction
- Personality traits
- Speaking style guidelines
- Critical rules (don't write both sides, etc.)
- Texting style guidelines
- Image sending instructions

### Temperature & Tokens

- **Temperature** (0.7-0.9): Higher = more creative/random
  - Luna: 0.8 (balanced)
  - Nova: 0.7 (more predictable)
  - Sage: 0.9 (more creative)
  - Alex: 0.9 (very expressive)

- **Max Tokens** (150-250): Response length
  - Luna: 150 (concise)
  - Nova: 200 (detailed)
  - Sage: 250 (thoughtful)
  - Alex: 150 (quick)

## Troubleshooting

**Persona not switching:**
- Check logs: `tail -f outputs/logs/api.log`
- Verify persona exists: `curl http://localhost:8000/personas`
- Restart API server

**Custom persona not loading:**
- Check JSON syntax
- Restart API server
- Check logs for errors

**Voice not changing:**
- Voice changes require persona activation
- Check persona's voice setting
- Restart services if needed

## Future Enhancements

Planned features:
- [ ] Web UI for persona management
- [ ] Persona editor interface
- [ ] Share/import community personas
- [ ] Per-persona conversation history
- [ ] Persona-specific reference images
- [ ] Dynamic persona creation via chat
- [ ] Persona learning/evolution

## API Reference

See API documentation for complete endpoint details:
```bash
# Interactive API docs
http://localhost:8000/docs
```

Key endpoints:
- `GET /personas` - List all personas
- `GET /personas/{id}` - Get persona details
- `POST /personas/{id}/activate` - Set as current
- `GET /personas/current/info` - Get current persona
- `POST /chat` - Chat (with optional persona_id)
