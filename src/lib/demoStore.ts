import { api } from "@/lib/api";

export interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  date: string;
  time: string;
  status: "scheduled" | "draft";
  createdAt: string;
}

export interface DemoAnalytics {
  likes: number;
  comments: number;
  shares: number;
  ctr: number;
  totalScheduled: number;
}

export const addPost = async (post: Omit<ScheduledPost, "id" | "createdAt">) => {
  const response = await api<{ post: ScheduledPost }>("/api/posts", {
    method: "POST",
    body: JSON.stringify(post),
  });
  return response.post;
};

export const bulkSchedulePosts = async (
  rows: Array<{ content: string; platform?: string; platforms?: string[]; date: string; time?: string }>,
) => {
  const created: ScheduledPost[] = [];
  for (const row of rows) {
    const post = await addPost({
      content: row.content,
      platforms: Array.isArray(row.platforms) ? row.platforms : [String(row.platform || "instagram").toLowerCase()],
      date: row.date,
      time: row.time || "10:00",
      status: "scheduled",
    });
    created.push(post);
  }
  return created;
};

export const readAnalytics = async (): Promise<DemoAnalytics> => {
  const response = await api<{ analytics: DemoAnalytics }>("/api/analytics");
  return response.analytics;
};
