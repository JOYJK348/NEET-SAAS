import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { AdmissionStatusBadge } from './AdmissionStatusBadge';
import { AdmissionActionBar } from './AdmissionActionBar';
import { formatDate } from '@/features/admissions/utils/admission-utils';
import { BookOpen, MapPin, CalendarDays } from 'lucide-react';
import type { AdmissionListItem } from '@/features/admissions/types/admission';

interface AdmissionMobileCardProps {
  admission: AdmissionListItem;
  onView?: (id: string) => void;
  onStatusChange?: (id: string) => void;
  onPrefetch?: (id: string) => void;
  className?: string;
}

export function AdmissionMobileCard({
  admission,
  onView,
  onStatusChange,
  onPrefetch,
  className,
}: AdmissionMobileCardProps) {
  return (
    <Card
      className={cn('border border-gray-200', className)}
      onMouseEnter={() => onPrefetch?.(admission.id)}
      onFocus={() => onPrefetch?.(admission.id)}
      tabIndex={0}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-medium text-gray-900">{admission.studentName}</p>
            <p className="text-xs text-gray-500">{admission.admissionNumber}</p>
          </div>
          <AdmissionStatusBadge status={admission.admissionStatus} />
        </div>
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <span>{admission.courseName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{admission.branchName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <span>{formatDate(admission.admissionDate)}</span>
          </div>
        </div>
        <div className="flex justify-end border-t border-gray-100 pt-2">
          <AdmissionActionBar
            onView={() => onView?.(admission.id)}
            onStatusChange={() => onStatusChange?.(admission.id)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
