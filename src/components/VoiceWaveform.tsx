import React from "react";
import { useLanguage } from "../hooks/useLanguage";

export interface VoiceWaveformProps {
  status: "idle" | "listening" | "processing" | "speaking";
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({ status }) => {
  const { config } = useLanguage();

  const isIdle = status === "idle";
  const isListening = status === "listening";
  const isProcessing = status === "processing";
  const isSpeaking = status === "speaking";

  // Color selection based on cyberpunk status
  const color = 
    isListening ? "hsl(185 100% 50%)" : 
    isProcessing ? "hsl(45 100% 50%)" : 
    isSpeaking ? "hsl(280 80% 60%)" : 
    "hsl(155 100% 40%)";

  const glowShadow = `0 0 12px ${color}`;

  // Generate 12 bar heights dynamically
  const bars = Array.from({ length: 12 });

  return (
    <div className="flex flex-col items-center gap-1.5 p-2 rounded border border-border/10 bg-black/40">
      <div className="flex justify-center items-center gap-1 w-full h-[32px]">
        {bars.map((_, i) => {
          // Compute variable heights and animation speed based on status
          let animClass = "";
          let height = "4px";

          if (isListening) {
            animClass = "animate-bounce";
            height = `${Math.floor(8 + Math.random() * 20)}px`;
          } else if (isProcessing) {
            animClass = "animate-pulse";
            height = `${Math.floor(12 + Math.sin(i) * 12)}px`;
          } else if (isSpeaking) {
            animClass = "animate-pulse";
            height = `${Math.floor(6 + Math.random() * 22)}px`;
          }

          // Delay for each bar to create wave motion
          const delay = `${i * 0.08}s`;

          return (
            <div
              key={i}
              className={`w-1 rounded transition-all duration-300 ${animClass}`}
              style={{
                height,
                backgroundColor: color,
                boxShadow: glowShadow,
                animationDelay: delay,
              }}
            />
          );
        })}
      </div>
      <div className="text-[9px] font-mono tracking-widest text-center mt-1 uppercase" style={{ color }}>
        {isListening ? config.receivingStream : 
         isProcessing ? config.analyzingPattern : 
         isSpeaking ? config.synthesizingAudio : 
         config.voiceStandby}
      </div>
    </div>
  );
};
export default VoiceWaveform;
