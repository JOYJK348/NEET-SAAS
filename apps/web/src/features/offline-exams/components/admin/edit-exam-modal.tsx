'use client';

import { useEffect, useState } from 'react';
import { useUpdateExam } from '../../hooks/use-admin-exams';
import type { ExamItem } from '../../types/admin-exams';
import {
  AlertCircle,
  Award,
  Calendar,
  Clock,
  FileEdit,
  Laptop,
  Loader2,
  Lock,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface EditExamModalProps {
  exam: ExamItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditExamModal({ exam, isOpen, onClose }: EditExamModalProps) {
  const updateExamMutation = useUpdateExam();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'ONLINE' | 'OFFLINE' | 'HYBRID'>('OFFLINE');
  const [totalMarks, setTotalMarks] = useState<number>(720);
  const [passingMarks, setPassingMarks] = useState<number>(360);
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [graceMinutes, setGraceMinutes] = useState<number>(15);
  const [scheduledStartAt, setScheduledStartAt] = useState('');
  const [scheduledEndAt, setScheduledEndAt] = useState('');
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(true);
  const [negativeMarkingValue, setNegativeMarkingValue] = useState(1);

  useEffect(() => {
    if (exam) {
      setTitle(exam.title || '');
      setDescription(exam.description || '');
      setMode((exam.mode as any) || 'OFFLINE');
      setTotalMarks(Number(exam.totalMarks || 720));
      setPassingMarks(Number(exam.passingMarks || 360));
      setDurationMinutes(Number(exam.durationMinutes || 180));
      setGraceMinutes(Number(exam.graceMinutes || 15));
      setNegativeMarkingEnabled(exam.negativeMarkingEnabled ?? true);
      setNegativeMarkingValue(Number(exam.negativeMarkingValue || 1));

      if (exam.scheduledStartAt) {
        const d = new Date(exam.scheduledStartAt);
        if (!isNaN(d.getTime())) {
          setScheduledStartAt(d.toISOString().slice(0, 16));
        }
      }

      if (exam.scheduledEndAt) {
        const d = new Date(exam.scheduledEndAt);
        if (!isNaN(d.getTime())) {
          setScheduledEndAt(d.toISOString().slice(0, 16));
        }
      }
    }
  }, [exam]);

  if (!isOpen || !exam) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Exam title is required.');
      return;
    }

    if (passingMarks > totalMarks) {
      toast.error('Passing marks cannot exceed total marks.');
      return;
    }

    if (new Date(scheduledStartAt) >= new Date(scheduledEndAt)) {
      toast.error('Scheduled end time must be strictly after start time.');
      return;
    }

    updateExamMutation.mutate(
      {
        id: exam.id,
        data: {
          title,
          description,
          mode,
          totalMarks,
          passingMarks,
          durationMinutes,
          graceMinutes,
          scheduledStartAt: new Date(scheduledStartAt).toISOString(),
          scheduledEndAt: new Date(scheduledEndAt).toISOString(),
          examWindowStart: new Date(scheduledStartAt).toISOString(),
          examWindowEnd: new Date(scheduledEndAt).toISOString(),
          negativeMarkingEnabled,
          negativeMarkingValue,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto text-[#0F172A] font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50">
          <div>
            <h2 className="text-lg font-extrabold text-[#0B2447] flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-[#0052CC]" />
              Edit Exam Details — {exam.title}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Update exam parameters, timings, marks criteria, and delivery mode
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/40">
          {/* Exam Title & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Exam Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Exam Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition"
              >
                <option value="OFFLINE">📝 OFFLINE OMR</option>
                <option value="ONLINE">💻 ONLINE CBT</option>
                <option value="HYBRID">⚡ HYBRID</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description / Remarks
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 transition resize-none"
            />
          </div>

          {/* Marks Criteria */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
            <h4 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#0052CC]" />
              Marks & Evaluation Criteria
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Total Marks</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 text-right font-mono focus:outline-none focus:border-[#0052CC] transition mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Passing Marks</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 text-right font-mono focus:outline-none focus:border-[#0052CC] transition mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Negative Marking</label>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="editNegMarkToggle"
                    checked={negativeMarkingEnabled}
                    onChange={(e) => setNegativeMarkingEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#0052CC] rounded border-slate-300 focus:ring-[#0052CC]"
                  />
                  <label htmlFor="editNegMarkToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Enabled
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Deduction / Wrong</label>
                <input
                  type="number"
                  step="0.5"
                  disabled={!negativeMarkingEnabled}
                  value={negativeMarkingValue}
                  onChange={(e) => setNegativeMarkingValue(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 text-right font-mono focus:outline-none focus:border-[#0052CC] disabled:opacity-50 transition mt-1"
                />
              </div>
            </div>
          </div>

          {/* Timing & Schedule Window */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
            <h4 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0052CC]" />
              Duration & Timing Window
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 font-mono focus:outline-none focus:border-[#0052CC] transition mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Grace Window (Minutes)</label>
                <input
                  type="number"
                  min={0}
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 font-mono focus:outline-none focus:border-[#0052CC] transition mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Scheduled Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledStartAt}
                  onChange={(e) => setScheduledStartAt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC] transition mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Scheduled End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledEndAt}
                  onChange={(e) => setScheduledEndAt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC] transition mt-1"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateExamMutation.isPending}
              className="px-6 py-2.5 bg-[#0052CC] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-2xs transition flex items-center gap-2 cursor-pointer"
            >
              {updateExamMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Exam Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
