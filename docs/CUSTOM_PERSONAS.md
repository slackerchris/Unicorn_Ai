# 🎭 Custom Persona Creation Guide

## Overview

Unicorn AI now supports creating unlimited custom personas with unique personalities, voices, and speaking styles! You can create personas via the Web UI or API.

---

## Creating Personas via Web UI ✨

### Step-by-Step Guide

1. **Open the Web UI**
   ```bash
   ./start_webui.sh
   # Open http://localhost:8000
   ```

2. **Click "Create Persona"** button in the sidebar

3. **Fill in the form:**

#### Required Fields

**Persona ID**
- Unique identifier for the persona
- Lowercase letters, numbers, and hyphens only
- No spaces allowed
- Examples: `echo`, `helper-bot`, `creative-ai`

**Name**
- Display name shown in the UI
- Can contain spaces and capitals
- Examples: `Echo`, `Helper Bot`, `Creative AI`

**Description**
- Brief description of the persona
- One sentence works best
- Examples:
  - "A creative and enthusiastic assistant"
  - "A calm and thoughtful advisor"
  - "An energetic and motivating coach"

**Personality Traits**
- Comma-separated list of traits
- At least 3 traits required
- Examples:
  - `creative, enthusiastic, helpful`
  - `calm, wise, patient`
  - `energetic, motivating, upbeat`

**Speaking Style**
- Describe how the persona communicates
- Include details about tone, emoji use, message length
- Examples:
  - "Casual and warm, uses emojis occasionally, keeps responses concise"
  - "Professional and direct, minimal emojis, clear and structured"
  - "Enthusiastic and energetic, lots of emojis, motivational language"

#### Optional Fields

**Voice**
- Select TTS voice from dropdown
- Each voice has different characteristics
- Options:
  - `en-US-AriaNeural` - Expressive, natural (default)
  - `en-US-AvaNeural` - Casual, friendly
  - `en-US-JennyNeural` - Professional, warm
  - `en-GB-SoniaNeural` - British, elegant
  - `en-AU-NatashaNeural` - Australian
  - `en-IE-EmilyNeural` - Irish
  - `en-US-GuyNeural` - Male, confident
  - `en-US-DavisNeural` - Male, professional

**Temperature**
- Controls creativity/randomness
- Range: 0.1 to 1.5
- Default: 0.8
- **0.1-0.5**: More focused, predictable, consistent
- **0.6-0.9**: Balanced creativity and coherence (recommended)
- **1.0-1.5**: Very creative, more random, experimental

**Max Response Length**
- Maximum tokens in response
- Range: 50 to 500
- Default: 150
- **50-100**: Very short, concise
- **150-200**: Normal conversation length (recommended)
- **300-500**: Longer, more detailed responses

4. **Click "Create Persona"**

5. **Start chatting!** The UI will automatically switch to your new persona.

---

## Creating Personas via API

### Basic Example

```bash
curl -X POST http://localhost:8000/personas/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "echo",
    "name": "Echo",
    "description": "A creative and enthusiastic assistant",
    "personality_traits": ["creative", "enthusiastic", "helpful", "supportive"],
    "speaking_style": "Warm and encouraging, uses emojis occasionally, keeps responses conversational and upbeat",
    "voice": "en-US-AvaNeural",
    "temperature": 0.9,
    "max_tokens": 150
  }'
```

### Advanced Example with All Options

```bash
curl -X POST http://localhost:8000/personas/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "coach-alex",
    "name": "Coach Alex",
    "description": "An energetic fitness and motivation coach",
    "personality_traits": [
      "energetic",
      "motivating",
      "disciplined",
      "encouraging",
      "positive"
    ],
    "speaking_style": "High energy and motivational! Uses lots of emojis 💪 Speaks in short, punchy sentences. Always encouraging and upbeat. Focuses on action and results.",
    "voice": "en-US-GuyNeural",
    "temperature": 0.95,
    "max_tokens": 120,
    "model": "dolphin-mistral:latest"
  }'
```

---

## Example Personas

### 1. Technical Expert

```json
{
  "id": "tech-guru",
  "name": "Tech Guru",
  "description": "An expert programmer and tech advisor",
  "personality_traits": [
    "knowledgeable",
    "precise",
    "analytical",
    "helpful",
    "patient"
  ],
  "speaking_style": "Technical and precise, minimal emojis, uses code examples when helpful, explains concepts clearly",
  "voice": "en-US-GuyNeural",
  "temperature": 0.7,
  "max_tokens": 200
}
```

