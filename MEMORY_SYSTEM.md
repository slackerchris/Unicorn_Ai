# 🧠 Memory System Documentation

## Overview
Unicorn AI now features a **hybrid memory system** that allows the AI to remember conversations across sessions, similar to ChatGPT and other enterprise AI systems.

## Architecture

### Technology Stack
- **ChromaDB**: Vector database for semantic search of past conversations
- **Sentence Transformers**: Generate embeddings for semantic similarity
- **JSON Storage**: Recent message buffer for immediate context

### Memory Tiers

```
┌─────────────────────────────────────────┐
│     Short-term (Recent Messages)        │
│   Last 5-10 messages in current chat    │
│        Stored in: JSON file             │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Long-term (Semantic Search)            │
│   All past messages with embeddings     │
│     Stored in: ChromaDB vectors         │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│      Context Building                    │
│  Recent + Semantically Relevant Past    │
│      Fed to LLM for response            │
└─────────────────────────────────────────┘
```

## Features

### ✅ For Web UI
- **Memory Toggle Button**: Click "Memory: On/Off" button in sidebar
- **Per-Session Storage**: Each browser/device has unique session
- **Visual Indicator**: Button shows current memory state
- **Auto-Clear**: Option to clear memory with "Clear Chat"

### ✅ For Telegram
- **/memory**: Toggle conversation memory on/off
- **Per-User Storage**: Each Telegram user has separate memory
- **Persistent**: Memory survives bot restarts
- **Commands**:
  - `/memory` - Toggle memory on/off
  - `/help` - See all commands including memory

## How It Works

### 1. Message Storage
When you send a message:
```python
1. User message → Stored in memory with session_id
2. AI response → Also stored in memory
3. Both get embeddings for semantic search
```

### 2. Context Retrieval
When AI responds:
```python
1. Get last 5 recent messages (immediate context)
2. Search for 3 semantically similar past messages
3. Combine into context prompt
4. Send to LLM with current message
```

### 3. Smart Context Management
- **Recent messages**: Always included for continuity
- **Relevant past**: Only if conversation is new/short
- **Semantic search**: Finds messages by meaning, not keywords

## API Endpoints

### Get Memory Status
```bash
GET /memory/status/{session_id}?persona_id=luna
```
Response:
```json
{
  "enabled": true,
  "recent_messages": 8,
  "total_stored": 47
}
```

### Toggle Memory
```bash
POST /memory/toggle/{session_id}?enabled=true
```
Response:
```json
{
  "success": true,
  "enabled": true,
  "message": "Memory enabled"
}
```

### Clear Memory
```bash
DELETE /memory/clear/{session_id}
```
Response:
```json
{
  "success": true,
  "message": "Conversation memory cleared"
}
```

## Storage Locations

```
data/memory/
├── chroma/                    # ChromaDB vector database
│   ├── persona_luna/         # Separate collection per persona
│   ├── persona_nova/
│   └── persona_sage/
├── recent_messages.json       # Recent conversation buffer
└── memory_settings.json       # Memory on/off per session
```

## Session IDs

### Web UI
- Format: `web_{timestamp}_{random}`
- Stored in: localStorage
- Persistent across page refreshes
- Example: `web_1728158734_x7k2p9m`

### Telegram
- Format: `telegram_{user_id}`
- Based on Telegram user ID
- Consistent across bot restarts
- Example: `telegram_123456789`

## Configuration

### Memory Settings (per session)
```json
{
  "web_1728158734_x7k2p9m": {
    "enabled": true
  },
  "telegram_123456789": {
    "enabled": false
  }
}
```

### Default Behavior
- **New users**: Memory ON by default
- **Recent messages**: Keep last 20 messages
- **Context window**: 5 recent + 3 relevant
- **Search depth**: Semantic similarity threshold: 0.7

## Benefits

### 🚀 Performance
- Fast retrieval using vector search
- Only relevant context sent to LLM
- Efficient context window usage

### 💾 Privacy
- All data stored locally
- Per-user/session isolation
- Easy to clear/delete

