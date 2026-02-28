import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  name: string;
  role: "member";
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  digest: boolean;
  alerts: boolean;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  role: "admin" | "team" | null;
  auto_logout_enabled: boolean | null;
  two_factor_enabled: boolean | null;
  notifications: NotificationSettings | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
  autoLogoutEnabled: boolean;
  setAutoLogoutEnabled: (enabled: boolean) => Promise<void>;
  twoFactorEnabled: boolean;
  setTwoFactorEnabled: (enabled: boolean) => Promise<void>;
  notificationSettings: NotificationSettings;
  setNotificationSettings: (settings: NotificationSettings) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  email: true,
  push: true,
  digest: false,
  alerts: true,
};

const DEFAULT_APP_ROLE: User["role"] = "member";
const DEFAULT_PROFILE_ROLE: NonNullable<ProfileRow["role"]> = "team";
const SIGN_OUT_TIMEOUT_MS = 5000;
const AUTH_INIT_TIMEOUT_MS = 2000;

const clearSupabaseSessionArtifacts = () => {
  const storages: Storage[] = [];
  if (typeof window !== "undefined") {
    storages.push(window.localStorage, window.sessionStorage);
  }

  for (const storage of storages) {
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key) continue;
      if (
        key.includes("supabase.auth") ||
        key.includes("-auth-token") ||
        key.startsWith("sb-")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => storage.removeItem(key));
  }
};

