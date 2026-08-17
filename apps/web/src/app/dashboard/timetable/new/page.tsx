'use client';

import React, { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Users,
  BookOpen,
  Wifi,
  Building2,
  GraduationCap,
  Sparkles,
  Repeat,
  Calendar,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useBatches, useCourses, useStudents } from '@/features/students/hooks/use-students';
import { useTutors } from '@/features/tutors/hooks/use-tutors';
import { useSubjects } from '@/features/master-data/hooks/use-subjects';
import { useCheckConflicts, useCreateSchedule } from '@/features/scheduling/hooks/use-schedules';
import { ConflictAlert } from '@/features/scheduling/components/ConflictAlert';
import type {
  WeekdayType,
  AttendanceModeType,
  CreateSchedulePayload,
  ConflictResult,
} from '@/features/scheduling/types/schedule.types';

const WEEKDAYS: WeekdayType[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

const WEEKDAY_FULL_LABELS: Record<WeekdayType, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

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

const getTodayDateStr = () => new Date().toISOString().split('T')[0];
const getNextYearDateStr = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
};

interface FormState {
  courseId: string;
  batchId: string;
  studentAdmissionId: string;
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
  recordingEnabled: boolean;
  whiteboardEnabled: boolean;
  chatEnabled: boolean;
}

function CreateScheduleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const queryClient = useQueryClient();

  // Schedule Frequency Switcher (Default: RECURRING)
  const [scheduleType, setScheduleType] = useState<'ONE_TIME' | 'RECURRING' | 'ONE_TO_ONE'>('RECURRING');
  const [singleDate, setSingleDate] = useState<string>(getTodayDateStr());

  // Form State
  const [form, setForm] = useState<FormState>({
    courseId: '',
    batchId: '',
    studentAdmissionId: '',
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
    recordingEnabled: true,
    whiteboardEnabled: true,
    chatEnabled: true,
  });

  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null);
  const [conflictChecked, setConflictChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Fetch Dropdown master data
  const { courses: coursesList = [] } = useCourses();
  const { batches: batchesData = [] } = useBatches();
  const { data: tutorsData } = useTutors({ limit: 100 });
  const { data: subjectsData } = useSubjects({ limit: 100 });

  // Fetch schedule details if editId exists
  const { data: scheduleToEdit, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['scheduling', 'schedule', editId],
    queryFn: () => api.get<any>(`/scheduling/schedules/${editId}`),
    enabled: !!editId,
  });

  const [loadedScheduleId, setLoadedScheduleId] = useState<string | null>(null);

  // Pre-fill form when scheduleToEdit data is fetched
  useEffect(() => {
    if (scheduleToEdit && scheduleToEdit.id && scheduleToEdit.id !== loadedScheduleId) {
      setLoadedScheduleId(scheduleToEdit.id);
      const bId = scheduleToEdit.batchId || scheduleToEdit.batch?.id || '';
      const matchedBatch = batchesData.find((b: any) => b.id === bId) as any;
      const cId = matchedBatch?.courseId || matchedBatch?.course?.id || scheduleToEdit.courseId || '';

      setForm({
        courseId: cId,
        batchId: bId,
        studentAdmissionId: scheduleToEdit.studentAdmissionId || '',
        subjectId: scheduleToEdit.subjectId || '',
        staffProfileId: scheduleToEdit.staffProfileId || scheduleToEdit.staffProfile?.id || '',
        dayOfWeek: scheduleToEdit.dayOfWeek || 'MONDAY',
        startTime: scheduleToEdit.startTime || '08:00',
        endTime: scheduleToEdit.endTime || '10:00',
        effectiveFrom: scheduleToEdit.effectiveFrom ? scheduleToEdit.effectiveFrom.split('T')[0] : getTodayDateStr(),
        effectiveUntil: scheduleToEdit.effectiveUntil ? scheduleToEdit.effectiveUntil.split('T')[0] : getNextYearDateStr(),
        deliveryMode: scheduleToEdit.deliveryMode || 'CLASSROOM',
        roomId: scheduleToEdit.roomId || '',
        meetingLink: scheduleToEdit.meetingLink || '',
        notes: scheduleToEdit.notes || '',
        recordingEnabled: scheduleToEdit.recordingEnabled ?? true,
        whiteboardEnabled: scheduleToEdit.whiteboardEnabled ?? true,
        chatEnabled: scheduleToEdit.chatEnabled ?? true,
      });

      if (scheduleToEdit.scheduleType === 'ONE_TIME' || scheduleToEdit.isOneTime) {
        setScheduleType('ONE_TIME');
        if (scheduleToEdit.effectiveFrom) {
          setSingleDate(scheduleToEdit.effectiveFrom.split('T')[0]);
        }
      } else {
        setScheduleType('RECURRING');
      }
    }
  }, [scheduleToEdit, loadedScheduleId, batchesData]);

  // Fetch Subjects specifically mapped to selected Course
  const { data: courseSubjectsRes } = useQuery({
    queryKey: ['master', 'course-subjects', form.courseId],
    queryFn: () => api.get<any[]>(`/master/course-subjects/by-course/${form.courseId}`),
    enabled: !!form.courseId,
  });

  const courseMappedSubjectIds = useMemo(() => {
    if (!courseSubjectsRes || !Array.isArray(courseSubjectsRes)) return new Set<string>();
    return new Set(
      courseSubjectsRes
        .map((cs: any) => cs.subjectId || cs.subject?.id)
        .filter((id): id is string => Boolean(id)),
    );
  }, [courseSubjectsRes]);

  const batches = batchesData.map((b: any) => ({
    id: b.id,
    name: b.name,
    code: b.code,
    courseId: b.courseId || b.course?.id || '',
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

  const allSubjects = (subjectsData?.data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
    shortName: s.code || s.name.slice(0, 3).toUpperCase(),
  }));

  // Cascaded filtering logic
  const filteredBatches = form.courseId
    ? batches.filter((b: any) => !b.courseId || b.courseId === form.courseId)
    : batches;

  const filteredSubjects = useMemo(() => {
    if (form.courseId && courseMappedSubjectIds.size > 0) {
      return allSubjects.filter((s: any) => courseMappedSubjectIds.has(s.id));
    }
    return allSubjects;
  }, [form.courseId, courseMappedSubjectIds, allSubjects]);

  const selectedBatch = batches.find((b: any) => b.id === form.batchId);

  const filteredTutors = form.subjectId
    ? tutors.filter((t: any) => t.subjects?.some((sub: any) => sub.subjectId === form.subjectId))
    : tutors;

  const { mutate: runConflictCheck, isPending: checkingConflicts } = useCheckConflicts();
  const { mutateAsync: createSchedule, isPending: creating } = useCreateSchedule();

  const set = useCallback(
    (key: keyof FormState, value: string) => {
      setForm((f) => {
        const next = { ...f, [key]: value };
        if (key === 'courseId') {
          next.batchId = '';
          next.subjectId = '';
          next.staffProfileId = '';
        }
        if (key === 'batchId') {
          next.subjectId = '';
          next.staffProfileId = '';
          if (value) {
            const targetBatch = batches.find((b: any) => b.id === value);
            if (targetBatch?.courseId) {
              next.courseId = targetBatch.courseId;
            }
            if (scheduleType === 'RECURRING') {
              if (targetBatch?.startDate) {
                next.effectiveFrom = new Date(targetBatch.startDate).toISOString().split('T')[0];
              }
              if (targetBatch?.endDate) {
                next.effectiveUntil = new Date(targetBatch.endDate).toISOString().split('T')[0];
              }
            }
          }
        }
        if (key === 'subjectId') {
          next.staffProfileId = '';
        }
        return next;
      });

      if (['dayOfWeek', 'startTime', 'endTime', 'staffProfileId', 'batchId'].includes(key)) {
        setConflictResult(null);
        setConflictChecked(false);
      }
      setErrors((e) => ({ ...e, [key]: undefined }));
    },
    [batches, scheduleType],
  );

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

  const { students: filteredStudents = [] } = useStudents({
    initialFilters: { batchId: form.batchId, perPage: 100 },
    autoFetch: !!form.batchId,
  });

  const { students: allStudents = [] } = useStudents({
    initialFilters: { perPage: 100 },
    autoFetch: scheduleType === 'ONE_TO_ONE',
  });

  const displayStudents = filteredStudents.length > 0 ? filteredStudents : allStudents;

  const handleScheduleTypeChange = (type: 'ONE_TIME' | 'RECURRING' | 'ONE_TO_ONE') => {
    setScheduleType(type);
    if (type === 'ONE_TIME' || type === 'ONE_TO_ONE') {
      const day = getWeekdayFromDateStr(singleDate);
      setForm((f) => ({
        ...f,
        effectiveFrom: singleDate,
        effectiveUntil: singleDate,
        dayOfWeek: day,
        ...(type === 'ONE_TO_ONE' ? { deliveryMode: 'ONLINE', recordingEnabled: true } : {}),
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

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.batchId) newErrors.batchId = 'Batch is required';
    if (scheduleType === 'ONE_TO_ONE' && !form.studentAdmissionId) {
      newErrors.studentAdmissionId = 'Target student is required for 1:1 class';
    }
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
    const branchId =
      selectedBatch?.branchId ||
      scheduleToEdit?.branchId ||
      scheduleToEdit?.branch?.id;
    const academicYearId =
      selectedBatch?.academicYearId ||
      scheduleToEdit?.academicYearId ||
      scheduleToEdit?.academicYear?.id;

    if (!form.batchId || !form.dayOfWeek || !branchId || !academicYearId) return null;
    return {
      branchId,
      academicYearId,
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
      recordingEnabled: form.recordingEnabled,
      whiteboardEnabled: form.whiteboardEnabled,
      chatEnabled: form.chatEnabled,
      studentAdmissionId: form.studentAdmissionId || undefined,
      sessionType: scheduleType === 'ONE_TO_ONE' ? 'ONE_TO_ONE' : scheduleType === 'ONE_TIME' ? 'GROUP' : 'BATCH',
      ...(form.roomId && { roomId: form.roomId }),
      ...(form.meetingLink && { meetingLink: form.meetingLink }),
      ...(form.notes && { notes: form.notes }),
    };
  };

  const handleCheckConflicts = () => {
    if (!validate()) {
      toast.error('Please fill in all required fields marked with *');
      return;
    }
    const payload = buildPayload();
    if (!payload) {
      toast.error('Please select valid batch and timing details');
      return;
    }

    runConflictCheck(payload, {
      onSuccess: (result) => {
        setConflictResult(result);
        setConflictChecked(true);
        if (!result.hasConflict) {
          toast.success('No Schedule Conflicts Found! ✨', {
            description: 'This time slot is completely free and ready to save.',
          });
        }
      },
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting || creating) return;

    if (!validate()) {
      toast.error('Please fill in all required fields marked with *');
      return;
    }

    const hasHardConflict = conflictResult?.conflicts.some((c) => c.type !== 'STUDENT') ?? false;
    if (hasHardConflict) {
      toast.error('Cannot save due to schedule conflicts. Please resolve conflicts first.');
      return;
    }

    const onlySoftConflict = conflictResult?.hasConflict && !hasHardConflict;
    const payload = buildPayload(onlySoftConflict);
    if (!payload) {
      toast.error('Invalid schedule parameters. Please check batch & day selection.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editId) {
        await api.patch(`/scheduling/schedules/${editId}`, payload);
        toast.success('Class Schedule Updated Successfully! 🚀', {
          description: `Updated schedule for ${selectedBatch?.name || 'Class'} on ${WEEKDAY_FULL_LABELS[form.dayOfWeek || 'MONDAY']}.`,
        });
      } else {
        await createSchedule(payload);
        toast.success('Class Schedule Created Successfully! 🚀', {
          description: `Scheduled ${selectedBatch?.name || 'Class'} on ${WEEKDAY_FULL_LABELS[form.dayOfWeek || 'MONDAY']} (${form.startTime} - ${form.endTime}).`,
        });
      }
      void queryClient.invalidateQueries();
      router.push('/dashboard/timetable');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save class schedule';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 pb-24 space-y-6 w-full">
      {/* Back Button & Page Header */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.push('/dashboard/timetable')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Timetable Calendar
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20 text-white shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {editId ? 'Edit Class Schedule ✏️' : 'Create New Class Schedule'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {editId
                ? 'Update timings, tutor, room, or delivery mode for this schedule'
                : 'Schedule one-time webinars or weekly recurring classes for batch courses'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Page Form Body */}
      <div className="space-y-6">
        {/* CARD 1: Class Details (Batch, Subject, Tutor) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-violet-600" />
            <span>1. Class Identification & Target Batch</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1: Course / Program */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Course / Program <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-600" />
                <select
                  value={form.courseId}
                  onChange={(e) => set('courseId', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all cursor-pointer"
                >
                  <option value="" className="text-slate-500 font-normal">
                    Select a Course...
                  </option>
                  {coursesList.map((c: any) => (
                    <option key={c.id} value={c.id} className="text-slate-800 font-bold">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Target Batch (Disabled until Course selected) */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Target Batch <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={form.batchId}
                  disabled={!form.courseId}
                  onChange={(e) => set('batchId', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    !form.courseId
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                      : 'bg-slate-50/50 text-slate-800 border-slate-200 cursor-pointer focus:border-violet-600 focus:ring-1 focus:ring-violet-600'
                  } ${errors.batchId ? 'border-red-300 bg-red-50/5' : ''}`}
                >
                  <option value="" className="text-slate-500 font-normal">
                    {!form.courseId ? 'Select a course first...' : 'Select a batch...'}
                  </option>
                  {filteredBatches.map((b: any) => (
                    <option key={b.id} value={b.id} className="text-slate-800 font-bold">
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
              {errors.batchId && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.batchId}</p>}
            </div>

            {/* Step 2.5: Enrolled Student (Rendered only when scheduleType === 'ONE_TO_ONE') */}
            {scheduleType === 'ONE_TO_ONE' && (
              <div>
                <label className="block text-xs font-extrabold text-violet-950 mb-1.5">
                  Target Student (1:1 Class) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-600" />
                  <select
                    value={form.studentAdmissionId}
                    disabled={!form.batchId}
                    onChange={(e) => set('studentAdmissionId', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      !form.batchId
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                        : 'bg-violet-50/70 text-violet-950 border-violet-200 cursor-pointer focus:border-violet-600 focus:ring-1 focus:ring-violet-600'
                    } ${errors.studentAdmissionId ? 'border-red-300 bg-red-50/5' : ''}`}
                  >
                    <option value="" className="text-slate-500 font-normal">
                      {!form.batchId ? 'Select a batch first...' : 'Select enrolled student...'}
                    </option>
                    {displayStudents.map((st: any) => (
                      <option key={st.id} value={st.id} className="text-slate-800 font-bold">
                        {st.firstName || st.name} {st.lastName || ''} ({st.admissionNo || st.email || st.code || 'Student'})
                      </option>
                    ))}
                  </select>
                </div>
                {errors.studentAdmissionId && (
                  <p className="text-xs text-red-500 mt-1 font-semibold">{errors.studentAdmissionId}</p>
                )}
              </div>
            )}

            {/* Step 3: Subject (Disabled until Batch selected) */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Subject <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={form.subjectId}
                  disabled={!form.batchId}
                  onChange={(e) => set('subjectId', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    !form.batchId
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                      : 'bg-slate-50/50 text-slate-800 border-slate-200 cursor-pointer focus:border-violet-600 focus:ring-1 focus:ring-violet-600'
                  } ${errors.subjectId ? 'border-red-300 bg-red-50/5' : ''}`}
                >
                  <option value="" className="text-slate-500 font-normal">
                    {!form.batchId ? 'Select a batch first...' : 'Select a subject...'}
                  </option>
                  {filteredSubjects.map((s: any) => (
                    <option key={s.id} value={s.id} className="text-slate-800 font-bold">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.subjectId && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.subjectId}</p>}
            </div>

            {/* Step 4: Tutor (Disabled until Subject selected) */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Assign Tutor / Faculty <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={form.staffProfileId}
                  disabled={!form.subjectId}
                  onChange={(e) => set('staffProfileId', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    !form.subjectId
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                      : 'bg-slate-50/50 text-slate-800 border-slate-200 cursor-pointer focus:border-violet-600 focus:ring-1 focus:ring-violet-600'
                  } ${errors.staffProfileId ? 'border-red-300 bg-red-50/5' : ''}`}
                >
                  <option value="" className="text-slate-500 font-normal">
                    {!form.subjectId ? 'Select a subject first...' : 'Select a tutor...'}
                  </option>
                  {filteredTutors.map((t: any) => (
                    <option key={t.id} value={t.id} className="text-slate-800 font-bold">
                      {t.firstName} {t.lastName} {t.employeeCode ? `(${t.employeeCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {errors.staffProfileId && (
                <p className="text-xs text-red-500 mt-1 font-semibold">{errors.staffProfileId}</p>
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: Schedule Pattern & Frequency */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-violet-600" />
            <span>2. Schedule Type & Timings</span>
          </h2>

          {/* Schedule Frequency Toggle Switcher (Weekly Recurring 1st) */}
          <div className="flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleScheduleTypeChange('RECURRING')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer',
                scheduleType === 'RECURRING'
                  ? 'bg-white text-violet-700 shadow-sm border border-slate-200/80 font-black'
                  : 'text-slate-500 hover:text-slate-800 font-bold',
              )}
            >
              <Repeat className="w-4 h-4 text-violet-600" />
              <span>Weekly Recurring Timetable 🔄</span>
            </button>
            <button
              type="button"
              onClick={() => handleScheduleTypeChange('ONE_TIME')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer',
                scheduleType === 'ONE_TIME'
                  ? 'bg-white text-violet-700 shadow-sm border border-slate-200/80 font-black'
                  : 'text-slate-500 hover:text-slate-800 font-bold',
              )}
            >
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span>Group One-Time Class 🎯</span>
            </button>
            <button
              type="button"
              onClick={() => handleScheduleTypeChange('ONE_TO_ONE')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl transition-all cursor-pointer',
                scheduleType === 'ONE_TO_ONE'
                  ? 'bg-violet-600 text-white shadow-sm border border-violet-600 font-black'
                  : 'text-slate-500 hover:text-slate-800 font-bold',
              )}
            >
              <Users className="w-4 h-4" />
              <span>1:1 Class (Personalized 👤)</span>
            </button>
          </div>

          {/* Option A: ONE-TIME / 1:1 Class Date */}
          {(scheduleType === 'ONE_TIME' || scheduleType === 'ONE_TO_ONE') && (
            <div className="bg-violet-50/70 border border-violet-200/80 p-4 rounded-2xl space-y-2">
              <label className="block text-xs font-extrabold text-violet-950">
                Select Exact Class Date 📅 <span className="text-red-500">*</span>
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
              <div className="flex items-center gap-1.5 text-xs text-violet-800 font-extrabold pt-1">
                <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
                <span suppressHydrationWarning>
                  {scheduleType === 'ONE_TO_ONE' ? '1:1 Personalized Class' : 'Single Class'} scheduled for {WEEKDAY_FULL_LABELS[form.dayOfWeek || 'MONDAY']},{' '}
                  {new Date(singleDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {scheduleType === 'ONE_TO_ONE' && (
                <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    ⏱️ <strong>Extra 15m Grace Time</strong>: The Live Class button stays active for an extra 15 minutes after class end time, then automatically completes and saves the MP4 recording to the Recordings Library!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Option B: RECURRING Day of Week Selector */}
          {scheduleType === 'RECURRING' && (
            <div className="space-y-3 bg-violet-50/50 border border-violet-100 p-4 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-extrabold text-slate-800">
                  Repeat Day of Week <span className="text-red-500">*</span>
                </label>

                {/* Starts From Date Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold text-violet-900">Starts From Date:</span>
                  <input
                    type="date"
                    value={form.effectiveFrom}
                    onChange={(e) => set('effectiveFrom', e.target.value)}
                    className="px-2.5 py-1 rounded-xl bg-white border border-violet-200 text-xs font-bold text-slate-800 outline-none focus:border-violet-600 transition-all cursor-pointer shadow-2xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => set('dayOfWeek', day)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer',
                      form.dayOfWeek === day
                        ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100',
                    )}
                  >
                    {WEEKDAY_FULL_LABELS[day]}
                  </button>
                ))}
              </div>
              {errors.dayOfWeek && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.dayOfWeek}</p>}

              {/* Dynamic Live Banner: From this date onwards */}
              <div className="flex items-center gap-2 text-xs text-violet-900 bg-white/90 border border-violet-200/80 px-3.5 py-2.5 rounded-xl font-extrabold shadow-2xs">
                <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
                <span suppressHydrationWarning>
                  Weekly Class repeats every <strong>{WEEKDAY_FULL_LABELS[form.dayOfWeek || 'MONDAY']}</strong> starting from{' '}
                  <span className="underline decoration-violet-400">
                    {new Date(form.effectiveFrom || getTodayDateStr()).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>{' '}
                  onwards 📅
                </span>
              </div>
            </div>
          )}

          {/* Time Slot Selection (User-Friendly UI/UX) */}
          <div className="mt-4 bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-violet-600" />
                <span>Class Time Slot & Duration</span>
              </label>

              {/* Live Duration & 12h Format Badge */}
              {form.startTime && form.endTime && form.startTime < form.endTime && (
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-violet-800 bg-violet-100/70 border border-violet-200 px-3 py-1 rounded-xl shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                  <span>
                    {(() => {
                      const format12Hour = (time24: string) => {
                        const [hStr, mStr] = time24.split(':');
                        let h = parseInt(hStr, 10);
                        const period = h >= 12 ? 'PM' : 'AM';
                        h = h % 12 || 12;
                        return `${String(h).padStart(2, '0')}:${mStr} ${period}`;
                      };
                      const [sH, sM] = form.startTime.split(':').map(Number);
                      const [eH, eM] = form.endTime.split(':').map(Number);
                      const diffMins = (eH * 60 + eM) - (sH * 60 + sM);
                      const hrs = Math.floor(diffMins / 60);
                      const mins = diffMins % 60;
                      const durationStr =
                        hrs > 0 && mins > 0
                          ? `${hrs}h ${mins}m`
                          : hrs > 0
                          ? `${hrs} hour${hrs > 1 ? 's' : ''}`
                          : `${mins} mins`;
                      return `${format12Hour(form.startTime)} – ${format12Hour(form.endTime)} (${durationStr})`;
                    })()}
                  </span>
                </div>
              )}
            </div>

            {/* Customizable Start Time & End Time Input Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Custom Start Time ⏰ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-600" />
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set('startTime', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all cursor-pointer shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Custom End Time ⏰ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-600" />
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set('endTime', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border text-sm font-bold text-slate-800 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all cursor-pointer shadow-2xs ${
                      errors.endTime ? 'border-red-300 bg-red-50/5' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.endTime && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.endTime}</p>}
              </div>
            </div>

            {/* Quick Class Duration Modifier Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500">Quick Duration:</span>
                {[1, 1.5, 2, 2.5, 3].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => {
                      if (!form.startTime) return;
                      const [h, m] = form.startTime.split(':').map(Number);
                      const totalMins = Math.round(h * 60 + m + hrs * 60);
                      const newH = Math.min(Math.floor(totalMins / 60), 23);
                      const newM = totalMins % 60;
                      const endStr = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
                      set('endTime', endStr);
                    }}
                    className="text-[10px] font-extrabold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                  >
                    +{hrs} {hrs === 1 ? 'Hour' : 'Hrs'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Course Length & Active Dates (Only for Recurring) */}
        {scheduleType === 'RECURRING' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-violet-600" />
                <span>3. Course Schedule Active Period</span>
              </h2>
              {selectedBatch?.name && (
                <span className="text-[11px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                  Auto-synced with Batch ✨
                </span>
              )}
            </div>

            {/* Customizable Course Length Selector */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all cursor-pointer shadow-2xs"
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

            {/* Date Range Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Starts On Date 📅
                </label>
                <input
                  type="date"
                  value={form.effectiveFrom}
                  onChange={(e) => set('effectiveFrom', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Repeats Until Date 📅
                </label>
                <input
                  type="date"
                  value={form.effectiveUntil}
                  onChange={(e) => set('effectiveUntil', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all cursor-pointer"
                />
              </div>
            </div>

            <div className="text-xs font-extrabold text-violet-800 bg-violet-50/80 border border-violet-200/80 p-3 rounded-xl flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
              <span>
                Class repeats every {WEEKDAY_FULL_LABELS[form.dayOfWeek || 'MONDAY']} from{' '}
                {form.effectiveFrom} to {form.effectiveUntil}
              </span>
            </div>
          </div>
        )}

        {/* CARD 4: Delivery Mode & Notes */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Wifi className="w-4 h-4 text-violet-600" />
            <span>4. Delivery Mode & Additional Notes</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['CLASSROOM', 'ONLINE', 'HYBRID'] as AttendanceModeType[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => set('deliveryMode', mode)}
                className={cn(
                  'flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer',
                  form.deliveryMode === mode
                    ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                )}
              >
                {mode === 'ONLINE' ? (
                  <Wifi className="w-4 h-4" />
                ) : mode === 'HYBRID' ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <Building2 className="w-4 h-4" />
                )}
                <span>
                  {mode === 'ONLINE'
                    ? 'Online Live Class'
                    : mode === 'HYBRID'
                    ? 'Hybrid Class (Both)'
                    : 'Classroom (Offline)'}
                </span>
              </button>
            ))}
          </div>



          {/* Notes */}
          <div className="pt-2">
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              Additional Class Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Add any specific instructions or syllabus topics for this class..."
              rows={2}
              className="w-full p-3 rounded-xl bg-slate-50/50 border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-violet-600 transition-all resize-none"
            />
          </div>

          {/* Live Classroom Feature Toggles */}
          <div className="pt-3 border-t border-slate-200/80 space-y-2">
            <label className="block text-xs font-extrabold text-slate-700">
              Live Classroom Feature Toggles
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-2xl border bg-slate-50 border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-all">
                <input
                  type="checkbox"
                  checked={form.recordingEnabled ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, recordingEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 accent-violet-600"
                />
                <div className="text-xs">
                  <span className="font-extrabold text-slate-800 block">🔴 Auto Record</span>
                  <span className="text-[10px] text-slate-500 font-medium">Record live stream MP4</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-2xl border bg-slate-50 border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-all">
                <input
                  type="checkbox"
                  checked={form.whiteboardEnabled ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, whiteboardEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 accent-violet-600"
                />
                <div className="text-xs">
                  <span className="font-extrabold text-slate-800 block">🎨 Whiteboard</span>
                  <span className="text-[10px] text-slate-500 font-medium">Interactive Excalidraw</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-2xl border bg-slate-50 border-slate-200/80 cursor-pointer hover:bg-slate-100/80 transition-all">
                <input
                  type="checkbox"
                  checked={form.chatEnabled ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, chatEnabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 accent-violet-600"
                />
                <div className="text-xs">
                  <span className="font-extrabold text-slate-800 block">💬 Student Chat</span>
                  <span className="text-[10px] text-slate-500 font-medium">In-room messaging</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Conflict Results Display */}
        {conflictChecked && conflictResult && (
          <div className="mt-4">
            {conflictResult.hasConflict ? (
              <ConflictAlert
                result={conflictResult}
                newStartTime={form.startTime}
                newEndTime={form.endTime}
                newDayOfWeek={form.dayOfWeek || undefined}
              />
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-emerald-900">No Schedule Conflicts Found! ✨</p>
                  <p className="text-[11px] font-semibold text-emerald-700">
                    This class time slot is clear and ready to save.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Controls Bar Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleCheckConflicts}
            disabled={checkingConflicts}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-extrabold hover:bg-amber-100 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            {checkingConflicts ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            ) : (
              <Search className="w-4 h-4 text-amber-600" />
            )}
            Check Conflicts
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/timetable')}
              className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {(() => {
              const hasHardConflict =
                conflictResult?.conflicts.some((c) => c.type !== 'STUDENT') ?? false;
              const onlySoftConflict = (conflictResult?.hasConflict ?? false) && !hasHardConflict;

              return (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    creating ||
                    (conflictChecked && (conflictResult?.hasConflict ?? false) && !onlySoftConflict)
                  }
                  className={cn(
                    'flex items-center gap-2 px-7 py-3 rounded-2xl text-white text-xs font-black transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                    onlySoftConflict
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                      : 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/20',
                  )}
                >
                  {(isSubmitting || creating) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {conflictChecked && conflictResult?.hasConflict ? (
                    onlySoftConflict ? (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        Save Schedule Anyway
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        Resolve Conflicts
                      </>
                    )
                  ) : editId ? (
                    'Update Schedule 🚀'
                  ) : (
                    'Create Schedule 🚀'
                  )}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
  );
}

export default function CreateSchedulePage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
          </div>
        </DashboardLayout>
      }
    >
      <CreateScheduleContent />
    </Suspense>
  );
}
