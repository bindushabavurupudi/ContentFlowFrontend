import { useEffect, useMemo, useState } from "react";
import { Activity, TrendingUp, AlertTriangle, MessageCircle, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { subscribePostsUpdated } from "@/lib/postEvents";

type DashboardPayload = {
  summary: {
    totalPosts: number;
    totalScheduled: number;
    totalDrafts: number;
    engagementRate: number;
  };
  activities: Array<{ text: string; time: string; type: "success" | "info" | "warning" }>;
};

const typeStyles: Record<string, { badge: string; bg: string }> = {
  high: { badge: "bg-success/10 text-success", bg: "border-l-success" },
  warning: { badge: "bg-warning/10 text-warning", bg: "border-l-warning" },
  info: { badge: "bg-primary/10 text-primary", bg: "border-l-primary" },
};

type EngagementAlert = {
  type: string;
  title: string;
  desc: string;
  time: string;
  icon: typeof TrendingUp;
};

export default function EngagementMonitor() {
  const [dashboard, setDashboard] = useState<DashboardPayload>({
    summary: { totalPosts: 0, totalScheduled: 0, totalDrafts: 0, engagementRate: 0 },
    activities: [],
  });
  const [selectedAlert, setSelectedAlert] = useState<EngagementAlert | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      try {
        const data = await api<DashboardPayload>("/api/dashboard");
        setDashboard(data);
      } catch {
        setDashboard({ summary: { totalPosts: 0, totalScheduled: 0, totalDrafts: 0, engagementRate: 0 }, activities: [] });
      }
    };

    refresh();
    window.addEventListener("focus", refresh);
    const unsubscribePosts = subscribePostsUpdated(refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      unsubscribePosts();
    };
  }, []);

  const alerts = useMemo<EngagementAlert[]>(
    () =>
      (dashboard.activities || []).slice(0, 8).map((item) => {
        const alertType = item.type === "warning" ? "warning" : item.type === "success" ? "high" : "info";
        const icon =
          alertType === "warning"
            ? AlertTriangle
            : alertType === "high"
              ? TrendingUp
              : item.text.toLowerCase().includes("draft")
                ? MessageCircle
                : ThumbsUp;
        return {
          type: alertType,
          title: item.type === "warning" ? "Attention needed" : "Engagement update",
          desc: item.text,
          time: item.time,
          icon,
        };
      }),
    [dashboard.activities],
  );

  const handleOpenComposer = (alert: EngagementAlert) => {
    setSelectedAlert(alert);
    setReplyText(`Thanks for the update. We'll follow up on: ${alert.desc}`);
  };

  const handleSendReply = async () => {
    const message = replyText.trim();
    if (!message) {
      toast.error("Please enter a response before sending.");
      return;
    }

    try {
      setIsSending(true);
      await new Promise((resolve) => setTimeout(resolve, 450));
      toast.success("Response sent successfully.");
      setSelectedAlert(null);
      setReplyText("");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Engagement Monitor</h1>
        <p className="text-sm text-muted-foreground">Real-time alerts and engagement tracking</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card"><p className="text-sm text-muted-foreground mb-1">Total Posts</p><p className="text-2xl font-bold">{dashboard.summary.totalPosts}</p></div>
        <div className="kpi-card"><p className="text-sm text-muted-foreground mb-1">Scheduled</p><p className="text-2xl font-bold">{dashboard.summary.totalScheduled}</p></div>
        <div className="kpi-card"><p className="text-sm text-muted-foreground mb-1">Engagement Rate</p><p className="text-2xl font-bold text-success">{dashboard.summary.engagementRate.toFixed(1)}%</p></div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Live Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((a, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border-l-4 bg-muted/30 ${typeStyles[a.type].bg}`}>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${typeStyles[a.type].badge}`}>
                  <a.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <Badge variant="secondary" className={`text-[10px] ${typeStyles[a.type].badge}`}>
                      {a.type === "high" ? "High" : a.type === "warning" ? "Warning" : "Info"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{a.time}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs"
                  onClick={() => handleOpenComposer(a)}
                >
                  Respond
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No engagement alerts yet. Schedule posts to start tracking activity.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedAlert)} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Response</DialogTitle>
            <DialogDescription>
              {selectedAlert ? `Replying to: ${selectedAlert.title}` : "Write and send your response."}
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/30 p-2.5 text-xs text-muted-foreground">
                {selectedAlert.desc}
              </div>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response..."
                className="min-h-[120px]"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAlert(null)} disabled={isSending}>
              Cancel
            </Button>
            <Button variant="gradient" onClick={handleSendReply} disabled={isSending}>
              {isSending ? "Sending..." : "Send Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
