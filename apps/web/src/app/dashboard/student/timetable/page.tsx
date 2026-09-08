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
  Users,
  Lock,
  BookOpen,
  Zap,
  FlaskConical,
  Dna,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading';
import { toast } from 'sonner';
import { getClassStatus } from '@/lib/class-status';

// ─── Delivery Mode Badge (Tenant Admin Vibrant Mild Theme) ───────────────────
function DeliveryModeBadge({ mode }: { mode: string | null }) {
  if (!mode) return null;
  const config = {
    ONLINE: {
      label: 'Online Live',
      cls: 'bg-sky-100/90 text-sky-800 border-sky-300',
      icon: <Video className="w-3 h-3 text-sky-700" />,
    },
    CLASSROOM: {
      label: 'Campus Classroom',
      cls: 'bg-amber-100/90 text-amber-800 border-amber-300',
      icon: <MapPin className="w-3 h-3 text-amber-700" />,
    },
    HYBRID: {
      label: 'Hybrid Mode',
      cls: 'bg-indigo-100/90 text-indigo-800 border-indigo-300',
      icon: <Radio className="w-3 h-3 text-indigo-700" />,
    },
  }[mode] ?? {
    label: mode,
    cls: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: null,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs',
        config.cls,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Live Status Badge ────────────────────────────────────────────────────────
function LiveStatusBadge({ status }: { status: string }) {
  if (status === 'LIVE_NOW') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#F31260] text-white shadow-2xs uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        LIVE NOW
      </span>
    );
  }
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-300 shadow-2xs">
      Upcoming
    </span>
  );
}

