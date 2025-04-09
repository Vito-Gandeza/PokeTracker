import { createBrowserClient } from '@supabase/ssr'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Verify environment variables
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Missing Supabase environment variables. Authentication may not work properly.')
}

// Create a browser client (singleton with better handling for SPA navigation)
let browserClient: ReturnType<typeof createBrowserClient> | null = null

// Create a browser client with proper configuration
export const createClient = () => {
  // Always create a new client in development to avoid stale connections
  if (process.env.NODE_ENV === 'development') {
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }

  // In production, use singleton pattern but with proper configuration
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }

  return browserClient
}

// Export default client for backward compatibility
export default createClient()