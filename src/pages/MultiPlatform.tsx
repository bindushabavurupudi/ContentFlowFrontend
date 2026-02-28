import { useEffect, useState } from "react";
import { Instagram, Facebook, Linkedin, Twitter, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

type PlatformRow = {
  name: string;
  api: string;
  account: string;
  status: "connected" | "expired" | "disconnected";
  lastSync: string;
  rateLimit: string;
};

const iconByName: Record<string, typeof Instagram> = {
  Instagram,
  Facebook,
  LinkedIn: Linkedin,
  "Twitter/X": Twitter,
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  connected: { icon: CheckCircle2, color: "text-success", label: "Connected" },
  expired: { icon: AlertTriangle, color: "text-warning", label: "Token Expired" },
  disconnected: { icon: XCircle, color: "text-muted-foreground", label: "Not Connected" },
};

export default function MultiPlatform() {
  const [liveMode, setLiveMode] = useState(true);
  const [platforms, setPlatforms] = useState<PlatformRow[]>([]);
  const [oauthTarget, setOauthTarget] = useState<string | null>(null);

  const loadIntegrations = async () => {
    try {
      const data = await api<{ integrations: PlatformRow[] }>("/api/integrations");
      setPlatforms(data.integrations);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load integrations");
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const updateIntegration = async (name: string, action: "connect" | "reconnect" | "sync" | "disconnect") => {
    await api(`/api/integrations/${encodeURIComponent(name)}/${action}`, { method: "PATCH" });
    await loadIntegrations();
  };

  const handleSync = async (platformName: string) => {
    await updateIntegration(platformName, "sync");
    toast.success(`${platformName} synced`);
  };

  const handleDisconnect = async (platformName: string) => {
    await updateIntegration(platformName, "disconnect");
    toast.success(`${platformName} disconnected`);
  };

  const handleOauthConfirm = async () => {
    if (!oauthTarget) return;
    await updateIntegration(oauthTarget, "connect");
    toast.success(`${oauthTarget} connected successfully`);
    setOauthTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Multi-Platform Integration</h1>
          <p className="text-sm text-muted-foreground">Manage your connected social media accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Live API Mode</span>
          <Switch checked={liveMode} onCheckedChange={setLiveMode} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((p) => {
          const S = statusConfig[p.status];
          const Icon = iconByName[p.name] ?? Instagram;
          return (
            <Card key={p.name} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center">
                      <Icon className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">{p.api}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={`gap-1 ${S.color}`}>
                    <S.icon className="h-3 w-3" /> {S.label}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-medium">{p.account}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Last Sync</span><span>{p.lastSync}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rate Limit</span><span>{p.rateLimit}</span></div>
                </div>

                <div className="flex items-center gap-2">
                  {p.status === "connected" ? (
                    <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleSync(p.name)}><RefreshCw className="h-3 w-3" /> Sync</Button>
                  ) : p.status === "expired" ? (
                    <Button variant="gradient" size="sm" className="flex-1 gap-1" onClick={() => setOauthTarget(p.name)}><RefreshCw className="h-3 w-3" /> Reconnect</Button>
                  ) : (
                    <Button variant="gradient" size="sm" className="flex-1" onClick={() => setOauthTarget(p.name)}>Connect</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => (p.status === "connected" ? handleDisconnect(p.name) : toast.info("No active token to revoke"))}>
                    <Shield className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {liveMode && (
        <div className="rounded-lg bg-accent/50 border border-primary/20 p-4 text-center">
          <p className="text-sm text-accent-foreground">
            <span className="font-semibold">Live Local API</span> - Integration status is persisted in the backend.
          </p>
        </div>
      )}

      <Dialog open={Boolean(oauthTarget)} onOpenChange={(open) => !open && setOauthTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Authorize {oauthTarget}</DialogTitle>
            <DialogDescription>
              OAuth confirmation will complete account connection and store token state securely on the server.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium mb-1">Secure token storage</p>
            <p className="text-muted-foreground text-xs">Tokens are maintained server-side in the integration store.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOauthTarget(null)}>Cancel</Button>
            <Button variant="gradient" onClick={handleOauthConfirm}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
