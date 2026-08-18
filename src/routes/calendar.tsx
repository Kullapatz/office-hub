import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { employeeName, holidays, iso, useHr } from "@/lib/hr-store";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Company calendar — WanderSiam HR Portal" },
      { name: "description", content: "National holidays, company holidays and approved team leave in one monthly calendar." },
      { property: "og:title", content: "Company calendar — WanderSiam HR Portal" },
      { property: "og:description", content: "National holidays, company holidays and approved team leave in one monthly calendar." },
    ],
  }),
  component: CalendarPage,
});

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarPage() {
  const hr = useHr();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const approvedLeaves = hr.leaves.filter((l) => l.status === "Approved");

  const days = useMemo(() => {
    const first = new Date(cursor);
    const offset = (first.getDay() + 6) % 7;
    const total = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let i = 1; i <= total; i += 1)
      cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    return cells;
  }, [cursor]);

  const eventsFor = (date: Date) => {
    const key = iso(date);
    return {
      holidays: holidays.filter((h) => h.date === key),
      leaves: approvedLeaves.filter((l) => key >= l.start && key <= l.end),
    };
  };

  const monthLeaves = approvedLeaves.filter((l) =>
    l.start.startsWith(iso(cursor).slice(0, 7)) || l.end.startsWith(iso(cursor).slice(0, 7)),
  );

  return (
    <AppShell title="Company calendar">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {weekdays.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;
                const { holidays: hol, leaves } = eventsFor(day);
                const isToday = iso(day) === iso(new Date());
                return (
                  <div
                    key={iso(day)}
                    className={`min-h-20 rounded-lg border p-1.5 text-left ${
                      isToday ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <span className={`text-xs font-medium ${isToday ? "text-primary" : ""}`}>
                      {day.getDate()}
                    </span>
                    <div className="mt-1 space-y-1">
                      {hol.map((h) => (
                        <p
                          key={h.name}
                          className={`truncate rounded px-1 py-0.5 text-[10px] ${
                            h.kind === "company"
                              ? "bg-warning/20 text-warning-foreground"
                              : "bg-destructive/15 text-destructive"
                          }`}
                          title={h.name}
                        >
                          {h.name}
                        </p>
                      ))}
                      {leaves.map((l) => (
                        <p
                          key={l.id}
                          className="truncate rounded bg-primary/15 px-1 py-0.5 text-[10px] text-primary"
                          title={`${employeeName(hr.employees, l.employeeId)} — ${l.type}`}
                        >
                          {employeeName(hr.employees, l.employeeId).split(" ")[0]} · {l.type}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <span className="size-3 rounded bg-destructive/40" /> National holiday
              </p>
              <p className="flex items-center gap-2">
                <span className="size-3 rounded bg-warning/50" /> Company holiday
              </p>
              <p className="flex items-center gap-2">
                <span className="size-3 rounded bg-primary/40" /> Approved team leave
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Team leave this month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {monthLeaves.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approved leave this month.</p>
              ) : (
                monthLeaves.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{employeeName(hr.employees, l.employeeId)}</span>
                    <Badge variant="secondary">
                      {l.type} · {l.start.slice(5)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
