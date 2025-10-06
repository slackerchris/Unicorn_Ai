"""
Memory Manager for Unicorn AI
Hybrid memory system using ChromaDB for semantic search + recent message storage
"""

import json
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
import chromadb
from chromadb.config import Settings
from loguru import logger

class MemoryManager:
    def __init__(self, persist_directory: str = "./data/memory"):
        """Initialize the hybrid memory system."""
        self.persist_dir = Path(persist_directory)
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize ChromaDB for semantic search
        self.client = chromadb.Client(Settings(
            persist_directory=str(self.persist_dir / "chroma"),
            anonymized_telemetry=False
        ))
        
        # Recent messages storage (per session)
        self.recent_messages_file = self.persist_dir / "recent_messages.json"
        self.recent_messages = self._load_recent_messages()
        
        # Memory settings per user/session
        self.memory_settings_file = self.persist_dir / "memory_settings.json"
        self.memory_settings = self._load_memory_settings()
        
        logger.info("Memory Manager initialized")
    
    def _load_recent_messages(self) -> Dict:
        """Load recent messages from JSON."""
        if self.recent_messages_file.exists():
            with open(self.recent_messages_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _save_recent_messages(self):
        """Save recent messages to JSON."""
        with open(self.recent_messages_file, 'w') as f:
            json.dump(self.recent_messages, f, indent=2)
    
    def _load_memory_settings(self) -> Dict:
        """Load memory on/off settings per user/session."""
        if self.memory_settings_file.exists():
            with open(self.memory_settings_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _save_memory_settings(self):
        """Save memory settings to JSON."""
        with open(self.memory_settings_file, 'w') as f:
            json.dump(self.memory_settings, f, indent=2)
    
    def is_memory_enabled(self, session_id: str) -> bool:
        """Check if memory is enabled for a session."""
        return self.memory_settings.get(session_id, {}).get("enabled", True)  # Default: ON
    
    def set_memory_enabled(self, session_id: str, enabled: bool):
        """Enable or disable memory for a session."""
        if session_id not in self.memory_settings:
            self.memory_settings[session_id] = {}
        self.memory_settings[session_id]["enabled"] = enabled
        self._save_memory_settings()
        logger.info(f"Memory {'enabled' if enabled else 'disabled'} for session {session_id}")
    
    def get_or_create_collection(self, persona_id: str):
        """Get or create a ChromaDB collection for a persona."""
        collection_name = f"persona_{persona_id}"
        try:
            return self.client.get_or_create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"}
            )
        except Exception as e:
            logger.error(f"Error creating collection for {persona_id}: {e}")
            return None
    
    def add_message(
        self, 
        session_id: str,
        persona_id: str, 
        role: str, 
        content: str,
        metadata: Optional[Dict] = None
    ):
        """
        Add a message to memory (both recent and long-term).
        
        Args:
            session_id: Unique session identifier (user_id for telegram, session_id for web)
            persona_id: Which persona this conversation is with
            role: 'user' or 'assistant'
            content: The message text
            metadata: Additional metadata (timestamp, etc.)
        """
        # Check if memory is enabled for this session
        if not self.is_memory_enabled(session_id):
            logger.debug(f"Memory disabled for session {session_id}, not storing message")
            return
        
        timestamp = datetime.now().isoformat()
        message = {
            "role": role,
            "content": content,
            "timestamp": timestamp,
            "persona_id": persona_id
        }
        
        if metadata:
            message.update(metadata)
        
        # Add to recent messages (keep last 20 per session)
        if session_id not in self.recent_messages:
            self.recent_messages[session_id] = []
        
        self.recent_messages[session_id].append(message)
        
        # Keep only last 20 messages for recent context
        if len(self.recent_messages[session_id]) > 20:
            self.recent_messages[session_id] = self.recent_messages[session_id][-20:]
        
        self._save_recent_messages()
        
        # Add to ChromaDB for semantic search (long-term memory)
        collection = self.get_or_create_collection(persona_id)
        if collection:
            try:
                doc_id = f"{session_id}_{timestamp}"
                collection.add(
                    documents=[content],
                    ids=[doc_id],
                    metadatas=[{
                        "session_id": session_id,
                        "role": role,
                        "timestamp": timestamp,
                        "persona_id": persona_id
                    }]
                )
            except Exception as e:
                logger.error(f"Error adding message to ChromaDB: {e}")
    
    def get_recent_messages(self, session_id: str, n: int = 10) -> List[Dict]:
        """Get the N most recent messages for a session."""
        if not self.is_memory_enabled(session_id):
            return []
        
        messages = self.recent_messages.get(session_id, [])
        return messages[-n:] if messages else []
    
    def search_relevant_context(
        self, 
        session_id: str,
        persona_id: str, 
        query: str, 
        n_results: int = 5
    ) -> List[Dict]:
        """
        Search for relevant past conversations using semantic similarity.
        
        Args:
            session_id: Session to search within
            persona_id: Persona to search conversations with
            query: Current user message to find relevant context for
            n_results: Number of relevant messages to return
        
        Returns:
            List of relevant past messages
        """
        if not self.is_memory_enabled(session_id):
            return []
        
        collection = self.get_or_create_collection(persona_id)
        if not collection:
            return []
        
        try:
            results = collection.query(
                query_texts=[query],
                n_results=n_results,
                where={"session_id": session_id}  # Only search within this session
            )
            
            if results and results['documents'] and results['documents'][0]:
                relevant_messages = []
                for i, doc in enumerate(results['documents'][0]):
                    metadata = results['metadatas'][0][i]
                    relevant_messages.append({
                        "content": doc,
                        "role": metadata.get("role"),
                        "timestamp": metadata.get("timestamp")
                    })
                return relevant_messages
        except Exception as e:
            logger.error(f"Error searching ChromaDB: {e}")
        
        return []
    
    def build_context(
        self,
        session_id: str,
        persona_id: str,
        current_message: str,
        max_recent: int = 5,
        max_relevant: int = 3
    ) -> str:
        """
        Build conversation context using hybrid approach.
        
        Returns formatted context string with:
        - Recent messages (last N from current session)
        - Relevant past context (semantic search)
        """
        if not self.is_memory_enabled(session_id):
            return ""
        
        context_parts = []
        
        # Get recent messages
        recent = self.get_recent_messages(session_id, max_recent)
        if recent:
            context_parts.append("--- Recent Conversation ---")
            for msg in recent:
                role = "User" if msg["role"] == "user" else msg.get("persona_id", "Assistant")
                context_parts.append(f"{role}: {msg['content']}")
        
        # Get semantically relevant past context (skip if we have recent messages from same topic)
        if len(recent) < 3:  # Only search if conversation is new/short
            relevant = self.search_relevant_context(session_id, persona_id, current_message, max_relevant)
            if relevant:
                context_parts.append("\n--- Relevant Past Context ---")
                for msg in relevant:
                    role = "User" if msg["role"] == "user" else "Assistant"
                    context_parts.append(f"{role}: {msg['content']}")
        
        return "\n".join(context_parts) if context_parts else ""
    
    def clear_session(self, session_id: str):
        """Clear recent messages for a session (like "Clear Chat" button)."""
        if session_id in self.recent_messages:
            del self.recent_messages[session_id]
            self._save_recent_messages()
            logger.info(f"Cleared recent messages for session {session_id}")
    
    def get_memory_stats(self, session_id: str, persona_id: str) -> Dict:
        """Get memory statistics for a session."""
        stats = {
            "enabled": self.is_memory_enabled(session_id),
            "recent_messages": len(self.recent_messages.get(session_id, [])),
            "total_stored": 0
        }
        
        collection = self.get_or_create_collection(persona_id)
        if collection:
            try:
                # Count messages for this session
                results = collection.get(where={"session_id": session_id})
                stats["total_stored"] = len(results['ids']) if results and 'ids' in results else 0
            except Exception as e:
                logger.error(f"Error getting memory stats: {e}")
        
        return stats


# Global instance
memory_manager = MemoryManager()
