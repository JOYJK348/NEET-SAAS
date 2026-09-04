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
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-slate-100 pb-3',
        className,
      )}
    >
      <div className="space-y-0.5">
        <h3 className="text-base sm:text-lg font-extrabold text-[#0B2447]">{title}</h3>
        {description && <p className="text-xs text-slate-500 font-medium">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
