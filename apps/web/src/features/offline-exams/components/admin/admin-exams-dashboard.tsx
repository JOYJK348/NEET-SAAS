'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAdminExams, usePublishExam } from '../../hooks/use-admin-exams';
import type { ExamItem } from '../../types/admin-exams';
import { CreateExamModal } from './create-exam-modal';
import { LiveDashboardModal } from './live-dashboard-modal';
import { ReviewQueueModal } from './review-queue-modal';
import { PostPublishAnalyticsModal } from './post-publish-analytics-modal';
import { UploadFilesModal } from './upload-files-modal';
import {
  Activity,
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Filter,
  MoreVertical,
  Plus,
  Search,
  ShieldCheck,
  Upload,
} from 'lucide-react';

export function AdminExamsDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [liveModalExamId, setLiveModalExamId] = useState<string | null>(null);
  const [reviewModalExamId, setReviewModalExamId] = useState<string | null>(null);
  const [analyticsModalExamId, setAnalyticsModalExamId] = useState<string | null>(null);
  const [uploadModalExam, setUploadModalExam] = useState<ExamItem | null>(null);

  const { data: response, isLoading } = useAdminExams();
  const publishExamMutation = usePublishExam();

  const exams = response?.data || [];

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'ALL') return matchesSearch;
    return matchesSearch && exam.publishStatus === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-full border border-slate-700">
            DRAFT
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
            PUBLISHED
          </span>
        );
      case 'LIVE':
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30 animate-pulse">
            LIVE
          </span>
        );
      case 'LOCKED':
        return (
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
            SUBMISSION CLOSED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-1 bg-orange-500/10 text-orange-400 text-xs font-semibold rounded-full border border-orange-500/30">
            UNDER REVIEW
          </span>
        );
      case 'ADMIN_REVIEW':
        return (
          <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs font-semibold rounded-full border border-purple-500/30">
            ADMIN REVIEW
          </span>
        );
      case 'RESULT_PUBLISHED':
        return (
          <span className="px-2.5 py-1 bg-teal-500/10 text-teal-400 text-xs font-bold rounded-full border border-teal-500/30">
            RESULTS PUBLISHED
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="px-2.5 py-1 bg-slate-800 text-slate-400 text-xs font-semibold rounded-full">
            ARCHIVED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-xs font-semibold rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 min-h-screen bg-slate-950 w-full">
      {/* Top Navigation Action */}
      <div>
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push('/dashboard');
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          Back to Dashboard
        </button>
      </div>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-500" />
            Offline OMR & Hybrid Exam Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise exam workflow: Scheduling ➔ Student Timer ➔ Two-Level Review ➔ Ranks &
            Analytics
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/30 transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create New Exam
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold">Total Exams</p>
            <p className="text-2xl font-black text-white mt-1">{exams.length}</p>
          </div>
          <FileText className="w-8 h-8 text-indigo-400/20" />
        </div>

        <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-800/40 flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-400 font-semibold">Live Exams</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {exams.filter((e) => e.publishStatus === 'PUBLISHED').length}
            </p>
          </div>
          <Activity className="w-8 h-8 text-emerald-400/30" />
        </div>

        <div className="bg-purple-950/20 p-4 rounded-xl border border-purple-800/40 flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-400 font-semibold">Review Queue</p>
            <p className="text-2xl font-black text-purple-400 mt-1">
              {
                exams.filter(
                  (e) => e.publishStatus === 'UNDER_REVIEW' || e.publishStatus === 'ADMIN_REVIEW',
                ).length
              }
            </p>
          </div>
          <ShieldCheck className="w-8 h-8 text-purple-400/30" />
        </div>

        <div className="bg-teal-950/20 p-4 rounded-xl border border-teal-800/40 flex items-center justify-between">
          <div>
            <p className="text-xs text-teal-400 font-semibold">Published Results</p>
            <p className="text-2xl font-black text-teal-400 mt-1">
              {exams.filter((e) => e.publishStatus === 'RESULT_PUBLISHED').length}
            </p>
          </div>
          <Award className="w-8 h-8 text-teal-400/30" />
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-900 rounded-xl border border-slate-800 max-w-full">
          {[
            { key: 'ALL', label: 'All Exams' },
            { key: 'DRAFT', label: 'Drafts' },
            { key: 'PUBLISHED', label: 'Published / Live' },
            { key: 'UNDER_REVIEW', label: 'Under Review' },
            { key: 'ADMIN_REVIEW', label: 'Admin Review' },
            { key: 'RESULT_PUBLISHED', label: 'Results Live' },
            { key: 'ARCHIVED', label: 'Archived' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Exams Data Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Exam Title</th>
                <th className="py-3.5 px-4">Duration & Window</th>
                <th className="py-3.5 px-4">Marks</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Loading exams...
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No exams found for selected filter.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-100 text-sm">{exam.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                        {exam.description || 'No description'}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>
                          {exam.durationMinutes} mins (+{exam.graceMinutes} min grace)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(exam.examWindowStart).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-200">{exam.totalMarks} pts</p>
                      <p className="text-[11px] text-slate-400">Pass: {exam.passingMarks} pts</p>
                    </td>

                    <td className="py-4 px-4">{getStatusBadge(exam.publishStatus)}</td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setUploadModalExam(exam)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                            exam.questionPaperFileId
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {exam.questionPaperFileId ? 'QP Uploaded' : 'Upload QP'}
                        </button>

                        {exam.publishStatus === 'DRAFT' && (
                          <button
                            onClick={() => publishExamMutation.mutate(exam.id)}
                            disabled={publishExamMutation.isPending}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                          >
                            Publish Exam
                          </button>
                        )}

                        {exam.publishStatus === 'PUBLISHED' && (
                          <button
                            onClick={() => setLiveModalExamId(exam.id)}
                            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            Live Monitor
                          </button>
                        )}

                        {(exam.publishStatus === 'UNDER_REVIEW' ||
                          exam.publishStatus === 'ADMIN_REVIEW') && (
                          <button
                            onClick={() => setReviewModalExamId(exam.id)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Review Queue
                          </button>
                        )}

                        {exam.publishStatus === 'RESULT_PUBLISHED' && (
                          <button
                            onClick={() => setAnalyticsModalExamId(exam.id)}
                            className="px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 border border-teal-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            View Analytics
                          </button>
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

      {/* Upload Files / QP Modal */}
      <UploadFilesModal
        exam={uploadModalExam}
        isOpen={!!uploadModalExam}
        onClose={() => setUploadModalExam(null)}
      />

      {/* Create Exam Modal */}
      <CreateExamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {/* Live Monitor Modal */}
      {liveModalExamId && (
        <LiveDashboardModal
          examId={liveModalExamId}
          isOpen={!!liveModalExamId}
          onClose={() => setLiveModalExamId(null)}
        />
      )}

      {/* Review Queue Modal */}
      {reviewModalExamId && (
        <ReviewQueueModal
          examId={reviewModalExamId}
          isOpen={!!reviewModalExamId}
          onClose={() => setReviewModalExamId(null)}
        />
      )}

      {/* Post-Publish Analytics Modal */}
      {analyticsModalExamId && (
        <PostPublishAnalyticsModal
          examId={analyticsModalExamId}
          isOpen={!!analyticsModalExamId}
          onClose={() => setAnalyticsModalExamId(null)}
        />
      )}
    </div>
  );
}
