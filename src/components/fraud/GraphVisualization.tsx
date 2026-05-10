import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { GraphNode, GraphEdge, FraudRing } from "@/types/fraud";
import ForceGraph2D from "react-force-graph-2d";
import { maskSensitiveValue } from "@/lib/privacy";

// Unique colors for fraud rings
const RING_COLORS = [
  "hsl(0,84%,60%)",   "hsl(25,100%,60%)",  "hsl(45,100%,55%)",
  "hsl(280,80%,65%)", "hsl(195,100%,55%)", "hsl(320,80%,65%)",
  "hsl(60,100%,55%)", "hsl(150,80%,55%)",  "hsl(15,100%,60%)",
  "hsl(240,80%,70%)",
];

interface GraphVisualizationProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  suspiciousSet: Set<string>;
  fraudRings?: FraudRing[];
  privacyMode?: boolean;
  currentTime?: number; // ms epoch — only edges with timestamp <= currentTime are "active"
  onNodeSelect?: (accountId: string) => void;
}

type FilterMode = "all" | "suspicious" | "cycles" | "smurfing";

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  nodes,
  edges,
  suspiciousSet,
  fraudRings = [],
  privacyMode = true,
  currentTime,
  onNodeSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedRing, setSelectedRing] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);

  // Build ring membership map (memoized — only recomputes when fraudRings changes)
  const { ringMemberMap, ringColorMap } = useMemo(() => {
    const memberMap = new Map<string, string[]>();
    const colorMap = new Map<string, string>();
    fraudRings.forEach((ring, idx) => {
      colorMap.set(ring.ring_id, RING_COLORS[idx % RING_COLORS.length]);
      ring.accounts.forEach(acc => {
        if (!memberMap.has(acc)) memberMap.set(acc, []);
        memberMap.get(acc)!.push(ring.ring_id);
      });
    });
    return { ringMemberMap: memberMap, ringColorMap: colorMap };
  }, [fraudRings]);

  // Selected ring's members (memoized)
  const selectedRingMembers = useMemo(
    () => selectedRing
      ? new Set(fraudRings.find(r => r.ring_id === selectedRing)?.accounts || [])
      : null,
    [selectedRing, fraudRings],
  );

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Filter nodes/edges based on filter mode (memoized)
  const filteredNodes = useMemo(() => {
    switch (filterMode) {
      case "suspicious":
        return nodes.filter(n => n.suspicious);
      case "cycles":
        return nodes.filter(n => ringMemberMap.has(n.id));
      case "smurfing":
        return nodes.filter(n => n.suspicious && n.score >= 30);
      default:
        return nodes;
    }
  }, [nodes, filterMode, ringMemberMap]);

  const filteredEdges = useMemo(() => {
    const ids = new Set(filteredNodes.map(n => n.id));
    return edges.filter(e => ids.has(e.source) && ids.has(e.target)).slice(0, 1000);
  }, [edges, filteredNodes]);

  // Memoized graph data — stable reference unless inputs actually change.
  // Critical: ForceGraph2D restarts the simulation whenever this prop identity changes.
  const graphData = useMemo(() => {
    const timeActive = typeof currentTime === "number" && Number.isFinite(currentTime);
    const activeEdgeIds = new Set<string>();
    const activeNodeIds = new Set<string>();
    if (timeActive) {
      for (const e of filteredEdges) {
        const ts = e.timestamp ? new Date(e.timestamp).getTime() : NaN;
        if (Number.isFinite(ts) && ts <= (currentTime as number)) {
          activeEdgeIds.add(e.transaction_id);
          activeNodeIds.add(e.source);
          activeNodeIds.add(e.target);
        }
      }
    }

    const visibleEdges = timeActive
      ? filteredEdges.filter(e => activeEdgeIds.has(e.transaction_id))
      : filteredEdges;
    const visibleNodes = timeActive
      ? filteredNodes.filter(n => activeNodeIds.has(n.id) || ringMemberMap.has(n.id))
      : filteredNodes;

    return {
      nodes: visibleNodes.map(n => ({
        id: n.id,
        suspicious: n.suspicious,
        score: n.score,
        rings: ringMemberMap.get(n.id) || [],
        timeActive: !timeActive || activeNodeIds.has(n.id),
        val: n.suspicious ? Math.max(2, n.score / 20) : 1,
      })),
      links: visibleEdges.map(e => ({
        source: e.source,
        target: e.target,
        amount: e.amount,
        transaction_id: e.transaction_id,
      })),
    };
  }, [filteredNodes, filteredEdges, ringMemberMap, currentTime]);

  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = privacyMode ? maskSensitiveValue(node.id) : node.id;
    const fontSize = Math.max(7, 11 / globalScale);
    const r = node.suspicious ? Math.max(7, 4 + node.score / 12) : 4;

    // Determine ring color
    const primaryRing = node.rings?.[0];
    const ringColor = primaryRing ? ringColorMap.get(primaryRing) : null;

    // Highlight border for selected ring
    const isInSelectedRing = selectedRingMembers ? selectedRingMembers.has(node.id) : false;
    const isDimmed = selectedRingMembers && !isInSelectedRing;
    const isTimeInactive = node.timeActive === false;

    if (isTimeInactive) {
      ctx.globalAlpha = 0.18;
    } else if (isDimmed) {
      ctx.globalAlpha = 0.2;
    }

    // Glow effect for suspicious nodes (only when time-active)
    if (node.suspicious && !isTimeInactive) {
      const glowColor = ringColor || (node.score >= 70 ? "rgba(239,68,68,0.25)" : "rgba(234,179,8,0.2)");
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 5, 0, 2 * Math.PI);
      ctx.fillStyle = typeof glowColor === "string" && glowColor.startsWith("hsl")
        ? glowColor.replace(")", " / 0.25)").replace("hsl(", "hsla(")
        : glowColor;
      ctx.fill();
    }

    // Main node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = ringColor
      ? ringColor
      : node.suspicious
        ? node.score >= 70 ? "hsl(0,84%,60%)" : node.score >= 40 ? "hsl(45,100%,55%)" : "hsl(210,100%,60%)"
        : "hsl(155,100%,35%)";
    ctx.fill();

    // Border: thick highlight for ring members, normal otherwise
    if (isInSelectedRing) {
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2.5 / globalScale;
    } else if (node.suspicious) {
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1 / globalScale;
    } else {
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 0.5 / globalScale;
    }
    ctx.stroke();

    // Label when zoomed in
    if (globalScale >= 0.7) {
      ctx.font = `${fontSize}px JetBrains Mono, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(220,255,220,0.9)";
      ctx.fillText(label.length > 9 ? label.slice(0, 9) + "…" : label, node.x, node.y + r + 2);
    }

    ctx.globalAlpha = 1;
  }, [selectedRingMembers, ringColorMap, privacyMode]);

  const handleNodeHover = useCallback((node: any, prevNode: any) => {
    setHoveredNode(node || null);
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    // Notify parent so it can open the detail drawer
    onNodeSelect?.(node.id);
    // If node is in a ring, also toggle ring selection
    const rings = node.rings as string[];
    if (rings?.length > 0) {
      const ring = rings[0];
      setSelectedRing(prev => prev === ring ? null : ring);
    }
  }, [onNodeSelect]);

  // Stable function refs for ForceGraph2D — prevents simulation restarts on parent re-renders.
  const nodeCanvasObjectModeFn = useCallback(() => "replace", []);
  const nodeLabelFn = useCallback(() => "", []);
  const linkColorFn = useCallback((link: any) => {
    if (selectedRingMembers
      && selectedRingMembers.has(link.source?.id || link.source)
      && selectedRingMembers.has(link.target?.id || link.target)) {
      return "rgba(255,255,255,0.6)";
    }
    return "rgba(100,255,150,0.12)";
  }, [selectedRingMembers]);
  const linkWidthFn = useCallback((link: any) => {
    if (selectedRingMembers
      && selectedRingMembers.has(link.source?.id || link.source)
      && selectedRingMembers.has(link.target?.id || link.target)) {
      return 1.5;
    }
    return 0.6;
  }, [selectedRingMembers]);

  const filters: { id: FilterMode; label: string }[] = [
    { id: "all", label: "ALL" },
    { id: "suspicious", label: "SUSPICIOUS" },
    { id: "cycles", label: "CYCLES" },
    { id: "smurfing", label: "SMURFING" },
  ];

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-mono text-sm">
        No graph data available
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      {/* Filter toggles */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        <div className="flex gap-1 bg-background/80 backdrop-blur-sm p-1.5 rounded-md border border-border/50">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => { setFilterMode(f.id); setSelectedRing(null); }}
              className="px-2 py-1 text-[10px] font-mono rounded transition-all"
              style={filterMode === f.id
                ? { background: "hsl(155 100% 50% / 0.2)", color: "hsl(155 100% 50%)", border: "1px solid hsl(155 100% 50% / 0.5)" }
                : { color: "hsl(0 0% 55%)", border: "1px solid transparent" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="bg-background/80 backdrop-blur-sm p-2.5 rounded-md border border-border/50">
          <p className="text-[10px] font-mono text-muted-foreground mb-1.5">LEGEND</p>
          {[
            { color: "hsl(0,84%,60%)", label: "High risk (70+)" },
            { color: "hsl(45,100%,55%)", label: "Medium risk (40+)" },
            { color: "hsl(210,100%,60%)", label: "Low risk" },
            { color: "hsl(155,100%,35%)", label: "Clean account" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
            </div>
          ))}

          {fraudRings.length > 0 && (
            <>
              <div className="border-t border-border/30 my-1.5" />
              <p className="text-[10px] font-mono text-muted-foreground mb-1">FRAUD RINGS (click to select)</p>
              {fraudRings.slice(0, 6).map((ring, idx) => (
                <button
                  key={ring.ring_id}
                  onClick={() => setSelectedRing(prev => prev === ring.ring_id ? null : ring.ring_id)}
                  className="flex items-center gap-1.5 mb-0.5 w-full text-left rounded px-1 transition-colors hover:bg-white/5"
                  style={selectedRing === ring.ring_id ? { background: "rgba(255,255,255,0.08)" } : {}}
                >
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: RING_COLORS[idx % RING_COLORS.length] }} />
                  <span className="text-[10px] font-mono" style={{ color: RING_COLORS[idx % RING_COLORS.length] }}>
                    {ring.ring_id} ({ring.accounts.length})
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-md border border-border/50">
        <p className="text-[10px] font-mono text-muted-foreground">{filteredNodes.length} nodes · {filteredEdges.length} edges</p>
        {selectedRing && (
          <p className="text-[10px] font-mono mt-0.5" style={{ color: "hsl(155 100% 50%)" }}>
            Ring: {selectedRing}
          </p>
        )}
      </div>

      {/* Tooltip — positioned via ref so mousemove never re-renders the graph */}
      {hoveredNode && (
        <div
          ref={tooltipRef}
          className="absolute z-20 pointer-events-none bg-background/95 border border-border/60 rounded-md p-2.5 shadow-xl text-xs font-mono"
          style={{ left: 0, top: 0 }}
        >
          <p className="font-bold mb-1" style={{ color: "hsl(155 100% 55%)" }}>{privacyMode ? maskSensitiveValue(hoveredNode.id) : hoveredNode.id}</p>
          <p className="text-muted-foreground">Score: <span style={{ color: hoveredNode.score >= 70 ? "hsl(0,84%,60%)" : hoveredNode.score >= 40 ? "hsl(45,100%,55%)" : "hsl(155,100%,50%)" }}>{hoveredNode.score}</span></p>
          {hoveredNode.rings?.length > 0 && (
            <p className="text-muted-foreground">Rings: <span className="text-foreground">{hoveredNode.rings.join(", ")}</span></p>
          )}
          {hoveredNode.suspicious && (
            <p className="text-muted-foreground mt-0.5">⚠ Suspicious account</p>
          )}
        </div>
      )}

      {/* Graph canvas: mouse position via ref (does NOT re-render React) */}
      <div
        onMouseMove={(e) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          mousePosRef.current = { x, y };
          if (tooltipRef.current) {
            tooltipRef.current.style.left = `${Math.min(x + 12, dimensions.width - 200)}px`;
            tooltipRef.current.style.top = `${Math.min(y - 10, dimensions.height - 120)}px`;
          }
        }}
        className="w-full h-full"
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="transparent"
          nodeCanvasObject={nodeCanvasObject}
          nodeCanvasObjectMode={nodeCanvasObjectModeFn}
          linkColor={linkColorFn}
          linkWidth={linkWidthFn}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          cooldownTicks={80}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          nodeLabel={nodeLabelFn}
        />
      </div>
    </div>
  );
};
