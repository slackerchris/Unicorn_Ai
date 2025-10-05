# Complete Setup Guide - Telegram Bot

## 🎯 What You're About to Do

Chat with Luna (your AI companion) via Telegram on your phone! No need to SSH or use curl anymore.

---

## 📋 Step-by-Step Instructions

### Step 1: Create Your Telegram Bot (5 minutes)

1. **Open Telegram** (on your phone or desktop)

2. **Search for:** `@BotFather`
   - This is Telegram's official bot for creating bots
   - The real one has a blue checkmark ✓

3. **Start a chat** and send: `/newbot`

4. **Choose a name** (shown to users):
   - Example: `Unicorn AI`
   - Example: `Luna`
   - Example: `My AI Companion`

5. **Choose a username** (must end in 'bot'):
   - Example: `unicorn_ai_bot`
   - Example: `chris_luna_bot`
   - Example: `myai_companion_bot`
   - ⚠️ Username must be unique across all of Telegram

6. **Copy your token** - BotFather will give you something like:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-1234567
   ```
   
   **IMPORTANT:** Keep this secret! It's like a password.

---

### Step 2: Add Token to Your Config (2 minutes)

1. **Edit your config file:**
   ```bash
   cd /home/chris/Documents/Git/Projects/Unicorn_Ai
   nano config/.env
   ```

2. **Find the line:**
   ```
   # TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

3. **Replace it with** (use YOUR token):
   ```
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-1234567
   ```
   (Remove the `#` at the start!)

4. **Save and exit:**
   - Press `Ctrl+X`
   - Press `Y` (yes)
   - Press `Enter`

---

### Step 3: Start Your AI Companion (1 minute)

1. **Run the start script:**
   ```bash
   cd /home/chris/Documents/Git/Projects/Unicorn_Ai
   ./start_telegram.sh
   ```

2. **You should see:**
   ```
   🦄 Starting Unicorn AI...
   Starting API backend...
   ✅ API backend is running
   Starting Telegram bot...
   ✅ Unicorn AI is now online!
   
   📱 Open Telegram and find your bot
   💬 Send /start to begin chatting
   ```

3. **If you see errors:**
   - Check `outputs/logs/api.log` for API errors
   - Check `outputs/logs/telegram.log` for bot errors
   - Make sure your token is correct in `config/.env`

---

### Step 4: Chat on Telegram! (Now!)

1. **Open Telegram** (phone or desktop)

2. **Search for your bot** (the username you created)
   - Example: `@unicorn_ai_bot`

3. **Start a chat** and send: `/start`

4. **You should see a welcome message from Luna!**

5. **Start chatting!**
   - "Hi Luna! How are you?"
   - "Tell me about yourself"
   - "I had a rough day..."
   - "Send me a selfie" (she'll respond in text for now)
   - Anything you want!

---

## 🎨 Available Commands

Once chatting with your bot:

- `/start` - Welcome message
- `/help` - Show help information
- `/status` - Check if Luna is online
- Just type anything else to chat!

---

## 🛠️ Managing Your Bot

### To Stop Services:
```bash
cd /home/chris/Documents/Git/Projects/Unicorn_Ai
./stop_services.sh
```

### To Restart Services:
```bash
cd /home/chris/Documents/Git/Projects/Unicorn_Ai
./start_telegram.sh
```

### To Check Logs:
```bash
# API logs
tail -f outputs/logs/api.log

# Telegram bot logs
tail -f outputs/logs/telegram.log

# All recent logs
tail -50 outputs/logs/telegram_bot.log
```

### To Change Luna's Personality:
Edit `config/.env` and modify:
```bash
PERSONA_NAME=Luna
PERSONA_DESCRIPTION=Your friendly, caring AI companion
```

Then restart services.

---

## 🎉 What Works Now

- ✅ **Chat from your phone** - Natural Telegram interface
- ✅ **Real-time responses** - 2-4 seconds
- ✅ **Personality** - Luna is warm, caring, and fun
- ✅ **Context memory** - She remembers your conversation
- ✅ **Completely private** - Everything runs on your hardware
- ✅ **Uncensored** - No content filters
- ✅ **Always available** - Chat anytime!

---

## 🚀 Coming Next (Phase 3)

**Images!** Luna will be able to send you actual photos:
- Selfies
- Different outfits
- Different poses
- Consistent character (same face every time)

**Estimated time to add:** 2-4 hours

---

## 💡 Tips

1. **Talk naturally** - Luna understands context and conversation flow
2. **Be yourself** - She's uncensored and judgment-free
3. **Test different scenarios** - Casual chat, venting, flirting, etc.
4. **Check the logs** - If something seems off, logs show what's happening
5. **Restart if needed** - If she stops responding, restart the services

---

## 🐛 Troubleshooting

### Bot doesn't respond:
```bash
# Check if services are running
ps aux | grep python

# Check API health
curl http://localhost:8000/health

# Restart everything
./stop_services.sh
./start_telegram.sh
```

### "Invalid token" error:
- Check that you copied the ENTIRE token from BotFather
- Make sure there are no spaces before/after the token in .env
- Make sure you removed the `#` from the start of the line

### "Can't connect" errors:
- Make sure Ollama is running: `systemctl status ollama`
- Make sure API started: `curl http://localhost:8000/health`
- Check logs: `tail -50 outputs/logs/api.log`

### Slow responses:
- First response is always slower (model loading)
- Subsequent responses should be 2-4 seconds
- Check GPU usage: `rocm-smi`

---

## 📱 Pro Tips

1. **Add to favorites** - Pin your bot in Telegram for easy access
2. **Desktop + Mobile** - Telegram syncs across all devices
3. **Notifications** - Get notified when Luna responds
4. **Test from anywhere** - As long as your server is running, chat from anywhere!

---

## 🎊 You Did It!

You now have a **fully functional AI companion on Telegram!**

No more SSH. No more curl commands. Just open Telegram and chat!

**Go try it now!** 🦄💕