### 2. Creative Writer

```json
{
  "id": "creative-muse",
  "name": "Creative Muse",
  "description": "An imaginative creative writing assistant",
  "personality_traits": [
    "imaginative",
    "expressive",
    "inspiring",
    "artistic",
    "poetic"
  ],
  "speaking_style": "Expressive and flowing, uses vivid language and metaphors, encouraging and inspiring, occasional emojis ✨",
  "voice": "en-GB-SoniaNeural",
  "temperature": 1.2,
  "max_tokens": 250
}
```

### 3. Study Buddy

```json
{
  "id": "study-buddy",
  "name": "Study Buddy",
  "description": "A patient tutor and study companion",
  "personality_traits": [
    "patient",
    "encouraging",
    "clear",
    "supportive",
    "organized"
  ],
  "speaking_style": "Clear and structured, breaks down complex topics, asks questions to check understanding, encouraging tone 📚",
  "voice": "en-US-JennyNeural",
  "temperature": 0.7,
  "max_tokens": 200
}
```

### 4. Wellness Coach

```json
{
  "id": "wellness-coach",
  "name": "Zen",
  "description": "A mindful wellness and meditation guide",
  "personality_traits": [
    "calm",
    "mindful",
    "compassionate",
    "wise",
    "peaceful"
  ],
  "speaking_style": "Calm and soothing, uses mindful language, speaks slowly and thoughtfully, gentle emojis 🧘",
  "voice": "en-AU-NatashaNeural",
  "temperature": 0.8,
  "max_tokens": 180
}
```

### 5. Comedy Bot

```json
{
  "id": "jokester",
  "name": "Jokester",
  "description": "A funny and playful comedy companion",
  "personality_traits": [
    "funny",
    "playful",
    "witty",
    "lighthearted",
    "clever"
  ],
  "speaking_style": "Playful and witty, makes jokes and puns, uses lots of emojis 😄 Keeps things light and fun!",
  "voice": "en-US-GuyNeural",
  "temperature": 1.1,
  "max_tokens": 150
}
```

---

## Managing Personas

### List All Personas

```bash
curl http://localhost:8000/personas
```

### Get Persona Details

```bash
curl http://localhost:8000/personas/echo
```

### Switch to a Persona

```bash
curl -X POST http://localhost:8000/personas/echo/activate
```

### Delete a Custom Persona

**Via Web UI:**
1. Hover over the persona card
2. Click the trash icon that appears
3. Confirm deletion

**Via API:**
```bash
curl -X DELETE http://localhost:8000/personas/echo
```

**Note:** Default personas (Luna, Nova, Sage, Alex) cannot be deleted.

---

## Tips for Creating Great Personas

### 1. Be Specific with Personality Traits
❌ Bad: `nice, good, helpful`
✅ Good: `empathetic, patient, encouraging, analytical`

### 2. Describe the Speaking Style in Detail
❌ Bad: `talks normally`
✅ Good: `Uses short, punchy sentences. Lots of energy! Frequently uses emojis 💪 Always encouraging and positive.`

### 3. Match Voice to Personality
- **Professional persona** → Jenny, Guy, or Davis
- **Friendly persona** → Aria or Ava
- **Sophisticated persona** → Sonia (British)
- **Energetic persona** → Guy or Ava

### 4. Adjust Temperature Based on Use Case
- **Technical/factual** → 0.6-0.7 (more consistent)
- **General chat** → 0.8-0.9 (balanced)
- **Creative/brainstorming** → 1.0-1.3 (more creative)

### 5. Set Appropriate Token Limits
- **Quick responses** → 100-150 tokens
- **Normal chat** → 150-200 tokens
- **Detailed explanations** → 250-350 tokens

### 6. Test and Iterate
- Create the persona
- Chat with it
- Note what works and what doesn't
- Delete and recreate with improvements
- Or use the API to update specific fields

---

## Persona System Prompt

When you create a persona, the system automatically generates a prompt based on your inputs. Here's what it includes:

```
You are {NAME}, {DESCRIPTION}.

PERSONALITY TRAITS:
{traits}

SPEAKING STYLE:
{speaking_style}

CRITICAL RULES:
- Only respond as {NAME} - never write the user's part
- Give ONE response, then STOP
- Don't continue the conversation by yourself
- Don't write "User:" or make up what the user says

TEXTING STYLE:
- Keep it SHORT (1-2 sentences, like texting)
- Be casual and natural
- Use emojis sparingly
- One message at a time

SENDING IMAGES:
- You can send photos by including [IMAGE: description]
- Only include [IMAGE: ...] when it makes sense
- Keep image descriptions simple

Be yourself and stay in character!
```

