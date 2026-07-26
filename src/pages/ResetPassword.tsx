import React, { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Shield } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import CyberShieldLogo from "@/components/CyberShieldLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const hasRecoveryToken = window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery");
    setReady(hasRecoveryToken);
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Enter the same password twice.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Password updated", description: "Use your new credentials to continue." });
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="relative min-h-screen bg-background hex-pattern overflow-hidden px-4 py-8 flex items-center justify-center">
      <MatrixRain />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
      <main className="relative z-10 w-full max-w-md rounded-lg border border-border/60 bg-card/75 p-6 shadow-sm backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <CyberShieldLogo size={80} />
          <h1 className="mt-4 font-display text-xl font-bold tracking-widest text-foreground">RESET PASSWORD</h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground">Establish a new secure credential.</p>
        </div>

        {!ready ? (
          <div className="space-y-4 text-center">
            <p className="text-sm font-mono text-muted-foreground">This recovery link is missing or expired.</p>
            <Button asChild className="w-full font-mono font-bold tracking-widest"><Link to="/auth">REQUEST NEW LINK</Link></Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-xs tracking-widest text-muted-foreground">NEW PASSWORD</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9 font-mono" minLength={8} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-mono text-xs tracking-widest text-muted-foreground">CONFIRM PASSWORD</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="pl-9 font-mono" minLength={8} required />
              </div>
            </div>
            <Button type="submit" className="w-full font-mono font-bold tracking-widest" disabled={loading}>
              <Shield className="h-4 w-4" /> {loading ? "UPDATING" : "UPDATE PASSWORD"}
            </Button>
          </form>
        )}
      </main>
    </div>
  );
};

export default ResetPassword;