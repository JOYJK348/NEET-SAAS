'use client';

import { useState, useCallback } from 'react';
import {
  X,
  CalendarDays,
  Clock,
  Users,
  BookOpen,
  MapPin,
  Wifi,
  Search,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Building2,
  GraduationCap,
  Sparkles,
  Repeat,
  Calendar,
} from 'lucide-react';
import { ConflictAlert } from './ConflictAlert';
import { useCheckConflicts, useCreateSchedule, useRooms } from '../hooks/use-schedules';
import {
  WeekdayType,
  AttendanceModeType,
  WEEKDAYS,
  WEEKDAY_FULL_LABELS,
  CreateSchedulePayload,
  ConflictResult,
} from '../types/schedule.types';

// Time options every 30 minutes from 06:00 to 22:00
const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 22) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

const WEEKDAY_NAMES: WeekdayType[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

const getWeekdayFromDateStr = (dateStr: string): WeekdayType => {
  if (!dateStr) return 'MONDAY';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return WEEKDAY_NAMES[d.getDay()] || 'MONDAY';
  }
  return 'MONDAY';
};

interface Batch {
  id: string;
  name: string;
  code: string;
  branchId: string;
  academicYearId: string;
  startDate?: string;
  endDate?: string;
}
interface Subject {
  id: string;
  name: string;
  shortName: string;
}
interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  subjects?: { id: string; subjectId: string }[];
}

interface CreateScheduleDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  batches: Batch[];
  subjects: Subject[];
  tutors: Tutor[];
}

interface FormState {
  batchId: string;
  subjectId: string;
  staffProfileId: string;
  dayOfWeek: WeekdayType | '';
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveUntil: string;
  deliveryMode: AttendanceModeType;
  roomId: string;
  meetingLink: string;
  notes: string;
}

const getTodayDateStr = () => new Date().toISOString().split('T')[0];
const getNextMonthDateStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
};
const getThreeMonthsDateStr = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().split('T')[0];
};
const getNextYearDateStr = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
};

const INITIAL_FORM: FormState = {
  batchId: '',
  subjectId: '',
  staffProfileId: '',
  dayOfWeek: getWeekdayFromDateStr(getTodayDateStr()),
  startTime: '08:00',
  endTime: '10:00',
  effectiveFrom: getTodayDateStr(),
  effectiveUntil: getNextYearDateStr(),
  deliveryMode: 'CLASSROOM',
  roomId: '',
  meetingLink: '',
  notes: '',
};

