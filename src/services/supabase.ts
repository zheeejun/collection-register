import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

let client: SupabaseClient | null = null
let configurationError = Boolean(url || key) && !(url && key)
if (url && key) {
  try { client = createClient(url, key) }
  catch { configurationError = true }
}
export const cloudConfigured = Boolean(client)
export const cloudConfigurationIncomplete = configurationError
export const supabase = client

export function authRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`
}
