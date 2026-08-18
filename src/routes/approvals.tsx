import { createFileRoute } from "@tanstack/react-router";
import { Check, Paperclip, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { employeeName, useHr, type LeaveStatus } from "@/lib/hr-store";
import { statusVariant } from "./leave";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Leave approvals — WanderSiam HR Portal" },
      { name: "description", content: "HR approval dashboard for incoming leave requests with attachments and comments." },
      { property: "og:title", content: "Leave approvals — WanderSiam HR Portal" },
      { property: "og:description", content: "HR approval dashboard for incoming leave requests with attachments and comments." },
    ],
  }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const hr = useHr();
  const [comments, setComments] = useState<Record<string, string>>({});

  const decide = (id: string, status: LeaveStatus) => {
    hr.decideLeave(id, status, comments[id]);
    toast.success(`Request ${status.toLowerCase()}`);
  };

  const groups: Record<string, LeaveStatus> = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

  if (hr.currentUser && hr.currentUser.role !== "hr") {
    return (
      <AppShell title="Leave approvals">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            This area is available to HR and managers only.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Leave approvals">
      <Tabs defaultValue="pending">
        <TabsList>
          {Object.entries(groups).map(([key, status]) => (
            <TabsTrigger key={key} value={key}>
              {status} ({hr.leaves.filter((l) => l.status === status).length})
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(groups).map(([key, status]) => (
          <TabsContent key={key} value={key} className="mt-4 space-y-3">
            {hr.leaves.filter((l) => l.status === status).length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Nothing here right now.
                </CardContent>
              </Card>
            ) : (
              hr.leaves
                .filter((l) => l.status === status)
                .map((l) => (
                  <Card key={l.id}>
                    <CardHeader className="flex-row items-start justify-between space-y-0">
                      <div>
                        <CardTitle className="text-base">
                          {employeeName(hr.employees, l.employeeId)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {l.type} leave · {l.start} → {l.end} · {l.days} day{l.days > 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge variant={statusVariant(l.status)}>{l.status}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">{l.reason}</p>
                      {l.attachment ? (
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Paperclip className="size-3" /> {l.attachment}
                        </a>
                      ) : null}
                      {status === "Pending" ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            placeholder="Optional comment"
                            value={comments[l.id] ?? ""}
                            onChange={(e) =>
                              setComments((prev) => ({ ...prev, [l.id]: e.target.value }))
                            }
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => decide(l.id, "Approved")}>
                              <Check className="size-4" /> Approve
                            </Button>
                            <Button variant="destructive" onClick={() => decide(l.id, "Rejected")}>
                              <X className="size-4" /> Reject
                            </Button>
                          </div>
                        </div>
                      ) : l.comment ? (
                        <p className="text-xs text-muted-foreground">Comment: {l.comment}</p>
                      ) : null}
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </AppShell>
  );
}
