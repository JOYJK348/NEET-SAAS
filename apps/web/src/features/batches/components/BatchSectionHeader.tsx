'use client';

import { cn } from '@/lib/utils';

interface BatchSectionHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function BatchSectionHeader({
  title,
  description,
  children,
  className,
}: BatchSectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}
