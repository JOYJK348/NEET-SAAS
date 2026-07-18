'use client';

import { cn } from '@/lib/utils';
import {
  BatchStatus,
  BATCH_STATUS_LABELS,
  BATCH_STATUS_COLORS,
} from '@/features/batches/types/batch';

interface BatchStatusBadgeProps {
  status: BatchStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BatchStatusBadge({ status, size = 'md', className }: BatchStatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        sizeClasses[size],
        BATCH_STATUS_COLORS[status],
        className,
      )}
    >
      {BATCH_STATUS_LABELS[status]}
    </span>
  );
}
