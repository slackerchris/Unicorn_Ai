# TODO List - What's Left to Do

**Date:** October 6, 2025

---

## ⚠️ Incomplete Foundation (Skipped/Half-Done)

### Basic Features That Should Exist But Don't
- [ ] **Proper error handling** - Most code just crashes or returns generic errors
- [ ] **Logging system** - Barely any useful logs
- [ ] **Configuration management** - Settings scattered everywhere
- [ ] **Input validation** - Not checking user input properly
- [ ] **API documentation** - No Swagger/OpenAPI docs
- [ ] **Tests** - ZERO unit tests, integration tests, or any tests
- [ ] **Installation script** - setup_bot.sh exists but probably broken
- [ ] **Requirements management** - requirements.txt might be incomplete
- [ ] **Environment setup** - No .env file handling, hardcoded values
- [ ] **Database migrations** - No proper schema versioning
- [ ] **Backup system** - No way to backup data
- [ ] **Recovery** - If something breaks, no way to recover
- [ ] **Health checks** - No proper health monitoring
- [ ] **Rate limiting** - API is wide open
- [ ] **Security** - No authentication, authorization, or input sanitization
- [ ] **CORS properly configured** - Might have issues
- [ ] **File upload limits** - Probably can upload anything
- [ ] **Session management** - Sessions might leak or conflict
- [ ] **Graceful shutdown** - Services probably don't clean up properly
- [ ] **Process management** - Just using background processes, no systemd/supervisor

### Documentation Gaps
- [ ] **API documentation** - No endpoint docs
- [ ] **Code comments** - Minimal inline documentation
- [ ] **Architecture docs** - No system design docs
- [ ] **Deployment guide** - No proper deployment instructions
- [ ] **Troubleshooting guide** - No debugging help
- [ ] **Contributing guide** - No CONTRIBUTING.md
- [ ] **License** - No LICENSE file
- [ ] **Changelog** - CHANGELOG.md exists but might be outdated

### Development Workflow Missing
- [ ] **Pre-commit hooks** - No automated checks
- [ ] **Linting** - No code style enforcement (pylint, black, flake8)
- [ ] **Type checking** - No mypy or type hints consistently used
- [ ] **CI/CD** - No GitHub Actions or automated testing
- [ ] **Code review process** - Just committing directly
- [ ] **Branch strategy** - Working directly on main
- [ ] **Versioning** - No semantic versioning
- [ ] **Release process** - No formal releases

### Performance/Optimization Never Done
- [ ] **Caching** - Not caching anything (API responses, TTS audio, etc.)
- [ ] **Database indexing** - ChromaDB might not be optimized
- [ ] **Connection pooling** - Not reusing connections
- [ ] **Lazy loading** - Loading everything upfront
- [ ] **Pagination** - No pagination anywhere
- [ ] **Compression** - Not compressing responses
- [ ] **CDN** - No static file optimization
- [ ] **Profiling** - Never profiled the code to find bottlenecks

### Monitoring/Observability
- [ ] **Metrics** - No Prometheus/Grafana
- [ ] **Alerting** - No alerts if something breaks
- [ ] **Logging aggregation** - No centralized logging
- [ ] **Error tracking** - No Sentry or error reporting
- [ ] **Performance monitoring** - No APM
- [ ] **Uptime monitoring** - No ping checks

---

## ✅ What's Working (Sort Of)

### Core System
- ✅ FastAPI backend (port 8000) - *but no error handling, validation, or docs*
- ✅ Ollama LLM integration (dolphin-mistral) - *but hardcoded, no fallback*
- ✅ Web UI (accessible on LAN) - *but no auth, mobile untested*
- ✅ Basic chat functionality - *but no input validation or rate limiting*
- ✅ Multiple personas (Luna, Nova, Sage, Alex) - *but no validation*
- ✅ Custom persona creation - *but no input sanitization*

