"""
Graph RAG Memory Module for OmniLive AI
Implements structured memory with graph-based retrieval for personalized coaching.
"""
import json
import os
import time
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Try to import Firebase, fallback to local JSON storage
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("Firebase not available, using local JSON storage")


class GraphRAGMemory:
    """
    Graph-based Retrieval-Augmented Generation memory.
    Stores and retrieves user performance trends, coaching history,
    weak areas, and mode usage patterns.
    """

    def __init__(self):
        self.local_store = {}
        self.db = None
        self._init_storage()

    def _init_storage(self):
        """Initialize Firestore or fallback to local storage."""
        if FIREBASE_AVAILABLE:
            try:
                cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
                if cred_path and os.path.exists(cred_path):
                    if not firebase_admin._apps:
                        cred = credentials.Certificate(cred_path)
                        firebase_admin.initialize_app(cred)
                    self.db = firestore.client()
                    logger.info("Firestore initialized successfully")
                else:
                    logger.warning("No Firebase credentials found, using local storage")
            except Exception as e:
                logger.warning(f"Firestore init failed: {e}, using local storage")

    async def save_session(self, session_id: str, transcript: str):
        """
        Save session data to graph memory.
        Extracts key insights: topics, performance, weaknesses, improvements.
        """
        session_data = {
            "session_id": session_id,
            "timestamp": time.time(),
            "transcript": transcript[:2000],  # Truncate to save space
            "nodes": self._extract_nodes(transcript),
            "edges": self._extract_edges(transcript),
        }

        if self.db:
            try:
                doc_ref = self.db.collection("sessions").document(session_id)
                doc_ref.set(session_data)
                logger.info(f"Session saved to Firestore: {session_id}")
            except Exception as e:
                logger.error(f"Firestore save failed: {e}")
                self.local_store[session_id] = session_data
        else:
            self.local_store[session_id] = session_data

    async def retrieve_context(self, session_id: str) -> Optional[str]:
        """
        Retrieve and format relevant memory context for RAG.
        Returns a structured summary of past performance and coaching.
        """
        sessions = []

        if self.db:
            try:
                # Get last 5 sessions for this user prefix
                user_prefix = session_id.split("_")[0] if "_" in session_id else session_id
                docs = (
                    self.db.collection("sessions")
                    .order_by("timestamp", direction=firestore.Query.DESCENDING)
                    .limit(5)
                    .stream()
                )
                sessions = [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Firestore retrieval failed: {e}")

        # Fallback to local
        if not sessions and self.local_store:
            sessions = list(self.local_store.values())[-5:]

        if not sessions:
            return None

        return self._format_context(sessions)

    def _extract_nodes(self, transcript: str) -> dict:
        """Extract graph nodes: topics, entities, performance markers."""
        nodes = {
            "topics": [],
            "performance_markers": [],
            "weak_areas": [],
            "strengths": [],
        }

        keywords = {
            "performance_markers": ["confidence", "speed", "clarity", "sentiment", "score"],
            "weak_areas": ["improve", "work on", "struggling", "weak", "need to"],
            "strengths": ["great", "excellent", "strong", "well done", "perfect"],
        }

        transcript_lower = transcript.lower()
        for category, kws in keywords.items():
            for kw in kws:
                if kw in transcript_lower:
                    nodes[category].append(kw)

        return nodes

    def _extract_edges(self, transcript: str) -> list:
        """Extract relationships between nodes."""
        edges = []
        # Simple heuristic: look for cause-effect patterns
        patterns = [
            ("speaking_speed", "confidence"),
            ("clarity", "understanding"),
            ("practice", "improvement"),
        ]
        for src, tgt in patterns:
            transcript_lower = transcript.lower()
            if src in transcript_lower and tgt in transcript_lower:
                edges.append({"from": src, "to": tgt, "relation": "affects"})
        return edges

    def _format_context(self, sessions: list) -> str:
        """Format session history into a context string for the LLM."""
        context_parts = ["[PAST COACHING SESSIONS]"]

        for i, s in enumerate(sessions[:3], 1):
            nodes = s.get("nodes", {})
            ts = s.get("timestamp", 0)
            time_str = time.strftime("%Y-%m-%d", time.localtime(ts)) if ts else "unknown"
            context_parts.append(f"\nSession {i} ({time_str}):")

            if nodes.get("weak_areas"):
                context_parts.append(f"  Weak areas: {', '.join(nodes['weak_areas'][:3])}")
            if nodes.get("strengths"):
                context_parts.append(f"  Strengths: {', '.join(nodes['strengths'][:3])}")
            if nodes.get("performance_markers"):
                context_parts.append(f"  Metrics noted: {', '.join(nodes['performance_markers'][:3])}")

        return "\n".join(context_parts)

    async def clear_session(self, session_id: str):
        """Clear memory for a session."""
        if self.db:
            try:
                self.db.collection("sessions").document(session_id).delete()
            except Exception as e:
                logger.error(f"Firestore delete failed: {e}")
        if session_id in self.local_store:
            del self.local_store[session_id]
