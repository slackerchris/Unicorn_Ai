# Quick Start Guide - Unicorn AI

## ✅ What's Working Now (Phase 1)

You can have **text conversations** with Luna, your AI companion!

### Start the Server

```bash
cd /home/chris/Documents/Git/Projects/Unicorn_Ai
venv/bin/python main.py
```

Server runs on: `http://localhost:8000`

### Method 1: Interactive Chat (Easiest)

```bash
cd /home/chris/Documents/Git/Projects/Unicorn_Ai
venv/bin/python test_chat.py
```

Then just type your messages!

### Method 2: Test with curl

```bash
# Send a message
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hi Luna! How are you?"}'

# Check health
curl http://localhost:8000/health
```

### Method 3: View API Docs

Open in browser: `http://localhost:8000/docs`

---

## 🎯 Current Features

- ✅ **Text conversations** - Natural, caring responses
- ✅ **Uncensored** - No content filters
- ✅ **Fast responses** - 2-4 seconds
- ✅ **Personality** - Luna is warm, caring, and fun
- ✅ **Private** - Everything runs locally

---

## 📊 Performance

- **Model**: dolphin-mistral (7B parameters)
- **VRAM Usage**: ~5-6GB
- **Response Time**: 2-4 seconds
- **GPU**: AMD RX 6700 XT (using ROCm)

---

## 🚀 Next Steps (Phase 2)

Add image generation so Luna can send you photos:

1. Install ComfyUI (you already have it in another project!)
2. Add IPAdapter for character consistency
3. Detect `[IMAGE: ...]` tags in responses
4. Generate images based on descriptions
5. Return images with text

**Estimated time**: 2-4 hours

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start Ollama
sudo systemctl start ollama
```

### Slow responses
- Normal for first message (model loading)
- Subsequent messages should be fast

### Change personality
Edit `config/.env` and change:
```
PERSONA_NAME=Luna
PERSONA_DESCRIPTION=Your friendly, caring AI companion
```

---

## 📁 Project Structure

```
Unicorn_Ai/
├── main.py              # FastAPI backend
├── test_chat.py         # Interactive chat script
├── requirements.txt     # Python dependencies
├── config/
│   └── .env            # Configuration
├── data/
│   └── .gitkeep        # (Future: database)
├── outputs/
│   └── logs/           # Server logs
└── venv/               # Python virtual environment
```

---

## 🎉 You Did It!

You now have a working AI companion that:
- Talks naturally
- Has personality
- Is completely private
- Runs on your hardware
- Has no content filters

**Try it out and see how she responds!** 🦄
