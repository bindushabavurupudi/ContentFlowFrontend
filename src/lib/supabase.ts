import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env vars: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Update Frontend/.env and restart Vite.",
  );
}

try {
  new URL(supabaseUrl);
} catch {
  throw new Error(`Invalid VITE_SUPABASE_URL: "${supabaseUrl}"`);
}

export const supabaseRuntimeInfo = {
  url: supabaseUrl,
  anonKeyPresent: Boolean(supabaseAnonKey),
  mode: import.meta.env.MODE,
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
