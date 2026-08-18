import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo-wandersiam.png.asset.json";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { COMPANY_DOMAIN, OFFICE_SUBNET, useHr } from "@/lib/hr-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WanderSiam HR Portal — Sign in" },
      {
        name: "description",
        content:
          "Internal HR and attendance portal for WanderSiam: check-in, leave requests, company calendar and employee directory.",
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
  const { login, currentUser, onOfficeNetwork, setOnOfficeNetwork, clientIp } = useHr();
  const navigate = useNavigate();
  const [email, setEmail] = useState(`kullapat@${COMPANY_DOMAIN}`);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) navigate({ to: "/dashboard", replace: true });
  }, [currentUser, navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between p-10 text-primary-foreground lg:flex" style={{ background: "var(--gradient-primary)" }}>
        <img src={logo.url} alt="WanderSiam" className="h-10 w-auto brightness-0 invert" />
        <div>
          <h2 className="max-w-md text-4xl font-semibold leading-tight">
            Attendance, leave and people — in one internal portal.
          </h2>
          <p className="mt-4 max-w-md text-sm opacity-80">
            One-click check-in on the office network, leave approvals with attachments, shared
            holiday calendar and quota tracking for every team member.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm opacity-80">
          <ShieldCheck className="size-4" /> Office network only · {OFFICE_SUBNET}
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <img src={logo.url} alt="WanderSiam" className="mb-8 h-9 w-auto lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your <span className="font-medium text-foreground">@{COMPANY_DOMAIN}</span> company
            email.
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const res = login(email);
              setError(res.ok ? null : (res.error ?? "Sign in failed"));
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Company email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`you@${COMPANY_DOMAIN}`}
                required
              />
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>

          <Card className="mt-6 border-border/70">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-sm font-medium">
                  {onOfficeNetwork ? (
                    <Wifi className="size-4 text-success" />
                  ) : (
                    <WifiOff className="size-4 text-destructive" />
                  )}
                  {onOfficeNetwork ? "Office network detected" : "External network"}
                </span>
                <Switch checked={onOfficeNetwork} onCheckedChange={setOnOfficeNetwork} />
              </div>
              <p className="font-mono text-xs text-muted-foreground">Your IP: {clientIp}</p>
              <p className="text-xs text-muted-foreground">
                Demo accounts: kullapat@{COMPANY_DOMAIN} (employee) · naruemon@{COMPANY_DOMAIN} (HR).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
