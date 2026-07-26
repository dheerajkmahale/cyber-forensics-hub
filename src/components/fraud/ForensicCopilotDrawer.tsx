import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Cpu, ShieldCheck, Scale, FileText } from "lucide-react";

interface Message {
  sender: "copilot" | "operator";
  text: string;
  timestamp: string;
}

interface ForensicCopilotDrawerProps {
  analysisResult: any;
  privacyMode?: boolean;
}

export const ForensicCopilotDrawer: React.FC<ForensicCopilotDrawerProps> = ({
  analysisResult,
  privacyMode = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "copilot",
      text: "⚡ HYPERION CO-PILOT INITIALIZED. Operational parameters: Text mode only. Awaiting structural inquiries...",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);  const sendResponse = (userText: string) => {
    const text = userText.toLowerCase();
    setTyping(true);

    setTimeout(() => {
      let reply = "";
      if (text.includes("ring") || text.includes("loop") || text.includes("cycle")) {
        const ringsCount = analysisResult?.summary?.fraud_rings_detected || 0;
        reply = `🧠 **FORENSIC INTELLIGENCE: CYCLIC ROUTING AUDIT**
Identified **${ringsCount} active money laundering loops** in the active clearing path.

### 🔍 Topology Analysis:
* **Loop Structure**: \`ACC_MULE_ALPHA ➜ ACC_MULE_BETA ➜ ACC_MULE_GAMMA ➜ ACC_MULE_ALPHA\`
* **Transfer Latency**: Transaction legs occurred sequentially within a tight 12-minute temporal window, exhibiting an average transfer delay of only **145 seconds per hop**.
* **Depletion Matrix**: Leg 1 was initiated at **$25,000**, Leg 2 dropped by 0.2% to **$24,950** (layering fee leakage), and Leg 3 resolved at **$24,830** back to the origin, closing the cycle. This **99.3% fund preservation rate** across multi-legged loops is indicative of automated laundering loops.

### 🛡️ Recommended Intercept Directives:
1. **Freeze Assets**: Apply provisional freezing orders on \`ACC_MULE_ALPHA\` immediately to break the cycle.
2. **Expand Search**: Query adjacent nodes with transactional weights exceeding **$10,000** within 24 hours of cycle closure.`;
      } else if (text.includes("smurf") || text.includes("structur")) {
        reply = `🧠 **FORENSIC INTELLIGENCE: STRUCTURING & SMURFING SCHEMES**
Smurfing involves breaking down massive transactional capital into small, structured micro-deposits (typically just below compliance reporting thresholds like **$10,000** or **₹10,00,000**) across multiple disparate accounts to bypass automated AML triggers.

### 🔍 Graph Pattern Matching:
* **Consolidation Target**: Node \`ACC_SMURF_HUB\` is currently acting as a high-risk consolidation sink.
* **Ingress Pipelines**: 8 distinct unverified smurfing terminals (\`ACC_SMURF_NODE_1\` through \`8\`) initiated simultaneous transfers averaging **$9,350** inside a sliding **18-minute temporal window**.
* **Integration Trigger**: Immediately following consolidation, a bulk sweep of **$75,000** was routed to an offshore Tax Haven terminal (\`ACC_CAYMAN_ROUTER\`).

### 🛡️ Forensic Remediation Steps:
* Deploy a **sliding-window velocity filter** restricting outward wires from any account receiving more than 3 deposits under $10,000 within a 24-hour cycle.`;
      } else if (text.includes("law") || text.includes("pmla") || text.includes("fatf") || text.includes("legal")) {
        reply = `⚖️ **REGULATORY COMPLIANCE & LEGAL BRIEFING**
This dossier maps transactional flow parameters directly to statutory guidelines required for provisional asset attachment and judicial prosecution:

### 1. PMLA (Prevention of Money Laundering Act, Section 3 & 4)
* **Definition of Offence**: Whosoever directly or indirectly attempts to indulge or knowingly assists in any process connected with the proceeds of crime is guilty of money laundering.
* **Prosecutorial Weight**: Offenses are cognizable and non-bailable, carrying **rigorous imprisonment from 3 to 7 years** along with unlimited statutory fines.

### 2. FATF Recommendation 15 (Virtual Assets & Corridors)
* **Travel Rule Requirement**: Virtual Asset Service Providers (VASPs) must obtain, hold, and transmit required sender and beneficiary information during transfers exceeding **$1,000 / €1,000**.
* **Red Flag Indicators**: High-velocity transit hops traversing non-cooperative jurisdictions (NCJRs) require immediate filing of a **Suspicious Transaction Report (STR)**.`;
      } else if (text.includes("velocity") || text.includes("speed") || text.includes("rapid")) {
        reply = `⚡ **FORENSIC INTELLIGENCE: HIGH-VELOCITY ANOMALY SCAN**
Velocity laundering leverages rapid-fire automated scripts to cycle capital through transitional intermediary nodes before legacy settlement rules can flag the accounts.

### 🔍 Telemetry Diagnostics:
* **Trigger Node**: \`ACC_VELOCITY_EMITTER\`
* **Frequency Burst**: Dispatched **10 consecutive transactions** to \`ACC_VELOCITY_RECEIVER\` within **60 seconds**, totaling **$16,800**.
* **Bypass Strategy**: By keeping individual amounts between **$1,500 and $1,800**, the automated scripts successfully avoid standard transactional velocity filters while executing high-volume capital export.

### 🛡️ Forensic Mitigation:
* Configure real-time rate limiters to auto-suspend outward clearing operations if an endpoint executes more than **5 outward wires within 180 seconds**.`;
      } else if (text.includes("shell") || text.includes("chain") || text.includes("strat")) {
        reply = `🏢 **FORENSIC INTELLIGENCE: SHELL CHAIN STRATIFICATION**
Shell stratification splits transactions across sequential corporations (often empty entities lacking commercial substance) to increase the distance between the criminal source and the integrated capital.

### 🔍 Path Tracing:
* **Stratification Depth**: A 4-tier deep chain was registered:
  \`ACC_SHELL_ALPHA ➜ ACC_SHELL_BETA ➜ ACC_SHELL_GAMMA ➜ ACC_SHELL_DELTA\`
* **Depletion Margin**: Leg-to-leg values drop incrementally by exactly **1.0%**, masquerading as administrative management fees while maintaining absolute capital control.
* **Audit Countermeasures**: The Ultimate Beneficial Owner (UBO) of all intermediate entities must be scrutinized via corporate registry records.`;
      } else if (text.includes("offshore") || text.includes("dark") || text.includes("dubai") || text.includes("cayman")) {
        reply = `💀 **FORENSIC INTELLIGENCE: OFFSHORE CORRIDOR EXPOSURE**
Asset flight utilizes multi-jurisdictional clearing endpoints located in tax havens and countries with restrictive banking secrecy laws to escape domestic recovery.

### 🔍 Corridors Identified:
* **Indo-Arab Route**: Ingress from domestic hubs routed directly outward to offshore terminals:
  \`ACC_IN_OPERATOR ➜ ACC_UAE_ROUTER ➜ ACC_SG_ROUTER ➜ ACC_CAYMAN_ESCROW\`
* **Secrecy Layering**: UAE and Cayman terminals are classified as high-risk tax shelters with limited mutual legal assistance treaty (MLAT) disclosure compliance. Immediate coordination with international financial intelligence units is recommended.`;
      } else if (text.includes("help") || text.includes("command")) {
        reply = `⚡ **HYPERION CO-PILOT COMMAND OPTIONS**
Please click the quick diagnostic prompt buttons below or type inquiries. Suggested prompts include:
* **"Audit active rings"** — Scan circular routing loops.
* **"Explain smurfing structuring"** — Trace structured fan-in deposits.
* **"AML legal framework directives"** — View PMLA & FATF guidelines.
* **"Analyze transaction velocity"** — Check rapid fire repetitive sweeps.
* **"Trace shell company layering"** — Track deep corporate stratification.
* **"Evaluate offshore laundering routes"** — Map tax haven capital flight paths.`;
      } else {
        reply = `🤖 **HYPERION ANALYST ENGINE RESPONDER**
Forensic telemetry models are fully active. The current transaction graph contains **high-density layering vectors**. 

### 📡 System Telemetry:
* **Clearing Path**: Cross-border corridors exhibit elevated risk parameters near tax haven routers.
* **Forensic Status**: Flagged accounts have been queued for provisional asset freezes. Please execute quick actions on your console to lock transactions.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "copilot",
          text: reply,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setTyping(false);
    }, 1200);
  };

  const handleSend = (textStr: string) => {
    const trimmed = textStr.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: "operator",
        text: trimmed,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setInput("");
    sendResponse(trimmed);
  };

  return (
    <>
      {/* Floating Glowing Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full border text-xs font-mono font-bold tracking-widest text-primary bg-slate-950/90 shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_40px_rgba(0,255,136,0.5)] border-primary hover:scale-105 transition-all duration-300"
        style={{ color: "hsl(155 100% 50%)", borderColor: "hsl(155 100% 50%)" }}
      >
        <Cpu className="w-4 h-4 animate-spin-slow" />
        AI CO-PILOT
      </button>

      {/* Sliding Drawer Container */}
      <div
        className={`fixed top-0 right-0 h-full w-[440px] max-w-full bg-slate-950/95 border-l border-border/40 z-50 shadow-2xl flex flex-col font-mono text-xs transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header bar */}
        <div className="bg-slate-900 border-b border-border/40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ background: "hsl(155 100% 50%)" }} />
            <h3 className="font-bold tracking-widest text-[10px] text-white">HYPERION AI CO-PILOT</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/5 rounded text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Log Panel */}
        <div
          ref={scrollRef}
          className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin select-text bg-slate-950/60"
        >
          {messages.map((m, idx) => {
            const isCopilot = m.sender === "copilot";
            return (
              <div key={idx} className={`flex flex-col ${isCopilot ? "items-start" : "items-end"}`}>
                <span className="text-[8px] text-muted-foreground/60 mb-1">{isCopilot ? "AI ANALYST" : "OPERATOR"} · {m.timestamp}</span>
                <div
                  className={`max-w-[85%] rounded p-3 leading-relaxed border font-mono ${
                    isCopilot
                      ? "bg-slate-900/50 border-border/30 text-emerald-300/90 text-[11px]"
                      : "bg-primary/5 border-primary/20 text-white text-[11px]"
                  }`}
                  style={!isCopilot ? { borderLeftColor: "hsl(155 100% 50% / 0.4)" } : {}}
                >
                  {/* Process Markdown-style bold blocks simply */}
                  {m.text.split("\n").map((line, lIdx) => (
                    <p key={lIdx} className={lIdx > 0 ? "mt-1.5" : ""}>
                      {line.split("**").map((part, pIdx) => 
                        pIdx % 2 === 1 ? <strong key={pIdx} className="text-white font-black">{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
          {typing && (
            <div className="flex flex-col items-start">
              <span className="text-[8px] text-muted-foreground/60 mb-1">AI ANALYST is analyzing...</span>
              <div className="bg-slate-900/50 border border-border/30 rounded px-3 py-2 text-primary animate-pulse">
                Thinking...▋
              </div>
            </div>
          )}
        </div>

        {/* Diagnostic Prompts Panel */}
        <div className="p-3 bg-slate-900/30 border-t border-border/20 space-y-2 select-none">
          <span className="text-[9px] text-muted-foreground/60 tracking-wider block font-bold">// QUICK DIAGNOSTIC OVERRIDES:</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSend("Audit active fraud rings")}
              disabled={typing}
              className="flex items-center gap-1.5 p-2 rounded bg-slate-900 hover:bg-slate-800 border border-border/40 hover:border-primary/40 text-left transition-colors text-muted-foreground hover:text-white text-[10px]"
            >
              <Cpu className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" style={{ color: "hsl(155 100% 50%)" }} />
              <span className="truncate">Audit active rings</span>
            </button>
            <button
              onClick={() => handleSend("Explain smurfing structuring")}
              disabled={typing}
              className="flex items-center gap-1.5 p-2 rounded bg-slate-900 hover:bg-slate-800 border border-border/40 hover:border-primary/40 text-left transition-colors text-muted-foreground hover:text-white text-[10px]"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">Explain smurfing</span>
            </button>
            <button
              onClick={() => handleSend("PMLA & FATF legal compliance directives")}
              disabled={typing}
              className="flex items-center gap-1.5 p-2 rounded bg-slate-900 hover:bg-slate-800 border border-border/40 hover:border-primary/40 text-left transition-colors text-muted-foreground hover:text-white text-[10px]"
            >
              <Scale className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
              <span className="truncate">Legal directives</span>
            </button>
            <button
              onClick={() => handleSend("Analyze transaction velocity")}
              disabled={typing}
              className="flex items-center gap-1.5 p-2 rounded bg-slate-900 hover:bg-slate-800 border border-border/40 hover:border-primary/40 text-left transition-colors text-muted-foreground hover:text-white text-[10px]"
            >
              <Send className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="truncate">Analyze velocity</span>
            </button>
            <button
              onClick={() => handleSend("Trace shell company layering")}
              disabled={typing}
              className="flex items-center gap-1.5 p-2 rounded bg-slate-900 hover:bg-slate-800 border border-border/40 hover:border-primary/40 text-left transition-colors text-muted-foreground hover:text-white text-[10px]"
            >
              <FileText className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span className="truncate">Trace shell chains</span>
            </button>
            <button
              onClick={() => handleSend("Evaluate offshore laundering routes")}
              disabled={typing}
              className="flex items-center gap-1.5 p-2 rounded bg-slate-900 hover:bg-slate-800 border border-border/40 hover:border-primary/40 text-left transition-colors text-muted-foreground hover:text-white text-[10px]"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Offshore corridors</span>
            </button>
          </div>
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-3 bg-slate-950 border-t border-border/40 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={typing}
            placeholder="Ask AI Copilot for intelligence..."
            className="flex-1 bg-slate-900 border border-border/40 outline-none rounded p-2.5 text-xs text-white placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/40 font-mono"
          />
          <button
            type="submit"
            disabled={typing}
            className="p-2.5 rounded bg-primary hover:bg-primary/80 transition-colors text-slate-950 font-bold"
            style={{ backgroundColor: "hsl(155 100% 50%)" }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
};
