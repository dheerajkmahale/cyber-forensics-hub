import React, { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Mail, Send } from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import CyberShieldLogo from "@/components/CyberShieldLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Status = "verifying" | "success" | "error";
type ResendState = { kind: "idle" | "sending" | "sent" | "error"; message?: string };

const REDIRECT_DELAY_MS = 3000;

const VerifyEmail: React.FC = () => {
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("Confirming your email address...");
  const [countdown, setCountdown] = useState(Math.ceil(REDIRECT_DELAY_MS / 1000));
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [resendEmail, setResendEmail] = useState("");
  const [resend, setResend] = useState<ResendState>({ kind: "idle" });

  const handleResend = async (event: FormEvent) => {
    event.preventDefault();
    if (!resendEmail) return;
    setResend({ kind: "sending" });
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: resendEmail,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    });
    if (error) {
      setResend({ kind: "error", message: error.message });
    } else {
      setResend({ kind: "sent", message: `Verification email sent to ${resendEmail}. Check your inbox.` });
    }
  };

  useEffect(() => {
    const verify = async () => {
      try {
        // Parse hash params (e.g. #access_token=...&type=signup or #error=...)
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);

        const hashError = hashParams.get("error_description") || hashParams.get("error");
        if (hashError) {
          setStatus("error");
          setMessage(decodeURIComponent(hashError));
          return;
        }

        // Modern PKCE / OTP flow: ?token_hash=...&type=signup|email
        const tokenHash = searchParams.get("token_hash");
        const type = (searchParams.get("type") as "signup" | "email" | "recovery" | null) ?? null;

        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
          await supabase.auth.signOut();
          setStatus("success");
          setMessage("Your email has been verified. You can now sign in.");
          return;
        }

        // Code exchange flow: ?code=...
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          await supabase.auth.signOut();
          setStatus("success");
          setMessage("Your email has been verified. You can now sign in.");
          return;
        }

        // Hash-based session (legacy implicit flow): #access_token=...&type=signup
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const hashType = hashParams.get("type");
        if (accessToken && refreshToken && hashType === "signup") {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          await supabase.auth.signOut();
          setStatus("success");
          setMessage("Your email has been verified. You can now sign in.");
          return;
        }

        // No verification params present — check current session
        const { data } = await supabase.auth.getUser();
        if (data.user?.email_confirmed_at) {
          await supabase.auth.signOut();
          setStatus("success");
          setMessage("Your email is already verified. You can sign in.");
          return;
        }

        setStatus("error");
        setMessage("No verification token found. Please use the link from your email.");
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed.");
      }
    };

    void verify();
  }, [searchParams]);

  // Auto re-check verification status while in error state
  useEffect(() => {
    if (status !== "error") return;
    const POLL_MS = 3000;
    let cancelled = false;

    const recheck = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        if (data.user?.email_confirmed_at) {
          await supabase.auth.signOut();
          if (cancelled) return;
          setStatus("success");
          setMessage("Your email has been verified. You can now sign in.");
        }
      } catch {
        // ignore transient errors during polling
      }
    };

    const interval = setInterval(recheck, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [status]);

  // Countdown + redirect on success
  useEffect(() => {
    if (status !== "success") return;
    const interval = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    const timeout = setTimeout(() => {
      navigate("/auth", { replace: true });
    }, REDIRECT_DELAY_MS);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [status, navigate]);

  return (
    <div className="relative min-h-screen bg-background hex-pattern overflow-hidden px-4 py-8 flex items-center justify-center">
      <MatrixRain />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />
      <main className="relative z-10 w-full max-w-md rounded-lg border border-border/60 bg-card/75 p-6 shadow-sm backdrop-blur-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <CyberShieldLogo size={80} />
          <h1 className="mt-4 font-display text-xl font-bold tracking-widest text-foreground">EMAIL VERIFICATION</h1>
          <p className="mt-2 text-xs font-mono text-muted-foreground">Identity confirmation protocol</p>
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          {status === "verifying" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border/60 bg-background/70">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="font-mono text-sm text-muted-foreground">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold tracking-widest text-foreground">VERIFIED</h2>
              <p className="font-mono text-sm text-muted-foreground">{message}</p>
              <p className="font-mono text-xs text-muted-foreground">
                Redirecting to sign in in <span className="text-primary">{countdown}s</span>...
              </p>
              <Button asChild className="w-full font-mono font-bold tracking-widest">
                <Link to="/auth">CONTINUE TO SIGN IN</Link>
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="font-display text-lg font-bold tracking-widest text-foreground">VERIFICATION FAILED</h2>
              <p className="font-mono text-sm text-muted-foreground">{message}</p>
              <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                Auto re-checking verification status every 3s...
              </p>

              <form onSubmit={handleResend} className="w-full space-y-3 pt-2 text-left">
                <div className="space-y-2">
                  <Label htmlFor="resendEmail" className="font-mono text-xs tracking-widest text-muted-foreground">
                    RESEND VERIFICATION EMAIL
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="resendEmail"
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9 font-mono"
                      required
                      disabled={resend.kind === "sending"}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full font-mono font-bold tracking-widest"
                  disabled={resend.kind === "sending" || !resendEmail}
                >
                  {resend.kind === "sending" ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> SENDING</>
                  ) : (
                    <><Send className="h-4 w-4" /> RESEND VERIFICATION</>
                  )}
                </Button>
                {resend.kind === "sent" && (
                  <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs text-primary">
                    {resend.message}
                  </p>
                )}
                {resend.kind === "error" && (
                  <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
                    {resend.message}
                  </p>
                )}
              </form>

              <Button asChild variant="outline" className="w-full font-mono font-bold tracking-widest border-border/60 bg-background/70">
                <Link to="/auth"><Mail className="h-4 w-4" /> RETURN TO SIGN IN</Link>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;
