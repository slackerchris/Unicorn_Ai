# Unicorn AI - Self-Hosted AI Companion

A fully self-hosted, uncensored AI companion that can:
- Have natural text conversations
- Send photos (consistent character)
- Send voice messages (custom voice)
- See and respond to photos you send
- Remember your calendar/schedule
- Send proactive messages

## Current Status: Phase 6 Complete + Voice Upgrade �

### Features Implemented
- ✅ Ollama with dolphin-mistral (uncensored text generation)
- ✅ FastAPI backend with REST API
- ✅ **Telegram bot interface - Chat from your phone!**
- ✅ **Web UI - Beautiful browser interface!** 🌐
- ✅ **Memory System** - Hybrid ChromaDB + JSON with semantic search 🧠
- ✅ **User Profile System** - AI knows how to address you properly 👤
- ✅ Natural conversations with personality
- ✅ **Image generation support** (architecture ready, needs ComfyUI workflow)
- ✅ **Voice messages** - Coqui TTS (local, high-quality) 🎤
- ✅ **Per-message audio controls** - Play, pause, seek, volume, download �
- ✅ **Multiple Personas** - Switch between Luna, Nova, Sage, and Alex! 🎭
- ✅ **Custom Personas** - Create your own personas with unique personalities! ✨
- ✅ **Persona Editing** - Modify personas with per-persona LLM selection
- ✅ Real-time responses

### Roadmap
- [x] Phase 1: Basic text chat ✅
- [x] Phase 2: Telegram bot interface ✅
- [x] Phase 3: Image generation (architecture complete) ⚠️
- [x] Phase 4: Voice synthesis (upgraded to Coqui TTS) ✅
- [x] Phase 5: Persona management (4 default + custom personas) ✅
- [x] Phase 6: Web UI (browser interface + persona editing) ✅
- [x] **Memory System** (hybrid ChromaDB + semantic search) ✅
- [x] **User Profile System** ✅
- [x] **Per-message audio controls** ✅
- [ ] Phase 7: Vision (see photos you send)
- [ ] Phase 8: Advanced features (calendar, proactive messaging)

## Hardware Requirements
- GPU: 12GB+ VRAM (NVIDIA or AMD)
- Storage: 50GB+ for models
- RAM: 16GB+

## Current System
- GPU: NVIDIA RTX A2000 12GB
- Driver: 570.172.08
- CUDA: 12.8
- Python: 3.12.3 (main app) + 3.11.13 (TTS service)
- System: Linux (Ubuntu-based)

## Quick Start

### Start All Services (Recommended!) 🚀

```bash
# Start everything: TTS service, API backend, Telegram bot
./start_all_services.sh
```

This starts:
1. **TTS Service** (port 5050) - Coqui TTS for voice generation
2. **ComfyUI** (port 8188) - Image generation (if installed)
3. **API Backend** (port 8000) - Main FastAPI server
4. **Telegram Bot** - Chat interface

Then open your browser to: **http://localhost:8000**

**Or from LAN:** http://10.0.0.250:8000

### Web UI Features 🌐

- 💬 Chat with AI in a beautiful interface
- 🎭 Switch personas with one click
- ✨ Create & edit custom personas
- 🎤 Voice mode with per-message audio controls
- 🧠 Memory toggle (turn conversation memory on/off)
- 👤 User profile (tell AI about yourself)
- ⚙️ Customize settings (temperature, model, etc.)
- 🔊 Per-message audio player (play, pause, seek, download)
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

**Delete a custom persona:**
```bash
curl -X DELETE http://localhost:8000/personas/echo
```
*(Default personas cannot be deleted)*

## Voice System 🎤

Voice messages powered by **Coqui TTS** (local, high-quality, offline).

### Features:
- 🎵 **Per-message audio player** - Each AI response has its own controls
- ▶️ **Play/Pause** - Control individual messages
- 🔊 **Volume control** - Adjust per message
- ⏱️ **Seek** - Jump to any position
- ⬇️ **Download** - Save audio files
- 🔄 **Auto-pause** - Only one plays at a time

### TTS Service:
- **Model:** Tacotron2-DDC + HiFiGAN vocoder
- **Quality:** High (22050 Hz, 16-bit)
- **Speed:** 1-2 seconds per sentence
- **Format:** WAV
- **Port:** 5050 (separate Python 3.11 service)

See [TTS_UPGRADE.md](TTS_UPGRADE.md) for details.

## Memory System 🧠

Hybrid memory with ChromaDB vector storage + JSON recent messages.

### Features:
- 🔍 **Semantic search** - Find relevant past conversations
- 📝 **Recent context** - Last 5 messages always included
- 🎛️ **Toggle on/off** - Button in web UI, `/memory` in Telegram
- 💾 **Session-based** - Isolated per user/session
- 🧹 **Clear memory** - Wipe and start fresh

### How it Works:
1. **Store:** Messages saved with embeddings (sentence-transformers)
2. **Retrieve:** Combines recent (5) + relevant (3) messages
3. **Context:** AI gets full context for better responses

See [MEMORY_SYSTEM.md](MEMORY_SYSTEM.md) for details.

## Documentation 📚

- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) - Telegram bot setup
- [MEMORY_SYSTEM.md](MEMORY_SYSTEM.md) - Memory system details
- [TTS_UPGRADE.md](TTS_UPGRADE.md) - Voice TTS system (Coqui)
- [PER_MESSAGE_AUDIO.md](PER_MESSAGE_AUDIO.md) - Audio controls
- [AUDIO_CONTROLS.md](AUDIO_CONTROLS.md) - Audio UI features
- [CUSTOM_PERSONAS.md](docs/CUSTOM_PERSONAS.md) - Persona creation guide
- [PERSONA_MANAGEMENT.md](docs/PERSONA_MANAGEMENT.md) - Persona editing

## Development Notes
- Production machine: NVIDIA RTX A2000 12GB
- Python: 3.12.3 (main) + 3.11.13 (TTS service)
- Everything runs locally - complete privacy
- Uncensored - no content filters
- LAN accessible: http://10.0.0.250:8000

## Recent Updates

### October 5, 2025
- ✅ **TTS Upgrade:** Replaced Edge TTS with Coqui TTS (local, reliable)
- ✅ **Per-message audio controls:** Play, pause, seek, volume, download
- ✅ **Memory system:** ChromaDB vector storage with semantic search
- ✅ **User profile system:** AI knows how to address you
- ✅ **Persona editing:** Modify existing personas, per-persona LLM selection

## License
MIT (or your choice)
