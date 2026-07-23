'use client';

import { cn } from '@/lib/utils';

interface TutorSectionHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function TutorSectionHeader({
  title,
  description,
  children,
  className,
}: TutorSectionHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}
