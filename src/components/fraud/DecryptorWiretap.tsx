import React, { useEffect, useRef, useState } from "react";
import { Play, Square, RefreshCw, AudioLines } from "lucide-react";

export const DecryptorWiretap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [decodedPayload, setDecodedPayload] = useState<string | null>(null);
  
  const animFrameIdRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const CYBER_PAYLOADS = [
    "📡 SIGNAL DECRYPTED: Outward Cayman transaction route mapped to router IP: 185.220.101.4",
    "🏢 SHELL STRATIFICATION: Intermediary target revealed as 'Alpha Escrow Ltd' (Seychelles)",
    "💰 SMURFING VELOCITY: Aggregator wallet identified ➜ ACC_SMURF_INTEGRATION_09",
    "💀 DARKNET PARSING: Mixing service contract hash traced ➜ 0x5a31b...e9c18",
    "🔓 MULE INTERCEPT: Wire transfer bypass instruction decrypted ➜ OVERRIDE_BYPASS_AML_2"
  ];

  // Animate soundwaves on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 320;
    canvas.height = 70;

    let offset = 0;
    const draw = () => {
      ctx.fillStyle = "rgba(2, 6, 23, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.lineWidth = 1.5;
      
      const speed = decrypting ? 0.35 : 0.05;
      const amplitude = decrypting ? 25 : 4;
      ctx.strokeStyle = decrypting ? "hsl(185 100% 50%)" : "rgba(100, 116, 139, 0.4)";

      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + Math.sin(x * 0.04 + offset) * amplitude * Math.cos(x * 0.008 + offset * 0.5);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      offset += speed;
      animFrameIdRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [decrypting]);

  // Audio frequency synthesizer
  const playCyberDecryptionTones = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      // Pulse 1
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc1.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 1.2);
      
      gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
      
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 1.5);

      // Cyber telemetry beeps
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = "square";
      osc2.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.3);
      osc2.frequency.setValueAtTime(1800, audioCtx.currentTime + 0.6);
      osc2.frequency.setValueAtTime(1500, audioCtx.currentTime + 0.9);
      
      gain2.gain.setValueAtTime(0.03, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 1.5);

    } catch (err) {
      console.warn("Audio Context disabled by browser policies", err);
    }
  };

  const handleStartDecryption = () => {
    if (decrypting) return;
    setDecrypting(true);
    setProgress(0);
    setDecodedPayload(null);
    playCyberDecryptionTones();

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDecrypting(false);
          const randomIndex = Math.floor(Math.random() * CYBER_PAYLOADS.length);
          setDecodedPayload(CYBER_PAYLOADS[randomIndex]);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  return (
    <div className="bg-slate-950/70 border border-border/40 rounded-lg p-4 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between" style={{ minHeight: "240px" }}>
      <div>
        <div className="flex items-center justify-between border-b border-border/30 pb-2 mb-3 select-none">
          <div className="flex items-center gap-2">
            <AudioLines className="w-3.5 h-3.5 text-primary" style={{ color: "hsl(185 100% 50%)" }} />
            <span className="text-xs font-mono font-bold tracking-wider text-foreground">🕵️‍♂️ COVERT WIRE INTERCEPT & DECRYPTOR</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground">
            SIG STATUS: <span className={decrypting ? "text-cyan-400 animate-pulse font-bold" : "text-muted-foreground"}>{decrypting ? "DECODING" : "IDLE"}</span>
          </div>
        </div>

        {/* Oscillating wave container */}
        <div className="bg-slate-950 border border-border/20 rounded-md overflow-hidden relative mb-3">
          <canvas ref={canvasRef} className="w-full block" style={{ height: "70px" }} />
          {decrypting && (
            <div className="absolute top-2 right-2 text-[9px] font-mono text-cyan-400 bg-slate-950/80 px-1 py-0.5 rounded border border-cyan-500/30 select-none">
              DECRYPTING... {progress}%
            </div>
          )}
        </div>

        {/* Decrypted Payload Display */}
        {decodedPayload && (
          <div className="mb-3 p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 animate-pulse select-text">
            {decodedPayload}
          </div>
        )}

        {/* Decoder triggers */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartDecryption}
            disabled={decrypting}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-bold rounded border transition-all duration-200"
            style={{
              background: decrypting ? "transparent" : "linear-gradient(135deg, hsl(185 100% 50%), hsl(155 100% 50%))",
              color: decrypting ? "hsl(185 100% 50%)" : "hsl(220 20% 4%)",
              borderColor: "hsl(185 100% 50% / 0.5)",
            }}
          >
            {decrypting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                EXTRACTING PAYLOADS...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                DECRYPT CONGESTION STREAM
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
