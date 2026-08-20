'use client';

import { useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  useStudentTimetable,
  useJoinSession,
} from '@/features/student-dashboard/hooks/use-student-timetable';
import type { StudentSessionDto } from '@/features/student-dashboard/types/student-dashboard.types';
import { ErrorState } from '@/components/ui/error-state';
import { useAuth } from '@/providers/auth-provider';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  Video,
  CalendarDays,
  Grid,
  List,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading';
import { toast } from 'sonner';

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
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

function DeliveryModeBadge({ mode }: { mode: string | null }) {
  if (!mode) return null;
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    ONLINE: {
      label: 'Online',
      cls: 'bg-sky-100 text-sky-700',
      icon: <Video className="w-2.5 h-2.5" />,
    },
    CLASSROOM: {
      label: 'Classroom',
      cls: 'bg-amber-100 text-amber-700',
      icon: <MapPin className="w-2.5 h-2.5" />,
    },
    HYBRID: {
      label: 'Hybrid',
      cls: 'bg-violet-100 text-violet-700',
      icon: <Radio className="w-2.5 h-2.5" />,
    },
  };
  const cfg = map[mode] ?? { label: mode, cls: 'bg-slate-100 text-slate-600', icon: null };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-lg',
        cfg.cls,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function LiveStatusBadge({ status }: { status: string }) {
  if (status === 'LIVE_NOW') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        LIVE
      </span>
    );
  }
  if (status === 'COMPLETED') {
    return (
      <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500">
        Done
      </span>
    );
  }
  return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-600">
      Upcoming
    </span>
  );
}

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useEffect } from 'react';