### Recent Additions (Just Implemented, Barely Tested)
- ✅ Memory system (ChromaDB + semantic search) - *but no UI to view memories*
- ✅ Memory toggle (web + Telegram) - *but not tested on Telegram*
- ✅ User profile system - *but AI might not use it*
- ✅ TTS service (Coqui TTS on port 5050) - *but only one voice, slow*
- ✅ Per-message audio controls - *but not tested on mobile*
- ✅ Persona editing - *but no validation or error handling*

### October 6, 2025 Updates (COMPLETED ✅)
- ✅ **Model Manager** - Download/delete Ollama models via web UI with progress tracking
- ✅ **Popular Models** - One-click download for dolphin-mistral, llama3, etc.
- ✅ **Service Status Indicators** - Real-time health monitoring (10s interval)
- ✅ **SDXL Workflow** - Dual-stage (BASE + REFINER) high-quality image generation
- ✅ **Enhanced Negative Prompts** - 40+ quality control terms (anatomy, artifacts, quality)
- ✅ **Visual Appearance Field** - Persona appearance descriptions for image generation
- ✅ **Enhanced ComfyUI Logging** - Full prompt visibility (not truncated) with debug mode
- ✅ **Monitoring Script** - monitor_image_gen.sh for real-time ComfyUI output
- ✅ **AI Image Confusion Fix** - Clear [IMAGE: ...] tag usage instructions
- ✅ **Prompt Weighting Documentation** - Complete guide with examples (already supported)

### Currently Running
- TTS Service: PID 33533 (port 5050) ✅
- Main App: PID 34898 (port 8000) ✅

---

## ⚠️ Needs Testing

### High Priority
- [ ] **Voice quality** - Current TTS voice isn't great
  - Test with different Coqui models
  - May need voice selection per persona
  
- [ ] **Per-message audio controls** - Just implemented today
  - Test with multiple messages
  - Test on mobile
  - Check if download works
  - Verify volume persists
  
- [ ] **Memory system** - Just added
  - Test semantic search accuracy
  - Test with long conversations
  - Verify session isolation works
  - Test memory toggle on Telegram
  
- [ ] **User profile** - Just added
  - Test if AI actually uses profile info
  - Test persistence across sessions

### Medium Priority
- [ ] **Telegram bot** - Not currently running
  - Start telegram_bot.py
  - Test /memory command
  - Test voice mode on Telegram
  
- [ ] **Image generation** - Architecture exists but not tested
  - ComfyUI not installed/running
  - Need workflow configured
  - Test image prompts

---

## 🔧 Known Issues

### Voice/TTS
- Voice quality is mediocre (LJSpeech model)
- Only one voice available
- No way to change voice per persona yet
- TTS takes ~2 seconds per sentence (could be faster)

### Audio Controls
- Volume doesn't persist across page reload
- No keyboard shortcuts
- Mobile layout probably buggy
- Error messages are generic

### Memory System
- Unclear how well semantic search works in practice
- No UI to view what's stored in memory
- Can't see what memories AI is using
- No way to delete specific memories (only clear all)

### UI/UX
- No loading indicators for audio generation
- No way to regenerate audio with different voice
- Can't adjust playback speed
- No waveform visualization
- Mobile UI needs work

### Backend
- No rate limiting
- No auth/security (open to LAN)
- Logs are minimal
- No error tracking
- ChromaDB might get slow with lots of data

---

## 📋 TODO - Short Term

### Voice Improvements
- [ ] Test different Coqui TTS models
  - Try VITS (faster, multi-speaker)
  - Try different vocoder models
  - List available models properly
  
- [ ] Add voice selection
  - Voice picker in settings
  - Per-persona voice assignment
  - Preview voices before selecting

- [ ] Audio playback improvements
  - Add playback speed control (0.5x, 1x, 1.5x, 2x)
  - Add "regenerate audio" button
  - Show audio generation progress
  - Better error handling

