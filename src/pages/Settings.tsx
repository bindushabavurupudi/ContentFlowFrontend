import { useEffect, useState } from "react";
import { User, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Settings() {
  const {
    user,
    updateProfile,
    autoLogoutEnabled,
    setAutoLogoutEnabled,
    twoFactorEnabled,
    setTwoFactorEnabled,
    notificationSettings,
    setNotificationSettings,
  } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [notifications, setNotifications] = useState(notificationSettings);
  const [isSaving, setIsSaving] = useState(false);
  const profileInitial = user?.name?.trim()?.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setNotifications(notificationSettings);
  }, [user?.name, user?.email, notificationSettings]);

  const persistNotifications = async (next: typeof notificationSettings) => {
    setNotifications(next);
    try {
      await setNotificationSettings(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update notifications");
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      toast.error("Name is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      toast.error("Please enter a valid email");
      return;
    }

    const currentName = user?.name?.trim() ?? "";
    const currentEmail = user?.email?.trim().toLowerCase() ?? "";
    if (trimmedName === currentName && trimmedEmail.toLowerCase() === currentEmail) {
      toast.info("No changes to save");
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile(trimmedName, trimmedEmail);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full btn-gradient flex items-center justify-center text-xl font-bold text-primary-foreground">
              {profileInitial}
            </div>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          </div>
          <Button variant="gradient" size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm">Email notifications</span>
            <Switch checked={notifications.email} onCheckedChange={(v) => persistNotifications({ ...notifications, email: v })} />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm">Push notifications</span>
            <Switch checked={notifications.push} onCheckedChange={(v) => persistNotifications({ ...notifications, push: v })} />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm">Weekly digest</span>
            <Switch checked={notifications.digest} onCheckedChange={(v) => persistNotifications({ ...notifications, digest: v })} />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm">Engagement alerts</span>
            <Switch checked={notifications.alerts} onCheckedChange={(v) => persistNotifications({ ...notifications, alerts: v })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={async (v) => {
              try {
                await setTwoFactorEnabled(v);
                toast.success(v ? "Two-factor enabled" : "Two-factor disabled");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to update 2FA");
              }
            }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-logout after inactivity</p>
              <p className="text-xs text-muted-foreground">Log out after 30 minutes of inactivity</p>
            </div>
            <Switch checked={autoLogoutEnabled} onCheckedChange={async (v) => {
              try {
                await setAutoLogoutEnabled(v);
                toast.success(v ? "Auto-logout enabled" : "Auto-logout disabled");
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to update auto-logout");
              }
            }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