// ─── Subject Theme Helper (Light Mild Color Palette) ──────────────────────────
function getSubjectTheme(subjectName?: string) {
  const s = (subjectName || '').toLowerCase();
  if (s.includes('physic')) {
    return {
      cardBg: 'bg-[#EFF6FF] border-blue-200/90 hover:border-[#0052CC]/60 hover:shadow-xs',
      badgeBg: 'bg-[#0052CC] text-white',
      timeBadge: 'bg-white/90 text-[#0052CC] border-blue-200',
      pillBg: 'bg-white/80 text-blue-900 border-blue-200/70',
      titleColor: 'text-[#0B2447]',
      icon: Zap,
    };
  }
  if (s.includes('chemist')) {
    return {
      cardBg: 'bg-[#ECFDF5] border-emerald-200/90 hover:border-emerald-500/60 hover:shadow-xs',
      badgeBg: 'bg-emerald-600 text-white',
      timeBadge: 'bg-white/90 text-emerald-700 border-emerald-200',
      pillBg: 'bg-white/80 text-emerald-950 border-emerald-200/70',
      titleColor: 'text-[#064E3B]',
      icon: FlaskConical,
    };
  }
  if (s.includes('biolog') || s.includes('botan') || s.includes('zoolo')) {
    return {
      cardBg: 'bg-[#FFF1F2] border-rose-200/90 hover:border-rose-500/60 hover:shadow-xs',
      badgeBg: 'bg-rose-600 text-white',
      timeBadge: 'bg-white/90 text-rose-700 border-rose-200',
      pillBg: 'bg-white/80 text-rose-950 border-rose-200/70',
      titleColor: 'text-[#881337]',
      icon: Dna,
    };
  }
  return {
    cardBg: 'bg-[#F5F3FF] border-purple-200/90 hover:border-purple-500/60 hover:shadow-xs',
    badgeBg: 'bg-purple-600 text-white',
    timeBadge: 'bg-white/90 text-purple-700 border-purple-200',
    pillBg: 'bg-white/80 text-purple-950 border-purple-200/70',
    titleColor: 'text-[#4C1D95]',
    icon: BookOpen,
  };
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
  const theme = getSubjectTheme(subjectName);

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
        'rounded-2xl border p-3.5 sm:p-4 space-y-2.5 transition-all shadow-2xs w-full',
        theme.cardBg,
        isLive &&
          'bg-gradient-to-r from-emerald-100/90 via-teal-50 to-white border-emerald-400 ring-2 ring-emerald-400/30 shadow-md',
        isCancelled && 'border-rose-200 bg-rose-50/50 opacity-80',
      )}
    >
      {/* Top Header Row: Subject Title + Status + Delivery Mode */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h4 className={cn('font-extrabold text-xs sm:text-base leading-tight truncate', theme.titleColor)}>
            {subjectName}
          </h4>
          <LiveStatusBadge status={statusInfo.isEnded ? 'COMPLETED' : session.liveStatus} />
        </div>

        <div className="shrink-0">
          <DeliveryModeBadge mode={session.deliveryMode} />
        </div>
      </div>

      {/* Middle Meta Chips Row (Distinct Light Mild Colors) */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium pt-0.5">
        {/* Time Chip - Soft Royal Blue */}
        <span className="font-mono font-black text-[#0052CC] bg-blue-100/90 border border-blue-300 px-2.5 py-0.5 rounded-lg shadow-2xs flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#0052CC] shrink-0" />
          <span>
            {session.startsAt} – {session.endsAt}
          </span>
        </span>

        {/* Batch Chip - Soft Purple */}
        {session.batch?.name && (
          <span className="font-extrabold text-purple-900 bg-purple-100/90 border border-purple-300 px-2.5 py-0.5 rounded-lg truncate max-w-[160px] shadow-2xs">
            {session.batch.name}
          </span>
        )}

        {/* Faculty Chip - Soft Amber Gold */}
        <span className="font-extrabold text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
          <Users className="w-3 h-3 text-amber-700 shrink-0" />
          <span>{session.tutorName || 'Faculty'}</span>
        </span>
      </div>

      {/* Action Footer Row */}
      {!isCancelled && (
        <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
          <button
            onClick={handleJoin}
            disabled={!canJoinNow}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-150 min-h-[38px] shadow-2xs text-center cursor-pointer truncate',
              canJoinNow
                ? isFeeLocked
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 active:scale-98'
                  : 'bg-[#0052CC] hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-98'
                : 'bg-teal-50/90 text-teal-800 border border-teal-200/90 font-extrabold cursor-not-allowed opacity-90',
            )}
          >
            {isFeeLocked && canJoinNow ? (
              <span className="flex items-center gap-1.5 truncate">
                <Lock className="w-3.5 h-3.5 text-white" />
                <span>Fee Due</span>
              </span>
            ) : (
              <>
                <Video className="w-4 h-4 shrink-0" />
                <span className="truncate">{statusInfo.buttonLabel}</span>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');

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

  // Filtered Subject List for Pills
  const subjectList = useMemo(() => {
    const defaultSubjects = ['Physics', 'Chemistry', 'Biology', 'Botany', 'Zoology'];
    const set = new Set<string>(defaultSubjects);
    if (timetable?.timetable) {
      for (const day of timetable.timetable) {
        (day.sessions || []).forEach((s) => {
          if (s.subject?.name) set.add(s.subject.name);
        });
      }
    }
    return Array.from(set);
  }, [timetable]);

  // Filtered Sessions Grouped By Date
  const filteredSessionsByDate = useMemo(() => {
    const map: Record<string, StudentSessionDto[]> = {};
    if (timetable?.timetable) {
      for (const day of timetable.timetable) {
        const filtered = (day.sessions || []).filter((s) => {
          const subj = (s.subject?.name || '').toLowerCase();
          const batch = (s.batch?.name || '').toLowerCase();
          const tutor = (s.tutorName || '').toLowerCase();
          const mode = (s.deliveryMode || '').toLowerCase();
          const q = searchQuery.toLowerCase().trim();

          const matchesSearch =
            !q || subj.includes(q) || batch.includes(q) || tutor.includes(q) || mode.includes(q);

          const matchesSubject =
            selectedSubjectFilter === 'ALL' ||
            (s.subject?.name || '').toLowerCase() === selectedSubjectFilter.toLowerCase();

          return matchesSearch && matchesSubject;
        });
        if (filtered.length > 0) {
          map[day.date] = filtered;
        }
      }
    }
    return map;
  }, [timetable, searchQuery, selectedSubjectFilter]);

  // Calendar Days Calculation (Month View)
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

  // 7 Week Days Calculation (Week View)
  const currentWeekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const dayOfWeek = (curr.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOfWeek);

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  }, [selectedDate]);

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
  const selectedDaySchedules = filteredSessionsByDate[selectedDateKey] || [];

  return (
    <div className="w-full pb-20 space-y-4 font-sans">
      {/* ── Top Header Banner (ISML Light Theme) ──────────── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-5 rounded-2xl shadow-2xs border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Student Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Class Timetable</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B2447] tracking-tight">
            Class Timetable & Schedule
          </h1>
          <p className="text-xs font-medium text-slate-600">
            Interactive schedule calendar for enrolled courses & live classes
          </p>
        </div>

        <button
          onClick={handleToday}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-blue-200 bg-[#0052CC] text-white text-xs font-extrabold hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          Today
        </button>
      </div>

      {/* ── Search & Filter Toolbar ───────────────────────────────────────── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          <div className="flex items-center gap-2 flex-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subject, faculty, or batch..."
              className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Subject Pills */}
          {subjectList.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-[11px] font-bold">
              <button
                onClick={() => setSelectedSubjectFilter('ALL')}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center shrink-0 cursor-pointer',
                  selectedSubjectFilter === 'ALL'
                    ? 'bg-[#0052CC] text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200',
                )}
              >
                All
              </button>
              {subjectList.map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubjectFilter(subj)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center shrink-0 cursor-pointer',
                    selectedSubjectFilter.toLowerCase() === subj.toLowerCase()
                      ? 'bg-[#0052CC] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200',
                  )}
                >
                  {subj}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── View Mode Switcher & Navigation Bar (MONTH | WEEK | LIST) ─────────── */}
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

      {/* ── Day Inspector (Selected Date Sessions Card) ────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider">
            Selected Date:
          </span>
          <span className="text-xs font-black text-[#0052CC] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            {selectedDate.toLocaleDateString('en-IN', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>

        {selectedDaySchedules.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-xs font-bold text-slate-500">
              No classes scheduled for this date.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDaySchedules.map((session, idx) => (
              <TimetableSessionCard
                key={`${session.id || 'sel'}-${idx}`}
                session={session}
                date={selectedDateKey}
                isFeeLocked={isFeeLocked}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Main Calendar Grid / Week / List View Modes ───────────────────── */}
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
        /* Month View Grid (Zero Text Overlap on Mobile) */
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
              const daySchedules = filteredSessionsByDate[dKey] || [];
              const isSelected = formatDateKey(selectedDate) === dKey;
              const isTodayDate = formatDateKey(new Date()) === dKey;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(item.date)}
                  className={cn(
                    'min-h-[60px] sm:min-h-[110px] p-1.5 sm:p-2 transition-all cursor-pointer flex flex-col justify-between hover:bg-blue-50/40',
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

                    {/* Badge Count (Mobile & Desktop) */}
                    {daySchedules.length > 0 && (
                      <span className="text-[10px] font-black text-[#0052CC] bg-blue-100 px-1.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                        {daySchedules.length}
                      </span>
                    )}
                  </div>

                  {/* Desktop Session Cards Preview (Hidden on Mobile to Prevent Overlap) */}
                  <div className="hidden sm:block space-y-1 my-1">
                    {daySchedules.slice(0, 2).map((s, sIdx) => {
                      const sTheme = getSubjectTheme(s.subject?.name);
                      return (
                        <div
                          key={`${s.id || 'pill'}-${sIdx}`}
                          className={cn(
                            'border rounded-lg px-1.5 py-1 text-[10px] font-extrabold leading-tight space-y-0.5 truncate',
                            sTheme.cardBg,
                          )}
                        >
                          <p className={cn('truncate font-black', sTheme.titleColor)}>
                            {s.subject?.name || 'Class'}
                          </p>
                          <p className="text-[9px] text-[#0052CC] font-mono font-bold truncate">
                            {s.startsAt} – {s.endsAt}
                          </p>
                        </div>
                      );
                    })}
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
      ) : viewMode === 'WEEK' ? (
        /* Dedicated Week View (Horizontal Day Selector + Spacious Sessions) */
        <div className="space-y-4">
          {/* 7-Day Horizontal Pill Selector */}
          <div className="grid grid-cols-7 gap-1.5 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
            {currentWeekDays.map((d, idx) => {
              const dKey = formatDateKey(d);
              const daySchedules = filteredSessionsByDate[dKey] || [];
              const isSelected = formatDateKey(selectedDate) === dKey;
              const isTodayDate = formatDateKey(new Date()) === dKey;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(d)}
                  className={cn(
                    'p-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center border',
                    isSelected
                      ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-2xs'
                      : isTodayDate
                        ? 'bg-blue-50 text-[#0052CC] border-blue-200 font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                  )}
                >
                  <span className="text-[10px] font-bold uppercase">
                    {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                  <span className="text-xs sm:text-sm font-black">{d.getDate()}</span>
                  {daySchedules.length > 0 && (
                    <span
                      className={cn(
                        'text-[9px] font-black px-1.5 py-0.2 rounded-full',
                        isSelected ? 'bg-white text-[#0052CC]' : 'bg-blue-100 text-[#0052CC]',
                      )}
                    >
                      {daySchedules.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Week Day Session Cards */}
          <div className="space-y-3">
            {selectedDaySchedules.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <p className="text-xs font-bold text-slate-500">
                  No classes scheduled for{' '}
                  {selectedDate.toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'short',
                  })}
                  .
                </p>
              </div>
            ) : (
              selectedDaySchedules.map((session, idx) => (
                <TimetableSessionCard
                  key={`${session.id || 'week'}-${idx}`}
                  session={session}
                  date={selectedDateKey}
                  isFeeLocked={isFeeLocked}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {Object.keys(filteredSessionsByDate).length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-bold text-slate-500">
                No scheduled classes found matching your criteria.
              </p>
            </div>
          ) : (
            Object.entries(filteredSessionsByDate).map(([dKey, sessions]) => (
              <div
                key={dKey}
                className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 space-y-3 shadow-2xs w-full"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-[#0B2447]">
                    {new Date(dKey + 'T00:00:00').toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-xs font-extrabold text-[#0052CC] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
                  </span>
                </div>
                <div className="space-y-3">
                  {sessions.map((session, idx) => (
                    <TimetableSessionCard
                      key={`${session.id || 'list'}-${idx}`}
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
