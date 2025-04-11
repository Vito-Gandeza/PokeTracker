import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';
import GoBackButton from '@/components/go-back-button';

export default function Custom500() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">500 - Server Error</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We're sorry, but something went wrong on our server. Please try again later or contact support if the problem persists.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <GoBackButton className="flex items-center gap-2">
            Go Back
          </GoBackButton>
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
