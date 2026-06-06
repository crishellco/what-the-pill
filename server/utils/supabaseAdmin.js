import ws from 'ws'
import { createClient } from '@supabase/supabase-js'

let adminClient = null

export function useSupabaseAdmin() {
  if (adminClient) return adminClient

  const config = useRuntimeConfig()
  const url = process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = config.supabaseServiceKey

  if (!url || !key) return null

  adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws }
  })

  return adminClient
}
