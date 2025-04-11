import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        <h2 className="text-xl font-medium">Loading...</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Please wait while we prepare your content
        </p>
      </div>
    </div>
  );
}
