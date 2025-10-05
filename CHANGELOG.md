# Changelog

All notable changes to Unicorn AI will be documented in this file.

## [0.4.0] - 2025-10-05

### Phase 4: Voice Messages ✅

#### Added
- **Voice message support** via Microsoft Edge TTS
- New `tts_service.py` module for text-to-speech generation
- `/generate-voice` API endpoint for voice generation
- `/voice` command in Telegram bot to toggle voice mode
- User preference storage for voice mode (per-user basis)
- Automatic text cleaning (removes image tags) for voice
- `TTS_VOICE` configuration option in .env
- Multiple voice options (Aria, Ava, Jenny, Sonia, etc.)
- Voice message fallback to text on generation failure
- Documentation: `docs/PHASE_4_VOICE.md`

#### Changed
- Updated Telegram bot welcome message to mention voice feature
- Updated README to reflect Phase 4 completion
- Enhanced error handling for voice generation

#### Technical
- Added dependencies: `edge-tts`, `pydub`
- Voice messages stored in `outputs/voice_messages/`
- MP3 format output (compatible with Telegram)
- Generation time: ~0.5-2 seconds per message

---

## [0.3.0] - 2025-10-05

### Phase 3: Image Generation (Architecture) ⚠️

#### Added
- **Image generation architecture** with provider abstraction
- `providers/` module with base provider pattern
- ComfyUI provider for local image generation
- Replicate provider for cloud API (alternative)
- `/generate-image` API endpoint
- Image detection in chat responses via `[IMAGE: description]` tags
- Telegram bot integration for image sending
- ComfyUI installation scripts
- Model download scripts
- IPAdapter support for character consistency

#### Installation Tools
- `install_comfyui.sh` - Automated ComfyUI installation
- `download_models.sh` - Download AI models (6.7GB)
- `start_comfyui.sh` - Start ComfyUI server
- `start_all_services.sh` - Master startup script

#### Models
- Realistic Vision V5.1 (4GB) - Main checkpoint
- VAE (320MB) - Better image quality
- IPAdapter SD1.5 (43MB) - Character consistency
- CLIP Vision (2.4GB) - For IPAdapter

#### Status
- ⚠️ Architecture complete, needs workflow configuration
- ComfyUI installed and ready
- Models downloaded
- Provider code ready

---

## [0.2.0] - 2025-10-04

### Phase 2: Telegram Bot Interface ✅

#### Added
- **Telegram bot integration** via python-telegram-bot
- `telegram_bot.py` - Full bot implementation
- Commands: `/start`, `/help`, `/status`
- Real-time message handling
- Typing indicators
- Error handling and user-friendly messages
- `TELEGRAM_SETUP.md` documentation
- `start_telegram.sh` startup script

#### Changed
- Updated system prompt for shorter, texting-style responses
- Reduced `OLLAMA_MAX_TOKENS` to 150 for brevity
- Added stop sequences to prevent AI from writing both sides
- Enhanced conversation style for mobile messaging

#### Fixed
- AI hallucination (writing both user and AI parts)
- Message length (now appropriate for texting)
- Response formatting

---

## [0.1.0] - 2025-10-03

### Phase 1: Basic Text Chat ✅

#### Added
- **FastAPI backend** with REST API
- Ollama integration with dolphin-mistral model
- `/chat` endpoint for text conversations
- `/health` endpoint for system status
- Configurable persona system (Luna by default)
- Conversation context support
- Loguru logging to file and console
- Environment-based configuration
- CORS middleware for future web UI

#### Project Structure
- `main.py` - FastAPI application
- `config/.env` - Environment configuration
- `outputs/logs/` - Application logs
- `data/` - Data storage directory
- `.gitignore` - Protect sensitive files

#### Documentation
- README.md with quick start guide
- Basic API documentation
- Requirements and hardware specs

#### Configuration
- Persona customization (name, description)
- Ollama model selection
- Temperature and token limits
- API host/port settings

---

## Project Vision

### Completed Phases
- ✅ Phase 1: Text chat with Ollama
- ✅ Phase 2: Telegram bot interface
- ⚠️ Phase 3: Image generation (architecture ready)
- ✅ Phase 4: Voice messages (TTS)

### Upcoming Phases
- 🔜 Phase 5: Vision (see photos you send)
- 🔜 Phase 6: Web UI
- 🔜 Phase 7: Advanced features (calendar, proactive messages, memory)

---

## Notes

### Privacy & Security
- All processing runs locally (except TTS which uses Microsoft's API)
- No telemetry or tracking
- No content filters (uncensored)
- Bot token stored securely in .env (not in git)

### Hardware
- Development: AMD RX 6700 XT 12GB
- Tested on Ubuntu with ROCm 6.0
- Python 3.12.3

### Dependencies
- Ollama: Latest version
- FastAPI: 0.104.1
- python-telegram-bot: 20.7
- edge-tts: 7.2.3
- httpx: 0.25.2
- loguru: 0.7.2

---

## Contributors
- Chris (slackerchris) - Primary developer

## License
MIT License
