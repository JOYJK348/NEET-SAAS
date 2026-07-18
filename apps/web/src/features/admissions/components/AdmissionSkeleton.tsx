import { cn } from '@/lib/utils';

interface AdmissionSkeletonProps {
  variant?: 'table' | 'card' | 'detail';
  count?: number;
  className?: string;
}

export function AdmissionSkeleton({
  variant = 'table',
  count = 5,
  className,
}: AdmissionSkeletonProps) {
  if (variant === 'detail') {
    return (
      <div className={cn('space-y-6 animate-pulse', className)}>
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-40 bg-gray-200 rounded-xl" />
            <div className="h-40 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-gray-100 rounded-xl animate-pulse">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-gray-200 rounded" />
            <div className="h-3 w-1/4 bg-gray-200 rounded" />
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
        </div>
      ))}
    </div>
  );
}
