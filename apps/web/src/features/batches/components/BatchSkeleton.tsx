'use client';

import { cn } from '@/lib/utils';

interface BatchSkeletonProps {
  variant?: 'table' | 'card';
  count?: number;
  className?: string;
}

export function BatchSkeleton({ variant = 'table', count = 5, className }: BatchSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
          className,
        )}
      >
        {skeletons.map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-pulse"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0" />
              </div>
              <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="flex gap-2 pt-1">
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="flex-1" />
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {skeletons.map((_, i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse"
        >
          <div className="p-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 sm:col-span-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="col-span-12 sm:col-span-3">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="col-span-12 sm:col-span-3">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="col-span-12 sm:col-span-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
              <div className="col-span-12 sm:col-span-2">
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
