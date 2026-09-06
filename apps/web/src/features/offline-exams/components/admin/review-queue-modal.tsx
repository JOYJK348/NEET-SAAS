'use client';

import { useState } from 'react';
import {
  useAdminPublishChecklist,
  useAdminReviewSummary,
  useApproveAll,
  useApproveSubmission,
  usePublishResults,
  useRejectSubmission,
} from '../../hooks/use-admin-exams';
import { useTutorSubmissionDetail } from '../../hooks/use-tutor-exams';
import type { CbtQuestionBreakdownItem } from '../../types/tutor-exams';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Eye,
  Laptop,
  Lock,
  MinusCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';

function cleanResultQuestionText(rawText: string) {
  if (!rawText) return { text: '', subjectTag: null };
  let cleaned = rawText.trim();
  let subjectTag: string | null = null;

  const matchSubject = cleaned.match(/^\[(.*?)\]\s*/);
  if (matchSubject) {
    subjectTag = matchSubject[1];
    cleaned = cleaned.replace(/^\[(.*?)\]\s*/, '');
  }

  cleaned = cleaned.replace(/^(?:Q\.?\s*)?\d+[\.\)]\s*/i, '');

  const optionSplitIndex = cleaned.search(/\s*(?:\n|\s)+(?:A\)|\[A\]|1\))\s+/i);
  if (optionSplitIndex !== -1) {
    cleaned = cleaned.substring(0, optionSplitIndex).trim();
  }

  return { text: cleaned, subjectTag };
}

function cleanResultOptionText(rawText: string, label: string) {
  if (!rawText) return '';
  let cleaned = rawText.trim();

  const labelRegex = new RegExp(`^(?:\\[?${label}\\]?|[A-D])[\\.\\)]\\s*`, 'i');
  cleaned = cleaned.replace(labelRegex, '');
  cleaned = cleaned.replace(/^\[.*?\]\s*/, '');

  return cleaned.trim();
}

