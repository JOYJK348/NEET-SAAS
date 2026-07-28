'use client';

import { useState } from 'react';
import { useCreateExam } from '../../hooks/use-admin-exams';
import type { SectionConfigItem } from '../../types/admin-exams';
import {
  Calendar,
  Clock,
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

  // Form state
  const [courseId, setCourseId] = useState('');
  const [batchId, setBatchId] = useState('');
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

  const handleSubmit = () => {
    createExamMutation.mutate(
      {
        courseId: courseId || 'course-default',
        batchId: batchId || 'batch-default',
        subjectId: subjectId || 'subject-default',
        academicYearId: academicYearId || 'year-default',
        title,
        description,
        examType,
        mode,
        totalMarks,
        passingMarks,
        negativeMarkingEnabled,
        negativeMarkingValue,
        durationMinutes,
        graceMinutes,
        scheduledStartAt: scheduledStartAt || new Date().toISOString(),
        scheduledEndAt: scheduledEndAt || new Date(Date.now() + 86400000).toISOString(),
        examWindowStart: examWindowStart || new Date().toISOString(),
        examWindowEnd: examWindowEnd || new Date(Date.now() + 86400000).toISOString(),
        requireFullDurationWindow,
        allowLateUpload,
        allowReplaceUpload,
        sectionConfig: sections,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Create Offline OMR Exam
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Step {step} of 4:{' '}
              {step === 1
                ? 'Basic Details'
                : step === 2
                  ? 'Schedule & Window'
                  : step === 3
                    ? 'Marks & Sections'
                    : 'Rules & Settings'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 border-b border-slate-800 text-xs font-semibold bg-slate-950/40">
          {[
            { num: 1, label: 'Basic Info' },
            { num: 2, label: 'Timing Window' },
            { num: 3, label: 'Marks Config' },
            { num: 4, label: 'Rules & Finish' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num as any)}
              className={`py-3 px-4 text-center border-b-2 transition ${
                step === s.num
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                  : step > s.num
                    ? 'border-emerald-500/50 text-emerald-400'
                    : 'border-transparent text-slate-500'
              }`}
            >
              {s.num}. {s.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Exam Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. NEET Grand Test 05 — Full Syllabus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Darken bubbles completely using black ballpoint pen only..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Exam Type
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="WEEKLY">Weekly Test</option>
                    <option value="MONTHLY">Monthly Test</option>
                    <option value="GRAND">Grand Test</option>
                    <option value="FULL_SYLLABUS">Full Syllabus</option>
                    <option value="REVISION">Revision</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
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
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-3">
                <Clock className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-indigo-200 mb-0.5">
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Exam Window Start *
                  </label>
                  <input
                    type="datetime-local"
                    value={examWindowStart}
                    onChange={(e) => setExamWindowStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Exam Window End *
                  </label>
                  <input
                    type="datetime-local"
                    value={examWindowEnd}
                    onChange={(e) => setExamWindowEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Student Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Grace Period (Minutes)
                  </label>
                  <input
                    type="number"
                    value={graceMinutes}
                    onChange={(e) => setGraceMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Require Full Duration Available
                  </p>
                  <p className="text-xs text-slate-400">
                    If enabled, blocks student start if remaining window time is less than duration
                    minutes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={requireFullDurationWindow}
                  onChange={(e) => setRequireFullDurationWindow(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Total Marks *
                  </label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Passing Marks *
                  </label>
                  <input
                    type="number"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Section Configuration */}
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Dynamic Section Breakdown
                    </h4>
                    <p className="text-xs text-slate-400">
                      Tutor evaluation form will dynamically build input fields from these sections.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg text-xs font-semibold border border-indigo-500/30 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Section
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {sections.map((sec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-lg border border-slate-800"
                    >
                      <input
                        type="text"
                        placeholder="Section Name (e.g. Physics)"
                        value={sec.name}
                        onChange={(e) => handleSectionChange(idx, 'name', e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>Max Marks:</span>
                        <input
                          type="number"
                          value={sec.maxMarks}
                          onChange={(e) =>
                            handleSectionChange(idx, 'maxMarks', Number(e.target.value))
                          }
                          className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-center focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(idx)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Allow Replace Upload</p>
                    <p className="text-xs text-slate-400">
                      Students can re-upload before window ends
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowReplaceUpload}
                    onChange={(e) => setAllowReplaceUpload(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Allow Late Upload</p>
                    <p className="text-xs text-slate-400">Allow uploads during grace period</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowLateUpload}
                    onChange={(e) => setAllowLateUpload(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Summary Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <h4 className="font-semibold text-slate-200 text-sm mb-2">Exam Creation Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-400">
                  <p>
                    Title: <span className="text-slate-200">{title || 'Untitled Exam'}</span>
                  </p>
                  <p>
                    Type/Mode:{' '}
                    <span className="text-slate-200">
                      {examType} / {mode}
                    </span>
                  </p>
                  <p>
                    Duration:{' '}
                    <span className="text-slate-200">
                      {durationMinutes} min (Grace: {graceMinutes} min)
                    </span>
                  </p>
                  <p>
                    Marks:{' '}
                    <span className="text-slate-200">
                      {totalMarks} (Pass: {passingMarks})
                    </span>
                  </p>
                  <p>
                    Sections:{' '}
                    <span className="text-slate-200">{sections.map((s) => s.name).join(', ')}</span>
                  </p>
                  <p>
                    Status: <span className="text-amber-400 font-semibold">Will save as DRAFT</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            disabled={step === 1}
            onClick={() => setStep((step - 1) as any)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-sm font-semibold transition"
          >
            Previous
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep((step + 1) as any)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createExamMutation.isPending || !title}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 transition"
            >
              {createExamMutation.isPending ? 'Saving Exam...' : 'Create Exam (Save Draft)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
