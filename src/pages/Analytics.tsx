import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2, MousePointer, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
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
  engagementTrends: Array<{ name: string; posts: number }>;
  platformComparison: Array<{ name: string; posts: number }>;
  topPosts: Array<{ rank: number; title: string; platform?: string; platforms?: string[]; createdAt: string | null }>;
};

export default function Analytics() {
  const [dashboard, setDashboard] = useState<DashboardPayload>({
    analytics: { likes: 0, comments: 0, shares: 0, ctr: 0, totalScheduled: 0, totalPosts: 0 },
    engagementTrends: [],
    platformComparison: [],
    topPosts: [],
  });

  useEffect(() => {
    const refresh = async () => {
      try {
        const data = await api<DashboardPayload>("/api/dashboard");
        setDashboard(data);
      } catch {
        // Keep previous values if request fails
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

  const hasData = dashboard.analytics.totalPosts > 0;
  const formatPlatformLabel = (post: DashboardPayload["topPosts"][number]) => {
    if (Array.isArray(post.platforms) && post.platforms.length > 0) {
      return post.platforms
        .map((p) => String(p || "").trim())
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(", ");
    }
    return post.platform || "General";
  };

  const dynamicMetrics = [
    { label: "Likes", value: dashboard.analytics.likes >= 1000 ? `${(dashboard.analytics.likes / 1000).toFixed(1)}K` : String(dashboard.analytics.likes), change: "Requires platform insights", icon: Heart },
    { label: "Comments", value: dashboard.analytics.comments >= 1000 ? `${(dashboard.analytics.comments / 1000).toFixed(1)}K` : String(dashboard.analytics.comments), change: "Requires platform insights", icon: MessageCircle },
    { label: "Shares", value: dashboard.analytics.shares >= 1000 ? `${(dashboard.analytics.shares / 1000).toFixed(1)}K` : String(dashboard.analytics.shares), change: "Requires platform insights", icon: Share2 },
    { label: "CTR", value: `${dashboard.analytics.ctr.toFixed(1)}%`, change: "Auto-calculated", icon: MousePointer },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track your social media performance
          <Badge variant="secondary" className="ml-2 text-[10px]">Live Analytics</Badge>
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicMetrics.map((m) => (
          <div key={m.label} className="kpi-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{m.label}</span>
              <m.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold">{m.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.change}</p>
          </div>
        ))}
      </div>

      {hasData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dashboard.engagementTrends.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Growth Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={dashboard.engagementTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                      <Line type="monotone" dataKey="posts" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {dashboard.platformComparison.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Platform Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={dashboard.platformComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                      <Bar dataKey="posts" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {dashboard.topPosts.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Top Performing Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboard.topPosts.map((post) => (
                    <div key={`${post.rank}-${post.title}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-muted-foreground w-5">{post.rank}</span>
                        <div>
                          <p className="text-sm font-medium">{post.title || "Scheduled post"}</p>
                          <p className="text-xs text-muted-foreground">{formatPlatformLabel(post)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "--"}</p>
                      </div>
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
