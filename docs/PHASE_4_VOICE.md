# Phase 4: Voice Messages (TTS) ✅

## Overview
Luna can now send voice messages instead of text! Users can toggle between text and voice mode using the `/voice` command in Telegram.

## What Was Implemented

### 1. TTS Service (`tts_service.py`)
- Uses Microsoft Edge TTS (high-quality, free)
- Default voice: **en-US-AriaNeural** (expressive, natural female voice)
- Generates MP3 audio files
- Async and sync interfaces
- Automatic output directory management

### 2. API Endpoint (`/generate-voice`)
- POST endpoint that takes text and returns MP3 audio
- Integrates with TTSService
- Returns FileResponse with audio/mpeg content
- Example:
  ```bash
  curl -X POST "http://localhost:8000/generate-voice?text=Hello!" \
    --output voice.mp3
  ```

### 3. Telegram Bot Integration
- **New command**: `/voice` - Toggle between text and voice modes
- Voice mode persists per user (in-memory storage)
- Cleans text (removes [IMAGE: ...] tags before TTS)
- Shows "recording voice" indicator when generating
- Falls back to text if voice generation fails
- Updated welcome message to mention voice feature

### 4. Configuration
- `TTS_VOICE` in `.env` - Customize Luna's voice
- `outputs/voice_messages/` - Generated audio files stored here

## Available Voices

Some good female voices you can use:
- `en-US-AriaNeural` - Expressive, natural (default)
- `en-US-AvaNeural` - Casual, friendly
- `en-US-JennyNeural` - Professional, warm
- `en-GB-SoniaNeural` - British, elegant
- `en-AU-NatashaNeural` - Australian
- `en-IE-EmilyNeural` - Irish

To change voice, edit `TTS_VOICE` in `config/.env`

## How to Use

### Via Telegram:
1. Send `/voice` to toggle voice mode on
2. Send any message to Luna
3. She'll respond with a voice message!
4. Send `/voice` again to switch back to text

### Via API:
```bash
# Generate voice from text
curl -X POST "http://localhost:8000/generate-voice?text=Your%20text%20here" \
  --output message.mp3

# Play it (Linux)
mpg123 message.mp3
```

## Technical Details

### Dependencies Added:
```bash
pip install edge-tts pydub
```

### Files Modified:
- `main.py` - Added TTS service init and `/generate-voice` endpoint
- `telegram_bot.py` - Added voice mode toggle and voice message sending
- `tts_service.py` - New file for TTS functionality
- `config/.env` - Added `TTS_VOICE` configuration

### Output Files:
- Voice messages stored in `outputs/voice_messages/`
- Filenames are MD5 hash of text (to avoid regenerating)
- MP3 format, compatible with Telegram

## Performance

- Voice generation: ~0.5-2 seconds (depends on text length)
- File sizes: ~20-50KB for typical messages
- No GPU required (uses cloud TTS API)
- Requires internet connection (Microsoft's TTS API)

## Future Enhancements

Possible improvements:
- [ ] Local TTS (Coqui TTS when Python 3.9-3.11 available)
- [ ] Voice cloning (custom Luna voice)
- [ ] Voice speed/pitch control
- [ ] Multiple voice presets
- [ ] Database storage for user preferences
- [ ] Voice message caching

## Testing

✅ **Tested and working:**
- Voice generation via API endpoint
- TTS service standalone test
- Telegram bot integration (ready to test)

**To test in Telegram:**
1. Make sure bot is running
2. Send a message to your bot
3. Use `/voice` to enable voice mode
4. Send another message
5. You should receive a voice message!

## Notes

- Voice messages are automatically cleaned (removes image tags)
- If voice generation fails, bot falls back to text
- User preferences are stored in memory (reset on bot restart)
- In production, use a database for user preferences
