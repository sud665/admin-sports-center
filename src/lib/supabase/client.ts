import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Fallback to placeholder values during SSR/build to avoid prerender errors.
  // The client is only used in "use client" components at runtime.
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