function TimetableSessionCard({ session, date, isFeeLocked }: { session: StudentSessionDto; date: string; isFeeLocked?: boolean }) {
  const router = useRouter();
  const isCancelled = session.sessionStatus === 'CANCELLED';
  const isLive = session.liveStatus === 'LIVE_NOW' || session.sessionStatus === 'STARTED';

  const subjectName = session.subject?.name ?? 'Subject Session';
  const initial = subjectName.charAt(0).toUpperCase();

  const canJoinNow = useMemo(() => {
    if (isLive) return true;
    if (isCancelled || session.sessionStatus === 'COMPLETED' || session.liveStatus === 'COMPLETED') return false;

    const sessionDate = date || session.date;
    if (sessionDate && session.startsAt && session.endsAt) {
      try {
        const now = new Date();
        const dateStr = sessionDate.includes('T') ? sessionDate.split('T')[0] : sessionDate;
        const start = new Date(`${dateStr}T${session.startsAt}:00`);
        const end = new Date(`${dateStr}T${session.endsAt}:00`);

        // Allow joining 10 mins before start until end time
        const windowStart = new Date(start.getTime() - 10 * 60 * 1000);
        return now >= windowStart && now <= end;
      } catch {}
    }

    return session.canJoin ?? false;
  }, [isLive, isCancelled, session, date]);

  const handleJoin = () => {
    if (isFeeLocked) {
      toast.error('Live class access is locked due to pending fee dues.');
      router.push('/dashboard/student/fees');
      return;
    }
    router.push(`/dashboard/student/live/${session.id || 'demo-class-1'}`);
  };

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs',
        isLive && 'border-emerald-300 bg-gradient-to-r from-emerald-50/60 via-teal-50/30 to-white ring-2 ring-emerald-400/20',
        isCancelled && 'border-rose-200 bg-rose-50/30 opacity-80',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 text-violet-700 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
            {initial}
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-slate-900 text-sm sm:text-base leading-snug truncate">
              {subjectName}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-bold font-mono">
              <Clock className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span>{session.startsAt} – {session.endsAt}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <LiveStatusBadge status={session.liveStatus} />
        </div>
      </div>

      {/* Meta Tags */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {session.batch?.name && (
          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-extrabold text-slate-700">
            <Layers className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span className="truncate max-w-[150px] sm:max-w-none">{session.batch.name}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-extrabold text-slate-700">
          <span className="text-slate-400">👤 Tutor:</span>
          <strong className="text-slate-900 font-black">
            {session.tutorName || 'Faculty'}
          </strong>
        </span>
        <DeliveryModeBadge mode={session.deliveryMode} />
      </div>

      {/* Action Button */}
      {!isCancelled && (
        <div className="pt-1 border-t border-slate-100">
          <button
            onClick={handleJoin}
            disabled={!canJoinNow}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-150 min-h-[40px] shadow-2xs text-center',
              canJoinNow
                ? isFeeLocked
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-rose-500/20 active:scale-98 cursor-pointer'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20 active:scale-98 cursor-pointer'
                : 'bg-slate-100 border border-slate-200 text-slate-400 opacity-70 cursor-not-allowed'
            )}
          >
            {isFeeLocked && canJoinNow ? (
              <span className="flex items-center gap-1.5">
                <span>🔒</span>
                <span>Fee Payment Required 💳</span>
              </span>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>
                  {canJoinNow ? 'Join Live Class 🚀' : `Upcoming Class (${session.startsAt}) ⏳`}
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function TimetableContent() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'LIST'>('LIST');
  const [isFeeLocked, setIsFeeLocked] = useState(false);

  useEffect(() => {
    api
      .get<{ isFeeLocked?: boolean }>('/live-classes/check-fee-access', { skipGlobalToast: true })
      .then((res) => {
        if (res?.isFeeLocked) setIsFeeLocked(true);
      })
      .catch(() => {});
  }, []);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  // Calculate month boundaries for API fetch
  const monthStart = useMemo(() => new Date(year, month, 1), [year, month]);
  const monthEnd = useMemo(() => new Date(year, month + 1, 0), [year, month]);

  const dateFrom = monthStart.toISOString().split('T')[0];
  const dateTo = monthEnd.toISOString().split('T')[0];

  const { timetable, isLoading, error, refetch } = useStudentTimetable(dateFrom, dateTo);

  // Calendar Days Calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDay = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month padding
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding
    const remaining = 35 - days.length;
    for (let i = 1; i <= (remaining < 0 ? remaining + 7 : remaining); i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Group sessions by Date string (YYYY-MM-DD)
  const sessionsByDate = useMemo(() => {
    const map: Record<string, StudentSessionDto[]> = {};
    if (timetable?.timetable) {
      for (const day of timetable.timetable) {
        map[day.date] = day.sessions || [];
      }
    }
    return map;
  }, [timetable]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const selectedDateKey = formatDateKey(selectedDate);
  const selectedDaySchedules = sessionsByDate[selectedDateKey] || [];

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 sm:p-6 space-y-6 text-[#111827]">
      {/* ── Top Centered Header (Matches Tutor Timetable Style) ────────────── */}
      <div className="text-center max-w-xl mx-auto space-y-1 my-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
          Student Class Timetable
        </h1>
        <p className="text-xs font-bold text-slate-500">
          Interactive schedule calendar for enrolled courses & live classes
        </p>
      </div>

      {/* ── View Mode Switcher Pills (MONTH | WEEK | LIST) ──────────────────── */}
      <div className="flex items-center justify-center gap-2">
        <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('MONTH')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer',
              viewMode === 'MONTH'
                ? 'bg-white text-violet-700 shadow-2xs font-black'
                : 'hover:text-slate-900',
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>MONTH</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('WEEK')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer',
              viewMode === 'WEEK'
                ? 'bg-white text-violet-700 shadow-2xs font-black'
                : 'hover:text-slate-900',
            )}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>WEEK</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('LIST')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer',
              viewMode === 'LIST'
                ? 'bg-white text-violet-700 shadow-2xs font-black'
                : 'hover:text-slate-900',
            )}
          >
            <List className="w-3.5 h-3.5" />
            <span>LIST</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-all disabled:opacity-50 shadow-2xs cursor-pointer"
          title="Refresh timetable"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Month Navigation Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <button
          onClick={handleToday}
          className="px-3.5 py-1.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-xs font-bold hover:bg-violet-100 transition-colors"
        >
          Today
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-black text-slate-900 min-w-[140px] text-center">
            {monthName}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile Quick Day Inspector ────────────────────────────────────── */}
      <div className="block md:hidden bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-900 uppercase">Selected Date:</span>
          <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-xl border border-violet-100">
            {selectedDate.toLocaleDateString('en-IN', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
            })}
          </span>
        </div>

        {selectedDaySchedules.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-xs font-bold text-slate-500">No classes scheduled for this date.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDaySchedules.map((session) => (
              <TimetableSessionCard
                key={session.id}
                session={session}
                date={selectedDateKey}
                isFeeLocked={isFeeLocked}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Main Calendar Grid / List View Modes ──────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <LoadingSpinner size="lg" />
          <span className="text-slate-500 text-xs font-bold">Loading class timetable...</span>
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load timetable"
          message={error.message || 'Could not load your timetable. Please try again.'}
          onRetry={refetch}
          variant="page"
        />
      ) : viewMode === 'MONTH' ? (
        /* Month View Grid */
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center font-extrabold text-[11px] text-slate-500 uppercase tracking-wider py-2.5">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {calendarDays.map((item, idx) => {
              const dKey = formatDateKey(item.date);
              const daySchedules = sessionsByDate[dKey] || [];
              const isSelected = formatDateKey(selectedDate) === dKey;
              const isTodayDate = formatDateKey(new Date()) === dKey;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(item.date)}
                  className={cn(
                    'min-h-[100px] sm:min-h-[120px] p-2 transition-all cursor-pointer flex flex-col justify-between hover:bg-violet-50/30',
                    !item.isCurrentMonth && 'bg-slate-50/40 text-slate-300 opacity-60',
                    isSelected && 'bg-violet-50/60 ring-2 ring-violet-500 inset-0 z-10',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center',
                        isTodayDate
                          ? 'bg-violet-600 text-white font-black'
                          : item.isCurrentMonth
                            ? 'text-slate-700'
                            : 'text-slate-400',
                      )}
                    >
                      {item.date.getDate()}
                    </span>
                    {daySchedules.length > 0 && (
                      <span className="text-[10px] font-black text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded-md">
                        {daySchedules.length}
                      </span>
                    )}
                  </div>

                  {/* Session Pills Preview */}
                  <div className="space-y-1 my-1">
                    {daySchedules.slice(0, 2).map((s) => (
                      <div
                        key={s.id}
                        className="bg-violet-50/80 border border-violet-200/70 rounded-lg px-2 py-1 text-[10px] font-extrabold text-slate-800 leading-tight space-y-0.5"
                      >
                        <p className="truncate text-violet-950 font-black">
                          {s.subject?.name || 'Class'}
                        </p>
                        <p className="text-[9px] text-slate-500 font-semibold truncate">
                          👤 {s.tutorName || 'Faculty'}
                        </p>
                        <p className="text-[9px] text-violet-700 font-mono font-bold">
                          {s.startsAt} – {s.endsAt}
                        </p>
                      </div>
                    ))}
                    {daySchedules.length > 2 && (
                      <p className="text-[9px] font-black text-violet-600 pl-0.5">
                        +{daySchedules.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List / Week View Cards */
        <div className="space-y-4">
          {Object.keys(sessionsByDate).length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <p className="text-xs font-bold text-slate-500">No scheduled classes found for this month.</p>
            </div>
          ) : (
            Object.entries(sessionsByDate).map(([dKey, sessions]) => (
              <div key={dKey} className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-slate-900">
                    {new Date(dKey + 'T00:00:00').toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                    })}
                  </span>
                  <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-100">
                    {sessions.length} sessions
                  </span>
                </div>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <TimetableSessionCard key={session.id} session={session} date={dKey} isFeeLocked={isFeeLocked} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentTimetablePage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <TimetableContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
