import React, { useEffect, useState, useMemo } from "react";
import { Transaction, GraphNode } from "@/types/fraud";
import { maskSensitiveValue } from "@/lib/privacy";
import { Map, AlertTriangle, Shield, Globe, Compass, RefreshCw } from "lucide-react";

interface GeoTraceVisualizationProps {
  nodes: GraphNode[];
  edges: any[];
  privacyMode?: boolean;
}

// Preset geo locations representing forensic investigator hubs/suspicious transaction terminals
const FORENSIC_HUBS = [
  { id: "Delhi", lat: 28.6139, lng: 77.2090, label: "IN-DELHI (Core Terminal)" },
  { id: "Mumbai", lat: 19.0760, lng: 72.8777, label: "IN-MUMBAI (Escrow Node)" },
  { id: "Bangalore", lat: 12.9716, lng: 77.5946, label: "IN-BLR (Tech Endpoint)" },
  { id: "Dubai", lat: 25.2048, lng: 55.2708, label: "AE-DUBAI (Offshore Router)" },
  { id: "Singapore", lat: 1.3521, lng: 103.8198, label: "SG-SINGAPORE (Layer Hub)" },
  { id: "Cayman", lat: 19.3133, lng: -81.2515, label: "KY-CAYMAN (Shell Terminal)" },
  { id: "London", lat: 51.5074, lng: -0.1278, label: "UK-LONDON (Clearing Node)" },
];

