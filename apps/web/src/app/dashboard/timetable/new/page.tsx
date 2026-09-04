'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Users,
  BookOpen,
  GraduationCap,
  Repeat,
  Calendar,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ShieldAlert,
  AlertTriangle,
  Building2,
  Video,
  Globe,
  Radio,
  FileText,
  Sparkles,
  Check,
  MessageSquare,
  PenTool,
  Disc,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { useBatches, useCourses, useStudents } from '@/features/students/hooks/use-students';
import { useTutors } from '@/features/tutors/hooks/use-tutors';
import { useSubjects } from '@/features/master-data/hooks/use-subjects';
import {
  useCheckConflicts,
  useCreateSchedule,
  useRooms,
} from '@/features/scheduling/hooks/use-schedules';
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

export default function CreateSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');
  const queryClient = useQueryClient();

  // Schedule Frequency Switcher (Default: RECURRING)
  const [scheduleType, setScheduleType] = useState<'ONE_TIME' | 'RECURRING' | 'ONE_TO_ONE'>(
    'RECURRING',
  );
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
  const { data: roomsData } = useRooms();

  // Fetch schedule details if editId exists
  const { data: scheduleToEdit } = useQuery({
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
      const cId =
        matchedBatch?.courseId || matchedBatch?.course?.id || scheduleToEdit.courseId || '';

      setForm({
        courseId: cId,
        batchId: bId,
        studentAdmissionId: scheduleToEdit.studentAdmissionId || '',
        subjectId: scheduleToEdit.subjectId || '',
        staffProfileId: scheduleToEdit.staffProfileId || scheduleToEdit.staffProfile?.id || '',
        dayOfWeek: scheduleToEdit.dayOfWeek || 'MONDAY',
        startTime: scheduleToEdit.startTime || '08:00',
        endTime: scheduleToEdit.endTime || '10:00',
        effectiveFrom: scheduleToEdit.effectiveFrom
          ? scheduleToEdit.effectiveFrom.split('T')[0]
          : getTodayDateStr(),
        effectiveUntil: scheduleToEdit.effectiveUntil
          ? scheduleToEdit.effectiveUntil.split('T')[0]
          : getNextYearDateStr(),
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

  const roomsList = (roomsData ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    code: r.code || '',
    capacity: r.capacity || 0,
    roomType: r.roomType || 'CLASSROOM',
  }));

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
    (key: keyof FormState, value: any) => {
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

      if (
        [
          'dayOfWeek',
          'startTime',
          'endTime',
          'staffProfileId',
          'batchId',
          'roomId',
          'effectiveFrom',
          'effectiveUntil',
        ].includes(key)
      ) {
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
      scheduleToEdit?.branch?.id ||
      '00000000-0000-0000-0000-000000000002';
    const academicYearId =
      selectedBatch?.academicYearId ||
      scheduleToEdit?.academicYearId ||
      scheduleToEdit?.academicYear?.id ||
      '00000000-0000-0000-0000-000000000005';

    if (!form.batchId || !form.dayOfWeek) return null;
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
      sessionType:
        scheduleType === 'ONE_TO_ONE'
          ? 'ONE_TO_ONE'
          : scheduleType === 'ONE_TIME'
            ? 'GROUP'
            : 'BATCH',
      ...(form.roomId && { roomId: form.roomId }),
      ...(form.meetingLink && { meetingLink: form.meetingLink }),
      ...(form.notes && { notes: form.notes }),
    };
  };

  const handleCheckConflicts = () => {
    if (!validate()) {
      toast.error('Please fill in all required fields marked with * before checking conflicts.');
      return;
    }

    const payload = buildPayload(false);
    if (!payload) return;

    runConflictCheck(
      { ...payload, ...(editId ? { excludeScheduleId: editId } : {}) },
      {
        onSuccess: (data: ConflictResult) => {
          setConflictResult(data);
          setConflictChecked(true);
          if (data.hasConflict) {
            toast.warning('Schedule conflicts detected!', {
              description: `${data.conflicts.length} conflict(s) found. Please review details below.`,
            });
          } else {
            toast.success('No Schedule Conflicts Found!', {
              description: 'Tutor, Batch, and Room are completely available at this time slot.',
            });
          }
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || 'Failed to check conflicts';
          toast.error(msg);
        },
      },
    );
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
        toast.success('Class Schedule Updated Successfully!', {
          description: `Updated schedule for ${selectedBatch?.name || 'Class'} on ${WEEKDAY_FULL_LABELS[form.dayOfWeek || 'MONDAY']}.`,
        });
      } else {
        await createSchedule(payload);
        toast.success('Class Schedule Created Successfully!', {
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
      <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-24">
        {/* Header Banner - ISML LMS Light Blue Style */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shrink-0 cursor-pointer"
              onClick={() => router.push('/dashboard/timetable')}
            >
              <ArrowLeft className="h-5 w-5 text-[#0052CC]" />
            </Button>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
                <span>Timetable Calendar</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
                <span>{editId ? 'Edit Schedule' : 'Create Schedule'}</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
                {editId ? 'Edit Class Schedule' : 'Create New Class Schedule'}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                {editId
                  ? 'Update timings, tutor, room, or delivery mode for this schedule.'
                  : 'Schedule one-time webinars or weekly recurring classes for batch courses.'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/timetable')}
            className="px-4 gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs shrink-0 shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#0052CC]" />
            Cancel & Exit
          </Button>
        </div>

        {/* Main Page Form Body */}
        <div className="space-y-6">
          {/* CARD 1: Class Details (Batch, Subject, Tutor) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#0052CC]" />
              <span>1. Class Identification & Target Batch</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1: Course / Program */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Course / Program *
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0052CC]" />
                  <select
                    value={form.courseId}
                    onChange={(e) => set('courseId', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#0052CC] transition-all cursor-pointer"
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

              {/* Step 2: Target Batch */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Target Batch *
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.batchId}
                    disabled={!form.courseId}
                    onChange={(e) => set('batchId', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      !form.courseId
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                        : 'bg-slate-50 text-slate-800 border-slate-200 cursor-pointer focus:border-[#0052CC]'
                    } ${errors.batchId ? 'border-rose-300 bg-rose-50' : ''}`}
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
                {errors.batchId && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.batchId}</p>
                )}
              </div>

              {/* Step 2.5: Enrolled Student (Rendered only when scheduleType === 'ONE_TO_ONE') */}
              {scheduleType === 'ONE_TO_ONE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Target Student (1:1 Class) *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0052CC]" />
                    <select
                      value={form.studentAdmissionId}
                      disabled={!form.batchId}
                      onChange={(e) => set('studentAdmissionId', e.target.value)}
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                        !form.batchId
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                          : 'bg-blue-50 text-[#0B2447] border-blue-200 cursor-pointer focus:border-[#0052CC]'
                      } ${errors.studentAdmissionId ? 'border-rose-300 bg-rose-50' : ''}`}
                    >
                      <option value="" className="text-slate-500 font-normal">
                        {!form.batchId ? 'Select a batch first...' : 'Select enrolled student...'}
                      </option>
                      {displayStudents.map((st: any) => (
                        <option key={st.id} value={st.id} className="text-slate-800 font-bold">
                          {st.firstName || st.name} {st.lastName || ''} (
                          {st.admissionNo || st.email || st.code || 'Student'})
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.studentAdmissionId && (
                    <p className="text-xs text-rose-500 mt-1 font-semibold">
                      {errors.studentAdmissionId}
                    </p>
                  )}
                </div>
              )}

              {/* Step 3: Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Subject *
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.subjectId}
                    disabled={!form.batchId}
                    onChange={(e) => set('subjectId', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      !form.batchId
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                        : 'bg-slate-50 text-slate-800 border-slate-200 cursor-pointer focus:border-[#0052CC]'
                    } ${errors.subjectId ? 'border-rose-300 bg-rose-50' : ''}`}
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
                {errors.subjectId && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">{errors.subjectId}</p>
                )}
              </div>

              {/* Step 4: Tutor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Assign Tutor / Faculty *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={form.staffProfileId}
                    disabled={!form.subjectId}
                    onChange={(e) => set('staffProfileId', e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      !form.subjectId
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-75'
                        : 'bg-slate-50 text-slate-800 border-slate-200 cursor-pointer focus:border-[#0052CC]'
                    } ${errors.staffProfileId ? 'border-rose-300 bg-rose-50' : ''}`}
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
                  <p className="text-xs text-rose-500 mt-1 font-semibold">
                    {errors.staffProfileId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: Schedule Pattern & Frequency */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#0052CC]" />
              <span>2. Schedule Type & Timings</span>
            </h2>

            {/* Schedule Frequency Toggle Switcher */}
            <div className="flex p-1 bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleScheduleTypeChange('RECURRING')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all cursor-pointer',
                  scheduleType === 'RECURRING'
                    ? 'bg-[#0052CC] text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-[#0B2447]',
                )}
              >
                <Repeat className="w-4 h-4" />
                <span>Weekly Recurring Timetable</span>
              </button>
              <button
                type="button"
                onClick={() => handleScheduleTypeChange('ONE_TIME')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all cursor-pointer',
                  scheduleType === 'ONE_TIME'
                    ? 'bg-[#0052CC] text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-[#0B2447]',
                )}
              >
                <Calendar className="w-4 h-4" />
                <span>Group One-Time Class</span>
              </button>
              <button
                type="button"
                onClick={() => handleScheduleTypeChange('ONE_TO_ONE')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all cursor-pointer',
                  scheduleType === 'ONE_TO_ONE'
                    ? 'bg-[#0052CC] text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-[#0B2447]',
                )}
              >
                <Users className="w-4 h-4" />
                <span>1:1 Class (Personalized)</span>
              </button>
            </div>

            {/* Option A: ONE-TIME / 1:1 Class Date */}
            {(scheduleType === 'ONE_TIME' || scheduleType === 'ONE_TO_ONE') && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-[#0B2447] uppercase">
                  Select Class Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0052CC]" />
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => handleSingleDateChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-blue-200 text-xs font-bold text-slate-800 outline-none focus:border-[#0052CC] transition-all cursor-pointer shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* Option B: RECURRING Day of Week Selector */}
            {scheduleType === 'RECURRING' && (
              <div className="space-y-3 bg-blue-50/50 border border-blue-200 p-4 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase">
                    Repeat Day of Week *
                  </label>

                  {/* Starts From Date Picker */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#0052CC]">Starts From Date:</span>
                    <input
                      type="date"
                      value={form.effectiveFrom}
                      onChange={(e) => set('effectiveFrom', e.target.value)}
                      className="px-2.5 py-1 rounded-xl bg-white border border-blue-200 text-xs font-bold text-slate-800 outline-none focus:border-[#0052CC] transition-all cursor-pointer shadow-2xs"
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
                        'px-4 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer',
                        form.dayOfWeek === day
                          ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100',
                      )}
                    >
                      {WEEKDAY_FULL_LABELS[day]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  Start Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0052CC]" />
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set('startTime', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-[#0052CC]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                  End Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set('endTime', e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-[#0052CC]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: Delivery Mode, Location & Live Studio Features */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-2xs">
            <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0052CC]" />
              <span>3. Delivery Mode, Location & Live Studio Controls</span>
            </h2>

            {/* Delivery Mode Pills */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Delivery / Attendance Mode *
              </label>
              <div className="grid grid-cols-3 gap-3 max-w-xl">
                <button
                  type="button"
                  onClick={() => set('deliveryMode', 'CLASSROOM')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer',
                    form.deliveryMode === 'CLASSROOM'
                      ? 'bg-blue-50 border-[#0052CC] text-[#0052CC] shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <Building2 className="w-4 h-4" />
                  <span>On-Premise Classroom</span>
                </button>
                <button
                  type="button"
                  onClick={() => set('deliveryMode', 'ONLINE')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer',
                    form.deliveryMode === 'ONLINE'
                      ? 'bg-blue-50 border-[#0052CC] text-[#0052CC] shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <Video className="w-4 h-4" />
                  <span>Online Live Class</span>
                </button>
                <button
                  type="button"
                  onClick={() => set('deliveryMode', 'HYBRID')}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer',
                    form.deliveryMode === 'HYBRID'
                      ? 'bg-blue-50 border-[#0052CC] text-[#0052CC] shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <Globe className="w-4 h-4" />
                  <span>Hybrid (Class + Live)</span>
                </button>
              </div>
            </div>

            {/* Room / Meeting Link Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Classroom Room Selector */}
              {(form.deliveryMode === 'CLASSROOM' || form.deliveryMode === 'HYBRID') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Select Classroom / Hall *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0052CC]" />
                    <select
                      value={form.roomId}
                      onChange={(e) => set('roomId', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#0052CC] transition-all cursor-pointer"
                    >
                      <option value="" className="text-slate-500 font-normal">
                        Select a room (optional)...
                      </option>
                      {roomsList.map((r: any) => (
                        <option key={r.id} value={r.id} className="text-slate-800 font-bold">
                          {r.name} {r.code ? `(${r.code})` : ''} - Cap: {r.capacity}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Online Meeting Link */}
              {(form.deliveryMode === 'ONLINE' || form.deliveryMode === 'HYBRID') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Online Meeting / LiveKit Room Link (Optional)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0052CC]" />
                    <input
                      type="text"
                      placeholder="e.g. https://meet.neetplatform.com/room-physics-1"
                      value={form.meetingLink}
                      onChange={(e) => set('meetingLink', e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#0052CC]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes / Special Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                Notes & Instructions (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Add special topic instructions, pre-requisites, or homework reminders for students..."
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-[#0052CC]"
              />
            </div>
          </div>

          {/* CARD 4: Schedule Conflict Analysis & Verification System */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#0052CC]" />
                  <span>4. Schedule Conflict Analysis & Verification System</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Run automated conflict checks across Faculty availability, Target Batch
                  timetables, and Room allocations.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleCheckConflicts}
                disabled={checkingConflicts}
                className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-[#0052CC] border border-indigo-200 text-xs font-extrabold rounded-xl shrink-0 gap-2 cursor-pointer shadow-2xs transition-all"
              >
                {checkingConflicts ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0052CC]" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-[#0052CC]" />
                )}
                <span>
                  {checkingConflicts ? 'Analyzing Timetables...' : 'Run Conflict Check ⚡'}
                </span>
              </Button>
            </div>

            {/* Conflict Check Results Display */}
            {conflictChecked && conflictResult && (
              <div className="space-y-3 pt-2">
                {!conflictResult.hasConflict ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-900 animate-in fade-in zoom-in duration-200">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-extrabold text-emerald-800">
                        ✅ No Schedule Conflicts Detected!
                      </h4>
                      <p className="text-xs text-emerald-700 font-medium mt-0.5">
                        Tutor, Target Batch, and Room allocation are completely available for this
                        schedule slot. You can safely confirm and save this class.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3 text-rose-900 animate-in fade-in zoom-in duration-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-extrabold text-rose-800">
                          ⚠️ Schedule Conflict Detected ({conflictResult.conflicts.length}{' '}
                          conflict(s))
                        </h4>
                        <p className="text-xs text-rose-700 font-medium mt-0.5">
                          Please resolve the overlapping timetables below before confirming.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pl-9">
                      {conflictResult.conflicts.map((conf, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-rose-200 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                conf.type === 'TUTOR'
                                  ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                  : conf.type === 'BATCH'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                    : conf.type === 'ROOM'
                                      ? 'bg-purple-100 text-purple-700 border border-purple-300'
                                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                              }`}
                            >
                              {conf.type} CONFLICT
                            </span>
                            <span className="font-bold text-slate-800">{conf.message}</span>
                          </div>

                          {conf.existingSchedule && (
                            <span className="text-[11px] font-mono text-slate-500 font-medium">
                              Overlap: {conf.existingSchedule.dayOfWeek} (
                              {conf.existingSchedule.startTime} - {conf.existingSchedule.endTime})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/timetable')}
              className="rounded-xl text-xs font-bold h-11 px-6 border-slate-200 text-slate-700 cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleCheckConflicts}
              disabled={checkingConflicts}
              variant="outline"
              className="rounded-xl border-indigo-200 text-[#0052CC] hover:bg-indigo-50 font-bold text-xs h-11 px-5 gap-1.5 cursor-pointer shadow-2xs"
            >
              {checkingConflicts ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
              <span>Check Conflicts</span>
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || creating}
              className="rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm h-11 px-8 gap-2 shadow-2xs transition-all cursor-pointer"
            >
              {isSubmitting || creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {isSubmitting || creating
                  ? 'Saving...'
                  : editId
                    ? 'Update Schedule'
                    : 'Confirm & Save Schedule'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
