import { useState, useEffect } from "react";

export default function MemoryPanel({ sessionId, backendUrl }) {
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cleared, setCleared] = useState(false);

  const fetchMemory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/memory/${sessionId}`);
      const data = await res.json();
      setMemory(data);
    } catch (e) {
      setMemory({ error: "Could not fetch memory — is the backend running?" });
    }
    setLoading(false);
  };

  const clearMemory = async () => {
    try {
      await fetch(`${backendUrl}/api/memory/${sessionId}`, { method: "DELETE" });
      setMemory(null);
      setCleared(true);
      setTimeout(() => setCleared(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, [sessionId]);

  return (
    <div className="memory-panel">
      <div className="memory-header">
        <h2>🧠 Graph RAG Memory Bank</h2>
        <div className="memory-actions">
          <button className="btn btn-sm" onClick={fetchMemory} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button className="btn btn-sm btn-danger" onClick={clearMemory}>
            Clear Memory
          </button>
        </div>
      </div>

      {cleared && <div className="memory-alert">✅ Memory cleared</div>}

      <div className="memory-description">
        <p>
          The Graph RAG Memory Bank stores structured context from past sessions —
          tracking your coaching history, weak areas, strengths, and improvement patterns.
          This context is retrieved automatically to personalize each session.
        </p>
      </div>

      <div className="memory-graph-visual">
        <div className="graph-node center-node">◈ Session<br />{sessionId.slice(-8)}</div>
        {["History", "Weaknesses", "Strengths", "Modes", "Performance"].map((n, i) => (
          <div key={n} className={`graph-node satellite-node node-${i}`}>{n}</div>
        ))}
      </div>

      {memory && !memory.error && (
        <div className="memory-context">
          <div className="memory-context-label">Stored Context:</div>
          <pre className="memory-pre">
            {memory.context || "No memory stored for this session yet.\nStart a session to begin building memory."}
          </pre>
        </div>
      )}

      {memory?.error && (
        <div className="memory-alert warning">{memory.error}</div>
      )}
    </div>
  );
}
