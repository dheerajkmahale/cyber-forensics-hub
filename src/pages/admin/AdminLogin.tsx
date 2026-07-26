import React, { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert, Mail, Lock, AlertTriangle } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((location.state as any)?.denied) setDenied(true);
  }, [location.state]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setDenied(false);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("No session");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: roleRow } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleRow) {
        await supabase.auth.signOut();
        setDenied(true);
        toast.error("Access denied: admin privileges required");
        return;
      }

      toast.success("Admin clearance granted");
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center overflow-hidden">
      <MatrixRain />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-background to-background pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-lg border border-amber-500/40 bg-card/80 backdrop-blur-sm shadow-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-md border border-amber-500/50 bg-amber-500/10 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="font-mono text-xl font-bold text-amber-400 tracking-wider">ADMIN PORTAL</h1>
              <p className="font-mono text-[11px] text-muted-foreground">RESTRICTED · AUTHORIZED PERSONNEL ONLY</p>
            </div>
          </div>

          {denied && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Access denied. Your account does not have admin privileges.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="font-mono text-xs text-muted-foreground">EMAIL</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 font-mono" placeholder="admin@org.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-mono text-xs text-muted-foreground">PASSWORD</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 font-mono" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-mono font-bold tracking-wider">
              {loading ? "AUTHENTICATING…" : "ACCESS PORTAL"}
            </Button>
          </form>

          <p className="mt-6 text-[11px] font-mono text-muted-foreground text-center">
            Investigator? <button onClick={() => navigate("/auth")} className="text-amber-400 hover:underline">Use the standard login</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
