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
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-full">
            DRAFT
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
            PUBLISHED / LIVE
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-full">
            UNDER REVIEW
          </span>
        );
      case 'ADMIN_REVIEW':
        return (
          <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-full">
            ADMIN REVIEW
          </span>
        );
      case 'RESULT_PUBLISHED':
        return (
          <span className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold rounded-full">
            RESULTS PUBLISHED
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-full">
            ARCHIVED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-slate-800 min-h-screen bg-slate-50 w-full">
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          Back to Dashboard
        </button>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            Offline OMR & Hybrid Exam Management
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Enterprise exam workflow: Scheduling ➔ Student Timer ➔ Two-Level Review ➔ Ranks &
            Analytics
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create New Exam
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total Exams</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{exams.length}</p>
          </div>
          <FileText className="w-8 h-8 text-indigo-600/20" />
        </div>

        <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-800 font-semibold">Live Exams</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {exams.filter((e) => e.publishStatus === 'PUBLISHED').length}
            </p>
          </div>
          <Activity className="w-8 h-8 text-emerald-600/30" />
        </div>

        <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-purple-800 font-semibold">Review Queue</p>
            <p className="text-2xl font-black text-purple-700 mt-1">
              {
                exams.filter(
                  (e) => e.publishStatus === 'UNDER_REVIEW' || e.publishStatus === 'ADMIN_REVIEW',
                ).length
              }
            </p>
          </div>
          <ShieldCheck className="w-8 h-8 text-purple-600/30" />
        </div>

        <div className="bg-teal-50/80 p-4 rounded-xl border border-teal-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-teal-800 font-semibold">Published Results</p>
            <p className="text-2xl font-black text-teal-700 mt-1">
              {exams.filter((e) => e.publishStatus === 'RESULT_PUBLISHED').length}
            </p>
          </div>
          <Award className="w-8 h-8 text-teal-600/30" />
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-white rounded-xl border border-slate-200 max-w-full shadow-sm">
          {[
            { key: 'ALL', label: 'All Exams' },
            { key: 'DRAFT', label: 'Drafts' },
            { key: 'PUBLISHED', label: 'Published / Live' },
            { key: 'UNDER_REVIEW', label: 'Under Review' },
            { key: 'RESULT_PUBLISHED', label: 'Results Live' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm font-medium"
          />
        </div>
      </div>

      {/* Exams Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Exam Title</th>
                <th className="py-3.5 px-4">Duration & Window</th>
                <th className="py-3.5 px-4">Marks</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading exams...
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No exams found for selected filter.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 text-sm">{exam.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                        {exam.description || 'No description'}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
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
                      <p className="font-bold text-slate-900">{exam.totalMarks} pts</p>
                      <p className="text-[11px] text-slate-500">Pass: {exam.passingMarks} pts</p>
                    </td>

                    <td className="py-4 px-4">{getStatusBadge(exam.publishStatus)}</td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setUploadModalExam(exam)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            exam.questionPaperFileId
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {exam.questionPaperFileId ? 'QP Uploaded' : 'Upload QP'}
                        </button>

                        {exam.publishStatus === 'DRAFT' && (
                          <button
                            onClick={() => publishExamMutation.mutate(exam.id)}
                            disabled={publishExamMutation.isPending}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                          >
                            Publish Exam
                          </button>
                        )}

                        {exam.publishStatus === 'PUBLISHED' && (
                          <button
                            onClick={() => setLiveModalExamId(exam.id)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            Live Monitor
                          </button>
                        )}

                        {(exam.publishStatus === 'UNDER_REVIEW' ||
                          exam.publishStatus === 'ADMIN_REVIEW') && (
                          <button
                            onClick={() => setReviewModalExamId(exam.id)}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Review Queue
                          </button>
                        )}

                        {exam.publishStatus === 'RESULT_PUBLISHED' && (
                          <button
                            onClick={() => setAnalyticsModalExamId(exam.id)}
                            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
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
