import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Eye, ArrowRightLeft } from 'lucide-react';

interface AdmissionActionBarProps {
  onView?: () => void;
  onStatusChange?: () => void;
  size?: 'sm' | 'default' | 'icon';
  className?: string;
}

export function AdmissionActionBar({
  onView,
  onStatusChange,
  size = 'icon',
  className,
}: AdmissionActionBarProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {onView && (
        <Button
          variant="ghost"
          size={size}
          className="h-9 w-9 rounded-lg text-gray-500 hover:text-purple-600"
          onClick={onView}
          title="View details"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {onStatusChange && (
        <Button
          variant="ghost"
          size={size}
          className="h-9 w-9 rounded-lg text-gray-500 hover:text-blue-600"
          onClick={onStatusChange}
          title="Update status"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
