import { createFileRoute } from "@tanstack/react-router";
import { Paperclip, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { iso, useHr, type LeaveStatus, type LeaveType } from "@/lib/hr-store";

export const Route = createFileRoute("/leave")({
  head: () => ({
    meta: [
      { title: "Leave requests — WanderSiam HR Portal" },
      { name: "description", content: "Submit sick, personal and annual leave with attachments and track approval status." },
      { property: "og:title", content: "Leave requests — WanderSiam HR Portal" },
      { property: "og:description", content: "Submit sick, personal and annual leave with attachments and track approval status." },
    ],
  }),
  component: LeavePage,
});

export function statusVariant(status: LeaveStatus) {
  return status === "Approved" ? "default" : status === "Rejected" ? "destructive" : "secondary";
}

function LeavePage() {
  const hr = useHr();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<LeaveType>("Annual");
  const [start, setStart] = useState(iso(new Date()));
  const [end, setEnd] = useState(iso(new Date()));
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<string | undefined>(undefined);

  const mine = hr.leaves.filter((l) => l.employeeId === hr.currentUser?.id);
  const quota = hr.currentUser ? hr.quotaFor(hr.currentUser.id) : null;

  const submit = () => {
    const days = Math.max(
      1,
      Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1,
    );
    if (!reason.trim()) {
      toast.error("Please add a reason for your leave.");
      return;
    }
    hr.submitLeave({ type, start, end, days, reason, attachment });
    toast.success("Leave request submitted for approval");
    setOpen(false);
    setReason("");
    setAttachment(undefined);
  };

  return (
    <AppShell title="Leave management">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {quota &&
              (Object.keys(quota) as LeaveType[]).map((t) => (
                <Badge key={t} variant="secondary" className="px-3 py-1 text-sm">
                  {t}: {quota[t].used}/{quota[t].quota} days
                </Badge>
              ))}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Request leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New leave request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Leave type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as LeaveType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sick">Sick leave</SelectItem>
                      <SelectItem value="Personal">Personal leave</SelectItem>
                      <SelectItem value="Annual">Annual leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start">Start date</Label>
                    <Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">End date</Label>
                    <Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Short explanation for your manager"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Attachment (e.g. medical certificate)</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setAttachment(e.target.files?.[0]?.name)}
                  />
                  {attachment ? (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Paperclip className="size-3" /> {attachment}
                    </p>
                  ) : null}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submit}>Submit request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leave history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mine.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leave requests yet.</p>
            ) : (
              mine.map((l) => (
                <div
                  key={l.id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {l.type} leave · {l.days} day{l.days > 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {l.start} → {l.end}
                    </p>
                    <p className="mt-1 text-sm">{l.reason}</p>
                    {l.attachment ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-primary">
                        <Paperclip className="size-3" /> {l.attachment}
                      </p>
                    ) : null}
                    {l.comment ? (
                      <p className="mt-1 text-xs text-muted-foreground">HR: {l.comment}</p>
                    ) : null}
                  </div>
                  <Badge variant={statusVariant(l.status)}>{l.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
