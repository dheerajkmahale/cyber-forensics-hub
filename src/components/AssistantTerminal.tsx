import React, { useEffect, useRef } from "react";
import { useLanguage } from "../hooks/useLanguage";

export interface MessageLog {
  role: "user" | "assistant";
  text: string;
}

export interface AssistantTerminalProps {
  logs: MessageLog[];
  status: "idle" | "listening" | "processing" | "speaking";
}

export const AssistantTerminal: React.FC<AssistantTerminalProps> = ({ logs, status }) => {
  const { config } = useLanguage();
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, status]);

  return (
    <div className="flex flex-col gap-1 border border-border/10 bg-black/60 p-3 rounded font-mono text-[11px] h-[180px] overflow-y-auto select-text scrollbar-thin">
      <div className="flex items-center justify-between border-b border-border/10 pb-1.5 mb-1.5 text-[9px] tracking-wider text-muted-foreground">
        <span>● {config.terminalHeader} // {config.code.split("-")[0].toUpperCase()}</span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
          <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
        </div>
      </div>

      {logs.length === 0 && (
        <div className="text-muted-foreground flex flex-col justify-center items-center h-full gap-1 opacity-70">
          <div className="text-[10px] uppercase font-bold tracking-widest text-primary animate-pulse">{config.readyLabel}</div>
          <div className="text-[9px]">{config.placeholder}</div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {logs.map((log, idx) => {
          const isUser = log.role === "user";
          return (
            <div key={idx} className="flex flex-col gap-0.5 leading-relaxed">
              <span className="text-[9px] font-bold uppercase tracking-widest select-none" style={{ color: isUser ? "hsl(185 100% 50%)" : "hsl(155 100% 40%)" }}>
                {isUser ? "INVESTIGATOR" : "CYBERSHIELD AI"} &gt;&gt;
              </span>
              <span className={isUser ? "text-foreground/90 font-medium" : "text-primary/95"}>
                {log.text}
              </span>
            </div>
          );
        })}

        {status === "processing" && (
          <div className="flex items-center gap-1.5 text-yellow-500 italic animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
            <span>{config.aiThinking}</span>
          </div>
        )}
      </div>
      <div ref={terminalEndRef} />
    </div>
  );
};
export default AssistantTerminal;
