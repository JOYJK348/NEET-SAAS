'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { StudentSectionHeader } from './StudentSectionHeader';

interface InfoItem {
  label: string;
  value: string | React.ReactNode;
  icon?: React.ReactNode;
}

interface StudentInfoCardProps {
  title: string;
  description?: string;
  items: InfoItem[];
  columns?: 1 | 2 | 3;
  className?: string;
  action?: React.ReactNode;
}

export function StudentInfoCard({
  title,
  description,
  items,
  columns = 2,
  className,
  action,
}: StudentInfoCardProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <Card className={cn('rounded-2xl border-slate-200 bg-white shadow-2xs', className)}>
      <CardContent className="p-5 sm:p-6">
        <StudentSectionHeader title={title} description={description} action={action} />
        <div className={cn('grid mt-5 gap-4 sm:gap-6', gridCols[columns])}>
          {items.map((item, index) => (
            <div
              key={index}
              className="space-y-1 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80"
            >
              <div className="flex items-center gap-1.5">
                {item.icon && <span className="text-[#0052CC] shrink-0">{item.icon}</span>}
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {item.label}
                </p>
              </div>
              <div className="text-sm font-extrabold text-[#0B2447] pt-0.5">
                {item.value || (
                  <span className="text-slate-400 italic font-normal">Not provided</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
