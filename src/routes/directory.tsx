import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COMPANY_DOMAIN, useHr, type Employee, type LeaveType } from "@/lib/hr-store";

export const Route = createFileRoute("/directory")({
  head: () => ({
    meta: [
      { title: "Employee directory — WanderSiam HR Portal" },
      { name: "description", content: "Manage employee profiles and monitor leave quota usage across departments." },
      { property: "og:title", content: "Employee directory — WanderSiam HR Portal" },
      { property: "og:description", content: "Manage employee profiles and monitor leave quota usage across departments." },
    ],
  }),
  component: DirectoryPage,
});

const emptyEmployee = (): Employee => ({
  id: `e${Date.now()}`,
  name: "",
  position: "",
  department: "Operations",
  email: `@${COMPANY_DOMAIN}`,
  role: "employee",
  active: true,
});

function DirectoryPage() {
  const hr = useHr();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Employee | null>(null);

  if (hr.currentUser && hr.currentUser.role !== "hr") {
    return (
      <AppShell title="Employee directory">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            This area is available to HR and managers only.
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const filtered = hr.employees.filter((e) =>
    `${e.name} ${e.position} ${e.department} ${e.email}`.toLowerCase().includes(query.toLowerCase()),
  );

  const save = () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.email.endsWith(`@${COMPANY_DOMAIN}`)) {
      toast.error(`Name is required and email must end with @${COMPANY_DOMAIN}.`);
      return;
    }
    hr.saveEmployee(draft);
    toast.success("Employee profile saved");
    setDraft(null);
  };

  return (
    <AppShell title="Employee directory">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, role or department"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setDraft(emptyEmployee())}>
            <Plus className="size-4" /> Add employee
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All employees ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.position}</TableCell>
                    <TableCell>{e.department}</TableCell>
                    <TableCell className="text-muted-foreground">{e.email}</TableCell>
                    <TableCell>
                      <Badge variant={e.active ? "default" : "secondary"}>
                        {e.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setDraft(e)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          hr.deleteEmployee(e.id);
                          toast.success("Employee removed");
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leave quota tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hr.employees.map((e) => {
              const q = hr.quotaFor(e.id);
              return (
                <div key={e.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{e.name}</p>
                    <span className="text-xs text-muted-foreground">{e.department}</span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {(Object.keys(q) as LeaveType[]).map((t) => (
                      <div key={t}>
                        <p className="flex justify-between text-xs text-muted-foreground">
                          <span>{t}</span>
                          <span>
                            {q[t].used}/{q[t].quota} days
                          </span>
                        </p>
                        <Progress value={(q[t].used / q[t].quota) * 100} className="mt-1 h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(draft)} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{hr.employees.some((e) => e.id === draft?.id) ? "Edit" : "Add"} employee</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={draft.position}
                    onChange={(e) => setDraft({ ...draft, position: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dept">Department</Label>
                  <Input
                    id="dept"
                    value={draft.department}
                    onChange={(e) => setDraft({ ...draft, department: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mail">Company email</Label>
                <Input id="mail" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={draft.role}
                  onValueChange={(v) => setDraft({ ...draft, role: v as Employee["role"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="hr">HR / Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label htmlFor="active">Active account</Label>
                <Switch
                  id="active"
                  checked={draft.active}
                  onCheckedChange={(v) => setDraft({ ...draft, active: v })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
