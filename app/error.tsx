'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home } from 'lucide-react';
import ClientButton from '@/components/client-button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We're sorry, but there was an error loading this page. You can try refreshing the page or going back to the home page.
        </p>

        {/* Error details for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded text-left overflow-auto max-h-32 text-sm">
            <p className="font-mono">{error.message}</p>
            {error.stack && (
              <pre className="mt-2 text-xs text-red-700 dark:text-red-300">
                {error.stack.split('\n').slice(0, 3).join('\n')}
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <ClientButton onClick={reset}>
            Try Again
          </ClientButton>
          <Button asChild className="flex items-center gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
