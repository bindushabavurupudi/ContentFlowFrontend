import { useEffect, useState } from "react";
import { Users, Plus, MessageCircle, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api } from "@/lib/api";

const members = [
  { name: "Alex Johnson", role: "Admin", avatar: "AJ", status: "online" },
  { name: "Sarah Chen", role: "Content Lead", avatar: "SC", status: "online" },
  { name: "Mike Davis", role: "Designer", avatar: "MD", status: "away" },
  { name: "Emily Brown", role: "Copywriter", avatar: "EB", status: "offline" },
];

const tasks = [
  { id: "1", title: "Review Q1 campaign copy", assignee: "Sarah Chen", status: "in-review", priority: "high" },
  { id: "2", title: "Design Instagram carousel", assignee: "Mike Davis", status: "in-progress", priority: "medium" },
  { id: "3", title: "Write LinkedIn article draft", assignee: "Emily Brown", status: "todo", priority: "low" },
  { id: "4", title: "Approve Facebook ad creative", assignee: "Alex Johnson", status: "done", priority: "high" },
];

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  done: { icon: CheckCircle2, color: "text-success" },
  "in-progress": { icon: Clock, color: "text-primary" },
  "in-review": { icon: AlertCircle, color: "text-warning" },
  todo: { icon: Clock, color: "text-muted-foreground" },
};

export default function TeamCollaboration() {
  const [board, setBoard] = useState(tasks);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api<{ tasks: typeof tasks }>("/api/team/tasks");
        setBoard(data.tasks);
      } catch {
        // Keep defaults if backend data is not available
      }
    };
    load();
  }, []);

  const cycleStatus = (status: string) => {
    if (status === "todo") return "in-progress";
    if (status === "in-progress") return "in-review";
    if (status === "in-review") return "done";
    return "todo";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Collaboration</h1>
          <p className="text-sm text-muted-foreground">Manage your team and content workflow</p>
        </div>
        <Button variant="gradient" className="gap-1.5" onClick={() => toast.success("Invite link copied for new team member")}>
          <Plus className="h-4 w-4" /> Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Team Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map((m) => (
              <div key={m.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="relative">
                  <div className="h-9 w-9 rounded-full btn-gradient flex items-center justify-center text-xs font-semibold text-primary-foreground">{m.avatar}</div>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${m.status === "online" ? "bg-success" : m.status === "away" ? "bg-warning" : "bg-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> Task Board</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {board.map((t, i) => {
              const S = statusConfig[t.status];
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-all cursor-pointer"
                  onClick={async () => {
                    const next = cycleStatus(t.status);
                    setBoard((prev) => prev.map((task, idx) => (idx === i ? { ...task, status: next } : task)));
                    await api(`/api/team/tasks/${t.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: next }),
                    });
                  }}
                >
                  <div className="flex items-center gap-3">
                    <S.icon className={`h-4 w-4 ${S.color}`} />
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{t.assignee}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{t.status}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
