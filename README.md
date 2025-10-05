# Unicorn AI - Self-Hosted AI Companion

A fully self-hosted, uncensored AI companion that can:
- Have natural text conversations
- Send photos (consistent character)
- Send voice messages (custom voice)
- See and respond to photos you send
- Remember your calendar/schedule
- Send proactive messages

## Current Status: Phase 1 - Basic Text Chat

### Features Implemented
- ✅ Ollama with dolphin-mistral (uncensored text generation)
- ✅ FastAPI backend
- ✅ Basic conversation endpoint

### Roadmap
- [ ] Phase 2: Image generation (ComfyUI + IPAdapter)
- [ ] Phase 3: Voice synthesis (Coqui XTTS)
- [ ] Phase 4: Interface (Telegram bot or Web UI)
- [ ] Phase 5: Advanced features (calendar, proactive messaging, vision)

## Hardware Requirements
- GPU: 12GB+ VRAM (NVIDIA or AMD)
- Storage: 50GB+ for models
- RAM: 16GB+

## Current System
- GPU: AMD RX 6700 XT 12GB
- Python: 3.12.3
- ROCm: Installed

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Start the backend
python main.py

# Test with curl
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
