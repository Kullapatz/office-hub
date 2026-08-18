import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Clock, LogIn, LogOut, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { holidays, iso, useHr, type LeaveType } from "@/lib/hr-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — WanderSiam HR Portal" },
      { name: "description", content: "Daily check-in status, leave quota and HR announcements." },
      { property: "og:title", content: "Dashboard — WanderSiam HR Portal" },
      { property: "og:description", content: "Daily check-in status, leave quota and HR announcements." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const hr = useHr();
  const user = hr.currentUser;
  const quota = user ? hr.quotaFor(user.id) : null;
  const unread = hr.announcements.filter((a) => !a.read).length;
  const today = iso(new Date());
  const upcomingHolidays = holidays.filter((h) => h.date >= today).slice(0, 3);
  const myPending = hr.leaves.filter((l) => l.employeeId === user?.id && l.status === "Pending");

  const act = (fn: () => { ok: boolean; error?: string }, success: string) => {
    const res = fn();
    if (res.ok) toast.success(success);
    else toast.error(res.error ?? "Something went wrong");
  };

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <Card className="overflow-hidden border-0" style={{ background: "var(--gradient-primary)" }}>
          <CardContent className="flex flex-col gap-6 p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm opacity-80">Welcome back</p>
              <h2 className="text-2xl font-semibold">{user?.name}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm opacity-90">
                <Clock className="size-4" />
                {hr.todayRecord?.checkOut
                  ? `Checked out at ${hr.todayRecord.checkOut}`
                  : hr.todayRecord?.checkIn
                    ? `Checked in at ${hr.todayRecord.checkIn}`
                    : "Not checked in today"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => act(hr.checkIn, "Checked in successfully")}
                disabled={Boolean(hr.todayRecord?.checkIn)}
              >
                <LogIn className="size-4" /> Check in
              </Button>
              <Button
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => act(hr.checkOut, "Checked out successfully")}
                disabled={!hr.todayRecord?.checkIn || Boolean(hr.todayRecord?.checkOut)}
              >
                <LogOut className="size-4" /> Check out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          {quota &&
            (Object.keys(quota) as LeaveType[]).map((type) => {
              const { used, quota: total } = quota[type];
              return (
                <Card key={type}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {type} leave
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">
                      {used}
                      <span className="text-base font-normal text-muted-foreground">/{total} days</span>
                    </p>
                    <Progress value={(used / total) * 100} className="mt-3 h-2" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {Math.max(total - used, 0)} days remaining
                    </p>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="size-4 text-primary" /> HR announcements
                {unread > 0 ? <Badge>{unread} new</Badge> : null}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/announcements">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {hr.announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{a.category}</Badge>
                    <span className="text-xs text-muted-foreground">{a.date}</span>
                    {!a.read ? <span className="size-2 rounded-full bg-primary" /> : null}
                  </div>
                  <p className="mt-2 font-medium">{a.title}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="size-4 text-primary" /> Upcoming holidays
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingHolidays.map((h) => (
                  <div key={h.date + h.name} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{h.name}</p>
                      <p className="text-xs text-muted-foreground">{h.date}</p>
                    </div>
                    <Badge variant={h.kind === "company" ? "default" : "secondary"}>{h.kind}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">My pending requests</CardTitle>
              </CardHeader>
              <CardContent>
                {myPending.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending leave requests.</p>
                ) : (
                  myPending.map((l) => (
                    <div key={l.id} className="flex items-center justify-between py-1 text-sm">
                      <span>
                        {l.type} · {l.start}
                      </span>
                      <Badge variant="secondary">{l.status}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
