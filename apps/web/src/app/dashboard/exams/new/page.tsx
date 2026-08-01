'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useBatches, useCourses } from '@/features/students/hooks/use-students';
import { useCreateExam } from '@/features/offline-exams/hooks/use-admin-exams';
import type { SectionConfigItem } from '@/features/offline-exams/types/admin-exams';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

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
        onSuccess: () => {
          router.push('/dashboard/exams');
        },
      },
    );
  };

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Header Banner - Signature Violet Gradient */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 text-white border-0 shrink-0"
            onClick={() => router.push('/dashboard/exams')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                Exam Creation Workflow &bull; Step {step} of 4
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-white flex items-center gap-2">
              Create New Exam 📝
            </h1>
            <p className="text-violet-200 text-xs mt-0.5">
              Set up test schedules, target batches, total marks, negative marking, and section
              configs.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/exams')}
          className="px-4 gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl text-xs font-bold shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cancel & Exit
        </Button>
      </div>

      {/* Main Page Card Form - Full Width */}
      <div className="w-full space-y-6">
        {/* Wizard Step Indicator Bar */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-2 shadow-xs">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
            {[
              { num: 1, label: 'Basic Info' },
              { num: 2, label: 'Timing Window' },
              { num: 3, label: 'Marks & Sections' },
              { num: 4, label: 'Rules & Finish' },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setStep(s.num as any)}
                className={`py-2.5 px-3 rounded-xl transition-all ${
                  step === s.num
                    ? 'bg-violet-600 text-white shadow-sm'
                    : step > s.num
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {s.num}. {s.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Wizard Form Sections */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-xs p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-5 h-5 text-violet-600" />
                Step 1: Exam Basic Information
              </h3>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 uppercase">Exam Title *</Label>
                <Input
                  type="text"
                  placeholder="e.g. NEET Grand Test 05 — Full Syllabus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-xl h-11 border-slate-200 focus:border-violet-500 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase">Course *</Label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl h-11 px-3 text-xs font-medium focus:outline-none focus:border-violet-500"
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
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedBatchIds.length === batches.length) {
                          setSelectedBatchIds([]);
                        } else {
                          setSelectedBatchIds(batches.map((b) => b.id));
                        }
                      }}
                      className="text-[11px] text-violet-600 font-bold hover:underline"
                    >
                      {selectedBatchIds.length === batches.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {batches.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">No batches found</p>
                    ) : (
                      batches.map((b) => (
                        <label
                          key={b.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition ${
                            selectedBatchIds.includes(b.id)
                              ? 'bg-violet-50 border-violet-200 text-violet-900 font-bold shadow-xs'
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
                            className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                          />
                          <span>{b.name}</span>
                        </label>
                      ))
                    )}
                  </div>
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
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-violet-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase">Exam Type</Label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl h-11 px-3 text-xs font-medium focus:outline-none focus:border-violet-500"
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
                    className="w-full bg-white border border-slate-200 rounded-xl h-11 px-3 text-xs font-medium focus:outline-none focus:border-violet-500"
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
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Clock className="w-5 h-5 text-violet-600" />
                Step 2: Schedule & Exam Window
              </h3>

              <div className="p-4 bg-violet-50/70 border border-violet-100 rounded-xl text-xs text-violet-900 flex items-start gap-3">
                <Clock className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">Exam Window vs Duration Explanation</p>
                  <p className="text-violet-700">
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
                    onChange={(e) => setExamWindowStart(e.target.value)}
                    className="rounded-xl h-11 border-slate-200 focus:border-violet-500 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 uppercase">
                    Exam Window End *
                  </Label>
                  <Input
                    type="datetime-local"
                    value={examWindowEnd}
                    onChange={(e) => setExamWindowEnd(e.target.value)}
                    className="rounded-xl h-11 border-slate-200 focus:border-violet-500 text-xs font-medium"
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
                    className="rounded-xl h-11 border-slate-200 focus:border-violet-500 text-xs font-medium"
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
                    className="rounded-xl h-11 border-slate-200 focus:border-violet-500 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Require Full Duration Available
                  </p>
                  <p className="text-[11px] text-slate-500">
                    If enabled, blocks student start if remaining window time is less than duration
                    minutes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requireFullDurationWindow}
                  onChange={(e) => setRequireFullDurationWindow(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Layers className="w-5 h-5 text-violet-600" />
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
                    className="rounded-xl h-11 border-slate-200 focus:border-violet-500 text-xs font-medium"
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
                    className="rounded-xl h-11 border-slate-200 focus:border-violet-500 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-violet-600" />
                      Dynamic Section Breakdown
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Tutor evaluation form will dynamically build input fields from these sections.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddSection}
                    className="h-9 px-3 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-xs font-bold border border-violet-200"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Section
                  </Button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs"
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
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <CheckCircle2 className="w-5 h-5 text-violet-600" />
                Step 4: Rules & Final Summary
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Allow Replace Upload</p>
                    <p className="text-[11px] text-slate-500">
                      Students can re-upload before window ends
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowReplaceUpload}
                    onChange={(e) => setAllowReplaceUpload(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Allow Late Upload</p>
                    <p className="text-[11px] text-slate-500">Allow uploads during grace period</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowLateUpload}
                    onChange={(e) => setAllowLateUpload(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  />
                </div>
              </div>

              {/* Final Summary Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-2">
                  Exam Configuration Summary
                </h4>
                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <p>
                    Title:{' '}
                    <span className="text-slate-900 font-bold">{title || 'Untitled Exam'}</span>
                  </p>
                  <p>
                    Type/Mode:{' '}
                    <span className="text-slate-900 font-bold">
                      {examType} / {mode}
                    </span>
                  </p>
                  <p>
                    Duration:{' '}
                    <span className="text-slate-900 font-bold">{durationMinutes} mins</span>
                  </p>
                  <p>
                    Marks:{' '}
                    <span className="text-slate-900 font-bold">
                      {totalMarks} (Pass: {passingMarks})
                    </span>
                  </p>
                  <p>
                    Sections:{' '}
                    <span className="text-slate-900 font-bold">
                      {sections.map((s) => s.name).join(', ')}
                    </span>
                  </p>
                  <p>
                    Selected Batches:{' '}
                    <span className="text-violet-700 font-bold">
                      {selectedBatchIds.length} Batches
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Controls Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button
              variant="outline"
              disabled={step === 1}
              onClick={() => setStep((step - 1) as any)}
              className="rounded-xl h-11 px-5 text-xs font-semibold border-slate-200"
            >
              Previous
            </Button>

            {step < 4 ? (
              <Button
                onClick={() => setStep((step + 1) as any)}
                className="rounded-xl h-11 px-6 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs"
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createExamMutation.isPending || !title}
                className="rounded-xl h-11 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 shadow-md shadow-emerald-600/20"
              >
                {createExamMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm & Save Exam (Draft)
              </Button>
            )}
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
