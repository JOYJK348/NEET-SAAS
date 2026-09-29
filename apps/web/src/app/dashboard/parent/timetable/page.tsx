'use client';

import { useMemo, useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type {
  StudentSessionDto,
  StudentTimetableResponseDto,
} from '@/features/student-dashboard/types/student-dashboard.types';
import { generateGoogleCalendarUrl } from '@/lib/google-calendar-url';
import { STALE_TIMES } from '@/lib/staleTimes';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Radio,
  RefreshCw,
  Video,
  CalendarDays,
  Grid,
  List,
  Users,
  BookOpen,
  Zap,
  FlaskConical,
  Dna,
  Search,
  X,
  BellRing,
  CheckCircle2,
  Sparkles,
  Filter,
  Check,
  CalendarCheck,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from 'sonner';

// ─── Delivery Mode Badge ──────────────────────────────────────────────────
function DeliveryModeBadge({ mode }: { mode: string | null }) {
  if (!mode) return null;
  const config = {
    ONLINE: {
      label: 'Online Live',
      cls: 'bg-sky-50 text-sky-800 border-sky-200',
      icon: <Video className="w-3 h-3 text-sky-600" />,
    },
    CLASSROOM: {
      label: 'Classroom',
      cls: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <MapPin className="w-3 h-3 text-amber-600" />,
    },
    HYBRID: {
      label: 'Hybrid Mode',
      cls: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: <Radio className="w-3 h-3 text-indigo-600" />,
    },
  }[mode] ?? {
    label: mode,
    cls: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: null,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-lg border shadow-2xs',
        config.cls,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Live Status Badge ─────────────────────────────────────────────────────
function LiveStatusBadge({ status }: { status: string }) {
  if (status === 'LIVE_NOW') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#F31260] text-white shadow-2xs uppercase tracking-wider animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
        LIVE NOW
      </span>
    );
  }
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      Upcoming
    </span>
  );
}

// ─── Subject Theme Helper ──────────────────────────────────────────────────
function getSubjectTheme(subjectName?: string) {
  const s = (subjectName || '').toLowerCase();
  if (s.includes('physic')) {
    return {
      cardBg: 'bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 border-blue-200 hover:border-blue-400',
      badgeBg: 'bg-blue-600 text-white',
      accentColor: 'text-[#0052CC]',
      icon: Zap,
    };
  }
  if (s.includes('chemist')) {
    return {
      cardBg: 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 border-emerald-200 hover:border-emerald-400',
      badgeBg: 'bg-emerald-600 text-white',
      accentColor: 'text-emerald-700',
      icon: FlaskConical,
    };
  }
  if (s.includes('biolog') || s.includes('botan') || s.includes('zoolo')) {
    return {
      cardBg: 'bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 border-rose-200 hover:border-rose-400',
      badgeBg: 'bg-rose-600 text-white',
      accentColor: 'text-rose-700',
      icon: Dna,
    };
  }
  return {
    cardBg: 'bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 border-purple-200 hover:border-purple-400',
    badgeBg: 'bg-purple-600 text-white',
    accentColor: 'text-purple-700',
    icon: BookOpen,
  };
}

