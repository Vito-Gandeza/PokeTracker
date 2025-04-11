import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Verify environment variables
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Missing Supabase environment variables. Authentication may not work properly.')
}

// Create a browser client (singleton with better handling for SPA navigation)
let browserClient: ReturnType<typeof createBrowserClient> | null = null

// Maximum number of retries for failed requests
const MAX_RETRIES = 3
// Base delay in milliseconds (will be multiplied by 2^retryCount)
const BASE_DELAY = 300
// Timeout for requests in milliseconds (10 seconds)
const REQUEST_TIMEOUT = 10000

/**
 * Wrapper for Supabase queries with retry logic and timeout
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let retries = 0
  
  while (true) {
    try {
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
      })
      
      // Race between the actual query and the timeout
      return await Promise.race([queryFn(), timeoutPromise]) as T
    } catch (error) {
      retries++
      console.warn(`Supabase query failed (attempt ${retries}/${maxRetries}):`, error)
      
      // If we've reached max retries, throw the error
      if (retries >= maxRetries) {
        throw error
      }
      
      // Exponential backoff
      const delay = BASE_DELAY * Math.pow(2, retries)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Create a browser client with proper configuration
export const createClient = () => {
  // Always create a new client in development to avoid stale connections
  if (process.env.NODE_ENV === 'development') {
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        fetch: customFetch
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
      },
      global: {
        fetch: customFetch
      }
    })
  }

  return browserClient
}

// Custom fetch implementation with timeout
function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  
  const fetchPromise = fetch(input, {
    ...init,
    signal: controller.signal
  })
  
  return fetchPromise.finally(() => clearTimeout(timeoutId))
}

// Export default client for backward compatibility
export default createClient()
