import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MatrixRain from "@/components/MatrixRain";
import { CsvUploader } from "@/components/fraud/CsvUploader";
import { GraphVisualization } from "@/components/fraud/GraphVisualization";
import { FraudTable } from "@/components/fraud/FraudTable";
import { SummaryPanel } from "@/components/fraud/SummaryPanel";
import { TimelineScrubber } from "@/components/fraud/TimelineScrubber";
import { VoiceAssistant, VoiceScreenContext } from "@/components/fraud/VoiceAssistant";
import { AccountDetailDrawer } from "@/components/fraud/AccountDetailDrawer";
import { DetectionSettingsPanel } from "@/components/fraud/DetectionSettingsPanel";
import { WatchlistBanner } from "@/components/fraud/WatchlistBanner";
import { WatchlistPanel } from "@/components/fraud/WatchlistPanel";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Transaction, AnalysisResult } from "@/types/fraud";
import { Shield, Cpu, AlertTriangle, ChevronLeft, Clock, Activity, Network, LogOut, UserCircle, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { DetectionWeights, DEFAULT_WEIGHTS, rescoreAccounts } from "@/lib/scoring";

type Tab = "graph" | "table" | "summary";

// Processing steps for progress indicator
const ANALYSIS_STEPS = [
  "Parsing transactions...",
  "Building transaction graph...",
  "Detecting cycles (3–5 hops)...",
  "Analyzing smurfing patterns...",
  "Tracing shell account chains...",
  "Computing suspicion scores...",
  "Applying false positive filters...",
  "Generating visualization data...",
];

// Mini metric card
const MetricCard: React.FC<{ label: string; value: string | number; color: string; icon: React.ReactNode }> = ({
  label, value, color, icon
}) => (
  <div className="bg-card/50 border border-border/40 rounded-md px-3 py-2 flex items-center gap-2.5 min-w-0">
    <div style={{ color }}>{icon}</div>
    <div className="min-w-0">
      <div className="text-base font-bold font-mono leading-none" style={{ color }}>{value}</div>
      <div className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">{label}</div>
    </div>
  </div>
);

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("graph");
  const [processingStep, setProcessingStep] = useState(0);
  const [processingTime, setProcessingTime] = useState<number | undefined>();
  const [privacyMode, setPrivacyMode] = useState(true);
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();
  const stepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timeline scrubber state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Account detail drawer state
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Detection settings — adjustable scoring weights
  const [weights, setWeights] = useState<DetectionWeights>(DEFAULT_WEIGHTS);

  // Watchlist
  const { entries: watchlistEntries, isPinned } = useWatchlist();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Re-score accounts in real-time using current weights and propagate everywhere.
  const weightedResult = useMemo<AnalysisResult | null>(() => {
    if (!analysisResult) return null;
    const rescored = rescoreAccounts(analysisResult.suspicious_accounts, weights);
    return {
      ...analysisResult,
      suspicious_accounts: rescored,
      summary: {
        ...analysisResult.summary,
        suspicious_accounts_count: rescored.length,
      },
    };
  }, [analysisResult, weights]);
  const { minTs, maxTs } = useMemo(() => {
    const edges = analysisResult?.graph.edges || [];
    const times = edges
      .map(e => (e.timestamp ? new Date(e.timestamp).getTime() : NaN))
      .filter(t => Number.isFinite(t)) as number[];
    if (times.length === 0) return { minTs: 0, maxTs: 0 };
    return { minTs: Math.min(...times), maxTs: Math.max(...times) };
  }, [analysisResult]);

  // Reset playhead to end when new analysis arrives (show everything)
  useEffect(() => {
    if (maxTs > 0) setCurrentTime(maxTs);
    setIsPlaying(false);
  }, [maxTs, minTs]);

  // Play loop: advance currentTime across the range over ~12 seconds
  useEffect(() => {
    if (playRef.current) {
      clearInterval(playRef.current);
      playRef.current = null;
    }
    if (!isPlaying || maxTs <= minTs) return;
    const DURATION_MS = 12000;
    const TICK_MS = 80;
    const stepSize = (maxTs - minTs) / (DURATION_MS / TICK_MS);
    playRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + stepSize;
        if (next >= maxTs) {
          setIsPlaying(false);
          return maxTs;
        }
        return next;
      });
    }, TICK_MS);
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, [isPlaying, minTs, maxTs]);


  // Simulate progress steps while waiting for backend
  const startProgressSimulation = () => {
    setProcessingStep(0);
    let step = 0;
    stepIntervalRef.current = setInterval(() => {
      step = Math.min(step + 1, ANALYSIS_STEPS.length - 1);
      setProcessingStep(step);
    }, 600);
  };

  const stopProgressSimulation = () => {
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
    }
    setProcessingStep(ANALYSIS_STEPS.length - 1);
  };

  const handleUpload = useCallback(async (transactions: Transaction[], metadata: { fileName: string; fileHash: string }) => {
    setIsLoading(true);
    setAnalysisResult(null);
    const uploadStart = Date.now();
    startProgressSimulation();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Your session expired. Please sign in again.");

      const { data, error } = await supabase.functions.invoke("analyze-transactions", {
        body: { transactions, fileName: metadata.fileName, fileHash: metadata.fileHash },
      });

      stopProgressSimulation();

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const elapsed = Date.now() - uploadStart;
      setProcessingTime(elapsed);
      setAnalysisResult(data as AnalysisResult);
      setActiveTab("graph");

      toast({
        title: "Analysis Complete",
        description: `Found ${data.summary.suspicious_accounts_count} suspicious accounts in ${(elapsed / 1000).toFixed(1)}s.`,
      });
    } catch (err) {
      stopProgressSimulation();
      toast({
        title: "Analysis Failed",
        description: err instanceof Error ? err.message : "Failed to analyze transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const suspiciousSet = useMemo(
    () => new Set(weightedResult?.suspicious_accounts.map(a => a.account_id) || []),
    [weightedResult],
  );

  // Watchlist hits in current analysis
  const watchlistHits = useMemo(() => {
    if (!analysisResult) return [];
    const nodeIds = new Set(analysisResult.graph.nodes.map(n => n.id));
    return watchlistEntries.map(e => e.account_id).filter(id => nodeIds.has(id));
  }, [analysisResult, watchlistEntries]);

  // Reset banner dismissal when a new analysis loads
  useEffect(() => { setBannerDismissed(false); }, [analysisResult]);

  // Derive current voice screen context from active tab
  const voiceScreen: VoiceScreenContext =
    !analysisResult ? "upload"
    : activeTab === "graph" ? "graph"
    : "summary";

  const tabs: { id: Tab; label: string }[] = [
    { id: "graph", label: "GRAPH VIEW" },
    { id: "table", label: "FRAUD TABLE" },
    { id: "summary", label: "SUMMARY" },
  ];

  const progressPct = ANALYSIS_STEPS.length > 0
    ? Math.round(((processingStep + 1) / ANALYSIS_STEPS.length) * 100)
    : 0;

  return (
    <div className="relative min-h-screen hex-pattern overflow-x-hidden bg-background">
      <MatrixRain />
      <div className="fixed inset-0 pointer-events-none z-0" style={{ background: "var(--gradient-glow)" }} />

      {/* NAV */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-4 border-b border-border/50 backdrop-blur-sm bg-background/70">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors mr-2 px-2 py-1 rounded border border-border/40 hover:border-primary/40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />HOME
          </button>
          <div className="w-7 h-7">
            <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5L10 22V55C10 78 28 98 50 108C72 98 90 78 90 55V22L50 5Z" fill="hsl(155 100% 50% / 0.15)" stroke="hsl(155 100% 50%)" strokeWidth="2" />
              <path d="M38 58L46 66L63 49" stroke="hsl(155 100% 50%)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="font-mono text-sm font-bold tracking-widest" style={{ fontFamily: "Orbitron, monospace", color: "hsl(155 100% 50%)" }}>
              MONEY MULING DETECTION ENGINE
            </div>
            <div className="text-xs font-mono text-muted-foreground tracking-wider">Financial Crime Analysis Platform</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono px-2 py-1 rounded border border-border/30 bg-card/30 max-w-[260px]">
            <UserCircle className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground truncate">{profile?.display_name || user?.email}</span>
          </div>
          {/* Processing time badge */}
          {processingTime && (
            <div className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded border border-border/30 bg-card/30">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">{(processingTime / 1000).toFixed(2)}s</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs font-mono px-2 py-1 rounded border border-primary/30 bg-primary/5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "hsl(155 100% 50%)" }} />
            <span className="text-muted-foreground">ENGINE:</span>
            <span style={{ color: "hsl(155 100% 50%)" }}>ONLINE</span>
          </div>
          <button
            onClick={() => void signOut().then(() => navigate("/auth"))}
            className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />SIGN OUT
          </button>
        </div>
      </nav>

      <main className="relative z-10 px-4 md:px-8 py-6 max-w-[1600px] mx-auto">
        <div className="mb-4 flex items-center justify-end gap-3 rounded-md border border-border/40 bg-card/30 px-3 py-2 backdrop-blur-sm">
          <EyeOff className="h-4 w-4 text-muted-foreground" />
          <label htmlFor="privacy-mode" className="text-xs font-mono text-muted-foreground">PRIVACY MODE</label>
          <Switch id="privacy-mode" checked={privacyMode} onCheckedChange={setPrivacyMode} />
        </div>

        {/* Upload section */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4" style={{ color: "hsl(155 100% 50%)" }} />
            <span className="text-xs font-mono tracking-widest text-muted-foreground">// TRANSACTION UPLOAD</span>
          </div>
          <div className="bg-card/40 border border-border/50 rounded-lg p-4 backdrop-blur-sm">
            <CsvUploader onUpload={handleUpload} isLoading={isLoading} />
          </div>
        </section>

        {/* Watchlist panel — always visible */}
        <section className="mb-6">
          <WatchlistPanel
            privacyMode={privacyMode}
            onSelect={(id) => { setSelectedAccountId(id); setDrawerOpen(true); }}
          />
        </section>

        {/* Processing progress indicator */}
        {isLoading && (
          <section className="mb-6">
            <div className="bg-card/40 border border-border/50 rounded-lg p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0" style={{ borderColor: "hsl(155 100% 50%)", borderTopColor: "transparent" }} />
                <span className="text-sm font-mono" style={{ color: "hsl(155 100% 50%)" }}>
                  {ANALYSIS_STEPS[processingStep]}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    background: "linear-gradient(90deg, hsl(155 100% 50%), hsl(185 100% 55%))",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] font-mono text-muted-foreground">Step {processingStep + 1} of {ANALYSIS_STEPS.length}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{progressPct}%</span>
              </div>
            </div>
          </section>
        )}

        {/* Results section */}
        {(analysisResult || isLoading) && (
          <section>
            {/* Watchlist banner */}
            {analysisResult && !isLoading && !bannerDismissed && watchlistHits.length > 0 && (
              <WatchlistBanner
                hits={watchlistHits}
                onDismiss={() => setBannerDismissed(true)}
                onSelect={(id) => { setSelectedAccountId(id); setDrawerOpen(true); }}
                privacyMode={privacyMode}
              />
            )}

            {/* Detection Settings */}
            {analysisResult && !isLoading && (
              <div className="mb-4">
                <DetectionSettingsPanel weights={weights} onChange={setWeights} />
              </div>
            )}

            {/* Summary metrics strip */}
            {analysisResult && !isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <MetricCard
                  label="Accounts Analyzed"
                  value={analysisResult.summary.total_accounts.toLocaleString()}
                  color="hsl(185 100% 55%)"
                  icon={<Activity className="w-4 h-4" />}
                />
                <MetricCard
                  label="Suspicious Flagged"
                  value={(weightedResult?.summary.suspicious_accounts_count ?? 0).toLocaleString()}
                  color="hsl(0 84% 60%)"
                  icon={<AlertTriangle className="w-4 h-4" />}
                />
                <MetricCard
                  label="Fraud Rings"
                  value={analysisResult.summary.fraud_rings_detected.toLocaleString()}
                  color="hsl(45 100% 55%)"
                  icon={<Network className="w-4 h-4" />}
                />
                <MetricCard
                  label="Processing Time"
                  value={processingTime ? `${(processingTime / 1000).toFixed(2)}s` : "—"}
                  color="hsl(155 100% 50%)"
                  icon={<Clock className="w-4 h-4" />}
                />
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-0 border-b border-border/50 mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 text-xs font-mono tracking-wider border-b-2 transition-colors duration-150 -mb-px ${
                    activeTab === tab.id
                      ? "border-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  style={activeTab === tab.id ? { color: "hsl(155 100% 50%)", borderColor: "hsl(155 100% 50%)" } : {}}
                >
                  {tab.label}
                  {tab.id === "table" && weightedResult && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: "hsl(0 84% 60% / 0.2)", color: "hsl(0 84% 60%)", fontSize: "10px" }}>
                      {weightedResult.suspicious_accounts.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Graph tab */}
            {activeTab === "graph" && (
              <>
                <div className="bg-card/40 border border-border/50 rounded-lg overflow-hidden" style={{ height: "560px" }}>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(155 100% 50%)", borderTopColor: "transparent" }} />
                      <p className="text-sm font-mono" style={{ color: "hsl(155 100% 50%)" }}>Building transaction graph...</p>
                      <p className="text-xs font-mono text-muted-foreground">Detecting cycles · Smurfing · Shell chains</p>
                    </div>
                  ) : analysisResult ? (
                    <GraphVisualization
                      nodes={analysisResult.graph.nodes}
                      edges={analysisResult.graph.edges}
                      suspiciousSet={suspiciousSet}
                      fraudRings={analysisResult.fraud_rings}
                      privacyMode={privacyMode}
                      currentTime={currentTime}
                      onNodeSelect={(id) => { setSelectedAccountId(id); setDrawerOpen(true); }}
                    />
                  ) : null}
                </div>

                {/* Timeline scrubber */}
                {analysisResult && !isLoading && maxTs > minTs && (
                  <div className="mt-4">
                    <TimelineScrubber
                      edges={analysisResult.graph.edges}
                      currentTime={currentTime}
                      onTimeChange={(t) => { setIsPlaying(false); setCurrentTime(t); }}
                      isPlaying={isPlaying}
                      onPlayToggle={() => {
                        setIsPlaying(prev => {
                          if (!prev && currentTime >= maxTs) setCurrentTime(minTs);
                          return !prev;
                        });
                      }}
                    />
                  </div>
                )}
              </>
            )}

            {/* Table tab */}
            {activeTab === "table" && weightedResult && (
              <div className="bg-card/40 border border-border/50 rounded-lg p-4 backdrop-blur-sm" style={{ minHeight: "500px" }}>
                <FraudTable
                  suspiciousAccounts={weightedResult.suspicious_accounts}
                  fraudRings={weightedResult.fraud_rings}
                  privacyMode={privacyMode}
                />
              </div>
            )}

            {/* Summary tab */}
            {activeTab === "summary" && weightedResult && (
              <div className="bg-card/40 border border-border/50 rounded-lg p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4" style={{ color: "hsl(0 84% 60%)" }} />
                  <span className="text-xs font-mono tracking-widest text-muted-foreground">// ANALYSIS SUMMARY</span>
                </div>
                <SummaryPanel result={weightedResult} privacyMode={privacyMode} />
              </div>
            )}
          </section>
        )}

        {/* Landing state */}
        {!analysisResult && !isLoading && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Shield,
                title: "Cycle Detection",
                desc: "Detects circular routing patterns (3–5 hops) that form fraud rings between accounts.",
                badge: "CYCLES",
              },
              {
                icon: AlertTriangle,
                title: "Smurfing Detection",
                desc: "Identifies fan-in (10+ senders → 1 receiver) and fan-out patterns within 72-hour windows.",
                badge: "SMURF",
              },
              {
                icon: Cpu,
                title: "Shell Chain Analysis",
                desc: "Traces layered shell account chains with intermediaries having only 2–3 transactions.",
                badge: "SHELL",
              },
            ].map(({ icon: Icon, title, desc, badge }) => (
              <div key={title} className="bg-card/30 border border-border/40 rounded-lg p-5 hover:bg-card/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-5 h-5" style={{ color: "hsl(155 100% 50%)" }} />
                  <span className="text-xs font-mono px-2 py-0.5 rounded border border-border/40 text-muted-foreground">{badge}</span>
                </div>
                <h3 className="text-sm font-mono font-bold text-foreground mb-2">{title}</h3>
                <p className="text-xs font-mono text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <VoiceAssistant
        analysisResult={weightedResult}
        currentScreen={voiceScreen}
        processingTime={processingTime}
      />

      <AccountDetailDrawer
        accountId={selectedAccountId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        analysisResult={weightedResult}
        privacyMode={privacyMode}
      />
    </div>
  );
};

export default Index;
