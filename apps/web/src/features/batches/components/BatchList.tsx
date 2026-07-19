'use client';

import { BatchCard } from './BatchCard';
import type { BatchListItem, BatchStatus } from '@/features/batches/types/batch';

interface BatchListProps {
  batches: BatchListItem[];
  onView: (id: string) => void;
  onEdit?: (batch: BatchListItem) => void;
  onStatusChange?: (batch: BatchListItem, status: BatchStatus) => void;
  onPrefetch?: (id: string) => void;
  isLoading?: boolean;
}

export function BatchList({
  batches,
  onView,
  onEdit,
  onStatusChange,
  onPrefetch,
  isLoading = false,
}: BatchListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading batches">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20 flex-shrink-0" />
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="flex gap-2 pt-1">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="flex-1" />
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (batches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" role="list" aria-label="Batches list">
      {batches.map((batch) => (
        <BatchCard
          key={batch.id}
          batch={batch}
          onView={onView}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          onPrefetch={onPrefetch}
        />
      ))}
    </div>
  );
}
