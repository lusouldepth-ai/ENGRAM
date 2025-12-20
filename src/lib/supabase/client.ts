import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isSupabaseConfigured =
    supabaseUrl &&
    supabaseUrl !== 'your_supabase_url' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your_supabase_anon_key';

  if (!isSupabaseConfigured) {
    return createBrowserClient<Database>(
      "https://placeholder.supabase.co",
      "placeholder"
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

