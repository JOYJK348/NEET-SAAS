'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAdminExams, usePublishExam, useDeleteExam } from '../../hooks/use-admin-exams';
import { useBatches } from '@/features/students/hooks/use-students';
import { toast } from 'sonner';
import type { ExamItem } from '../../types/admin-exams';
import { CreateExamModal } from './create-exam-modal';
import { LiveDashboardModal } from './live-dashboard-modal';
import { ReviewQueueModal } from './review-queue-modal';
import { PostPublishAnalyticsModal } from './post-publish-analytics-modal';
import { UploadFilesModal } from './upload-files-modal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Activity,
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
  Layers,
  ChevronRight,
  Loader2,
  FileCheck,
  FileX,
  AlertCircle,
  Trash2,
} from 'lucide-react';

function getEffectiveDuration(exam: {
  durationMinutes?: number;
  examWindowStart?: string | Date;
  examWindowEnd?: string | Date;
  scheduledStartAt?: string | Date;
  scheduledEndAt?: string | Date;
}): number {
  if (exam.examWindowStart && exam.examWindowEnd) {
    const startMs = new Date(exam.examWindowStart).getTime();
    const endMs = new Date(exam.examWindowEnd).getTime();
    if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
      const diff = Math.round((endMs - startMs) / (1000 * 60));
      if (diff > 0) return diff;
    }
  }
  if (exam.scheduledStartAt && exam.scheduledEndAt) {
    const startMs = new Date(exam.scheduledStartAt).getTime();
    const endMs = new Date(exam.scheduledEndAt).getTime();
    if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
      const diff = Math.round((endMs - startMs) / (1000 * 60));
      if (diff > 0) return diff;
    }
  }
  return exam.durationMinutes || 120;
}

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
  const [deleteModalExam, setDeleteModalExam] = useState<(ExamItem & { allExamIds: string[] }) | null>(null);

  const { batches } = useBatches();
  const batchMap = new Map(batches.map((b) => [b.id, b.name]));

  const { data: response, isLoading, refetch } = useAdminExams({ limit: 100 });
  const publishExamMutation = usePublishExam();
  const deleteExamMutation = useDeleteExam();

  const rawExams = response?.data || [];

  // Sort rawExams newest first (createdAt DESC / scheduledStartAt DESC)
  const sortedRawExams = [...rawExams].sort((a, b) => {
    const timeA = new Date((a as any).createdAt || a.examWindowStart || 0).getTime();
    const timeB = new Date((b as any).createdAt || b.examWindowStart || 0).getTime();
    return timeB - timeA;
  });

  // Group and map exams cleanly so distinct exams are sorted newest first
  const groupedExamsMap = new Map<
    string,
    ExamItem & { batchNames: string[]; allExamIds: string[] }
  >();

  sortedRawExams.forEach((exam) => {
    const titleKey = exam.title.trim().toLowerCase();
    const dateKey = new Date(exam.examWindowStart || exam.scheduledStartAt || 0).toISOString().slice(0, 10);
    const groupKey = `${titleKey}-${dateKey}-${exam.publishStatus}`;

    let batchName = batchMap.get(exam.batchId);
    if (!batchName) {
      if (exam.batchId === 'ALL' || exam.batchId === 'batch-default') {
        batchName = 'All Batches';
      } else {
        batchName = exam.batchId || 'Batch';
      }
    }

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
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-full">
            DRAFT
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold rounded-full">
            PUBLISHED / LIVE
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold rounded-full">
            UNDER REVIEW
          </span>
        );
      case 'ADMIN_REVIEW':
        return (
          <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-[#0052CC] text-xs font-extrabold rounded-full">
            ADMIN REVIEW
          </span>
        );
      case 'RESULT_PUBLISHED':
        return (
          <span className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-extrabold rounded-full">
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

  const getQPStatusBadge = (questionPaperFileId?: string | null) => {
    if (questionPaperFileId) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold rounded-full shadow-2xs">
          <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>QP Uploaded ✓</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold rounded-full shadow-2xs animate-pulse">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>QP Missing ⚠️</span>
      </span>
    );
  };

  const tabs = [
    { key: 'ALL', label: 'All Exams' },
    { key: 'DRAFT', label: 'Drafts' },
    { key: 'PUBLISHED', label: 'Published / Live' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'RESULT_PUBLISHED', label: 'Results Live' },
  ];

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* Header Banner - ISML LMS Light Blue Style */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Management Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Offline & Hybrid Exams</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
            Offline & Hybrid Exams Schedule
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Enterprise exam workflow: Scheduling ➔ Question Papers ➔ Review Queue ➔ Scorecards &
            Ranks.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex-1 sm:flex-none px-3 gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 shadow-2xs rounded-xl text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0 text-[#0052CC]" aria-hidden="true" />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => router.push('/dashboard/exams/new')}
            className="flex-1 sm:flex-none px-4 gap-1.5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs rounded-xl text-xs"
          >
            <Plus className="h-4 w-4 text-white shrink-0" aria-hidden="true" />
            <span>Create New Exam</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Exams */}
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Total Exams
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5">
                {exams.length}
              </p>
            </div>
          </div>
        </Card>

        {/* QP Uploaded Status */}
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-emerald-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shrink-0">
              <FileCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                QP Ready
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-0.5">
                {exams.filter((e) => !!e.questionPaperFileId).length} / {exams.length}
              </p>
            </div>
          </div>
        </Card>

        {/* Live Exams */}
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Live Exams
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-0.5">
                {exams.filter((e) => e.publishStatus === 'PUBLISHED').length}
              </p>
            </div>
          </div>
        </Card>

        {/* Review Queue */}
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Review Queue
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-0.5">
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
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-600 shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Results Live
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-teal-700 mt-0.5">
                {exams.filter((e) => e.publishStatus === 'RESULT_PUBLISHED').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Modern Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              suppressHydrationWarning
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-[#0052CC] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-[#0B2447] hover:bg-white/60',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 w-full md:w-72 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 focus-within:border-[#0052CC] focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            suppressHydrationWarning
            placeholder="Search exams by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full"
          />
        </div>
      </div>

      {/* Unified Responsive Exam List & Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Header (Hidden on Mobile, Visible on Tablet/Desktop) */}
        <div className="hidden md:grid md:grid-cols-12 gap-3 px-6 py-4 bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">Exam Details</div>
          <div className="col-span-2">Timing & Window</div>
          <div className="col-span-2">Marks Criteria</div>
          <div className="col-span-2">Status & QP</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {/* List Content */}
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#0052CC] animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Loading exam schedules...
              </p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052CC] flex items-center justify-center mx-auto border border-blue-100">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-[#0B2447]">No exams found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No exams match your current filter or search criteria. Click &quot;Create New Exam&quot; to schedule a test.
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 h-9 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-bold gap-1.5 px-4 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create New Exam
              </Button>
            </div>
          ) : (
            filteredExams.map((exam) => {
              const isDraft = exam.publishStatus === 'DRAFT';
              const isLive = exam.publishStatus === 'PUBLISHED';
              const isResultsLive = exam.publishStatus === 'RESULT_PUBLISHED';
              const isUnderReview =
                exam.publishStatus === 'UNDER_REVIEW' || exam.publishStatus === 'ADMIN_REVIEW';

              const borderAccentColor = isLive
                ? 'border-l-emerald-500'
                : isResultsLive
                  ? 'border-l-teal-500'
                  : isUnderReview
                    ? 'border-l-amber-500'
                    : 'border-l-[#0052CC]';

              return (
                <div
                  key={exam.id}
                  className={cn(
                    'transition-colors hover:bg-blue-50/30 border-l-4 p-4 sm:p-5 md:p-0 md:border-l-0',
                    borderAccentColor,
                  )}
                >
                  {/* MOBILE VIEW (< 768px): Sleek, continuous list item without ugly box-in-box feel */}
                  <div className="block md:hidden space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-[#0B2447] text-sm sm:text-base leading-snug">
                          {exam.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {exam.batchNames.map((bName, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] font-black text-[#0052CC] bg-blue-50/90 px-2 py-0.5 rounded-md border border-blue-200/80"
                            >
                              <Layers className="w-2.5 h-2.5 text-[#0052CC]" />
                              {bName}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {getStatusBadge(exam.publishStatus)}
                      </div>
                    </div>

                    {exam.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {exam.description}
                      </p>
                    )}

                    {/* Metadata Strip */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-bold text-[#0B2447]">
                          <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
                          {getEffectiveDuration(exam)}m (+{exam.graceMinutes}m)
                        </span>
                        <span className="flex items-center gap-1 font-bold text-[#0B2447]">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          {exam.totalMarks} Marks
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(exam.examWindowStart).toLocaleDateString()}
                      </span>
                    </div>

                    {/* QP Badge & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div>{getQPStatusBadge(exam.questionPaperFileId)}</div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {isDraft && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (!exam.questionPaperFileId) {
                                  toast.error('Please upload Question Paper PDF before publishing!');
                                  setUploadModalExam(exam);
                                  return;
                                }
                                exam.allExamIds.forEach((id) => publishExamMutation.mutate(id));
                              }}
                              disabled={publishExamMutation.isPending}
                              className="h-8 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-[11px] font-extrabold px-3 shadow-2xs cursor-pointer"
                            >
                              {publishExamMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Publish Exam'
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUploadModalExam(exam)}
                              className={cn(
                                'h-8 rounded-xl text-[11px] font-extrabold gap-1 px-2.5 cursor-pointer',
                                exam.questionPaperFileId
                                  ? 'bg-blue-50 text-[#0052CC] border-blue-200 hover:bg-blue-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100',
                              )}
                              title={exam.questionPaperFileId ? 'Replace QP File' : 'Upload QP File'}
                            >
                              <Upload className="w-3 h-3" />
                              {exam.questionPaperFileId ? 'QP' : 'Upload QP'}
                            </Button>
                          </>
                        )}

                        {isLive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/exams/${exam.id}/live`)}
                            className="h-8 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 rounded-xl text-[11px] font-extrabold gap-1 px-3 cursor-pointer"
                          >
                            <Activity className="w-3 h-3" /> Monitor
                          </Button>
                        )}

                        {isUnderReview && (
                          <Button
                            size="sm"
                            onClick={() => setReviewModalExamId(exam.id)}
                            className="h-8 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-extrabold gap-1 px-3 cursor-pointer"
                          >
                            <ShieldCheck className="w-3 h-3" /> Review
                          </Button>
                        )}

                        {isResultsLive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/exams/${exam.id}/analytics`)}
                            className="h-8 bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200 rounded-xl text-[11px] font-extrabold gap-1 px-3 cursor-pointer"
                          >
                            <BarChart3 className="w-3 h-3" /> Analytics
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteModalExam(exam)}
                          disabled={deleteExamMutation.isPending}
                          className="h-8 bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 rounded-xl text-[11px] font-bold px-2 cursor-pointer"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* DESKTOP VIEW (>= 768px): 12-column grid layout with clean 3-col Actions space */}
                  <div className="hidden md:grid md:grid-cols-12 gap-3 px-6 py-4 items-center">
                    {/* Exam Details (col-span-3) */}
                    <div className="col-span-3 min-w-0">
                      <p className="font-extrabold text-[#0B2447] text-sm truncate">{exam.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {exam.batchNames.map((bName, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-black text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                          >
                            <Layers className="w-3 h-3 text-[#0052CC]" />
                            {bName}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate max-w-xs font-medium">
                        {exam.description || 'No description provided'}
                      </p>
                    </div>

                    {/* Duration & Window (col-span-2) */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1.5 text-[#0B2447] font-extrabold text-xs">
                        <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
                        <span>
                          {getEffectiveDuration(exam)}m (+{exam.graceMinutes}m grace)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Window: {new Date(exam.examWindowStart).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Marks Criteria (col-span-2) */}
                    <div className="col-span-2">
                      <p className="font-extrabold text-[#0B2447] text-xs">{exam.totalMarks} Marks</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Passing: {exam.passingMarks} Marks
                      </p>
                    </div>

                    {/* Status & QP (col-span-2) */}
                    <div className="col-span-2 space-y-1">
                      <div>{getStatusBadge(exam.publishStatus)}</div>
                      <div>{getQPStatusBadge(exam.questionPaperFileId)}</div>
                    </div>

                    {/* Actions (col-span-3 text-right) - Generous space so buttons NEVER overlap! */}
                    <div className="col-span-3 text-right shrink-0">
                      <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                        {isDraft && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (!exam.questionPaperFileId) {
                                  toast.error('Please upload Question Paper PDF before publishing!');
                                  setUploadModalExam(exam);
                                  return;
                                }
                                exam.allExamIds.forEach((id) => publishExamMutation.mutate(id));
                              }}
                              disabled={publishExamMutation.isPending}
                              className="h-9 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-2xs px-3.5 transition-all cursor-pointer"
                            >
                              {publishExamMutation.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                'Publish Exam'
                              )}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUploadModalExam(exam)}
                              className={cn(
                                'h-9 rounded-xl text-xs font-extrabold gap-1.5 px-3 transition-all cursor-pointer shadow-2xs',
                                exam.questionPaperFileId
                                  ? 'bg-blue-50 text-[#0052CC] border-blue-200 hover:bg-blue-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100',
                              )}
                              title={exam.questionPaperFileId ? 'Replace QP File' : 'Upload QP File'}
                            >
                              <Upload className="w-3.5 h-3.5" />
                              {exam.questionPaperFileId ? 'QP' : 'Upload QP'}
                            </Button>
                          </>
                        )}

                        {isLive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/exams/${exam.id}/live`)}
                            className="h-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 rounded-xl text-xs font-bold gap-1 px-3 cursor-pointer"
                          >
                            <Activity className="w-3.5 h-3.5" /> Live Monitor
                          </Button>
                        )}

                        {isUnderReview && (
                          <Button
                            size="sm"
                            onClick={() => setReviewModalExamId(exam.id)}
                            className="h-9 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-2xs gap-1 px-3 cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Review Queue
                          </Button>
                        )}

                        {isResultsLive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/exams/${exam.id}/analytics`)}
                            className="h-9 bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200 rounded-xl text-xs font-bold gap-1 px-3 cursor-pointer"
                          >
                            <BarChart3 className="w-3.5 h-3.5" /> Analytics
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteModalExam(exam)}
                          disabled={deleteExamMutation.isPending}
                          className="h-9 bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 rounded-xl text-xs font-bold gap-1 px-2.5 cursor-pointer shrink-0"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

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

      {deleteModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  Delete Examination?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete <span className="font-extrabold text-slate-800">"{deleteModalExam.title}"</span>?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl text-[11px] font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>This exam schedule will be deleted for all target batches.</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setDeleteModalExam(null)}
                disabled={deleteExamMutation.isPending}
                className="h-10 rounded-xl text-xs font-bold px-4 border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const idsToDelete = deleteModalExam.allExamIds && deleteModalExam.allExamIds.length > 0
                    ? deleteModalExam.allExamIds
                    : [deleteModalExam.id];
                  idsToDelete.forEach((id) => deleteExamMutation.mutate(id));
                  setDeleteModalExam(null);
                }}
                disabled={deleteExamMutation.isPending}
                className="h-10 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-5 rounded-xl shadow-xs gap-1.5 cursor-pointer"
              >
                {deleteExamMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Confirm Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
