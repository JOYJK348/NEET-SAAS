'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StudentStatCardProps {
  label: string;
  value: number;
  bgColor?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StudentStatCard({
  label,
  value,
  bgColor = 'bg-purple-100',
  icon,
  className,
}: StudentStatCardProps) {
  return (
    <Card className={cn('rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm', className)}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-1">{value}</p>
          </div>
          {icon ? (
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bgColor)}>
              {icon}
            </div>
          ) : (
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bgColor)}>
              <div className="w-5 h-5 rounded-full bg-purple-600/20" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
