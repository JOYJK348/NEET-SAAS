'use client';

import { AlertCircle, RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'inline' | 'page';
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  onRetry,
  className,
  variant = 'default',
}: ErrorStateProps) {
  const variants = {
    default: 'flex flex-col items-center justify-center p-8 text-center',
    inline: 'flex flex-col items-center justify-center p-4 text-center',
    page: 'min-h-[400px] flex flex-col items-center justify-center p-8 text-center',
  };

  return (
    <div className={cn(variants[variant], className)} role="alert">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try Again
        </Button>
      )}
    </div>
  );
}

export function NotFoundState({
  title = 'Page not found',
  message = "The page you're looking for doesn't exist or has been moved.",
  onGoHome,
  className,
}: {
  title?: string;
  message?: string;
  onGoHome?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-h-[400px] flex flex-col items-center justify-center p-8 text-center',
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">{message}</p>
      {onGoHome && (
        <Button onClick={onGoHome} className="gap-2">
          <Home className="h-4 w-4" aria-hidden="true" />
          Go Home
        </Button>
      )}
    </div>
  );
}

export function ForbiddenState({
  title = 'Access denied',
  message = "You don't have permission to access this page.",
  onGoHome,
  className,
}: {
  title?: string;
  message?: string;
  onGoHome?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'min-h-[400px] flex flex-col items-center justify-center p-8 text-center',
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="h-12 w-12 text-red-500 mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-md">{message}</p>
      {onGoHome && (
        <Button onClick={onGoHome} className="gap-2">
          <Home className="h-4 w-4" aria-hidden="true" />
          Go Home
        </Button>
      )}
    </div>
  );
}
