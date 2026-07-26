import React, { useState, useRef, useEffect } from "react";
import { Terminal, Send, ShieldAlert, Cpu, Activity, Play } from "lucide-react";

interface ForensicTerminalHUDProps {
  onTriggerFreezeAll?: () => void;
  onNavigateTab?: (tab: "graph" | "geo" | "table" | "summary") => void;
}

export const ForensicTerminalHUD: React.FC<ForensicTerminalHUDProps> = ({
  onTriggerFreezeAll,
  onNavigateTab,
}) => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Array<{ text: string; type: "input" | "system" | "error" | "success" }>>([
    { text: "HYPERION-CF INTEGRATED INTEL TERMINAL v2.5.4-SECURE", type: "success" },
    { text: "Type 'help' to view all available telemetry override commands.", type: "system" },
  ]);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    const newHistory = [...history, { text: `[OPERATOR] > ${trimmed}`, type: "input" as const }];
    const args = trimmed.split(" ");
    const command = args[0].toLowerCase();

    switch (command) {
      case "help":
        newHistory.push(
          { text: "━━━━━━━━━━━━ OVERRIDE COMMAND CONSOLE ━━━━━━━━━━━━", type: "system" },
          { text: "  sys-status      - Audit system core node modules.", type: "system" },
          { text: "  trace --deep    - Execute multi-hop Smurfing path tracing.", type: "system" },
          { text: "  freeze --all    - Dispatch emergency asset blockage to all flagged accounts.", type: "system" },
          { text: "  nav <tab>       - Jump workspace tabs (graph, geo, table, summary).", type: "system" },
          { text: "  clear           - Purge terminal terminal log history.", type: "system" },
          { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: "system" }
        );
        break;
      case "sys-status":
        newHistory.push(
          { text: "⏳ INITIATING DIAGNOSTIC DEPLOYMENT...", type: "system" },
          { text: "  [OK] GRAPH ENGINE CORE: ONLINE (D3 FORCE 2D)", type: "success" },
          { text: "  [OK] SUSPICION SCORER: REAL-TIME (WEIGHTED MATRIX ACTIVE)", type: "success" },
          { text: "  [OK] GEO projection LAYER: 100% LATENCY NOMINAL (MERCATOR)", type: "success" },
          { text: "  [OK] WATERMARK CANVAS: RENDER BUFFER OK (RADIAL GRID)", type: "success" },
          { text: "🟢 DIAGNOSTIC SANITY RUN: 100% SECURE", type: "success" }
        );
        break;
      case "trace":
        if (args[1] === "--deep") {
          newHistory.push(
            { text: "⚡ EXECUTING DEEP ROUTING TRACE INJECTOR...", type: "system" },
            { text: "  [1/3] Sweeping layered transit hops...", type: "system" },
            { text: "  [2/3] Analyzing Smurf aggregation velocity (sliding 72h)...", type: "system" },
            { text: "  [3/3] Tracing offshore gateways (Caymans / UAE router)...", type: "system" },
            { text: "🔗 TRACE COMPLETE: Identified high-confidence smurfing targets ACC_MULE_1 & ACC_RECEIVER.", type: "success" }
          );
          if (onNavigateTab) onNavigateTab("graph");
        } else {
          newHistory.push({ text: "Error: Missing deep parameter. Use: 'trace --deep'", type: "error" });
        }
        break;
      case "freeze":
        if (args[1] === "--all") {
          newHistory.push(
            { text: "🚨 DISPATCHING EMERGENCY ASSET LOCK COMMAND...", type: "error" },
            { text: "🔒 AUTONOMOUS HOT WALLET FREEZE CONFIRMED. MUTATING STATE DATABASE...", type: "success" }
          );
          if (onTriggerFreezeAll) onTriggerFreezeAll();
        } else {
          newHistory.push({ text: "Error: Missing all parameter. Use: 'freeze --all'", type: "error" });
        }
        break;
      case "nav":
        const targetTab = args[1]?.toLowerCase();
        if (["graph", "geo", "table", "summary"].includes(targetTab)) {
          newHistory.push({ text: `Navigating dashboard workspace tab to: ${targetTab.toUpperCase()}`, type: "success" });
          if (onNavigateTab) onNavigateTab(targetTab as any);
        } else {
          newHistory.push({ text: "Error: Invalid tab name. Options: graph, geo, table, summary", type: "error" });
        }
        break;
      case "clear":
      case "cls":
        setHistory([]);
        setInput("");
        return;
      default:
        newHistory.push({ text: `Command not recognized: '${command}'. Type 'help' for instructions.`, type: "error" });
        break;
    }

    setHistory(newHistory);
    setInput("");
  };

  return (
    <div className="bg-slate-950 border border-border/50 rounded-lg overflow-hidden flex flex-col font-mono text-xs shadow-xl scan-line" style={{ height: "300px" }}>
      {/* Title bar */}
      <div className="bg-slate-900 border-b border-border/40 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" style={{ color: "hsl(155 100% 50%)" }} />
          <span className="text-muted-foreground text-[10px] tracking-widest font-bold">HYPERION INTERACTIVE TELEMETRY OVERRIDE</span>
        </div>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/60" />
        </div>
      </div>

      {/* Terminal log panel */}
      <div 
        ref={containerRef}
        className="flex-1 p-3 overflow-y-auto space-y-1.5 scrollbar-thin select-text"
        style={{ background: "rgba(2, 6, 23, 0.95)" }}
      >
        {history.map((line, idx) => {
          let color = "text-muted-foreground";
          if (line.type === "input") color = "text-white font-bold";
          if (line.type === "success") color = "text-emerald-400";
          if (line.type === "error") color = "text-rose-500 font-bold";
          
          return (
            <div key={idx} className={`leading-relaxed ${color} break-all`}>
              {line.text}
            </div>
          );
        })}
      </div>

      {/* Input panel */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleCommand(input);
        }}
        className="bg-slate-950 border-t border-border/40 px-3 py-2 flex items-center gap-2"
      >
        <span className="text-primary font-black" style={{ color: "hsl(155 100% 50%)" }}>[HYPERION] &gt;</span>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type 'help' to review commands..."
          className="flex-1 bg-transparent border-none outline-none text-white text-xs font-mono placeholder:text-muted-foreground/30 focus:ring-0 focus:border-none p-0"
        />
        <button 
          type="submit"
          className="p-1 hover:bg-white/5 rounded transition-colors text-muted-foreground hover:text-primary"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
