'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useBatches, useCourses } from '@/features/students/hooks/use-students';
import { useCreateExam, useCheckExamConflict } from '@/features/offline-exams/hooks/use-admin-exams';
import type { SectionConfigItem } from '@/features/offline-exams/types/admin-exams';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Clock,
  FileText,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

function CreateExamContent() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const { courses } = useCourses();
  const { batches } = useBatches();

  // Form state
  const [courseId, setCourseId] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState('WEEKLY');
  const [mode, setMode] = useState('OFFLINE');

  const [durationMinutes, setDurationMinutes] = useState(120);
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [scheduledStartAt, setScheduledStartAt] = useState('');
  const [scheduledEndAt, setScheduledEndAt] = useState('');
  const [examWindowStart, setExamWindowStart] = useState('');
  const [examWindowEnd, setExamWindowEnd] = useState('');
  const [requireFullDurationWindow, setRequireFullDurationWindow] = useState(false);

  const [totalMarks, setTotalMarks] = useState(720);
  const [passingMarks, setPassingMarks] = useState(360);
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(true);
  const [negativeMarkingValue, setNegativeMarkingValue] = useState(1);
  const [allowLateUpload, setAllowLateUpload] = useState(true);
  const [allowReplaceUpload, setAllowReplaceUpload] = useState(true);

  const [sections, setSections] = useState<SectionConfigItem[]>([
    { name: 'Physics', maxMarks: 180 },
    { name: 'Chemistry', maxMarks: 180 },
    { name: 'Botany', maxMarks: 180 },
    { name: 'Zoology', maxMarks: 180 },
  ]);

  const createExamMutation = useCreateExam();
  const checkConflictMutation = useCheckExamConflict();

  const [conflictResult, setConflictResult] = useState<{
    hasConflict: boolean;
    conflicts: any[];
  } | null>(null);
  const [conflictChecked, setConflictChecked] = useState(false);

  const availableBatches = courseId
    ? batches.filter((b) => !b.courseId || b.courseId === courseId)
    : [];

  const handleRunConflictCheck = () => {
    if (!isStep1Valid || !isStep2Valid) {
      toast.error('Please enter Title, Course, Batches and Exam Window dates first!');
      return;
    }

    const startIso = parseLocalDateTime(scheduledStartAt);
    const futureDate = new Date(Date.now() + durationMinutes * 60 * 1000);
    const futureIso = futureDate.toISOString();

    const endIso = scheduledEndAt ? parseLocalDateTime(scheduledEndAt) : futureIso;
    const winStartIso = examWindowStart ? parseLocalDateTime(examWindowStart) : startIso;
    const winEndIso = examWindowEnd ? parseLocalDateTime(examWindowEnd) : endIso;

    const selectedCourseId = courseId || courses[0]?.id || 'course-default';
    const finalBatchIds =
      selectedBatchIds.length > 0 ? selectedBatchIds : [batches[0]?.id || 'batch-default'];

    checkConflictMutation.mutate(
      {
        courseId: selectedCourseId,
        batchIds: finalBatchIds,
        examWindowStart: winStartIso,
        examWindowEnd: winEndIso,
        scheduledStartAt: startIso,
        scheduledEndAt: endIso,
      },
      {
        onSuccess: (data) => {
          setConflictResult(data);
          setConflictChecked(true);
          if (data.hasConflict) {
            toast.warning('Schedule conflicts detected!', {
              description: `${data.conflicts.length} conflict(s) found. Please review details below.`,
            });
          } else {
            toast.success('No Schedule Conflicts Found! ⚡', {
              description: 'Target Batches & Time slots are 100% available for this exam window.',
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

  const isStep1Valid = Boolean(
    title.trim() !== '' && courseId !== '' && selectedBatchIds.length > 0,
  );

  const isStep2Valid = Boolean(
    examWindowStart !== '' && examWindowEnd !== '' && durationMinutes > 0,
  );

  const isStep3Valid = Boolean(
    totalMarks > 0 &&
    passingMarks >= 0 &&
    sections.length > 0 &&
    sections.every((s) => s.name.trim() !== ''),
  );

  const canGoToStep = (targetStep: number): boolean => {
    if (targetStep === 1) return true;
    if (targetStep === 2) return isStep1Valid;
    if (targetStep === 3) return isStep1Valid && isStep2Valid;
    if (targetStep === 4) return isStep1Valid && isStep2Valid && isStep3Valid;
    return false;
  };

  const handleAddSection = () => {
    setSections([...sections, { name: `Section ${sections.length + 1}`, maxMarks: 100 }]);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: keyof SectionConfigItem, value: any) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const parseLocalDateTime = (str: string): string => {
    if (!str) return new Date().toISOString();
    const parts = str.split(/[-T:]/).map(Number);
    if (parts.length >= 5) {
      return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4]).toISOString();
    }
    return new Date(str).toISOString();
  };

  const isSubmittingRef = useRef(false);

  const handleSubmit = () => {
    if (isSubmittingRef.current || createExamMutation.isPending) return;
    isSubmittingRef.current = true;

    const startIso = parseLocalDateTime(scheduledStartAt);
    const futureDate = new Date(Date.now() + durationMinutes * 60 * 1000);
    const futureIso = futureDate.toISOString();

    const endIso = scheduledEndAt ? parseLocalDateTime(scheduledEndAt) : futureIso;
    const winStartIso = examWindowStart ? parseLocalDateTime(examWindowStart) : startIso;
    const winEndIso = examWindowEnd ? parseLocalDateTime(examWindowEnd) : endIso;

    const selectedCourseId = courseId || courses[0]?.id || 'course-default';
    const finalBatchIds =
      selectedBatchIds.length > 0 ? selectedBatchIds : [batches[0]?.id || 'batch-default'];

    createExamMutation.mutate(
      {
        courseId: selectedCourseId,
        batchIds: finalBatchIds,
        subjectId: subjectId || 'subject-default',
        academicYearId: academicYearId || 'year-default',
        title,
        description,
        examType: examType as any,
        mode: mode as any,
        totalMarks: Number(totalMarks),
        passingMarks: Number(passingMarks),
        negativeMarkingEnabled: Boolean(negativeMarkingEnabled),
        negativeMarkingValue: Number(negativeMarkingValue),
        durationMinutes: Number(durationMinutes),
        graceMinutes: Number(graceMinutes),
        scheduledStartAt: startIso,
        scheduledEndAt: endIso,
        examWindowStart: winStartIso,
        examWindowEnd: winEndIso,
        requireFullDurationWindow: Boolean(requireFullDurationWindow),
        allowLateUpload: Boolean(allowLateUpload),
        allowReplaceUpload: Boolean(allowReplaceUpload),
        sectionConfig: sections,
      },
      {
        onSuccess: () => {
          router.push('/dashboard/exams');
        },
        onError: () => {
          isSubmittingRef.current = false;
        },
      },
    );
  };

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* Header Banner - ISML LMS Light Blue Style */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shrink-0"
            onClick={() => router.push('/dashboard/exams')}
          >
            <ArrowLeft className="h-5 w-5 text-[#0052CC]" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
              <span>Exams Schedule</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Step {step} of 4</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
              Create New Exam
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Configure exam schedules, target batches, total marks, and dynamic subject sections.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/exams')}
          className="px-4 gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs shrink-0 shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#0052CC]" />
          Cancel & Exit
        </Button>
      </div>

      {/* Main Page Card Form */}
      <div className="w-full space-y-6">
        {/* Wizard Step Indicator Bar */}
        <Card className="rounded-2xl border-slate-200 bg-white p-2 shadow-2xs">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
            {[
              { num: 1, label: 'Basic Info' },
              { num: 2, label: 'Timing Window' },
              { num: 3, label: 'Marks & Sections' },
              { num: 4, label: 'Rules & Finish' },
            ].map((s) => {
              const allowed = canGoToStep(s.num);
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (allowed) {
                      setStep(s.num as any);
                    } else {
                      if (!isStep1Valid) {
                        toast.error('Please complete Step 1 (Title, Course & Batches) first!');
                      } else if (!isStep2Valid) {
                        toast.error('Please complete Step 2 (Start & End Windows) first!');
                      } else if (!isStep3Valid) {
                        toast.error('Please complete Step 3 (Marks & Sections) first!');
                      }
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl transition-all font-extrabold ${
                    step === s.num
                      ? 'bg-[#0052CC] text-white shadow-2xs'
                      : step > s.num
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : allowed
                          ? 'text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 bg-slate-50 cursor-not-allowed opacity-60'
                  }`}
                >
                  {s.num}. {s.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Wizard Form Sections */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-2xs p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-base font-extrabold text-[#0B2447] flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-5 h-5 text-[#0052CC]" />
                Step 1: Exam Basic Information
              </h3>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 uppercase">Exam Title *</Label>
                  {!title.trim() && (
                    <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-500" /> Required to proceed
                    </span>
                  )}
                </div>
                <Input
                  type="text"
                  placeholder="e.g. NEET Grand Test 05 — Full Syllabus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`rounded-xl h-11 text-xs font-medium ${
                    !title.trim()
                      ? 'border-amber-300 bg-amber-50/20 focus:border-amber-500'
                      : 'border-slate-200 focus:border-[#0052CC]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 uppercase">Course *</Label>
                    {!courseId && (
                      <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-500" /> Select a course
                      </span>
                    )}
                  </div>
                  <select
                    value={courseId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setCourseId(selectedId);
                      if (!selectedId) {
                        setSelectedBatchIds([]);
                      } else {
                        const filtered = batches.filter(
                          (b) => !b.courseId || b.courseId === selectedId,
                        );
                        setSelectedBatchIds(filtered.map((b) => b.id));
                      }
                    }}
                    className={`w-full bg-white border rounded-xl h-11 px-3 text-xs font-medium focus:outline-none ${
                      !courseId
                        ? 'border-amber-300 bg-amber-50/20 focus:border-amber-500'
                        : 'border-slate-200 focus:border-[#0052CC]'
                    }`}
                  >
                    <option value="">Select Course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 uppercase">
                      Target Batches ({selectedBatchIds.length} Selected)
                    </Label>
                    {courseId && availableBatches.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedBatchIds.length === availableBatches.length) {
                            setSelectedBatchIds([]);
                          } else {
                            setSelectedBatchIds(availableBatches.map((b) => b.id));
                          }
                        }}
                        className="text-[11px] text-[#0052CC] font-bold hover:underline"
                      >
                        {selectedBatchIds.length === availableBatches.length
                          ? 'Deselect All'
                          : 'Select All'}
                      </button>
                    )}
                  </div>

                  {!courseId ? (
                    <div className="flex flex-col items-center justify-center p-5 bg-amber-50/40 border border-dashed border-amber-200 rounded-xl text-center min-h-[110px]">
                      <Layers className="w-6 h-6 text-amber-500 mb-1" />
                      <p className="text-xs font-bold text-slate-700">Select a Course First</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Batches linked to the chosen course will appear here.
                      </p>
                    </div>
                  ) : availableBatches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-200 rounded-xl text-center min-h-[110px]">
                      <p className="text-xs font-bold text-slate-600">No Batches Mapped</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No active batches found for the selected course.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      {availableBatches.map((b) => (
                        <label
                          key={b.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition ${
                            selectedBatchIds.includes(b.id)
                              ? 'bg-blue-50 border-blue-200 text-[#0052CC] font-extrabold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedBatchIds.includes(b.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBatchIds([...selectedBatchIds, b.id]);
                              } else {
                                setSelectedBatchIds(selectedBatchIds.filter((id) => id !== b.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC]"
                          />
                          <span>{b.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase">
                  Description / Instructions
                </Label>
                <textarea
                  rows={3}
                  placeholder="e.g. Darken bubbles completely using black ballpoint pen only..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0052CC] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase">Exam Type</Label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl h-11 px-3 text-xs font-medium focus:outline-none focus:border-[#0052CC]"
                  >
                    <option value="WEEKLY">Weekly Test</option>
                    <option value="MONTHLY">Monthly Test</option>
                    <option value="GRAND">Grand Test</option>
                    <option value="FULL_SYLLABUS">Full Syllabus</option>
                    <option value="REVISION">Revision</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase">Exam Mode</Label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl h-11 px-3 text-xs font-medium focus:outline-none focus:border-[#0052CC]"
                  >
                    <option value="OFFLINE">Offline OMR</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONLINE">Online CBT</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h3 className="text-base font-extrabold text-[#0B2447] flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="w-5 h-5 text-[#0052CC]" />
                Step 2: Schedule & Exam Window
              </h3>

              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-[#0052CC] flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#0052CC] shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold mb-0.5">Exam Window vs Duration Explanation</p>
                  <p className="text-slate-600 font-medium">
                    Students can click "Ready to Start" anytime during the Exam Window. The
                    countdown timer starts only when the student opens the exam.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase">
                    Exam Window Start *
                  </Label>
                  <Input
                    type="datetime-local"
                    value={examWindowStart}
                    onChange={(e) => {
                      const val = e.target.value;
                      setExamWindowStart(val);
                      if (val && examWindowEnd) {
                        const startMs = new Date(val).getTime();
                        const endMs = new Date(examWindowEnd).getTime();
                        if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
                          const diff = Math.round((endMs - startMs) / (1000 * 60));
                          if (diff > 0) setDurationMinutes(diff);
                        }
                      }
                    }}
                    className="rounded-xl h-11 border-slate-200 focus:border-[#0052CC] text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase">
                    Exam Window End *
                  </Label>
                  <Input
                    type="datetime-local"
                    value={examWindowEnd}
                    onChange={(e) => {
                      const val = e.target.value;
                      setExamWindowEnd(val);
                      if (examWindowStart && val) {
                        const startMs = new Date(examWindowStart).getTime();
                        const endMs = new Date(val).getTime();
                        if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
                          const diff = Math.round((endMs - startMs) / (1000 * 60));
                          if (diff > 0) setDurationMinutes(diff);
                        }
                      }
                    }}
                    className="rounded-xl h-11 border-slate-200 focus:border-[#0052CC] text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase">
                    Student Duration (Minutes) *
                  </Label>
                  <Input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="rounded-xl h-11 border-slate-200 focus:border-[#0052CC] text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase">
                    Grace Period (Minutes)
                  </Label>
                  <Input
                    type="number"
                    value={graceMinutes}
                    onChange={(e) => setGraceMinutes(Number(e.target.value))}
                    className="rounded-xl h-11 border-slate-200 focus:border-[#0052CC] text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-[#0B2447]">
                    Require Full Duration Available
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    If enabled, blocks student start if remaining window time is less than duration
                    minutes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requireFullDurationWindow}
                  onChange={(e) => setRequireFullDurationWindow(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC]"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-base font-extrabold text-[#0B2447] flex items-center gap-2 border-b border-slate-100 pb-3">
                <Layers className="w-5 h-5 text-[#0052CC]" />
                Step 3: Marks & Dynamic Section Breakdown
              </h3>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase">
                    Total Marks *
                  </Label>
                  <Input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="rounded-xl h-11 border-slate-200 focus:border-[#0052CC] text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase">
                    Passing Marks *
                  </Label>
                  <Input
                    type="number"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(Number(e.target.value))}
                    className="rounded-xl h-11 border-slate-200 focus:border-[#0052CC] text-xs font-medium"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#0B2447] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#0052CC]" />
                      Dynamic Section Breakdown
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Tutor evaluation form will dynamically build input fields from these sections.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddSection}
                    className="h-9 px-3 bg-blue-50 hover:bg-blue-100 text-[#0052CC] rounded-xl text-xs font-bold border border-blue-200"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Section
                  </Button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs"
                    >
                      <Input
                        type="text"
                        placeholder="Section Name (e.g. Physics)"
                        value={sec.name}
                        onChange={(e) => handleSectionChange(idx, 'name', e.target.value)}
                        className="flex-1 rounded-lg h-9 text-xs border-slate-200 font-medium"
                      />
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <span>Max Marks:</span>
                        <Input
                          type="number"
                          value={sec.maxMarks}
                          onChange={(e) =>
                            handleSectionChange(idx, 'maxMarks', Number(e.target.value))
                          }
                          className="w-20 rounded-lg h-9 text-xs text-center border-slate-200 font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(idx)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h3 className="text-base font-extrabold text-[#0B2447] flex items-center gap-2 border-b border-slate-100 pb-3">
                <CheckCircle2 className="w-5 h-5 text-[#0052CC]" />
                Step 4: Rules & Final Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-[#0B2447]">Allow Replace Upload</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Students can re-upload before window ends
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowReplaceUpload}
                    onChange={(e) => setAllowReplaceUpload(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC]"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-[#0B2447]">Allow Late Upload</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Allow uploads during grace period
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowLateUpload}
                    onChange={(e) => setAllowLateUpload(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC]"
                  />
                </div>
              </div>

              {/* Final Summary Card & Conflict Results */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-[#0B2447] text-sm">
                    Exam Configuration Summary
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRunConflictCheck}
                    disabled={checkConflictMutation.isPending || !isStep1Valid || !isStep2Valid}
                    className="h-8 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 font-extrabold text-xs gap-1.5 cursor-pointer"
                  >
                    {checkConflictMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      '⚡ Check Conflict'
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-600 font-medium">
                  <p>
                    Title:{' '}
                    <span className="text-[#0B2447] font-extrabold">
                      {title || 'Untitled Exam'}
                    </span>
                  </p>
                  <p>
                    Type/Mode:{' '}
                    <span className="text-[#0B2447] font-extrabold">
                      {examType} / {mode}
                    </span>
                  </p>
                  <p>
                    Duration:{' '}
                    <span className="text-[#0B2447] font-extrabold">{durationMinutes} mins</span>
                  </p>
                  <p>
                    Marks:{' '}
                    <span className="text-[#0B2447] font-extrabold">
                      {totalMarks} (Pass: {passingMarks})
                    </span>
                  </p>
                  <p>
                    Sections:{' '}
                    <span className="text-[#0B2447] font-extrabold">
                      {sections.map((s) => s.name).join(', ')}
                    </span>
                  </p>
                  <p>
                    Selected Batches:{' '}
                    <span className="text-[#0052CC] font-extrabold">
                      {selectedBatchIds.length} Batches
                    </span>
                  </p>
                </div>
              </div>

              {/* Conflict Alert Display Box */}
              {conflictChecked && conflictResult && (
                <div className="pt-1">
                  {!conflictResult.hasConflict ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 text-emerald-900 animate-in fade-in duration-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-extrabold text-emerald-800">
                          ✅ No Schedule Conflicts Detected!
                        </h4>
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                          Target Batches and Course time slots are 100% clear for this exam window. You can safely save this exam.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-rose-900 animate-in fade-in duration-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-extrabold text-rose-800">
                            ⚠️ Schedule Conflict Detected ({conflictResult.conflicts.length} conflict(s))
                          </h4>
                          <p className="text-[11px] text-rose-700 font-medium mt-0.5">
                            The following exam(s) or live class schedule(s) overlap with this exam window:
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5 pl-8 text-xs font-semibold">
                        {conflictResult.conflicts.map((conf: any, idx: number) => (
                          <div key={idx} className="bg-white/90 border border-rose-200 p-2.5 rounded-lg text-rose-900 shadow-2xs">
                            <p className="font-extrabold text-rose-950">{conf.message || conf.title}</p>
                            {conf.batchName && (
                              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold mt-1 inline-block">
                                Batch: {conf.batchName}
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
          )}

          {/* Controls Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <Button
              variant="outline"
              disabled={step === 1}
              onClick={() => setStep((step - 1) as any)}
              className="rounded-xl h-11 px-5 text-xs font-bold border-slate-200 text-slate-700"
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRunConflictCheck}
                disabled={checkConflictMutation.isPending || !isStep1Valid || !isStep2Valid}
                className="rounded-xl h-11 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 font-extrabold text-xs gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {checkConflictMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-800" />
                ) : (
                  '⚡ Check Conflict'
                )}
              </Button>

              {step < 4 ? (
                <Button
                  onClick={() => {
                    if (step === 1 && !isStep1Valid) {
                      toast.error(
                        'Please enter the Exam Title and select Course & Batches before proceeding.',
                      );
                      return;
                    }
                    if (step === 2 && !isStep2Valid) {
                      toast.error(
                        'Please select both Exam Window Start and End dates before proceeding.',
                      );
                      return;
                    }
                    if (step === 3 && !isStep3Valid) {
                      toast.error(
                        'Please enter valid Total Marks and Section names before proceeding.',
                      );
                      return;
                    }
                    setStep((step + 1) as any);
                  }}
                  disabled={
                    (step === 1 && !isStep1Valid) ||
                    (step === 2 && !isStep2Valid) ||
                    (step === 3 && !isStep3Valid)
                  }
                  className="rounded-xl h-11 px-6 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={
                    createExamMutation.isPending || !isStep1Valid || !isStep2Valid || !isStep3Valid
                  }
                  className="rounded-xl h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs gap-2 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createExamMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm & Save Exam (Draft)
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function CreateExamPage() {
  return (
    <DashboardLayout>
      <CreateExamContent />
    </DashboardLayout>
  );
}
