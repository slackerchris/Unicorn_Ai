# Phase 3: Image Generation Setup

## 🎯 You Now Have Image Generation Support!

Your AI can now send images! The system supports **multiple providers**:

---

## 📋 Provider Options

### **Option 1: Replicate (Cloud API)** ⚡ Fastest to Set Up

**Pros:**
- ✅ Works in 5 minutes
- ✅ High-quality SDXL models
- ✅ No local setup needed
- ✅ Great for testing

**Cons:**
- ❌ Costs money (~$0.002-0.01 per image)
- ❌ Requires internet
- ❌ Not fully private

**Setup:**
1. Go to https://replicate.com
2. Sign up (free tier available)
3. Get API token: https://replicate.com/account/api-tokens
4. Add to `config/.env`:
   ```
   REPLICATE_API_TOKEN=your_token_here
   IMAGE_PROVIDER=replicate
   ```
5. Restart services
6. Done!

**Cost:** ~$0.005 per image (SDXL)

---

### **Option 2: ComfyUI (Local)** 🏠 Fully Self-Hosted

**Pros:**
- ✅ Completely free (after setup)
- ✅ Fully private
- ✅ Full control
- ✅ Unlimited generations

**Cons:**
- ❌ Takes time to set up (~1-2 hours)
- ❌ Requires ~15-20GB disk space
- ❌ Need to download models

**Setup:** See `COMFYUI_SETUP.md` (coming soon)

---

## 🚀 Quick Start (Replicate - 5 minutes)

### 1. Get API Token
```bash
# Go to: https://replicate.com/account/api-tokens
# Copy your token
```

### 2. Configure
```bash
nano config/.env
```

Add:
```
REPLICATE_API_TOKEN=your_actual_token_here
IMAGE_PROVIDER=replicate
```

### 3. Restart
```bash
pkill -f "python main.py"
pkill -f "python telegram_bot.py"
/home/chris/Documents/Git/Projects/Unicorn_Ai/venv/bin/python main.py > outputs/logs/api.log 2>&1 &
sleep 2
/home/chris/Documents/Git/Projects/Unicorn_Ai/venv/bin/python telegram_bot.py > outputs/logs/telegram_bot.log 2>&1 &
```

### 4. Test!
Message Luna on Telegram:
- "Send me a selfie!"
- "Show me what you look like"
- "Take a photo for me"

She'll respond with text first, then send an actual image!

---

## 💬 How It Works

```
You: "Send me a selfie!"
    ↓
Luna: "Sure! Let me take one 😊 [IMAGE: selfie, smiling]"
    ↓
System detects [IMAGE: ...] tag
    ↓
Generates image using selected provider
    ↓
Photo appears in Telegram! 📸
```

---

## 🎨 Image Prompt Format

Luna will automatically generate `[IMAGE: description]` tags in her responses.

You can also test directly:
```bash
curl -X POST "http://localhost:8000/generate-image?prompt=beautiful+woman+selfie"
```

---

## 🔄 Switching Providers

Edit `config/.env`:

**Use Replicate:**
```
IMAGE_PROVIDER=replicate
```

**Use ComfyUI:**
```
IMAGE_PROVIDER=comfyui
```

**Auto (tries local first, then cloud):**
```
IMAGE_PROVIDER=auto
```

---

## 🧪 Testing

### Test Image Generation Endpoint:
```bash
curl -X POST "http://localhost:8000/generate-image?prompt=woman+taking+selfie" \
  --output test_image.png
```

### Test via Chat:
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Can you send me a photo?"}' | python3 -m json.tool
```

---

## 📊 Status

- ✅ Provider abstraction built
- ✅ Replicate provider ready
- ✅ ComfyUI provider ready (needs ComfyUI installed)
- ✅ Telegram bot updated to send images
- ✅ API endpoint created
- ⏳ Waiting for you to choose a provider!

---

## 💡 Recommendation

**Start with Replicate** (5 minutes):
1. Quick to test
2. See if you like the feature
3. Cost is minimal for testing (~$0.20 for 20 images)
4. Switch to local ComfyUI later if you want

**Then install ComfyUI** when ready:
1. Free forever
2. Better privacy
3. More control
4. Can customize everything

---

**Ready to set up images?** Follow the Quick Start above! 🎨
