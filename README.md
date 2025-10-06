# Unicorn ## Current Status: Phase 6 Complete + New Features! 🚀

### Features Implemented
- ✅ Ollama with multiple models (dolphin-mistral, llama3, etc.)
- ✅ FastAPI backend with REST API
- ✅ **Telegram bot interface - Chat from your phone!**
- ✅ **Web UI - Beautiful browser interface!** 🌐
- ✅ **Memory System** - Hybrid ChromaDB + JSON with semantic search 🧠
- ✅ **User Profile System** - AI knows how to address you properly 👤
- ✅ Natural conversations with personality
- ✅ **ComfyUI Image Generation** - SDXL dual-stage (1024x1024 photorealistic) 🎨
- ✅ **Enhanced Image Quality** - 40+ negative prompt terms, advanced workflow
- ✅ **Prompt Weighting** - Control attention in image generation (e.g., `(eyes:1.5)`)
- ✅ **Voice messages** - Coqui TTS (local, high-quality) 🎤
- ✅ **Per-message audio controls** - Play, pause, seek, volume, download 🔊
- ✅ **Multiple Personas** - Switch between Luna, Nova, Sage, and Alex! 🎭
- ✅ **Custom Personas** - Create your own personas with unique personalities! ✨
- ✅ **Persona Editing** - Modify personas with per-persona LLM selection
- ✅ **Visual Appearance Field** - Describe persona appearance for image generation
- ✅ **Model Manager** - Download/delete Ollama models via Web UI
- ✅ **Service Status** - Real-time health monitoring of all services
- ✅ Real-time responsesAI Companion

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

## Image Generation 🎨

**NEW:** High-quality image generation with SDXL!

### Features:
- 🎨 **SDXL Dual-Stage** - BASE + REFINER for photorealistic quality
- 📐 **1024x1024** - High resolution output
- 🚫 **Enhanced Negative Prompts** - 40+ quality control terms
- ⚖️ **Prompt Weighting** - Control attention (e.g., `(face:1.5), (background:0.8)`)
- 🎭 **Per-Persona Appearance** - Visual description field for consistent character looks
- � **Debug Logging** - See full prompts sent to ComfyUI
- 📊 **Real-time Monitoring** - `./monitor_image_gen.sh` script

### Prompt Weighting:
Use parentheses with numbers to control emphasis:
- `(keyword:1.5)` - 50% more attention
- `(keyword:0.5)` - 50% less attention
- Multiple weights: `(beautiful eyes:1.5), (perfect skin:1.2), (busy background:0.8)`

See [PROMPT_WEIGHTING_GUIDE.md](PROMPT_WEIGHTING_GUIDE.md) for complete guide.

### Quality Improvements:
Our enhanced negative prompts prevent:
- Anatomy errors (extra fingers, limbs, etc.)
- Visual artifacts (blur, grain, noise)
- Unwanted text/watermarks
- Low-quality styles (amateur, low-res, etc.)

See [IMAGE_GENERATION_UPDATE_SUMMARY.md](IMAGE_GENERATION_UPDATE_SUMMARY.md) for details.

## Documentation �📚

### Setup & Getting Started
- [QUICKSTART.md](QUICKSTART.md) - Quick setup guide
- [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) - Detailed setup instructions
- [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) - Telegram bot setup

### Features & Guides
- [MEMORY_SYSTEM.md](MEMORY_SYSTEM.md) - Memory system details
- [TTS_UPGRADE.md](TTS_UPGRADE.md) - Voice TTS system (Coqui)
- [PER_MESSAGE_AUDIO.md](PER_MESSAGE_AUDIO.md) - Audio controls
- [AUDIO_CONTROLS.md](AUDIO_CONTROLS.md) - Audio UI features
- [docs/CUSTOM_PERSONAS.md](docs/CUSTOM_PERSONAS.md) - Persona creation guide

### Image Generation (NEW!)
- [PROMPT_WEIGHTING_GUIDE.md](PROMPT_WEIGHTING_GUIDE.md) - **Complete prompt weighting guide**
- [PROMPT_WEIGHTING_QUICK_REF.md](PROMPT_WEIGHTING_QUICK_REF.md) - Quick reference
- [IMAGE_GENERATION_UPDATE_SUMMARY.md](IMAGE_GENERATION_UPDATE_SUMMARY.md) - All improvements
- [NEGATIVE_PROMPT_ENHANCEMENT.md](NEGATIVE_PROMPT_ENHANCEMENT.md) - Quality improvements
- [SDXL_WORKFLOW_UPDATE.md](SDXL_WORKFLOW_UPDATE.md) - SDXL architecture
- [IMAGE_STYLE_FIELD_FEATURE.md](IMAGE_STYLE_FIELD_FEATURE.md) - Visual appearance field
- [COMFYUI_PROMPT_VIEWING_GUIDE.md](COMFYUI_PROMPT_VIEWING_GUIDE.md) - Debug logging
- [AI_IMAGE_CONFUSION_FIX.md](AI_IMAGE_CONFUSION_FIX.md) - Behavior improvements

### Development & Troubleshooting
- [docs/AMD_GPU_WORKING_FIX.md](docs/AMD_GPU_WORKING_FIX.md) - AMD GPU setup
- [docs/IMAGE_GEN_AMD_FIX.md](docs/IMAGE_GEN_AMD_FIX.md) - AMD image generation
- [CHANGELOG.md](CHANGELOG.md) - Version history
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
