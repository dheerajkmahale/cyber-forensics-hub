import React, { useEffect, useRef } from "react";

interface ThreatRadarChartProps {
  score: number;
  reasons: string[];
}

export const ThreatRadarChart: React.FC<ThreatRadarChartProps> = ({ score, reasons }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Map reasons/score to five specific risk vectors
  const structuring = reasons.some(r => r.toLowerCase().includes("smurf") || r.toLowerCase().includes("structur")) ? 95 : (score > 60 ? 55 : 20);
  const velocity = reasons.some(r => r.toLowerCase().includes("velocity") || r.toLowerCase().includes("rapid")) ? 90 : (score > 70 ? 75 : 35);
  const layering = reasons.some(r => r.toLowerCase().includes("layer") || score > 80) ? 98 : (score > 50 ? 60 : 30);
  const offshore = reasons.some(r => r.toLowerCase().includes("offshore") || r.toLowerCase().includes("dubai")) ? 95 : (score > 85 ? 80 : 15);
  const association = reasons.some(r => r.toLowerCase().includes("ring") || r.toLowerCase().includes("cycle") || r.toLowerCase().includes("partner")) ? 92 : (score > 40 ? 50 : 25);

  const vectors = [
    { label: "STRUCTURING", val: structuring },
    { label: "VELOCITY", val: velocity },
    { label: "LAYERING", val: layering },
    { label: "OFFSHORE EXP", val: offshore },
    { label: "LOOP ASSOC", val: association },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high PPI screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 240 * dpr;
    canvas.height = 240 * dpr;
    ctx.scale(dpr, dpr);

    const width = 240;
    const height = 240;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 80;
    const count = vectors.length;

    // Draw background concentric hexagons/webs
    ctx.clearRect(0, 0, width, height);
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Draw spiderweb layers
    for (let level = 1; level <= 4; level++) {
      const r = (radius / 4) * level;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `hsla(155, 100%, 50%, ${level * 0.12})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Draw axes & labels
    vectors.forEach((v, i) => {
      const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      // Draw axis lines
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "rgba(100, 116, 139, 0.25)";
      ctx.stroke();

      // Position label text nicely
      const labelDistance = radius + 22;
      const lx = cx + labelDistance * Math.cos(angle);
      const ly = cy + labelDistance * Math.sin(angle);

      ctx.fillStyle = "hsl(155 100% 70%)";
      ctx.fillText(v.label, lx, ly);
    });

    // Draw active Threat Polygon
    ctx.beginPath();
    vectors.forEach((v, i) => {
      const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
      const currentRadius = (radius * v.val) / 100;
      const x = cx + currentRadius * Math.cos(angle);
      const y = cy + currentRadius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Fill glowing radar shape
    ctx.fillStyle = "hsla(155, 100%, 50%, 0.15)";
    ctx.fill();

    // Outline shape
    ctx.strokeStyle = "hsl(155 100% 50%)";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Dot vertices
    vectors.forEach((v, i) => {
      const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
      const currentRadius = (radius * v.val) / 100;
      const x = cx + currentRadius * Math.cos(angle);
      const y = cy + currentRadius * Math.sin(angle);

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "hsl(185 100% 55%)";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

  }, [score, reasons]);

  return (
    <div className="flex flex-col items-center justify-center p-3 border border-border/30 bg-slate-950/40 rounded-lg">
      <span className="text-[9px] font-mono tracking-widest text-muted-foreground mb-1 block uppercase">// RISK VECTOR RADAR SCAN</span>
      <canvas ref={canvasRef} style={{ width: "240px", height: "240px" }} />
    </div>
  );
};