const getDisplayName = (email: string, fullName?: string | null) => {
  if (fullName && fullName.trim()) return fullName.trim();
  return email.split("@")[0] || "User";
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoLogoutEnabled, setAutoLogoutState] = useState(false);
  const [twoFactorEnabled, setTwoFactorState] = useState(false);
  const [notificationSettings, setNotificationState] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  const applyAuthFallbackUser = (authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) => {
    const email = authUser.email || "";
    const metadataName = typeof authUser.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : null;
    setUser({
      id: authUser.id,
      email,
      name: getDisplayName(email, metadataName),
      role: DEFAULT_APP_ROLE,
    });
    setAutoLogoutState(false);
    setTwoFactorState(false);
    setNotificationState(DEFAULT_NOTIFICATION_SETTINGS);
  };

  const ensureProfile = async (authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) => {
    const email = authUser.email || "";
    const metadataName = typeof authUser.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : null;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, auto_logout_enabled, two_factor_enabled, notifications")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      applyAuthFallbackUser(authUser);
      return;
    }

    if (data) {
      const profile = data as ProfileRow;
      const normalizedNotifications = profile.notifications || DEFAULT_NOTIFICATION_SETTINGS;
      setUser({
        id: authUser.id,
        email,
        name: getDisplayName(email, profile.full_name ?? metadataName),
        role: DEFAULT_APP_ROLE,
      });
      setAutoLogoutState(Boolean(profile.auto_logout_enabled));
      setTwoFactorState(Boolean(profile.two_factor_enabled));
      setNotificationState({
        email: normalizedNotifications.email ?? DEFAULT_NOTIFICATION_SETTINGS.email,
        push: normalizedNotifications.push ?? DEFAULT_NOTIFICATION_SETTINGS.push,
        digest: normalizedNotifications.digest ?? DEFAULT_NOTIFICATION_SETTINGS.digest,
        alerts: normalizedNotifications.alerts ?? DEFAULT_NOTIFICATION_SETTINGS.alerts,
      });
      return;
    }

    const payload = {
      id: authUser.id,
      full_name: metadataName || getDisplayName(email),
      role: DEFAULT_PROFILE_ROLE,
      auto_logout_enabled: false,
      two_factor_enabled: false,
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert(payload)
      .select("id, full_name, role, auto_logout_enabled, two_factor_enabled, notifications")
      .single();

    if (insertError) {
      applyAuthFallbackUser(authUser);
      return;
    }

    const insertedProfile = inserted as ProfileRow;

    setUser({
      id: authUser.id,
      email,
      name: getDisplayName(email, insertedProfile.full_name),
      role: DEFAULT_APP_ROLE,
    });
    setAutoLogoutState(Boolean(insertedProfile.auto_logout_enabled));
    setTwoFactorState(Boolean(insertedProfile.two_factor_enabled));
    setNotificationState(insertedProfile.notifications || DEFAULT_NOTIFICATION_SETTINGS);
  };

  useEffect(() => {
    let isMounted = true;
    const loadingGuard = window.setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, AUTH_INIT_TIMEOUT_MS);

    const init = async () => {
      setIsLoading(true);
      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>((resolve) =>
            window.setTimeout(() => resolve({ data: { session: null } }), AUTH_INIT_TIMEOUT_MS),
          ),
        ]);
        const { data } = sessionResult;
        if (data.session?.user) {
          applyAuthFallbackUser(data.session.user);
          void ensureProfile(data.session.user).catch(() => undefined);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        applyAuthFallbackUser(session.user);
        void ensureProfile(session.user).catch(() => undefined);
      } else {
        setUser(null);
        setAutoLogoutState(false);
        setTwoFactorState(false);
        setNotificationState(DEFAULT_NOTIFICATION_SETTINGS);
      }
    });

    return () => {
      isMounted = false;
      window.clearTimeout(loadingGuard);
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: (name || "").trim(),
        },
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (!data.user) {
      throw new Error("No active session found. Please sign in again.");
    }
    applyAuthFallbackUser(data.user);
    void ensureProfile(data.user).catch(() => undefined);
  };

  const forgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "http://localhost:8081/update-password",
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const signOutLocalWithTimeout = Promise.race([
      supabase.auth.signOut({ scope: "local" }),
      new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("Local sign out timed out")), SIGN_OUT_TIMEOUT_MS),
      ),
    ]);
    try {
      // Always clear browser session first so UI cannot auto-login again.
      await signOutLocalWithTimeout;
    } catch {
      // Continue with local UI cleanup even if local sign-out errors.
    } finally {
      clearSupabaseSessionArtifacts();
      setUser(null);
      setAutoLogoutState(false);
      setTwoFactorState(false);
      setNotificationState(DEFAULT_NOTIFICATION_SETTINGS);
    }

    // Best effort: revoke sessions server-side when network is available.
    void supabase.auth.signOut({ scope: "global" }).catch(() => undefined);
  };

  const updateProfile = async (name: string, email: string) => {
    if (!user) throw new Error("You must be signed in");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const currentEmail = user.email.trim().toLowerCase();
    const shouldUpdateEmail = trimmedEmail !== currentEmail;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: trimmedName })
      .eq("id", user.id);
    if (profileError) throw profileError;

    // Reflect name changes in UI immediately after profile table update.
    setUser((prev) =>
      prev
        ? {
            ...prev,
            name: trimmedName,
            email: prev.email,
          }
        : prev,
    );

    if (!shouldUpdateEmail) {
      // Keep auth metadata aligned; do not block successful save on this best-effort call.
      void supabase.auth.updateUser({ data: { full_name: trimmedName } }).catch(() => undefined);
      return;
    }

    const emailUpdate = Promise.race([
      supabase.auth.updateUser({ email: trimmedEmail }),
      new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error("Email update timed out. Try again.")), 12000),
      ),
    ]);

    const { data, error } = await emailUpdate;
    if (error) {
      throw new Error(`Name saved, but email update failed: ${error.message}`);
    }

    setUser((prev) =>
      prev
        ? {
            ...prev,
            email: data.user?.email || prev.email,
          }
        : prev,
    );
  };

  const setAutoLogoutEnabled = async (enabled: boolean) => {
    if (!user) throw new Error("You must be signed in");
    const { error } = await supabase
      .from("profiles")
      .update({ auto_logout_enabled: enabled })
      .eq("id", user.id);
    if (error) throw error;
    setAutoLogoutState(enabled);
  };

  const setTwoFactorEnabled = async (enabled: boolean) => {
    if (!user) throw new Error("You must be signed in");
    const { error } = await supabase
      .from("profiles")
      .update({ two_factor_enabled: enabled })
      .eq("id", user.id);
    if (error) throw error;
    setTwoFactorState(enabled);
  };

  const setNotificationSettings = async (settings: NotificationSettings) => {
    if (!user) throw new Error("You must be signed in");
    const { error } = await supabase
      .from("profiles")
      .update({ notifications: settings })
      .eq("id", user.id);
    if (error) throw error;
    setNotificationState(settings);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signUp,
        signIn,
        forgotPassword,
        signOut,
        updateProfile,
        autoLogoutEnabled,
        setAutoLogoutEnabled,
        twoFactorEnabled,
        setTwoFactorEnabled,
        notificationSettings,
        setNotificationSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
