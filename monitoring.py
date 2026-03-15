"""
Real-Time Monitoring Agent for OmniLive AI
Tracks confidence, speech speed, sentiment trends, and performance metrics.
"""
import re
import time
from typing import Dict, Any
from collections import deque


class MonitoringAgent:
    """
    Monitors live session performance metrics:
    - Confidence score (keyword analysis)
    - Speech speed (words per second estimate)
    - Sentiment trend (positive/negative/neutral)
    - Performance improvement graph data
    """

    def __init__(self):
        self.sessions: Dict[str, dict] = {}
        self.positive_words = {
            "great", "excellent", "good", "perfect", "well", "clear",
            "confident", "strong", "improved", "better", "awesome"
        }
        self.negative_words = {
            "struggle", "weak", "poor", "bad", "nervous", "confused",
            "unclear", "hesitant", "slow", "uncertain"
        }
        self.confidence_words = {
            "definitely", "absolutely", "certainly", "clearly", "confident",
            "sure", "know", "understand", "i think", "maybe", "perhaps", "not sure"
        }

    def analyze_text(self, text: str) -> Dict[str, Any]:
        """Analyze text response for coaching metrics."""
        words = text.lower().split()
        word_count = len(words)

        # Sentiment analysis
        pos_count = sum(1 for w in words if w in self.positive_words)
        neg_count = sum(1 for w in words if w in self.negative_words)

        if pos_count > neg_count:
            sentiment = "positive"
            sentiment_score = min(0.5 + (pos_count - neg_count) * 0.1, 1.0)
        elif neg_count > pos_count:
            sentiment = "negative"
            sentiment_score = max(0.5 - (neg_count - pos_count) * 0.1, 0.0)
        else:
            sentiment = "neutral"
            sentiment_score = 0.5

        # Confidence scoring based on language markers
        confident_markers = ["definitely", "absolutely", "certainly", "clearly"]
        uncertain_markers = ["i think", "maybe", "perhaps", "not sure", "might"]

        conf_pos = sum(1 for m in confident_markers if m in text.lower())
        conf_neg = sum(1 for m in uncertain_markers if m in text.lower())
        confidence = max(0.3, min(0.95, 0.7 + conf_pos * 0.1 - conf_neg * 0.15))

        # Estimated reading speed (words per minute indicator)
        # Average coaching response: 120-180 wpm
        speech_speed = min(180, max(80, word_count * 12))  # rough estimate

        return {
            "confidence": round(confidence, 2),
            "sentiment": sentiment,
            "sentiment_score": round(sentiment_score, 2),
            "speech_speed_wpm": speech_speed,
            "word_count": word_count,
            "timestamp": time.time(),
        }

    def update_session_metrics(self, session_id: str, metrics: Dict[str, Any]):
        """Update running metrics for a session."""
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "confidence_history": deque(maxlen=20),
                "sentiment_history": deque(maxlen=20),
                "speed_history": deque(maxlen=20),
                "start_time": time.time(),
                "total_exchanges": 0,
            }

        s = self.sessions[session_id]
        s["confidence_history"].append(metrics.get("confidence", 0.7))
        s["sentiment_history"].append(metrics.get("sentiment_score", 0.5))
        s["speed_history"].append(metrics.get("speech_speed_wpm", 120))
        s["total_exchanges"] += 1

    def get_session_metrics(self, session_id: str) -> Dict[str, Any]:
        """Get aggregated metrics for a session."""
        if session_id not in self.sessions:
            return self._default_metrics()

        s = self.sessions[session_id]
        conf_hist = list(s["confidence_history"])
        sent_hist = list(s["sentiment_history"])
        speed_hist = list(s["speed_history"])

        return {
            "avg_confidence": round(sum(conf_hist) / len(conf_hist), 2) if conf_hist else 0.7,
            "avg_sentiment": round(sum(sent_hist) / len(sent_hist), 2) if sent_hist else 0.5,
            "avg_speech_speed": round(sum(speed_hist) / len(speed_hist), 0) if speed_hist else 120,
            "confidence_trend": conf_hist[-10:],
            "sentiment_trend": sent_hist[-10:],
            "total_exchanges": s["total_exchanges"],
            "session_duration": round(time.time() - s["start_time"], 0),
            "improvement_score": self._calculate_improvement(conf_hist),
        }

    def _calculate_improvement(self, history: list) -> float:
        """Calculate improvement score by comparing first and last quarters."""
        if len(history) < 4:
            return 0.0
        first_quarter = sum(history[:len(history)//4]) / (len(history)//4)
        last_quarter = sum(history[-len(history)//4:]) / (len(history)//4)
        return round((last_quarter - first_quarter) * 100, 1)

    def _default_metrics(self) -> Dict[str, Any]:
        return {
            "avg_confidence": 0.70,
            "avg_sentiment": 0.60,
            "avg_speech_speed": 130,
            "confidence_trend": [],
            "sentiment_trend": [],
            "total_exchanges": 0,
            "session_duration": 0,
            "improvement_score": 0.0,
        }
