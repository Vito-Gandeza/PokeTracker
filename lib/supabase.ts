import { createBrowserClient } from '@supabase/ssr'

// Get environment variables
const supabaseUrl = 'https://znvwokdnmwbkuavsxqin.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpudndva2RubXdia3VhdnN4cWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzIzMDgsImV4cCI6MjA1OTA0ODMwOH0.b_eCyATar91JCAeE4CPjS3eNKoCclSVqTLPOW2UW-0Q'

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