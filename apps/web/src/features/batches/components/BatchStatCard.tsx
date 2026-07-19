'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface BatchStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export function BatchStatCard({
  title,
  value,
  icon,
  description,
  trend,
  className,
}: BatchStatCardProps) {
  return (
    <Card className={cn('rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm', className)}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{value}</p>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            {trend && (
              <p
                className={cn(
                  'text-sm font-medium mt-1',
                  trend.isPositive ? 'text-green-600' : 'text-red-600',
                )}
              >
                {trend.isPositive ? '+' : '-'}
                {trend.value}%
              </p>
            )}
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
