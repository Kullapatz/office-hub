import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  Clock,
  FileCheck2,
  Home,
  LogOut,
  Megaphone,
  Menu,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import logo from "@/assets/logo-wandersiam.png.asset.json";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useHr } from "@/lib/hr-store";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/attendance", label: "Attendance", icon: Clock },
  { to: "/leave", label: "Leave", icon: FileCheck2 },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
] as const;

const hrNav = [
  { to: "/approvals", label: "Approvals", icon: FileCheck2 },
  { to: "/directory", label: "Employees", icon: Users },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { currentUser, leaves } = useHr();
  const pending = leaves.filter((l) => l.status === "Pending").length;
  const items = currentUser?.role === "hr" ? [...nav, ...hrNav] : nav;

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary"
        >
          <Icon className="size-4" />
          {label}
          {to === "/approvals" && pending > 0 ? (
            <Badge className="ml-auto" variant="default">
              {pending}
            </Badge>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}

function NetworkToggle() {
  const { onOfficeNetwork, setOnOfficeNetwork, clientIp } = useHr();
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          {onOfficeNetwork ? (
            <Wifi className="size-4 text-success" />
          ) : (
            <WifiOff className="size-4 text-destructive" />
          )}
          {onOfficeNetwork ? "Office network" : "External network"}
        </div>
        <Switch checked={onOfficeNetwork} onCheckedChange={setOnOfficeNetwork} />
      </div>
      <p className="mt-2 font-mono text-xs text-muted-foreground">IP {clientIp}</p>
      <p className="mt-1 text-xs text-muted-foreground">Demo switch to test the IP whitelist.</p>
    </div>
  );
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { currentUser, hydrated, logout } = useHr();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !currentUser) navigate({ to: "/", replace: true });
  }, [currentUser, hydrated, navigate]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between border-r border-border bg-card p-4 lg:flex">
        <div>
          <img src={logo.url} alt="WanderSiam" className="mb-6 h-9 w-auto" />
          <NavLinks />
        </div>
        <div className="space-y-3">
          <NetworkToggle />
          <div className="rounded-lg bg-secondary p-3">
            <p className="truncate text-sm font-semibold">{currentUser.name}</p>
            <p className="truncate text-xs text-muted-foreground">{currentUser.position}</p>
          </div>
          <Button variant="outline" className="w-full" onClick={logout}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <img src={logo.url} alt="WanderSiam" className="mb-6 h-8 w-auto" />
              <NavLinks onNavigate={() => setOpen(false)} />
              <div className="mt-6 space-y-3">
                <NetworkToggle />
                <Button variant="outline" className="w-full" onClick={logout}>
                  <LogOut className="size-4" /> Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <span className="ml-auto hidden text-sm text-muted-foreground sm:block">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </header>
        <main className="mx-auto max-w-6xl p-4 pb-16 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