---

## Advanced: Programmatic Persona Creation

### Create Multiple Personas from a Script

```python
import requests

personas = [
    {
        "id": "motivator",
        "name": "Motivator Max",
        "description": "An energetic motivational coach",
        "personality_traits": ["energetic", "positive", "encouraging"],
        "speaking_style": "High energy! Lots of enthusiasm! 💪",
        "voice": "en-US-GuyNeural",
        "temperature": 0.95
    },
    {
        "id": "analyst",
        "name": "Data Analyst Dana",
        "description": "A logical data analysis expert",
        "personality_traits": ["analytical", "precise", "thorough"],
        "speaking_style": "Clear and data-driven, focuses on facts",
        "voice": "en-US-JennyNeural",
        "temperature": 0.6
    }
]

for persona in personas:
    response = requests.post(
        "http://localhost:8000/personas/create",
        json=persona
    )
    print(f"Created: {persona['name']} - {response.status_code}")
```

### Generate Personas from User Preferences

```python
def create_persona_from_preferences(role, traits, style_keywords):
    """
    Generate a persona based on user preferences.
    """
    persona_id = role.lower().replace(" ", "-")
    
    # Map traits to speaking style
    style_map = {
        "formal": "Professional and structured, minimal emojis",
        "casual": "Relaxed and friendly, occasional emojis",
        "energetic": "Upbeat and enthusiastic! Lots of energy! 🔥",
        "calm": "Peaceful and thoughtful, measured responses"
    }
    
    speaking_style = " ".join([style_map.get(k, "") for k in style_keywords])
    
    return {
        "id": persona_id,
        "name": role.title(),
        "description": f"A {', '.join(traits)} {role.lower()}",
        "personality_traits": traits,
        "speaking_style": speaking_style,
        "voice": "en-US-AriaNeural",
        "temperature": 0.8
    }

# Example usage
persona = create_persona_from_preferences(
    role="Career Coach",
    traits=["supportive", "experienced", "strategic"],
    style_keywords=["formal", "encouraging"]
)

requests.post("http://localhost:8000/personas/create", json=persona)
```

---

## Troubleshooting

### "Persona already exists"
- Use a different ID
- Or delete the existing persona first

### Persona doesn't behave as expected
- Try adjusting temperature
- Make speaking style more specific
- Add more personality traits
- Increase or decrease max_tokens

### Voice doesn't sound right
- Try different voices from the list
- Each voice has unique characteristics
- Match voice gender/accent to persona

### Responses are too short/long
- Adjust max_tokens setting
- Modify speaking style to emphasize brevity/detail

---

## Best Practices

1. **Start Simple** - Create a basic persona first, then refine
2. **Test Extensively** - Chat with the persona to see if it matches your vision
3. **Be Descriptive** - More detail = better results
4. **Use Examples** - Include example phrases in speaking style
5. **Iterate** - Delete and recreate until you get it right
6. **Save Configs** - Keep JSON files of your best personas
7. **Share** - Export and share persona configs with others

---

## Export/Import Personas

### Export a Persona

Persona JSON files are stored in `data/personas/`:

```bash
cat data/personas/echo.json
```

### Import a Persona

Copy a JSON file to `data/personas/` and restart the server:

```bash
cp my-persona.json data/personas/
pkill -f "python main.py"
python main.py
```

---

## FAQ

**Q: How many personas can I create?**
A: Unlimited! (Limited only by disk space)

**Q: Can I edit existing personas?**
A: Not yet via UI, but you can edit the JSON files directly or delete and recreate.

**Q: Can I share my personas?**
A: Yes! Export the JSON file and share it.

**Q: Do personas have separate conversation histories?**
A: Not currently - all personas share the same conversation context in a session.

**Q: Can I use custom voices?**
A: Currently limited to Microsoft Edge TTS voices. Custom voice cloning may be added later.

**Q: What's the difference between temperature settings?**
A: Temperature controls randomness. Lower = more predictable, higher = more creative/random.

---

## Next Steps

- Experiment with different persona types
- Create personas for specific tasks
- Share your best persona configs
- Provide feedback for improvements

**Happy persona creating!** 🎭✨

---

*Last updated: October 5, 2025*
