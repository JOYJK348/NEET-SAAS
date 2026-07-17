'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { StudentSectionHeader } from './StudentSectionHeader';
import { LoadingSpinner } from '@/components/ui/loading';
import { TimelineEvent, TimelineEventType } from '@/features/students/types/student';
import {
  Circle,
  UserPlus,
  RefreshCw,
  ArrowRightLeft,
  BookOpen,
  Pencil,
  Archive,
  FileText,
} from 'lucide-react';

interface StudentTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  className?: string;
}

const eventIcons: Record<TimelineEventType, React.ComponentType<{ className?: string }>> = {
  CREATED: UserPlus,
  STATUS_CHANGED: RefreshCw,
  BATCH_CHANGED: ArrowRightLeft,
  COURSE_CHANGED: BookOpen,
  PROFILE_UPDATED: Pencil,
  ARCHIVED: Archive,
  NOTE_ADDED: FileText,
};

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function StudentTimeline({ events, isLoading, className }: StudentTimelineProps) {
  if (isLoading) {
    return (
      <Card className={cn('rounded-2xl border-[#E5E7EB] bg-white shadow-sm', className)}>
        <CardContent className="p-5 sm:p-6">
          <StudentSectionHeader title="Timeline" description="Activity history" />
          <div className="flex justify-center py-8">
            <LoadingSpinner size="sm" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className={cn('rounded-2xl border-[#E5E7EB] bg-white shadow-sm', className)}>
        <CardContent className="p-5 sm:p-6">
          <StudentSectionHeader title="Timeline" description="Activity history" />
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Circle className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No timeline events yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('rounded-2xl border-[#E5E7EB] bg-white shadow-sm', className)}>
      <CardContent className="p-5 sm:p-6">
        <StudentSectionHeader title="Timeline" description="Activity history" />
        <div className="mt-5 relative">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-[#E5E7EB]" />
          <div className="space-y-4">
            {events.map((event) => {
              const Icon = eventIcons[event.type] || Circle;
              return (
                <div key={event.id} className="relative flex gap-4 pl-0">
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/5 border-2 border-white flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[#111827]">{event.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {formatTimeAgo(event.createdAt)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                    )}
                    {event.createdBy && (
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        by {event.createdBy}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
