import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "./types";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isSupabaseConfigured =
    supabaseUrl &&
    supabaseUrl !== 'your_supabase_url' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your_supabase_anon_key';

  if (!isSupabaseConfigured) {
    // Return a dummy client for non-authenticated states to prevent local app crash
    return createServerClient<Database>(
      "https://placeholder.supabase.co",
      "placeholder",
      {
        cookies: {
          getAll() { return []; },
          setAll() { }
        }
      }
    );
  }

  const cookieStore = cookies();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

