import { useRef, useState } from "react";
import { Instagram, Facebook, Linkedin, Twitter, Image, Sparkles, Send, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { notifyPostsUpdated } from "@/lib/postEvents";

const platforms = [
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "facebook", label: "Facebook", icon: Facebook },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  { id: "twitter", label: "Twitter/X", icon: Twitter },
];

const suggestedHashtags = [
  "#socialmedia", "#marketing", "#digitalmarketing", "#contentcreator",
  "#branding", "#growthhacking", "#startup", "#entrepreneur",
];

export default function SchedulePost() {
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState<string[]>(["instagram"]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [submitAction, setSubmitAction] = useState<"schedule" | "draft" | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const ALLOWED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "image/heic",
    "image/heif",
    "video/mp4",
  ];
  const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic", ".heif", ".mp4"];

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;

    const accepted: File[] = [];
    const rejected: string[] = [];

    Array.from(incoming).forEach((file) => {
      const lowerName = file.name.toLowerCase();
      const matchesExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
      if (!ALLOWED_TYPES.includes(file.type) && !matchesExt) {
        rejected.push(`${file.name} (unsupported type)`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} (exceeds 50MB)`);
        return;
      }
      accepted.push(file);
    });

    if (accepted.length > 0) {
      setMediaFiles((prev) => {
        const existing = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`));
        const next = [...prev];
        accepted.forEach((f) => {
          const key = `${f.name}-${f.size}-${f.lastModified}`;
          if (!existing.has(key)) next.push(f);
        });
        return next;
      });
      toast.success(`${accepted.length} file(s) selected`);
    }

    if (rejected.length > 0) {
      toast.error(`Some files were skipped: ${rejected.slice(0, 2).join(", ")}${rejected.length > 2 ? "..." : ""}`);
    }
  };

  const removeFile = (idx: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const togglePlatform = (id: string) => {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const handleSchedule = async () => {
    if (!content.trim()) {
      const msg = "Please write your post content";
      setStatusType("error");
      setStatusMessage(msg);
      toast.error(msg);
      return;
    }
    if (selected.length === 0) {
      const msg = "Select at least one platform";
      setStatusType("error");
      setStatusMessage(msg);
      toast.error(msg);
      return;
    }
    if (!date || !time) {
      const msg = "Select schedule date and time";
      setStatusType("error");
      setStatusMessage(msg);
      toast.error(msg);
      return;
    }
    try {
      setSubmitAction("schedule");
      setStatusType("");
      setStatusMessage("Scheduling post...");
      const formData = new FormData();
      formData.append("content", content);
      formData.append("platforms", JSON.stringify(selected));
      formData.append("date", date);
      formData.append("time", time);
      formData.append("status", "scheduled");
      mediaFiles.forEach((file) => formData.append("media", file));

      await api("/api/posts", {
        method: "POST",
        body: formData,
        timeoutMs: 120000,
      });
      notifyPostsUpdated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to schedule post";
      setStatusType("error");
      setStatusMessage(msg);
      toast.error(msg);
      return;
    } finally {
      setSubmitAction(null);
    }

    setStatusType("success");
    setStatusMessage("Post has been successfully posted");
    toast.success("Post has been successfully posted", {
      description: `Scheduled to ${selected.length} platform(s)${mediaFiles.length ? ` with ${mediaFiles.length} file(s)` : ""}`,
    });
    setContent("");
    setDate("");
    setTime("");
    setMediaFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      const msg = "Please add post content before saving";
      setStatusType("error");
      setStatusMessage(msg);
      toast.error(msg);
      return;
    }
    try {
      setSubmitAction("draft");
      setStatusType("");
      setStatusMessage("Saving draft...");
      const formData = new FormData();
      formData.append("content", content);
      formData.append("platforms", JSON.stringify(selected.length ? selected : ["instagram"]));
      formData.append("date", date || new Date().toISOString().slice(0, 10));
      formData.append("time", time || "10:00");
      formData.append("status", "draft");
      mediaFiles.forEach((file) => formData.append("media", file));

      await api("/api/posts", {
        method: "POST",
        body: formData,
        timeoutMs: 120000,
      });
      notifyPostsUpdated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save draft";
      setStatusType("error");
      setStatusMessage(msg);
      toast.error(msg);
      return;
    } finally {
      setSubmitAction(null);
    }

    setStatusType("success");
    setStatusMessage("Draft saved");
    toast.success("Draft saved");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Schedule Post</h1>
        <p className="text-sm text-muted-foreground">Create and schedule your social media content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Post Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Write your post content here..."
                className="min-h-[160px] resize-none text-sm"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2200}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{content.length}/2,200 characters</span>
                <div className="flex gap-2">
                  {["😀", "🔥", "💡", "🎯", "✨", "📸"].map((e) => (
                    <button key={e} className="text-lg hover:scale-125 transition-transform" onClick={() => setContent((p) => p + e)}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/heic,image/heif,video/mp4"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />

              <div
                className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  addFiles(e.dataTransfer.files);
                }}
              >
                <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click or drag to upload media</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF, MP4 up to 50MB</p>
              </div>

              {mediaFiles.length > 0 && (
                <div className="space-y-2">
                  {mediaFiles.map((file, idx) => (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                      <span className="truncate pr-2">
                        {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
                      </span>
                      <button
                        type="button"
                        className="text-destructive hover:underline"
                        onClick={() => removeFile(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                      selected.includes(p.id)
                        ? "border-primary bg-accent text-accent-foreground shadow-sm"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <p.icon className="h-4 w-4" />
                    {p.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11" />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="gap-2 flex-1" onClick={handleSaveDraft} disabled={submitAction !== null}>
              <Save className="h-4 w-4" /> {submitAction === "draft" ? "Saving Draft..." : "Save Draft"}
            </Button>
            <Button type="button" variant="gradient" className="gap-2 flex-1" onClick={handleSchedule} disabled={submitAction !== null}>
              <Send className="h-4 w-4" /> {submitAction === "schedule" ? "Scheduling..." : "Schedule Post"}
            </Button>
          </div>
          {statusMessage && (
            <p className={`text-sm ${statusType === "error" ? "text-destructive" : statusType === "success" ? "text-success" : "text-muted-foreground"}`}>
              {statusMessage}
            </p>
          )}
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI Hashtag Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {suggestedHashtags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-accent transition-colors text-xs"
                    onClick={() => setContent((p) => p + " " + tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4 gap-1.5 text-xs" onClick={() => toast.success("More hashtags generated")}>
                <Sparkles className="h-3 w-3" /> Generate More
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