interface ReviewQueueModalProps {
  examId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewQueueModal({ examId, isOpen, onClose }: ReviewQueueModalProps) {
  const { data: summary, isLoading, refetch } = useAdminReviewSummary(examId);
  const { data: checklist, refetch: refetchChecklist } = useAdminPublishChecklist(examId);

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  const approveMutation = useApproveSubmission();
  const rejectMutation = useRejectSubmission();
  const approveAllMutation = useApproveAll();
  const publishResultsMutation = usePublishResults();

  if (!isOpen) return null;

  const handleApproveSingle = (submissionId: string) => {
    approveMutation.mutate(
      { examId, submissionId },
      {
        onSuccess: () => {
          refetch();
          refetchChecklist();
        },
      },
    );
  };

  const handleRejectSingle = (submissionId: string) => {
    if (!rejectReason.trim()) return;
    rejectMutation.mutate(
      { examId, submissionId, reason: rejectReason },
      {
        onSuccess: () => {
          setRejectingId(null);
          setRejectReason('');
          refetch();
          refetchChecklist();
        },
      },
    );
  };

  const handleApproveAll = () => {
    approveAllMutation.mutate(examId, {
      onSuccess: () => {
        refetch();
        refetchChecklist();
      },
    });
  };

  const handlePublishResults = () => {
    publishResultsMutation.mutate(examId, {
      onSuccess: () => {
        setShowChecklistModal(false);
        onClose();
      },
    });
  };

  const stats = summary?.stats;
  const isLocked = !!summary?.evaluationLockedAt;
  const isPublished = summary?.publishStatus === 'RESULT_PUBLISHED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto text-[#0F172A] font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50">
          <div>
            <h2 className="text-lg font-extrabold text-[#0B2447] flex items-center gap-2 flex-wrap">
              <ShieldCheck className="w-5 h-5 text-[#0052CC]" />
              <span>Evaluation Review Queue — {summary?.title || 'Loading...'}</span>
              {summary?.mode === 'ONLINE' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-xs font-black">
                  💻 ONLINE CBT
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-black">
                  📝 OFFLINE OMR
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Two-Level Approval & Student Mistake Audit Workflow
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/40">
          {selectedSubmissionId ? (
            <StudentSubmissionAuditDetail
              examId={examId}
              submissionId={selectedSubmissionId}
              isLocked={isLocked}
              isPublished={isPublished}
              onBack={() => setSelectedSubmissionId(null)}
              onApprove={(sid) => {
                handleApproveSingle(sid);
              }}
              onReject={(sid) => {
                setRejectingId(sid);
                setSelectedSubmissionId(null);
              }}
            />
          ) : isLoading ? (
            <div className="py-16 text-center text-slate-400 font-medium">
              Loading review queue summary...
            </div>
          ) : (
            <>
              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <p className="text-xs text-slate-500 font-bold uppercase">Total Submissions</p>
                  <p className="text-2xl font-extrabold text-[#0B2447] mt-1">
                    {stats?.totalSubmissions || 0}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1 font-extrabold">
                    {stats?.evaluatedCount || 0} Evaluated
                  </p>
                </div>

                <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 shadow-2xs">
                  <p className="text-xs text-amber-800 font-bold uppercase">
                    Pending Admin Approval
                  </p>
                  <p className="text-2xl font-extrabold text-amber-700 mt-1">
                    {stats?.unapprovedCount || 0}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {stats?.approvedCount || 0} Approved
                  </p>
                </div>

                <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 shadow-2xs">
                  <p className="text-xs text-[#0052CC] font-bold uppercase">Average Marks</p>
                  <p className="text-2xl font-extrabold text-[#0052CC] mt-1">
                    {stats?.averageMarks || 0}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Highest: {stats?.highestMarks || 0}
                  </p>
                </div>

                <div className="bg-rose-50/80 p-4 rounded-xl border border-rose-200 shadow-2xs">
                  <p className="text-xs text-rose-800 font-bold uppercase">Returned to Tutor</p>
                  <p className="text-2xl font-extrabold text-rose-700 mt-1">
                    {stats?.returnedCount || 0}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Pending re-eval</p>
                </div>
              </div>

              {/* Status & Action Bar */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-3">
                  {isPublished ? (
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold rounded-full">
                      RESULTS PUBLISHED
                    </span>
                  ) : isLocked ? (
                    <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-[#0052CC] text-xs font-extrabold rounded-full flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> EVALUATION LOCKED
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold rounded-full">
                      REVIEW IN PROGRESS
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-medium">
                    {isLocked
                      ? 'Tutor editing disabled'
                      : 'Admin can review student mistakes and bulk approve all marks'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {!isLocked && !isPublished && (
                    <button
                      onClick={handleApproveAll}
                      disabled={
                        approveAllMutation.isPending || (stats?.pendingEvaluationCount || 0) > 0
                      }
                      className="px-4 py-2 bg-[#0052CC] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-2xs transition flex items-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Approve All & Lock Evaluation
                    </button>
                  )}

                  {!isPublished && (
                    <button
                      onClick={() => setShowChecklistModal(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-2xs transition flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Publish Results...
                    </button>
                  )}
                </div>
              </div>

              {/* Rejection Modal Inline */}
              {rejectingId && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-3 shadow-2xs">
                  <h4 className="text-sm font-bold text-rose-900">
                    Return Submission to Tutor for Re-Evaluation
                  </h4>
                  <textarea
                    rows={2}
                    placeholder="Enter mandatory reason for returning submission to tutor..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 font-medium"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setRejectingId(null)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRejectSingle(rejectingId)}
                      disabled={rejectMutation.isPending || !rejectReason.trim()}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-2xs"
                    >
                      Confirm Return
                    </button>
                  </div>
                </div>
              )}

              {/* Submissions Audit Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider">
                    Student Submissions & Evaluator Tutor Audit
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {summary?.submissions?.length || 0} Records
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Evaluated By (Tutor)</th>
                        <th className="py-3 px-4">Obtained Marks</th>
                        <th className="py-3 px-4">Approval Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {!summary?.submissions || summary.submissions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No student submissions found.
                          </td>
                        </tr>
                      ) : (
                        summary.submissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4">
                              <p className="font-extrabold text-[#0B2447]">{sub.studentName}</p>
                              <p className="text-[11px] text-slate-500 font-mono">
                                {sub.studentAdmissionId}
                              </p>
                            </td>

                            <td className="py-3.5 px-4">
                              {sub.evaluatedByUserId === 'SYSTEM_CBT' || summary?.mode === 'ONLINE' || sub.evaluatedByName?.includes('CBT') ? (
                                <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-black rounded-lg inline-flex items-center gap-1.5 shadow-2xs">
                                  <Laptop className="w-3.5 h-3.5 text-purple-700" />
                                  Auto-Calculated (CBT Engine)
                                </span>
                              ) : sub.evaluatedByName ? (
                                <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-[#0052CC] text-xs font-bold rounded-lg inline-flex items-center gap-1.5 shadow-2xs">
                                  <UserCheck className="w-3.5 h-3.5 text-[#0052CC]" />
                                  Evaluated by {sub.evaluatedByName}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  Pending Evaluation
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-mono font-extrabold text-teal-700 text-sm">
                              {sub.obtainedMarks} pts
                            </td>

                            <td className="py-3.5 px-4">
                              {sub.evaluationApproved ? (
                                <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold rounded-full">
                                  APPROVED
                                </span>
                              ) : sub.evaluationStatus === 'RE_EVALUATION' ? (
                                <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-full">
                                  RETURNED TO TUTOR
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-full">
                                  PENDING APPROVAL
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setSelectedSubmissionId(sub.id)}
                                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#0052CC] border border-blue-200 rounded-lg text-xs font-extrabold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#0052CC]" />
                                  <span>Inspect Breakdown</span>
                                </button>

                                {!isLocked && !isPublished && (
                                  <>
                                    {!sub.evaluationApproved && (
                                      <button
                                        onClick={() => handleApproveSingle(sub.id)}
                                        disabled={approveMutation.isPending}
                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition shadow-2xs"
                                      >
                                        Approve
                                      </button>
                                    )}
                                    {sub.evaluationStatus !== 'RE_EVALUATION' && (
                                      <button
                                        onClick={() => {
                                          setRejectingId(sub.id);
                                          setRejectReason('');
                                        }}
                                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition shadow-2xs"
                                      >
                                        Return
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            Close Review Queue
          </button>
        </div>
      </div>

      {/* Pre-flight Publish Checklist Modal */}
      {showChecklistModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-5 text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#0B2447] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Pre-Flight Publish Safety Checklist
              </h3>
              <button
                onClick={() => setShowChecklistModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {checklist?.items.map((item) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium ${
                    item.passed
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowChecklistModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishResults}
                disabled={!checklist?.canPublish || publishResultsMutation.isPending}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-2xs transition flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                {publishResultsMutation.isPending ? 'Publishing...' : 'Confirm & Publish Results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StudentSubmissionAuditDetailProps {
  examId: string;
  submissionId: string;
  isLocked: boolean;
  isPublished: boolean;
  onBack: () => void;
  onApprove: (submissionId: string) => void;
  onReject: (submissionId: string) => void;
}

function StudentSubmissionAuditDetail({
  examId,
  submissionId,
  isLocked,
  isPublished,
  onBack,
  onApprove,
  onReject,
}: StudentSubmissionAuditDetailProps) {
  const { data: detail, isLoading } = useTutorSubmissionDetail(examId, submissionId);

  const [cbtFilter, setCbtFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'SKIPPED'>('ALL');
  const [cbtSearchQuery, setCbtSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-400 font-medium">
        Loading detailed student breakdown...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="py-12 text-center text-slate-400 font-medium space-y-3">
        <p>Submission detail not found.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
        >
          Back to Queue List
        </button>
      </div>
    );
  }

  const rawCbtList: CbtQuestionBreakdownItem[] = detail.cbtBreakdown || [];
  const filteredCbtList = rawCbtList.filter((item) => {
    const matchesFilter =
      cbtFilter === 'ALL' ||
      (cbtFilter === 'CORRECT' && item.isCorrect) ||
      (cbtFilter === 'INCORRECT' && !item.isCorrect && item.selectedOption) ||
      (cbtFilter === 'SKIPPED' && !item.selectedOption);

    const matchesSearch =
      !cbtSearchQuery ||
      item.questionText.toLowerCase().includes(cbtSearchQuery.toLowerCase()) ||
      String(item.questionIndex).includes(cbtSearchQuery);

    return matchesFilter && matchesSearch;
  });

  const correctCount = detail.cbtStats?.correct ?? rawCbtList.filter((q) => q.isCorrect).length;
  const wrongCount = detail.cbtStats?.wrong ?? rawCbtList.filter((q) => !q.isCorrect && q.selectedOption).length;
  const skippedCount = detail.cbtStats?.skipped ?? rawCbtList.filter((q) => !q.selectedOption).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-[#0052CC]" />
            <span>Back to Queue</span>
          </button>
          <div>
            <h3 className="text-base font-black text-[#0B2447] flex items-center gap-2">
              <span>{detail.studentName}</span>
              <span className="text-xs text-slate-500 font-mono">({detail.studentAdmissionId})</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Submission Audit & Step-by-Step Question Breakdown
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 bg-[#0052CC]/10 text-[#0052CC] border border-[#0052CC]/20 text-xs font-black rounded-xl">
            Obtained: {detail.obtainedMarks} / {detail.totalMarks} pts
          </span>

          {!isLocked && !isPublished && (
            <>
              {!detail.evaluationApproved && (
                <button
                  onClick={() => onApprove(submissionId)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-2xs transition"
                >
                  Approve Marks
                </button>
              )}
              {detail.evaluationStatus !== 'RE_EVALUATION' && (
                <button
                  onClick={() => onReject(submissionId)}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                >
                  Return to Tutor
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC] shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Marks</p>
            <p className="text-lg font-black text-[#0B2447] mt-0.5 font-mono">
              {detail.obtainedMarks} <span className="text-xs text-slate-400 font-normal">/ {detail.totalMarks}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correct (+4)</p>
            <p className="text-lg font-black text-emerald-700 mt-0.5 font-mono">
              {correctCount}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incorrect (-1)</p>
            <p className="text-lg font-black text-rose-700 mt-0.5 font-mono">
              {wrongCount}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 shrink-0">
            <MinusCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unanswered (0)</p>
            <p className="text-lg font-black text-slate-700 mt-0.5 font-mono">
              {skippedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Answer Sheet PDF Downloads for OMR Exams */}
      {detail.answerSheetSignedUrl && (
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-700" />
            <div>
              <p className="text-xs font-extrabold text-indigo-950">OMR Answer Sheet PDF Uploaded</p>
              <p className="text-[11px] text-indigo-700 font-medium">Verify physical bubble markings against machine score</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={detail.answerSheetSignedUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-extrabold transition shadow-2xs flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Sheet
            </a>
            <a
              href={detail.answerSheetSignedUrl}
              download
              className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-extrabold transition shadow-2xs flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h4 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0052CC]" />
            Question-by-Question Solution & Student Mistake Audit
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter questions..."
              value={cbtSearchQuery}
              onChange={(e) => setCbtSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC] transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setCbtFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition ${
                cbtFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({rawCbtList.length})
            </button>
            <button
              onClick={() => setCbtFilter('CORRECT')}
              className={`px-2.5 py-1 rounded-lg transition ${
                cbtFilter === 'CORRECT'
                  ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Correct ({correctCount})
            </button>
            <button
              onClick={() => setCbtFilter('INCORRECT')}
              className={`px-2.5 py-1 rounded-lg transition ${
                cbtFilter === 'INCORRECT'
                  ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Incorrect ({wrongCount})
            </button>
            <button
              onClick={() => setCbtFilter('SKIPPED')}
              className={`px-2.5 py-1 rounded-lg transition ${
                cbtFilter === 'SKIPPED'
                  ? 'bg-slate-700 text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Skipped ({skippedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Accordion Questions List */}
      <div className="space-y-3">
        {filteredCbtList.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-semibold text-xs">
            No questions match the selected filter criteria.
          </div>
        ) : (
          filteredCbtList.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            const { text: cleanQText, subjectTag } = cleanResultQuestionText(item.questionText);

            const statusBadge = item.isCorrect ? (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                CORRECT (+{item.marksAwarded > 0 ? item.marksAwarded : 4})
              </span>
            ) : item.selectedOption ? (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                WRONG ({item.marksAwarded}) • Selected: Option {item.selectedOption}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-300">
                SKIPPED (0)
              </span>
            );

            return (
              <div
                key={item.questionId || idx}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:border-slate-300 transition"
              >
                {/* Question Header Bar */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        item.isCorrect
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : item.selectedOption
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.questionIndex}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {subjectTag && (
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold rounded-md">
                            {subjectTag}
                          </span>
                        )}
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {cleanQText}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {statusBadge}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details & Solutions */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/60 space-y-4 text-xs">
                    {/* Question Text Box */}
                    <div className="font-medium text-slate-900 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm">
                      <p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider mb-1.5">
                        Question {item.questionIndex}:
                      </p>
                      {cleanQText}
                    </div>

                    {/* Options Review Grid */}
                    {item.options && item.options.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {item.options.map((opt) => {
                          const cleanedOptText = cleanResultOptionText(opt.text, opt.label);
                          const isUserChoice = item.selectedOption === opt.label;
                          const isCorrectChoice = opt.isCorrect || opt.label === item.correctOption;

                          let optClass = 'bg-white border-slate-200 text-slate-800';
                          if (isCorrectChoice) {
                            optClass = 'bg-emerald-50/90 border-emerald-400 text-emerald-900 font-extrabold ring-1 ring-emerald-400/40';
                          } else if (isUserChoice) {
                            optClass = 'bg-rose-50/90 border-rose-400 text-rose-900 font-extrabold ring-1 ring-rose-400/40';
                          }

                          return (
                            <div
                              key={opt.label}
                              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${optClass}`}
                            >
                              <span className="font-black text-xs shrink-0 w-5">{opt.label}.</span>
                              <span className="flex-1 font-medium leading-relaxed">{cleanedOptText}</span>
                              {isCorrectChoice && (
                                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-md shrink-0">
                                  CORRECT ANSWER
                                </span>
                              )}
                              {isUserChoice && !isCorrectChoice && (
                                <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded-md shrink-0">
                                  STUDENT ANSWER
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Fallback summary box if options list is empty */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Student Choice:
                          </span>
                          <p className="text-xs font-black text-slate-800">
                            {item.selectedOption ? (
                              <span className={item.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                                Option {item.selectedOption} ({item.isCorrect ? 'Correct' : 'Incorrect'})
                              </span>
                            ) : (
                              <span className="text-slate-400 italic font-normal">Unanswered / Skipped</span>
                            )}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                            Official Answer Key:
                          </span>
                          <p className="text-xs font-black text-emerald-800">
                            Option {item.correctOption}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Solution Explanation Box */}
                    <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-1 text-slate-900">
                      <h5 className="font-extrabold text-blue-900 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Step-by-Step Solution & Explanation:
                      </h5>
                      <p className="text-xs font-normal leading-relaxed text-slate-800 pt-0.5">
                        {item.explanation?.solutionText ||
                          item.explanation?.shortExplanation ||
                          `Correct Answer is Option ${item.correctOption}.`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

