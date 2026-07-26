import React, { useEffect, useState } from "react";
import { ShieldCheck, Plus, Trash2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TrustedRow {
  id: string;
  account_ref: string;
  reason: string;
  created_at: string;
}

const AdminWhitelistTab: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<TrustedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountRef, setAccountRef] = useState("");
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("trusted_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    const ref = accountRef.trim();
    if (!ref) return;
    setAdding(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("trusted_accounts")
      .insert({ account_ref: ref, reason: reason.trim(), created_by: user?.id ?? null });
    setAdding(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Account already trusted" : `Failed: ${error.message}`);
      return;
    }
    setAccountRef("");
    setReason("");
    toast.success(`${ref} added to whitelist`);
    load();
  };

  const handleRemove = async (id: string, ref: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("trusted_accounts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`${ref} removed from whitelist`);
    load();
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <Card className="border-amber-500/20 bg-card/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <h2 className="font-mono text-sm font-semibold text-amber-400 tracking-wider">ADD TRUSTED ACCOUNT</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_auto] gap-2">
          <Input
            placeholder="Account ID (e.g. ACC_1023)"
            value={accountRef}
            onChange={(e) => setAccountRef(e.target.value)}
            className="font-mono"
          />
          <Input
            placeholder="Reason (optional, e.g. payroll vendor)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="font-mono"
          />
          <Button onClick={handleAdd} disabled={adding || !accountRef.trim()} className="bg-amber-500 hover:bg-amber-600 text-black font-mono font-bold">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </Button>
        </div>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">
          Trusted accounts are skipped by the detection engine to reduce false positives.
        </p>
      </Card>

      <Card className="border-amber-500/20 bg-card/50">
        <div className="px-5 py-3 border-b border-amber-500/20 flex items-center justify-between">
          <h2 className="font-mono text-sm font-semibold text-amber-400 tracking-wider">WHITELIST · {rows.length}</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-amber-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center font-mono text-xs text-muted-foreground">
            No trusted accounts yet. Add one above to suppress false positives.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-[11px]">ACCOUNT ID</TableHead>
                <TableHead className="font-mono text-[11px]">REASON</TableHead>
                <TableHead className="font-mono text-[11px]">ADDED</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs text-amber-400">{r.account_ref}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.reason || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemove(r.id, r.account_ref)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AdminWhitelistTab;
