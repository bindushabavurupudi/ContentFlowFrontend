import { useEffect, useMemo, useState } from "react";
import { Lightbulb, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { subscribePostsUpdated } from "@/lib/postEvents";

interface ScheduledPost {
  id: string;
  content: string;
  status: "scheduled" | "draft";
}

const CATEGORY_DEFS = [
  { name: "Promotional", color: "hsl(var(--primary))", keywords: ["sale", "offer", "discount", "promo", "buy", "deal"] },
  { name: "Educational", color: "hsl(var(--chart-2))", keywords: ["tip", "learn", "guide", "how to", "tutorial", "explainer"] },
  { name: "Entertainment", color: "hsl(var(--chart-3))", keywords: ["fun", "meme", "story", "behind the scenes", "vibes"] },
  { name: "Engagement", color: "hsl(var(--chart-4))", keywords: ["poll", "question", "vote", "comment", "reply", "ask"] },
  { name: "Informational", color: "hsl(var(--chart-5))", keywords: [] },
];

export default function ContentCategories() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);

  useEffect(() => {
    const refresh = async () => {
      try {
        const data = await api<{ posts: ScheduledPost[] }>("/api/posts");
        setPosts(data.posts || []);
      } catch {
        setPosts([]);
      }
    };

    refresh();
    const unsubscribe = subscribePostsUpdated(refresh);
    window.addEventListener("focus", refresh);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const categories = useMemo(() => {
    const base = CATEGORY_DEFS.map((category) => ({ ...category, count: 0, value: 0 }));
    const scheduledPosts = posts.filter((post) => post.status === "scheduled");

    if (scheduledPosts.length === 0) {
      return base;
    }

    scheduledPosts.forEach((post) => {
      const content = String(post.content || "").toLowerCase();
      const matched = base.find((category) => category.keywords.some((keyword) => content.includes(keyword)));
      if (matched) {
        matched.count += 1;
      } else {
        base[base.length - 1].count += 1;
      }
    });

    return base.map((category) => ({
      ...category,
      value: Number(((category.count / scheduledPosts.length) * 100).toFixed(1)),
    }));
  }, [posts]);

  const recommendations = useMemo(() => {
    const total = categories.reduce((sum, category) => sum + category.count, 0);
    if (total === 0) {
      return [
        { text: "Start scheduling posts to unlock category insights", trend: "up", impact: "High" },
      ];
    }

    const sorted = [...categories].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    const lowest = sorted[sorted.length - 1];
    return [
      { text: `${top.name} is your strongest category, keep this momentum`, trend: "up", impact: "High" },
      { text: `Increase ${lowest.name} posts for a more balanced mix`, trend: "up", impact: "Medium" },
      { text: "Review monthly mix after each campaign to avoid content fatigue", trend: "down", impact: "Medium" },
    ];
  }, [categories]);

  const generateIdea = () => {
    const ideas = [
      "Create a 30-second educational reel explaining one scheduling hack.",
      "Publish a behind-the-scenes team workflow carousel.",
      "Post a customer success story with measurable results.",
      "Run a quick engagement poll around posting frequency.",
    ];
    toast.success("Weekly planning assistant", { description: ideas[Math.floor(Math.random() * ideas.length)] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Categories</h1>
          <p className="text-sm text-muted-foreground">AI-powered content strategy insights</p>
        </div>
        <Button variant="gradient" className="gap-1.5" onClick={generateIdea}><Sparkles className="h-4 w-4" /> Generate Post Idea</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Content Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categories} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" stroke="none">
                  {categories.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {categories.map((c) => (
                <div key={c.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span>{c.name} ({c.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Smart Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-all cursor-pointer" onClick={() => toast.info("Recommendation queued for weekly plan")}>
                {r.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-warning shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{r.text}</p>
                  <p className="text-xs text-muted-foreground">Impact: {r.impact}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
