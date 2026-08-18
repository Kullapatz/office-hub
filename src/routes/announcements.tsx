import { createFileRoute } from "@tanstack/react-router";
import { CheckCheck, Megaphone, Plus } from "lucide-react";
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
import { useHr, type Announcement } from "@/lib/hr-store";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — WanderSiam HR Portal" },
      { name: "description", content: "HR news, internal memos and upcoming company events with unread badges." },
      { property: "og:title", content: "Announcements — WanderSiam HR Portal" },
      { property: "og:description", content: "HR news, internal memos and upcoming company events with unread badges." },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const hr = useHr();
  const isHr = hr.currentUser?.role === "hr";
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<Announcement["category"]>("News");
  const unread = hr.announcements.filter((a) => !a.read).length;

  const publish = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Please add a title and content.");
      return;
    }
    hr.addAnnouncement({ title, body, category });
    toast.success("Announcement published");
    setOpen(false);
    setTitle("");
    setBody("");
  };

  return (
    <AppShell title="HR announcements">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread announcement${unread > 1 ? "s" : ""}` : "All caught up"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={hr.markAllRead} disabled={unread === 0}>
              <CheckCheck className="size-4" /> Mark all read
            </Button>
            {isHr ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="size-4" /> New announcement
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Publish announcement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={category}
                        onValueChange={(v) => setCategory(v as Announcement["category"])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="News">News</SelectItem>
                          <SelectItem value="Memo">Internal memo</SelectItem>
                          <SelectItem value="Event">Upcoming event</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body">Content</Label>
                      <Textarea id="body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={publish}>Publish</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        </div>

        {hr.announcements.map((a) => (
          <Card key={a.id} className={a.read ? "" : "border-primary/40"}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="size-4 text-primary" /> {a.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{a.category}</Badge>
                {!a.read ? <Badge>New</Badge> : null}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{a.body}</p>
              <p className="mt-3 text-xs text-muted-foreground">Published {a.date}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