### 🎯 Accuracy
- AI remembers important details
- Better conversation continuity
- Context-aware responses

## Example Usage

### Web UI
```javascript
// User clicks Memory button
toggleMemoryMode() {
  this.memoryEnabled = !this.memoryEnabled;
  // Updates backend and button UI
}

// Sending message with memory
{
  "message": "What did I tell you about my cat?",
  "session_id": "web_1728158734_x7k2p9m",
  "persona_id": "luna"
}
```

### Telegram
```
User: /memory
Bot: 🧠 Memory mode ON! I'll remember our conversations now!

User: I have a cat named Fluffy
Bot: That's adorable! I'll remember that you have a cat named Fluffy.

[Later, even after bot restart]

User: What's my cat's name?
Bot: Your cat's name is Fluffy! 😊
```

## Technical Details

### Dependencies
```
chromadb>=1.1.1
sentence-transformers>=5.1.0
```

### Memory Manager Class
Location: `memory_manager.py`

Key methods:
- `add_message()`: Store user/AI messages
- `get_recent_messages()`: Fetch last N messages
- `search_relevant_context()`: Semantic search
- `build_context()`: Combine recent + relevant
- `is_memory_enabled()`: Check if memory is on
- `set_memory_enabled()`: Toggle memory
- `clear_session()`: Wipe recent messages

### Integration Points

#### main.py
```python
# Import
from memory_manager import memory_manager

# Store messages
memory_manager.add_message(session_id, persona_id, role, content)

# Get context
context = memory_manager.build_context(session_id, persona_id, message)

# Build prompt
full_prompt = f"{system_prompt}\n\n{context}\n\nUser: {message}"
```

#### telegram_bot.py
```python
# Toggle memory
async def memory_command():
    set_memory_mode(user.id, new_mode)
    await client.post(f"/memory/toggle/telegram_{user.id}")
```

#### static/app.js
```javascript
// Toggle button
async toggleMemoryMode() {
  this.memoryEnabled = !this.memoryEnabled;
  await fetch(`${this.apiBase}/memory/toggle/${this.sessionId}`);
}
```

## Comparison with Enterprise Systems

### ChatGPT
- ✅ Similar vector-based approach
- ✅ Per-user memory isolation
- ✅ Semantic search for relevance
- ➕ We add: Local storage, full privacy control

### Claude
- ✅ Conversation threading
- ✅ Context management
- ➕ We add: Toggle on/off, clear functionality

### Character.AI
- ✅ Persona-specific memories
- ✅ Long-term consistency
- ➕ We add: User control over memory

## Future Enhancements

### Planned Features
- [ ] Memory export/import
- [ ] Memory search UI
- [ ] Important facts extraction
- [ ] Auto-summarization
- [ ] Memory analytics dashboard
- [ ] Multi-device sync

### Advanced Options
- [ ] Configurable context window size
- [ ] Memory retention policies
- [ ] Selective memory (forget specific topics)
- [ ] Memory compression for old conversations

## Troubleshooting

### Memory Not Working
1. Check memory toggle is ON
2. Verify backend API is running
3. Check logs: `tail -f outputs/logs/webui.log`
4. Look for: "Memory Manager initialized"

### Context Too Long
- Reduce max_recent or max_relevant in build_context()
- Clear old memories: DELETE /memory/clear/{session_id}

### Slow Responses
- ChromaDB creating embeddings (normal for first messages)
- Subsequent messages are fast (cached embeddings)

## Best Practices

### For Users
- Toggle memory OFF for sensitive/temporary chats
- Use "Clear Chat" to wipe session memory
- Each browser/device has separate memory

### For Developers
- Session IDs must be unique per user/device
- Store both user and AI messages
- Include metadata (timestamp, persona) for filtering
- Handle memory toggle gracefully (don't break mid-chat)

## Credits

Inspired by:
- OpenAI ChatGPT memory system
- Anthropic Claude conversation tracking
- LangChain memory modules
- ChromaDB vector database

Built with ❤️ for Unicorn AI
