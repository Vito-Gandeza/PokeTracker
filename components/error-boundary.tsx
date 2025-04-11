'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import client components to avoid SSR issues
const ClientButton = dynamic(() => import('./client-button'), { ssr: false });

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });

    // Log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);

    // You could also send this to a monitoring service like Sentry
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error);
    // }
  }

  private handleReload = (): void => {
    // Reload the page
    window.location.reload();
  };

  private handleRetry = (): void => {
    // Reset the error boundary state
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We're sorry, but there was an error loading this content. You can try reloading the page or going back to the home page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <ClientButton onClick={this.handleRetry}>
                Try Again
              </ClientButton>
              <ClientButton
                onClick={this.handleReload}
                variant="default"
              >
                Reload Page
              </ClientButton>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
