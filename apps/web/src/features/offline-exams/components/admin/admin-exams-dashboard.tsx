'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAdminExams, usePublishExam } from '../../hooks/use-admin-exams';
import { useBatches } from '@/features/students/hooks/use-students';
import type { ExamItem } from '../../types/admin-exams';
import { CreateExamModal } from './create-exam-modal';
import { LiveDashboardModal } from './live-dashboard-modal';
import { ReviewQueueModal } from './review-queue-modal';
import { PostPublishAnalyticsModal } from './post-publish-analytics-modal';
import { UploadFilesModal } from './upload-files-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Activity,
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  Clock,
  FileText,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Upload,
  Sparkles,
  Layers,
  CheckCircle2,
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

  const { batches } = useBatches();
  const batchMap = new Map(batches.map((b) => [b.id, b.name]));

  const { data: response, isLoading, refetch } = useAdminExams();
  const publishExamMutation = usePublishExam();

  const rawExams = response?.data || [];

  // Deduplicate and group exams with same title & course into a single row with multi-batch badges
  const groupedExamsMap = new Map<
    string,
    ExamItem & { batchNames: string[]; allExamIds: string[] }
  >();

  rawExams.forEach((exam) => {
    const groupKey = `${exam.title.trim().toLowerCase()}-${exam.courseId}-${exam.durationMinutes}`;
    const batchName = batchMap.get(exam.batchId) || exam.batchId;

    if (!groupedExamsMap.has(groupKey)) {
      groupedExamsMap.set(groupKey, {
        ...exam,
        batchNames: [batchName],
        allExamIds: [exam.id],
      });
    } else {
      const existing = groupedExamsMap.get(groupKey)!;
      if (batchName && !existing.batchNames.includes(batchName)) {
        existing.batchNames.push(batchName);
      }
      if (!existing.allExamIds.includes(exam.id)) {
        existing.allExamIds.push(exam.id);
      }
    }
  });

  const groupedExams = Array.from(groupedExamsMap.values());
  const exams = groupedExams;

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

  const tabs = [
    { key: 'ALL', label: 'All Exams' },
    { key: 'DRAFT', label: 'Drafts' },
    { key: 'PUBLISHED', label: 'Published / Live' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'RESULT_PUBLISHED', label: 'Results Live' },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Signature Violet Gradient Header Banner */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-200" />
            <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
              Offline OMR & Hybrid Exam Management
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight text-white flex items-center gap-2">
            Exams Dashboard 📝
          </h1>
          <p className="text-violet-200 text-xs mt-0.5">
            Enterprise workflow: Scheduling ➔ Question Papers ➔ Review Queue ➔ Ranks & Analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex-1 sm:flex-none px-3 gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl text-xs font-bold transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => router.push('/dashboard/exams/new')}
            className="flex-1 sm:flex-none px-4 gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold border-0 shadow-xs rounded-xl text-xs"
          >
            <Plus className="h-4 w-4 text-violet-600 shrink-0" aria-hidden="true" />
            <span>Create New Exam</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Exams */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-violet-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-violet-100 bg-violet-50 text-violet-600 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Total Exams
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{exams.length}</p>
            </div>
          </div>
        </Card>

        {/* Live Exams */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-emerald-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Live Exams
              </p>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
                {exams.filter((e) => e.publishStatus === 'PUBLISHED').length}
              </p>
            </div>
          </div>
        </Card>

        {/* Review Queue */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-purple-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-purple-100 bg-purple-50 text-purple-600 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Review Queue
              </p>
              <p className="text-xl sm:text-2xl font-black text-purple-700 mt-0.5">
                {
                  exams.filter(
                    (e) => e.publishStatus === 'UNDER_REVIEW' || e.publishStatus === 'ADMIN_REVIEW',
                  ).length
                }
              </p>
            </div>
          </div>
        </Card>

        {/* Published Results */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-teal-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-teal-100 bg-teal-50 text-teal-600 shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Results Live
              </p>
              <p className="text-xl sm:text-2xl font-black text-teal-700 mt-0.5">
                {exams.filter((e) => e.publishStatus === 'RESULT_PUBLISHED').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Modern Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-white text-violet-700 shadow-sm border border-purple-100 scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search exams by title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl h-10 border-slate-200 bg-white focus:border-violet-500 text-xs font-medium"
          />
        </div>
      </div>

      {/* Roster Data Table Card */}
      <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Exam Details</th>
                <th className="py-3.5 px-4">Duration & Window</th>
                <th className="py-3.5 px-4">Marks Criteria</th>
                <th className="py-3.5 px-4">Publish Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-semibold">
                    Loading exam schedules...
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-semibold">
                    No exams found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 text-sm">{exam.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {exam.batchNames.map((bName, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200"
                          >
                            <Layers className="w-3 h-3 text-violet-500" />
                            {bName}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate max-w-xs">
                        {exam.description || 'No description provided'}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                        <Clock className="w-3.5 h-3.5 text-violet-600" />
                        <span>
                          {exam.durationMinutes} mins (+{exam.graceMinutes}m grace)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Window: {new Date(exam.examWindowStart).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-extrabold text-slate-900">{exam.totalMarks} Marks</p>
                      <p className="text-[11px] text-slate-500">
                        Passing: {exam.passingMarks} Marks
                      </p>
                    </td>

                    <td className="py-4 px-4">{getStatusBadge(exam.publishStatus)}</td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUploadModalExam(exam)}
                          className={cn(
                            'h-9 rounded-xl text-xs font-bold gap-1 px-3 transition-all',
                            exam.questionPaperFileId
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
                          )}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {exam.questionPaperFileId ? 'QP Uploaded' : 'Upload QP'}
                        </Button>

                        {exam.publishStatus === 'DRAFT' && (
                          <Button
                            size="sm"
                            onClick={() => exam.allExamIds.forEach((id) => publishExamMutation.mutate(id))}
                            disabled={publishExamMutation.isPending}
                            className="h-9 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-xs px-3"
                          >
                            Publish Exam
                          </Button>
                        )}

                        {exam.publishStatus === 'PUBLISHED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/exams/${exam.id}/live`)}
                            className="h-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 rounded-xl text-xs font-bold gap-1 px-3"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            Live Monitor
                          </Button>
                        )}

                        {(exam.publishStatus === 'UNDER_REVIEW' ||
                          exam.publishStatus === 'ADMIN_REVIEW') && (
                          <Button
                            size="sm"
                            onClick={() => setReviewModalExamId(exam.id)}
                            className="h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs gap-1 px-3"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Review Queue
                          </Button>
                        )}

                        {exam.publishStatus === 'RESULT_PUBLISHED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/exams/${exam.id}/analytics`)}
                            className="h-9 bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200 rounded-xl text-xs font-bold gap-1 px-3"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            Analytics & Scorecard
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <UploadFilesModal
        exam={uploadModalExam}
        isOpen={!!uploadModalExam}
        onClose={() => setUploadModalExam(null)}
      />

      <CreateExamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {liveModalExamId && (
        <LiveDashboardModal
          examId={liveModalExamId}
          isOpen={!!liveModalExamId}
          onClose={() => setLiveModalExamId(null)}
        />
      )}

      {reviewModalExamId && (
        <ReviewQueueModal
          examId={reviewModalExamId}
          isOpen={!!reviewModalExamId}
          onClose={() => setReviewModalExamId(null)}
        />
      )}

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
