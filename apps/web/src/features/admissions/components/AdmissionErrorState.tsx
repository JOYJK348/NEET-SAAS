'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface AdmissionErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'error' | 'warning';
}

export function AdmissionErrorState({
  message = 'Something went wrong while loading admissions.',
  onRetry,
  className,
  variant = 'error',
}: AdmissionErrorStateProps) {
  return (
    <div className={cn('p-4', className)}>
      <Alert variant={variant === 'warning' ? 'warning' : 'destructive'} className="rounded-xl">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <span>{message}</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              className="self-start rounded-lg h-9"
              onClick={onRetry}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
