import React, { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, User, Chrome } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import CyberShieldLogo from "@/components/CyberShieldLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type Mode = "signin" | "signup" | "forgot";

const Auth: React.FC = () => {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { toast } = useToast();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";

  useEffect(() => {
    if (session) navigate(from, { replace: true });
  }, [session, navigate, from]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Access granted", description: "Secure session established." });
        navigate(from, { replace: true });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/verify-email`,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        toast({ title: "Verify your email", description: "Check your inbox to activate your account." });
        setMode("signin");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Reset link sent", description: "Check your inbox to continue." });
        setMode("signin");
      }
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
    }
  };

  const title = mode === "signup" ? "CREATE SECURE ACCESS" : mode === "forgot" ? "RECOVER ACCESS" : "OPERATOR LOGIN";

  return (
    <div className="relative min-h-screen bg-background hex-pattern overflow-hidden px-4 py-8 flex items-center justify-center">
      <MatrixRain />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
      <main className="relative z-10 w-full max-w-md rounded-lg border border-border/60 bg-card/75 p-6 shadow-sm backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <CyberShieldLogo size={80} />
          <h1 className="mt-4 font-display text-xl font-bold tracking-widest text-foreground">{title}</h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground">Money Muling Detection Engine</p>
        </div>

        {mode !== "forgot" && (
          <Button type="button" variant="outline" className="mb-4 w-full border-border/60 bg-background/70" onClick={handleGoogle} disabled={loading}>
            <Chrome className="h-4 w-4" /> Continue with Google
          </Button>
        )}

        {mode !== "forgot" && <div className="mb-4 h-px bg-border/50" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="displayName" className="font-mono text-xs tracking-widest text-muted-foreground">DISPLAY NAME</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="pl-9 font-mono" required />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="font-mono text-xs tracking-widest text-muted-foreground">EMAIL</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9 font-mono" autoComplete="email" required />
            </div>
          </div>
          {mode !== "forgot" && (
            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-xs tracking-widest text-muted-foreground">PASSWORD</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9 font-mono" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} required />
              </div>
            </div>
          )}
          <Button type="submit" className="w-full font-mono font-bold tracking-widest" disabled={loading}>
            <Shield className="h-4 w-4" /> {loading ? "PROCESSING" : mode === "signup" ? "CREATE ACCOUNT" : mode === "forgot" ? "SEND RESET LINK" : "SIGN IN"}
          </Button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-center text-xs font-mono text-muted-foreground">
          {mode === "signin" && <button onClick={() => setMode("forgot")} className="hover:text-foreground">Forgot password?</button>}
          <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="hover:text-foreground">
            {mode === "signup" ? "Already cleared? Sign in" : "Need clearance? Create account"}
          </button>
          {mode === "forgot" && <button onClick={() => setMode("signin")} className="hover:text-foreground">Return to login</button>}
          <Link to="/" className="hover:text-foreground">Return home</Link>
        </div>
      </main>
    </div>
  );
};

export default Auth;