import React, { useState } from "react";
import { 
  Database, Play, Square, Download, Activity, ShieldAlert,
  Server, Cpu, Layers, AlertCircle, RefreshCcw, HelpCircle, HardDrive, Upload
} from "lucide-react";
import { generateScenarioData, ScenarioType } from "@/utils/fraudDataGenerator";
import { exportTransactionsToCSV } from "@/utils/csvGenerator";
import { AnalysisResult, Transaction } from "@/types/fraud";
import { Button } from "@/components/ui/button";
import { CsvUploader } from "./CsvUploader";

interface DatasetGeneratorPanelProps {
  onInjectResult: (result: AnalysisResult, scenarioName: string) => void;
  onAppendLiveTransaction: (tx: Transaction, logMsg: string, logType: "normal" | "suspect" | "alert") => void;
  liveMonitoringActive: boolean;
  onStartLiveSimulation: () => void;
  onStopLiveSimulation: () => void;
  activeScenarioName: string;
  currentTransactions: Transaction[];
  onUploadCustomFile: (transactions: Transaction[], metadata: { fileName: string; fileHash: string }) => void;
  isLoading: boolean;
}

export const DatasetGeneratorPanel: React.FC<DatasetGeneratorPanelProps> = ({
  onInjectResult,
  onAppendLiveTransaction,
  liveMonitoringActive,
  onStartLiveSimulation,
  onStopLiveSimulation,
  activeScenarioName,
  currentTransactions,
  onUploadCustomFile,
  isLoading
}) => {
  const [panelMode, setPanelMode] = useState<"generator" | "uploader">("generator");
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("fraud_ring");
  const [logs, setLogs] = useState<{ id: string; text: string; type: "info" | "success" | "warn" | "error" }[]>([
    { id: "init", text: "💽 System Core Ready. Dataset generator idle.", type: "info" }
  ]);

  const addLog = (text: string, type: "info" | "success" | "warn" | "error" = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [
      { id: String(Date.now() + Math.random()), text: `[${timestamp}] ${text}`, type },
      ...prev.slice(0, 40)
    ]);
  };

  const handleGenerateStatic = (type: ScenarioType) => {
    try {
      addLog(`Initializing synthetic scenario compilation: [${type.toUpperCase()}]...`, "info");
      const { transactions, result, scenarioName } = generateScenarioData(type);
      
      onInjectResult(result, scenarioName);
      
      addLog(`Dataset compiled successfully. Generated ${transactions.length} forensic ledger routes.`, "success");
      addLog(`Active scenario updated ➜ ${scenarioName}`, "success");
      
      if (result.suspicious_accounts.length > 0) {
        addLog(`AML trigger alert: Flagged ${result.suspicious_accounts.length} potential money mules.`, "warn");
      }
    } catch (err) {
      addLog(`Scenario compilation failed: ${err instanceof Error ? err.message : String(err)}`, "error");
    }
  };

  const handleDownloadCSV = () => {
    if (!currentTransactions || currentTransactions.length === 0) {
      addLog("Cannot download: Empty transaction ledger. Please compile a scenario first.", "error");
      return;
    }
    try {
      const filename = `${activeScenarioName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_dataset.csv`;
      addLog(`Encoding ${currentTransactions.length} transaction entries to UTF-8 CSV...`, "info");
      exportTransactionsToCSV(currentTransactions, filename);
      addLog(`CSV payload downloaded successfully: ${filename}`, "success");
    } catch (err) {
      addLog(`CSV download failed: ${err instanceof Error ? err.message : String(err)}`, "error");
    }
  };

  const scenarioMeta: Record<ScenarioType, { title: string; desc: string; threat: string }> = {
    normal: { title: "Normal Activity Baseline", desc: "Clean retail baseline deposits & transfers.", threat: "NONE" },
    fraud_ring: { title: "Circular Laundering Loop", desc: "Cyclic routes traversing nested suspect nodes.", threat: "HIGH (MULE LOOP)" },
    smurfing: { title: "Fan-In Smurfing Ingress", desc: "Structuring cash deposits just below AML reporting limits.", threat: "CRITICAL (SMURFING)" },
    shell_chain: { title: "Shell Stratification Chain", desc: "Deep sequential transfers obscuring asset origin.", threat: "CRITICAL (SHELL CHAINS)" },
    layered: { title: "Cross-Border Layering Corridor", desc: "Outward wealth exports to Cayman tax havens.", threat: "HIGH (OFFSHORE CORRIDORS)" },
    velocity: { title: "High-Velocity Laundering", desc: "Burst structural transfers executed within seconds.", threat: "CRITICAL (VELOCITY ATTACK)" },
    insider: { title: "Anomalous Employee Threat", desc: "Treasury management clearance sweeper.", threat: "CRITICAL (INSIDER FRAUD)" },
    dark_web: { title: "Darknet Crypto Wash Out", desc: "OFAC-flagged escrow mixer integration.", threat: "CRITICAL (DARKNET EXPLOIT)" },
  };

  return (
    <div className="w-full bg-card/40 border border-border/50 rounded-lg p-5 backdrop-blur-sm relative overflow-hidden select-none">
      {/* Outer Tactical Scanlines */}
      <div className="fixed inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,24,38,0.2)_1px,transparent_1px)] bg-[size:100%_4px]" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/20 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <Database className="w-5 h-5 text-primary animate-pulse" style={{ color: "hsl(185, 100%, 55%)" }} />
          <div>
            <h3 className="text-sm font-display font-bold tracking-widest text-foreground">AI FRAUD DATASET GENERATOR</h3>
            <p className="text-[9px] font-mono text-muted-foreground mt-0.5">// AUTONOMOUS AML SIMULATION MATRIX</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {liveMonitoringActive ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/40 text-rose-400 font-mono text-[10px] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              LIVE TELEMETRY STREAMING
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950/40 border border-border/20 text-muted-foreground font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              SIMULATOR STANDBY
            </span>
          )}
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-2 mb-4 select-none">
        <button
          onClick={() => {
            setPanelMode("generator");
            addLog("Switched module workspace: AI Synthetic Generator active", "info");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[10px] font-mono font-bold tracking-widest transition-all ${
            panelMode === "generator"
              ? "border-primary/50 text-primary bg-primary/5 shadow-sm"
              : "border-border/30 text-muted-foreground hover:text-white"
          }`}
          style={panelMode === "generator" ? { color: "hsl(185, 100%, 50%)", borderColor: "hsl(185, 100%, 50% / 0.5)" } : {}}
        >
          <Cpu className="w-3.5 h-3.5" />
          AI SYNTHETIC GENERATOR
        </button>
        <button
          onClick={() => {
            setPanelMode("uploader");
            addLog("Switched module workspace: Custom Ledger Ingestion active", "info");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[10px] font-mono font-bold tracking-widest transition-all ${
            panelMode === "uploader"
              ? "border-primary/50 text-primary bg-primary/5 shadow-sm"
              : "border-border/30 text-muted-foreground hover:text-white"
          }`}
          style={panelMode === "uploader" ? { color: "hsl(185, 100%, 50%)", borderColor: "hsl(185, 100%, 50% / 0.5)" } : {}}
        >
          <Upload className="w-3.5 h-3.5" />
          INGEST CUSTOM LEDGER
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Scenario selectors & presets */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          {panelMode === "generator" ? (
            <>
              <div>
                <label className="text-[10px] font-mono text-muted-foreground tracking-widest">// THREAT SCENARIO SELECTOR</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(Object.keys(scenarioMeta) as ScenarioType[]).map((type) => {
                    const active = selectedScenario === type;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedScenario(type);
                          addLog(`Preset selected: [${type.toUpperCase()}] - ${scenarioMeta[type].title}`, "info");
                        }}
                        className={`flex flex-col items-start text-left p-2.5 rounded border transition-all text-xs font-mono select-none ${
                          active 
                            ? "border-primary bg-primary/10 text-primary" 
                            : "border-border/40 bg-card/20 text-foreground hover:bg-card/45 hover:border-border/60"
                        }`}
                        style={{
                          borderColor: active ? "hsl(185, 100%, 50%)" : "",
                          color: active ? "hsl(185, 100%, 50%)" : ""
                        }}
                      >
                        <div className="font-bold uppercase tracking-wider truncate w-full">{type.replace("_", " ")}</div>
                        <div className="text-[9px] text-muted-foreground mt-1 truncate w-full">{scenarioMeta[type].title}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Scenario Detailed Spec */}
                <div className="mt-3.5 bg-slate-950/50 border border-border/20 rounded p-3 font-mono text-[10px]">
                  <div className="flex justify-between border-b border-border/20 pb-1.5 mb-1.5 text-muted-foreground">
                    <span>SCENARIO DESCRIPTION:</span>
                    <span className="text-primary" style={{ color: "hsl(185, 100%, 55%)" }}>{scenarioMeta[selectedScenario].threat}</span>
                  </div>
                  <p className="text-foreground/90 leading-relaxed">
                    {scenarioMeta[selectedScenario].desc}
                  </p>
                </div>
              </div>

              {/* Trigger Actions */}
              <div className="mt-5 space-y-2">
                <Button
                  onClick={() => handleGenerateStatic(selectedScenario)}
                  disabled={liveMonitoringActive}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-mono font-bold rounded border border-primary/50 text-primary bg-primary/5 hover:bg-primary hover:text-black transition-all animate-glow-pulse"
                  style={{
                    borderColor: "hsl(185, 100%, 50% / 0.5)",
                    color: "hsl(185, 100%, 50%)"
                  }}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  COMPILE &amp; INJECT DATASET
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  {liveMonitoringActive ? (
                    <button
                      onClick={onStopLiveSimulation}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-bold rounded border border-rose-500/50 text-rose-400 bg-rose-950/20 hover:bg-rose-500 hover:text-black transition-all"
                    >
                      <Square className="w-3.5 h-3.5 shrink-0" />
                      HALT TELEMETRY
                    </button>
                  ) : (
                    <button
                      onClick={onStartLiveSimulation}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-bold rounded border border-emerald-500/50 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-500 hover:text-black transition-all"
                    >
                      <Play className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                      LIVE TELEMETRY
                    </button>
                  )}

                  <button
                    onClick={handleDownloadCSV}
                    className="flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-bold rounded border border-border/60 text-foreground bg-card/30 hover:bg-foreground hover:text-black transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    DOWNLOAD CSV
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col justify-between">
              <div>
                <label className="text-[10px] font-mono text-muted-foreground tracking-widest block mb-2">// INGEST TRANSACTION LEDGER</label>
                <CsvUploader 
                  onUpload={(txs, meta) => {
                    addLog(`Ingested custom CSV ledger: [${meta.fileName}]`, "success");
                    addLog(`Successfully parsed ${txs.length} financial transactions. Initiating AML analysis...`, "info");
                    onUploadCustomFile(txs, meta);
                  }} 
                  isLoading={isLoading} 
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Scrolling Live Action logs terminal */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[300px]">
          <div className="flex items-center justify-between bg-slate-950 border border-border/30 px-3.5 py-1.5 rounded-t font-mono text-[10px] text-muted-foreground select-none">
            <div className="flex items-center gap-1.5">
              <Server className="w-3 h-3 text-primary" style={{ color: "hsl(185, 100%, 55%)" }} />
              <span>SIMULATION CONSOLE CORE LOGS</span>
            </div>
            <span>HYPERION CORE v3.1</span>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-slate-950/90 border-x border-b border-border/30 rounded-b p-3 font-mono text-[10px] space-y-2 max-h-[300px] lg:max-h-none select-text">
            {logs.map((log) => {
              let tagColor = "text-muted-foreground";
              if (log.type === "success") tagColor = "text-emerald-400";
              if (log.type === "warn") tagColor = "text-amber-400";
              if (log.type === "error") tagColor = "text-rose-400";
              
              return (
                <div key={log.id} className="flex gap-2 border-b border-border/10 pb-1 items-start leading-relaxed">
                  <span className={`font-bold shrink-0 select-none ${tagColor}`}>[SYS]</span>
                  <span className="text-foreground/90">{log.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
