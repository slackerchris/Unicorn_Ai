# Unicorn AI - Complete Setup Guide

## Overview
Unicorn AI is a fully self-hosted, uncensored AI companion that can have text conversations, send photos, and send voice messages - all running on your own hardware for complete privacy.

## System Requirements

### Hardware
- **GPU**: 12GB+ VRAM (NVIDIA or AMD with ROCm)
- **Storage**: 50GB+ for models
- **RAM**: 16GB+ recommended
- **Internet**: Required for initial model downloads and TTS

### Software
- **OS**: Linux (tested on Ubuntu)
- **Python**: 3.12.3
- **Ollama**: Latest version
- **ROCm**: 6.0+ (for AMD GPUs)

## Installation

### 1. Install Ollama
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Download AI Model
```bash
ollama pull dolphin-mistral
```

### 3. Clone the Repository
```bash
git clone https://github.com/slackerchris/Unicorn_Ai.git
cd Unicorn_Ai
```

### 4. Create Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 5. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 6. Configure Environment
```bash
cp config/.env.example config/.env
# Edit config/.env with your settings
```

Required configuration:
- `TELEGRAM_BOT_TOKEN` - Get from @BotFather on Telegram (see TELEGRAM_SETUP.md)
- `TTS_VOICE` - Voice to use for voice messages (default: en-US-AriaNeural)
- `IMAGE_PROVIDER` - Image generation provider (comfyui or replicate)

### 7. Install ComfyUI (Optional - for Image Generation)
```bash
./install_comfyui.sh
```

This will:
- Detect your GPU type
- Clone ComfyUI
- Install PyTorch with appropriate backend
- Create model directories

### 8. Download AI Models (Optional - for Image Generation)
```bash
./download_models.sh
```

Downloads:
- Realistic Vision V5.1 (4GB) - Main checkpoint
- VAE (320MB) - Better quality
- IPAdapter (43MB) - Character consistency
- CLIP Vision (2.4GB) - For IPAdapter

## Running the Services

### Start All Services (Recommended)
```bash
./start_all_services.sh
```

This starts:
1. ComfyUI server (if installed)
2. FastAPI backend
3. Telegram bot

### Start Individual Services

**API Server Only:**
```bash
source venv/bin/activate
python main.py
```

**Telegram Bot Only:**
```bash
source venv/bin/activate
python telegram_bot.py
```

**ComfyUI Only:**
```bash
./start_comfyui.sh
```

### Stop Services
```bash
./stop_services.sh
```

## Features

### ✅ Phase 1: Text Chat
- Natural conversations with Ollama
- Personality: Luna (configurable)
- Uncensored responses
- Context memory within conversation

### ✅ Phase 2: Telegram Bot
- Chat from your phone
- Commands: `/start`, `/help`, `/status`, `/voice`
- Real-time responses
- Private and secure

### ⚠️ Phase 3: Image Generation (Architecture Ready)
- ComfyUI integration
- IPAdapter for character consistency
- Needs workflow configuration

### ✅ Phase 4: Voice Messages
- High-quality TTS (Microsoft Edge)
- Toggle with `/voice` command
- Multiple voice options
- Automatic text cleaning

### 🔜 Phase 5: Vision (Coming Soon)
- See and respond to photos you send
- LLaVA integration planned

### 🔜 Phase 6: Web UI (Coming Soon)
- Alternative to Telegram
- Chat history
- Settings panel

### 🔜 Phase 7: Advanced Features (Coming Soon)
- Calendar integration
- Proactive messaging
- Long-term memory

## Usage

### Telegram Commands

- `/start` - Welcome message and introduction
- `/help` - Show help and tips
- `/status` - Check system status
- `/voice` - Toggle voice messages on/off

### API Endpoints

**Chat:**
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

**Generate Image:**
```bash
curl -X POST "http://localhost:8000/generate-image?prompt=beautiful+woman+selfie" \
  --output image.png
```

**Generate Voice:**
```bash
curl -X POST "http://localhost:8000/generate-voice?text=Hello%20there!" \
  --output voice.mp3
```

**Health Check:**
```bash
curl http://localhost:8000/health
```

## Configuration

