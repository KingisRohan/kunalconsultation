/**
 * Runtime configuration. All values come from environment variables.
 * With nothing set, the app runs in demo mode against local seed data.
 */

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isDemoMode = !supabaseUrl || !supabaseAnonKey
