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
  RotateCcw,
  Send,
  ShieldCheck,
  UserCheck,
  UserX,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              Evaluation Review Queue — {summary?.title || 'Loading...'}
            </h2>
            <p className="text-xs text-slate-400">
              Two-Level Approval & Result Publishing Workflow
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">Loading review queue summary...</div>
          ) : (
            <>
              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">Total Submissions</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats?.totalSubmissions || 0}
                  </p>
                  <p className="text-xs text-emerald-400 mt-1">
                    {stats?.evaluatedCount || 0} Evaluated
                  </p>
                </div>

                <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-800/40">
                  <p className="text-xs text-amber-300">Pending Admin Approval</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">
                    {stats?.unapprovedCount || 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {stats?.approvedCount || 0} Approved
                  </p>
                </div>

                <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-800/40">
                  <p className="text-xs text-indigo-300">Average Marks</p>
                  <p className="text-2xl font-bold text-indigo-400 mt-1">
                    {stats?.averageMarks || 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Highest: {stats?.highestMarks || 0}</p>
                </div>

                <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-800/40">
                  <p className="text-xs text-rose-300">Returned to Tutor</p>
                  <p className="text-2xl font-bold text-rose-400 mt-1">
                    {stats?.returnedCount || 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Pending re-eval</p>
                </div>
              </div>

              {/* Status & Action Bar */}
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  {isPublished ? (
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full">
                      RESULTS PUBLISHED
                    </span>
                  ) : isLocked ? (
                    <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-full flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> EVALUATION LOCKED
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-full">
                      REVIEW IN PROGRESS
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
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
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4" />
                      Approve All & Lock Evaluation
                    </button>
                  )}

                  {!isPublished && (
                    <button
                      onClick={() => setShowChecklistModal(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Publish Results...
                    </button>
                  )}
                </div>
              </div>

              {/* Rejection Modal Inline */}
              {rejectingId && (
                <div className="bg-rose-950/30 border border-rose-800/60 p-4 rounded-xl space-y-3">
                  <h4 className="text-sm font-semibold text-rose-200">
                    Return Submission to Tutor for Re-Evaluation
                  </h4>
                  <textarea
                    rows={2}
                    placeholder="Enter mandatory reason for returning submission to tutor..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setRejectingId(null)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRejectSingle(rejectingId)}
                      disabled={rejectMutation.isPending || !rejectReason.trim()}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold"
                    >
                      Confirm Return
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition"
          >
            Close Review Queue
          </button>
        </div>
      </div>

      {/* Pre-flight Publish Checklist Modal */}
      {showChecklistModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Pre-Flight Publish Safety Checklist
              </h3>
              <button
                onClick={() => setShowChecklistModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {checklist?.items.map((item) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold ${
                    item.passed
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowChecklistModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handlePublishResults}
                disabled={!checklist?.canPublish || publishResultsMutation.isPending}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/30 transition flex items-center gap-2"
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
