'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, userProfile } = useAuth();
  const router = useRouter();
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);

  // Add a safety timeout to prevent infinite loading
  useEffect(() => {
    // Only start the timeout if we're still loading
    if (isLoading) {
      const timer = setTimeout(() => {
        setTimeoutOccurred(true);
      }, 5000); // 5 seconds timeout

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    // Only check authorization after loading is complete or timeout occurred
    if (!isLoading || timeoutOccurred) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (requireAdmin && !isAdmin) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, requireAdmin, router, timeoutOccurred]);

  // Show loading spinner only during initial load
  if (isLoading && !timeoutOccurred) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2">Loading...</p>
          {timeoutOccurred && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-red-500">
                Loading is taking longer than expected.
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="text-sm"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="text-sm"
                >
                  Go to Home
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check authorization after loading
  if (!isAuthenticated || (requireAdmin && !isAdmin)) {
    return null; // Return null while redirect happens in useEffect
  }

  return <>{children}</>;
}

export default ProtectedRoute;