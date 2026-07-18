import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { AdmissionStatus } from '@/features/admissions/types/admission';
import {
  ADMISSION_STATUS_LABELS,
  ADMISSION_STATUS_COLORS,
} from '@/features/admissions/types/admission';

interface AdmissionStatusBadgeProps {
  status: AdmissionStatus;
  className?: string;
}

export function AdmissionStatusBadge({ status, className }: AdmissionStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', ADMISSION_STATUS_COLORS[status], className)}
    >
      {ADMISSION_STATUS_LABELS[status]}
    </Badge>
  );
}
