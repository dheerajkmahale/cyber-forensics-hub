import React, { useState, useMemo } from "react";
import { AlertTriangle, TrendingUp, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { SuspiciousAccount, FraudRing } from "@/types/fraud";
import { maskSensitiveValue } from "@/lib/privacy";

interface FraudTableProps {
  suspiciousAccounts: SuspiciousAccount[];
  fraudRings: FraudRing[];
  privacyMode?: boolean;
}

// ---- Score Badge ----
const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const color =
    score >= 70
      ? { bg: "hsl(0 84% 60% / 0.15)", border: "hsl(0 84% 60% / 0.4)", text: "hsl(0 84% 60%)" }
      : score >= 40
      ? { bg: "hsl(45 100% 55% / 0.15)", border: "hsl(45 100% 55% / 0.4)", text: "hsl(45 100% 55%)" }
      : { bg: "hsl(210 100% 60% / 0.15)", border: "hsl(210 100% 60% / 0.4)", text: "hsl(210 100% 60%)" };

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-xs font-mono font-bold"
      style={{ background: color.bg, borderColor: color.border, color: color.text }}
    >
      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color.text }} />
      {score}
    </div>
  );
};

// ---- Ring Risk Score helper ----
const computeRingRisk = (ring: FraudRing): number => {
  let score = 0;
  if (ring.type === "circular_routing") score += 40;
  if (ring.type === "smurfing") score += 30;
  if (ring.type === "shell_chain") score += 20;
  // More members = higher risk
  score += Math.min(30, ring.accounts.length * 6);
  return Math.min(100, score);
};

// ---- Sort utility ----
type SortDir = "asc" | "desc" | null;
function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === "asc") return <ChevronUp className="w-3 h-3 ml-1" />;
  if (dir === "desc") return <ChevronDown className="w-3 h-3 ml-1" />;
  return <ChevronsUpDown className="w-3 h-3 ml-1 opacity-40" />;
}

// ---- Rings Table ----
type RingCol = "ring_id" | "type" | "accounts" | "risk";
const RING_COL_LABELS: Record<RingCol, string> = {
  ring_id: "RING ID",
  type: "PATTERN TYPE",
  accounts: "MEMBERS",
  risk: "RISK SCORE",
};

const PATTERN_COLORS: Record<string, string> = {
  circular_routing: "hsl(0 84% 60%)",
  smurfing: "hsl(45 100% 55%)",
  shell_chain: "hsl(210 100% 60%)",
};

