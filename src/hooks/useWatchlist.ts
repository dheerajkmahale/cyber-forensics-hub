import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface WatchlistEntry {
  account_id: string;
  note: string;
  created_at: string;
}

export function useWatchlist() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("watchlist")
      .select("account_id,note,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Watchlist load failed", { description: error.message });
      return;
    }
    setEntries(data || []);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const isPinned = useCallback(
    (accountId: string) => entries.some(e => e.account_id === accountId),
    [entries],
  );

  const pin = useCallback(async (accountId: string, note = "") => {
    if (!user) return;
    const { error } = await supabase
      .from("watchlist")
      .insert({ user_id: user.id, account_id: accountId, note });
    if (error) {
      toast.error("Pin failed", { description: error.message });
      return;
    }
    toast.success("Pinned to watchlist", { description: accountId });
    await refresh();
  }, [user, refresh]);

  const unpin = useCallback(async (accountId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("user_id", user.id)
      .eq("account_id", accountId);
    if (error) {
      toast.error("Unpin failed", { description: error.message });
      return;
    }
    toast.success("Removed from watchlist", { description: accountId });
    await refresh();
  }, [user, refresh]);

  const toggle = useCallback(async (accountId: string) => {
    if (isPinned(accountId)) await unpin(accountId);
    else await pin(accountId);
  }, [isPinned, pin, unpin]);

  return { entries, loading, isPinned, pin, unpin, toggle, refresh };
}