function ParentTimetableCard({
  session,
  date,
  studentName,
}: {
  session: StudentSessionDto;
  date?: string;
  studentName: string;
}) {
  const subjectName = session.subject?.name ?? 'Subject Session';
  const theme = getSubjectTheme(subjectName);
  const isOnline = session.deliveryMode === 'ONLINE';

  const storageKey = `parent_cal_notified_${session.id || `${session.date}_${session.startsAt}`}`;
  const [isNotified, setIsNotified] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'true') {
        setIsNotified(true);
      }
    }
  }, [storageKey]);

  const handleNotifyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {}
    setIsNotified(true);
    toast.success('Opening Google Calendar to save class reminder notification!');
  };

  const formattedDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      })
    : session.dayOfWeek;

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 sm:p-5 space-y-3.5 transition-all duration-200 shadow-2xs hover:shadow-md bg-white relative overflow-hidden flex flex-col justify-between',
        theme.cardBg,
      )}
    >
      <div className="space-y-3">
        {/* Top Header Row: Subject Badge + Status + Delivery Mode */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wide flex items-center gap-1.5 shadow-2xs',
                theme.badgeBg,
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              {subjectName}
            </span>
            <LiveStatusBadge status={session.liveStatus} />
          </div>

          <DeliveryModeBadge mode={session.deliveryMode} />
        </div>

        {/* Timing & Batch Details */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50/90 border border-blue-200 text-[#0052CC] font-mono font-black text-sm flex items-center gap-1.5 shadow-2xs">
              <Clock className="w-4 h-4 text-[#0052CC] shrink-0" />
              <span>
                {session.startsAt} – {session.endsAt}
              </span>
            </div>

            {session.batch?.name && (
              <span className="text-xs font-bold text-slate-700 bg-slate-100/90 border border-slate-200 px-2.5 py-1.5 rounded-xl truncate max-w-[170px]">
                {session.batch.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold pt-1">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Faculty: <strong className="text-slate-900 font-bold">{session.tutorName || 'Assigned Tutor'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Calendar & Date */}
      <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2 flex-wrap text-xs">
        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          {formattedDate}
        </span>

        {isNotified ? (
          <button
            type="button"
            disabled
            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-[11px] border border-emerald-200 shadow-2xs flex items-center gap-1.5 opacity-90 cursor-default"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>✓ Reminded</span>
          </button>
        ) : (
          <a
            href={generateGoogleCalendarUrl({
              title: `[NEET Class] ${subjectName} - ${studentName}`,
              description: `📚 Subject: ${subjectName}\n🎓 Student: ${studentName}\n👥 Batch: ${session.batch?.name || 'NEET Batch'}\n👨‍🏫 Tutor: ${session.tutorName || 'Faculty'}\n⏰ Timings: ${session.startsAt} - ${session.endsAt}`,
              location: isOnline ? 'Online Live Studio' : 'Academy Classroom',
              startTime: session.startsAt,
              endTime: session.endsAt,
              dateStr: date || session.date,
              dayOfWeek: session.dayOfWeek,
              isRecurring: true,
            })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleNotifyClick}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-[#0052CC] font-extrabold text-[11px] border border-blue-200 hover:border-blue-400 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Set Google Calendar reminder for this class"
          >
            <BellRing className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
            <span>Set Reminder</span>
          </a>
        )}
      </div>
    </div>
  );
}

export default function ParentTimetablePage() {
  const { selectedChildId, selectedChild, isLoading: isSwitcherLoading } = useChildSwitcher();

  // Navigation Tabs: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL_UPCOMING'
  const [activeTab, setActiveTab] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL_UPCOMING'>('TODAY');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [deliveryModeFilter, setDeliveryModeFilter] = useState<'ALL' | 'ONLINE' | 'CLASSROOM'>('ALL');

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

  const {
    data: timetable,
    isLoading: isTimetableLoading,
    error,
    refetch,
  } = useQuery<StudentTimetableResponseDto>({
    queryKey: ['parent', 'timetable', selectedChildId, dateFrom, dateTo],
    queryFn: () => parentPortalService.getTimetable(selectedChildId!, dateFrom, dateTo),
    enabled: Boolean(selectedChildId),
    staleTime: STALE_TIMES.DEFAULT,
    placeholderData: keepPreviousData,
  });

  const isLoading = (isTimetableLoading && !timetable) || isSwitcherLoading;
  const studentName = selectedChild?.name || 'Student';

  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayKey = formatDateKey(new Date());
  const selectedDateKey = formatDateKey(selectedDate);

  // Extract subjects with counts for quick filter chips
  const subjectOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    if (timetable?.timetable) {
      for (const day of timetable.timetable) {
        (day.sessions || []).forEach((s) => {
          const name = s.subject?.name || 'General';
          counts[name] = (counts[name] || 0) + 1;
        });
      }
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [timetable]);

  // Filter sessions
  const filteredSessionsByDate = useMemo(() => {
    const map: Record<string, StudentSessionDto[]> = {};
    if (timetable?.timetable) {
      for (const day of timetable.timetable) {
        const filtered = (day.sessions || []).filter((s) => {
          const subj = (s.subject?.name || '').toLowerCase();
          const batch = (s.batch?.name || '').toLowerCase();
          const tutor = (s.tutorName || '').toLowerCase();
          const mode = (s.deliveryMode || '').toUpperCase();
          const q = searchQuery.toLowerCase().trim();

          const matchesSearch =
            !q || subj.includes(q) || batch.includes(q) || tutor.includes(q);

          const matchesSubject =
            selectedSubjectFilter === 'ALL' ||
            (s.subject?.name || '').toLowerCase() === selectedSubjectFilter.toLowerCase();

          const matchesMode =
            deliveryModeFilter === 'ALL' || mode === deliveryModeFilter;

          return matchesSearch && matchesSubject && matchesMode;
        });
        if (filtered.length > 0) {
          map[day.date] = filtered;
        }
      }
    }
    return map;
  }, [timetable, searchQuery, selectedSubjectFilter, deliveryModeFilter]);

  // Overall Stats
  const stats = useMemo(() => {
    const todays = filteredSessionsByDate[todayKey] || [];
    let liveNowCount = 0;
    let upcomingCount = 0;
    let totalClassesCount = 0;

    Object.entries(filteredSessionsByDate).forEach(([dKey, sessions]) => {
      totalClassesCount += sessions.length;
      sessions.forEach((s) => {
        if (s.liveStatus === 'LIVE_NOW') liveNowCount++;
        if (dKey >= todayKey && s.liveStatus === 'UPCOMING') upcomingCount++;
      });
    });

    return {
      todaysCount: todays.length,
      liveNowCount,
      upcomingCount,
      totalClassesCount,
    };
  }, [filteredSessionsByDate, todayKey]);

  // 7 Week Days Calculation (Week View)
  const currentWeekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const dayOfWeek = (curr.getDay() + 6) % 7;
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

  // Month Calendar Days Calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDay = (firstDay.getDay() + 6) % 7;

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remaining = 35 - days.length;
    for (let i = 1; i <= (remaining < 0 ? remaining + 7 : remaining); i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

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
    setActiveTab('TODAY');
  };

  const todaysClasses = filteredSessionsByDate[todayKey] || [];
  const selectedDayClasses = filteredSessionsByDate[selectedDateKey] || [];

  return (
    <div className="w-full space-y-5 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-24">
      {/* ── Top Header Banner ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-3xl shadow-2xs space-y-4 border border-blue-200">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Parent Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Class Timetable</span>
          </div>

          <button
            onClick={handleToday}
            className="px-4 py-1.5 rounded-xl border border-blue-200 bg-[#0052CC] text-white text-xs font-extrabold hover:bg-blue-700 transition shadow-2xs cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-[#0052CC] text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 shrink-0">
              {studentName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#0B2447] tracking-tight">
                  {studentName}&apos;s Timetable
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0052CC] text-[11px] font-bold">
                  {selectedChild?.admissionNumber || 'Student'}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                Track scheduled sessions, live classroom timings, and faculty assignments
              </p>
            </div>
          </div>

          {/* Quick Summary Pill Stats */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 bg-white rounded-xl border border-blue-100 shadow-2xs flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0052CC]" />
              <div className="text-left">
                <p className="text-[10px] text-slate-500 font-bold">Today</p>
                <p className="text-xs font-black text-[#0B2447]">{stats.todaysCount} Classes</p>
              </div>
            </div>

            {stats.liveNowCount > 0 && (
              <div className="px-3 py-1.5 bg-rose-50 rounded-xl border border-rose-200 shadow-2xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                <div className="text-left">
                  <p className="text-[10px] text-rose-600 font-bold">Live Now</p>
                  <p className="text-xs font-black text-rose-800">{stats.liveNowCount} Class</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Navigation View Tabs (User-Friendly & Clutter-Free) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('TODAY');
            setSelectedDate(new Date());
          }}
          className={cn(
            'py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer',
            activeTab === 'TODAY'
              ? 'bg-white text-[#0052CC] shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
          )}
        >
          <CalendarCheck className="w-4 h-4 text-[#0052CC]" />
          <span>Today ({stats.todaysCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('WEEK')}
          className={cn(
            'py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer',
            activeTab === 'WEEK'
              ? 'bg-white text-[#0052CC] shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
          )}
        >
          <Grid className="w-4 h-4 text-[#0052CC]" />
          <span>This Week</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MONTH')}
          className={cn(
            'py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer',
            activeTab === 'MONTH'
              ? 'bg-white text-[#0052CC] shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
          )}
        >
          <CalendarDays className="w-4 h-4 text-[#0052CC]" />
          <span>Month Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ALL_UPCOMING')}
          className={cn(
            'py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer',
            activeTab === 'ALL_UPCOMING'
              ? 'bg-white text-[#0052CC] shadow-xs font-black'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
          )}
        >
          <List className="w-4 h-4 text-[#0052CC]" />
          <span>All Classes ({stats.totalClassesCount})</span>
        </button>
      </div>

      {/* ── Smart Filters Bar (Search + Subject Pills + Delivery Mode) ── */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Top Row: Search Input + Delivery Mode Segment */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Box */}
          <div className="flex items-center gap-2 flex-1 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject, faculty or batch..."
              className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Delivery Mode Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
            <button
              onClick={() => setDeliveryModeFilter('ALL')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px]',
                deliveryModeFilter === 'ALL'
                  ? 'bg-white text-[#0052CC] font-black shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              All Modes
            </button>
            <button
              onClick={() => setDeliveryModeFilter('CLASSROOM')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px]',
                deliveryModeFilter === 'CLASSROOM'
                  ? 'bg-white text-amber-800 font-black shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Classroom 🏛️
            </button>
            <button
              onClick={() => setDeliveryModeFilter('ONLINE')}
              className={cn(
                'px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px]',
                deliveryModeFilter === 'ONLINE'
                  ? 'bg-white text-sky-800 font-black shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              Online 🎥
            </button>
          </div>
        </div>

        {/* Bottom Row: Subject Filter Pills */}
        {subjectOptions.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Subjects:
            </span>

            <button
              onClick={() => setSelectedSubjectFilter('ALL')}
              className={cn(
                'px-3 py-1 rounded-xl text-xs font-bold transition-all text-center shrink-0 cursor-pointer border',
                selectedSubjectFilter === 'ALL'
                  ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-2xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200',
              )}
            >
              All Subjects
            </button>

            {subjectOptions.map((subj) => (
              <button
                key={subj.name}
                onClick={() => setSelectedSubjectFilter(subj.name)}
                className={cn(
                  'px-3 py-1 rounded-xl text-xs font-bold transition-all text-center shrink-0 cursor-pointer border flex items-center gap-1.5',
                  selectedSubjectFilter.toLowerCase() === subj.name.toLowerCase()
                    ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-2xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200',
                )}
              >
                <span>{subj.name}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-extrabold',
                    selectedSubjectFilter.toLowerCase() === subj.name.toLowerCase()
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700',
                  )}
                >
                  {subj.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Main View Content ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <LoadingSpinner size="lg" />
          <span className="text-slate-500 text-xs font-bold">Loading timetable for {studentName}...</span>
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load timetable"
          message={error.message || 'Could not load timetable. Please try again.'}
          onRetry={refetch}
          variant="page"
        />
      ) : activeTab === 'TODAY' ? (
        /* ── TAB 1: TODAY'S CLASSES (Super Clean & Focused) ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h2 className="text-base font-black text-[#0B2447] flex items-center gap-2">
                <span>Today&apos;s Schedule</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0052CC] font-bold">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })}
                </span>
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {todaysClasses.length} {todaysClasses.length === 1 ? 'class scheduled' : 'classes scheduled'}
            </span>
          </div>

          {todaysClasses.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-2xs space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052CC] mx-auto flex items-center justify-center">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No classes scheduled for today</h3>
              <p className="text-xs text-slate-500">
                You can switch to <strong>This Week</strong> or <strong>Month Calendar</strong> to view upcoming classes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todaysClasses.map((session, idx) => (
                <ParentTimetableCard
                  key={`${session.id || 'today'}-${idx}`}
                  session={session}
                  date={todayKey}
                  studentName={studentName}
                />
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'WEEK' ? (
        /* ── TAB 2: THIS WEEK (Day-by-Day Selector) ── */
        <div className="space-y-4">
          {/* 7-Day Selector Bar */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
            {currentWeekDays.map((d, idx) => {
              const dKey = formatDateKey(d);
              const dayClasses = filteredSessionsByDate[dKey] || [];
              const isSelected = selectedDateKey === dKey;
              const isToday = todayKey === dKey;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(d)}
                  className={cn(
                    'p-2.5 rounded-xl transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center border',
                    isSelected
                      ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-md shadow-blue-500/20'
                      : isToday
                        ? 'bg-blue-50 text-[#0052CC] border-blue-200 font-black'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                  </span>
                  <span className="text-sm sm:text-base font-black">{d.getDate()}</span>
                  {dayClasses.length > 0 && (
                    <span
                      className={cn(
                        'text-[9.5px] font-extrabold px-1.5 py-0.2 rounded-full',
                        isSelected ? 'bg-white text-[#0052CC]' : 'bg-blue-100 text-[#0052CC]',
                      )}
                    >
                      {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-sm font-black text-[#0B2447] flex items-center gap-2">
              <span>Classes for</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052CC] border border-blue-200 text-xs font-extrabold">
                {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })}
              </span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {selectedDayClasses.length} {selectedDayClasses.length === 1 ? 'class' : 'classes'}
            </span>
          </div>

          {/* Selected Day Cards */}
          {selectedDayClasses.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-bold text-slate-500">
                No classes scheduled for {studentName} on this day.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDayClasses.map((session, idx) => (
                <ParentTimetableCard
                  key={`${session.id || 'week'}-${idx}`}
                  session={session}
                  date={selectedDateKey}
                  studentName={studentName}
                />
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'MONTH' ? (
        /* ── TAB 3: MONTH CALENDAR ── */
        <div className="space-y-4">
          {/* Month Header Switcher */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition cursor-pointer border border-slate-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-black text-[#0B2447] px-3">{monthName}</h3>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition cursor-pointer border border-slate-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Month Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="grid grid-cols-7 border-b border-blue-100 bg-blue-50/60 text-center font-black text-[11px] text-[#0052CC] uppercase tracking-wider py-2.5">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
              {calendarDays.map((item, idx) => {
                const dKey = formatDateKey(item.date);
                const dayClasses = filteredSessionsByDate[dKey] || [];
                const isSelected = selectedDateKey === dKey;
                const isToday = todayKey === dKey;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDate(item.date);
                    }}
                    className={cn(
                      'min-h-[70px] sm:min-h-[100px] p-2 transition-all cursor-pointer flex flex-col justify-between hover:bg-blue-50/40',
                      !item.isCurrentMonth && 'bg-slate-50/40 text-slate-300 opacity-60',
                      isSelected && 'bg-blue-50/80 ring-2 ring-[#0052CC] inset-0 z-10',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center',
                          isToday
                            ? 'bg-[#0052CC] text-white font-black'
                            : item.isCurrentMonth
                              ? 'text-[#0B2447]'
                              : 'text-slate-400',
                        )}
                      >
                        {item.date.getDate()}
                      </span>

                      {dayClasses.length > 0 && (
                        <span className="text-[10px] font-black text-[#0052CC] bg-blue-100 px-1.5 py-0.5 rounded-full border border-blue-200">
                          {dayClasses.length}
                        </span>
                      )}
                    </div>

                    {/* Preview chips on desktop */}
                    <div className="hidden sm:block space-y-1 my-1">
                      {dayClasses.slice(0, 2).map((s, sIdx) => (
                        <div
                          key={sIdx}
                          className="text-[9.5px] font-bold bg-white/90 border border-slate-200/80 rounded-md px-1.5 py-0.5 truncate text-slate-800"
                        >
                          {s.subject?.name || 'Class'} ({s.startsAt})
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Inspector below Calendar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-[#0B2447] uppercase tracking-wider">
                Classes on{' '}
                {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}:
              </span>
              <span className="text-xs font-bold text-slate-500">
                {selectedDayClasses.length} {selectedDayClasses.length === 1 ? 'class' : 'classes'}
              </span>
            </div>

            {selectedDayClasses.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No classes on this selected date.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedDayClasses.map((session, idx) => (
                  <ParentTimetableCard
                    key={`${session.id || 'month-sel'}-${idx}`}
                    session={session}
                    date={selectedDateKey}
                    studentName={studentName}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── TAB 4: ALL CLASSES (Grouped Date List) ── */
        <div className="space-y-4">
          {Object.keys(filteredSessionsByDate).length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-bold text-slate-500">
                No scheduled classes found matching your search & filters.
              </p>
            </div>
          ) : (
            Object.entries(filteredSessionsByDate).map(([dKey, sessions]) => (
              <div
                key={dKey}
                className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#0052CC]" />
                    <span className="text-xs font-black text-[#0B2447]">
                      {new Date(dKey + 'T00:00:00').toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {sessions.length} {sessions.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sessions.map((session, sIdx) => (
                    <ParentTimetableCard
                      key={`${session.id || 'list'}-${sIdx}`}
                      session={session}
                      date={dKey}
                      studentName={studentName}
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
