'use client';

import { useEffect, useState } from 'react';
import { useEvaluateSubmission, useTutorSubmissionDetail } from '../../hooks/use-tutor-exams';
import type { SectionMarksBreakdownInput } from '../../types/tutor-exams';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileCheck,
  FileText,
  History,
  Lock,
  RotateCcw,
  Save,
  ShieldAlert,
  User,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import Link from 'next/link';

interface TutorEvaluationWorkspaceProps {
  examId: string;
  submissionId: string;
}

export function TutorEvaluationWorkspace({ examId, submissionId }: TutorEvaluationWorkspaceProps) {
  const { data: detail, isLoading, refetch } = useTutorSubmissionDetail(examId, submissionId);
  const evaluateMutation = useEvaluateSubmission();

  const [sectionMarks, setSectionMarks] = useState<SectionMarksBreakdownInput[]>([]);
  const [tutorNotes, setTutorNotes] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    if (detail) {
      const config = detail.sectionConfig || [];
      const existingBreakdown = detail.marksBreakdown || [];

      if (existingBreakdown.length > 0) {
        setSectionMarks(
          existingBreakdown.map((item) => ({
            sectionId: item.sectionId,
            sectionName: item.sectionName,
            obtainedMarks: Number(item.obtainedMarks || 0),
            maxMarks: Number(item.maxMarks || 100),
          })),
        );
      } else if (config.length > 0) {
        setSectionMarks(
          config.map((sec) => ({
            sectionId: sec.sectionId || sec.id,
            sectionName: sec.name,
            obtainedMarks: 0,
            maxMarks: Number(sec.maxMarks || 100),
          })),
        );
      }

      setTutorNotes(detail.tutorNotes || '');
    }
  }, [detail]);

  if (isLoading) {
    return <div className="py-24 text-center text-slate-400">Loading evaluation workspace...</div>;
  }

  if (!detail) {
    return <div className="py-24 text-center text-slate-400">Submission not found.</div>;
  }

  const calculatedTotalMarks = sectionMarks.reduce(
    (sum, sec) => sum + Number(sec.obtainedMarks || 0),
    0,
  );

  const handleMarksChange = (index: number, val: number) => {
    const updated = [...sectionMarks];
    const max = updated[index].maxMarks;
    const clamped = Math.max(0, Math.min(max, val));
    updated[index].obtainedMarks = clamped;
    setSectionMarks(updated);
  };

  const handleSaveEvaluation = () => {
    evaluateMutation.mutate({
      examId,
      submissionId,
      data: {
        obtainedMarks: calculatedTotalMarks,
        marksBreakdown: sectionMarks,
        tutorNotes,
      },
    });
  };

  const isReadOnly = detail.isEvaluationLocked || detail.evaluationApproved;

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/80 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/tutor/exams/${examId}`}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {detail.examTitle} — Evaluation Workspace
            </h2>
            <p className="text-xs text-slate-400">
              Student: <span className="text-slate-200 font-semibold">{detail.studentName}</span> (
              {detail.studentAdmissionId})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-full font-mono">
            Version v{detail.evaluationVersion || 1}
          </span>
          {isReadOnly ? (
            <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-full flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Read-Only
            </span>
          ) : (
            <button
              onClick={handleSaveEvaluation}
              disabled={evaluateMutation.isPending}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {evaluateMutation.isPending ? 'Saving...' : 'Save Evaluation'}
            </button>
          )}
        </div>
      </div>

      {/* Main 60/40 Splitscreen Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left 60% Panel: Inline PDF Viewer */}
        <div className="w-[60%] border-r border-slate-800 flex flex-col bg-slate-950/80">
          {/* PDF Toolbar */}
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" /> Answer Sheet PDF
            </span>
            <div className="flex items-center gap-2">
              {detail.answerSheetSignedUrl && (
                <a
                  href={detail.answerSheetSignedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1 text-[11px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open PDF
                </a>
              )}
            </div>
          </div>

          {/* PDF Frame */}
          <div className="flex-1 overflow-hidden p-2">
            {detail.answerSheetSignedUrl ? (
              <iframe
                src={detail.answerSheetSignedUrl}
                className="w-full h-full rounded-xl border border-slate-800 bg-white"
                title="Student Answer Sheet"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No Answer Sheet PDF uploaded for this student.
              </div>
            )}
          </div>
        </div>

        {/* Right 40% Panel: Evaluation Entry Form */}
        <div className="w-[40%] flex flex-col bg-slate-900 overflow-y-auto p-6 space-y-6">
          {/* Returned Alert Banner */}
          {detail.evaluationStatus === 'RE_EVALUATION' && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-rose-200 text-xs space-y-1.5 shadow-lg">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <RotateCcw className="w-4 h-4 text-rose-400" /> Returned by Tenant Admin for
                Re-Evaluation
              </div>
              <p className="italic text-rose-100">"{detail.rejectionReason}"</p>
            </div>
          )}

          {/* Read Only Banner */}
          {isReadOnly && (
            <div className="p-4 bg-purple-950/40 border border-purple-800/60 rounded-2xl text-purple-200 text-xs flex items-center gap-3">
              <Lock className="w-5 h-5 text-purple-400 shrink-0" />
              <div>
                <p className="font-bold text-purple-100">Evaluation Phase Locked</p>
                <p className="text-purple-300/80 text-[11px]">
                  Marks have been approved or locked by tenant admin.
                </p>
              </div>
            </div>
          )}

          {/* Student Info Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> Student Profile
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-400 pt-1 border-t border-slate-900">
              <p>
                Name: <span className="text-slate-200 font-semibold">{detail.studentName}</span>
              </p>
              <p>
                Admission No:{' '}
                <span className="text-slate-200 font-mono">{detail.studentAdmissionId}</span>
              </p>
              <p>
                Submitted:{' '}
                <span className="text-slate-200">
                  {detail.submittedAt ? new Date(detail.submittedAt).toLocaleString() : 'N/A'}
                </span>
              </p>
              <p>
                Version:{' '}
                <span className="text-indigo-400 font-bold">v{detail.evaluationVersion || 1}</span>
              </p>
            </div>
          </div>

          {/* Dynamic Section Marks Form */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h4 className="font-bold text-white text-sm">Dynamic Section Marks Entry</h4>
              <div className="text-right">
                <span className="text-xs text-slate-400">Total Calculated:</span>
                <span className="text-xl font-extrabold text-teal-400 ml-2 font-mono">
                  {calculatedTotalMarks}
                </span>
                <span className="text-xs text-slate-500 font-normal"> / {detail.totalMarks}</span>
              </div>
            </div>

            <div className="space-y-3">
              {sectionMarks.map((sec, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-200">{sec.sectionName}</p>
                    <p className="text-[10px] text-slate-500">Max: {sec.maxMarks} pts</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={sec.obtainedMarks}
                      onChange={(e) => handleMarksChange(idx, Number(e.target.value))}
                      className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold text-right font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                    <span className="text-xs text-slate-500 font-bold">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tutor Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Tutor Remarks & Feedback
            </label>
            <textarea
              rows={3}
              disabled={isReadOnly}
              placeholder="Enter optional feedback for student or admin..."
              value={tutorNotes}
              onChange={(e) => setTutorNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Audit History Log */}
          {detail.history && detail.history.length > 0 && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                <History className="w-4 h-4 text-indigo-400" /> Evaluation Revision History
              </h4>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {detail.history.map((h) => (
                  <div
                    key={h.id}
                    className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">
                        Score changed to {h.newMarks} pts
                      </span>
                      <p className="text-[10px] text-slate-500">
                        {new Date(h.editedAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 italic max-w-xs truncate">
                      {h.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
