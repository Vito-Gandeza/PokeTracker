import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://znvwokdnmwbkuavsxqin.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpudndva2RubXdia3VhdnN4cWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NzIzMDgsImV4cCI6MjA1OTA0ODMwOH0.b_eCyATar91JCAeE4CPjS3eNKoCclSVqTLPOW2UW-0Q';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpudndva2RubXdia3VhdnN4cWluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzQ3MjMwOCwiZXhwIjoyMDU5MDQ4MzA4fQ.UpqfFOgyzSLPrZDe_XQnYV6sUpx2G5EKAA86mD_c5Ns';

// Create a singleton instance of the main client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    }
});

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export type AuthUser = User;
export type AuthSession = Session;

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
  username?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  user: AuthUser | null;
  session: AuthSession | null;
  error: AuthError | null;
}

// Create a service role client for admin operations that bypass RLS
// This client should ONLY be used server-side or in admin-specific functions
const createServiceClient = () => {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      flowType: 'pkce'
    }
  });
};

/**
 * Sign up a new user with email and password
 */
export async function signUp({ email, password, fullName, username }: SignUpCredentials): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username,
        },
      },
    });
    
    return {
      user: data?.user || null,
      session: data?.session || null,
      error,
    };
  } catch (err) {
    console.error('Signup error:', err);
    return {
      user: null,
      session: null,
      error: err as AuthError,
    };
  }
}

/**
 * Log in a user with email and password
 */
export async function login({ email, password }: LoginCredentials): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return {
      user: data?.user || null,
      session: data?.session || null,
      error,
    };
  } catch (err) {
    console.error('Login error:', err);
    return {
      user: null,
      session: null,
      error: err as AuthError,
    };
  }
}

/**
 * Log out the current user
 */
export async function logout(): Promise<{ error: AuthError | null }> {
  console.log('DEBUG: Logout function in auth.ts called');
  try {
    // First, manually check if we have a session to log out from
    const session = await getCurrentSession();
    console.log('DEBUG: Current session before logout:', session ? 'exists' : 'none');
    
    // Then call Supabase signOut
    const { error } = await supabase.auth.signOut({ 
      scope: 'global' // This will clear all sessions across all tabs/devices
    });
    
    if (error) {
      console.error('DEBUG: Supabase signOut error:', error);
    } else {
      console.log('DEBUG: Supabase signOut successful');
    }
    
    return { error };
  } catch (err) {
    console.error('Logout error:', err);
    return { error: err as AuthError };
  }
}

/**
 * Get the current session
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch (err) {
    console.error('Get session error:', err);
    return null;
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (err) {
    console.error('Get user error:', err);
    return null;
  }
}

/**
 * Get the user's profile including role
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Get profile error:', err);
    return null;
  }
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.is_admin === true;
}

/**
 * Get admin status directly from JWT claims (no database query)
 * This is a workaround for RLS recursion issues
 */
export async function getAdminStatusFromClaims(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    
    if (!user) return false;
    
    // Check app_metadata for admin claims
    return user.app_metadata?.is_admin === true;
  } catch (err) {
    console.error('Error checking admin claims:', err);
    return false;
  }
}

/**
 * Check if a specific user is admin by using direct SQL (bypasses RLS)
 * Only use this as a fallback when other methods fail
 */
export async function checkAdminStatusDirect(userId: string): Promise<boolean> {
  try {
    // Create a temporary client with the service role key
    const serviceClient = createServiceClient();
    
    if (!serviceClient) {
      console.error('Could not create service client - missing credentials');
      return false;
    }
    
    // This query bypasses RLS
    const { data, error } = await serviceClient
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error in direct admin check:', error);
      return false;
    }
    
    return data?.is_admin === true;
  } catch (err) {
    console.error('Error in direct admin check:', err);
    return false;
  }
}

/**
 * Set admin claims in JWT for a user
 * This ensures admin status persists in the JWT token
 */
export async function setAdminClaims(userId: string, isAdmin: boolean): Promise<boolean> {
  try {
    // Custom claims must be set from server-side admin API
    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      {
        app_metadata: { 
          role: isAdmin ? 'admin' : 'user',
          is_admin: isAdmin
        }
      }
    );

    if (error) {
      console.error('Error setting admin claims:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Set admin claims error:', err);
    return false;
  }
}

/**
 * Setup session change listener
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((_, session) => {
    callback(session);
  });
} 