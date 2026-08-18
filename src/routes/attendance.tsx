import { createFileRoute } from "@tanstack/react-router";
import { LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { employeeName, iso, OFFICE_SUBNET, useHr } from "@/lib/hr-store";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — WanderSiam HR Portal" },
      { name: "description", content: "One-click check-in and check-out with office IP verification and daily logs." },
      { property: "og:title", content: "Attendance — WanderSiam HR Portal" },
      { property: "og:description", content: "One-click check-in and check-out with office IP verification and daily logs." },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const hr = useHr();
  const isHr = hr.currentUser?.role === "hr";
  const today = iso(new Date());
  const logs = isHr
    ? hr.attendance.filter((a) => a.date === today)
    : hr.attendance.filter((a) => a.employeeId === hr.currentUser?.id).slice().reverse();

  const act = (fn: () => { ok: boolean; error?: string }, success: string) => {
    const res = fn();
    if (res.ok) toast.success(success);
    else toast.error(res.error ?? "Something went wrong");
  };

  return (
    <AppShell title="Time attendance">
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's status</p>
              <p className="text-2xl font-semibold">
                {hr.todayRecord?.checkOut
                  ? `Checked out at ${hr.todayRecord.checkOut}`
                  : hr.todayRecord?.checkIn
                    ? `Checked in at ${hr.todayRecord.checkIn}`
                    : "Not checked in today"}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Client IP {hr.clientIp} · allowed {OFFICE_SUBNET}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => act(hr.checkIn, "Checked in successfully")} disabled={Boolean(hr.todayRecord?.checkIn)}>
                <LogIn className="size-4" /> Check in
              </Button>
              <Button
                variant="outline"
                onClick={() => act(hr.checkOut, "Checked out successfully")}
                disabled={!hr.todayRecord?.checkIn || Boolean(hr.todayRecord?.checkOut)}
              >
                <LogOut className="size-4" /> Check out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isHr ? "Daily log — all employees" : "My attendance history"}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {isHr ? <TableHead>Employee</TableHead> : null}
                  <TableHead>Date</TableHead>
                  <TableHead>Check in</TableHead>
                  <TableHead>Check out</TableHead>
                  <TableHead>IP address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isHr ? 6 : 5} className="text-center text-muted-foreground">
                      No records yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((a) => (
                    <TableRow key={a.id}>
                      {isHr ? <TableCell>{employeeName(hr.employees, a.employeeId)}</TableCell> : null}
                      <TableCell>{a.date}</TableCell>
                      <TableCell>{a.checkIn ?? "—"}</TableCell>
                      <TableCell>{a.checkOut ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{a.ip ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={a.checkOut ? "secondary" : "default"}>
                          {a.checkOut ? "Completed" : "Working"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
