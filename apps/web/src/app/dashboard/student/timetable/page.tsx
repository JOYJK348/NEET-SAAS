'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStudentTimetable } from '@/features/student-dashboard/hooks/use-student-timetable';
import type { StudentSessionDto } from '@/features/student-dashboard/types/student-dashboard.types';
import { ErrorState } from '@/components/ui/error-state';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/lib/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
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
import { getClassStatus } from '@/lib/class-status';

function DeliveryModeBadge({ mode }: { mode: string | null }) {
  if (!mode) return null;
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    ONLINE: {
      label: 'Online Live',
      cls: 'bg-blue-50 text-[#0052CC] border border-blue-200',
      icon: <Video className="w-3 h-3 text-[#0052CC]" />,
    },
    CLASSROOM: {
      label: 'Campus Classroom',
      cls: 'bg-amber-50 text-amber-700 border border-amber-200',
      icon: <MapPin className="w-3 h-3 text-amber-600" />,
    },
    HYBRID: {
      label: 'Hybrid Mode',
      cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      icon: <Radio className="w-3 h-3 text-indigo-600" />,
    },
  };
  const cfg = map[mode] ?? {
    label: mode,
    cls: 'bg-slate-100 text-slate-600 border border-slate-200',
    icon: null,
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-2xs',
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
      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
        LIVE NOW
      </span>
    );
  }
  if (status === 'COMPLETED') {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
        Completed
      </span>
    );
  }
  return (
    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052CC] border border-blue-200">
      Upcoming
    </span>
  );
}

