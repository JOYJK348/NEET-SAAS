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
import {
  AlertCircle,
  Award,
  CheckCircle2,
  CheckSquare,
  Lock,
  Send,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';

interface ReviewQueueModalProps {
  examId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewQueueModal({ examId, isOpen, onClose }: ReviewQueueModalProps) {
  const { data: summary, isLoading, refetch } = useAdminReviewSummary(examId);
  const { data: checklist, refetch: refetchChecklist } = useAdminPublishChecklist(examId);

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
            <h2 className="text-lg font-extrabold text-[#0B2447] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0052CC]" />
              Evaluation Review Queue — {summary?.title || 'Loading...'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Two-Level Approval & Result Publishing Workflow
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
          {isLoading ? (
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
                      : 'Admin can review and bulk approve all marks'}
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
                              {sub.evaluatedByName ? (
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
                              {!isLocked && !isPublished && (
                                <div className="flex items-center justify-end gap-2">
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
                                </div>
                              )}
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
