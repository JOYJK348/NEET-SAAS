import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { AdmissionSectionHeader } from './AdmissionSectionHeader';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface InfoItem {
  label: string;
  value: string | ReactNode;
  icon?: LucideIcon;
}

interface AdmissionInfoCardProps {
  title: string;
  description?: string;
  items: InfoItem[];
  columns?: 1 | 2 | 3;
  className?: string;
  action?: ReactNode;
}

export function AdmissionInfoCard({
  title,
  description,
  items,
  columns = 2,
  className,
  action,
}: AdmissionInfoCardProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <Card className={cn('border border-gray-200', className)}>
      <CardContent className="p-4 lg:p-5">
        <AdmissionSectionHeader title={title} description={description} action={action} />
        <div className={cn('grid gap-4', gridCols[columns])}>
          {items.map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                {item.icon && <item.icon className="h-4 w-4 text-gray-400" />}
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
