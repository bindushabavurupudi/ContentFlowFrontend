import { useEffect, useState } from "react";
import { FileText, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { subscribePostsUpdated } from "@/lib/postEvents";

type DashboardPayload = {
  analytics: {
    likes: number;
    comments: number;
    shares: number;
    ctr: number;
    totalScheduled: number;
    totalPosts: number;
  };
  summary: {
    totalPosts: number;
    totalScheduled: number;
    totalDrafts: number;
    engagementRate: number;
  };
  activities: Array<{ text: string; time: string; type: "success" | "info" | "warning" }>;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardPayload>({
    analytics: { likes: 0, comments: 0, shares: 0, ctr: 0, totalScheduled: 0, totalPosts: 0 },
    summary: { totalPosts: 0, totalScheduled: 0, totalDrafts: 0, engagementRate: 0 },
    activities: [],
  });

  useEffect(() => {
    const refresh = async () => {
      try {
        const data = await api<DashboardPayload>("/api/dashboard");
        setDashboard(data);
      } catch {
        // Keep zero defaults when request fails.
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

  const hasData = dashboard.summary.totalPosts > 0;

  const kpis = [
    { label: "Total Posts", value: String(dashboard.summary.totalPosts), icon: FileText, color: "text-primary" },
    { label: "Draft Posts", value: String(dashboard.summary.totalDrafts), icon: Users, color: "text-chart-2" },
    { label: "Scheduled Posts", value: String(dashboard.summary.totalScheduled), icon: Clock, color: "text-chart-3" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your social media performance</p>
        </div>
        <Button variant="gradient" className="gap-1.5" onClick={() => navigate("/schedule")}>
          <Clock className="h-4 w-4" /> Quick Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className={`kpi-card animate-fade-up stagger-${i + 1}`} style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      {hasData ? (
        <>
          {dashboard.activities.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.activities.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${
                        a.type === "success" ? "bg-success" : a.type === "warning" ? "bg-warning" : "bg-primary"
                      }`} />
                      <span className="text-sm flex-1">{a.text}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
