import React from "react";
import { Download, Shield, Activity, AlertTriangle, Network, TrendingUp } from "lucide-react";
import { AnalysisResult } from "@/types/fraud";
import { maskSensitiveValue } from "@/lib/privacy";

interface SummaryPanelProps {
  result: AnalysisResult;
  privacyMode?: boolean;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ result, privacyMode = true }) => {
  const { summary, suspicious_accounts, fraud_rings, smurfing, shell_chains } = result;

  const handleDownload = () => {
    const exportData = {
      suspicious_accounts: suspicious_accounts.map(a => ({
        account_id: privacyMode ? maskSensitiveValue(a.account_id) : a.account_id,
        suspicion_score: a.score,
        flags: a.reasons,
      })),
      fraud_rings: fraud_rings.map(r => ({
        ring_id: r.ring_id,
        accounts_involved: privacyMode ? r.accounts.map(maskSensitiveValue) : r.accounts,
        cycle_length: r.cycle_length,
        type: r.type,
      })),
      summary: {
        ...summary,
        smurfing_fan_in: smurfing.fanIn.map(fi => ({ receiver: privacyMode ? maskSensitiveValue(fi.receiver) : fi.receiver, sender_count: fi.count })),
        smurfing_fan_out: smurfing.fanOut.map(fo => ({ sender: privacyMode ? maskSensitiveValue(fo.sender) : fo.sender, receiver_count: fo.count })),
        shell_chains_sample: shell_chains.slice(0, 10).map(chain => ({ chain: privacyMode ? chain.map(maskSensitiveValue) : chain })),
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fraud-analysis-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      icon: Activity,
      label: "Transactions",
      value: summary.total_transactions.toLocaleString(),
      color: "hsl(185 100% 55%)",
    },
    {
      icon: Shield,
      label: "Accounts",
      value: summary.total_accounts.toLocaleString(),
      color: "hsl(155 100% 50%)",
    },
    {
      icon: AlertTriangle,
      label: "Suspicious",
      value: summary.suspicious_accounts_count.toLocaleString(),
      color: "hsl(0 84% 60%)",
    },
    {
      icon: Network,
      label: "Fraud Rings",
      value: summary.fraud_rings_detected.toLocaleString(),
      color: "hsl(0 84% 60%)",
    },
    {
      icon: TrendingUp,
      label: "Smurfing (In)",
      value: summary.smurfing_fan_in_detected.toLocaleString(),
      color: "hsl(45 100% 55%)",
    },
    {
      icon: TrendingUp,
      label: "Smurfing (Out)",
      value: summary.smurfing_fan_out_detected.toLocaleString(),
      color: "hsl(45 100% 55%)",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card/50 border border-border/40 rounded-md p-3 text-center">
            <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color }} />
            <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
            <div className="text-xs font-mono text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Smurfing alerts */}
      {(smurfing.fanIn.length > 0 || smurfing.fanOut.length > 0) && (
        <div className="p-3 rounded-md border bg-card/30" style={{ borderColor: "hsl(45 100% 55% / 0.4)" }}>
          <p className="text-xs font-mono font-bold mb-2" style={{ color: "hsl(45 100% 55%)" }}>
            ⚠ SMURFING PATTERNS DETECTED
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {smurfing.fanIn.slice(0, 3).map(fi => (
              <div key={fi.receiver} className="text-xs font-mono text-muted-foreground">
                FAN-IN: <span className="text-foreground">{privacyMode ? maskSensitiveValue(fi.receiver) : fi.receiver}</span> ← {fi.count} senders
              </div>
            ))}
            {smurfing.fanOut.slice(0, 3).map(fo => (
              <div key={fo.sender} className="text-xs font-mono text-muted-foreground">
                FAN-OUT: <span className="text-foreground">{privacyMode ? maskSensitiveValue(fo.sender) : fo.sender}</span> → {fo.count} receivers
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-mono font-bold rounded-sm border transition-all duration-200 hover:scale-105 hover:shadow-lg"
        style={{
          background: "linear-gradient(135deg, hsl(155 100% 50%), hsl(185 100% 45%))",
          color: "hsl(220 20% 4%)",
          borderColor: "transparent",
          boxShadow: "0 0 20px hsl(155 100% 50% / 0.3)",
        }}
      >
        <Download className="w-4 h-4" />
        DOWNLOAD JSON REPORT
      </button>

      <p className="text-xs font-mono text-muted-foreground/50">
        Analyzed at {new Date(summary.analysis_timestamp).toLocaleString()} · {summary.shell_chains_detected} shell chains found
      </p>
    </div>
  );
};