### Environment Variables (config/.env)

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_token_here

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=dolphin-mistral
OLLAMA_TEMPERATURE=0.8
OLLAMA_MAX_TOKENS=150

# Persona
PERSONA_NAME=Luna
PERSONA_DESCRIPTION=Your friendly, caring AI companion

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# Image Generation
IMAGE_PROVIDER=comfyui
COMFYUI_URL=http://localhost:8188

# Voice Generation
TTS_VOICE=en-US-AriaNeural
```

### Available TTS Voices

**US Voices:**
- `en-US-AriaNeural` - Expressive, natural (default)
- `en-US-AvaNeural` - Casual, friendly
- `en-US-JennyNeural` - Professional, warm

**UK Voices:**
- `en-GB-SoniaNeural` - British, elegant
- `en-GB-RyanNeural` - British male

**Other English:**
- `en-AU-NatashaNeural` - Australian
- `en-IE-EmilyNeural` - Irish
- `en-CA-ClaraNeural` - Canadian

## Troubleshooting

### Bot Not Responding
```bash
# Check if services are running
ps aux | grep -E "(main.py|telegram_bot.py)"

# Check logs
tail -f outputs/logs/api.log
tail -f outputs/logs/telegram_bot.log

# Restart services
./stop_services.sh
./start_all_services.sh
```

### Ollama Not Working
```bash
# Check Ollama status
ollama list

# Start Ollama service
systemctl start ollama

# Test Ollama
ollama run dolphin-mistral "Hello"
```

### ComfyUI Not Starting
```bash
# Check ComfyUI logs
tail -f comfyui/output/logs/comfyui.log

# Verify models are downloaded
ls -lh comfyui/models/checkpoints/
ls -lh comfyui/models/vae/
```

### Voice Generation Failing
- Requires internet connection (uses Microsoft's TTS API)
- Check API logs for error messages
- Verify `edge-tts` package is installed: `pip list | grep edge-tts`

## Development

### Project Structure
```
Unicorn_Ai/
├── main.py                 # FastAPI backend
├── telegram_bot.py         # Telegram bot interface
├── tts_service.py          # Voice generation service
├── providers/              # Image generation providers
│   ├── __init__.py
│   ├── base_provider.py
│   ├── comfyui_provider.py
│   └── replicate_provider.py
├── config/
│   └── .env               # Configuration (not in git)
├── comfyui/               # ComfyUI installation (not in git)
├── workflows/             # ComfyUI workflows
├── reference_images/      # Character reference images
├── outputs/
│   ├── logs/             # Application logs
│   ├── generated_images/ # Generated images
│   └── voice_messages/   # Generated voice messages
├── docs/                 # Documentation
└── tests/                # Tests (coming soon)
```

### Adding New Features
1. Create feature branch: `git checkout -b feature-name`
2. Implement changes
3. Test thoroughly
4. Update documentation
5. Commit and push
6. Create pull request

## Privacy & Security

- ✅ **Fully self-hosted** - No data leaves your server
- ✅ **No telemetry** - No tracking or analytics
- ✅ **No external APIs** (except TTS when using voice)
- ✅ **Uncensored** - No content filters
- ✅ **Open source** - Audit the code yourself

## Performance

### Ollama (Text Generation)
- Model: dolphin-mistral (7B parameters)
- VRAM: ~5-6GB
- Response time: 2-4 seconds
- Tokens/sec: ~30-50 (AMD RX 6700 XT)

### Voice Generation (TTS)
- Generation time: 0.5-2 seconds
- File size: 20-50KB per message
- No GPU required

### Image Generation (ComfyUI)
- VRAM: ~8-10GB (with IPAdapter)
- Generation time: 10-30 seconds
- Resolution: 512x512 (configurable)

## License
MIT License - See LICENSE file

## Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/slackerchris/Unicorn_Ai/issues
- Documentation: `docs/` directory
- Email: [your email]

## Acknowledgments

- **Ollama** - Local LLM runtime
- **ComfyUI** - Node-based image generation
- **Microsoft Edge TTS** - High-quality text-to-speech
- **python-telegram-bot** - Telegram bot framework
- **FastAPI** - Modern Python web framework
