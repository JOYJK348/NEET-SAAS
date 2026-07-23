'use client';

import { useState } from 'react';
import { Calendar, Plus, Filter, Clock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
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

// ─── Empty cell ───────────────────────────────────────────────────────────────
function EmptyCell() {
  return (
    <div className="h-full min-h-[48px] rounded-lg border border-dashed border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/20" />
  );
}

// ─── Filter state ─────────────────────────────────────────────────────────────
interface FilterState {
  batchId: string;
  staffProfileId: string;
  subjectId: string;
}

export default function TimetablePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMobileDay, setSelectedMobileDay] = useState<WeekdayType>('MONDAY');
  const [filters, setFilters] = useState<FilterState>({
    batchId: '',
    staffProfileId: '',
    subjectId: '',
  });

  // ── Session override state ───────────────────────────────────────────────────
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

  // Fetch batches, tutors, and subjects for selectors and drawer dropdowns
  const { batches: batchesData = [] } = useBatches({ autoFetch: true });
  const { data: tutorsData } = useTutors({ limit: 100 });
  const { data: subjectsData } = useSubjects({ limit: 100 });

  const batches = batchesData.map((b: any) => ({
    id: b.id,
    name: b.name,
    code: b.code,
    branchId: b.branchId,
    academicYearId: b.academicYearId,
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

  // Collect all time slots that have any schedule
  const allTimes = new Set<string>();
  WEEKDAYS.forEach((day) => {
    weekly[day]?.forEach((s: ScheduleDetail) => {
      allTimes.add(s.startTime);
    });
  });
  const sortedTimes = Array.from(allTimes).sort();

  // ── Handlers ─────────────────────────────────────────────────────────────────

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
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Timetable</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 ml-13">
            Manage recurring class schedules with automatic conflict detection
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => refetch()}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors text-slate-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary-hover transition-all shadow-md shadow-primary/10"
          >
            <Plus className="w-4 h-4" />
            Create Schedule
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6 p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Batch Filter */}
        <select
          value={filters.batchId}
          onChange={(e) => setFilter('batchId', e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 outline-none focus:border-primary transition-colors cursor-pointer"
        >
          <option value="">All Batches</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Tutor Filter */}
        <select
          value={filters.staffProfileId}
          onChange={(e) => setFilter('staffProfileId', e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 outline-none focus:border-primary transition-colors cursor-pointer"
        >
          <option value="">All Tutors</option>
          {tutors.map((t) => (
            <option key={t.id} value={t.id}>
              {t.firstName} {t.lastName}
            </option>
          ))}
        </select>

        {/* Subject Filter */}
        <select
          value={filters.subjectId}
          onChange={(e) => setFilter('subjectId', e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 outline-none focus:border-primary transition-colors cursor-pointer"
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
            className="ml-auto text-xs text-primary hover:underline transition-colors font-semibold px-2 py-1 rounded hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-slate-500 text-sm font-medium">Loading timetable...</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-slate-600 text-sm font-semibold">Failed to load timetable</p>
          <button
            onClick={() => refetch()}
            className="text-xs text-primary hover:underline font-semibold"
          >
            Try again
          </button>
        </div>
      )}

      {/* Main Grid Render: Split between Mobile Day-tabs and Desktop Columns */}
      {!isLoading && !isError && (
        <>
          {/* MOBILE VIEW Day Horizontal Scroll Selectors (only visible under md screen size) */}
          <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
            {WEEKDAYS.map((day) => {
              const count = weekly[day]?.length ?? 0;
              const isSelected = selectedMobileDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedMobileDay(day)}
                  className={`flex flex-col items-center min-w-[64px] py-2 px-3 rounded-xl border transition-all flex-shrink-0
                    ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  <span className="text-xs font-bold">{DAY_SHORT[day]}</span>
                  <span
                    className={`text-[9px] mt-0.5 font-bold px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* MOBILE VIEW Timeline Slot List (only visible under md screen size) */}
          <div className="block md:hidden space-y-3">
            {weekly[selectedMobileDay]?.length > 0 ? (
              [...weekly[selectedMobileDay]]
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((s: ScheduleDetail) => (
                  <div
                    key={s.id}
                    className="relative pl-5 border-l-2 border-primary/20 last:border-l-0 pb-1"
                  >
                    <div className="absolute left-[-5px] top-2.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-white" />
                    <ScheduleSlotCard
                      schedule={s}
                      subjectName={subjects.find((sub) => sub.id === s.subjectId)?.name}
                      batchName={batches.find((b) => b.id === s.batchId)?.name}
                      tutorName={tutors.find((t) => t.id === s.staffProfileId)?.firstName}
                      onAction={handleSessionAction}
                      onHistory={handleSessionHistory}
                    />
                  </div>
                ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-dashed border-slate-200 bg-white text-center">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No classes scheduled</p>
                <p className="text-xs text-slate-400 mt-1">
                  There are no classes scheduled for {WEEKDAY_FULL_LABELS[selectedMobileDay]}.
                </p>
              </div>
            )}
          </div>

          {/* DESKTOP VIEW 8-column Weekly Table Grid (hidden under md screen size) */}
          {sortedTimes.length === 0 ? (
            <div className="hidden md:flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center border border-primary/10">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-slate-800 font-semibold mb-1">No schedules found</p>
                <p className="text-slate-500 text-sm max-w-xs">
                  Create a recurring weekly class schedule or adjust filters to view slots.
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all"
              >
                <Plus className="w-4 h-4" />
                Create Schedule
              </button>
            </div>
          ) : (
            <div className="hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              {/* Day header row */}
              <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50/75">
                {/* Time column header */}
                <div className="flex items-center justify-center py-4 px-2 border-r border-slate-200">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                {/* Day headers */}
                {WEEKDAYS.map((day) => {
                  const count = weekly[day]?.length ?? 0;
                  return (
                    <div
                      key={day}
                      className="flex flex-col items-center py-3.5 px-2 border-r border-slate-200 last:border-r-0"
                    >
                      <span className="text-xs font-bold text-slate-700">{DAY_SHORT[day]}</span>
                      {count > 0 && (
                        <span className="mt-1 text-[10px] text-primary font-semibold bg-primary-light px-2 py-0.5 rounded-full">
                          {count} {count === 1 ? 'class' : 'classes'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Grid Rows */}
              <div className="bg-white">
                {sortedTimes.map((time, rowIdx) => (
                  <div
                    key={time}
                    className={`grid grid-cols-8 border-b border-slate-100 last:border-b-0 ${
                      rowIdx % 2 === 0 ? '' : 'bg-slate-50/20'
                    }`}
                  >
                    {/* Time label */}
                    <div className="flex items-start justify-center py-3 px-2 border-r border-slate-200 pt-4">
                      <span className="text-[11px] font-mono text-slate-500 font-semibold">
                        {time}
                      </span>
                    </div>

                    {/* Day cells */}
                    {WEEKDAYS.map((day) => {
                      const slots =
                        weekly[day]?.filter((s: ScheduleDetail) => s.startTime === time) ?? [];

                      return (
                        <div
                          key={day}
                          className="p-2 border-r border-slate-100 last:border-r-0 min-h-[72px]"
                        >
                          {slots.length > 0 ? (
                            <div className="space-y-1.5">
                              {slots.map((s: ScheduleDetail) => (
                                <ScheduleSlotCard
                                  key={s.id}
                                  schedule={s}
                                  subjectName={subjects.find((sub) => sub.id === s.subjectId)?.name}
                                  batchName={batches.find((b) => b.id === s.batchId)?.name}
                                  tutorName={
                                    tutors.find((t) => t.id === s.staffProfileId)?.firstName
                                  }
                                  onAction={handleSessionAction}
                                  onHistory={handleSessionHistory}
                                />
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

      {/* Create Schedule Drawer */}
      <CreateScheduleDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => refetch()}
        batches={batches}
        subjects={subjects}
        tutors={tutors}
      />

      {/* Session Override Drawer (Change Tutor / Reschedule / Cancel) */}
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
  );
}
