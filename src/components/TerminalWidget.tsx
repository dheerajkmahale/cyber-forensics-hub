import { useEffect, useState } from "react";

const TerminalLine = ({ text, delay = 0, prefix = ">" }: { text: string; delay?: number; prefix?: string }) => {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 35);
    return () => clearInterval(timer);
  }, [started, text]);

  if (!started && displayed === "") return (
    <div className="h-5" />
  );

  return (
    <div className="flex gap-2 text-sm">
      <span className="text-neon font-bold">{prefix}</span>
      <span className="text-muted-foreground">{displayed}</span>
      {displayed.length < text.length && <span className="text-neon animate-pulse">▋</span>}
    </div>
  );
};

export const TerminalWidget = () => {
  const lines = [
    { text: "Money Muling Detection Engine v2.4.1 initialized", prefix: "[SYS]" },
    { text: "Graph construction module: ACTIVE", prefix: "[NET]" },
    { text: "Fraud detection algorithms: LOADED", prefix: "[AML]" },
    { text: "Multilingual AI voice assistant: ONLINE", prefix: "[AI ]" },
    { text: "System ready. Upload CSV to begin analysis.", prefix: "[OK ]" },
  ];

  return (
    <div className="glow-border rounded bg-card p-4 font-mono text-xs space-y-1.5 scan-line">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(45 100% 55%)" }} />
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(155 100% 50%)" }} />
        <span className="text-muted-foreground ml-2">forensics-terminal — bash</span>
      </div>
      {lines.map((line, i) => (
        <TerminalLine key={i} text={line.text} delay={i * 700} prefix={line.prefix} />
      ))}
    </div>
  );
};

export default TerminalLine;
