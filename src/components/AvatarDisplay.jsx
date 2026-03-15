import { useEffect, useRef } from "react";

export default function AvatarDisplay({ isSpeaking }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    const draw = () => {
      phaseRef.current += isSpeaking ? 0.08 : 0.02;
      const phase = phaseRef.current;

      ctx.clearRect(0, 0, W, H);

      // Background
      const bg = ctx.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2);
      bg.addColorStop(0, "#1a0a0a");
      bg.addColorStop(1, "#0d0d0d");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Outer ring
      const outerPulse = isSpeaking ? 1 + Math.sin(phase * 2) * 0.08 : 1;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 85 * outerPulse, 0, Math.PI * 2);
      ctx.strokeStyle = isSpeaking ? `rgba(255,60,60,${0.4 + Math.sin(phase) * 0.3})` : "rgba(180,30,30,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Avatar circle
      const grad = ctx.createRadialGradient(W / 2 - 15, H / 2 - 20, 5, W / 2, H / 2, 70);
      grad.addColorStop(0, isSpeaking ? "#cc2222" : "#991111");
      grad.addColorStop(0.6, "#550000");
      grad.addColorStop(1, "#220000");
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 70, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Symbol
      ctx.font = "bold 36px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isSpeaking ? `rgba(255,180,180,${0.7 + Math.sin(phase * 3) * 0.3})` : "rgba(200,100,100,0.8)";
      ctx.fillText("◈", W / 2, H / 2);

      // Sound waves when speaking
      if (isSpeaking) {
        for (let ring = 1; ring <= 3; ring++) {
          const r = 90 + ring * 18 + Math.sin(phase + ring) * 6;
          const alpha = Math.max(0, 0.5 - ring * 0.12 + Math.sin(phase + ring) * 0.1);
          ctx.beginPath();
          ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,80,80,${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Status indicator
      ctx.beginPath();
      ctx.arc(W / 2 + 48, H / 2 + 48, 8, 0, Math.PI * 2);
      ctx.fillStyle = isSpeaking
        ? `rgba(255,100,100,${0.6 + Math.sin(phase * 4) * 0.4})`
        : "rgba(100,200,100,0.7)";
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isSpeaking]);

  return (
    <div className="avatar-wrapper">
      <canvas ref={canvasRef} width={200} height={200} className="avatar-canvas" />
      <div className="avatar-label">
        <span>{isSpeaking ? "Speaking..." : "Listening"}</span>
      </div>
    </div>
  );
}
