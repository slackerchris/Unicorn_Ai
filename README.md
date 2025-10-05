# Unicorn AI - Self-Hosted AI Companion

A fully self-hosted, uncensored AI companion that can:
- Have natural text conversations
- Send photos (consistent character)
- Send voice messages (custom voice)
- See and respond to photos you send
- Remember your calendar/schedule
- Send proactive messages

## Current Status: Phase 6 - Web UI 🌐

### Features Implemented
- ✅ Ollama with dolphin-mistral (uncensored text generation)
- ✅ FastAPI backend with REST API
- ✅ **Telegram bot interface - Chat from your phone!**
- ✅ **Web UI - Beautiful browser interface!** 🌐
- ✅ Natural conversations with personality
- ✅ **Image generation support** (architecture ready, needs ComfyUI workflow)
- ✅ **Voice messages** - AI can send voice messages! 🎤
- ✅ **Multiple Personas** - Switch between Luna, Nova, Sage, and Alex! 🎭
- ✅ **Custom Personas** - Create your own personas with unique personalities! ✨
- ✅ Real-time responses

### Roadmap
- [x] Phase 1: Basic text chat ✅
- [x] Phase 2: Telegram bot interface ✅
- [x] Phase 3: Image generation (architecture complete) ⚠️
- [x] Phase 4: Voice synthesis (TTS with Edge) ✅
- [x] Phase 5: Persona management (4 default personas) ✅
- [x] Phase 6: Web UI (browser interface + custom personas) ✅
- [ ] Phase 7: Vision (see photos you send)
- [ ] Phase 8: Advanced features (calendar, proactive messaging)

## Hardware Requirements
- GPU: 12GB+ VRAM (NVIDIA or AMD)
- Storage: 50GB+ for models
- RAM: 16GB+

## Current System
- GPU: AMD RX 6700 XT 12GB
- Python: 3.12.3
- ROCm: Installed

## Quick Start

### Option 1: Web UI (Easiest!) 🌐

```bash
cd /home/chris/Documents/Git/Projects/Unicorn_Ai

# Start the Web UI
./start_webui.sh
```

Then open your browser to: **http://localhost:8000**

**Features:**
- 💬 Chat with AI in a beautiful interface
- 🎭 Switch personas with one click
- ✨ Create custom personas
- 🎤 Toggle voice mode
- ⚙️ Customize settings
- 📱 Mobile responsive

### Option 2: Telegram Bot

See [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) for detailed instructions.

Quick version:
1. Message @BotFather on Telegram
2. Send `/newbot` and follow prompts
3. Copy your bot token
4. Add to `config/.env`: `TELEGRAM_BOT_TOKEN=your_token_here`
5. Run: `./start_telegram.sh`

### Option 3: API Only

```bash
# Start the API server
venv/bin/python main.py

# Test with curl
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

## Creating Custom Personas ✨

### Via Web UI (Easy!)
1. Open http://localhost:8000
2. Click "Create Persona" in the sidebar
3. Fill in the form:
   - **ID**: Unique identifier (e.g., `mybot`)
   - **Name**: Display name (e.g., `Echo`)
   - **Description**: Brief description
   - **Traits**: Comma-separated (e.g., `friendly, creative, helpful`)
   - **Speaking Style**: How they communicate
   - **Voice**: Choose TTS voice
   - **Temperature**: Creativity level (0.1-1.5)
4. Click "Create Persona"
5. Start chatting!

### Via API

```bash
curl -X POST http://localhost:8000/personas/create \
  -H "Content-Type: application/json" \
  -d '{
    "id": "echo",
    "name": "Echo",
    "description": "A creative and helpful assistant",
    "personality_traits": ["creative", "helpful", "enthusiastic"],
    "speaking_style": "Energetic and supportive, uses emojis",
    "voice": "en-US-AvaNeural",
    "temperature": 0.9
  }'
```

**Available Voices:**
- `en-US-AriaNeural` - Expressive (default)
- `en-US-AvaNeural` - Casual
- `en-US-JennyNeural` - Professional
- `en-GB-SoniaNeural` - British
- `en-US-GuyNeural` - Male voice
- `en-US-DavisNeural` - Male voice

**Delete a custom persona:**
```bash
curl -X DELETE http://localhost:8000/personas/echo
```
*(Default personas cannot be deleted)*

## Development Notes
- Development machine: RX 6700 XT
- Production target: RTX A2000 or dual GPU setup
- Everything runs locally - complete privacy
- Uncensored - no content filters

## License
MIT (or your choice)