export function CreateScheduleDrawer({
  open,
  onClose,
  onSuccess,
  batches,
  subjects,
  tutors,
}: CreateScheduleDrawerProps) {
  const [scheduleType, setScheduleType] = useState<'ONE_TIME' | 'RECURRING'>('RECURRING');
  const [singleDate, setSingleDate] = useState<string>(getTodayDateStr());
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null);
  const [conflictChecked, setConflictChecked] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const selectedBatch = batches.find((b) => b.id === form.batchId);

  const filteredTutors = form.subjectId
    ? tutors.filter((t) => t.subjects?.some((sub) => sub.subjectId === form.subjectId))
    : tutors;

  const { data: rooms = [], isLoading: roomsLoading } = useRooms(
    selectedBatch ? { branchId: selectedBatch.branchId } : undefined,
  );

  const { mutate: runConflictCheck, isPending: checkingConflicts } = useCheckConflicts();
  const { mutate: createSchedule, isPending: creating } = useCreateSchedule();

  const handleSingleDateChange = (dateVal: string) => {
    setSingleDate(dateVal);
    const day = getWeekdayFromDateStr(dateVal);
    setForm((f) => ({
      ...f,
      effectiveFrom: dateVal,
      effectiveUntil: dateVal,
      dayOfWeek: day,
    }));
    setConflictResult(null);
    setConflictChecked(false);
  };

  const handleScheduleTypeChange = (type: 'ONE_TIME' | 'RECURRING') => {
    setScheduleType(type);
    if (type === 'ONE_TIME') {
      const day = getWeekdayFromDateStr(singleDate);
      setForm((f) => ({
        ...f,
        effectiveFrom: singleDate,
        effectiveUntil: singleDate,
        dayOfWeek: day,
      }));
    } else {
      if (selectedBatch?.startDate) {
        setForm((f) => ({
          ...f,
          effectiveFrom: new Date(selectedBatch.startDate!).toISOString().split('T')[0],
          effectiveUntil: selectedBatch?.endDate
            ? new Date(selectedBatch.endDate).toISOString().split('T')[0]
            : getNextYearDateStr(),
        }));
      } else {
        setForm((f) => ({
          ...f,
          effectiveFrom: getTodayDateStr(),
          effectiveUntil: getNextYearDateStr(),
        }));
      }
    }
    setConflictResult(null);
    setConflictChecked(false);
  };

  const set = useCallback(
    (key: keyof FormState, value: string) => {
      setForm((f) => {
        const next = { ...f, [key]: value };
        if (key === 'batchId' && value) {
          const targetBatch = batches.find((b) => b.id === value);
          if (scheduleType === 'RECURRING') {
            if (targetBatch?.startDate) {
              next.effectiveFrom = new Date(targetBatch.startDate).toISOString().split('T')[0];
            }
            if (targetBatch?.endDate) {
              next.effectiveUntil = new Date(targetBatch.endDate).toISOString().split('T')[0];
            }
          }
        }
        return next;
      });

      if (
        ['dayOfWeek', 'startTime', 'endTime', 'staffProfileId', 'batchId', 'roomId'].includes(key)
      ) {
        setConflictResult(null);
        setConflictChecked(false);
      }
      setErrors((e) => ({ ...e, [key]: undefined }));
    },
    [batches, scheduleType],
  );

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.batchId) newErrors.batchId = 'Batch is required';
    if (!form.subjectId) newErrors.subjectId = 'Subject is required';
    if (!form.staffProfileId) newErrors.staffProfileId = 'Tutor is required';
    if (!form.dayOfWeek) newErrors.dayOfWeek = 'Day of week is required';
    if (!form.startTime) newErrors.startTime = 'Start time is required';
    if (!form.endTime) newErrors.endTime = 'End time is required';
    if (form.startTime >= form.endTime) newErrors.endTime = 'End time must be after start time';
    if (!form.effectiveFrom) newErrors.effectiveFrom = 'Start date is required';
    if (!form.effectiveUntil) newErrors.effectiveUntil = 'End date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = (bypassStudent = false): CreateSchedulePayload | null => {
    if (!selectedBatch || !form.dayOfWeek) return null;
    return {
      branchId: selectedBatch.branchId,
      academicYearId: selectedBatch.academicYearId,
      batchId: form.batchId,
      subjectId: form.subjectId,
      staffProfileId: form.staffProfileId,
      dayOfWeek: form.dayOfWeek as WeekdayType,
      startTime: form.startTime,
      endTime: form.endTime,
      effectiveFrom: form.effectiveFrom,
      effectiveUntil: form.effectiveUntil,
      deliveryMode: form.deliveryMode,
      bypassStudentConflict: bypassStudent,
      ...(form.roomId && { roomId: form.roomId }),
      ...(form.meetingLink && { meetingLink: form.meetingLink }),
      ...(form.notes && { notes: form.notes }),
    };
  };

  const handleCheckConflicts = () => {
    if (!validate()) return;
    const payload = buildPayload();
    if (!payload) return;

    runConflictCheck(payload, {
      onSuccess: (result) => {
        setConflictResult(result);
        setConflictChecked(true);
      },
    });
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const hasHardConflict = conflictResult?.conflicts.some((c) => c.type !== 'STUDENT') ?? false;
    if (hasHardConflict) return; // strictly block saving for batch, tutor, or room conflict

    const onlySoftConflict = conflictResult?.hasConflict && !hasHardConflict;
    const payload = buildPayload(onlySoftConflict);
    if (!payload) return;

    createSchedule(payload, {
      onSuccess: () => {
        setForm(INITIAL_FORM);
        setConflictResult(null);
        setConflictChecked(false);
        onSuccess?.();
        onClose();
      },
    });
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setConflictResult(null);
    setConflictChecked(false);
    setErrors({});
    onClose();
  };

  if (!open) return null;

  const showOnline = form.deliveryMode === 'ONLINE' || form.deliveryMode === 'HYBRID';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-40" onClick={handleClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[520px] bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-light border border-primary/20 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Create Schedule</h2>
              <p className="text-xs text-slate-500">Set up a recurring weekly class</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/50 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Section: Class Details */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Class Details
            </h3>
            <div className="space-y-3">
              {/* Batch */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Batch <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.batchId}
                    onChange={(e) => set('batchId', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border text-sm text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all
                      ${errors.batchId ? 'border-red-300 bg-red-50/5' : 'border-slate-200'}`}
                  >
                    <option value="" className="text-slate-500">
                      Select a batch...
                    </option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id} className="text-slate-800">
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.batchId && <p className="text-xs text-red-500 mt-1">{errors.batchId}</p>}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.subjectId}
                    onChange={(e) => set('subjectId', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border text-sm text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all
                      ${errors.subjectId ? 'border-red-300 bg-red-50/5' : 'border-slate-200'}`}
                  >
                    <option value="" className="text-slate-500">
                      Select a subject...
                    </option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id} className="text-slate-800">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.subjectId && (
                  <p className="text-xs text-red-500 mt-1">{errors.subjectId}</p>
                )}
              </div>

              {/* Tutor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tutor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.staffProfileId}
                    onChange={(e) => set('staffProfileId', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border text-sm text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all
                      ${errors.staffProfileId ? 'border-red-300 bg-red-50/5' : 'border-slate-200'}`}
                  >
                    <option value="" className="text-slate-500">
                      {!form.subjectId ? 'Select a subject first...' : 'Select a tutor...'}
                    </option>
                    {filteredTutors.map((t) => (
                      <option key={t.id} value={t.id} className="text-slate-800">
                        {t.firstName} {t.lastName} {t.employeeCode ? `(${t.employeeCode})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.staffProfileId && (
                  <p className="text-xs text-red-500 mt-1">{errors.staffProfileId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Schedule */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Schedule Settings
            </h3>

            {/* Schedule Type Toggle Switcher (Weekly Recurring 1st) */}
            <div className="flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 text-xs font-bold mb-4">
              <button
                type="button"
                onClick={() => handleScheduleTypeChange('RECURRING')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all ${
                  scheduleType === 'RECURRING'
                    ? 'bg-white text-violet-700 shadow-sm border border-slate-200/80 font-black'
                    : 'text-slate-500 hover:text-slate-800 font-bold'
                }`}
              >
                <Repeat className="w-3.5 h-3.5 text-violet-600" />
                <span>Weekly Recurring 🔄</span>
              </button>
              <button
                type="button"
                onClick={() => handleScheduleTypeChange('ONE_TIME')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl transition-all ${
                  scheduleType === 'ONE_TIME'
                    ? 'bg-white text-violet-700 shadow-sm border border-slate-200/80 font-black'
                    : 'text-slate-500 hover:text-slate-800 font-bold'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>One-Time Class / Event 🎯</span>
              </button>
            </div>

            {/* Option A: ONE-TIME Single Class Date */}
            {scheduleType === 'ONE_TIME' && (
              <div className="mb-4 bg-violet-50/70 border border-violet-200/80 p-3.5 rounded-2xl space-y-2">
                <label className="block text-xs font-extrabold text-violet-950">
                  Exact Class Date 📅 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-600" />
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => handleSingleDateChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-violet-200 text-sm font-bold text-slate-800 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all cursor-pointer shadow-2xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-violet-800 font-extrabold pt-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                  <span>
                    Class occurs on {WEEKDAY_FULL_LABELS[form.dayOfWeek || 'MONDAY']},{' '}
                    {new Date(singleDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    (Single Event)
                  </span>
                </div>
              </div>
            )}

            {/* Option B: RECURRING Day of Week Selector */}
            {scheduleType === 'RECURRING' && (
              <div className="mb-3.5">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Day of Week <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => set('dayOfWeek', day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        form.dayOfWeek === day
                          ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      {WEEKDAY_FULL_LABELS[day].slice(0, 3)}
                    </button>
                  ))}
                </div>
                {errors.dayOfWeek && <p className="text-xs text-red-500 mt-1">{errors.dayOfWeek}</p>}
              </div>
            )}

            {/* Times */}
            <div className="grid grid-cols-2 gap-3 mb-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.startTime}
                    onChange={(e) => set('startTime', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t} className="text-slate-800">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  End Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.endTime}
                    onChange={(e) => set('endTime', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border text-sm text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all
                      ${errors.endTime ? 'border-red-300 bg-red-50/5' : 'border-slate-200'}`}
                  >
                    {TIME_OPTIONS.map((t) => (
                      <option key={t} value={t} className="text-slate-800">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
              </div>
            </div>

            {/* RECURRING Active Period Date Range Picker */}
            {scheduleType === 'RECURRING' && (
              <div className="mt-4 bg-slate-50/80 border border-slate-200/80 p-3.5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-violet-600" />
                    <span>Course Schedule Duration</span>
                  </label>
                  {selectedBatch?.name && (
                    <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      Auto-synced with Batch ✨
                    </span>
                  )}
                </div>

                {/* Duration Months Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Select Course Length / Duration
                  </label>
                  <select
                    defaultValue="12"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'CUSTOM') return;
                      const months = parseInt(val, 10);
                      if (!isNaN(months)) {
                        const startD = new Date(form.effectiveFrom || getTodayDateStr());
                        const endD = new Date(startD);
                        endD.setMonth(endD.getMonth() + months);
                        set('effectiveUntil', endD.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="1">1 Month Course</option>
                    <option value="2">2 Months Course</option>
                    <option value="3">3 Months (Quarterly / Crash Course)</option>
                    <option value="4">4 Months Semester</option>
                    <option value="6">6 Months (Half Yearly Term)</option>
                    <option value="9">9 Months Academic Term</option>
                    <option value="12">12 Months (Full 1 Year Course Batch)</option>
                    <option value="CUSTOM">Custom Start & End Date 📅</option>
                  </select>
                </div>

                {/* Start Date & End Date Range Input Controls */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Starts On Date 📅
                    </label>
                    <input
                      type="date"
                      value={form.effectiveFrom}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        set('effectiveFrom', newStart);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all cursor-pointer shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Repeats Until Date 📅
                    </label>
                    <input
                      type="date"
                      value={form.effectiveUntil}
                      onChange={(e) => set('effectiveUntil', e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all cursor-pointer shadow-2xs"
                    />
                  </div>
                </div>

                <div className="text-[11px] font-extrabold text-violet-800 bg-violet-50/80 border border-violet-200/80 p-2.5 rounded-xl flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                  <span>
                    Class repeats every {WEEKDAY_FULL_LABELS[form.dayOfWeek || 'MONDAY']} from{' '}
                    {form.effectiveFrom} to {form.effectiveUntil}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section: Delivery */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Delivery Type
            </h3>

            <div className="grid grid-cols-3 gap-2 mb-3.5">
              {(['CLASSROOM', 'ONLINE', 'HYBRID'] as AttendanceModeType[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => set('deliveryMode', mode)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-semibold transition-all
                    ${
                      form.deliveryMode === mode
                        ? 'bg-primary-light border-primary/30 text-primary shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                >
                  {mode === 'ONLINE' ? (
                    <Wifi className="w-4 h-4" />
                  ) : (
                    <Building2 className="w-4 h-4" />
                  )}
                  {mode.charAt(0) + mode.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Meeting link (online/hybrid) */}
            {showOnline && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Meeting Link <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-violet-600 font-bold bg-violet-50 px-2 py-0.5 rounded">
                    Auto-uses LiveKit Studio if empty ✨
                  </span>
                </div>
                <div className="relative">
                  <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={form.meetingLink}
                    onChange={(e) => set('meetingLink', e.target.value)}
                    placeholder="Leave empty for Built-in LiveKit Studio, or paste Google Meet / Zoom link"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 If left empty, our built-in interactive LiveKit Studio (whiteboard + recording) will be automatically assigned.
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any additional notes about this schedule..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>

          {/* Conflict result */}
          {conflictChecked && conflictResult && (
            <div className="mt-2">
              {conflictResult.hasConflict ? (
                <ConflictAlert
                  result={conflictResult}
                  newStartTime={form.startTime}
                  newEndTime={form.endTime}
                  newDayOfWeek={form.dayOfWeek || undefined}
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">No Conflicts Found</p>
                    <p className="text-xs text-emerald-600">
                      This schedule is clear — you can save it now.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/90 flex items-center gap-3">
          {/* Check Conflicts button */}
          <button
            type="button"
            onClick={handleCheckConflicts}
            disabled={checkingConflicts}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            {checkingConflicts ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            ) : (
              <Search className="w-4 h-4 text-amber-600" />
            )}
            Check Conflicts
          </button>

          <div className="flex-1" />

          {/* Cancel */}
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-500 text-sm hover:text-slate-800 hover:bg-slate-100/55 transition-colors"
          >
            Cancel
          </button>

          {/* Create */}
          {(() => {
            const hasHardConflict =
              conflictResult?.conflicts.some((c) => c.type !== 'STUDENT') ?? false;
            const onlySoftConflict = (conflictResult?.hasConflict ?? false) && !hasHardConflict;

            return (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  creating ||
                  (conflictChecked && (conflictResult?.hasConflict ?? false) && !onlySoftConflict)
                }
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    onlySoftConflict
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/10'
                      : 'bg-primary hover:bg-primary-hover shadow-md shadow-primary/10'
                  }`}
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                {conflictChecked && conflictResult?.hasConflict ? (
                  onlySoftConflict ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Create Anyway
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Resolve Conflicts
                    </>
                  )
                ) : (
                  'Create Schedule'
                )}
              </button>
            );
          })()}
        </div>
      </div>
    </>
  );
}
