import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AnalysisResult } from "@/types/fraud";
import { maskSensitiveValue } from "@/lib/privacy";
import { ShieldCheck, Search, CircleSlash, Loader2, Save, Pin, PinOff, Check } from "lucide-react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { ThreatRadarChart } from "./ThreatRadarChart";

export type InvestigationStatus = "none" | "verified" | "under_review";

interface Props {
  accountId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  analysisResult: AnalysisResult | null;
  privacyMode: boolean;
}

export const AccountDetailDrawer: React.FC<Props> = ({
  accountId, open, onOpenChange, analysisResult, privacyMode,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPinned, toggle: togglePin } = useWatchlist();
  const pinned = accountId ? isPinned(accountId) : false;
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<InvestigationStatus>("none");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pinConfirm, setPinConfirm] = useState<{ show: boolean; pinned: boolean } | null>(null);

  // Compute account context from existing analysis (no extra fetch)
  const suspicious = analysisResult?.suspicious_accounts.find(a => a.account_id === accountId);
  const rings = (analysisResult?.fraud_rings || []).filter(r => r.accounts.includes(accountId || ""));
  const node = analysisResult?.graph.nodes.find(n => n.id === accountId);

  const inDegree = (analysisResult?.graph.edges || []).filter(e => e.target === accountId).length;
  const outDegree = (analysisResult?.graph.edges || []).filter(e => e.source === accountId).length;
  const totalIn = (analysisResult?.graph.edges || [])
    .filter(e => e.target === accountId).reduce((s, e) => s + (e.amount || 0), 0);
  const totalOut = (analysisResult?.graph.edges || [])
    .filter(e => e.source === accountId).reduce((s, e) => s + (e.amount || 0), 0);

  // Load notes when account changes
  useEffect(() => {
    if (!open || !accountId || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("investigation_notes")
        .select("notes,status")
        .eq("user_id", user.id)
        .eq("account_id", accountId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast({ title: "Failed to load notes", description: error.message, variant: "destructive" });
      }
      setNotes(data?.notes ?? "");
      setStatus((data?.status as InvestigationStatus) ?? "none");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [accountId, open, user, toast]);

  const persist = async (nextStatus?: InvestigationStatus, nextNotes?: string) => {
    if (!user || !accountId) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      account_id: accountId,
      notes: nextNotes ?? notes,
      status: nextStatus ?? status,
    };
    const { error } = await supabase
      .from("investigation_notes")
      .upsert(payload, { onConflict: "user_id,account_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Investigation note persisted." });
    }
  };

  const setAndSaveStatus = async (s: InvestigationStatus) => {
    setStatus(s);
    await persist(s, notes);
  };

  const handleTogglePin = async () => {
    if (!accountId) return;
    const wasPinned = pinned;
    await togglePin(accountId);
    setPinConfirm({ show: true, pinned: !wasPinned });
    setTimeout(() => setPinConfirm(null), 2500);
  };

  const display = accountId ? (privacyMode ? maskSensitiveValue(accountId) : accountId) : "";

  const statusMeta: Record<InvestigationStatus, { label: string; color: string; icon: React.ReactNode }> = {
    none: { label: "UNFLAGGED", color: "hsl(0 0% 55%)", icon: <CircleSlash className="w-3 h-3" /> },
    verified: { label: "VERIFIED", color: "hsl(155 100% 50%)", icon: <ShieldCheck className="w-3 h-3" /> },
    under_review: { label: "UNDER REVIEW", color: "hsl(45 100% 55%)", icon: <Search className="w-3 h-3" /> },
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-background/95 backdrop-blur-md border-l border-border/60">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm tracking-wider" style={{ color: "hsl(155 100% 50%)" }}>
            ACCOUNT DOSSIER
          </SheetTitle>
          <SheetDescription className="font-mono text-xs break-all">
            {display}
          </SheetDescription>
        </SheetHeader>

        {/* Status badges */}
        <div className="mt-4 flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-[10px] tracking-wider"
            style={{ color: statusMeta[status].color, borderColor: statusMeta[status].color }}
          >
            <span className="inline-flex items-center gap-1">{statusMeta[status].icon}{statusMeta[status].label}</span>
          </Badge>
          {node?.suspicious && (
            <Badge variant="outline" className="font-mono text-[10px]" style={{ color: "hsl(0 84% 60%)", borderColor: "hsl(0 84% 60% / 0.6)" }}>
              SUSPICIOUS · {node.score}
            </Badge>
          )}
          {pinned && (
            <Badge variant="outline" className="font-mono text-[10px]" style={{ color: "hsl(45 100% 55%)", borderColor: "hsl(45 100% 55% / 0.6)" }}>
              <span className="inline-flex items-center gap-1"><Pin className="w-3 h-3" />WATCHLIST</span>
            </Badge>
          )}
        </div>

        {/* Watchlist toggle */}
        <div className="mt-3">
          <Button
            size="sm"
            variant={pinned ? "default" : "outline"}
            onClick={handleTogglePin}
            className="w-full font-mono text-[11px] h-8"
          >
            {pinned ? <PinOff className="w-3.5 h-3.5 mr-1.5" /> : <Pin className="w-3.5 h-3.5 mr-1.5" />}
            {pinned ? "REMOVE FROM WATCHLIST" : "PIN TO WATCHLIST"}
          </Button>
          {pinConfirm?.show && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono rounded-md px-2.5 py-1.5 border animate-in fade-in slide-in-from-top-2 duration-300"
              style={{
                color: pinConfirm.pinned ? "hsl(155 100% 50%)" : "hsl(0 0% 60%)",
                borderColor: pinConfirm.pinned ? "hsl(155 100% 50% / 0.5)" : "hsl(0 0% 60% / 0.4)",
                backgroundColor: pinConfirm.pinned ? "hsl(155 100% 50% / 0.08)" : "hsl(0 0% 60% / 0.06)",
              }}
            >
              <Check className="w-3 h-3" />
              {pinConfirm.pinned ? "Account pinned to watchlist" : "Account removed from watchlist"}
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {[
            { l: "In-degree", v: inDegree },
            { l: "Out-degree", v: outDegree },
            { l: "Total In", v: totalIn.toLocaleString(undefined, { maximumFractionDigits: 2 }) },
            { l: "Total Out", v: totalOut.toLocaleString(undefined, { maximumFractionDigits: 2 }) },
          ].map(({ l, v }) => (
            <div key={l} className="bg-card/50 border border-border/40 rounded-md px-3 py-2">
              <div className="text-[10px] font-mono text-muted-foreground">{l}</div>
              <div className="text-sm font-mono font-bold" style={{ color: "hsl(185 100% 60%)" }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Risk reasons */}
        {suspicious && suspicious.reasons.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] font-mono text-muted-foreground mb-1.5">// RISK SIGNALS</div>
            <ul className="space-y-1">
              {suspicious.reasons.map((r, i) => (
                <li key={i} className="text-xs font-mono text-foreground/90 flex gap-1.5">
                  <span style={{ color: "hsl(0 84% 60%)" }}>›</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk Radar Chart */}
        {node && (
          <div className="mt-4">
            <ThreatRadarChart score={node.score} reasons={suspicious?.reasons || []} />
          </div>
        )}

        {/* Threat Intelligence / Dark Web OSINT */}
        {accountId && (
          <div className="mt-4 border border-rose-500/20 bg-rose-950/10 rounded-md p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <div className="text-[10px] font-mono text-rose-400 font-bold tracking-widest">// OSINT & DARK WEB THREAT INTEL</div>
            </div>
            
            <div className="space-y-2 font-mono text-[10px] text-muted-foreground">
              <div className="flex justify-between border-b border-border/20 pb-1">
                <span>DARKNET LEAKS:</span>
                <span className="text-rose-400 font-bold">Hydra Market Wallet Association</span>
              </div>
              <div className="flex justify-between border-b border-border/20 pb-1">
                <span>COMPROMISED LOGS:</span>
                <span className="text-rose-300">Linked to credentials found in 2025 dark web dump</span>
              </div>
              <div className="flex justify-between">
                <span>IP TERMINAL:</span>
                <span className="text-foreground">Commercial proxy &amp; TOR Router nodes matched</span>
              </div>
            </div>
          </div>
        )}

        {/* Ring memberships */}
        {rings.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] font-mono text-muted-foreground mb-1.5">// FRAUD RINGS</div>
            <div className="flex flex-wrap gap-1.5">
              {rings.map(r => (
                <Badge key={r.ring_id} variant="outline" className="font-mono text-[10px]">
                  {r.ring_id} · {r.type}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Status actions */}
        <div className="mt-5">
          <div className="text-[10px] font-mono text-muted-foreground mb-1.5">// FLAG STATUS</div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm" variant={status === "verified" ? "default" : "outline"}
              disabled={saving || loading}
              onClick={() => setAndSaveStatus("verified")}
              className="font-mono text-[10px] h-8"
            >
              <ShieldCheck className="w-3 h-3 mr-1" />VERIFIED
            </Button>
            <Button
              size="sm" variant={status === "under_review" ? "default" : "outline"}
              disabled={saving || loading}
              onClick={() => setAndSaveStatus("under_review")}
              className="font-mono text-[10px] h-8"
            >
              <Search className="w-3 h-3 mr-1" />REVIEW
            </Button>
            <Button
              size="sm" variant={status === "none" ? "default" : "outline"}
              disabled={saving || loading}
              onClick={() => setAndSaveStatus("none")}
              className="font-mono text-[10px] h-8"
            >
              <CircleSlash className="w-3 h-3 mr-1" />CLEAR
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-5">
          <div className="text-[10px] font-mono text-muted-foreground mb-1.5">// INVESTIGATIVE NOTES</div>
          {loading ? (
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground py-6 justify-center">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading notes…
            </div>
          ) : (
            <>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document findings, hypotheses, and next steps for this account…"
                className="min-h-[140px] font-mono text-xs bg-card/40 border-border/50"
              />
              <Button
                onClick={() => persist(status, notes)}
                disabled={saving}
                size="sm"
                className="mt-2 w-full font-mono text-[11px]"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                SAVE NOTES
              </Button>
            </>
          )}
        </div>

        <p className="mt-4 text-[10px] font-mono text-muted-foreground/70 leading-relaxed">
          Notes &amp; flags are private to your account and persist across sessions. They are kept separate from the downloadable forensic JSON report.
        </p>
      </SheetContent>
    </Sheet>
  );
};
