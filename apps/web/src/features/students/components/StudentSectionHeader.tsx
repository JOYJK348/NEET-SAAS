'use client';

import { cn } from '@/lib/utils';

interface StudentSectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function StudentSectionHeader({
  title,
  description,
  action,
  className,
}: StudentSectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
