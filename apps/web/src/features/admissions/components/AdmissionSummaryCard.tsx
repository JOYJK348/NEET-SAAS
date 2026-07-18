import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { AdmissionStatusBadge } from './AdmissionStatusBadge';
import { AdmissionSectionHeader } from './AdmissionSectionHeader';
import { CalendarDays, BookOpen, MapPin, Hash } from 'lucide-react';
import { formatDate } from '@/features/admissions/utils/admission-utils';
import type { Admission } from '@/features/admissions/types/admission';

interface AdmissionSummaryCardProps {
  admission: Admission;
  className?: string;
}

export function AdmissionSummaryCard({ admission, className }: AdmissionSummaryCardProps) {
  return (
    <Card className={cn('border border-gray-200', className)}>
      <CardContent className="p-4 lg:p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <AdmissionSectionHeader
              title={admission.admissionNumber}
              description={`Admission ID: ${admission.id}`}
            />
          </div>
          <AdmissionStatusBadge status={admission.admissionStatus} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <CalendarDays className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Admission Date</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(admission.admissionDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Course</p>
              <p className="text-sm font-medium text-gray-900">{admission.course.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Branch</p>
              <p className="text-sm font-medium text-gray-900">{admission.branch.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Hash className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Batch</p>
              <p className="text-sm font-medium text-gray-900">{admission.batch?.name || '—'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
