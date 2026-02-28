import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Instagram, Facebook, Linkedin, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { subscribePostsUpdated } from "@/lib/postEvents";

const platformIcons: Record<string, typeof Instagram> = {
  instagram: Instagram, facebook: Facebook, linkedin: Linkedin, twitter: Twitter,
};
const platformColors: Record<string, string> = {
  instagram: "bg-chart-5/10 text-chart-5", facebook: "bg-primary/10 text-primary",
  linkedin: "bg-chart-1/10 text-chart-1", twitter: "bg-foreground/10 text-foreground",
};

interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  date: string;
  time: string;
  status: "scheduled" | "draft";
}

interface CalendarEvent {
  id: string;
  postId: string;
  day: number;
  date: string;
  title: string;
  platform: string;
  time: string;
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ContentCalendar() {
  const NOTE_STORAGE_KEY = "content-calendar-notes-v1";
  const [month, setMonth] = useState(new Date());
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [activePlatforms, setActivePlatforms] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [draftNote, setDraftNote] = useState("");

  const monthEvents = useMemo<CalendarEvent[]>(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const entries: CalendarEvent[] = [];

    posts.forEach((post) => {
      if (post.status !== "scheduled") return;
      const parsed = new Date(`${post.date}T${post.time || "00:00"}:00`);
      if (Number.isNaN(parsed.getTime())) return;
      if (parsed.getFullYear() !== year || parsed.getMonth() !== monthIndex) return;

      const eventPlatforms = Array.isArray(post.platforms) && post.platforms.length > 0 ? post.platforms : ["instagram"];
      eventPlatforms.forEach((platform, index) => {
        entries.push({
          id: `${post.id}-${platform}-${index}`,
          postId: post.id,
          day: parsed.getDate(),
          date: post.date,
          title: (post.content || "Scheduled post").slice(0, 60),
          platform,
          time: post.time || "00:00",
        });
      });
    });

    return entries.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.time.localeCompare(b.time);
    });
  }, [posts, month]);

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === month.getFullYear() && now.getMonth() === month.getMonth();
  const today = now.getDate();
  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  const filteredEvents = useMemo(
    () =>
      activePlatforms.length === 0
        ? monthEvents
        : monthEvents.filter((e) => activePlatforms.includes(e.platform)),
    [monthEvents, activePlatforms],
  );

  const selectedEvent = monthEvents.find((e) => e.id === selectedId) ?? null;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NOTE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, string>;
      setNotes(parsed || {});
    } catch {
      setNotes({});
    }
  }, []);

  useEffect(() => {
    if (!selectedEvent) {
      setDraftNote("");
      return;
    }
    setDraftNote(notes[selectedEvent.postId] || "");
  }, [selectedEvent, notes]);

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

  const togglePlatformFilter = (key: string) => {
    setActivePlatforms((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const conflictCount = useMemo(() => {
    const bucket = new Set<string>();
    let conflicts = 0;
    monthEvents.forEach((e) => {
      const k = `${e.date}-${e.time}`;
      if (bucket.has(k)) conflicts += 1;
      bucket.add(k);
    });
    return conflicts;
  }, [monthEvents]);

  const saveNote = () => {
    if (!selectedEvent) return;
    const next = {
      ...notes,
      [selectedEvent.postId]: draftNote.trim(),
    };
    setNotes(next);
    window.localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          <p className="text-sm text-muted-foreground">Plan and visualize your content schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-semibold min-w-[140px] text-center">
            {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Filter:</span>
            {Object.entries(platformIcons).map(([key, Icon]) => (
              <Badge
                key={key}
                variant={activePlatforms.includes(key) ? "default" : "secondary"}
                className={`gap-1 cursor-pointer transition-all border ${
                  activePlatforms.includes(key)
                    ? `${platformColors[key]} ring-1 ring-primary/40 shadow-sm`
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                onClick={() => togglePlatformFilter(key)}
                aria-pressed={activePlatforms.includes(key)}
              >
                <Icon className="h-3 w-3" /> {key}
              </Badge>
            ))}
            <Badge variant="secondary" className="ml-auto cursor-pointer" onClick={() => setPreviewMode((p) => !p)}>
              {previewMode ? "Preview ON" : "Preview OFF"}
            </Badge>
            <Badge variant="secondary" className={conflictCount > 0 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}>
              {conflictCount > 0 ? `${conflictCount} conflicts` : "No conflicts"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {daysOfWeek.map((d) => (
              <div key={d} className="bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
            ))}
            {days.map((day, i) => {
              const dayEvents = day ? filteredEvents.filter((e) => e.day === day) : [];
              return (
                <div
                  key={i}
                  className={`bg-card min-h-[100px] p-1.5 ${!day ? "bg-muted/30" : ""} ${isCurrentMonth && day === today ? "ring-2 ring-primary/30 ring-inset" : ""}`}
                >
                  {day && (
                    <>
                      <span className={`text-xs font-medium ${isCurrentMonth && day === today ? "text-primary font-bold" : "text-muted-foreground"}`}>{day}</span>
                      <div className="mt-1 space-y-0.5 max-h-24 overflow-y-auto pr-0.5">
                        {dayEvents.map((ev) => {
                          const Icon = platformIcons[ev.platform] || Instagram;
                          return (
                            <div
                              key={ev.id}
                              className={`flex items-center gap-1 p-1 rounded text-[10px] leading-tight cursor-pointer card-hover ${platformColors[ev.platform]}`}
                              onClick={() => setSelectedId(ev.id)}
                            >
                              <Icon className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{previewMode ? `${ev.title} (${ev.platform})` : ev.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedEvent)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scheduled Post</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3">
              <p className="text-sm font-medium">{selectedEvent.title}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{selectedEvent.platform}</Badge>
                <span>{selectedEvent.date}</span>
                <span>{selectedEvent.time}</span>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Campaign Note</p>
                <Textarea
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="Add note for milestones, approvals, or reminders..."
                  className="min-h-[90px]"
                />
                <Button variant="outline" size="sm" onClick={saveNote}>Save Note</Button>
              </div>
            </div>
          )}
          <Button variant="outline" onClick={() => setSelectedId(null)}>Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
