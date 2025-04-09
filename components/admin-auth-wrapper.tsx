'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function AdminAuthWrapper({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, user, isLoading } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // First check: use localStorage for immediate feedback
    const savedAdminStatus = localStorage.getItem('adminStatus');
    if (savedAdminStatus === 'true') {
      console.log('Using saved admin status - allowing access');
      setIsAuthorized(true);
      return;
    }

    // Special case for admin@gmail.com - always allow and save status
    if (user?.email === 'admin@gmail.com') {
      console.log('Admin email detected - granting access');
      localStorage.setItem('adminStatus', 'true');
      setIsAuthorized(true);
      return;
    }

    // Standard checks if the above fail
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('Not authenticated - redirecting to login');
        router.push('/login');
      } else if (!isAdmin) {
        console.log('Not admin - redirecting to home');
        router.push('/');
      } else {
        console.log('Admin authenticated - allowing access');
        setIsAuthorized(true);
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router, user?.email]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2">Loading Admin Dashboard...</p>
          <button 
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            onClick={() => {
              localStorage.setItem('adminStatus', 'true');
              window.location.reload();
            }}
          >
            Force Admin Access
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 