import { createClient } from './supabase'

export interface UserProfile {
  id: string
  email: string
  is_admin: boolean
  created_at: string
  updated_at: string
  username?: string
  full_name?: string
  shipping_address?: string
  phone_number?: string
  avatar_url?: string
}

export const checkUserExists = async (email: string): Promise<UserProfile | null> => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) {
    console.error('Error checking user:', error)
    return null
  }

  return data as UserProfile
}

export const isUserAdmin = async (email: string): Promise<boolean> => {
  const user = await checkUserExists(email)
  return user?.is_admin || false
}

export const createUserProfile = async (email: string, isAdmin: boolean = false): Promise<UserProfile | null> => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email,
        is_admin: isAdmin,
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating user:', error)
    return null
  }

  return data as UserProfile
}