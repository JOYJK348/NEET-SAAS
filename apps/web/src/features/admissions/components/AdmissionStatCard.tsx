import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface AdmissionStatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  bgColor?: string;
  className?: string;
}

export function AdmissionStatCard({
  label,
  value,
  icon: Icon,
  bgColor = 'bg-purple-50',
  className,
}: AdmissionStatCardProps) {
  return (
    <Card className={cn('border border-gray-200', className)}>
      <CardContent className="flex items-center gap-4 p-4 lg:p-5">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', bgColor)}>
          <Icon className="h-6 w-6 text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
