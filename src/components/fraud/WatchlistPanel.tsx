import React from "react";
import { Pin, PinOff, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWatchlist } from "@/hooks/useWatchlist";
import { maskSensitiveValue } from "@/lib/privacy";

interface Props {
  privacyMode: boolean;
  onSelect: (accountId: string) => void;
}

export const WatchlistPanel: React.FC<Props> = ({ privacyMode, onSelect }) => {
  const { entries, loading, unpin } = useWatchlist();

  return (
    <div className="bg-card/40 border border-border/50 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <Pin className="w-4 h-4" style={{ color: "hsl(45 100% 55%)" }} />
        <span className="text-xs font-mono tracking-widest text-muted-foreground">// WATCHLIST</span>
        <Badge variant="outline" className="ml-auto font-mono text-[10px]" style={{ color: "hsl(45 100% 55%)", borderColor: "hsl(45 100% 55% / 0.5)" }}>
          {entries.length} PINNED
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-xs font-mono text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading watchlist…
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <Pin className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-xs font-mono text-muted-foreground">No pinned accounts yet.</p>
          <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">
            Click an account in the graph or table, then pin it from the drawer.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
          {entries.map((entry) => (
            <div
              key={entry.account_id}
              className="flex items-center gap-2 rounded-md border border-border/40 bg-card/30 px-3 py-2 hover:bg-card/60 transition-colors group"
            >
              <Pin className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(45 100% 55%)" }} />
              <span className="text-xs font-mono text-foreground/90 truncate flex-1">
                {privacyMode ? maskSensitiveValue(entry.account_id) : entry.account_id}
              </span>
              {entry.note && (
                <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[120px]" title={entry.note}>
                  {entry.note}
                </span>
              )}
              <span className="text-[10px] font-mono text-muted-foreground/50 hidden sm:inline flex-shrink-0">
                {new Date(entry.created_at).toLocaleDateString()}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onSelect(entry.account_id)}
                title="View details"
              >
                <Eye className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={() => void unpin(entry.account_id)}
                title="Unpin"
              >
                <PinOff className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