const RingsTable: React.FC<{ fraudRings: FraudRing[]; privacyMode: boolean }> = ({ fraudRings, privacyMode }) => {
  const [sortCol, setSortCol] = useState<RingCol>("risk");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (col: RingCol) => {
    if (sortCol === col) {
      setSortDir(d => d === "desc" ? "asc" : d === "asc" ? null : "desc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    if (!sortDir) return fraudRings;
    return [...fraudRings].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let va: any, vb: any;
      if (sortCol === "ring_id") { va = a.ring_id; vb = b.ring_id; }
      else if (sortCol === "type") { va = a.type; vb = b.type; }
      else if (sortCol === "accounts") { va = a.accounts.length; vb = b.accounts.length; }
      else { va = computeRingRisk(a); vb = computeRingRisk(b); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [fraudRings, sortCol, sortDir]);

  if (fraudRings.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground font-mono text-sm">
        No fraud rings detected
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-border/50">
            {(["ring_id", "type", "accounts", "risk"] as RingCol[]).map(col => (
              <th
                key={col}
                className="text-left py-2 px-3 text-muted-foreground font-normal tracking-wider cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                onClick={() => handleSort(col)}
              >
                <span className="flex items-center">
                  {RING_COL_LABELS[col]}
                  <SortIcon dir={sortCol === col ? sortDir : null} />
                </span>
              </th>
            ))}
            <th className="text-left py-2 px-3 text-muted-foreground font-normal tracking-wider">MEMBER ACCOUNTS</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((ring) => {
            const risk = computeRingRisk(ring);
            const patternColor = PATTERN_COLORS[ring.type] || "hsl(155 100% 50%)";
            return (
              <tr key={ring.ring_id} className="border-b border-border/20 hover:bg-primary/5 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: patternColor }} />
                    <span className="font-bold" style={{ color: patternColor }}>{ring.ring_id}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] border"
                    style={{ background: `${patternColor}18`, borderColor: `${patternColor}50`, color: patternColor }}
                  >
                    {ring.type.replace(/_/g, " ").toUpperCase()}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-foreground">{ring.accounts.length}</td>
                <td className="py-2.5 px-3"><ScoreBadge score={risk} /></td>
                <td className="py-2.5 px-3">
                  <div className="flex flex-wrap gap-1 max-w-sm">
                    {ring.accounts.map(acc => (
                      <span key={acc} className="px-1.5 py-0.5 rounded border border-border/40 bg-muted/20 text-foreground text-[10px]">
                        {privacyMode ? maskSensitiveValue(acc) : acc}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ---- Accounts Table ----
type AccCol = "idx" | "account_id" | "score" | "reasons";
const ACC_COL_LABELS: Record<AccCol, string> = {
  idx: "#", account_id: "ACCOUNT ID", score: "SCORE", reasons: "FLAGS",
};

const AccountsTable: React.FC<{ suspiciousAccounts: SuspiciousAccount[]; privacyMode: boolean }> = ({ suspiciousAccounts, privacyMode }) => {
  const [sortCol, setSortCol] = useState<AccCol>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (col: AccCol) => {
    if (sortCol === col) {
      setSortDir(d => d === "desc" ? "asc" : d === "asc" ? null : "desc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    if (!sortDir || sortCol === "idx" || sortCol === "reasons") return suspiciousAccounts;
    return [...suspiciousAccounts].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const va: any = sortCol === "score" ? a.score : a.account_id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vb: any = sortCol === "score" ? b.score : b.account_id;
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [suspiciousAccounts, sortCol, sortDir]);

  if (suspiciousAccounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground font-mono text-sm">
        No suspicious accounts detected
      </div>
    );
  }

  return (
    <div className="overflow-auto flex-1">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-border/50">
            {(["idx", "account_id", "score", "reasons"] as AccCol[]).map(col => (
              <th
                key={col}
                className={`text-left py-2 px-3 text-muted-foreground font-normal tracking-wider ${col !== "reasons" && col !== "idx" ? "cursor-pointer hover:text-foreground select-none" : ""}`}
                onClick={() => col !== "reasons" && col !== "idx" && handleSort(col)}
              >
                <span className="flex items-center">
                  {ACC_COL_LABELS[col]}
                  {col !== "reasons" && col !== "idx" && <SortIcon dir={sortCol === col ? sortDir : null} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((account, i) => (
            <tr key={account.account_id} className="border-b border-border/20 hover:bg-primary/5 transition-colors">
              <td className="py-2 px-3 text-muted-foreground/60">{i + 1}</td>
              <td className="py-2 px-3 text-foreground font-bold">{privacyMode ? maskSensitiveValue(account.account_id) : account.account_id}</td>
              <td className="py-2 px-3"><ScoreBadge score={account.score} /></td>
              <td className="py-2 px-3">
                <div className="flex flex-wrap gap-1">
                  {account.reasons.map((r, ri) => (
                    <span
                      key={ri}
                      className="px-1.5 py-0.5 rounded text-muted-foreground bg-muted/30 border border-border/30"
                      style={{ fontSize: "10px" }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---- Main Component ----
export const FraudTable: React.FC<FraudTableProps> = ({ suspiciousAccounts, fraudRings, privacyMode = true }) => {
  const [activeTab, setActiveTab] = useState<"accounts" | "rings">("accounts");

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-0 border-b border-border/50 mb-4">
        {(["accounts", "rings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-mono tracking-wider transition-colors duration-150 border-b-2 -mb-px ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === tab ? { color: "hsl(155 100% 50%)", borderColor: "hsl(155 100% 50%)" } : {}}
          >
            {tab === "accounts"
              ? `SUSPICIOUS ACCOUNTS (${suspiciousAccounts.length})`
              : `FRAUD RINGS (${fraudRings.length})`}
          </button>
        ))}
      </div>

      {activeTab === "accounts" && <AccountsTable suspiciousAccounts={suspiciousAccounts} privacyMode={privacyMode} />}
      {activeTab === "rings" && <RingsTable fraudRings={fraudRings} privacyMode={privacyMode} />}
    </div>
  );
};
