'use client';

import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorTimetable } from '@/features/tutor-dashboard/hooks/use-tutor-timetable';
import type { TimetableSessionDto } from '@/features/tutor-dashboard/types/timetable';
import { ErrorState } from '@/components/ui/error-state';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Layers,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading';

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDisplayRange(start: Date, end: Date): string {
  return `${formatDisplayDate(start)} – ${formatDisplayDate(end)}, ${end.getFullYear()}`;
}

function getWeekRange(date: Date): { start: Date; end: Date } {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(date);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getStatusColors(status: string): string {
  switch (status) {
    case 'SCHEDULED': return 'border-l-blue-500 bg-blue-50/60 hover:bg-blue-50';
    case 'COMPLETED': return 'border-l-green-500 bg-green-50/60 hover:bg-green-50';
    case 'CANCELLED': return 'border-l-red-500 bg-red-50/60 hover:bg-red-50';
    case 'DRAFT': return 'border-l-amber-500 bg-amber-50/60 hover:bg-amber-50';
    default: return 'border-l-slate-400 bg-slate-50/60 hover:bg-slate-50';
  }
}

function getBadgeColors(status: string): string {
  switch (status) {
    case 'SCHEDULED': return 'text-blue-700 bg-blue-100';
    case 'COMPLETED': return 'text-green-700 bg-green-100';
    case 'CANCELLED': return 'text-red-700 bg-red-100';
    case 'DRAFT': return 'text-amber-700 bg-amber-100';
    default: return 'text-slate-600 bg-slate-100';
  }
}

// ─── Session Card ────────────────────────────────────────────────────────────

function TimetableSessionCard({ session, date }: { session: TimetableSessionDto; date: string }) {
  const isCancelled = session.sessionStatus === 'CANCELLED';
  const isRescheduled = session.overrideType === 'TIME_CHANGED' || session.overrideType === 'TUTOR_CHANGED';
  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    : '';

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 border-l-[3px] p-2.5 transition-all hover:shadow-sm cursor-default',
        getStatusColors(session.sessionStatus),
        isCancelled && 'opacity-70',
      )}
    >
      {/* Date + Time */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-700 mb-1.5">
        <Clock className="w-3 h-3 text-slate-400" />
        <span>{session.startsAt} – {session.endsAt}</span>
        {formattedDate && (
          <span className="text-[10px] text-slate-400 ml-auto font-sans font-semibold">
            {formattedDate}
          </span>
        )}
      </div>

      {/* Subject */}
      <p className="text-xs font-bold text-slate-800 leading-tight mb-1">
        {session.subject?.name || 'Unknown Subject'}
      </p>

      {/* Batch + Branch */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
        {session.batch && (
          <span className="flex items-center gap-1 bg-white/70 rounded px-1.5 py-0.5 border border-slate-100">
            <Layers className="w-2.5 h-2.5" />
            {session.batch.name}
          </span>
        )}
        {session.branch && (
          <span className="flex items-center gap-1 bg-white/70 rounded px-1.5 py-0.5 border border-slate-100">
            <MapPin className="w-2.5 h-2.5" />
            {session.branch.name}
          </span>
        )}
      </div>

      {/* Status badge */}
      <div className="mt-1.5 flex items-center gap-1 flex-wrap">
        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', getBadgeColors(session.sessionStatus))}>
          {session.sessionStatus}
        </span>
        {isRescheduled && !isCancelled && (
          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
            RESCHEDULED
          </span>
        )}
      </div>

      {/* Cancelled reason */}
      {isCancelled && session.cancelledReason && (
        <p className="text-[10px] text-red-500 italic mt-1 leading-tight">
          {session.cancelledReason}
        </p>
      )}
    </div>
  );
}

// ─── Empty Cell ──────────────────────────────────────────────────────────────

