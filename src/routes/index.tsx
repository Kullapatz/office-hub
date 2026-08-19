import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo-wandersiam.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY_DOMAIN, useHr } from "@/lib/hr-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WanderSiam HR Portal — Sign in" },
      {
        name: "description",
        content:
          "Internal HR and attendance portal for WanderSiam: clock in, leave requests, company calendar and employee directory.",
      },
      { property: "og:title", content: "WanderSiam HR Portal — Sign in" },
      {
        property: "og:description",
        content: "Attendance, leave approval and HR announcements for the WanderSiam team.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { currentUser, refresh } = useHr();
  const navigate = useNavigate();
  const [email, setEmail] = useState(`you@${COMPANY_DOMAIN}`);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (currentUser) navigate({ to: "/dashboard", replace: true });
  }, [currentUser, navigate]);

  const domainOk = (value: string) => value.trim().toLowerCase().endsWith(`@${COMPANY_DOMAIN}`);

  const bootstrap = async (displayName?: string) => {
    const { error: rpcError } = await supabase.rpc("bootstrap_current_user", {
      _name: displayName ?? "",
    });
    if (rpcError) {
      await supabase.auth.signOut();
      throw new Error(rpcError.message);
    }
    await refresh();
  };

  const signIn = async () => {
    setError(null);
    setNotice(null);
    if (!domainOk(email)) {
      setError(`Please use your @${COMPANY_DOMAIN} company email.`);
      return;
    }
    setBusy(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) throw authError;
      await bootstrap();
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const signUp = async () => {
    setError(null);
    setNotice(null);
    if (!domainOk(email)) {
      setError(`Registration is limited to @${COMPANY_DOMAIN} company emails.`);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: name },
        },
      });
      if (authError) throw authError;
      if (!data.session) {
        setNotice("Account created. Check your inbox to confirm your email, then sign in.");
        return;
      }
      await bootstrap(name);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div
        className="relative hidden flex-col justify-between p-10 text-primary-foreground lg:flex"
        style={{ background: "var(--gradient-primary)" }}
      >
        <img src={logo.url} alt="WanderSiam" className="h-10 w-auto brightness-0 invert" />
        <div>
          <h2 className="max-w-md text-4xl font-semibold leading-tight">
            Attendance, leave and people — in one internal portal.
          </h2>
          <p className="mt-4 max-w-md text-sm opacity-80">
            Clock in from the office network, submit leave with a medical certificate, and let HR
            approve with balances deducted automatically.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm opacity-80">
          <ShieldCheck className="size-4" /> Company accounts only · @{COMPANY_DOMAIN}
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <img src={logo.url} alt="WanderSiam" className="mb-8 h-9 w-auto lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">HR Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your <span className="font-medium text-foreground">@{COMPANY_DOMAIN}</span> company
            email.
          </p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="w-full">
              <TabsTrigger value="signin" className="flex-1">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void signIn();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Company email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void signUp();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="fullname">Full name</Label>
                  <Input id="fullname" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Company email</Label>
                  <Input
                    id="email2"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Password</Label>
                  <Input
                    id="password2"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error ? (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
          {notice ? (
            <p className="mt-4 rounded-lg border border-border bg-secondary p-3 text-sm">{notice}</p>
          ) : null}

          <p className="mt-6 text-xs text-muted-foreground">
            The first registered account becomes the HR administrator. Clock in and out is only
            allowed from a whitelisted office network.
          </p>
        </div>
      </div>
    </div>
  );
}
