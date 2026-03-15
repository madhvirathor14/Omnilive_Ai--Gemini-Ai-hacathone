export default function Header({ isConnected, onConnect, onDisconnect, sessionId }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="brand-icon">◈</span>
        <span className="brand-name">OmniLive AI</span>
        <span className="brand-tag">Real-Time Multimodal Agent</span>
      </div>
      <div className="header-actions">
        <span className={`status-dot ${isConnected ? "connected" : "disconnected"}`} />
        <span className="status-text">{isConnected ? "Live" : "Offline"}</span>
        {!isConnected ? (
          <button className="btn btn-primary" onClick={onConnect}>
            Connect
          </button>
        ) : (
          <button className="btn btn-danger" onClick={onDisconnect}>
            Disconnect
          </button>
        )}
      </div>
    </header>
  );
}