### Memory System Testing
- [ ] Test semantic search with real conversations
- [ ] Add memory viewer UI (see what's stored)
- [ ] Show which memories AI is using in response
- [ ] Add selective memory deletion
- [ ] Test performance with 100+ messages

### Telegram Bot
- [ ] Start the bot and test it
- [ ] Test /memory command
- [ ] Test voice messages on Telegram
- [ ] Verify session isolation

### UI Polish
- [ ] Better loading states
- [ ] Better error messages
- [ ] Mobile testing and fixes
- [ ] Keyboard shortcuts (Space = pause, arrows = seek)
- [ ] Settings to persist volume preference

---

## 📋 TODO - Medium Term

### Image Generation
- ✅ Install ComfyUI properly - **DONE**
- ✅ Configure workflow - **DONE (SDXL dual-stage)**
- ✅ Test image generation - **DONE (1024x1024 photorealistic)**
- ✅ Show images in web UI properly - **DONE**
- [ ] Send images via Telegram - *needs testing*
- [ ] Add LoRA support to workflow
- [ ] Add IPAdapter for face consistency
- [ ] Add ControlNet support
- [ ] Image upscaling workflow

### Persona System
- [ ] Add persona avatars/icons
- [ ] Persona import/export
- [ ] Share personas between users
- [ ] Persona templates

### Memory Enhancements
- [ ] Memory summary view
- [ ] Important memory pinning
- [ ] Memory search UI
- [ ] Export conversation history
- [ ] Import old conversations

### Performance
- [ ] Optimize ChromaDB queries
- [ ] Cache TTS audio (don't regenerate same text)
- [ ] Lazy load old messages
- [ ] Database cleanup/maintenance

---

## 📋 TODO - Long Term (Phase 7+)

### Vision (Phase 7)
- [ ] Vision model integration (see images)
- [ ] Process photos you send
- [ ] Generate alt text for images
- [ ] Visual question answering

### Advanced Features (Phase 8)
- [ ] Calendar integration
- [ ] Proactive messaging
- [ ] Scheduled messages
- [ ] Context awareness (time, location, etc.)

### System Improvements
- [ ] Multi-user support with auth
- [ ] User management
- [ ] Rate limiting
- [ ] API keys
- [ ] Usage tracking
- [ ] Better logging system
- [ ] Health monitoring
- [ ] Backup/restore system

### Voice Enhancements
- [ ] Voice cloning (train on your voice)
- [ ] Emotion/tone control
- [ ] Different languages
- [ ] Real-time voice streaming
- [ ] Voice commands

---

## 🐛 Bugs to Fix

### High Priority
- [ ] Test if Telegram bot still works after changes
- [ ] Verify memory toggle actually works
- [ ] Check if user profile is used by AI
- [ ] Test audio controls on mobile

### Medium Priority
- [ ] Persona editing might have issues
- [ ] Memory might not clear properly
- [ ] Audio download might fail
- [ ] Session IDs might conflict

### Low Priority
- [ ] CSS probably has issues on mobile
- [ ] Some buttons might not have proper states
- [ ] Error messages need improvement

---

## 🎯 Next Actions (Priority Order)

1. **Test Voice Quality**
   - Open web UI
   - Enable voice mode
   - Send messages
   - Listen to quality
   - Try different Coqui models if bad

2. **Test Audio Controls**
   - Send multiple messages with voice on
   - Try play/pause on each
   - Try seeking
   - Try volume
   - Try download
   - Test on phone

3. **Test Memory System**
   - Have a conversation
   - Turn memory off/on
   - Check if context is used
   - Clear memory and verify
   - Test on Telegram

4. **Start Telegram Bot**
   - Run telegram_bot.py
   - Test /memory command
   - Test basic chat
   - Test voice mode

5. **Voice Improvements**
   - Research Coqui models
   - Test VITS model
   - Add voice selector UI
   - Per-persona voice assignment

6. **Fix Mobile UI**
   - Test on actual phone
   - Fix audio controls layout
   - Fix any responsive issues

---

## 💡 Ideas for Later

- Waveform visualization for audio
- Conversation export to PDF/markdown
- Voice assistant mode (continuous conversation)
- Multiple LLM support (not just Ollama)
- Plugin system for extensions
- API documentation (OpenAPI/Swagger)
- Docker deployment
- Cloud deployment option
- Desktop app (Electron?)
- Mobile app (React Native?)

---

## 🚫 Not Doing (Out of Scope)

- Cloud hosting (keep it self-hosted)
- Commercial features
- User accounts with email
- Payment processing
- Social media integration
- Analytics/tracking
- Ads (obviously)

---

## Current Status (October 6, 2025)

### ✅ What's Working NOW
- **Core chat** - Text conversations with Ollama LLMs
- **Memory system** - ChromaDB + semantic search (WORKING)
- **TTS** - Coqui TTS generates voice (WORKING)
- **Image generation** - SDXL via ComfyUI (WORKING!)
- **Telegram bot** - Sending text + images + voice (WORKING!)
- **Web UI** - Chat interface with audio controls (WORKING)
- **Multiple personas** - Switch between different AI personalities
- **Systemd services** - Auto-restart and 24/7 operation (READY)

### ⚠️ What's Partially Working
- **Per-message audio** - Works but not tested on mobile
- **Voice quality** - Works but voice isn't great (LJSpeech model)
- **Image display** - Shows in chat but not tested extensively
- **Memory toggle** - Implemented but needs testing

### ❌ What's Broken/Missing
- **ComfyUI stability** - Keeps crashing/stopping
- ~~**Persona LLM not changing**~~ - **FIXED ✅** Model displays in UI, backend works correctly
- ~~**Chat history**~~ - **FIXED ✅** LocalStorage persistence implemented
- ~~**Multiple chat windows**~~ - **FIXED ✅** Session management with UI
- **Mobile UI** - Not tested, probably broken
- **Voice variety** - Only one voice model
- **Image generation UI** - No way to manually request images
- **Error handling** - Crashes on errors
- **Input validation** - No validation anywhere
- **Testing** - Zero automated tests
- **Logging** - Minimal useful logs
- **Documentation** - Dev notes, not user docs

## Immediate Priorities (Get Everything Working)

### Phase 1: Core Stability (This Week)
1. [x] **Fix persona LLM changing** - Added model display in chat UI
2. [x] **Add chat history** - LocalStorage persistence per session ✅
3. [x] **Add multiple chat sessions** - Session switcher in sidebar ✅
4. [ ] **Fix ComfyUI crashing** - Figure out why it keeps dying
5. [ ] **Test image generation** - End-to-end on Telegram and Web
6. [ ] **Test memory system** - Verify it actually helps responses
7. [ ] **Test audio on mobile** - Fix mobile UI issues
8. [ ] **Add basic error handling** - Don't crash on errors
9. [ ] **Install systemd services** - Make it run reliably

### Phase 2: Polish What Exists (Next 2 Weeks)
7. [ ] **Improve voice quality** - Try different TTS models
8. [ ] **Add voice selection** - Multiple voices to choose from
9. [ ] **Better image prompts** - AI generates better image descriptions
10. [ ] **Mobile UI fixes** - Make it work on phones
11. [ ] **Better logging** - Actually useful logs
12. [ ] **Status dashboard** - See if services are running

### Phase 3: Missing Features (Next Month)
13. [ ] **Vision support** - AI can see images you send
14. [ ] **Image editing** - Modify/regenerate images
15. [ ] **Better personas** - More personality options
16. [ ] **User profiles** - Proper multi-user support
17. [ ] **Admin panel** - Manage everything via web
18. [ ] **Backup/restore** - Protect user data

### Phase 4: Production Ready (2-3 Months)
19. [ ] **Automated installer** - One-command setup
20. [ ] **Update system** - Easy updates
21. [ ] **Monitoring** - Know when things break
22. [ ] **Documentation** - Real user docs
23. [ ] **Security** - Auth, rate limiting, input validation
24. [ ] **Performance** - Optimize everything

## Next Steps

**RIGHT NOW:**
1. Test image generation thoroughly (Telegram + Web)
2. Fix ComfyUI stability issue
3. Verify memory system works
4. Test on mobile device

**THIS WEEK:**
- Get all features working reliably
- Install systemd for 24/7 operation
- Fix critical bugs

**Goal:** Everything works consistently without manual intervention.
