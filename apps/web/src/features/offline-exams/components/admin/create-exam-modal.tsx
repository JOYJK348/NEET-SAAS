'use client';

import { useState } from 'react';
import { useBatches, useCourses } from '@/features/students/hooks/use-students';
import { useCreateExam, useCheckExamConflict, adminExamKeys } from '../../hooks/use-admin-exams';
import { useQueryClient } from '@tanstack/react-query';
import type { SectionConfigItem } from '../../types/admin-exams';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateExamModal({ isOpen, onClose }: CreateExamModalProps) {
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

  const queryClient = useQueryClient();

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

  if (!isOpen) return null;

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

  const handleRunConflictCheck = () => {
    if (!title || !examWindowStart || !examWindowEnd) {
      toast.error('Please enter Exam Title and Exam Window Start/End dates first!');
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

  const handleSubmit = () => {
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
        onSuccess: async () => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('NEET_ADMIN_EXAMS_CACHE');
          }
          await queryClient.invalidateQueries({ queryKey: adminExamKeys.all });
          await queryClient.refetchQueries({ queryKey: adminExamKeys.all });
          toast.success('Exam created successfully! ⚡');
          onClose();
        },
      },
    );
  };

  const steps = [
    { num: 1, label: 'Basic Info', desc: 'Title & Batches' },
    { num: 2, label: 'Timing Window', desc: 'Schedule & Duration' },
    { num: 3, label: 'Marks Config', desc: 'Sections & Marking' },
    { num: 4, label: 'Rules & Finish', desc: 'Submission Rules' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto text-[#0F172A] font-sans">
      {/* Container: Edge-to-edge full screen on mobile, rounded modal on tablet/desktop */}
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-2xl rounded-none border-0 sm:border sm:border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-sky-50/90 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0052CC] text-white flex items-center justify-center font-extrabold shadow-sm shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0B2447] leading-tight">
                {mode === 'ONLINE' ? 'Create Online CBT Exam' : mode === 'HYBRID' ? 'Create Hybrid Exam' : 'Create Offline OMR Exam'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                <span className="font-extrabold text-[#0052CC]">Step {step} of 4:</span>
                <span className="truncate">{steps[step - 1].desc}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white/80 active:bg-slate-200 rounded-xl transition cursor-pointer shrink-0"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Responsive Horizontal Stepper Bar */}
        <div className="flex sm:grid sm:grid-cols-4 border-b border-slate-200 bg-slate-50/80 overflow-x-auto scrollbar-none shrink-0 border-t sm:border-t-0">
          {steps.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;

            return (
              <button
                key={s.num}
                onClick={() => setStep(s.num as any)}
                className={cn(
                  'py-3 px-3.5 sm:px-4 min-w-[130px] sm:min-w-0 flex items-center justify-center gap-2 border-b-2 text-xs font-bold transition-all cursor-pointer shrink-0 sm:shrink select-none',
                  isCurrent
                    ? 'border-[#0052CC] text-[#0052CC] bg-blue-50/90 font-extrabold'
                    : isCompleted
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/40'
                      : 'border-transparent text-slate-400 hover:text-slate-600',
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 transition-colors',
                    isCurrent
                      ? 'bg-[#0052CC] text-white shadow-2xs'
                      : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-500',
                  )}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : s.num}
                </span>
                <span className="truncate whitespace-nowrap">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/30">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Exam Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. NEET Grand Test 05 — Full Syllabus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 sm:h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Course Track
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full h-11 sm:h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                  >
                    <option value="">Select Course...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                      Target Batches * ({selectedBatchIds.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedBatchIds.length === batches.length) {
                          setSelectedBatchIds([]);
                        } else {
                          setSelectedBatchIds(batches.map((b) => b.id));
                        }
                      }}
                      className="text-[11px] text-[#0052CC] font-extrabold hover:underline cursor-pointer"
                    >
                      {selectedBatchIds.length === batches.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 bg-white border border-slate-200 rounded-xl shadow-2xs">
                    {batches.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-3 col-span-full">
                        No active batches found
                      </p>
                    ) : (
                      batches.map((b) => {
                        const isSelected = selectedBatchIds.includes(b.id);
                        return (
                          <label
                            key={b.id}
                            className={cn(
                              'flex items-center gap-2.5 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition select-none active:scale-[0.99]',
                              isSelected
                                ? 'bg-blue-50 border-blue-200 text-[#0052CC] font-extrabold shadow-2xs'
                                : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100',
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBatchIds([...selectedBatchIds, b.id]);
                                } else {
                                  setSelectedBatchIds(selectedBatchIds.filter((id) => id !== b.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC]"
                            />
                            <span className="truncate">{b.name}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Test Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Darken bubbles completely using black ballpoint pen only..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition shadow-2xs resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Exam Category / Type
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full h-11 sm:h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                  >
                    <option value="WEEKLY">📅 Weekly Test</option>
                    <option value="MONTHLY">🗓️ Monthly Test</option>
                    <option value="GRAND">🏆 Grand Test</option>
                    <option value="FULL_SYLLABUS">🎯 Full Syllabus</option>
                    <option value="REVISION">⚡ Revision Test</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Delivery Mode
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full h-11 sm:h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                  >
                    <option value="OFFLINE">📝 Offline OMR</option>
                    <option value="HYBRID">⚡ Hybrid (OMR + App)</option>
                    <option value="ONLINE">💻 Online CBT</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 sm:p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3 shadow-2xs">
                <Clock className="w-5 h-5 text-[#0052CC] shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-[#0B2447] mb-0.5">
                    Exam Window vs Student Duration
                  </p>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Students can click <strong>"Ready to Start"</strong> anytime during the Exam Window. The timer starts only when the student opens the exam room.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Exam Window Start <span className="text-rose-500">*</span>
                  </label>
                  <input
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
                    className="w-full h-11 sm:h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Exam Window End <span className="text-rose-500">*</span>
                  </label>
                  <input
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
                    className="w-full h-11 sm:h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Student Duration (Minutes) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full h-11 sm:h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm font-semibold font-mono text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Grace Period (Minutes)
                  </label>
                  <input
                    type="number"
                    value={graceMinutes}
                    onChange={(e) => setGraceMinutes(Number(e.target.value))}
                    className="w-full h-11 sm:h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm font-semibold font-mono text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                  />
                </div>
              </div>

              <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs sm:text-sm font-extrabold text-[#0B2447]">
                    Require Full Duration Available
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Blocks start if remaining window time is less than duration minutes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requireFullDurationWindow}
                  onChange={(e) => setRequireFullDurationWindow(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC] shrink-0"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Total Marks <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full h-11 sm:h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm font-black font-mono text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    Passing Marks <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(Number(e.target.value))}
                    className="w-full h-11 sm:h-10 bg-white border border-slate-200 rounded-xl px-3.5 text-xs sm:text-sm font-black font-mono text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Negative Marking Scheme */}
              <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-[#0B2447]">
                      Negative Marking Scheme
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Deduct marks for incorrect MCQ choices (e.g. NEET -1 marking)
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={negativeMarkingEnabled}
                    onChange={(e) => setNegativeMarkingEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC] shrink-0"
                  />
                </div>

                {negativeMarkingEnabled && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-700">
                    <span>Deduction per Wrong Answer:</span>
                    <input
                      type="number"
                      step="0.5"
                      value={negativeMarkingValue}
                      onChange={(e) => setNegativeMarkingValue(Number(e.target.value))}
                      className="w-24 h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-900 font-black text-center font-mono focus:outline-none focus:border-[#0052CC]"
                    />
                    <span className="text-slate-500">mark(s)</span>
                  </div>
                )}
              </div>

              {/* Dynamic Sections */}
              <div className="border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-[#0B2447] flex items-center gap-1.5 uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-[#0052CC]" />
                      Dynamic Section Breakdown
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Tutor evaluation form will build marks inputs from these sections
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="h-8 sm:h-9 px-3 bg-blue-50 hover:bg-blue-100 text-[#0052CC] border border-blue-200 rounded-xl text-xs font-extrabold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Section
                  </button>
                </div>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200"
                    >
                      <input
                        type="text"
                        placeholder="Section Name (e.g. Physics)"
                        value={sec.name}
                        onChange={(e) => handleSectionChange(idx, 'name', e.target.value)}
                        className="flex-1 h-9 bg-white border border-slate-200 rounded-lg px-3 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC]"
                      />
                      <div className="flex items-center gap-2 justify-between sm:justify-start">
                        <span className="text-xs font-extrabold text-slate-600">Max Marks:</span>
                        <input
                          type="number"
                          value={sec.maxMarks}
                          onChange={(e) =>
                            handleSectionChange(idx, 'maxMarks', Number(e.target.value))
                          }
                          className="w-24 h-9 bg-white border border-slate-200 rounded-lg px-2 text-xs font-bold text-center font-mono text-slate-900 focus:outline-none focus:border-[#0052CC]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(idx)}
                          className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-100/80 rounded-lg transition shrink-0 cursor-pointer ml-auto sm:ml-0"
                          title="Remove section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-[#0B2447]">
                      Allow Replace Upload
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Students can re-upload before window ends
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowReplaceUpload}
                    onChange={(e) => setAllowReplaceUpload(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC] shrink-0"
                  />
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-[#0B2447]">
                      Allow Late Upload
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Allow uploads during grace period
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowLateUpload}
                    onChange={(e) => setAllowLateUpload(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC] shrink-0"
                  />
                </div>
              </div>

              {/* Summary Box */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-[#0B2447] text-xs sm:text-sm uppercase tracking-wider">
                    Exam Configuration Summary
                  </h4>
                  <button
                    type="button"
                    onClick={handleRunConflictCheck}
                    disabled={checkConflictMutation.isPending || !title}
                    className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {checkConflictMutation.isPending ? 'Checking...' : '⚡ Check Schedule Conflict'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 font-medium">
                  <p>
                    Title: <span className="text-[#0B2447] font-extrabold">{title || 'Untitled Exam'}</span>
                  </p>
                  <p>
                    Type/Mode:{' '}
                    <span className="text-[#0B2447] font-bold">
                      {examType} / {mode}
                    </span>
                  </p>
                  <p>
                    Duration:{' '}
                    <span className="text-[#0B2447] font-bold">
                      {durationMinutes} min (Grace: {graceMinutes} min)
                    </span>
                  </p>
                  <p>
                    Marks:{' '}
                    <span className="text-[#0B2447] font-bold">
                      {totalMarks} (Pass: {passingMarks})
                    </span>
                  </p>
                  <p className="col-span-full">
                    Sections:{' '}
                    <span className="text-[#0B2447] font-bold">
                      {sections.map((s) => s.name).join(', ')}
                    </span>
                  </p>
                  <p className="col-span-full">
                    Target Batches:{' '}
                    <span className="text-[#0052CC] font-extrabold">
                      {selectedBatchIds.length === 0
                        ? 'Default Batch'
                        : `${selectedBatchIds.length} Batches Selected`}
                    </span>
                  </p>
                </div>
              </div>

              {/* Conflict Alert Display Box */}
              {conflictChecked && conflictResult && (
                <div className="pt-1">
                  {!conflictResult.hasConflict ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 text-emerald-900 shadow-2xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-extrabold text-emerald-900">
                          ✅ No Schedule Conflicts Detected!
                        </h4>
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5 leading-relaxed">
                          Target Batches and Course time slots are 100% clear for this exam window. You can safely save this exam.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2 text-rose-900 shadow-2xs">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-extrabold text-rose-900">
                            ⚠️ Schedule Conflict Detected ({conflictResult.conflicts.length} conflict(s))
                          </h4>
                          <p className="text-[11px] text-rose-700 font-medium mt-0.5">
                            The following exam(s) or live class schedule(s) overlap with this exam window:
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1.5 pl-8 text-xs font-semibold">
                        {conflictResult.conflicts.map((conf: any, idx: number) => (
                          <div key={idx} className="bg-white border border-rose-200 p-2.5 rounded-lg text-rose-900 shadow-2xs">
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
        </div>

        {/* Sticky Footer Controls */}
        <div className="sticky bottom-0 z-20 px-4 sm:px-6 py-3.5 border-t border-slate-200 bg-white/95 backdrop-blur-md flex items-center justify-between gap-2.5 shrink-0 shadow-lg">
          <button
            disabled={step === 1}
            onClick={() => setStep((step - 1) as any)}
            className="h-11 sm:h-10 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunConflictCheck}
              disabled={checkConflictMutation.isPending || !title}
              className="h-11 sm:h-10 px-3 sm:px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {checkConflictMutation.isPending ? 'Checking...' : '⚡ Check Conflict'}
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep((step + 1) as any)}
                className="h-11 sm:h-10 px-5 sm:px-6 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createExamMutation.isPending || !title}
                className="h-11 sm:h-10 px-5 sm:px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-900/20 transition cursor-pointer flex items-center gap-1.5"
              >
                {createExamMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Exam...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Create Exam
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
