import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AdmissionSectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function AdmissionSectionHeader({
  title,
  description,
  action,
  className,
}: AdmissionSectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4',
        className,
      )}
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
