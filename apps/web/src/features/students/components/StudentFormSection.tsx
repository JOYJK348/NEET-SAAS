'use client';

import { cn } from '@/lib/utils';

interface StudentFormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function StudentFormSection({
  title,
  description,
  children,
  className,
}: StudentFormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 space-y-4">
        {children}
      </div>
    </div>
  );
}
