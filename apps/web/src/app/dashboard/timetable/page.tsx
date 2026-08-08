'use client';

import { useState, useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useWeeklyView } from '@/features/scheduling/hooks/use-schedules';
import { CreateScheduleDrawer } from '@/features/scheduling/components/CreateScheduleDrawer';
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
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  // Weekly view data
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

  // Always refetch timetable data on mount / page focus
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Fetch batches, tutors, and subjects
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
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20 text-white">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Class Timetable & Schedule
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Interactive calendar view for managing classes, tutors, and schedule overrides
              </p>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* View mode switcher */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs font-semibold">
            <button
              onClick={() => setViewMode('MONTH')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'MONTH'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Month
            </button>
            <button
              onClick={() => setViewMode('WEEK')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'WEEK'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Week
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'LIST'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Agenda
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors text-slate-600 shadow-2xs"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => router.push('/dashboard/timetable/new')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600 text-white text-xs sm:text-sm font-bold hover:bg-violet-700 transition-all shadow-md shadow-violet-500/15 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Schedule</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>
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

        {/* Filters Bar */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 text-xs w-full lg:w-auto">
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={filters.batchId}
            onChange={(e) => setFilter('batchId', e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-violet-500 transition-colors cursor-pointer"
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
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-violet-500 transition-colors cursor-pointer"
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
            className="col-span-2 sm:col-span-1 w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none focus:border-violet-500 transition-colors cursor-pointer"
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

      {/* MOBILE NATIVE QUICK DAY SELECTOR (Visible on Mobile Screens < md) */}
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

        {/* Mobile Horizontal Day Strip */}
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
          {/* VIEW MODE 1: MONTH CALENDAR GRID (REAL CALENDAR FEEL - FULLY RESPONSIVE NO OVERFLOW SCROLL) */}
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

                {/* 35/42 Real Calendar Grid - Responsive Heights */}
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

                        {/* Mobile Responsive Class Event Cards */}
                        <div className="space-y-1 sm:space-y-1.5 mt-1 sm:mt-2 flex-1 flex flex-col justify-start">
                          {/* Desktop Full Card / Mobile Dot Pill */}
                          {dateSchedules.slice(0, 2).map((sch: ScheduleDetail, sIdx: number) => {
                            const subName =
                              subjects.find((s) => s.id === sch.subjectId)?.name || 'Class';
                            const tutorName = tutors.find(
                              (t) => t.id === sch.staffProfileId,
                            )?.firstName;

                            // Light pastel theme styling per subject
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
                                  {/* Subject + Day */}
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-extrabold truncate text-slate-900 text-[10.5px]">
                                      {subName}
                                    </span>
                                    <span className="text-[8.5px] font-extrabold uppercase text-slate-500 bg-white/70 px-1 py-0.2 rounded border border-slate-200/60">
                                      {DAY_SHORT[sch.dayOfWeek] || sch.dayOfWeek.slice(0, 3)}
                                    </span>
                                  </div>

                                  {/* Full Start & End Time */}
                                  <div
                                    className={`flex items-center justify-between px-1.5 py-0.5 rounded-md font-mono text-[9px] font-bold ${timeBadge}`}
                                  >
                                    <span>{sch.startTime}</span>
                                    <span>-</span>
                                    <span>{sch.endTime}</span>
                                  </div>

                                  {/* Tutor Name */}
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

              {/* Side Panel: Selected Date Class Roster (Native Mobile & Desktop Roster) */}
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

          {/* VIEW MODE 2: WEEK DAY CAROUSEL & TIMELINE GRID */}
          {viewMode === 'WEEK' && (
            <div className="space-y-6">
              {/* Day Card Selectors */}
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

              {/* Day Schedules Card List */}
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
                      <h4 className="text-xs font-extrabold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-xl w-fit border border-violet-100">
                        {WEEKDAY_FULL_LABELS[day]} ({daySchedules.length})
                      </h4>
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

      {/* Create Schedule Drawer */}
      <CreateScheduleDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => refetch()}
        batches={batches}
        subjects={subjects}
        tutors={tutors}
      />

      {/* Session Override Drawer */}
      <SessionOverrideDrawer
        open={!!overrideAction}
        action={overrideAction}
        schedule={selectedSchedule}
        tutors={tutors}
        onClose={handleOverrideClose}
        onSuccess={() => refetch()}
      />

      {/* Session History Drawer */}
      <SessionHistoryDrawer
        open={!!historySchedule}
        schedule={historySchedule}
        onClose={() => setHistorySchedule(null)}
      />
    </div>
    </DashboardLayout>
  );
}
