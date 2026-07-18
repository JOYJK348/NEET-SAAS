'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { AdmissionSectionHeader } from './AdmissionSectionHeader';
import { getTimeAgo, formatDateTime } from '@/features/admissions/utils/admission-utils';
import { Circle, UserPlus, RefreshCw, ArrowRightLeft, FileText, Clock } from 'lucide-react';
import type { TimelineEvent } from '@/features/admissions/types/admission';
import { ADMISSION_STATUS_LABELS } from '@/features/admissions/types/admission';

interface AdmissionTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  className?: string;
}

function getTimelineIcon(type: string) {
  switch (type) {
    case 'CREATED':
      return UserPlus;
    case 'STATUS_CHANGE':
      return ArrowRightLeft;
    case 'UPDATED':
      return RefreshCw;
    case 'NOTE_ADDED':
      return FileText;
    default:
      return Circle;
  }
}

function getTimelineColor(type: string) {
  switch (type) {
    case 'CREATED':
      return 'text-purple-600 bg-purple-50';
    case 'STATUS_CHANGE':
      return 'text-blue-600 bg-blue-50';
    case 'UPDATED':
      return 'text-amber-600 bg-amber-50';
    case 'NOTE_ADDED':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdmissionTimeline({ events, isLoading, className }: AdmissionTimelineProps) {
  if (isLoading) {
    return (
      <Card className={cn('border border-gray-200', className)}>
        <CardContent className="p-4 lg:p-5">
          <AdmissionSectionHeader title="Timeline" description="Admission activity log" />
          <LoadingSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (!events?.length) {
    return (
      <Card className={cn('border border-gray-200', className)}>
        <CardContent className="p-4 lg:p-5">
          <AdmissionSectionHeader title="Timeline" description="Admission activity log" />
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No timeline events yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border border-gray-200', className)}>
      <CardContent className="p-4 lg:p-5">
        <AdmissionSectionHeader title="Timeline" description="Admission activity log" />
        <div className="relative space-y-0">
          {events.map((event, index) => {
            const Icon = getTimelineIcon(event.type);
            const colorClass = getTimelineColor(event.type);

            return (
              <div key={event.id} className="flex gap-3 pb-6 relative">
                {index < events.length - 1 && (
                  <div className="absolute left-3.5 top-8 bottom-0 w-px bg-gray-200" />
                )}
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0',
                    colorClass,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    {event.fromStatus && event.toStatus && (
                      <span className="text-xs text-gray-500">
                        ({ADMISSION_STATUS_LABELS[event.fromStatus]} →{' '}
                        {ADMISSION_STATUS_LABELS[event.toStatus]})
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{event.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{event.createdBy}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400" title={formatDateTime(event.createdAt)}>
                      {getTimeAgo(event.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
