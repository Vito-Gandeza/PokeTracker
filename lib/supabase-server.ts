import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Verify environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Authentication may not work properly.')
}

// Create a server client
export const createServerSupabaseClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie errors
          }
        },
      },
    }
  )
}

// Create a service role client for admin operations
export const createServiceClient = () => {
  return createServerClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookies().set({ name, value, ...options })
          } catch (error) {
            // Handle cookie errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookies().set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie errors
          }
        },
      },
    }
  )
}