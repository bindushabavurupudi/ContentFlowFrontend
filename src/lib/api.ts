import { supabase } from "@/lib/supabase";

type ApiRequestInit = RequestInit & {
  timeoutMs?: number;
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, code: string): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error(code)), timeoutMs);
  });
  return (await Promise.race([promise, timeoutPromise])) as T;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const resolveApiBaseUrl = () => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (configured) return trimTrailingSlash(configured);

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return `${window.location.protocol}//${host}:8082`;
  }

  return "";
};

const API_BASE_URL = resolveApiBaseUrl();

const readAccessTokenFromStorage = (): string | undefined => {
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as
        | { access_token?: string; currentSession?: { access_token?: string } }
        | Array<{ access_token?: string; currentSession?: { access_token?: string } }>;
      const candidate = Array.isArray(parsed) ? parsed[0] : parsed;
      const token = candidate?.access_token || candidate?.currentSession?.access_token;
      if (token) return token;
    }
  } catch {
    // Ignore malformed storage entries.
  }
  return undefined;
};

const readAccessToken = async (): Promise<string | undefined> => {
  const fromStorage = readAccessTokenFromStorage();
  if (fromStorage) return fromStorage;

  try {
    const { data } = await withTimeout(supabase.auth.getSession(), 1500, "session-timeout");
    if (data.session?.access_token) return data.session.access_token;
    await wait(120);
    const { data: secondTry } = await withTimeout(supabase.auth.getSession(), 1200, "session-timeout-retry");
    return secondTry.session?.access_token;
  } catch {
    return readAccessTokenFromStorage();
  }
};

const resolveAccessToken = async (): Promise<string | undefined> => {
  const first = await readAccessToken();
  if (first) return first;

  try {
    const { data, error } = await withTimeout(supabase.auth.refreshSession(), 1800, "refresh-timeout");
    if (!error && data.session?.access_token) return data.session.access_token;
  } catch {
    // Ignore and return undefined below.
  }

  await wait(120);
  return (await readAccessToken()) || readAccessTokenFromStorage();
};

export async function api<T>(path: string, options: ApiRequestInit = {}): Promise<T> {
  const { timeoutMs = 12000, ...fetchOptions } = options;
  try {
    const accessToken = await resolveAccessToken();
    if (!accessToken) {
      throw new Error("Session expired. Please sign in again");
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    const isFormData = fetchOptions.body instanceof FormData;
    const endpoint = path.startsWith("http://") || path.startsWith("https://")
      ? path
      : `${API_BASE_URL}${path}`;
    try {
      const res = await fetch(endpoint, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...(fetchOptions.headers || {}),
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data && data.error) || "Request failed");
      }
      return data as T;
    } finally {
      window.clearTimeout(timeout);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("API request timed out");
    }
    throw err;
  }
}
