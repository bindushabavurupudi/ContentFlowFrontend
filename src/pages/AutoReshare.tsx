import { useEffect, useMemo, useState } from "react";
import { Repeat2, Sparkles, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { addPost } from "@/lib/demoStore";
import { notifyPostsUpdated } from "@/lib/postEvents";

type DashboardPayload = {
  topPosts: Array<{ rank: number; title: string; platform?: string; platforms?: string[]; createdAt: string | null }>;
};

type ReshareCandidate = {
  id: string;
  rank: number;
  title: string;
  platforms: string[];
  score: number;
};

export default function AutoReshare() {
  const [dashboard, setDashboard] = useState<DashboardPayload>({ topPosts: [] });
  const [selected, setSelected] = useState<ReshareCandidate | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      try {
        const data = await api<DashboardPayload>("/api/dashboard");
        setDashboard({ topPosts: data.topPosts || [] });
      } catch {
        setDashboard({ topPosts: [] });
      }
    };
    refresh();
  }, []);

  const candidates = useMemo<ReshareCandidate[]>(
    () =>
      (dashboard.topPosts || []).slice(0, 8).map((post, i) => {
        const rawPlatforms = Array.isArray(post.platforms) && post.platforms.length > 0
          ? post.platforms
          : [String(post.platform || "instagram").toLowerCase()];
        return {
          id: `${post.rank}-${post.title}-${i}`,
          rank: post.rank || i + 1,
          title: post.title || "Top post",
          platforms: rawPlatforms,
          score: Math.max(60, 100 - i * 7),
        };
      }),
    [dashboard.topPosts],
  );

  const openReshare = (post: ReshareCandidate) => {
    setSelected(post);
    const now = new Date();
    now.setDate(now.getDate() + 1);
    setDate(now.toISOString().slice(0, 10));
    setTime("10:00");
  };

  const handleReshare = async () => {
    if (!selected) return;
    if (!date || !time) {
      toast.error("Select date and time for reshare");
      return;
    }

    try {
      setSubmitting(true);
      await addPost({
        content: `Reshare: ${selected.title}`,
        platforms: selected.platforms,
        date,
        time,
        status: "scheduled",
      });
      notifyPostsUpdated();
      toast.success("Post queued for resharing", {
        description: `Scheduled on ${date} at ${time}`,
      });
      setSelected(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to queue reshare");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automated Post Resharing</h1>
          <p className="text-sm text-muted-foreground">Keep your best content in rotation at optimal times</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" /> Top-performance driven
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Repeat2 className="h-4 w-4 text-primary" /> Reshare Queue Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {candidates.length > 0 ? (
            candidates.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                <div>
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Platforms: {c.platforms.map((p) => `${p.charAt(0).toUpperCase()}${p.slice(1)}`).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">Score {c.score}</Badge>
                  <Button variant="outline" size="sm" onClick={() => openReshare(c)}>
                    Queue Reshare
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No top posts yet. Publish more posts to unlock reshare suggestions.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Queue Reshare</DialogTitle>
            <DialogDescription>
              {selected ? `Schedule a reshare for: ${selected.title}` : "Select a top post to continue."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Date</p>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Time</p>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="rounded-md border bg-muted/30 p-2.5 text-xs text-muted-foreground flex items-center gap-2">
            <CalendarClock className="h-3.5 w-3.5" />
            Reshared posts are added to your normal content calendar automatically.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)} disabled={submitting}>Cancel</Button>
            <Button variant="gradient" onClick={handleReshare} disabled={submitting}>
              {submitting ? "Queueing..." : "Confirm Reshare"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
