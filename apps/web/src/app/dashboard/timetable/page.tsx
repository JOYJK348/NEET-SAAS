'use client';

import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
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
  Users,
  Layers,
  BookOpen,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useWeeklyView } from '@/features/scheduling/hooks/use-schedules';
import { ScheduleSlotCard } from '@/features/scheduling/components/ScheduleSlotCard';
import {
  SessionOverrideDrawer,
  SessionAction,
} from '@/features/scheduling/components/SessionOverrideDrawer';
import { SessionHistoryDrawer } from '@/features/scheduling/components/SessionHistoryDrawer';
import { useBatches } from '@/features/batches/hooks/use-batches';
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
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

export default function TimetablePage() {
  const router = useRouter();
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

  // Weekly view data with 0ms pre-fetched memory caching
  const {
    data: weeklyData,
    isLoading,
    isError,
    refetch,
  } = useWeeklyView({
    ...(filters.batchId && { batchId: filters.batchId }),
    ...(filters.staffProfileId && { staffProfileId: filters.staffProfileId }),
    ...(filters.subjectId && { subjectId: filters.subjectId }),
  });

  // Fetch master dropdown data
  const { batches: batchesData = [] } = useBatches({ autoFetch: true });
  const { data: tutorsData } = useTutors({ limit: 100 });
  const { data: subjectsData } = useSubjects({ limit: 100 });

  const batches = batchesData.map((b: any) => ({
    id: b.id,
    name: b.name,
    code: b.code,
    branchId: b.branchId,
    academicYearId: b.academicYearId,
    startDate: b.startDate,
    endDate: b.endDate,
  }));

  const tutors = (tutorsData?.data ?? []).map((t: any) => ({
    id: t.userId || t.id,
    firstName: t.firstName,
    lastName: t.lastName,
    employeeCode: t.employeeCode || '',
    subjects: t.subjects || [],
  }));

  const subjects = (subjectsData?.data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    shortName: s.code || s.name.slice(0, 3).toUpperCase(),
  }));

  const setFilter = (key: keyof FilterState, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const emptyWeekly: WeeklyViewData = {
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
    SATURDAY: [],
    SUNDAY: [],
  };
  const weekly = weeklyData ?? emptyWeekly;

  // Compute KPI Metrics from weekly schedules
  const totalClassesCount = useMemo(() => {
    return Object.values(weekly).reduce((acc, list) => acc + list.length, 0);
  }, [weekly]);

  const uniqueBatchesCount = useMemo(() => {
    const batchSet = new Set<string>();
    Object.values(weekly).forEach((list) => {
      list.forEach((s) => s.batchId && batchSet.add(s.batchId));
    });
    return batchSet.size;
  }, [weekly]);

  const uniqueTutorsCount = useMemo(() => {
    const tutorSet = new Set<string>();
    Object.values(weekly).forEach((list) => {
      list.forEach((s) => s.staffProfileId && tutorSet.add(s.staffProfileId));
    });
    return tutorSet.size;
  }, [weekly]);

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

    // Next month padding to complete grid
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

  const handleSessionAction = (action: SessionAction | 'edit', schedule: ScheduleDetail) => {
    if (action === 'reschedule' || (action as string) === 'edit') {
      router.push(`/dashboard/timetable/new?editId=${schedule.id}`);
      return;
    }
    setOverrideAction(action as SessionAction);
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
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Welcome Header Banner - Signature Violet Gradient */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                Master Timetable & Schedules
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
              Class Timetable & Schedules 📅
            </h1>
            <p className="text-violet-200 text-xs mt-0.5">
              Interactive calendar view for managing active classes, room allocations, tutor schedules, and session overrides.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              onClick={() => router.push('/dashboard/timetable/new')}
              className="w-full sm:w-auto gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold border-0 shadow-xs rounded-xl text-xs"
            >
              <Plus className="h-4 w-4 text-violet-600 shrink-0" aria-hidden="true" />
              <span>Create Schedule</span>
            </Button>
          </div>
        </div>

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl border border-violet-100 bg-violet-50 text-violet-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Weekly Classes
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">{totalClassesCount}</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Scheduled Batches
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">{uniqueBatchesCount}</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Assigned Tutors
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">{uniqueTutorsCount}</p>
            </div>
          </Card>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          {/* View Mode Pills */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
            <button
              onClick={() => setViewMode('MONTH')}
              className={cn(
                'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all',
                viewMode === 'MONTH'
                  ? 'bg-white text-violet-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <CalendarDays className="w-3.5 h-3.5 text-violet-600" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('WEEK')}
              className={cn(
                'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all',
                viewMode === 'WEEK'
                  ? 'bg-white text-violet-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <Grid className="w-3.5 h-3.5 text-violet-600" />
              <span>Week</span>
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={cn(
                'flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all',
                viewMode === 'LIST'
                  ? 'bg-white text-violet-700 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <List className="w-3.5 h-3.5 text-violet-600" />
              <span>Agenda</span>
            </button>
          </div>

          {/* Month Navigation Controls */}
          <div className="flex items-center justify-between sm:justify-center gap-2 shrink-0">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-xs font-extrabold hover:bg-violet-100 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs sm:text-sm font-black text-slate-900 min-w-[120px] text-center">
                {monthName}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => refetch()}
              className="w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-600 shrink-0 ml-1"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dropdown Filters */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 text-xs w-full lg:w-auto">
            <select
              value={filters.batchId}
              onChange={(e) => setFilter('batchId', e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-violet-600 transition-colors cursor-pointer"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              value={filters.staffProfileId}
              onChange={(e) => setFilter('staffProfileId', e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-violet-600 transition-colors cursor-pointer"
            >
              <option value="">All Tutors</option>
              {tutors.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>

            <select
              value={filters.subjectId}
              onChange={(e) => setFilter('subjectId', e.target.value)}
              className="col-span-2 sm:col-span-1 w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-violet-600 transition-colors cursor-pointer"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {(filters.batchId || filters.staffProfileId || filters.subjectId) && (
              <button
                onClick={() => setFilters({ batchId: '', staffProfileId: '', subjectId: '' })}
                className="text-xs text-violet-600 hover:underline font-bold px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* MOBILE 1ST NATIVE DAY SELECTOR (Visible on Mobile Screens < md) */}
        <div className="block md:hidden bg-white rounded-2xl border border-slate-200/90 p-3.5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-violet-600" />
              <span>{selectedDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
            </span>
            <button
              onClick={handleToday}
              className="text-[11px] font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-lg border border-violet-100"
            >
              Today
            </button>
          </div>

          {/* Touch-Friendly Horizontal Scroll Strip */}
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
                  className={cn(
                    'flex flex-col items-center min-w-[58px] py-2 px-2.5 rounded-xl border transition-all shrink-0 cursor-pointer',
                    isSelected
                      ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100',
                  )}
                >
                  <span className="text-[10px] font-extrabold uppercase opacity-80">
                    {DAY_SHORT[day]}
                  </span>
                  <span className="text-xs font-black mt-0.5">{WEEKDAY_LABELS[day]}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        'text-[9px] mt-1 font-black px-1.5 py-0.2 rounded-full',
                        isSelected ? 'bg-white/25 text-white' : 'bg-violet-100 text-violet-800',
                      )}
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
        {isLoading && !weeklyData && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            <span className="text-slate-500 text-sm font-medium">Loading schedule calendar...</span>
          </div>
        )}

        {isError && !weeklyData && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
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
        {(!isLoading || weeklyData) && !isError && (
          <>
            {/* VIEW MODE 1: MONTH CALENDAR GRID */}
            {viewMode === 'MONTH' && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Main Calendar Grid (3 columns wide) */}
                <div className="lg:col-span-3 bg-gradient-to-br from-white via-slate-50/60 to-violet-50/30 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-100/90 text-center text-[10px] sm:text-xs font-black text-slate-700 py-2.5 sm:py-3.5 uppercase tracking-wider">
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
                          className={cn(
                            'min-h-[70px] sm:min-h-[135px] p-1.5 sm:p-2.5 transition-all duration-200 cursor-pointer flex flex-col justify-between group',
                            item.isCurrentMonth
                              ? isToday
                                ? 'bg-gradient-to-b from-violet-100/60 via-violet-50/30 to-white'
                                : isSelected
                                  ? 'bg-violet-50/80'
                                  : 'bg-white/90 hover:bg-violet-50/30'
                              : 'bg-slate-100/50 text-slate-400',
                            isSelected && 'ring-2 ring-violet-600 ring-inset shadow-xs',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                'text-[10px] sm:text-xs font-black w-5 h-5 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center transition-all',
                                isToday
                                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30 scale-105 sm:scale-110'
                                  : isSelected
                                    ? 'bg-violet-100 text-violet-900 border border-violet-300 font-black'
                                    : item.isCurrentMonth
                                      ? 'text-slate-800 group-hover:text-violet-700 font-extrabold'
                                      : 'text-slate-400 font-semibold',
                              )}
                            >
                              {item.date.getDate()}
                            </span>

                            {dateSchedules.length > 0 && (
                              <span className="text-[8px] sm:text-[10px] font-black text-white bg-violet-600 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full shadow-2xs">
                                {dateSchedules.length}
                              </span>
                            )}
                          </div>

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
                                  <div
                                    className={`sm:hidden text-[8px] font-extrabold px-1 py-0.5 rounded-md ${badgeStyle} truncate flex items-center gap-1 border`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${dotBg} shrink-0`} />
                                    <span className="truncate">{subName}</span>
                                  </div>

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

                {/* Side Panel Roster */}
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
                          subjectName={subjects.find((sub) => sub.id === s.subjectId)?.name}
                          batchName={batches.find((b) => b.id === s.batchId)?.name}
                          tutorName={tutors.find((t) => t.id === s.staffProfileId)?.firstName}
                          onAction={handleSessionAction}
                          onHistory={handleSessionHistory}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <Clock className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-700">No classes for this date</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Tap any date on the calendar strip above to inspect classes or click 'Create'
                        to add a schedule.
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
                        className={cn(
                          'p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2',
                          isSelected
                            ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-500/20 scale-[1.02]'
                            : 'bg-white border-slate-200/80 hover:border-violet-200 text-slate-700 hover:bg-slate-50/50',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'text-xs font-extrabold uppercase',
                              isSelected ? 'text-violet-100' : 'text-slate-400',
                            )}
                          >
                            {DAY_SHORT[day]}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-black px-2 py-0.5 rounded-full',
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600',
                            )}
                          >
                            {daySchedules.length}
                          </span>
                        </div>
                        <p className="text-sm font-black tracking-tight">{WEEKDAY_LABELS[day]}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
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
                          subjectName={subjects.find((sub) => sub.id === s.subjectId)?.name}
                          batchName={batches.find((b) => b.id === s.batchId)?.name}
                          tutorName={tutors.find((t) => t.id === s.staffProfileId)?.firstName}
                          onAction={handleSessionAction}
                          onHistory={handleSessionHistory}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <Clock className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-700">No classes scheduled</p>
                      <p className="text-xs text-slate-400 mt-1">
                        No classes found for {WEEKDAY_FULL_LABELS[selectedDayKey]}. Click 'Create
                        Schedule' to add one.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW MODE 3: AGENDA / FULL LIST VIEW */}
            {viewMode === 'LIST' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-6">
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
                          <span className="text-xs font-black text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-200">
                            {WEEKDAY_FULL_LABELS[day]}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            {daySchedules.length} {daySchedules.length === 1 ? 'class' : 'classes'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {daySchedules.map((s: ScheduleDetail) => (
                            <ScheduleSlotCard
                              key={s.id}
                              schedule={s}
                              subjectName={subjects.find((sub) => sub.id === s.subjectId)?.name}
                              batchName={batches.find((b) => b.id === s.batchId)?.name}
                              tutorName={tutors.find((t) => t.id === s.staffProfileId)?.firstName}
                              onAction={handleSessionAction}
                              onHistory={handleSessionHistory}
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

        {/* Drawers */}
        {overrideAction && selectedSchedule && (
          <SessionOverrideDrawer
            open={!!overrideAction}
            onClose={handleOverrideClose}
            onSuccess={() => refetch()}
            action={overrideAction}
            schedule={selectedSchedule}
            tutors={tutors}
          />
        )}

        {historySchedule && (
          <SessionHistoryDrawer
            open={!!historySchedule}
            onClose={() => setHistorySchedule(null)}
            schedule={historySchedule}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
