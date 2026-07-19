'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function BranchSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search & Actions Area */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <Skeleton className="h-10 w-full sm:w-[300px]" />
        <Skeleton className="h-10 w-full sm:w-[150px]" />
      </div>

      {/* Table Skeletons */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="bg-gray-50/50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-800 flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800 p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-8 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
