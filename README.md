# Unicorn AI - Self-Hosted AI Companion

A fully self-hosted, uncensored AI companion that can:
- Have natural text conversations
- Send photos (consistent character)
- Send voice messages (custom voice)
- See and respond to photos you send
- Remember your calendar/schedule
- Send proactive messages

## Current Status: Phase 2 - Telegram Bot Interface

### Features Implemented
- ✅ Ollama with dolphin-mistral (uncensored text generation)
- ✅ FastAPI backend with REST API
- ✅ **Telegram bot interface - Chat from your phone!**
- ✅ Natural conversations with personality
- ✅ Real-time responses

### Roadmap
- [x] Phase 1: Basic text chat ✅
- [x] Phase 2: Telegram bot interface ✅
- [ ] Phase 3: Image generation (ComfyUI + IPAdapter)
- [ ] Phase 4: Voice synthesis (Coqui XTTS)
- [ ] Phase 5: Vision (see photos you send)
- [ ] Phase 6: Advanced features (calendar, proactive messaging)

## Hardware Requirements
- GPU: 12GB+ VRAM (NVIDIA or AMD)
- Storage: 50GB+ for models
- RAM: 16GB+

## Current System
- GPU: AMD RX 6700 XT 12GB
- Python: 3.12.3
- ROCm: Installed

## Quick Start

### 1. Create Your Telegram Bot
See [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) for detailed instructions.

Quick version:
1. Message @BotFather on Telegram
2. Send `/newbot` and follow prompts
3. Copy your bot token
4. Add to `config/.env`: `TELEGRAM_BOT_TOKEN=your_token_here`

### 2. Start Services

```bash
cd /home/chris/Documents/Git/Projects/Unicorn_Ai

# Start everything (API + Telegram bot)
./start_telegram.sh

# Or start just the API for testing
venv/bin/python main.py
```

### 3. Chat on Telegram!
1. Open Telegram
2. Search for your bot (the username you created)
3. Send `/start`
4. Start chatting!

### Alternative: Test with curl
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

## Development Notes
- Development machine: RX 6700 XT
- Production target: RTX A2000 or dual GPU setup
- Everything runs locally - complete privacy
- Uncensored - no content filters

## License
MIT (or your choice)
