import { useEffect, useRef } from "react";

export default function MonitoringDashboard({ metrics, sessionId }) {
  const confChartRef = useRef(null);
  const sentChartRef = useRef(null);

  const drawLineChart = (canvas, data, color, label) => {
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#110808";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (H / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Plot
    const points = data.slice(-20);
    const minV = Math.min(...points);
    const maxV = Math.max(...points);
    const range = maxV - minV || 1;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((v, i) => {
      const x = (i / (points.length - 1)) * W;
      const y = H - ((v - minV) / range) * (H - 20) - 10;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = color.replace(")", ",0.15)").replace("rgb", "rgba");
    ctx.fill();

    // Label
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px monospace";
    ctx.fillText(label, 8, 16);
  };

  useEffect(() => {
    drawLineChart(confChartRef.current, metrics.confidence_trend, "rgb(255,80,80)", "Confidence");
    drawLineChart(sentChartRef.current, metrics.sentiment_trend, "rgb(80,200,120)", "Sentiment");
  }, [metrics]);

  const confPercent = Math.round((metrics.avg_confidence || metrics.confidence || 0.7) * 100);
  const improvScore = metrics.improvement_score || 0;

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">Real-Time Monitoring</h2>

      <div className="dashboard-grid">
        {/* Confidence Gauge */}
        <div className="dash-card">
          <div className="dash-card-label">Confidence Score</div>
          <div className="gauge-container">
            <svg viewBox="0 0 120 70" className="gauge-svg">
              <path d="M 10 65 A 55 55 0 0 1 110 65" fill="none" stroke="#2a0a0a" strokeWidth="12" />
              <path
                d="M 10 65 A 55 55 0 0 1 110 65"
                fill="none"
                stroke="#cc2222"
                strokeWidth="12"
                strokeDasharray={`${(confPercent / 100) * 173} 173`}
                strokeLinecap="round"
              />
              <text x="60" y="62" textAnchor="middle" fill="#ff8888" fontSize="18" fontWeight="bold">
                {confPercent}%
              </text>
            </svg>
          </div>
        </div>

        {/* Speech Speed */}
        <div className="dash-card">
          <div className="dash-card-label">Speech Speed</div>
          <div className="big-number">{metrics.speech_speed_wpm || 130}</div>
          <div className="big-number-unit">words/min</div>
          <div className={`speed-tag ${(metrics.speech_speed_wpm || 130) > 160 ? "fast" : (metrics.speech_speed_wpm || 130) < 100 ? "slow" : "good"}`}>
            {(metrics.speech_speed_wpm || 130) > 160 ? "Too Fast" : (metrics.speech_speed_wpm || 130) < 100 ? "Too Slow" : "Good Pace"}
          </div>
        </div>

        {/* Sentiment */}
        <div className="dash-card">
          <div className="dash-card-label">Sentiment</div>
          <div className={`sentiment-display ${metrics.sentiment || "neutral"}`}>
            {metrics.sentiment === "positive" ? "😊" : metrics.sentiment === "negative" ? "😟" : "😐"}
            <span>{metrics.sentiment || "neutral"}</span>
          </div>
          <div className="sentiment-score">
            Score: {Math.round((metrics.sentiment_score || 0.5) * 100)}%
          </div>
        </div>

        {/* Exchanges */}
        <div className="dash-card">
          <div className="dash-card-label">Total Exchanges</div>
          <div className="big-number">{metrics.total_exchanges || 0}</div>
          <div className="big-number-unit">interactions</div>
          <div className={`improvement-badge ${improvScore > 0 ? "up" : improvScore < 0 ? "down" : "flat"}`}>
            {improvScore > 0 ? `↑ +${improvScore}%` : improvScore < 0 ? `↓ ${improvScore}%` : "→ Steady"}
          </div>
        </div>

        {/* Confidence Trend Chart */}
        <div className="dash-card wide">
          <div className="dash-card-label">Confidence Trend</div>
          <canvas ref={confChartRef} width={480} height={100} className="trend-chart" />
        </div>

        {/* Sentiment Trend Chart */}
        <div className="dash-card wide">
          <div className="dash-card-label">Sentiment Trend</div>
          <canvas ref={sentChartRef} width={480} height={100} className="trend-chart" />
        </div>
      </div>
    </div>
  );
}
