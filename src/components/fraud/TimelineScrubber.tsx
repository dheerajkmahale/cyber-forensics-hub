import React, { useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Clock, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { GraphEdge } from "@/types/fraud";

interface TimelineScrubberProps {
  edges: GraphEdge[];
  currentTime: number; // ms epoch
  onTimeChange: (t: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
}

const formatTs = (ms: number) => {
  if (!Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
};

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  edges,
  currentTime,
  onTimeChange,
  isPlaying,
  onPlayToggle,
}) => {
  const { minTs, maxTs, buckets, visibleCount } = useMemo(() => {
    const times = edges
      .map(e => (e.timestamp ? new Date(e.timestamp).getTime() : NaN))
      .filter(t => Number.isFinite(t)) as number[];

    if (times.length === 0) {
      return { minTs: 0, maxTs: 0, buckets: [] as number[], visibleCount: 0 };
    }
    const min = Math.min(...times);
    const max = Math.max(...times);
    const BUCKETS = 60;
    const range = Math.max(1, max - min);
    const buckets = new Array(BUCKETS).fill(0);
    for (const t of times) {
      const idx = Math.min(BUCKETS - 1, Math.floor(((t - min) / range) * BUCKETS));
      buckets[idx]++;
    }
    const visible = times.filter(t => t <= currentTime).length;
    return { minTs: min, maxTs: max, buckets, visibleCount: visible };
  }, [edges, currentTime]);

  if (minTs === maxTs && minTs === 0) return null;

  const maxBucket = Math.max(1, ...buckets);
  const pct = maxTs > minTs ? ((currentTime - minTs) / (maxTs - minTs)) * 100 : 100;

  return (
    <div className="bg-card/60 border border-border/50 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: "hsl(155 100% 50%)" }} />
          <span className="text-xs font-mono tracking-widest text-muted-foreground">
            // TIMELINE SCRUBBER
          </span>
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">
          {visibleCount} / {edges.length} TX VISIBLE
        </div>
      </div>

      {/* Histogram */}
      <div className="relative h-12 mb-1 flex items-end gap-[2px]">
        {buckets.map((count, i) => {
          const h = (count / maxBucket) * 100;
          const bucketPct = ((i + 0.5) / buckets.length) * 100;
          const active = bucketPct <= pct;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-colors"
              style={{
                height: `${Math.max(4, h)}%`,
                background: active
                  ? "hsl(155 100% 50% / 0.85)"
                  : "hsl(155 100% 50% / 0.18)",
                boxShadow: active ? "0 0 6px hsl(155 100% 50% / 0.6)" : undefined,
              }}
            />
          );
        })}
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-px pointer-events-none"
          style={{
            left: `${pct}%`,
            background: "hsl(185 100% 60%)",
            boxShadow: "0 0 8px hsl(185 100% 60%)",
          }}
        />
      </div>

      {/* Slider */}
      <Slider
        min={minTs}
        max={maxTs}
        step={Math.max(1, Math.floor((maxTs - minTs) / 1000))}
        value={[currentTime]}
        onValueChange={(v) => onTimeChange(v[0])}
        className="my-2"
      />

      {/* Controls + labels */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] font-mono text-muted-foreground">
          {formatTs(minTs)}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onTimeChange(minTs)}
            className="p-1 rounded border border-border/40 hover:border-primary/60 transition-colors"
            title="Jump to start"
          >
            <SkipBack className="w-3 h-3" />
          </button>
          <button
            onClick={onPlayToggle}
            className="p-1.5 rounded border border-primary/50 hover:bg-primary/10 transition-colors"
            style={{ color: "hsl(155 100% 50%)" }}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onTimeChange(maxTs)}
            className="p-1 rounded border border-border/40 hover:border-primary/60 transition-colors"
            title="Jump to end"
          >
            <SkipForward className="w-3 h-3" />
          </button>
          <div className="ml-2 px-2 py-1 rounded border border-primary/30 bg-primary/5">
            <span
              className="text-[10px] font-mono"
              style={{ color: "hsl(185 100% 60%)" }}
            >
              {formatTs(currentTime)}
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono text-muted-foreground">
          {formatTs(maxTs)}
        </span>
      </div>
    </div>
  );
};