function EmptyCell() {
  return (
    <div className="h-full min-h-[80px] rounded-lg border border-dashed border-slate-200 bg-slate-50/20" />
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function TimetableContent() {
  const { user } = useAuth();

  const [weekStart, setWeekStart] = useState(() => getWeekRange(new Date()).start);

  const weekRange = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start: weekStart, end };
  }, [weekStart]);

  const dateFrom = weekRange.start.toISOString().split('T')[0];
  const dateTo = weekRange.end.toISOString().split('T')[0];

  const { timetable, isLoading, error, refetch } = useTutorTimetable(dateFrom, dateTo);

  const goBack = useCallback(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }, [weekStart]);

  const goForward = useCallback(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }, [weekStart]);

  const goToday = useCallback(() => {
    setWeekStart(getWeekRange(new Date()).start);
  }, []);

  const isCurrentWeek = useMemo(() => {
    const today = getWeekRange(new Date()).start;
    return weekStart.getTime() === today.getTime();
  }, [weekStart]);

  // Build weekly view: group sessions by weekday
  const weeklyView = useMemo(() => {
    const grouped: Record<string, TimetableSessionDto[]> = {};
    for (const day of WEEKDAYS) {
      grouped[day] = [];
    }
    if (timetable?.timetable) {
      for (const day of timetable.timetable) {
        const date = new Date(day.date + 'T00:00:00');
        const dayName = WEEKDAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
        if (grouped[dayName]) {
          grouped[dayName] = day.sessions;
        }
      }
    }
    return grouped;
  }, [timetable]);

  // Collect unique time slots
  const allTimes = useMemo(() => {
    const times = new Set<string>();
    for (const sessions of Object.values(weeklyView)) {
      for (const s of sessions) {
        times.add(s.startsAt);
      }
    }
    return Array.from(times).sort();
  }, [weeklyView]);

  const todayDayName = useMemo(() => {
    const d = new Date();
    return WEEKDAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">My Timetable</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {user?.firstName}&apos;s class schedule
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCurrentWeek && (
            <button
              onClick={goToday}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Today
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors text-slate-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between mb-6 p-3 rounded-xl bg-white border border-slate-200/80 shadow-sm">
        <button
          onClick={goBack}
          className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-slate-700">
          {formatDisplayRange(weekRange.start, weekRange.end)}
        </span>
        <button
          onClick={goForward}
          className="w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <LoadingSpinner size="lg" />
          <span className="text-slate-500 text-sm font-medium">Loading timetable...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 lg:p-6">
          <ErrorState
            title="Failed to load timetable"
            message={error.message || 'Could not load your timetable. Please try again.'}
            onRetry={refetch}
            variant="page"
          />
        </div>
      )}

      {/* Desktop Weekly Grid */}
      {!isLoading && !error && (
        <>
          {allTimes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center border border-primary/10">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-slate-800 font-semibold mb-1">No classes this week</p>
                <p className="text-slate-500 text-sm max-w-xs">
                  You have no scheduled classes for this week. Enjoy your free time!
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              {/* Day header row */}
              <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/75">
                <div className="flex items-center justify-center py-4 px-2 border-r border-slate-200">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                {WEEKDAYS.map((day) => {
                  const count = weeklyView[day]?.length ?? 0;
                  const isToday = day === todayDayName;
                  return (
                    <div
                      key={day}
                      className={cn(
                        'flex flex-col items-center py-3.5 px-2 border-r border-slate-200 last:border-r-0',
                        isToday && 'bg-primary/5',
                      )}
                    >
                      <span className={cn('text-xs font-bold', isToday ? 'text-primary' : 'text-slate-700')}>
                        {DAY_SHORT[day]}
                      </span>
                      {count > 0 && (
                        <span className="mt-1 text-[10px] text-primary font-semibold bg-primary-light px-2 py-0.5 rounded-full">
                          {count} {count === 1 ? 'class' : 'classes'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Grid rows */}
              <div className="bg-white">
                {allTimes.map((time, rowIdx) => (
                  <div
                    key={time}
                    className={cn(
                      'grid grid-cols-8 border-b border-slate-100 last:border-b-0',
                      rowIdx % 2 === 0 ? '' : 'bg-slate-50/20',
                    )}
                  >
                    <div className="flex items-start justify-center py-3 px-2 border-r border-slate-200 pt-4">
                      <span className="text-[11px] font-mono text-slate-500 font-semibold">
                        {time}
                      </span>
                    </div>
                    {WEEKDAYS.map((day, dayIdx) => {
                      const slots = weeklyView[day]?.filter((s) => s.startsAt === time) ?? [];
                      const dayDate = new Date(weekStart);
                      dayDate.setDate(weekStart.getDate() + dayIdx);
                      const dateStr = dayDate.toISOString().split('T')[0];
                      return (
                        <div
                          key={day}
                          className="p-1.5 border-r border-slate-100 last:border-r-0 min-h-[96px]"
                        >
                          {slots.length > 0 ? (
                            <div className="space-y-1.5">
                              {slots.map((session) => (
                                <TimetableSessionCard key={session.id} session={session} date={dateStr} />
                              ))}
                            </div>
                          ) : (
                            <EmptyCell />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────────────

export default function TutorTimetablePage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <DashboardLayout>
        <TimetableContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
