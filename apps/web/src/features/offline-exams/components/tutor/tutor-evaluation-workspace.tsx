'use client';

import { useEffect, useState } from 'react';
import { useEvaluateSubmission, useTutorSubmissionDetail } from '../../hooks/use-tutor-exams';
import type { SectionMarksBreakdownInput } from '../../types/tutor-exams';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  History,
  Lock,
  RotateCcw,
  Save,
  User,
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
  const [pdfExpanded, setPdfExpanded] = useState(false);

  useEffect(() => {
    if (detail) {
      const config = (detail.sectionConfig || []) as any[];
      const rawBreakdown = (detail.marksBreakdown || []) as any[];
      const studentTotalObtained = Number(detail.obtainedMarks || 0);

      const breakdownSum = rawBreakdown.reduce(
        (sum, item) => sum + Number(item.obtainedMarks || 0),
        0,
      );

      const hasValidBreakdown =
        rawBreakdown.length > 0 && (breakdownSum > 0 || studentTotalObtained === 0);

      if (hasValidBreakdown) {
        setSectionMarks(
          rawBreakdown.map((item, idx) => {
            const matchedConfig = config[idx] || {};
            const secName =
              item.sectionName && item.sectionName !== 'Section'
                ? item.sectionName
                : matchedConfig.name || matchedConfig.sectionName || `Section ${idx + 1}`;
            const secMax = Number(
              matchedConfig.maxMarks ?? matchedConfig.marks ?? item.maxMarks ?? 100,
            );

            return {
              sectionId: item.sectionId || item.id || matchedConfig.id || matchedConfig.sectionId,
              sectionName: secName,
              obtainedMarks: Number(item.obtainedMarks ?? 0),
              maxMarks: secMax > 0 ? secMax : 100,
            };
          }),
        );
      } else if (config.length > 0) {
        const totalExamMax = config.reduce(
          (sum, sec) => sum + Number(sec.maxMarks ?? sec.marks ?? sec.totalMarks ?? 100),
          0,
        );

        setSectionMarks(
          config.map((sec, idx) => {
            const secMax = Number(sec.maxMarks ?? sec.marks ?? sec.totalMarks ?? 100);
            const defaultObtained =
              studentTotalObtained > 0 && totalExamMax > 0
                ? Math.round((studentTotalObtained * secMax) / totalExamMax)
                : 0;

            return {
              sectionId: sec.sectionId || sec.id || `sec-${idx}`,
              sectionName: sec.name || sec.sectionName || `Section ${idx + 1}`,
              obtainedMarks: defaultObtained,
              maxMarks: secMax > 0 ? secMax : 100,
            };
          }),
        );
      } else {
        setSectionMarks([
          {
            sectionName: 'General Section',
            obtainedMarks: studentTotalObtained,
            maxMarks: Number(detail.totalMarks || 100),
          },
        ]);
      }

      setTutorNotes(detail.tutorNotes || '');
    }
  }, [detail]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-100 border border-violet-200 flex items-center justify-center mx-auto animate-pulse">
            <FileText className="w-5 h-5 text-violet-600" />
          </div>
          <p className="text-slate-500 font-semibold text-sm">Loading evaluation workspace...</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 font-medium text-sm">Submission not found.</p>
      </div>
    );
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
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-800">

      {/* ── Top Navbar ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-xs">
        {/* Mobile Navbar */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 gap-2">
          <Link
            href={`/dashboard/tutor/exams/${examId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200 transition shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
            <span>Back</span>
          </Link>

          <div className="flex-1 min-w-0 text-center">
            <p className="text-xs font-black text-slate-900 truncate">{detail.examTitle}</p>
            <p className="text-[10px] text-slate-400 font-semibold truncate">{detail.studentName}</p>
          </div>

          <div className="shrink-0">
            {isReadOnly ? (
              <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-black rounded-xl flex items-center gap-1">
                <Lock className="w-3 h-3" /> Read-Only
              </span>
            ) : (
              <button
                onClick={handleSaveEvaluation}
                disabled={evaluateMutation.isPending}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[11px] font-black shadow-sm transition flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                {evaluateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>

        {/* Desktop Navbar */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/tutor/exams/${examId}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600" />
              Back to Submissions
            </Link>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {detail.examTitle} — Evaluation Workspace
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Student: <span className="text-slate-800 font-semibold">{detail.studentName}</span>{' '}
                ({detail.studentAdmissionId})
              </p>
            </div>
          </div>

          <div>
            {isReadOnly ? (
              <span className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-full flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Read-Only
              </span>
            ) : (
              <button
                onClick={handleSaveEvaluation}
                disabled={evaluateMutation.isPending}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {evaluateMutation.isPending ? 'Saving...' : 'Save Evaluation'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Page Body ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden md:h-[calc(100vh-57px)]">

        {/* ── LEFT: PDF Viewer ──────────────────────────────────────────── */}
        <div className="flex flex-col md:w-[60%] md:border-r border-slate-200 bg-slate-100/60 md:h-full">

          {/* PDF Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
              <FileText className="w-3.5 h-3.5 text-indigo-600" /> Answer Sheet PDF
            </span>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {detail.answerKeySignedUrl && (
                <a
                  href={detail.answerKeySignedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg flex items-center gap-1 text-[11px] font-bold transition"
                >
                  <FileCheck className="w-3 h-3" /> Answer Key
                </a>
              )}
              {detail.answerSheetSignedUrl && (
                <a
                  href={detail.answerSheetSignedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg flex items-center gap-1 text-[11px] font-bold transition"
                >
                  <ExternalLink className="w-3 h-3" /> Open Sheet
                </a>
              )}
              {detail.answerSheetSignedUrl && (
                <a
                  href={detail.answerSheetSignedUrl}
                  download
                  className="px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 rounded-lg flex items-center gap-1 text-[11px] font-bold transition"
                >
                  <Download className="w-3 h-3" /> Download
                </a>
              )}
            </div>
          </div>

          {/* PDF Frame — collapsible on mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setPdfExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700"
            >
              <span>View Answer Sheet PDF</span>
              {pdfExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {pdfExpanded && (
              <div className="p-2 bg-slate-100/60" style={{ height: '75vh' }}>
                {detail.answerSheetSignedUrl ? (
                  <iframe
                    src={detail.answerSheetSignedUrl}
                    className="w-full h-full rounded-xl border border-slate-200 bg-white"
                    title="Student Answer Sheet"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                    No Answer Sheet PDF uploaded.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop: always visible PDF with generous height */}
          <div className="hidden md:flex flex-1 min-h-[650px] overflow-hidden p-2">
            {detail.answerSheetSignedUrl ? (
              <iframe
                src={detail.answerSheetSignedUrl}
                className="w-full h-full min-h-[650px] rounded-xl border border-slate-200 bg-white shadow-sm"
                title="Student Answer Sheet"
              />
            ) : (
              <div className="w-full h-full min-h-[650px] flex items-center justify-center text-slate-400 text-sm font-medium">
                No Answer Sheet PDF uploaded for this student.
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Evaluation Form ────────────────────────────────────── */}
        <div className="md:w-[40%] md:overflow-y-auto bg-white p-4 md:p-6 space-y-4">

          {/* ── Alert Banners ── */}
          {detail.evaluationStatus === 'RE_EVALUATION' && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
              <RotateCcw className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-rose-700">Returned for Re-Evaluation</p>
                <p className="text-[11px] text-rose-600 italic mt-0.5">"{detail.rejectionReason}"</p>
              </div>
            </div>
          )}

          {isReadOnly && (
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3">
              <Lock className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-black text-purple-900">Evaluation Phase Locked</p>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  Marks have been approved or locked by tenant admin.
                </p>
              </div>
            </div>
          )}

          {/* ── Student Profile Card ── */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Student Profile</p>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Name</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">{detail.studentName}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Admission No</p>
                <p className="text-xs font-bold text-slate-700 font-mono mt-0.5 break-all">{detail.studentAdmissionId}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Submitted</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  {detail.submittedAt ? new Date(detail.submittedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Section Marks Entry ── */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Section Marks</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-teal-700 font-mono leading-none">
                  {calculatedTotalMarks}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ {detail.totalMarks} pts</span>
              </div>
            </div>

            <div className="p-4 space-y-2.5">
              {sectionMarks.map((sec, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200 p-3 gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">{sec.sectionName}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Max: {sec.maxMarks} pts</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={sec.obtainedMarks}
                      onChange={(e) => handleMarksChange(idx, Number(e.target.value))}
                      className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-black text-slate-900 text-right font-mono focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 transition"
                    />
                    <span className="text-[11px] text-slate-500 font-bold">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tutor Remarks ── */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Tutor Remarks</p>
            </div>
            <div className="p-4">
              <textarea
                rows={3}
                disabled={isReadOnly}
                placeholder="Enter optional feedback for student or admin..."
                value={tutorNotes}
                onChange={(e) => setTutorNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 font-medium resize-none transition"
              />
            </div>
          </div>

          {/* ── Mobile Save Button ── */}
          {!isReadOnly && (
            <div className="md:hidden pb-4">
              <button
                onClick={handleSaveEvaluation}
                disabled={evaluateMutation.isPending}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-sm font-black shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {evaluateMutation.isPending ? 'Saving Evaluation...' : 'Save Evaluation'}
              </button>
            </div>
          )}

          {/* ── Audit History Log ── */}
          {detail.history && detail.history.length > 0 && (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-indigo-600" />
                <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Revision History</p>
              </div>
              <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
                {detail.history.map((h) => (
                  <div
                    key={h.id}
                    className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">Score → {h.newMarks} pts</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(h.editedAt).toLocaleString()}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 italic truncate max-w-[120px]">{h.reason}</span>
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
