import React, { useState, useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, X, Play, ToggleLeft, ToggleRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AnalysisResult } from "@/types/fraud";
import { maskSensitiveValue } from "@/lib/privacy";

// Configs and Hooks
import { SupportedLanguage } from "../config/languageConfig";
import { getLocalResponse } from "../config/responseConfig";
import { useLanguage } from "../hooks/useLanguage";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";

// Sub-components
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SuggestionCards } from "./SuggestionCards";
import { VoiceWaveform } from "./VoiceWaveform";
import { AssistantTerminal, MessageLog } from "./AssistantTerminal";

export interface VoiceAssistantProps {
  analysisResult: AnalysisResult | null;
  currentScreen?: "upload" | "graph" | "summary";
  processingTime?: number;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  analysisResult,
  currentScreen = "upload",
  processingTime,
}) => {
  const { language, config } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [muted, setMuted] = useState(false);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [demoRunning, setDemoRunning] = useState(false);

  const { speak, stopSpeaking, isSpeaking } = useSpeechSynthesis();

  // Clean logs on language switch
  useEffect(() => {
    setLogs([]);
    stopSpeaking();
  }, [language, stopSpeaking]);

  const addLog = useCallback((role: "user" | "assistant", text: string) => {
    setLogs(prev => [...prev, { role, text }]);
  }, []);

  const handleSpeechResult = useCallback(async (phrase: string) => {
    if (!phrase.trim() || !enabled) return;

    stopSpeaking(); // Immediately stop active speech synthesis

    console.log("Language:", language);
    console.log("Processing input phrase:", phrase);
    addLog("user", phrase);
    setStatus("processing");

    // 1. Check for local pre-defined voice commands (in all 5 languages)
    const query = phrase.toLowerCase().trim();
    const cmds = config.commands;
    let commandTriggered = false;

    if (query.includes(cmds.upload.toLowerCase())) {
      window.dispatchEvent(new CustomEvent("forensic:trigger-upload"));
      const reply = language === "hi" ? "फ़ाइल अपलोड डायलॉग खोला जा रहा है।" : 
                    language === "kn" ? "ಫೈಲ್ ಅಪ್ಲೋಡ್ ಡೈಲಾಗ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ." : 
                    language === "te" ? "ఫైల్ అప్‌లోడ్ డైలాగ్ తెరవబడుతోంది." : 
                    language === "ta" ? "கோப்பு பதிவேற்ற உரையாடல் திறக்கப்படுகிறது." : 
                    "Opening file upload dialog.";
      addLog("assistant", reply);
      if (!muted) speak(reply);
      commandTriggered = true;
    } else if (query.includes(cmds.showAccounts.toLowerCase())) {
      window.dispatchEvent(new CustomEvent("forensic:tab-change", { detail: "table" }));
      const reply = language === "hi" ? "संदिग्ध खाता तालिका दिखाई जा रही है।" : 
                    language === "kn" ? "ಸಂದೇಹಾಸ್ಪದ ಖಾತೆಗಳ ಪಟ್ಟಿಯನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ." : 
                    language === "te" ? "అనుమానాస్పద ఖాతాల పట్టిక చూపించబడుతోంది." : 
                    language === "ta" ? "சந்தேகத்திற்குரிய கணக்குகள் அட்டவணை காட்டப்படுகிறது." : 
                    "Showing suspicious accounts list.";
      addLog("assistant", reply);
      if (!muted) speak(reply);
      commandTriggered = true;
    } else if (query.includes(cmds.explainRing.toLowerCase())) {
      window.dispatchEvent(new CustomEvent("forensic:tab-change", { detail: "graph" }));
      const localExplain = getLocalResponse(language, "cycles");
      const reply = localExplain || (language === "hi" ? "धोखाधड़ी के छल्ले की व्याख्या की जा रही है।" : "Explaining fraud rings.");
      addLog("assistant", reply);
      if (!muted) speak(reply);
      commandTriggered = true;
    } else if (query.includes(cmds.generateReport.toLowerCase())) {
      window.dispatchEvent(new CustomEvent("forensic:trigger-pdf"));
      const reply = language === "hi" ? "आधिकारिक रिपोर्ट पीडीएफ तैयार की जा रही है।" : 
                    language === "kn" ? "ಅಧಿಕೃತ ಪಿಡಿಎಫ್ ವರದಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ." : 
                    language === "te" ? "అధికారిక నివేదిక పిడిఎఫ్ తయారు చేయబడుతోంది." : 
                    language === "ta" ? "அதிகாரப்பூர்வ அறிக்கை PDF தயாரிக்கப்படுகிறது." : 
                    "Generating official intelligence dossier PDF.";
      addLog("assistant", reply);
      if (!muted) speak(reply);
      commandTriggered = true;
    } else if (query.includes(cmds.freezeAssets.toLowerCase())) {
      window.dispatchEvent(new CustomEvent("forensic:trigger-freeze"));
      const reply = language === "hi" ? "संदिग्ध संपत्तियों को लॉक किया जा रहा है।" : 
                    language === "kn" ? "ಸಂದೇಹಾಸ್ಪದ ಆಸ್ತಿಗಳನ್ನು ಲಾಕ್ ಮಾಡಲಾಗುತ್ತಿದೆ." : 
                    language === "te" ? "అనుమానాస్పద ఆస్తులు లాక్ చేయబడుతున్నాయి." : 
                    language === "ta" ? "சந்தேகத்திற்குரிய சொத்துக்கள் பூட்டப்படுகின்றன." : 
                    "Locking suspicious wallet assets globally.";
      addLog("assistant", reply);
      if (!muted) speak(reply);
      commandTriggered = true;
    }

    if (commandTriggered) {
      setStatus("idle");
      return;
    }

    // 2. Check for educational fallback query
    const localEdu = getLocalResponse(language, phrase);
    if (localEdu) {
      addLog("assistant", localEdu);
      if (!muted) speak(localEdu);
      setStatus("idle");
      return;
    }

    // 3. Fallback to Supabase Edge Function with full context
    try {
      let analysisContext: Record<string, unknown> = { screen: currentScreen };

      if (analysisResult) {
        const { summary, suspicious_accounts, fraud_rings, smurfing, shell_chains } = analysisResult;
        analysisContext = {
          ...analysisContext,
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
        body: { message: phrase, language, context: analysisContext },
      });

      if (error) throw error;

      const reply = data?.reply || config.errorMsg;
      addLog("assistant", reply);
      if (!muted) speak(reply);
    } catch (err) {
      console.warn("Supabase edge function offline or unauthorized, launching smart local backup handler:", err);
      
      let localReply = "";
      if (language === "hi") {
        localReply = "डैशबोर्ड का स्थानीय इंटेलिजेंस सक्रिय है। ";
        if (analysisResult) {
          localReply += `हमने ${analysisResult.summary.total_transactions} लेनदेनों का विश्लेषण किया है और ${analysisResult.summary.suspicious_accounts_count} संदिग्ध खाते पाए हैं। वर्तमान स्क्रीन ${currentScreen} है।`;
        } else {
          localReply += "कृपया विश्लेषण शुरू करने के लिए पहले एक वित्तीय CSV फ़ाइल अपलोड करें।";
        }
      } else if (language === "kn") {
        localReply = "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನ ಆಫ್‌ಲೈನ್ ವಿಶ್ಲೇಷಕ ಸಕ್ರಿಯವಾಗಿದೆ. ";
        if (analysisResult) {
          localReply += `ನಾವು ${analysisResult.summary.total_transactions} ವ್ಯವಹಾರಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿದ್ದೇವೆ ಮತ್ತು ${analysisResult.summary.suspicious_accounts_count} ಸಂದೇಹಾಸ್ಪದ ಖಾತೆಗಳನ್ನು ಪತ್ತೆಹಚ್ಚಿದ್ದೇವೆ.`;
        } else {
          localReply += "ದಯವಿಟ್ಟು ಮೊದಲು ಸಿಎಸ್ವಿ (CSV) ಫೈಲ್ ಅನ್ನು ಅಪ್ಲೋಡ್ ಮಾಡಿ.";
        }
      } else if (language === "te") {
        localReply = "ఆఫ్‌లైన్ విశ్లేషణ వ్యవస్థ యాక్టివ్‌గా ఉంది. ";
        if (analysisResult) {
          localReply += `మేము ${analysisResult.summary.total_transactions} లావాదేవీలను విశ్లేషించాము మరియు ${analysisResult.summary.suspicious_accounts_count} అనుమానాస్పద ఖాతాలను కనుగొన్నాము.`;
        } else {
          localReply += "దయచేసి ముందుగా లావాదేవీల CSV ఫైల్‌ను అప్‌లోడ్ చేయండి.";
        }
      } else if (language === "ta") {
        localReply = "ஆஃப்லைன் பகுப்பாய்வி செயலில் உள்ளது. ";
        if (analysisResult) {
          localReply += `நாங்கள் ${analysisResult.summary.total_transactions} பரிவர்த்தனைகளை பகுப்பாய்வு செய்து ${analysisResult.summary.suspicious_accounts_count} சந்தேகத்திற்குரிய கணக்குகளைக் கண்டறிந்துள்ளோம்.`;
        } else {
          localReply += "தயவுசெய்து ஒரு பரிவர்த்தனை CSV கோப்பை பதிவேற்றவும்.";
        }
      } else {
        localReply = "CyberShield offline intelligence system active. ";
        if (analysisResult) {
          localReply += `Analyzed ${analysisResult.summary.total_transactions} transactions and flagged ${analysisResult.summary.suspicious_accounts_count} suspicious accounts. The highest threat score is on account ID ${analysisResult.suspicious_accounts[0]?.account_id || "ACC_MULE_1"}.`;
        } else {
          localReply += "Please upload a transactions CSV file to begin automated forensic tracking.";
        }
      }

      addLog("assistant", localReply);
      if (!muted) speak(localReply);
    } finally {
      setStatus("idle");
    }
  }, [language, enabled, config, muted, speak, currentScreen, analysisResult, processingTime, addLog]);

  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: (err) => {
      addLog("assistant", err);
      setStatus("idle");
    }
  });

  // Keep internal status state aligned with hooks
  useEffect(() => {
    if (isListening) {
      setStatus("listening");
    } else if (isSpeaking) {
      setStatus("speaking");
    } else if (status !== "processing") {
      setStatus("idle");
    }
  }, [isListening, isSpeaking, status]);

  // Demo sequence
  const runDemoWalkthrough = useCallback(async () => {
    if (demoRunning || !enabled) return;
    setDemoRunning(true);
    setIsOpen(true);

    const steps = [
      language === "hi" ? "इस फ्रॉड रिंग को समझाएं" :
      language === "kn" ? "ಈ ವಂಚನೆ ಜಾಲವನ್ನು ವಿವರಿಸಿ" :
      language === "te" ? "ఈ మోసపు వలయాన్ని వివరించండి" :
      language === "ta" ? "இந்த மோசடி வலையை விளக்கு" :
      "Explain this fraud ring",

      language === "hi" ? "संदिग्ध खाते दिखाएं" :
      language === "kn" ? "ಸಂದೇಹಾಸ್ಪದ ಖಾತೆಗಳನ್ನು ತೋರಿಸಿ" :
      language === "te" ? "అనుమానాస్పద ఖాతాలను చూపించండి" :
      language === "ta" ? "சந்தேகமான கணக்குகளை காட்டு" :
      "Show suspicious accounts",
    ];

    for (const step of steps) {
      await new Promise(res => setTimeout(res, 1200));
      await handleSpeechResult(step);
      await new Promise(res => setTimeout(res, 4500));
    }

    setDemoRunning(false);
  }, [demoRunning, enabled, language, handleSpeechResult]);

  const triggerMic = useCallback(() => {
    if (status === "listening") {
      console.log("Mic stopped");
      stopListening();
    } else {
      console.log("Mic started");
      stopSpeaking();
      startListening();
    }
  }, [status, startListening, stopListening, stopSpeaking]);

  return (
    <>
      {/* Floating MIC toggle button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 group"
        style={{
          background: enabled
            ? "linear-gradient(135deg, hsl(155 100% 40%), hsl(185 100% 45%))"
            : "hsl(220 20% 20%)",
          boxShadow: enabled ? "0 0 20px hsl(155 100% 50% / 0.4)" : "none",
        }}
        title="Open Indian AI Voice Assistant"
      >
        {isListening ? (
          <MicOff className="w-6 h-6 animate-pulse text-background" />
        ) : (
          <Mic className="w-6 h-6 text-background group-hover:scale-110 transition-transform" />
        )}

        {status !== "idle" && enabled && (
          <div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-ping border-2 border-background"
            style={{
              backgroundColor:
                status === "listening" ? "hsl(185 100% 55%)" :
                status === "processing" ? "hsl(45 100% 55%)" : "hsl(280 80% 65%)"
            }}
          />
        )}
      </button>

      {/* Floating Panel Box */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[360px] rounded-xl border border-border/60 shadow-2xl overflow-hidden flex flex-col p-4 gap-3 bg-[hsl(220_20%_6%)] transition-all duration-300"
          style={{
            boxShadow: "0 10px 40px rgba(0,0,0,0.8), 0 0 30px hsl(155 100% 50% / 0.05)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-primary uppercase">
                {config.assistantTitle}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground select-none">
              <button
                onClick={() => setMuted(m => !m)}
                className="hover:text-foreground transition-colors"
                title={muted ? config.unmuteLabel : config.muteLabel}
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setEnabled(e => !e)}
                className="hover:text-foreground transition-colors"
                title={enabled ? config.disableLabel : config.enableLabel}
              >
                {enabled ? (
                  <ToggleRight className="w-5 h-5 text-primary" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Switcher */}
          <LanguageSwitcher />

          {/* Dialog Terminal */}
          <AssistantTerminal logs={logs} status={status} />

          {/* Audio Waveform */}
          <VoiceWaveform status={status} />

          {/* Transcript overlay when active */}
          {transcript && (
            <div className="bg-primary/5 border border-primary/20 rounded p-2 text-xs font-mono text-primary text-center italic animate-pulse">
              "{transcript}"
            </div>
          )}

          {/* Dynamic Suggested cards responsive to active script */}
          <SuggestionCards
            onSelect={(phrase) => {
              stopSpeaking();
              stopListening();
              handleSpeechResult(phrase);
            }}
            disabled={!enabled || status === "processing"}
          />

          {/* Speech Control Buttons */}
          <div className="flex gap-2 border-t border-border/10 pt-2.5">
            <button
              onClick={triggerMic}
              disabled={!enabled || status === "processing" || status === "speaking"}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-xs font-mono font-bold transition-all duration-200 disabled:opacity-40"
              style={{
                background: status === "listening" ? "hsl(0 84% 60% / 0.15)" : "hsl(155 100% 50% / 0.1)",
                border: `1px solid ${status === "listening" ? "hsl(0 84% 60%)" : "hsl(155 100% 50%)"}`,
                color: status === "listening" ? "hsl(0 84% 60%)" : "hsl(155 100% 50%)",
                boxShadow: status === "listening" ? "none" : "0 0 10px hsl(155 100% 50% / 0.15)",
              }}
            >
              {status === "listening" ? (
                <>
                  <MicOff className="w-4 h-4" /> {config.stopLabel}
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" /> {config.speakLabel}
                </>
              )}
            </button>

            {/* Play Demo walkthrough */}
            <button
              onClick={() => {
                stopSpeaking();
                stopListening();
                runDemoWalkthrough();
              }}
              disabled={demoRunning || !enabled}
              className="px-4 py-2.5 rounded text-xs font-mono font-bold border border-yellow-500/40 text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/10 transition-all disabled:opacity-30 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{demoRunning ? config.demoRunningLabel : config.demoLabel}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
export default VoiceAssistant;
