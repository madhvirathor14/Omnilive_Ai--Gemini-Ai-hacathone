import { useState, useRef, useEffect } from "react";

export default function LiveSession({
  transcript,
  isListening,
  isConnected,
  onStartListening,
  onStopListening,
  onSendText,
  onInterrupt,
  metrics,
}) {
  const [textInput, setTextInput] = useState("");
  const transcriptEndRef = useRef(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const handleSend = () => {
    if (textInput.trim()) {
      onSendText(textInput.trim());
      setTextInput("");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="live-session">
      {/* Quick metrics bar */}
      <div className="metrics-bar">
        <div className="metric-chip">
          <span className="metric-label">Confidence</span>
          <span className="metric-value">
            {Math.round((metrics.confidence || 0.7) * 100)}%
          </span>
          <div
            className="metric-fill"
            style={{ width: `${(metrics.confidence || 0.7) * 100}%` }}
          />
        </div>
        <div className="metric-chip">
          <span className="metric-label">Sentiment</span>
          <span
            className={`sentiment-badge ${metrics.sentiment || "neutral"}`}
          >
            {metrics.sentiment || "neutral"}
          </span>
        </div>
        <div className="metric-chip">
          <span className="metric-label">Speed</span>
          <span className="metric-value">{metrics.speech_speed_wpm || 130} wpm</span>
        </div>
      </div>

      {/* Transcript */}
      <div className="transcript-container">
        {transcript.length === 0 && (
          <div className="transcript-empty">
            <p>Connect and start speaking to begin your session...</p>
            <p className="hint">🎙️ Voice · 📷 Camera · ⌨️ Text — all supported</p>
          </div>
        )}
        {transcript.map((item, i) => (
          <div key={i} className={`transcript-message ${item.role}`}>
            <span className="msg-role">
              {item.role === "ai" ? "◈ OmniLive" : item.role === "user" ? "You" : "System"}
            </span>
            <p className="msg-content">{item.content}</p>
          </div>
        ))}
        <div ref={transcriptEndRef} />
      </div>

      {/* Controls */}
      <div className="session-controls">
        <div className="voice-controls">
          {!isListening ? (
            <button
              className="btn btn-mic"
              onClick={onStartListening}
              disabled={!isConnected}
              title="Start voice + camera"
            >
              🎙️ Start
            </button>
          ) : (
            <>
              <button className="btn btn-mic-stop" onClick={onStopListening}>
                ⏹️ Stop
              </button>
              <button className="btn btn-interrupt" onClick={onInterrupt}>
                ✋ Interrupt
              </button>
            </>
          )}
        </div>

        <div className="text-input-row">
          <textarea
            className="text-input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message... (Enter to send)"
            rows={2}
            disabled={!isConnected}
          />
          <button
            className="btn btn-send"
            onClick={handleSend}
            disabled={!isConnected || !textInput.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
