import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidSupabaseUrl = (value) => {
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.host)
  } catch {
    return false
  }
}

export const supabaseConfigurationError = !supabaseUrl || !supabaseAnonKey
  ? 'OAuth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  : !isValidSupabaseUrl(supabaseUrl)
    ? 'VITE_SUPABASE_URL must be a complete HTTP or HTTPS URL, such as https://your-project-ref.supabase.co.'
    : ''

export const supabase = !supabaseConfigurationError
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
