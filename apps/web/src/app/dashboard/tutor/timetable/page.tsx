'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Filter,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Grid,
  List,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorTimetable } from '@/features/tutor-dashboard/hooks/use-tutor-timetable';
import { useWeeklyView } from '@/features/scheduling/hooks/use-schedules';
import { ScheduleSlotCard } from '@/features/scheduling/components/ScheduleSlotCard';
import {
  SessionOverrideDrawer,
  SessionAction,
} from '@/features/scheduling/components/SessionOverrideDrawer';
import { SessionHistoryDrawer } from '@/features/scheduling/components/SessionHistoryDrawer';
import { useTutorBatches } from '@/features/tutor-dashboard/hooks/use-tutor-batches';
import { useTutors } from '@/features/tutors/hooks/use-tutors';
import { useSubjects } from '@/features/master-data/hooks/use-subjects';
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  WEEKDAY_FULL_LABELS,
  WeeklyViewData,
  ScheduleDetail,
  WeekdayType,
} from '@/features/scheduling/types/schedule.types';

// Compact label for header days
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

const DAY_INDEX: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

interface FilterState {
  batchId: string;
  staffProfileId: string;
  subjectId: string;
}

function TutorTimetableCalendarContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'LIST'>('LIST');

  // Calendar Date Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [filters, setFilters] = useState<FilterState>({
    batchId: '',
    staffProfileId: '',
    subjectId: '',
  });

  // Session override state
  const [overrideAction, setOverrideAction] = useState<SessionAction | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleDetail | null>(null);
  const [historySchedule, setHistorySchedule] = useState<ScheduleDetail | null>(null);

  // Fetch logged-in tutor's exact timetable sessions
  const { timetable, isLoading, error, refetch } = useTutorTimetable();

  // Fetch logged-in tutor's exact assigned batches for filtering
  const { batches: tutorBatchesData } = useTutorBatches();
  const { data: subjectsData } = useSubjects({ limit: 100 });

  const batches = useMemo(() => {
    const list = tutorBatchesData?.batches ?? [];
    return list
      .filter((a) => a.batch !== null)
      .map((a) => ({
        id: a.batch!.id,
        name: a.batch!.name,
        code: a.batch!.code,
      }));
  }, [tutorBatchesData]);

  const subjects = (subjectsData?.data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    shortName: s.code || s.name.slice(0, 3).toUpperCase(),
  }));

  const tutors = user
    ? [
        {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          employeeCode: '',
          subjects: [],
        },
      ]
    : [];

  const isError = !!error;

  const setFilter = (key: keyof FilterState, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  // Convert tutor's timetable response into WeeklyViewData structure
  const weekly = useMemo(() => {
    const emptyWeekly: WeeklyViewData = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
    };

    if (!timetable?.timetable) return emptyWeekly;

    for (const day of timetable.timetable) {
      const date = new Date(day.date + 'T00:00:00');
      const dayNames: WeekdayType[] = [
        'SUNDAY',
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
      ];
      const dayKey = dayNames[date.getDay()];

      if (emptyWeekly[dayKey]) {
        const mappedSessions: any[] = day.sessions.map((s) => ({
          id: s.id,
          tenantId: '',
          batchId: s.batch?.id || '',
          batchName: s.batch?.name || '',
          subjectId: s.subject?.id || '',
          subjectName: s.subject?.name || '',
          branchId: s.branch?.id || '',
          staffProfileId: user?.id || '',
          dayOfWeek: dayKey,
          startTime: s.startsAt,
          endTime: s.endsAt,
          deliveryMode: (s as any).deliveryMode || 'CLASSROOM',
          roomId: null,
          meetingLink: null,
          meetingProvider: null,
          effectiveFrom: day.date,
          effectiveTo: null,
          isActive: true,
          createdAt: day.date,
          updatedAt: day.date,
        }));

        emptyWeekly[dayKey] = [...emptyWeekly[dayKey], ...mappedSessions];
      }
    }

    // Apply client filters if selected
    if (filters.batchId || filters.subjectId) {
      for (const dayKey of Object.keys(emptyWeekly) as WeekdayType[]) {
        emptyWeekly[dayKey] = emptyWeekly[dayKey].filter((s) => {
          if (filters.batchId && s.batchId !== filters.batchId) return false;
          if (filters.subjectId && s.subjectId !== filters.subjectId) return false;
          return true;
        });
      }
    }

    return emptyWeekly;
  }, [timetable, filters, user]);

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  // Generate Month Grid Dates
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

    // Next month padding to complete 35/42 grid
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
  };

  // Get schedules for a specific date
  const getSchedulesForDate = (date: Date) => {
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayKey = dayNames[date.getDay()] as WeekdayType;
    return weekly[dayKey] || [];
  };

  const selectedDayKey = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ][selectedDate.getDay()] as WeekdayType;
  const selectedDaySchedules = weekly[selectedDayKey] || [];

  const handleSessionAction = (action: SessionAction, schedule: ScheduleDetail) => {
    setOverrideAction(action);
    setSelectedSchedule(schedule);
  };

  const handleSessionHistory = (schedule: ScheduleDetail) => {
    setHistorySchedule(schedule);
  };

  const handleOverrideClose = () => {
    setOverrideAction(null);
    setSelectedSchedule(null);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 sm:p-6 space-y-6 text-[#111827]">
      {/* ── Top Centered Header (Matches Courses & Batches Style) ────────────── */}
      <div className="text-center max-w-xl mx-auto space-y-1 my-2">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">
          Faculty Schedule & Timetable
        </h1>
        <p className="text-xs font-bold text-slate-500">
          Interactive calendar view for assigned sessions & schedules
        </p>
      </div>

      {/* ── View Mode Switcher Pills (MONTH | WEEK | LIST) & Attendance Workload Link ──── */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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

      {/* Calendar Month Navigator & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        {/* Month Navigation */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full lg:w-auto">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-xs font-bold hover:bg-violet-100 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-black text-slate-900 min-w-[130px] sm:min-w-[140px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters Bar (Only All Batches needed for Tutor) */}
        <div className="flex items-center gap-2 text-xs w-full lg:w-auto">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Batch:</span>
          </div>

          <select
            value={filters.batchId}
            onChange={(e) => setFilter('batchId', e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-violet-500 transition-colors cursor-pointer"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {filters.batchId && (
            <button
              onClick={() => setFilters({ batchId: '', staffProfileId: '', subjectId: '' })}
              className="text-xs text-violet-600 hover:underline font-bold px-2 py-1"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* MOBILE QUICK DAY SELECTOR */}
      <div className="block md:hidden bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
            📅 {selectedDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </span>
          <button
            onClick={handleToday}
            className="text-[11px] font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {WEEKDAYS.map((day) => {
            const count = weekly[day]?.length ?? 0;
            const isSelected = selectedDayKey === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  const nextDate = new Date();
                  const targetDay = DAY_INDEX[day];
                  const diff = (targetDay - nextDate.getDay() + 7) % 7;
                  nextDate.setDate(nextDate.getDate() + diff);
                  setSelectedDate(nextDate);
                }}
                className={`flex flex-col items-center min-w-[58px] py-2 px-2.5 rounded-xl border transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <span className="text-[10px] font-extrabold uppercase opacity-80">
                  {DAY_SHORT[day]}
                </span>
                <span className="text-xs font-black mt-0.5">{WEEKDAY_LABELS[day]}</span>
                {count > 0 && (
                  <span
                    className={`text-[9px] mt-1 font-black px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-violet-100 text-violet-800'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
          <span className="text-slate-500 text-sm font-medium">Loading schedule calendar...</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="text-slate-700 text-sm font-semibold">Failed to load timetable</p>
          <button
            onClick={() => refetch()}
            className="text-xs text-violet-600 hover:underline font-bold"
          >
            Try again
          </button>
        </div>
      )}

      {/* MAIN CALENDAR DISPLAY */}
      {!isLoading && !isError && (
        <>
          {/* VIEW MODE 1: MONTH CALENDAR GRID */}
          {viewMode === 'MONTH' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              {/* Main Calendar Grid (3 columns wide) */}
              <div className="lg:col-span-3 bg-gradient-to-br from-white via-slate-50/60 to-violet-50/30 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden backdrop-blur-md">
                {/* Days of week header */}
                <div className="grid grid-cols-7 border-b border-slate-200/80 bg-gradient-to-r from-slate-100/90 via-slate-50 to-violet-50/70 text-center text-[10px] sm:text-xs font-black text-slate-700 py-2.5 sm:py-3.5 uppercase tracking-wider">
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div className="text-violet-700 font-extrabold">Sat</div>
                  <div className="text-rose-700 font-extrabold">Sun</div>
                </div>

                {/* 35/42 Real Calendar Grid */}
                <div className="grid grid-cols-7 divide-x divide-y divide-slate-200/60 bg-slate-200/30">
                  {calendarDays.map((item, idx) => {
                    const dateSchedules = getSchedulesForDate(item.date);
                    const isSelected = selectedDate.toDateString() === item.date.toDateString();
                    const isToday = new Date().toDateString() === item.date.toDateString();

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDate(item.date)}
                        className={`min-h-[70px] sm:min-h-[135px] p-1.5 sm:p-2.5 transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                          item.isCurrentMonth
                            ? isToday
                              ? 'bg-gradient-to-b from-violet-100/60 via-violet-50/30 to-white'
                              : isSelected
                                ? 'bg-violet-50/80'
                                : 'bg-white/90 hover:bg-violet-50/30'
                            : 'bg-slate-100/50 text-slate-400'
                        } ${isSelected ? 'ring-2 ring-violet-600 ring-inset shadow-xs' : ''}`}
                      >
                        {/* Day Header & Badges */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] sm:text-xs font-black w-5 h-5 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center transition-all ${
                              isToday
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30 scale-105 sm:scale-110'
                                : isSelected
                                  ? 'bg-violet-100 text-violet-900 border border-violet-300 font-black'
                                  : item.isCurrentMonth
                                    ? 'text-slate-800 group-hover:text-violet-700 font-extrabold'
                                    : 'text-slate-400 font-semibold'
                            }`}
                          >
                            {item.date.getDate()}
                          </span>

                          {dateSchedules.length > 0 && (
                            <span className="text-[8px] sm:text-[10px] font-black text-white bg-violet-600 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full shadow-2xs">
                              {dateSchedules.length}
                            </span>
                          )}
                        </div>

                        {/* Class Event Cards */}
                        <div className="space-y-1 sm:space-y-1.5 mt-1 sm:mt-2 flex-1 flex flex-col justify-start">
                          {dateSchedules.slice(0, 2).map((sch: ScheduleDetail, sIdx: number) => {
                            const subName =
                              subjects.find((s) => s.id === sch.subjectId)?.name || 'Class';
                            const tutorName = tutors.find(
                              (t) => t.id === sch.staffProfileId,
                            )?.firstName;

                            let badgeStyle = 'bg-violet-50 text-violet-900 border-violet-200/80';
                            let timeBadge = 'bg-violet-100/80 text-violet-800';
                            let dotBg = 'bg-violet-600';

                            if (subName.toLowerCase().includes('physics')) {
                              badgeStyle = 'bg-sky-50 text-sky-950 border-sky-200/80';
                              timeBadge = 'bg-sky-100 text-sky-900';
                              dotBg = 'bg-sky-600';
                            } else if (subName.toLowerCase().includes('chemistry')) {
                              badgeStyle = 'bg-emerald-50 text-emerald-950 border-emerald-200/80';
                              timeBadge = 'bg-emerald-100 text-emerald-900';
                              dotBg = 'bg-emerald-600';
                            } else if (subName.toLowerCase().includes('biology')) {
                              badgeStyle = 'bg-amber-50 text-amber-950 border-amber-200/80';
                              timeBadge = 'bg-amber-100 text-amber-900';
                              dotBg = 'bg-amber-600';
                            } else if (subName.toLowerCase().includes('math')) {
                              badgeStyle = 'bg-rose-50 text-rose-950 border-rose-200/80';
                              timeBadge = 'bg-rose-100 text-rose-900';
                              dotBg = 'bg-rose-600';
                            }

                            return (
                              <div key={sch.id || sIdx}>
                                {/* Mobile View Compact Chip (< sm) */}
                                <div
                                  className={`sm:hidden text-[8px] font-extrabold px-1 py-0.5 rounded-md ${badgeStyle} truncate flex items-center gap-1 border`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${dotBg} flex-shrink-0`}
                                  />
                                  <span className="truncate">{subName}</span>
                                </div>

                                {/* Desktop View Full Card (>= sm) */}
                                <div
                                  className={`hidden sm:block text-[10px] font-bold p-2 rounded-xl border ${badgeStyle} shadow-2xs space-y-1 hover:brightness-95 transition-all`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-extrabold truncate text-slate-900 text-[10.5px]">
                                      {subName}
                                    </span>
                                    <span className="text-[8.5px] font-extrabold uppercase text-slate-500 bg-white/70 px-1 py-0.2 rounded border border-slate-200/60">
                                      {DAY_SHORT[sch.dayOfWeek] || sch.dayOfWeek.slice(0, 3)}
                                    </span>
                                  </div>

                                  <div
                                    className={`flex items-center justify-between px-1.5 py-0.5 rounded-md font-mono text-[9px] font-bold ${timeBadge}`}
                                  >
                                    <span>{sch.startTime}</span>
                                    <span>-</span>
                                    <span>{sch.endTime}</span>
                                  </div>

                                  {tutorName && (
                                    <p className="text-[9px] text-slate-600 truncate font-semibold pt-0.5 border-t border-slate-200/40">
                                      Tutor: <strong className="text-slate-900">{tutorName}</strong>
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {dateSchedules.length > 2 && (
                            <div className="mt-auto text-right">
                              <span className="text-[7.5px] sm:text-[9px] font-bold text-violet-700 bg-violet-50 px-1 sm:px-2 py-0.2 sm:py-0.5 rounded-md border border-violet-200 inline-block">
                                +{dateSchedules.length - 2}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Side Panel: Selected Date Class Roster */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 space-y-4 shadow-xs h-fit">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-violet-600" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {selectedDate.toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </h3>
                      <p className="text-[11px] font-bold text-violet-700 uppercase">
                        {selectedDate.toLocaleDateString('en-IN', { weekday: 'long' })}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-violet-800 bg-violet-50 border border-violet-100 px-3 py-1 rounded-full">
                    {selectedDaySchedules.length}{' '}
                    {selectedDaySchedules.length === 1 ? 'Class' : 'Classes'}
                  </span>
                </div>

                {selectedDaySchedules.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 max-h-[550px] overflow-y-auto pr-0.5">
                    {selectedDaySchedules.map((s: ScheduleDetail) => (
                      <ScheduleSlotCard
                        key={s.id}
                        schedule={s}
                        subjectName={(s as any).subjectName || subjects.find((sub) => sub.id === s.subjectId)?.name}
                        batchName={(s as any).batchName || batches.find((b) => b.id === s.batchId)?.name || 'NEET Repeaters 2027'}
                        tutorName={tutors.find((t) => t.id === s.staffProfileId)?.firstName || user?.firstName}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Clock className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No classes for this date</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Tap any date on the calendar strip above to inspect classes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: WEEK DAY CAROUSEL */}
          {viewMode === 'WEEK' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {WEEKDAYS.map((day) => {
                  const daySchedules = weekly[day] || [];
                  const isSelected = selectedDayKey === day;

                  return (
                    <div
                      key={day}
                      onClick={() => {
                        const nextDate = new Date();
                        const targetDay = DAY_INDEX[day];
                        const diff = (targetDay - nextDate.getDay() + 7) % 7;
                        nextDate.setDate(nextDate.getDate() + diff);
                        setSelectedDate(nextDate);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/20 scale-[1.02]'
                          : 'bg-white border-slate-200/80 hover:border-violet-200 text-slate-700 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-extrabold uppercase ${isSelected ? 'text-violet-100' : 'text-slate-400'}`}
                        >
                          {DAY_SHORT[day]}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {daySchedules.length}
                        </span>
                      </div>
                      <p className="text-sm font-black tracking-tight">{WEEKDAY_LABELS[day]}</p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    <h3 className="text-sm font-black text-slate-900">
                      Schedules for {WEEKDAY_FULL_LABELS[selectedDayKey]}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {selectedDaySchedules.length} Classes Scheduled
                  </span>
                </div>

                {selectedDaySchedules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedDaySchedules.map((s: ScheduleDetail) => (
                      <ScheduleSlotCard
                        key={s.id}
                        schedule={s}
                        subjectName={(s as any).subjectName || subjects.find((sub) => sub.id === s.subjectId)?.name}
                        batchName={(s as any).batchName || batches.find((b) => b.id === s.batchId)?.name || 'NEET Repeaters 2027'}
                        tutorName={tutors.find((t) => t.id === s.staffProfileId)?.firstName || user?.firstName}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Clock className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">No classes scheduled</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE 3: AGENDA LIST VIEW */}
          {viewMode === 'LIST' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-6">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">
                Full Weekly Class Agenda
              </h3>
              <div className="space-y-6">
                {WEEKDAYS.map((day) => {
                  const daySchedules = weekly[day] || [];
                  if (daySchedules.length === 0) return null;

                  return (
                    <div key={day} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-lg uppercase">
                          {WEEKDAY_FULL_LABELS[day]}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {daySchedules.length} {daySchedules.length === 1 ? 'class' : 'classes'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {daySchedules.map((s: ScheduleDetail) => (
                          <ScheduleSlotCard
                            key={s.id}
                            schedule={s}
                            subjectName={(s as any).subjectName || subjects.find((sub) => sub.id === s.subjectId)?.name}
                            batchName={(s as any).batchName || batches.find((b) => b.id === s.batchId)?.name || 'NEET Repeaters 2027'}
                            tutorName={tutors.find((t) => t.id === s.staffProfileId)?.firstName || user?.firstName}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
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
        <TutorTimetableCalendarContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
