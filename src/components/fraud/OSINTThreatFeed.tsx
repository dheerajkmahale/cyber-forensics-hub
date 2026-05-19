import React, { useEffect, useState } from "react";
import { Eye, ShieldAlert, Wifi, Globe } from "lucide-react";

interface ThreatAlert {
  id: string;
  source: string;
  payload: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
}

export const OSINTThreatFeed: React.FC = () => {
  const [alerts, setAlerts] = useState<ThreatAlert[]>([
    { id: "OS-882", source: "TOR_EXIT_NODE", payload: "Ingress trace matching ACC_RECEIVER from proxy 185.220.101.5", severity: "warning", timestamp: "10:42:01" },
    { id: "OS-883", source: "DARKWEB_FORUM", payload: "Escrow wallet reference leaked: ACC_MULE_3 associated with listing 'STRAT-USDT'", severity: "critical", timestamp: "10:43:12" },
    { id: "OS-884", source: "VPN_DETECTOR", payload: "VPN bypass attempt detected on ACC_NORMAL_05 via NordVPN node cluster", severity: "info", timestamp: "10:45:30" },
  ]);

  useEffect(() => {
    const stream = [
      { source: "TOR_EXIT_NODE", payload: "Repeated ping from active Tor proxy node 109.201.154.212 on mule clearing channel", severity: "warning" as const },
      { source: "LEDGER_SCRAPER", payload: "Flagged Bitcoin/USDT mixer address matched in high-velocity transit to ACC_MULE_1", severity: "critical" as const },
      { source: "OFFSHORE_DATABASE", payload: "Bank routing transit from Cayman Islands matching ACC_OFFSHORE_DUBAI", severity: "critical" as const },
      { source: "INTELLIGENCE_REPLAY", payload: "Known laundering partner signature flagged on transit TX_LIVE_04", severity: "warning" as const },
    ];

    const interval = setInterval(() => {
      const selected = stream[Math.floor(Math.random() * stream.length)];
      const newAlert: ThreatAlert = {
        id: `OS-${Math.floor(100 + Math.random() * 900)}-${Date.now()}`,
        source: selected.source,
        payload: selected.payload,
        severity: selected.severity,
        timestamp: new Date().toLocaleTimeString(),
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 7)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-950/70 border border-border/40 rounded-lg p-4 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between" style={{ minHeight: "220px" }}>
      {/* Visual background grids */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(ellipse_at_center,var(--primary-glow),transparent_60%)]" />

      <div>
        <div className="flex items-center justify-between border-b border-border/30 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-primary animate-spin-slow" style={{ color: "hsl(185 100% 55%)" }} />
            <span className="text-xs font-mono font-bold tracking-wider text-foreground">🛰️ OSINT DARKWEB INTEL DECRYPTOR</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
            LIVE FEED ACTIVE
          </div>
        </div>

        {/* Alerts Scroller */}
        <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-none font-mono text-[10px]">
          {alerts.map(a => {
            let color = "border-sky-500/20 bg-sky-500/5 text-sky-400";
            if (a.severity === "warning") color = "border-amber-500/20 bg-amber-500/5 text-amber-400";
            if (a.severity === "critical") color = "border-rose-500/25 bg-rose-500/5 text-rose-400 animate-pulse-glow";

            return (
              <div key={a.id} className={`p-2 rounded border flex gap-2.5 items-start transition-all duration-300 hover:scale-[1.01] ${color}`}>
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5 text-[8px] font-bold tracking-widest opacity-80">
                    <span>[{a.source}] #{a.id}</span>
                    <span>{a.timestamp}</span>
                  </div>
                  <p className="leading-relaxed text-foreground/80 break-words">{a.payload}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
