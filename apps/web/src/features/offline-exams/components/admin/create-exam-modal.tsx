'use client';

import { useState } from 'react';
import { useBatches, useCourses } from '@/features/students/hooks/use-students';
import { useCreateExam, useCheckExamConflict, adminExamKeys } from '../../hooks/use-admin-exams';
import { adminExamsService } from '../../services/admin-exams-service';
import { useQueryClient } from '@tanstack/react-query';
import type { SectionConfigItem } from '../../types/admin-exams';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  FileCheck,
  FileText,
  HelpCircle,
  Layers,
  Plus,
  Settings,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

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
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);

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
        onSuccess: async (createdExam: any) => {
          const examId = createdExam?.id || createdExam?.data?.id;
          if (questionPaperFile && examId) {
            const toastId = toast.loading('Uploading Question Paper PDF...');
            try {
              await adminExamsService.uploadQuestionPaper(examId, questionPaperFile);
              await queryClient.invalidateQueries({ queryKey: adminExamKeys.all });
              toast.success('Exam created & Question Paper PDF uploaded! 📄', { id: toastId });
            } catch (err: any) {
              await queryClient.invalidateQueries({ queryKey: adminExamKeys.all });
              toast.error(
                'Exam created, but QP upload failed: ' +
                  (err?.response?.data?.message || err?.message || 'Check file'),
                { id: toastId },
              );
            }
          } else {
            await queryClient.invalidateQueries({ queryKey: adminExamKeys.all });
          }
          onClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl text-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              {mode === 'ONLINE' ? 'Create Online CBT Exam' : mode === 'HYBRID' ? 'Create Hybrid Exam' : 'Create Offline OMR Exam'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Step {step} of 4:{' '}
              {step === 1
                ? 'Basic Details'
                : step === 2
                  ? 'Schedule & Window'
                  : step === 3
                    ? 'Marks & Sections'
                    : 'Rules & Finish'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 border-b border-slate-200 text-xs font-semibold bg-slate-50/50">
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Timing Window' },
            { num: 3, label: 'Marks Config' },
            { num: 4, label: 'Rules & Finish' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num as any)}
              className={`py-3 px-4 text-center border-b-2 font-bold transition ${
                step === s.num
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/80'
                  : step > s.num
                    ? 'border-emerald-500/50 text-emerald-700'
                    : 'border-transparent text-slate-400'
              }`}
            >
              {s.num}. {s.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exam Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. NEET Grand Test 05 — Full Syllabus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Target Batches * ({selectedBatchIds.length} Selected)
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
                      className="text-[11px] text-indigo-600 font-bold hover:underline"
                    >
                      {selectedBatchIds.length === batches.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {batches.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">No batches found</p>
                    ) : (
                      batches.map((b) => (
                        <label
                          key={b.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition ${
                            selectedBatchIds.includes(b.id)
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold shadow-sm'
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
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{b.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Darken bubbles completely using black ballpoint pen only..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exam Type
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="WEEKLY">Weekly Test</option>
                    <option value="MONTHLY">Monthly Test</option>
                    <option value="GRAND">Grand Test</option>
                    <option value="FULL_SYLLABUS">Full Syllabus</option>
                    <option value="REVISION">Revision</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
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
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 flex items-start gap-3 shadow-sm">
                <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-indigo-900 mb-0.5">
                    Exam Window vs Student Duration
                  </p>
                  <p>
                    Students can click <strong>"Ready to Start"</strong> anytime during the Exam
                    Window. The Student Duration countdown starts only when the student opens the
                    exam room.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exam Window Start *
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exam Window End *
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grace Period (Minutes)
                  </label>
                  <input
                    type="number"
                    value={graceMinutes}
                    onChange={(e) => setGraceMinutes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Require Full Duration Available
                  </p>
                  <p className="text-xs text-slate-500">
                    If enabled, blocks student start if remaining window time is less than duration
                    minutes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requireFullDurationWindow}
                  onChange={(e) => setRequireFullDurationWindow(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Marks *
                  </label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Passing Marks *
                  </label>
                  <input
                    type="number"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Negative Marking Settings */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Negative Marking Scheme</p>
                    <p className="text-[11px] text-slate-500">Deduct marks for wrong MCQ choices (e.g. NEET -1 marking)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={negativeMarkingEnabled}
                    onChange={(e) => setNegativeMarkingEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                {negativeMarkingEnabled && (
                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-xs font-semibold text-slate-700">Deduction per Wrong Answer:</label>
                    <input
                      type="number"
                      step="0.5"
                      value={negativeMarkingValue}
                      onChange={(e) => setNegativeMarkingValue(Number(e.target.value))}
                      className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-500 font-medium">marks (e.g. 1 mark)</span>
                  </div>
                )}
              </div>

              {/* Section Configuration */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      Dynamic Section Breakdown
                    </h4>
                    <p className="text-xs text-slate-500">
                      Tutor evaluation form will dynamically build input fields from these sections.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Section
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm"
                    >
                      <input
                        type="text"
                        placeholder="Section Name (e.g. Physics)"
                        value={sec.name}
                        onChange={(e) => handleSectionChange(idx, 'name', e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                      />
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <span>Max Marks:</span>
                        <input
                          type="number"
                          value={sec.maxMarks}
                          onChange={(e) =>
                            handleSectionChange(idx, 'maxMarks', Number(e.target.value))
                          }
                          className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs text-center text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(idx)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Paper PDF Upload */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      Question Paper Document Upload (PDF / DOCX)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Attach Question Paper file for student and tutor reference during exam.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    id="modal-qp-file-input"
                    onChange={(e) => setQuestionPaperFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="modal-qp-file-input"
                    className="flex-1 py-2 px-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-semibold cursor-pointer truncate text-slate-700 transition shadow-2xs text-center"
                  >
                    {questionPaperFile ? questionPaperFile.name : 'Select PDF / DOCX Question Paper...'}
                  </label>
                  {questionPaperFile && (
                    <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      {(questionPaperFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Allow Replace Upload</p>
                    <p className="text-xs text-slate-500">
                      Students can re-upload before window ends
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowReplaceUpload}
                    onChange={(e) => setAllowReplaceUpload(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Allow Late Upload</p>
                    <p className="text-xs text-slate-500">Allow uploads during grace period</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowLateUpload}
                    onChange={(e) => setAllowLateUpload(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Summary Box & Conflict Results */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Exam Creation Summary</h4>
                  <button
                    type="button"
                    onClick={handleRunConflictCheck}
                    disabled={checkConflictMutation.isPending || !title}
                    className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {checkConflictMutation.isPending ? 'Checking...' : '⚡ Check Conflict'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <p>
                    Title: <span className="text-slate-900 font-semibold">{title || 'Untitled Exam'}</span>
                  </p>
                  <p>
                    Type/Mode:{' '}
                    <span className="text-slate-900 font-semibold">
                      {examType} / {mode}
                    </span>
                  </p>
                  <p>
                    Duration:{' '}
                    <span className="text-slate-900 font-semibold">
                      {durationMinutes} min (Grace: {graceMinutes} min)
                    </span>
                  </p>
                  <p>
                    Marks:{' '}
                    <span className="text-slate-900 font-semibold">
                      {totalMarks} (Pass: {passingMarks})
                    </span>
                  </p>
                  <p>
                    Sections:{' '}
                    <span className="text-slate-900 font-semibold">{sections.map((s) => s.name).join(', ')}</span>
                  </p>
                  <p>
                    Target Batches:{' '}
                    <span className="text-indigo-700 font-bold">
                      {selectedBatchIds.length === 0
                        ? 'Default Batch'
                        : `${selectedBatchIds.length} Batches Selected`}
                    </span>
                  </p>
                  <p>
                    Status: <span className="text-amber-700 font-bold">Will save as DRAFT</span>
                  </p>
                </div>
              </div>

              {/* Conflict Alert Display Box */}
              {conflictChecked && conflictResult && (
                <div className="pt-1">
                  {!conflictResult.hasConflict ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 text-emerald-900 animate-in fade-in duration-200">
                      <div className="w-5 h-5 text-emerald-600 font-bold shrink-0 mt-0.5">✓</div>
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
                        <div className="w-5 h-5 text-rose-600 font-bold shrink-0 mt-0.5">⚠️</div>
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
                          <div key={idx} className="bg-white/90 border border-rose-200 p-2.5 rounded-lg text-rose-900 shadow-sm">
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

        {/* Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/80 gap-2">
          <button
            disabled={step === 1}
            onClick={() => setStep((step - 1) as any)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-sm font-semibold transition"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunConflictCheck}
              disabled={checkConflictMutation.isPending || !title}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {checkConflictMutation.isPending ? 'Checking...' : '⚡ Check Conflict'}
            </button>

            {step < 4 ? (
              <button
                onClick={() => setStep((step + 1) as any)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createExamMutation.isPending || !title}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 transition cursor-pointer"
              >
                {createExamMutation.isPending ? 'Saving Exam...' : 'Create Exam (Save Draft)'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