export const GeoTraceVisualization: React.FC<GeoTraceVisualizationProps> = ({
  nodes,
  edges,
  privacyMode = true,
}) => {
  const [activePaths, setActivePaths] = useState<{
    id: string;
    from: typeof FORENSIC_HUBS[0];
    to: typeof FORENSIC_HUBS[0];
    amount: number;
    sender: string;
    receiver: string;
  }[]>([]);

  // Dynamically map nodes/edges to fake global routing hops to build high-fidelity tactical maps
  useEffect(() => {
    if (!edges || edges.length === 0) return;

    // Pick last 8 transaction edges to display on the active routing matrix
    const recentEdges = edges.slice(-8);
    const paths = recentEdges.map((e, index) => {
      // Deterministically pick locations based on sender/receiver ID hashes
      const hash1 = e.source.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const hash2 = e.target.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);

      const fromLoc = FORENSIC_HUBS[hash1 % FORENSIC_HUBS.length];
      let toLoc = FORENSIC_HUBS[hash2 % FORENSIC_HUBS.length];
      if (fromLoc.id === toLoc.id) {
        toLoc = FORENSIC_HUBS[(hash2 + 1) % FORENSIC_HUBS.length];
      }

      return {
        id: e.transaction_id || `TX-GEO-${index}`,
        from: fromLoc,
        to: toLoc,
        amount: e.amount || 5000,
        sender: e.source,
        receiver: e.target,
      };
    });

    setActivePaths(paths);
  }, [edges]);

  // Convert lat/lng to SVG viewBox coordinates (width: 800, height: 400)
  // Mercator-like quick conversion for high visual fidelity
  const getXY = (lat: number, lng: number) => {
    // Normalise lng (-180 to 180) to (0 to 800)
    // Scale focus specifically around India / Middle East / Southeast Asia for high density visuals
    const x = ((lng + 90) / 200) * 800; 
    // Normalise lat (-90 to 90) to (400 to 0)
    const y = 200 - ((lat - 20) / 45) * 200;
    return { x, y };
  };

  return (
    <div className="w-full h-full flex flex-col bg-card/10 backdrop-blur-md rounded-lg overflow-hidden border border-border/40 relative">
      {/* Tactical HUD Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-card/60">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary animate-spin-slow" style={{ color: "hsl(155 100% 50%)" }} />
          <span className="text-[11px] font-mono font-bold tracking-widest text-primary" style={{ color: "hsl(155 100% 50%)" }}>
            GEO-SPATIAL FORENSIC TELEMETRY
          </span>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE TRAFFIC
          </div>
          <div className="flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-muted-foreground" />
            MERCATOR PROJECTION
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col md:flex-row min-h-0">
        {/* SVG Tactical Map Canvas */}
        <div className="flex-1 relative overflow-hidden bg-slate-950/80 border-r border-border/20 p-2">
          {/* Tactical Grid Background */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(18,24,38,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.3)_1px,transparent_1px)] bg-[size:20px_20px]" />

          <svg viewBox="100 0 600 350" className="w-full h-full min-h-[300px]">
            {/* Draw Simulated Continents/Lines for visual aesthetics */}
            {/* Outline grid circles */}
            <circle cx="400" cy="180" r="140" fill="none" stroke="rgba(0, 255, 150, 0.05)" strokeDasharray="3,3" />
            <circle cx="400" cy="180" r="80" fill="none" stroke="rgba(0, 255, 150, 0.04)" />

            {/* Render transaction arc lines */}
            {activePaths.map((path) => {
              const start = getXY(path.from.lat, path.from.lng);
              const end = getXY(path.to.lat, path.to.lng);

              // Calculate control points for smooth quadratic curves
              const midX = (start.x + end.x) / 2;
              const midY = (start.y + end.y) / 2 - Math.abs(start.x - end.x) * 0.15; // Arc height

              return (
                <g key={path.id}>
                  {/* Glowing background arc path */}
                  <path
                    d={`M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`}
                    fill="none"
                    stroke="hsl(155 100% 50%)"
                    strokeWidth="1.5"
                    className="opacity-20"
                  />
                  {/* Dashed animated flow path */}
                  <path
                    d={`M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`}
                    fill="none"
                    stroke="hsl(185 100% 50%)"
                    strokeWidth="2"
                    strokeDasharray="6, 6"
                    className="opacity-80"
                    style={{
                      strokeDashoffset: 100,
                      animation: "dash 4s linear infinite",
                    }}
                  />
                  {/* Animated bullet point following the arc */}
                  <circle r="4" fill="hsl(0, 84%, 60%)" className="animate-pulse">
                    <animateMotion
                      dur="2.5s"
                      repeatCount="indefinite"
                      path={`M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`}
                    />
                  </circle>
                </g>
              );
            })}

            {/* Render active Hub points */}
            {FORENSIC_HUBS.map((hub) => {
              const { x, y } = getXY(hub.lat, hub.lng);
              const isSource = activePaths.some(p => p.from.id === hub.id);
              const isTarget = activePaths.some(p => p.to.id === hub.id);

              let pulseColor = "hsl(155, 100%, 50%)";
              if (isSource) pulseColor = "hsl(45, 100%, 55%)";
              if (isTarget) pulseColor = "hsl(0, 84%, 60%)";

              return (
                <g key={hub.id}>
                  {/* Outer glowing pulsing ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill="none"
                    stroke={pulseColor}
                    className="animate-ping"
                    style={{ animationDuration: "3s" }}
                    opacity="0.4"
                  />
                  {/* Base Hub node */}
                  <circle cx={x} cy={y} r="4.5" fill={pulseColor} />
                  {/* Label */}
                  <text
                    x={x}
                    y={y - 8}
                    fill="rgba(255,255,255,0.7)"
                    fontSize="7"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                  >
                    {hub.id}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Style injection for stroke animations */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes dash {
              to {
                stroke-dashoffset: 0;
              }
            }
          `}} />
        </div>

        {/* Tactical Feed Sidepanel */}
        <div className="w-full md:w-80 flex flex-col font-mono text-[10px] bg-slate-900/90 p-3 select-none">
          <div className="flex items-center gap-1.5 mb-2.5 text-muted-foreground border-b border-border/30 pb-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" style={{ color: "hsl(155 100% 50%)" }} />
            <span>CROSS-BORDER INTELLIGENCE FEED</span>
          </div>

          {activePaths.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground opacity-50 py-10">
              <RefreshCw className="w-6 h-6 animate-spin mb-2" />
              <span>Awaiting transaction routing events...</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[300px] md:max-h-none">
              {activePaths.map((path, idx) => (
                <div
                  key={idx}
                  className="p-2 border rounded bg-card/30 transition-colors"
                  style={{
                    borderColor: path.amount > 10000 ? "hsl(0 84% 60% / 0.3)" : "hsl(155 100% 50% / 0.2)",
                  }}
                >
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-primary" style={{ color: "hsl(155 100% 50%)" }}>{path.id}</span>
                    <span style={{ color: path.amount > 10000 ? "hsl(0, 84%, 60%)" : "hsl(185, 100% 55%)" }}>
                      ${path.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>ORIGIN:</span>
                      <span className="text-foreground">{path.from.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DEST:</span>
                      <span className="text-foreground">{path.to.label}</span>
                    </div>
                    <div className="flex justify-between mt-1 border-t border-border/20 pt-1 text-[9px]">
                      <span>FROM: {privacyMode ? maskSensitiveValue(path.sender) : path.sender}</span>
                      <span>TO: {privacyMode ? maskSensitiveValue(path.receiver) : path.receiver}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
