import React, { useEffect, useState } from "react";
import { FileText, AlertOctagon, Timer, ExternalLink, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface UploadRow {
  id: string;
  user_id: string;
  file_name: string | null;
  created_at: string;
  transaction_count: number;
  suspicious_count: number;
  processing_time_ms: number | null;
  display_name?: string | null;
}

const AdminOverviewTab: React.FC = () => {
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: uploads } = await (supabase as any)
        .from("analysis_uploads")
        .select("id,user_id,file_name,created_at,transaction_count,suspicious_count,processing_time_ms")
        .order("created_at", { ascending: false })
        .limit(200);

      const list: UploadRow[] = uploads ?? [];
      const uids = Array.from(new Set(list.map((r) => r.user_id)));
      if (uids.length) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", uids);
        const map = new Map<string, string>((profiles ?? []).map((p: any) => [p.user_id, p.display_name]));
        list.forEach((r) => (r.display_name = map.get(r.user_id) ?? null));
      }
      setRows(list);
      setLoading(false);
    })();
  }, []);

  const totalFiles = rows.length;
  const totalSuspicious = rows.reduce((sum, r) => sum + (r.suspicious_count || 0), 0);
  const avgMs = rows.length
    ? Math.round(rows.reduce((s, r) => s + (r.processing_time_ms || 0), 0) / rows.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard icon={<FileText className="w-5 h-5" />} label="Total Files Processed" value={totalFiles.toLocaleString()} />
        <MetricCard icon={<AlertOctagon className="w-5 h-5" />} label="Total Suspicious Accounts" value={totalSuspicious.toLocaleString()} />
        <MetricCard icon={<Timer className="w-5 h-5" />} label="Avg Processing Time" value={`${avgMs} ms`} />
      </div>

      <Card className="border-amber-500/20 bg-card/50">
        <div className="px-5 py-4 border-b border-amber-500/20">
          <h2 className="font-mono text-sm font-semibold text-amber-400 tracking-wider">GLOBAL AUDIT TABLE</h2>
          <p className="text-[11px] font-mono text-muted-foreground">Every CSV processed across all users</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-amber-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-muted-foreground">No analyses recorded yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-[11px]">FILE</TableHead>
                <TableHead className="font-mono text-[11px]">UPLOADED BY</TableHead>
                <TableHead className="font-mono text-[11px]">DATE</TableHead>
                <TableHead className="font-mono text-[11px] text-right">TX</TableHead>
                <TableHead className="font-mono text-[11px] text-right">SUSPICIOUS</TableHead>
                <TableHead className="font-mono text-[11px] text-right">TIME</TableHead>
                <TableHead className="text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.file_name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    <div>{r.display_name ?? "Unknown"}</div>
                    <div className="text-[10px] text-muted-foreground">{r.user_id.slice(0, 8)}…</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs text-right">{r.transaction_count.toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs text-right text-amber-400">{r.suspicious_count}</TableCell>
                  <TableCell className="font-mono text-xs text-right">{r.processing_time_ms ?? 0} ms</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-amber-400 hover:bg-amber-500/10"
                      onClick={() => navigate(`/dashboard?upload=${r.id}`)}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> View
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

const MetricCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <Card className="border-amber-500/20 bg-card/50 p-5">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-md border border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-400">
        {icon}
      </div>
      <div>
        <div className="font-mono text-[11px] text-muted-foreground tracking-wider">{label}</div>
        <div className="font-mono text-2xl font-bold text-foreground">{value}</div>
      </div>
    </div>
  </Card>
);

export default AdminOverviewTab;
