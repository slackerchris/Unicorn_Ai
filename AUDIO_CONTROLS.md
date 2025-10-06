# Audio Playback Controls - Web UI

## Overview

Added comprehensive audio playback controls to the Unicorn AI web UI for managing voice responses.

## Features

### 🎵 Audio Controls Bar

When voice mode is enabled and a message is sent, an audio control bar appears with:

1. **Play/Pause Button** (🟠 Orange)
   - Click to pause/resume playback
   - Icon changes between pause ⏸ and play ▶

2. **Stop Button** (🔴 Red)
   - Stops playback completely
   - Resets audio to beginning
   - Hides control bar

3. **Progress Bar** (Interactive)
   - Shows current playback position
   - **Drag to seek** to any position in audio
   - Visual feedback with purple thumb

4. **Time Display**
   - Shows current time / total duration
   - Format: `0:00 / 0:05`

5. **Volume Control** (🔊)
   - Slider from 0-100%
   - Default: 80%
   - Remembers setting during session
   - Volume icons on both sides

## Usage

### Enable Voice Mode

1. Click the **🔊 Voice Mode** button in sidebar
2. Button changes to: "Voice Mode: On"
3. All AI responses will play as audio

### Audio Playback

1. Send a message with voice mode ON
2. Audio control bar appears while loading
3. Audio plays automatically when ready
4. Use controls to:
   - **Pause/Resume** - Orange button
   - **Stop** - Red button  
   - **Seek** - Drag progress bar
   - **Adjust Volume** - Slider

### Controls Disappear When

- Audio finishes playing
- Stop button is clicked
- New message is sent (stops current audio)

## Technical Details

### Files Modified

**JavaScript:** `static/app.js`
- Added `currentAudio` property to track playing audio
- Added audio control element references
- New methods:
  - `playVoiceResponse()` - Enhanced with controls
  - `togglePauseAudio()` - Pause/resume
  - `stopAudio()` - Stop and reset
  - `setVolume()` - Volume control
  - `seekAudio()` - Seek to position
  - `updateAudioTime()` - Update time display
  - `formatTime()` - Format seconds to MM:SS

**HTML:** `static/index.html`
- Added audio controls section between chat messages and input
- Structure:
  ```html
  <div class="audio-controls" id="audioControls">
    - Audio info (icon + time)
    - Progress bar
    - Pause button
    - Stop button
    - Volume control
  </div>
  ```

**CSS:** `static/style.css`
- New `.audio-controls` section
- Styled all audio elements
- Added animations (slide down, pulse icon)
- Mobile responsive design
- Custom range slider styling

### Audio Events Handled

- `loadedmetadata` - Set progress bar max value
- `timeupdate` - Update progress bar and time display
- `ended` - Hide controls when finished
- `error` - Handle playback errors gracefully

### Default Settings

- **Volume:** 80%
- **Controls:** Hidden until audio plays
- **Progress:** Interactive (seekable)
- **Auto-hide:** Yes, when audio ends or stops

## Styling

### Colors

- **Pause Button:** Orange (`#f59e0b`)
- **Stop Button:** Red (`#ef4444`)
- **Progress Thumb:** Purple (`#8b5cf6`)
- **Volume Track:** Dark background
- **Time Display:** Primary color

### Animations

- **Slide Down:** Controls appear smoothly
- **Pulse:** Volume icon pulses during playback
- **Hover Effects:** Buttons scale on hover
- **Active Effects:** Buttons compress on click

## Mobile Responsive

On screens < 768px:
- Smaller buttons (36px instead of 40px)
- Reduced padding
- Smaller volume slider (60px)
- Smaller font sizes
- Can wrap if needed

## Keyboard Shortcuts

Currently: None  
Future: Could add Space for pause, Arrow keys for seek, etc.

## Browser Compatibility

✅ **Works on:**
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Opera
- Mobile browsers

Uses standard HTML5 Audio API - no special requirements.

## Examples

### Full Audio Session

```
1. User enables voice mode (🔊 button)
2. User sends: "Tell me a story"
3. AI responds with text
4. Audio control bar appears (loading...)
5. Audio starts playing automatically
6. User can:
   - Pause mid-sentence (orange button)
   - Resume from same spot
   - Seek to end (drag progress)
   - Adjust volume (slider)
   - Stop completely (red button)
7. Audio finishes, controls hide
```

### Volume Persistence

Volume setting persists for current audio only. Each new audio starts at slider position.

### Multiple Messages

If user sends another message while audio is playing:
- Current audio stops immediately
- Old controls hide
- New audio loads
- New controls appear

## Future Enhancements

Possible additions:
- [ ] Playback speed control (0.5x, 1x, 1.5x, 2x)
- [ ] Skip forward/backward 10 seconds
- [ ] Loop/repeat toggle
- [ ] Download audio button
- [ ] Keyboard shortcuts
- [ ] Waveform visualization
- [ ] Queue multiple messages
- [ ] Auto-play next message in queue

## Testing

### Test Scenarios

1. ✅ Enable voice mode → Send message → Audio plays
2. ✅ Click pause → Audio pauses → Click play → Resumes
3. ✅ Click stop → Audio stops → Controls hide
4. ✅ Drag progress bar → Audio seeks correctly
5. ✅ Adjust volume slider → Volume changes
6. ✅ Send new message → Old audio stops, new plays
7. ✅ Audio ends naturally → Controls auto-hide
8. ✅ Mobile view → Controls are responsive

### Manual Testing Commands

```bash
# Test voice generation
curl "http://localhost:8000/generate-voice?text=This%20is%20a%20test" \
  --output test.wav && aplay test.wav
```

## Troubleshooting

### Controls Don't Appear

1. Check voice mode is ON (sidebar button)
2. Check browser console for errors
3. Verify TTS service is running:
   ```bash
   curl http://localhost:5050/health
   ```

### Audio Won't Play

1. Check browser audio permissions
2. Try clicking pause/play button manually
3. Check volume slider isn't at 0
4. Check browser console for errors

### Seek Not Working

1. Ensure audio is playing (not loading)
2. Check if audio has duration loaded
3. Try clicking instead of dragging

### Volume Not Changing

1. Check browser volume isn't muted
2. Check system volume
3. Try moving slider to extremes (0 and 100)

## Status

✅ **Complete and Working**

All audio controls implemented and tested:
- Play/Pause toggle
- Stop functionality
- Seekable progress bar
- Volume control
- Time display
- Auto-hide on finish
- Mobile responsive

---

**Date:** October 5, 2025  
**Status:** Working (needs more testing)  
**Location:** Web UI - Between chat messages and input
