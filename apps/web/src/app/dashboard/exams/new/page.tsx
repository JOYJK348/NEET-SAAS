'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useBatches, useCourses } from '@/features/students/hooks/use-students';
import { useCreateExam, useCheckExamConflict, adminExamKeys } from '@/features/offline-exams/hooks/use-admin-exams';
import { adminExamsService } from '@/features/offline-exams/services/admin-exams-service';
import { useQueryClient } from '@tanstack/react-query';
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
  Sparkles,
  Upload,
  ShieldCheck,
  FileCheck,
  Edit3,
  RefreshCw,
  Download,
  Copy,
  FileDown,
  HelpCircle,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export interface ParsedQuestionItem {
  questionNumber: number;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  options: { label: string; text: string }[];
  correctAnswer: string | null;
  marks: number;
  negativeMarks: number;
  explanation: string | null;
  status: 'VALID' | 'WARNING' | 'NEEDS_REVIEW' | 'INVALID';
}

function CreateExamContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
  const [isParsingQuestions, setIsParsingQuestions] = useState(false);
  const [parsedJobId, setParsedJobId] = useState<string | null>(null);
  const [parsedQuestionsPreview, setParsedQuestionsPreview] = useState<ParsedQuestionItem[]>([]);

  const handleExtractAndPreview = async (file: File) => {
    setIsParsingQuestions(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await api.post<any>('/online-exams/parse-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setParsedJobId(data.jobId);
      setParsedQuestionsPreview(data.questions || []);

      toast.success(`Extracted ${data.totalQuestionsFound || 0} Questions from ${file.name}! ⚡`, {
        description: `${data.validCount || 0} Valid, ${data.needsReviewCount || 0} Need Review.`,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to parse questions document.';
      toast.error(msg);
    } finally {
      setIsParsingQuestions(false);
    }
  };

  const handleSetCorrectAnswer = (questionNumber: number, label: string) => {
    setParsedQuestionsPreview((prev) =>
      prev.map((q) => {
        if (q.questionNumber === questionNumber) {
          return {
            ...q,
            correctAnswer: label,
            status: 'VALID',
          };
        }
        return q;
      }),
    );
  };

  const [copiedSample, setCopiedSample] = useState(false);

  const handleDownloadSampleTemplate = () => {
    const sampleContent = `NEET MCQ QUESTION PAPER SAMPLE TEMPLATE
=============================================

1. [Physics] Which physical quantity is measured in Newtons?
A) Mass
B) Force
C) Pressure
D) Energy
Answer: B

2. [Chemistry] What is the pH value of pure water at 25°C?
A) 0
B) 7
C) 14
D) 1
Answer: B

3. [Biology] Which organelle is responsible for cellular respiration in eukaryotic cells?
A) Mitochondria
B) Ribosome
C) Chloroplast
D) Golgi apparatus
Answer: A

4. [Biology] In humans, how many pairs of chromosomes are present in a somatic cell?
A) 22
B) 23
C) 46
D) 44
Answer: B

5. [Physics] The rate of change of momentum of a body is directly proportional to the applied:
A) Acceleration
B) Force
C) Velocity
D) Work done
Answer: B
`;

    const blob = new Blob([sampleContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'NEET_Sample_Question_Paper_Template.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Sample Question Paper Template Downloaded! 📄', {
      description: 'You can open, edit, or copy this sample format in MS Word or Google Docs.',
    });
  };

  const handleCopySampleFormat = () => {
    const textToCopy = `1. [Physics] Which physical quantity is measured in Newtons?
A) Mass
B) Force
C) Pressure
D) Energy
Answer: B

2. [Chemistry] What is the pH value of pure water at 25°C?
A) 0
B) 7
C) 14
D) 1
Answer: B`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedSample(true);
    toast.success('Sample format copied to clipboard!');
    setTimeout(() => setCopiedSample(false), 2000);
  };

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
        onSuccess: async (createdExam: any) => {
          const examId = createdExam?.id || createdExam?.data?.id;

          if (questionPaperFile && examId) {
            const loadingToastId = toast.loading('Uploading & Processing Question Paper Document...');
            try {
              // 1. Upload Question Paper PDF/DOCX to storage and attach file ID to exam record
              await adminExamsService.uploadQuestionPaper(examId, questionPaperFile);

              // 2. If ONLINE mode, also handle CBT parsing & question commits
              if (mode === 'ONLINE') {
                let jobIdToCommit = parsedJobId;
                let questionsToCommit = parsedQuestionsPreview;

                if (!jobIdToCommit || questionsToCommit.length === 0) {
                  const formData = new FormData();
                  formData.append('file', questionPaperFile);
                  const importRes = await api.post<any>(`/online-exams/${examId}/import/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });
                  jobIdToCommit = importRes?.jobId;
                  questionsToCommit = importRes?.questions || [];
                }

                if (jobIdToCommit && questionsToCommit.length > 0) {
                  await api.post<any>(`/online-exams/${examId}/import/commit`, {
                    jobId: jobIdToCommit,
                    questions: questionsToCommit,
                  });
                }
              }

              // Invalidate React Query cache so table list immediately reflects QP Uploaded state
              await queryClient.invalidateQueries({ queryKey: adminExamKeys.all });

              toast.success(
                mode === 'ONLINE'
                  ? 'Exam created & Question Paper attached + CBT questions parsed! ⚡'
                  : 'Exam created & Question Paper PDF uploaded! 📄',
                { id: loadingToastId },
              );
            } catch (err: any) {
              await queryClient.invalidateQueries({ queryKey: adminExamKeys.all });
              toast.error(
                'Exam created, but question paper processing warning: ' +
                  (err?.response?.data?.message || err?.message || 'Check file'),
                { id: loadingToastId },
              );
            }
          } else {
            await queryClient.invalidateQueries({ queryKey: adminExamKeys.all });
            toast.success('Exam schedule created successfully as DRAFT');
          }

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
              <span className="px-2 py-0.5 rounded-md bg-blue-100/80 font-bold text-[#0052CC]">
                {mode === 'ONLINE' ? 'Online CBT Mode' : mode === 'HYBRID' ? 'Hybrid Mode' : 'Offline OMR Mode'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
              {mode === 'ONLINE'
                ? 'Create Online CBT Exam ⚡'
                : mode === 'HYBRID'
                  ? 'Create Hybrid Exam'
                  : 'Create Offline OMR Exam'}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              {mode === 'ONLINE'
                ? 'Configure online CBT test schedule, student countdown timer, negative marking, and bulk PDF/DOCX question import.'
                : 'Configure exam schedules, target batches, total marks, and dynamic subject sections for OMR evaluation.'}
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
                  suppressHydrationWarning
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
                    suppressHydrationWarning
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
                    suppressHydrationWarning
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
                    suppressHydrationWarning
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

              {mode === 'ONLINE' && (
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-1.5 text-xs text-indigo-950 animate-in fade-in duration-200 shadow-2xs">
                  <div className="flex items-center gap-2 font-extrabold text-[#0052CC]">
                    <Sparkles className="w-4 h-4 text-[#0052CC]" /> Online Computer-Based Test (CBT) Active
                  </div>
                  <p className="font-medium text-slate-700 leading-relaxed">
                    Students will take this exam directly in their web browser with a server-synced countdown timer, realtime debounced autosave, and instant auto-evaluated scorecards. You will be able to bulk import PDF/DOCX question papers right after saving this draft.
                  </p>
                </div>
              )}
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

              {/* Negative Marking Scheme Configuration */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#0B2447]">Negative Marking Scheme</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Deduct marks for wrong MCQ choices (e.g. NEET -1 marking)
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={negativeMarkingEnabled}
                    onChange={(e) => setNegativeMarkingEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC]"
                  />
                </div>

                {negativeMarkingEnabled && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-200/80">
                    <Label className="text-xs font-bold text-slate-700">
                      Deduction per Wrong Choice:
                    </Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={negativeMarkingValue}
                      onChange={(e) => setNegativeMarkingValue(Number(e.target.value))}
                      className="w-24 rounded-xl h-9 text-xs font-bold text-center border-slate-200"
                    />
                    <span className="text-xs text-slate-500 font-medium">marks (e.g. 1 mark)</span>
                  </div>
                )}
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

              {/* Question Paper & Document Upload Box */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-[#F8FAFC] space-y-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#0052CC]" /> Question Paper Document Upload {mode === 'ONLINE' ? '(PDF / DOCX)' : '(PDF)'}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {mode === 'ONLINE'
                        ? 'Upload question paper PDF/DOCX for automatic OCR, text extraction & AI structured question parsing.'
                        : 'Upload question paper PDF for student and tutor reference during exam window.'}
                    </p>
                  </div>
                  {mode === 'ONLINE' && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={handleDownloadSampleTemplate}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Download Sample Template</span>
                      </button>
                      <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-[#0052CC] rounded-xl text-[10px] font-black uppercase tracking-wider">
                        ⚡ AI Parser Ready
                      </span>
                    </div>
                  )}
                </div>

                {/* Sample Document Formatting Guide Banner (Only for Online CBT) */}
                {mode === 'ONLINE' && (
                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0B2447]">
                        <HelpCircle className="w-4 h-4 text-[#0052CC]" />
                        <span>Recommended Question Paper Formatting Guide</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          suppressHydrationWarning
                          onClick={handleCopySampleFormat}
                          className="text-[11px] text-[#0052CC] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedSample ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#0052CC]" />
                              <span>Copy Sample Format</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] font-medium text-slate-600 pt-1">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                        <p className="font-extrabold text-slate-800">1. Question Numbering</p>
                        <p className="text-slate-500">Start questions with <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-blue-700 font-bold">1.</code> or <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-blue-700 font-bold">Q1.</code> or <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-blue-700 font-bold">[Subject]</code> tag.</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                        <p className="font-extrabold text-slate-800">2. Options (A - D)</p>
                        <p className="text-slate-500">Format options as <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-blue-700 font-bold">A) ... B) ... C) ... D) ...</code> (inline or newline).</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                        <p className="font-extrabold text-slate-800">3. Answer Key</p>
                        <p className="text-slate-500">Include <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-blue-700 font-bold">Answer: B</code> or <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-blue-700 font-bold">Correct Answer: B</code> after options.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    id="page-qp-file-input"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setQuestionPaperFile(f);
                      if (f && mode === 'ONLINE') {
                        handleExtractAndPreview(f);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="page-qp-file-input"
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0052CC] rounded-xl text-xs font-extrabold cursor-pointer transition text-center truncate shadow-2xs"
                  >
                    {questionPaperFile ? questionPaperFile.name : 'Select PDF / DOCX Question Paper...'}
                  </label>

                  {questionPaperFile ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 flex-1 truncate">
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {questionPaperFile.name} ({(questionPaperFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                      {mode === 'ONLINE' && (
                        <button
                          type="button"
                          onClick={() => handleExtractAndPreview(questionPaperFile)}
                          disabled={isParsingQuestions}
                          className="ml-auto px-3 py-1 bg-[#0052CC] hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-black transition flex items-center gap-1 cursor-pointer"
                        >
                          {isParsingQuestions ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Parsing Document...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 text-white" />
                              <span>Re-parse Document</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium">No document attached yet (Optional)</p>
                  )}
                </div>

                {/* Instant Document Question Preview Table */}
                {mode === 'ONLINE' && isParsingQuestions && (
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
                    <Loader2 className="w-7 h-7 animate-spin text-[#0052CC] mx-auto" />
                    <p className="text-xs font-bold text-slate-800">
                      Extracting & Parsing Questions from {questionPaperFile?.name}...
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      OCR & Text AST parser reading question text, options A-D, and answer keys.
                    </p>
                  </div>
                )}

                {mode === 'ONLINE' && parsedQuestionsPreview.length > 0 && !isParsingQuestions && (
                  <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-blue-50/80 border border-blue-200 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white text-[#0052CC] border border-blue-200 shadow-2xs">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider">
                            Extracted Questions Document Preview ({parsedQuestionsPreview.length} Questions Found)
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Review extracted options & correct answers before saving this exam draft
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-extrabold">
                        <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {parsedQuestionsPreview.filter((q) => q.status === 'VALID').length} Valid
                        </span>
                        {parsedQuestionsPreview.filter((q) => q.status === 'NEEDS_REVIEW' || !q.correctAnswer).length > 0 && (
                          <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {parsedQuestionsPreview.filter((q) => q.status === 'NEEDS_REVIEW' || !q.correctAnswer).length} Needs Review
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-80 overflow-y-auto bg-white">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[#0B2447] uppercase font-extrabold text-[10px] border-b border-slate-200 sticky top-0 z-10">
                          <tr>
                            <th className="py-3 px-4 w-12 text-center">#</th>
                            <th className="py-3 px-4">Question Text</th>
                            <th className="py-3 px-4">Options</th>
                            <th className="py-3 px-4 text-center">Answer Key</th>
                            <th className="py-3 px-4 text-center">Marks</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {parsedQuestionsPreview.map((q) => {
                            const isNeedsReview = q.status === 'NEEDS_REVIEW' || !q.correctAnswer;
                            return (
                              <tr
                                key={q.questionNumber}
                                className={`transition-colors ${
                                  isNeedsReview ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-slate-50/80'
                                }`}
                              >
                                <td className="py-3 px-4 font-black text-center text-[#0B2447]">
                                  {q.questionNumber}
                                </td>

                                <td className="py-3 px-4 font-extrabold text-[#0B2447] max-w-xs truncate">
                                  {q.questionText}
                                </td>

                                <td className="py-3 px-4 text-slate-600 font-semibold">
                                  <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-[11px]">
                                    {q.options.length} Options ({q.options.map((o) => o.label).join(',')})
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-center">
                                  {q.correctAnswer ? (
                                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black rounded-lg">
                                      Option {q.correctAnswer}
                                    </span>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1">
                                      {['A', 'B', 'C', 'D'].map((lbl) => (
                                        <button
                                          key={lbl}
                                          type="button"
                                          onClick={() => handleSetCorrectAnswer(q.questionNumber, lbl)}
                                          className="px-2 py-1 bg-white border border-amber-300 text-amber-900 hover:bg-emerald-600 hover:text-white rounded-md text-[11px] font-black transition cursor-pointer"
                                        >
                                          {lbl}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </td>

                                <td className="py-3 px-4 text-center font-bold text-slate-800">
                                  +{q.marks} / -{q.negativeMarks}
                                </td>

                                <td className="py-3 px-4 text-center">
                                  {q.status === 'VALID' ? (
                                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold rounded-md">
                                      VALID
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-extrabold rounded-md">
                                      NEEDS REVIEW
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-slate-600 font-medium">
                  <p>
                    Title:{' '}
                    <span className="text-[#0B2447] font-extrabold">
                      {title || 'Untitled Exam'}
                    </span>
                  </p>
                  <p>
                    Type / Mode:{' '}
                    <span className="text-[#0B2447] font-extrabold">
                      {examType} /{' '}
                      <span className={mode === 'ONLINE' ? 'text-[#0052CC] font-black' : 'text-slate-800'}>
                        {mode === 'ONLINE' ? 'Online CBT ⚡' : mode === 'HYBRID' ? 'Hybrid 🔄' : 'Offline OMR 📝'}
                      </span>
                    </span>
                  </p>
                  <p>
                    Duration:{' '}
                    <span className="text-[#0B2447] font-extrabold">{durationMinutes} mins</span>
                  </p>
                  <p>
                    Total Marks:{' '}
                    <span className="text-[#0B2447] font-extrabold">
                      {totalMarks} (Passing: {passingMarks})
                    </span>
                  </p>
                  <p>
                    Negative Marking:{' '}
                    <span className="text-[#0B2447] font-extrabold">
                      {negativeMarkingEnabled ? `Enabled (-${negativeMarkingValue} per wrong)` : 'Disabled'}
                    </span>
                  </p>
                  <p>
                    Questions:{' '}
                    <span className="text-[#0052CC] font-extrabold">
                      {parsedQuestionsPreview.length > 0
                        ? `${parsedQuestionsPreview.length} Extracted Questions (Ready for Import)`
                        : 'Manual / Pending Import'}
                    </span>
                  </p>
                  <p>
                    Sections:{' '}
                    <span className="text-[#0B2447] font-extrabold">
                      {sections.map((s) => s.name).join(', ')}
                    </span>
                  </p>
                  <p>
                    Target Batches:{' '}
                    <span className="text-[#0052CC] font-extrabold">
                      {selectedBatchIds.length} Batches Selected
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
      <div suppressHydrationWarning>
        <CreateExamContent />
      </div>
    </DashboardLayout>
  );
}
