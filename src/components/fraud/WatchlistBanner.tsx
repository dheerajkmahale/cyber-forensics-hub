import React from "react";
import { Eye, X } from "lucide-react";
import { maskSensitiveValue } from "@/lib/privacy";

interface Props {
  hits: string[];
  onDismiss: () => void;
  onSelect: (accountId: string) => void;
  privacyMode: boolean;
}

export const WatchlistBanner: React.FC<Props> = ({ hits, onDismiss, onSelect, privacyMode }) => {
  if (hits.length === 0) return null;
  return (
    <div
      className="mb-4 rounded-md border px-4 py-3 backdrop-blur-sm flex items-start gap-3"
      style={{
        borderColor: "hsl(45 100% 55% / 0.5)",
        background: "hsl(45 100% 55% / 0.08)",
      }}
    >
      <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(45 100% 55%)" }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono font-bold tracking-wider mb-1" style={{ color: "hsl(45 100% 55%)" }}>
          WATCHLIST MATCH · {hits.length} PINNED ACCOUNT{hits.length === 1 ? "" : "S"} APPEARED
        </div>
        <div className="flex flex-wrap gap-1.5">
          {hits.map(id => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="px-2 py-0.5 rounded text-[11px] font-mono border transition-colors hover:bg-card"
              style={{ borderColor: "hsl(45 100% 55% / 0.4)", color: "hsl(45 100% 55%)" }}
              title={id}
            >
              {privacyMode ? maskSensitiveValue(id) : id}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground p-1 -m-1"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
