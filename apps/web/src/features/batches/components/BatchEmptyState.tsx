'use client';

import { Calendar, Search, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BatchEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  onCreateBatch?: () => void;
  className?: string;
  variant?: 'default' | 'search' | 'filter';
}

export function BatchEmptyState({
  onClearFilters,
  onCreateBatch,
  className,
  variant = 'default',
}: BatchEmptyStateProps) {
  const getContent = () => {
    switch (variant) {
      case 'search':
        return {
          icon: Search,
          title: 'No batches found',
          description:
            "Try adjusting your search terms or filters to find what you're looking for.",
          action: onClearFilters ? (
            <Button variant="outline" size="sm" onClick={onClearFilters} className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          ) : null,
        };
      case 'filter':
        return {
          icon: Filter,
          title: 'No batches match your filters',
          description:
            'Try adjusting your filter criteria or clear all filters to see all batches.',
          action: onClearFilters ? (
            <Button variant="outline" size="sm" onClick={onClearFilters} className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Clear All Filters
            </Button>
          ) : null,
        };
      default:
        return {
          icon: Calendar,
          title: 'No batches yet',
          description: 'Create your first batch to start organizing students.',
          action: onCreateBatch ? (
            <Button onClick={onCreateBatch} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Batch
            </Button>
          ) : null,
        };
    }
  };

  const { icon: Icon, title, description, action } = getContent();

  return (
    <div
      className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}
    >
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6">{description}</p>
      {action && <div className="w-full max-w-xs">{action}</div>}
    </div>
  );
}

export function BatchEmptyStateInline({
  hasFilters = false,
  onClearFilters,
  onCreateBatch,
  className,
}: BatchEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700',
        className,
      )}
    >
      <Calendar className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
      <h4 className="font-medium text-gray-900 dark:text-white mb-1">
        {hasFilters ? 'No batches match your filters' : 'No batches found'}
      </h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
        {hasFilters
          ? 'Try adjusting your filters or search terms'
          : 'Create your first batch to get started'}
      </p>
      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
        {hasFilters && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters} className="gap-1.5 flex-1">
            <Filter className="h-3.5 w-3.5" />
            Clear Filters
          </Button>
        )}
        {onCreateBatch && (
          <Button onClick={onCreateBatch} className="gap-2 flex-1">
            <Plus className="h-4 w-4" />
            Create Batch
          </Button>
        )}
      </div>
    </div>
  );
}
