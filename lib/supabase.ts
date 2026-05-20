import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const getSupabaseConfig = () => {
  const clean = (val: string | undefined) => {
    let s = (val || '').trim().replace(/^['"]|['"]$/g, '')
    // Remove trailing slashes
    s = s.replace(/\/+$/, '')
    // Common user error: pasting the full API path
    s = s.replace(/\/(rest|auth)\/v\d+$/, '')
    return s
  }
  const rawUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const rawKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const isConfigured = rawUrl.length > 0 && 
                      rawKey.length > 0 && 
                      !rawUrl.includes('placeholder') && 
                      !rawUrl.includes('your-project-id')

  let url = rawUrl
  if (url.length > 0) {
    if (!url.startsWith('http')) {
      url = `https://${url}`
    }
  } else {
    url = 'https://placeholder.supabase.co'
  }

  return {
    url,
    key: rawKey || 'placeholder',
    isConfigured
  }
}

let supabaseInstance: SupabaseClient | null = null
let isUsingPlaceholder = true

const getSupabaseInstance = () => {
    const config = getSupabaseConfig()
    
    // In AI Studio, we sometimes start with placeholders.
    // Re-initialize if we now have a real configuration but were using a placeholder or haven't started.
    if (!supabaseInstance || (config.isConfigured && isUsingPlaceholder)) {
        supabaseInstance = createClient(config.url, config.key)
        isUsingPlaceholder = !config.isConfigured
    }
    
    return supabaseInstance
}

// Export a proxy as 'supabase' so all existing imports use the getter automatically
export const supabase = new Proxy({} as SupabaseClient, {
    get: (target, prop, receiver) => {
        const instance = getSupabaseInstance()
        return Reflect.get(instance, prop, receiver)
    }
})
