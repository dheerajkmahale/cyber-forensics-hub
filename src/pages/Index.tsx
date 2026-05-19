import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MatrixRain from "@/components/MatrixRain";
import { CsvUploader } from "@/components/fraud/CsvUploader";
import { GraphVisualization } from "@/components/fraud/GraphVisualization";
import { FraudTable } from "@/components/fraud/FraudTable";
import { SummaryPanel } from "@/components/fraud/SummaryPanel";
import { ForensicTerminalHUD } from "@/components/fraud/ForensicTerminalHUD";
import { ForensicCopilotDrawer } from "@/components/fraud/ForensicCopilotDrawer";
import { OSINTThreatFeed } from "@/components/fraud/OSINTThreatFeed";
import { DecryptorWiretap } from "@/components/fraud/DecryptorWiretap";
import { DatasetGeneratorPanel } from "@/components/fraud/DatasetGeneratorPanel";
import { generateNextStreamEvent } from "@/utils/liveMonitoringEngine";
import { TimelineScrubber } from "@/components/fraud/TimelineScrubber";
import { AccountDetailDrawer } from "@/components/fraud/AccountDetailDrawer";
import { DetectionSettingsPanel } from "@/components/fraud/DetectionSettingsPanel";
import { WatchlistBanner } from "@/components/fraud/WatchlistBanner";
import { WatchlistPanel } from "@/components/fraud/WatchlistPanel";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Transaction, AnalysisResult } from "@/types/fraud";
import { Shield, Cpu, AlertTriangle, ChevronLeft, Clock, Activity, Network, LogOut, UserCircle, EyeOff, FileText, Play, Square, Pause, ShieldCheck, Download, Globe, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { DetectionWeights, DEFAULT_WEIGHTS, rescoreAccounts } from "@/lib/scoring";
import { GeoTraceVisualization } from "@/components/fraud/GeoTraceVisualization";
import { jsPDF } from "jspdf";

type Tab = "graph" | "geo" | "table" | "summary";

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

  // Mitigation state - Locked mule assets
  const [frozenAccounts, setFrozenAccounts] = useState<Set<string>>(new Set());

  // Live Telemetry Simulation state
  const [liveMonitoringActive, setLiveMonitoringActive] = useState(false);
  const [activeScenarioName, setActiveScenarioName] = useState<string>("Forensic Baseline");
  const [liveLog, setLiveLog] = useState<{ id: string; text: string; type: "normal" | "suspect" | "alert" }[]>([]);
  const liveSimIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveStepRef = useRef(0);

  // Timeline scrubber state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cinematic red alert overlay state
  const [cinematicAlert, setCinematicAlert] = useState<{ active: boolean; text: string; details?: string } | null>(null);

  // Web Audio native warning sound synthesizer
  const playForensicWarningSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First Oscillator (Sawtooth sweep for urgency)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(140, audioCtx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(260, audioCtx.currentTime + 0.5);
      
      gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.8);

      // Second Oscillator (High alarm beep)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(920, audioCtx.currentTime);
      
      gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.4);
    } catch (err) {
      console.warn("Audio Context playback disabled by browser security policies", err);
    }
  }, []);

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


  // Freeze Account callback
  const handleFreezeAccount = useCallback((accountId: string) => {
    setFrozenAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
        toast({
          title: "Assets Unlocked",
          description: `Restriction removed from Account ID: ${accountId}.`,
        });
      } else {
        next.add(accountId);
        toast({
          title: "🚨 Assets Frozen Successfully",
          description: `All transaction pipelines for Account ID: ${accountId} have been restricted. Hot Wallet assets locked at smart contract/database layer.`,
          style: {
            background: "hsla(185, 100%, 50%, 0.15)",
            border: "1px solid hsl(185, 100%, 50%)",
            color: "hsl(185, 100%, 50%)",
          },
        });
      }
      return next;
    });
  }, [toast]);

  // Case dossier vector PDF report generator
  const generateCaseReportPDF = useCallback(() => {
    if (!weightedResult) {
      toast({
        title: "No Analysis Data",
        description: "Please run analysis or start live telemetry first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString();
      const analystName = profile?.display_name || user?.email || "SYSTEM_OPERATOR";
      const caseId = `FC-CASE-${Math.floor(100000 + Math.random() * 900000)}`;

      // Theme Colors
      const primaryColor = [15, 23, 42]; // Slate 900
      const accentColor = [16, 185, 129]; // Emerald 500
      const dangerColor = [239, 68, 68]; // Red 500
      const lightBg = [248, 250, 252]; // Slate 50

      // Official Intelligence dossier header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 38, "F");

      // Glowing accent line
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(0, 38, 210, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.text("CYBER CRIME INTELLIGENCE COMMAND", 15, 18);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text("FINANCIAL FORENSICS DIVISION • LAUNDERING INTELLIGENCE REPORT", 15, 25);
      
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setFont("Courier", "bold");
      doc.setFontSize(10);
      doc.text("CONFIDENTIAL // INTERNAL USE ONLY", 15, 32);

      // Metadata section
      doc.setTextColor(51, 65, 85);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("CASE DOSSIER METADATA", 15, 52);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 54, 195, 54);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`CASE REF:       ${caseId}`, 15, 62);
      doc.text(`GENERATED ON:   ${timestamp}`, 15, 68);
      doc.text(`OPERATOR REF:   ${analystName}`, 15, 74);
      doc.text(`SYSTEM CORE:    ONLINE // HYPERION-CF`, 15, 80);

      // Threat Score badge (Right side)
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(135, 48, 60, 36, "F");
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(135, 48, 60, 36, "S");
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.text("ENGINE STATUS STATUS", 140, 56);

      const flaggedPct = weightedResult.suspicious_accounts.length;
      doc.setFontSize(16);
      doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
      doc.text(`HIGH RISK`, 140, 68);
      
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${flaggedPct} Suspicious Mules Flagged`, 140, 76);

      // Case statistics / findings
      doc.setTextColor(51, 65, 85);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("EXECUTIVE KEY FINDINGS SUMMARY", 15, 96);
      doc.line(15, 98, 195, 98);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`• Total Financial Nodes Scanned:        ${weightedResult.summary.total_accounts}`, 15, 106);
      doc.text(`• Suspicious Mules Flagged:            ${weightedResult.suspicious_accounts.length}`, 15, 112);
      doc.text(`• Active Money Laundering Rings:       ${weightedResult.summary.fraud_rings_detected}`, 15, 118);
      doc.text(`• Total Mitigation Restrictive Orders:  ${frozenAccounts.size} account asset wallets frozen`, 15, 124);

      // Flagged Mules Table
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("DETAILED THREAT MITIGATION PIPELINE", 15, 140);
      doc.line(15, 142, 195, 142);

      // Table Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, 146, 180, 8, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("ACCOUNT ID", 18, 151.5);
      doc.text("RISK SCORE", 80, 151.5);
      doc.text("MITIGATION STATUS", 115, 151.5);
      doc.text("LAUNDERING REASON", 150, 151.5);

      let tableY = 154;
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(51, 65, 85);

      weightedResult.suspicious_accounts.forEach((acc) => {
        if (tableY > 260) {
          doc.addPage();
          tableY = 20;
        }

        const isAccFrozen = frozenAccounts.has(acc.account_id);

        // Striped Background row
        doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
        doc.rect(15, tableY, 180, 8, "F");

        doc.setFont("Courier", "bold");
        doc.text(privacyMode ? acc.account_id.replace(/(.{4}).*(.{4})/, "$1****$2") : acc.account_id, 18, tableY + 5.5);
        
        doc.setFont("Helvetica", "bold");
        if (acc.score >= 70) doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
        else doc.setTextColor(245, 158, 11);
        doc.text(`${acc.score}/100`, 80, tableY + 5.5);

        doc.setFont("Helvetica", "bold");
        if (isAccFrozen) {
          doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.text("🔒 LOCKED [FROZEN]", 115, tableY + 5.5);
        } else {
          doc.setTextColor(dangerColor[0], dangerColor[1], dangerColor[2]);
          doc.text("⚠ ACTIVE ASSETS", 115, tableY + 5.5);
        }

        const reason = acc.reasons[0] || "Suspicious Flow Linkage";
        doc.text(reason.length > 25 ? reason.slice(0, 22) + "..." : reason, 150, tableY + 5.5);

        tableY += 9;
      });

      // Authorization Signature Block on Page 1 (Brief notice)
      doc.setTextColor(51, 65, 85);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.text("PRELIMINARY FINDINGS ONLY — DUAL PAGE DOSSIER", 15, tableY + 12);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("Case metadata maps to deep regulatory indicators. Refer to Page 2 for comprehensive PMLA Section 3/4 breakdowns.", 15, tableY + 17);

      // ================= PAGE 2: FORENSIC INVESTIGATION BRIEFING & REGULATORY PRECEDENTS =================
      doc.addPage();
      
      // Page 2 Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 15, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("FORENSIC INTELLIGENCE ANALYTICAL COMPLIANCE DOSSIER", 15, 10);
      
      // Reset text color
      doc.setTextColor(51, 65, 85);
      
      // Section 1: Detailed Laundering Typologies
      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.text("1. METHODOLOGY & TECHNICAL SCHEMES DETECTED", 15, 30);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 32, 195, 32);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      
      let typologiesY = 40;
      doc.setFont("Helvetica", "bold");
      doc.text("A. Structuring & Smurfing:", 15, typologiesY);
      doc.setFont("Helvetica", "normal");
      doc.text("Multiple fragmented micro-deposits structured below statutory reporting limits ($10,000 / INR 10 Lakhs)", 15, typologiesY + 5);
      doc.text("transiting unverified mule wallets to evade anti-money laundering (AML) rule-based thresholds.", 15, typologiesY + 9);
      
      typologiesY += 17;
      doc.setFont("Helvetica", "bold");
      doc.text("B. Corporate Layering & Stratification:", 15, typologiesY);
      doc.setFont("Helvetica", "normal");
      doc.text("Deep nested multi-hop asset relays crossing sequential shell corporate fronts lacking commercial", 15, typologiesY + 5);
      doc.text("substance, designed to obscure the Ultimate Beneficial Ownership (UBO) mapping path.", 15, typologiesY + 9);
      
      typologiesY += 17;
      doc.setFont("Helvetica", "bold");
      doc.text("C. Circular Loop Topologies:", 15, typologiesY);
      doc.setFont("Helvetica", "normal");
      doc.text("High-frequency circular clearing vectors routing capital through intermediary accounts back to the", 15, typologiesY + 5);
      doc.text("source, maximizing operational noise and simulating trade-based transactions.", 15, typologiesY + 9);
      
      // Section 2: Statutory & Legal Framework Directives
      let legalY = 110;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("2. REGULATORY & STATUTORY INDICTMENT PRECEDENTS", 15, legalY);
      doc.line(15, legalY + 2, 195, legalY + 2);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      
      legalY += 10;
      doc.setFont("Helvetica", "bold");
      doc.text("A. Prevention of Money Laundering Act (PMLA, Section 3 & 4):", 15, legalY);
      doc.setFont("Helvetica", "normal");
      doc.text("All asset locks listed on Page 1 are provisionally frozen under statutory suspicion of laundering.", 15, legalY + 5);
      doc.text("Section 3 defines laundering offenses, and Section 4 mandates rigorous imprisonment for 3 to 7 years.", 15, legalY + 9);
      
      legalY += 17;
      doc.setFont("Helvetica", "bold");
      doc.text("B. Financial Action Task Force (FATF Recommendation 15):", 15, legalY);
      doc.setFont("Helvetica", "normal");
      doc.text("Enforces global Travel Rule thresholds, mandating immediate information collection and transmission", 15, legalY + 5);
      doc.text("for transactions exceeding $1,000 / €1,000, requiring active VASP threat monitoring models.", 15, legalY + 9);
      
      // Section 3: Remediations & Next Steps
      let remediationY = 175;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("3. TACTICAL INVESTIGATIVE RECOMMENDATIONS", 15, remediationY);
      doc.line(15, remediationY + 2, 195, remediationY + 2);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      
      remediationY += 10;
      doc.text("1. Deploy rate-limiting temporal filters to restrict outward clearing if high-velocity smurfing is detected.", 15, remediationY);
      doc.text("2. Initiate formal mutual legal assistance treaties (MLAT) with offshore Caymans & Seychelles registries.", 15, remediationY + 6);
      doc.text("3. Submit immediate Suspicious Transaction Reports (STR) to the national Financial Intelligence Unit.", 15, remediationY + 12);
      
      // Endorsement on Page 2 Bottom
      let endY = 220;
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(15, endY, 180, 45, "F");
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, endY, 180, 45, "S");
      
      doc.setTextColor(51, 65, 85);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("AUTHORIZED FORENSIC ENDORSEMENT & COMPLIANCE SIGN-OFF", 20, endY + 8);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text("The financial network routes evaluated herein exhibit high-confidence signs of organized shell stratification,", 20, endY + 16);
      doc.text("smurfing micro-deposits, or circular loop routing. Assets listed as FROZEN are restricted under forensic order.", 20, endY + 21);
      doc.text("This analytical dossier is certified for legal submission to prosecuting judicial authorities.", 20, endY + 26);
      
      doc.line(130, endY + 36, 185, endY + 36);
      doc.setFontSize(7);
      doc.text("HYPERION-CF FORENSIC DIVISION SECURE", 130, endY + 41);

      // Save PDF Dossier
      doc.save(`${caseId}_forensics_dossier.pdf`);
      toast({
        title: "Dossier Export Complete",
        description: `Law enforcement forensics dossier generated: ${caseId}.pdf`,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Export Failure",
        description: "An unexpected error occurred building the vector PDF.",
        variant: "destructive",
      });
    }
  }, [weightedResult, frozenAccounts, profile, user, privacyMode, toast]);



  // Live simulation tick sequence definition
  const LIVE_SIMULATION_STEPS = useMemo(() => [
    {
      type: "normal" as const,
      text: "⚡ SYSTEM INITIALIZED: CyberShield Live Forensic Matrix Active. Loading clean node grid...",
      action: (): AnalysisResult => ({
        graph: {
          nodes: [
            { id: "ACC_NORMAL_01", suspicious: false, score: 5 },
            { id: "ACC_NORMAL_02", suspicious: false, score: 10 },
            { id: "ACC_NORMAL_03", suspicious: false, score: 8 },
            { id: "ACC_NORMAL_04", suspicious: false, score: 12 },
            { id: "ACC_NORMAL_05", suspicious: false, score: 15 },
          ],
          edges: [
            { transaction_id: "TX_INIT_01", source: "ACC_NORMAL_01", target: "ACC_NORMAL_02", amount: 250, timestamp: new Date().toISOString() },
            { transaction_id: "TX_INIT_02", source: "ACC_NORMAL_02", target: "ACC_NORMAL_03", amount: 300, timestamp: new Date().toISOString() },
            { transaction_id: "TX_INIT_03", source: "ACC_NORMAL_04", target: "ACC_NORMAL_05", amount: 150, timestamp: new Date().toISOString() },
          ]
        },
        suspicious_accounts: [],
        fraud_rings: [],
        summary: {
          total_accounts: 5,
          suspicious_accounts_count: 0,
          fraud_rings_detected: 0,
        }
      })
    },
    {
      type: "normal" as const,
      text: "📥 TELEMETRY INFLUX: Incoming high-value transfer ACC_MULE_1 → ACC_MULE_2 ($12,500). Layering threshold triggers.",
      action: (prev: AnalysisResult): AnalysisResult => ({
        ...prev,
        graph: {
          nodes: [
            ...prev.graph.nodes,
            { id: "ACC_MULE_1", suspicious: false, score: 15 },
            { id: "ACC_MULE_2", suspicious: false, score: 20 },
          ],
          edges: [
            ...prev.graph.edges,
            { transaction_id: "TX_LIVE_01", source: "ACC_MULE_1", target: "ACC_MULE_2", amount: 12500, timestamp: new Date().toISOString() }
          ]
        },
        summary: { ...prev.summary, total_accounts: prev.summary.total_accounts + 2 }
      })
    },
    {
      type: "normal" as const,
      text: "⚡ ROUTING TERMINAL: Immediate transit ACC_MULE_2 → ACC_MULE_3 ($12,450). Tracing layered shell transit velocity.",
      action: (prev: AnalysisResult): AnalysisResult => ({
        ...prev,
        graph: {
          nodes: [
            ...prev.graph.nodes,
            { id: "ACC_MULE_3", suspicious: false, score: 30 },
          ],
          edges: [
            ...prev.graph.edges,
            { transaction_id: "TX_LIVE_02", source: "ACC_MULE_2", target: "ACC_MULE_3", amount: 12450, timestamp: new Date().toISOString() }
          ]
        },
        summary: { ...prev.summary, total_accounts: prev.summary.total_accounts + 1 }
      })
    },
    {
      type: "alert" as const,
      text: "🚨 ALERT: Circular Loop closed ACC_MULE_3 → ACC_MULE_1 ($12,400). Money Laundering verified!",
      action: (prev: AnalysisResult): AnalysisResult => {
        const suspiciousMules = [
          { account_id: "ACC_MULE_1", score: 98, reasons: ["Circular Routing Ring Partner", "Rapid Layering Flow Ingress"] },
          { account_id: "ACC_MULE_2", score: 85, reasons: ["Circular Routing Ring Partner", "Intermediate Layering Transit"] },
          { account_id: "ACC_MULE_3", score: 82, reasons: ["Circular Routing Ring Partner", "Rapid Layering Flow Egress"] }
        ];

        const updatedNodes = prev.graph.nodes.map(n => {
          const suspect = suspiciousMules.find(sm => sm.account_id === n.id);
          return suspect ? { ...n, suspicious: true, score: suspect.score } : n;
        });

        return {
          ...prev,
          graph: {
            nodes: updatedNodes,
            edges: [
              ...prev.graph.edges,
              { transaction_id: "TX_LIVE_03", source: "ACC_MULE_3", target: "ACC_MULE_1", amount: 12400, timestamp: new Date().toISOString() }
            ]
          },
          suspicious_accounts: [
            ...prev.suspicious_accounts,
            ...suspiciousMules
          ],
          fraud_rings: [
            ...prev.fraud_rings,
            {
              ring_id: "RING_001_MULE_CYCLE",
              type: "circular_routing",
              accounts: ["ACC_MULE_1", "ACC_MULE_2", "ACC_MULE_3"],
            }
          ],
          summary: {
            ...prev.summary,
            suspicious_accounts_count: prev.summary.suspicious_accounts_count + 3,
            fraud_rings_detected: prev.summary.fraud_rings_detected + 1
          }
        };
      }
    },
    {
      type: "normal" as const,
      text: "📥 TELEMETRY INFLUX: Micro-deposit initiation ACC_SMURF_1 → ACC_RECEIVER ($1,500). Structuring suspected.",
      action: (prev: AnalysisResult): AnalysisResult => ({
        ...prev,
        graph: {
          nodes: [
            ...prev.graph.nodes,
            { id: "ACC_SMURF_1", suspicious: false, score: 10 },
            { id: "ACC_RECEIVER", suspicious: false, score: 25 },
          ],
          edges: [
            ...prev.graph.edges,
            { transaction_id: "TX_LIVE_04", source: "ACC_SMURF_1", target: "ACC_RECEIVER", amount: 1500, timestamp: new Date().toISOString() }
          ]
        },
        summary: { ...prev.summary, total_accounts: prev.summary.total_accounts + 2 }
      })
    },
    {
      type: "normal" as const,
      text: "📥 TELEMETRY INFLUX: Secondary deposit ACC_SMURF_2 → ACC_RECEIVER ($1,500). Layering intensity increases.",
      action: (prev: AnalysisResult): AnalysisResult => ({
        ...prev,
        graph: {
          nodes: [
            ...prev.graph.nodes,
            { id: "ACC_SMURF_2", suspicious: false, score: 10 },
          ],
          edges: [
            ...prev.graph.edges,
            { transaction_id: "TX_LIVE_05", source: "ACC_SMURF_2", target: "ACC_RECEIVER", amount: 1500, timestamp: new Date().toISOString() }
          ]
        },
        summary: { ...prev.summary, total_accounts: prev.summary.total_accounts + 1 }
      })
    },
    {
      type: "alert" as const,
      text: "🚨 ALERT: High Fan-in Smurfing Detected on ACC_RECEIVER. Aggressive structuring aggregation!",
      action: (prev: AnalysisResult): AnalysisResult => {
        const suspiciousReceiver = {
          account_id: "ACC_RECEIVER",
          score: 91,
          reasons: ["Aggressive Structuring Structurer", "High Fan-in Smurfing Target (4+ accounts)"]
        };

        const updatedNodes = prev.graph.nodes.map(n => {
          if (n.id === "ACC_RECEIVER") {
            return { ...n, suspicious: true, score: 91 };
          }
          return n;
        });

        return {
          ...prev,
          graph: {
            nodes: [
              ...updatedNodes,
              { id: "ACC_SMURF_3", suspicious: false, score: 10 }
            ],
            edges: [
              ...prev.graph.edges,
              { transaction_id: "TX_LIVE_06", source: "ACC_SMURF_3", target: "ACC_RECEIVER", amount: 1500, timestamp: new Date().toISOString() }
            ]
          },
          suspicious_accounts: [
            ...prev.suspicious_accounts,
            suspiciousReceiver
          ],
          fraud_rings: [
            ...prev.fraud_rings,
            {
              ring_id: "RING_002_SMURF_DEPOSITS",
              type: "smurfing",
              accounts: ["ACC_RECEIVER", "ACC_SMURF_1", "ACC_SMURF_2", "ACC_SMURF_3"],
            }
          ],
          summary: {
            ...prev.summary,
            total_accounts: prev.summary.total_accounts + 1,
            suspicious_accounts_count: prev.summary.suspicious_accounts_count + 1,
            fraud_rings_detected: prev.summary.fraud_rings_detected + 1
          }
        };
      }
    },
    {
      type: "suspect" as const,
      text: "📤 OFFSHORE LAYER: Outward transit ACC_RECEIVER → ACC_OFFSHORE_DUBAI ($4,400). Asset flight to offshore router.",
      action: (prev: AnalysisResult): AnalysisResult => ({
        ...prev,
        graph: {
          nodes: [
            ...prev.graph.nodes,
            { id: "ACC_OFFSHORE_DUBAI", suspicious: true, score: 75 },
          ],
          edges: [
            ...prev.graph.edges,
            { transaction_id: "TX_LIVE_07", source: "ACC_RECEIVER", target: "ACC_OFFSHORE_DUBAI", amount: 4400, timestamp: new Date().toISOString() }
          ]
        },
        suspicious_accounts: [
          ...prev.suspicious_accounts,
          {
            account_id: "ACC_OFFSHORE_DUBAI",
            score: 75,
            reasons: ["Direct Layering Destination", "Offshore Wire Recipient Terminal"]
          }
        ],
        summary: {
          ...prev.summary,
          total_accounts: prev.summary.total_accounts + 1,
          suspicious_accounts_count: prev.summary.suspicious_accounts_count + 1
        }
      })
    },
  ], []);

  // Dynamic live stream transaction injector
  const appendLiveTransaction = useCallback((tx: Transaction, logMsg: string, logType: "normal" | "suspect" | "alert") => {
    // Append console log entry
    setLiveLog(prev => [
      { id: String(Date.now() + Math.random()), text: logMsg, type: logType },
      ...prev.slice(0, 35)
    ]);

    // Play synthesized cyber warning alarm sound if suspect ingress triggers
    if (logType === "suspect" || logType === "alert") {
      playForensicWarningSound();
      
      // Trigger cinematic neon alert HUD card overlay!
      setCinematicAlert({
        active: true,
        text: logType === "alert" ? "🚨 CRITICAL AML THREAT INTERCEPT" : "⚠️ SUSPICIOUS TELEMETRY ANOMALY",
        details: logMsg
      });
      setTimeout(() => setCinematicAlert(null), 3200);

      toast({
        title: logType === "alert" ? "🚨 AML CRITICAL EXPOSURE" : "⚠️ NETWORK THREAT DETECTED",
        description: logMsg,
        variant: "destructive",
        duration: 4000
      });
    }

    // Ingress node/edge directly into active analysisResult
    setAnalysisResult(prev => {
      const cleanPrev = prev || {
        graph: { nodes: [], edges: [] },
        suspicious_accounts: [],
        fraud_rings: [],
        summary: { total_accounts: 0, suspicious_accounts_count: 0, fraud_rings_detected: 0 }
      };

      const nodesCopy = [...cleanPrev.graph.nodes];
      
      // Sender Node
      if (!nodesCopy.some(n => n.id === tx.sender_id)) {
        nodesCopy.push({
          id: tx.sender_id,
          suspicious: logType !== "normal",
          score: logType !== "normal" ? 88 : Number((5 + Math.random() * 15).toFixed(0))
        });
      } else if (logType !== "normal") {
        const idx = nodesCopy.findIndex(n => n.id === tx.sender_id);
        nodesCopy[idx] = { ...nodesCopy[idx], suspicious: true, score: 94 };
      }

      // Receiver Node
      if (!nodesCopy.some(n => n.id === tx.receiver_id)) {
        nodesCopy.push({
          id: tx.receiver_id,
          suspicious: logType === "alert",
          score: logType === "alert" ? 92 : Number((5 + Math.random() * 15).toFixed(0))
        });
      } else if (logType === "alert") {
        const idx = nodesCopy.findIndex(n => n.id === tx.receiver_id);
        nodesCopy[idx] = { ...nodesCopy[idx], suspicious: true, score: 92 };
      }

      const suspiciousCopy = [...cleanPrev.suspicious_accounts];
      if (logType !== "normal" && !suspiciousCopy.some(sa => sa.account_id === tx.sender_id)) {
        suspiciousCopy.push({
          account_id: tx.sender_id,
          score: 94,
          reasons: ["Live streaming anomaly linkage", "High-velocity structuring bypass"]
        });
      }

      const fraudRingsCopy = [...cleanPrev.fraud_rings];
      if (logType === "alert" && !fraudRingsCopy.some(fr => fr.ring_id === "RING_LIVE_TELEMETRY")) {
        fraudRingsCopy.push({
          ring_id: "RING_LIVE_TELEMETRY",
          type: "structuring",
          accounts: [tx.sender_id, tx.receiver_id]
        });
      }

      return {
        ...cleanPrev,
        graph: {
          nodes: nodesCopy,
          edges: [...cleanPrev.graph.edges, tx]
        },
        suspicious_accounts: suspiciousCopy,
        fraud_rings: fraudRingsCopy,
        summary: {
          total_accounts: nodesCopy.length,
          suspicious_accounts_count: suspiciousCopy.length,
          fraud_rings_detected: fraudRingsCopy.length
        }
      };
    });
  }, [playForensicWarningSound, toast]);

  // Control simulation timer loops
  const stopLiveSimulation = useCallback(() => {
    if (liveSimIntervalRef.current) {
      clearInterval(liveSimIntervalRef.current);
      liveSimIntervalRef.current = null;
    }
    setLiveMonitoringActive(false);
    toast({
      title: "🛑 Telemetry Halted",
      description: "Live forensic transaction feed has been paused.",
    });
  }, [toast]);

  const startLiveSimulation = useCallback(() => {
    if (liveSimIntervalRef.current) {
      clearInterval(liveSimIntervalRef.current);
    }
    setFrozenAccounts(new Set());
    setAnalysisResult(null);
    setLiveMonitoringActive(true);
    setLiveLog([]);
    setActiveTab("graph");
    setActiveScenarioName("Live Stream Corridor");

    toast({
      title: "⚡ Live Telemetry Activated",
      description: "Establishing link to global clearing corridors. Awaiting routing...",
    });

    liveSimIntervalRef.current = setInterval(() => {
      const event = generateNextStreamEvent();
      appendLiveTransaction(event.transaction, event.logMessage, event.type);
    }, 1500);
  }, [appendLiveTransaction, toast]);

  const handleInjectResult = useCallback((result: AnalysisResult, scenarioName: string) => {
    setIsLoading(true);
    setProcessingTime(undefined);
    setProcessingStep(0);
    setActiveScenarioName(scenarioName);
    
    // Simulate tactical forensic parsing phase
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setProcessingStep(step);
      if (step >= 5) {
        clearInterval(interval);
        setAnalysisResult(result);
        setIsLoading(false);
        setProcessingTime(Number((0.8 + Math.random() * 0.5).toFixed(2)));
        toast({
          title: "🔥 Scenario Injected Successfully",
          description: `AML Detection Engine parsed ${result.graph.edges.length} transactions for scenario: ${scenarioName}.`,
        });
      }
    }, 250);
  }, [toast]);


  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (liveSimIntervalRef.current) clearInterval(liveSimIntervalRef.current);
    };
  }, []);
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "graph", label: "GRAPH VIEW" },
    { id: "geo", label: "GEO-SPATIAL MAP" },
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

        {/* AI Fraud Dataset Generator simulation module */}
        <section className="mb-6">
          <DatasetGeneratorPanel
            onInjectResult={handleInjectResult}
            onAppendLiveTransaction={appendLiveTransaction}
            liveMonitoringActive={liveMonitoringActive}
            onStartLiveSimulation={startLiveSimulation}
            onStopLiveSimulation={stopLiveSimulation}
            activeScenarioName={activeScenarioName}
            currentTransactions={analysisResult?.graph.edges || []}
            onUploadCustomFile={handleUpload}
            isLoading={isLoading}
          />
        </section>

        {/* Watchlist panel — always visible */}
        <section className="mb-6">
          <WatchlistPanel
            privacyMode={privacyMode}
            onSelect={(id) => { setSelectedAccountId(id); setDrawerOpen(true); }}
          />
        </section>

        {/* Tactical OSINT and Cryptographic Intercept Grid */}
        <section className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <OSINTThreatFeed />
            <DecryptorWiretap />
          </div>
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
            <div className="flex items-center justify-between border-b border-border/50 mb-4">
              <div className="flex items-center gap-0">
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
              {/* Forensics Intelligence Vector PDF Dossier Export Button */}
              {weightedResult && (
                <button
                  onClick={generateCaseReportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-primary/50 text-primary hover:bg-primary hover:text-black font-mono text-xs font-bold transition-all mb-2 mr-2 shadow-md shadow-emerald-950/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  EXPORT DOSSIER PDF
                </button>
              )}
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
                      frozenAccounts={frozenAccounts}
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

            {/* Geo-spatial map tab */}
            {activeTab === "geo" && analysisResult && (
              <div className="bg-card/40 border border-border/50 rounded-lg overflow-hidden animate-fade-in" style={{ height: "560px" }}>
                <GeoTraceVisualization
                  nodes={analysisResult.graph.nodes}
                  edges={analysisResult.graph.edges}
                  privacyMode={privacyMode}
                />
              </div>
            )}

            {/* Table tab */}
            {activeTab === "table" && weightedResult && (
              <div className="bg-card/40 border border-border/50 rounded-lg p-4 backdrop-blur-sm" style={{ minHeight: "500px" }}>
                <FraudTable
                  suspiciousAccounts={weightedResult.suspicious_accounts}
                  fraudRings={weightedResult.fraud_rings}
                  privacyMode={privacyMode}
                  onFreezeAccount={handleFreezeAccount}
                  frozenAccounts={frozenAccounts}
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

            {/* Retro Forensic Command Line Override CLI */}
            {analysisResult && !isLoading && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Terminal className="w-4 h-4" style={{ color: "hsl(155 100% 50%)" }} />
                  <span className="text-xs font-mono tracking-widest text-muted-foreground">// TELEMETRY OVERRIDE TERMINAL</span>
                </div>
                <ForensicTerminalHUD 
                  onTriggerFreezeAll={() => {
                    const allSuspects = weightedResult?.suspicious_accounts.map(a => a.account_id) || [];
                    allSuspects.forEach(id => handleFreezeAccount(id));
                  }}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
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



      <AccountDetailDrawer
        accountId={selectedAccountId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        analysisResult={weightedResult}
        privacyMode={privacyMode}
      />

      {/* Cinematic Cybersecurity Red Alert Overlay */}
      {cinematicAlert?.active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in font-mono border-[4px] border-destructive animate-pulse-glow" style={{ animationDuration: "1.5s" }}>
          {/* Animated warning stripe headers */}
          <div className="absolute top-0 inset-x-0 h-4 bg-destructive opacity-80 animate-pulse flex justify-around text-[9px] font-black text-white tracking-widest select-none py-0.5">
            <span>⚠ INTEL SYSTEM ALERT ⚠</span>
            <span>⚠ INTEL SYSTEM ALERT ⚠</span>
            <span>⚠ INTEL SYSTEM ALERT ⚠</span>
            <span>⚠ INTEL SYSTEM ALERT ⚠</span>
          </div>

          <div className="relative max-w-xl w-full bg-slate-950 border border-destructive/60 p-6 rounded shadow-[0_0_50px_rgba(239,68,68,0.4)] overflow-hidden">
            {/* Corner brackets */}
            <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-destructive" />
            <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-destructive" />
            <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-destructive" />
            <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-destructive" />

            {/* Glowing Shield Alert icon */}
            <div className="flex items-center gap-4 mb-4 pb-3 border-b border-border/40">
              <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive flex items-center justify-center shrink-0 animate-bounce">
                <AlertTriangle className="w-6 h-6 text-destructive animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-widest text-destructive" style={{ fontFamily: "Orbitron, monospace" }}>
                  CRITICAL THREAT INCIDENT
                </h2>
                <p className="text-[10px] text-muted-foreground">THREAT LEVEL: CATEGORY-V (SEVERE EXTRUSION)</p>
              </div>
            </div>

            {/* Narration */}
            <div className="space-y-3 mb-6">
              <div className="bg-destructive/5 border border-destructive/20 p-3.5 rounded text-xs leading-relaxed text-destructive-foreground/90 font-mono">
                <span className="text-destructive font-bold block mb-1">AI DETECTOR ANALYSIS:</span>
                {cinematicAlert.text}
              </div>
              
              <div className="text-[10px] text-muted-foreground leading-relaxed">
                <span className="text-white block font-bold mb-0.5">MITIGATION COMPLIANCE TARGETS:</span>
                {cinematicAlert.details}
              </div>
            </div>

            {/* Tactical actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (weightedResult && weightedResult.suspicious_accounts.length > 0) {
                    weightedResult.suspicious_accounts.slice(0, 3).forEach(acc => {
                      if (!frozenAccounts.has(acc.account_id)) {
                        handleFreezeAccount(acc.account_id);
                      }
                    });
                  } else {
                    handleFreezeAccount("ACC_MULE_1");
                    handleFreezeAccount("ACC_MULE_2");
                    handleFreezeAccount("ACC_MULE_3");
                  }
                  setCinematicAlert(null);
                  toast({
                    title: "🔒 MULTI-WALLET LOCK COMPLETED",
                    description: "Autonomous lock deployed successfully. Funds frozen in transit.",
                  });
                }}
                className="flex-1 py-3 text-xs font-bold rounded border bg-destructive hover:bg-destructive/80 text-white tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-[1.03]"
                style={{ fontFamily: "Orbitron, monospace" }}
              >
                AUTONOMOUS INTERCEPT & FREEZE
              </button>
              <button
                onClick={() => setCinematicAlert(null)}
                className="py-3 px-6 text-xs font-bold rounded border border-border/40 bg-card/45 hover:bg-white/5 text-muted-foreground tracking-widest transition-colors font-mono"
              >
                DISMISS WARNING
              </button>
            </div>
          </div>

          {/* Animated warning stripe footers */}
          <div className="absolute bottom-0 inset-x-0 h-4 bg-destructive opacity-80 animate-pulse flex justify-around text-[9px] font-black text-white tracking-widest select-none py-0.5">
            <span>⚠ FOR FORENSIC REVIEW ONLY ⚠</span>
            <span>⚠ FOR FORENSIC REVIEW ONLY ⚠</span>
            <span>⚠ FOR FORENSIC REVIEW ONLY ⚠</span>
            <span>⚠ FOR FORENSIC REVIEW ONLY ⚠</span>
          </div>
        </div>
      )}

      {/* Sliding AI Forensic Copilot drawer */}
      <ForensicCopilotDrawer 
        analysisResult={weightedResult} 
        privacyMode={privacyMode} 
      />
    </div>
  );
};

export default Index;