function TimetableSessionCard({
  session,
  date,
  isFeeLocked,
}: {
  session: StudentSessionDto;
  date?: string;
  isFeeLocked?: boolean;
}) {
  const router = useRouter();
  const subjectName = session.subject?.name ?? 'Subject Session';
  const initial = subjectName.charAt(0).toUpperCase();

  // Tick every 30 seconds so button state auto-updates when class time expires
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const statusInfo = useMemo(
    () => getClassStatus({ ...session, date: date || session.date }),
    [session, date, tick],
  );
  const isCancelled = statusInfo.isCancelled;
  const isLive = statusInfo.isLive;
  const canJoinNow = statusInfo.canJoin;

  const handleJoin = () => {
    if (isFeeLocked) {
      toast.error('Live class access is locked due to pending fee dues.');
      router.push('/dashboard/student/fees');
      return;
    }
    const targetUrl = `/dashboard/student/live/${session.id || 'demo-class-1'}`;
    router.push(targetUrl);
    if (typeof window !== 'undefined') {
      window.location.href = targetUrl;
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 space-y-3 shadow-2xs transition-all hover:border-blue-300 hover:shadow-xs w-full',
        isLive &&
          'border-emerald-300 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white ring-2 ring-emerald-400/30',
        isCancelled && 'border-rose-200 bg-rose-50/30 opacity-80',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC] flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
            {initial}
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-[#0B2447] text-xs sm:text-base leading-tight truncate">
              {subjectName}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#0052CC] font-bold font-mono">
              <Clock className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
              <span>
                {session.startsAt} – {session.endsAt}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <LiveStatusBadge status={statusInfo.isEnded ? 'COMPLETED' : session.liveStatus} />
        </div>
      </div>

      {/* Meta Tags */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {session.batch?.name && (
          <span className="inline-flex items-center gap-1 bg-blue-50/60 border border-blue-200/80 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-extrabold text-[#0B2447]">
            <Layers className="w-3 h-3 text-[#0052CC] shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-none">{session.batch.name}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-extrabold text-slate-700">
          <span className="text-slate-400">👤</span>
          <strong className="text-[#0B2447] font-black truncate max-w-[100px] sm:max-w-none">
            {session.tutorName || 'Faculty'}
          </strong>
        </span>
        <DeliveryModeBadge mode={session.deliveryMode} />
      </div>

      {/* Action Button */}
      {!isCancelled && (
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={handleJoin}
            disabled={!canJoinNow}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-150 min-h-[38px] shadow-2xs text-center cursor-pointer',
              canJoinNow
                ? isFeeLocked
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-rose-500/20 active:scale-98'
                  : 'bg-[#0052CC] hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-98'
                : 'bg-slate-100 border border-slate-200 text-slate-400 opacity-70 cursor-not-allowed',
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
                <span>{statusInfo.buttonLabel}</span>
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
    <div className="w-full pb-20 space-y-5 font-sans">
      {/* ── Top Header & Navigation Card (ISML LMS Light Theme) ──────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-[#0B2447] tracking-tight">
            Student Class Timetable
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Interactive schedule calendar for enrolled courses & live classes
          </p>
        </div>

        <button
          onClick={handleToday}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] text-xs font-extrabold hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          Today
        </button>
      </div>

      {/* ── View Mode Switcher & Refresh Bar (MONTH | WEEK | LIST) ─────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center p-1 bg-blue-50/80 rounded-2xl border border-blue-100 text-xs font-extrabold text-[#0B2447] shadow-2xs w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={() => setViewMode('MONTH')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer text-xs',
              viewMode === 'MONTH'
                ? 'bg-[#0052CC] text-white shadow-2xs font-black'
                : 'hover:text-[#0052CC] text-slate-700',
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>MONTH</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('WEEK')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer text-xs',
              viewMode === 'WEEK'
                ? 'bg-[#0052CC] text-white shadow-2xs font-black'
                : 'hover:text-[#0052CC] text-slate-700',
            )}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>WEEK</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('LIST')}
            className={cn(
              'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer text-xs',
              viewMode === 'LIST'
                ? 'bg-[#0052CC] text-white shadow-2xs font-black'
                : 'hover:text-[#0052CC] text-slate-700',
            )}
          >
            <List className="w-3.5 h-3.5" />
            <span>LIST</span>
          </button>
        </div>

        {/* Month Navigation & Refresh */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl p-1 bg-slate-50">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-[#0B2447] px-2 min-w-[120px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-[#0052CC] transition-all disabled:opacity-50 shadow-2xs cursor-pointer shrink-0"
            title="Refresh timetable"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Mobile Quick Day Inspector ────────────────────────────────────── */}
      <div className="block md:hidden bg-white rounded-2xl border border-slate-200/90 p-3.5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#0B2447] uppercase">Selected Date:</span>
          <span className="text-xs font-extrabold text-[#0052CC] bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
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
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-blue-100 bg-blue-50/60 text-center font-black text-[11px] text-[#0052CC] uppercase tracking-wider py-2.5">
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
                    'min-h-[90px] sm:min-h-[120px] p-1.5 sm:p-2 transition-all cursor-pointer flex flex-col justify-between hover:bg-blue-50/40',
                    !item.isCurrentMonth && 'bg-slate-50/40 text-slate-300 opacity-60',
                    isSelected && 'bg-blue-50/70 ring-2 ring-[#0052CC] inset-0 z-10',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center',
                        isTodayDate
                          ? 'bg-[#0052CC] text-white font-black'
                          : item.isCurrentMonth
                            ? 'text-[#0B2447]'
                            : 'text-slate-400',
                      )}
                    >
                      {item.date.getDate()}
                    </span>
                    {daySchedules.length > 0 && (
                      <span className="text-[10px] font-black text-[#0052CC] bg-blue-100 px-1.5 py-0.5 rounded-md border border-blue-200">
                        {daySchedules.length}
                      </span>
                    )}
                  </div>

                  {/* Session Pills Preview */}
                  <div className="space-y-1 my-1">
                    {daySchedules.slice(0, 2).map((s) => (
                      <div
                        key={s.id}
                        className="bg-blue-50/80 border border-blue-200/80 rounded-lg px-1.5 py-1 text-[10px] font-extrabold text-[#0B2447] leading-tight space-y-0.5"
                      >
                        <p className="truncate font-black text-[#0052CC]">
                          {s.subject?.name || 'Class'}
                        </p>
                        <p className="text-[9px] text-slate-600 font-semibold truncate hidden sm:block">
                          👤 {s.tutorName || 'Faculty'}
                        </p>
                        <p className="text-[9px] text-[#0052CC] font-mono font-bold truncate">
                          {s.startsAt} – {s.endsAt}
                        </p>
                      </div>
                    ))}
                    {daySchedules.length > 2 && (
                      <p className="text-[9px] font-black text-[#0052CC] pl-0.5">
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
              <p className="text-xs font-bold text-slate-500">
                No scheduled classes found for this month.
              </p>
            </div>
          ) : (
            Object.entries(sessionsByDate).map(([dKey, sessions]) => (
              <div
                key={dKey}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 space-y-3 shadow-2xs w-full"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-[#0B2447]">
                    {new Date(dKey + 'T00:00:00').toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                    })}
                  </span>
                  <span className="text-xs font-extrabold text-[#0052CC] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {sessions.length} sessions
                  </span>
                </div>
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <TimetableSessionCard
                      key={session.id}
                      session={session}
                      date={dKey}
                      isFeeLocked={isFeeLocked}
                    />
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
