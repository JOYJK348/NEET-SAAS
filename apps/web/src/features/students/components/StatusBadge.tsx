'use client';

import { cn } from '@/lib/utils';
import { StudentStatus, STUDENT_STATUS_LABELS, STUDENT_STATUS_COLORS } from '../types/student';

interface StatusBadgeProps {
  status: StudentStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
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
        STUDENT_STATUS_COLORS[status],
        className,
      )}
    >
      {STUDENT_STATUS_LABELS[status]}
    </span>
  );
}
