import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Mic, MicOff, Volume2, VolumeX, X, ChevronDown, Play, ToggleLeft, ToggleRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult } from "@/types/fraud";
import { maskSensitiveValue } from "@/lib/privacy";

import { LANGUAGES, getTranslation, findBestVoice } from "@/lib/voice-config";

export type VoiceScreenContext = "upload" | "graph" | "summary";

interface VoiceAssistantProps {
  analysisResult: AnalysisResult | null;
  currentScreen?: VoiceScreenContext;
  processingTime?: number;
}

type Status = "idle" | "listening" | "processing" | "speaking";

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  analysisResult,
  currentScreen = "upload",
  processingTime,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [language, setLanguage] = useState("en");
  const [transcript, setTranscript] = useState("");
  const [muted, setMuted] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [autoRead, setAutoRead] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (muted || !synthRef.current || !enabled) return;
    synthRef.current.cancel();
    
    const utt = new SpeechSynthesisUtterance(text);
    const bestVoice = findBestVoice(language);
    
    if (bestVoice) {
      utt.voice = bestVoice;
    }
    
    utt.lang = LANGUAGES.find(l => l.code === language)?.voice || "en-IN";
    utt.rate = 0.9;
    utt.pitch = 1.0;
    
    utt.onstart = () => setStatus("speaking");
    utt.onend = () => setStatus("idle");
    utt.onerror = (e) => {
      console.error("SpeechSynthesis Error:", e);
      setStatus("idle");
    };
    
    synthRef.current.speak(utt);
  }, [language, muted, enabled]);

  // Auto-read summary when results arrive (if enabled)
  useEffect(() => {
    if (autoRead && analysisResult && currentScreen === "summary") {
      const summary = analysisResult.summary;
      const msg = getTranslation(language, "analysisComplete", {
        suspicious: summary.suspicious_accounts_count,
        rings: summary.fraud_rings_detected,
        total: summary.total_accounts
      });
      addAssistantMessage(msg);
      speak(msg);
    }
  }, [analysisResult, autoRead, currentScreen, speak]);

  const addAssistantMessage = (text: string) => {
    setMessages(prev => [...prev, { role: "assistant", text }]);
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !enabled) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setStatus("processing");

    try {
      // Build rich context based on current screen
      let context: Record<string, unknown> = { screen: currentScreen };

      if (analysisResult) {
        const { summary, suspicious_accounts, fraud_rings, smurfing, shell_chains } = analysisResult;
        context = {
          ...context,
          total_transactions: summary.total_transactions,
          total_accounts: summary.total_accounts,
          suspicious_accounts_count: summary.suspicious_accounts_count,
          fraud_rings_count: summary.fraud_rings_detected,
          smurfing_fan_in: summary.smurfing_fan_in_detected,
          smurfing_fan_out: summary.smurfing_fan_out_detected,
          shell_chains_count: summary.shell_chains_detected,
          processing_time_ms: summary.processing_time_ms || processingTime,
          top_suspects: suspicious_accounts.slice(0, 5).map(a => ({
            id: maskSensitiveValue(a.account_id), score: a.score, reasons: a.reasons
          })),
          fraud_rings: fraud_rings.slice(0, 5).map(r => ({
            id: r.ring_id, type: r.type, members: r.accounts.length, accounts: r.accounts.slice(0, 4).map(maskSensitiveValue)
          })),
          smurfing_detail: {
            fanIn: smurfing.fanIn.slice(0, 3).map(fi => ({ receiver: maskSensitiveValue(fi.receiver), count: fi.count })),
            fanOut: smurfing.fanOut.slice(0, 3).map(fo => ({ sender: maskSensitiveValue(fo.sender), count: fo.count })),
          },
          shell_chains_sample: shell_chains.slice(0, 3).map(chain => chain.map(maskSensitiveValue)),
        };
      }

      const { data, error } = await supabase.functions.invoke("voice-assistant", {
        body: { message: text, language, context },
      });

      if (error) throw error;

      const replyText = data?.reply || getTranslation(language, "noProcess");
      addAssistantMessage(replyText);
      speak(replyText);
    } catch (err) {
      console.error("Voice Assistant Error:", err);
      const errMsg = getTranslation(language, "error");
      addAssistantMessage(errMsg);
      setStatus("idle");
    }
  }, [analysisResult, language, speak, enabled, currentScreen, processingTime]);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      sendMessage("How do I use this app?");
      return;
    }

    if (recognitionRef.current) recognitionRef.current.abort();

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    const lang = LANGUAGES.find(l => l.code === language);
    recognition.lang = lang?.voice || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setStatus("listening");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        setTranscript("");
        sendMessage(t);
      }
    };
    recognition.onerror = () => setStatus("idle");
    recognition.onend = () => { if (status === "listening") setStatus("idle"); };
    recognition.start();
  }, [language, sendMessage, status]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.abort();
    synthRef.current?.cancel();
    setStatus("idle");
    setTranscript("");
  }, []);

  // Demo Walkthrough — sends a sequence of messages with delays
  const runDemoWalkthrough = useCallback(async () => {
    if (demoRunning || !enabled) return;
    setDemoRunning(true);
    setIsOpen(true);

    const steps = [
      "Introduce this Money Muling Detection Engine app.",
      "Explain how fraud detection algorithms work here.",
      analysisResult ? "Highlight the top suspicious accounts found." : "How do I upload a CSV file for analysis?",
      `Demonstrate your multilingual support by saying hello in ${LANGUAGES.find(l => l.code === language)?.label || "English"}.`,
    ];

    for (const step of steps) {
      await new Promise(res => setTimeout(res, 1200));
      await sendMessage(step);
      // Wait for speaking to finish (rough estimate)
      await new Promise(res => setTimeout(res, 4000));
    }

    setDemoRunning(false);
  }, [demoRunning, enabled, analysisResult, language, sendMessage]);

  const statusColors: Record<Status, string> = {
    idle: "hsl(155 100% 50%)",
    listening: "hsl(185 100% 55%)",
    processing: "hsl(45 100% 55%)",
    speaking: "hsl(280 80% 65%)",
  };

  const statusLabels: Record<Status, string> = {
    idle: getTranslation(language, "ready"),
    listening: getTranslation(language, "listening"),
    processing: getTranslation(language, "processing"),
    speaking: getTranslation(language, "speaking"),
  };

  const currentLang = LANGUAGES.find(l => l.code === language);

  // Quick context commands based on current screen
  const quickCmds = currentScreen === "upload"
    ? [getTranslation(language, "quickCsvFormat"), getTranslation(language, "quickHowToUpload"), getTranslation(language, "quickColumns")]
    : currentScreen === "graph"
    ? [getTranslation(language, "quickExplainNodes"), getTranslation(language, "quickWhatAreRings"), getTranslation(language, "quickShowSmurfing")]
    : [getTranslation(language, "quickSummarize"), getTranslation(language, "quickFanIn"), getTranslation(language, "quickHowManyRings")];

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110"
        style={{
          background: enabled
            ? "linear-gradient(135deg, hsl(155 100% 40%), hsl(185 100% 45%))"
            : "hsl(220 20% 20%)",
          boxShadow: enabled ? "0 0 20px hsl(155 100% 50% / 0.4)" : "none",
        }}
        title="Open AI Voice Assistant"
      >
        <Mic className="w-6 h-6" style={{ color: enabled ? "#000" : "hsl(0 0% 50%)" }} />
        {status !== "idle" && enabled && (
          <div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse border-2 border-background"
            style={{ background: statusColors[status] }}
          />
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[340px] rounded-xl border border-border/60 shadow-2xl overflow-hidden"
          style={{ background: "hsl(220 20% 7%)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40" style={{ background: "hsl(220 20% 9%)" }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColors[status] }} />
              <span className="text-xs font-mono font-bold" style={{ color: "hsl(155 100% 50%)" }}>
                AI VOICE ASSISTANT
              </span>
              <span className="text-[9px] font-mono text-muted-foreground border border-border/40 px-1 rounded">
                {currentScreen.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Language selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(m => !m)}
                  className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded border border-border/40"
                >
                  {currentLang?.label}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 top-7 z-50 w-40 rounded-md border border-border/60 shadow-xl overflow-auto max-h-52" style={{ background: "hsl(220 20% 10%)" }}>
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                        className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors hover:bg-primary/10 ${language === lang.code ? "text-primary" : "text-muted-foreground"}`}
                        style={language === lang.code ? { color: "hsl(155 100% 50%)" } : {}}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mute toggle */}
              <button onClick={() => setMuted(m => !m)} className="text-muted-foreground hover:text-foreground transition-colors" title={muted ? "Unmute" : "Mute"}>
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Enable/disable toggle */}
              <button onClick={() => setEnabled(e => !e)} className="text-muted-foreground hover:text-foreground transition-colors" title={enabled ? "Disable assistant" : "Enable assistant"}>
                {enabled ? <ToggleRight className="w-4 h-4" style={{ color: "hsl(155 100% 50%)" }} /> : <ToggleLeft className="w-4 h-4" />}
              </button>

              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status bar */}
          <div
            className="px-4 py-1.5 text-xs font-mono text-center transition-colors"
            style={{ background: `${statusColors[status]}15`, color: statusColors[status] }}
          >
            {transcript || statusLabels[status]}
          </div>

          {/* Messages */}
          <div className="h-52 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="text-center text-xs font-mono text-muted-foreground/50 mt-6">
                <p>{getTranslation(language, "pressMic")}</p>
                <p className="mt-1">"Why is this account suspicious?"</p>
                <p>"How many fraud rings?"</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[88%] px-3 py-2 rounded-lg text-xs font-mono leading-relaxed"
                  style={
                    msg.role === "user"
                      ? { background: "hsl(155 100% 50% / 0.12)", color: "hsl(155 100% 70%)", border: "1px solid hsl(155 100% 50% / 0.3)" }
                      : { background: "hsl(220 20% 14%)", color: "hsl(0 0% 82%)", border: "1px solid hsl(220 20% 20%)" }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 px-3 pt-2 pb-2 border-t border-border/40">
            <button
              onClick={status === "listening" ? stopListening : startListening}
              disabled={!enabled || status === "processing" || status === "speaking"}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-mono font-bold transition-all duration-200 disabled:opacity-40"
              style={
                status === "listening"
                  ? { background: "hsl(0 84% 60% / 0.2)", border: "1px solid hsl(0 84% 60%)", color: "hsl(0 84% 60%)" }
                  : { background: "hsl(155 100% 50% / 0.12)", border: "1px solid hsl(155 100% 50%)", color: "hsl(155 100% 50%)" }
              }
            >
              {status === "listening"
                ? <><MicOff className="w-4 h-4" /> {getTranslation(language, "stop")}</>
                : <><Mic className="w-4 h-4" /> {getTranslation(language, "speak")}</>}
            </button>

            {/* Auto-read toggle */}
            <button
              onClick={() => setAutoRead(r => !r)}
              className="px-2.5 py-2.5 rounded-md text-xs font-mono transition-all border"
              style={autoRead
                ? { background: "hsl(155 100% 50% / 0.12)", border: "1px solid hsl(155 100% 50% / 0.5)", color: "hsl(155 100% 50%)" }
                : { border: "1px solid hsl(0 0% 25%)", color: "hsl(0 0% 45%)" }
              }
              title="Auto-read summaries"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Quick commands */}
          <div className="px-3 pb-2 flex flex-wrap gap-1">
            {quickCmds.map(cmd => (
              <button
                key={cmd}
                onClick={() => sendMessage(cmd)}
                disabled={!enabled || status === "listening" || status === "processing"}
                className="text-[10px] font-mono px-2 py-1 rounded border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Demo walkthrough */}
          <div className="px-3 pb-3">
            <button
              onClick={runDemoWalkthrough}
              disabled={demoRunning || !enabled}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-xs font-mono font-bold transition-all disabled:opacity-40 border"
              style={{ background: "hsl(45 100% 55% / 0.1)", border: "1px solid hsl(45 100% 55% / 0.4)", color: "hsl(45 100% 55%)" }}
            >
              <Play className="w-3.5 h-3.5" />
              {demoRunning ? getTranslation(language, "demoRunning") : getTranslation(language, "demo")}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
