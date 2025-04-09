'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from './supabase';
import { checkUserExists, createUserProfile, isUserAdmin, type UserProfile } from './auth-helpers';
import { AuthError, Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  userProfile: UserProfile | null;
  user: User | null; // Add Supabase user object
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  userProfile: null,
  user: null,
  signIn: async () => ({}),
  signUp: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const profile = await checkUserExists(session.user.email!);
          if (profile) {
            setUserProfile(profile);
            setIsAdmin(profile.is_admin);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      if (session?.user) {
        setUser(session.user);
        const profile = await checkUserExists(session.user.email!);
        if (profile) {
          setUserProfile(profile);
          setIsAdmin(profile.is_admin);
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.user) {
        return { error: 'No user returned from sign in' };
      }

      const profile = await checkUserExists(email);

      if (!profile) {
        return { error: 'User profile not found' };
      }

      setUserProfile(profile);
      setIsAdmin(profile.is_admin);
      setIsAuthenticated(true);
      return {};
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Create user profile in our database
      const profile = await createUserProfile(email);
      if (!profile) {
        throw new Error('Failed to create user profile');
      }

      setUserProfile(profile);
      setIsAdmin(profile.is_admin);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear all auth state first to prevent UI flashing
      setUser(null);
      setUserProfile(null);
      setIsAdmin(false);
      setIsAuthenticated(false);

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error in signOut:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        isAdmin,
        userProfile,
        user,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};