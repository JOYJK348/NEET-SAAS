'use client';

import { AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface BatchErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'error' | 'warning';
}

export function BatchErrorState({
  message = 'Failed to load batches. Please try again.',
  onRetry,
  className,
  variant = 'error',
}: BatchErrorStateProps) {
  return (
    <Alert
      variant={variant === 'error' ? 'destructive' : 'default'}
      className={cn('w-full max-w-2xl mx-auto', className)}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="text-base">
        {variant === 'error' ? 'Failed to Load Batches' : 'Warning'}
      </AlertTitle>
      <AlertDescription className="text-sm">
        {message}
        {onRetry && ' Please try again.'}
      </AlertDescription>
      {onRetry && (
        <div className="mt-4 flex justify-center">
          <Button
            variant={variant === 'error' ? 'default' : 'outline'}
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )}
    </Alert>
  );
}

export function BatchErrorInline({
  message = 'An error occurred',
  onRetry,
  className,
}: BatchErrorStateProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg',
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
      <p className="text-sm text-red-700 dark:text-red-300 flex-1">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="flex-shrink-0">
          <RefreshCw className="h-4 w-4 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}
