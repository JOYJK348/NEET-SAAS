'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { ReactNode } from 'react';

interface InfoItem {
  label: string;
  value: string | ReactNode;
  icon?: React.ReactNode;
}

interface BatchInfoCardProps {
  title: string;
  description?: string;
  items: InfoItem[];
  columns?: 1 | 2;
  className?: string;
  action?: ReactNode;
}

export function BatchInfoCard({
  title,
  description,
  items,
  columns = 2,
  className,
  action,
}: BatchInfoCardProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
  };

  return (
    <Card className={cn('border border-gray-200', className)}>
      <CardContent className="p-4 lg:p-5">
        <div className={cn('flex items-start justify-between gap-4')}>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-[#111827]">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
        <div className={cn('grid gap-4 mt-4', gridCols[columns])}>
          {items.map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
                <p className="text-sm text-gray-500">{item.label}</p>
              </div>
              <div className="text-sm font-medium text-gray-900">{item.value || '—'}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
