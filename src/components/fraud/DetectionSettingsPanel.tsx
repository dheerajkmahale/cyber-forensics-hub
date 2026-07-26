import React from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sliders, RotateCcw } from "lucide-react";
import { DetectionWeights, DEFAULT_WEIGHTS } from "@/lib/scoring";

interface Props {
  weights: DetectionWeights;
  onChange: (w: DetectionWeights) => void;
}

const ROWS: { key: keyof DetectionWeights; label: string; desc: string; color: string }[] = [
  {
    key: "cycle",
    label: "CYCLE WEIGHT",
    desc: "Loops 3–5 hops · default contribution +40",
    color: "hsl(0 84% 60%)",
  },
  {
    key: "velocity",
    label: "VELOCITY WEIGHT",
    desc: "Smurfing, fan-in/out & high tx-rate · default +10 to +30",
    color: "hsl(45 100% 55%)",
  },
  {
    key: "shell",
    label: "SHELL COMPLEXITY WEIGHT",
    desc: "3+ hop shell chains & low-tx intermediaries · default +10",
    color: "hsl(185 100% 55%)",
  },
];

export const DetectionSettingsPanel: React.FC<Props> = ({ weights, onChange }) => {
  const set = (k: keyof DetectionWeights, v: number) => onChange({ ...weights, [k]: v });
  const isDefault =
    weights.cycle === DEFAULT_WEIGHTS.cycle &&
    weights.velocity === DEFAULT_WEIGHTS.velocity &&
    weights.shell === DEFAULT_WEIGHTS.shell;

  return (
    <div className="bg-card/40 border border-border/50 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4" style={{ color: "hsl(155 100% 50%)" }} />
          <span className="text-xs font-mono tracking-widest text-muted-foreground">
            // DETECTION SETTINGS · SUSPICION SCORE WEIGHTS
          </span>
        </div>
        <Button
          variant="ghost" size="sm"
          disabled={isDefault}
          onClick={() => onChange(DEFAULT_WEIGHTS)}
          className="font-mono text-[10px] h-7"
        >
          <RotateCcw className="w-3 h-3 mr-1" />RESET
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROWS.map(({ key, label, desc, color }) => (
          <div key={key} className="bg-background/40 border border-border/40 rounded-md p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono tracking-wider" style={{ color }}>{label}</span>
              <span className="text-xs font-mono font-bold" style={{ color }}>
                {weights[key].toFixed(2)}×
              </span>
            </div>
            <Slider
              min={0}
              max={3}
              step={0.05}
              value={[weights[key]]}
              onValueChange={([v]) => set(key, v)}
              aria-label={label}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] font-mono text-muted-foreground/70">0×</span>
              <span className="text-[9px] font-mono text-muted-foreground/70">1× default</span>
              <span className="text-[9px] font-mono text-muted-foreground/70">3×</span>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-2 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] font-mono text-muted-foreground/70 mt-3 leading-relaxed">
        Adjustments re-score every flagged account in real-time. Updated scores flow into the fraud table, summary, and downloadable JSON. False-positive penalties (payroll, regular daily senders) are applied after weighting.
      </p>
    </div>
  );
};
