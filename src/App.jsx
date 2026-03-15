import { useState, useRef, useEffect, useCallback } from "react";
import LiveSession from "./components/LiveSession";
import MonitoringDashboard from "./components/MonitoringDashboard";
import AvatarDisplay from "./components/AvatarDisplay";
import MemoryPanel from "./components/MemoryPanel";
import Header from "./components/Header";
import "./styles/global.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const WS_URL = BACKEND_URL.replace("http", "ws").replace("https", "wss");

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [sessionId] = useState(generateSessionId);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [metrics, setMetrics] = useState({
    confidence: 0.72,
    sentiment: "neutral",
    sentiment_score: 0.5,
    speech_speed_wpm: 130,
    avg_confidence: 0.72,
    confidence_trend: [],
    sentiment_trend: [],
    improvement_score: 0,
    total_exchanges: 0,
  });
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);
  const [activeTab, setActiveTab] = useState("session"); // session | dashboard | memory

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioProcessorRef = useRef(null);
  const videoRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  // Connect WebSocket
  const connect = useCallback(async () => {
    try {
      const ws = new WebSocket(`${WS_URL}/ws/live/${sessionId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        addTranscript("system", "🟢 Connected to OmniLive AI");
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsListening(false);
        addTranscript("system", "🔴 Disconnected");
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        addTranscript("system", "⚠️ Connection error — check backend is running");
      };
    } catch (err) {
      console.error("Connect error:", err);
    }
  }, [sessionId]);

  const handleServerMessage = useCallback((data) => {
    if (data.type === "text") {
      addTranscript("ai", data.content);
      if (data.metrics) {
        setMetrics((prev) => ({
          ...prev,
          ...data.metrics,
          confidence_trend: [...(prev.confidence_trend || []), data.metrics.confidence].slice(-20),
          sentiment_trend: [...(prev.sentiment_trend || []), data.metrics.sentiment_score].slice(-20),
          total_exchanges: (prev.total_exchanges || 0) + 1,
        }));
      }
    } else if (data.type === "audio") {
      // Queue audio for playback
      playAudioChunk(data.audio);
      setAvatarSpeaking(true);
    } else if (data.type === "interrupted") {
      addTranscript("system", "↩️ Interrupted");
      setAvatarSpeaking(false);
      audioQueueRef.current = [];
    } else if (data.type === "error") {
      addTranscript("system", `❌ Error: ${data.message}`);
    }
  }, []);

  const addTranscript = (role, content) => {
    setTranscript((prev) => [
      ...prev,
      { role, content, timestamp: Date.now() },
    ]);
  };

  // Start microphone + audio streaming
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      mediaStreamRef.current = stream;

      // Setup video display
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Audio context for PCM capture
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = convertFloat32ToInt16(inputData);
        const b64 = arrayBufferToBase64(pcmData.buffer);
        wsRef.current.send(JSON.stringify({ type: "audio", audio: b64 }));
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      audioProcessorRef.current = processor;

      // Video frame capture every 1s
      frameIntervalRef.current = setInterval(() => {
        captureAndSendFrame();
      }, 1000);

      setIsListening(true);
      addTranscript("system", "🎤 Microphone and camera active");
    } catch (err) {
      console.error("Media error:", err);
      addTranscript("system", "⚠️ Could not access microphone/camera: " + err.message);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (audioProcessorRef.current) {
      audioProcessorRef.current.disconnect();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }
    setIsListening(false);
    setAvatarSpeaking(false);
    addTranscript("system", "⏹️ Stopped listening");
  }, []);

  const captureAndSendFrame = useCallback(() => {
    if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 320, 240);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    const base64 = dataUrl.split(",")[1];
    wsRef.current.send(JSON.stringify({ type: "video_frame", frame: base64 }));
  }, []);

  const sendTextMessage = useCallback((text) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addTranscript("system", "⚠️ Not connected. Click Connect first.");
      return;
    }
    wsRef.current.send(JSON.stringify({ type: "text", content: text }));
    addTranscript("user", text);
  }, []);

  const sendInterrupt = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "interrupt" }));
      setAvatarSpeaking(false);
      audioQueueRef.current = [];
    }
  }, []);

  // Audio playback
  const playAudioChunk = useCallback(async (b64Audio) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      const audioData = base64ToArrayBuffer(b64Audio);
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData).catch(() => null);
      if (!audioBuffer) return;

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      source.onended = () => {
        setAvatarSpeaking(false);
      };
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    stopListening();
    if (wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: "end_session",
          transcript: transcript.map((t) => `${t.role}: ${t.content}`).join("\n"),
        })
      );
      wsRef.current.close();
    }
  }, [stopListening, transcript]);

  return (
    <div className="app-root">
      <Header
        isConnected={isConnected}
        onConnect={connect}
        onDisconnect={disconnect}
        sessionId={sessionId}
      />

      <nav className="tab-nav">
        {["session", "dashboard", "memory"].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "session" && "🎙️ Live Session"}
            {tab === "dashboard" && "📊 Monitoring"}
            {tab === "memory" && "🧠 Memory"}
          </button>
        ))}
      </nav>

      <main className="main-content">
        {activeTab === "session" && (
          <div className="session-layout">
            <div className="session-left">
              <AvatarDisplay isSpeaking={avatarSpeaking} />
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="camera-preview"
              />
            </div>
            <div className="session-right">
              <LiveSession
                transcript={transcript}
                isListening={isListening}
                isConnected={isConnected}
                onStartListening={startListening}
                onStopListening={stopListening}
                onSendText={sendTextMessage}
                onInterrupt={sendInterrupt}
                metrics={metrics}
              />
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <MonitoringDashboard metrics={metrics} sessionId={sessionId} />
        )}

        {activeTab === "memory" && (
          <MemoryPanel sessionId={sessionId} backendUrl={BACKEND_URL} />
        )}
      </main>
    </div>
  );
}

// Utilities
function convertFloat32ToInt16(buffer) {
  const output = new Int16Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buffer;
}
