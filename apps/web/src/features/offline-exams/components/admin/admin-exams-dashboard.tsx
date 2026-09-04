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
            placeholder="Search exams by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full"
          />
        </div>
      </div>

      {/* Professional Mobile Card Layout (Visible on mobile screens) */}
      <div className="block md:hidden space-y-4">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Loading exam schedules...
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-2xl border-slate-200 bg-white shadow-2xs space-y-2">
            <p className="text-xs font-bold text-slate-500">No exams found</p>
          </div>
        ) : (
          filteredExams.map((exam) => (
            <Card
              key={exam.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden"
            >
              {/* Card Header Strip */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 p-4 border-b border-blue-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-[#0B2447] text-base leading-snug">
                    {exam.title}
                  </h3>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {getStatusBadge(exam.publishStatus)}
                    {getQPStatusBadge(exam.questionPaperFileId)}
                  </div>
                </div>

                {/* Target Batches & QP Status Badges */}
                <div className="flex flex-wrap items-center gap-1">
                  {exam.batchNames.map((bName, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#0052CC] bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs"
                    >
                      <Layers className="w-3 h-3 text-[#0052CC]" />
                      {bName}
                    </span>
                  ))}
                </div>

                {exam.description && (
                  <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                    {exam.description}
                  </p>
                )}
              </div>

              {/* Card Meta Stats Grid */}
              <div className="p-4 bg-white space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Duration & Grace
                    </span>
                    <span className="font-extrabold text-[#0B2447] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
                      {exam.durationMinutes}m (+{exam.graceMinutes}m)
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Marks (Total / Pass)
                    </span>
                    <span className="font-extrabold text-[#0B2447] flex items-center gap-1 mt-0.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {exam.totalMarks} ({exam.passingMarks})
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-medium text-slate-600">
                  <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Exam Window:
                  </span>
                  <span className="font-bold text-[#0B2447]">
                    {new Date(exam.examWindowStart).toLocaleDateString()}
                  </span>
                </div>

                {/* Card Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadModalExam(exam)}
                    className={cn(
                      'h-9 rounded-xl text-xs font-extrabold gap-1.5 px-3 transition-all',
                      exam.questionPaperFileId
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 animate-pulse',
                    )}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {exam.questionPaperFileId ? '✓ QP Uploaded' : '⚠️ Upload QP'}
                  </Button>

                  {exam.publishStatus === 'DRAFT' && (
                    <Button
                      size="sm"
                      onClick={() =>
                        exam.allExamIds.forEach((id) => publishExamMutation.mutate(id))
                      }
                      disabled={publishExamMutation.isPending}
                      className="h-9 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-2xs px-3"
                    >
                      {publishExamMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Publish Exam'
                      )}
                    </Button>
                  )}

                  {exam.publishStatus === 'PUBLISHED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/exams/${exam.id}/live`)}
                      className="h-9 bg-emerald-50 text-emerald-700 border-emerald-200 rounded-xl text-xs font-bold gap-1 px-3"
                    >
                      <Activity className="w-3.5 h-3.5" /> Live Monitor
                    </Button>
                  )}

                  {(exam.publishStatus === 'UNDER_REVIEW' ||
                    exam.publishStatus === 'ADMIN_REVIEW') && (
                    <Button
                      size="sm"
                      onClick={() => setReviewModalExamId(exam.id)}
                      className="h-9 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-2xs gap-1 px-3"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Review Queue
                    </Button>
                  )}

                  {exam.publishStatus === 'RESULT_PUBLISHED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/exams/${exam.id}/analytics`)}
                      className="h-9 bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200 rounded-xl text-xs font-bold gap-1 px-3"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Analytics
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Roster Data Table Card (Hidden on mobile) */}
      <Card className="hidden md:block rounded-2xl border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Exam Details</th>
                <th className="py-3.5 px-4">Duration & Window</th>
                <th className="py-3.5 px-4">Marks Criteria</th>
                <th className="py-3.5 px-4">Question Paper Status</th>
                <th className="py-3.5 px-4">Publish Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-semibold">
                    Loading exam schedules...
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400 font-semibold">
                    No exams found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-extrabold text-[#0B2447] text-sm">{exam.title}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {exam.batchNames.map((bName, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                          >
                            <Layers className="w-3 h-3 text-[#0052CC]" />
                            {bName}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate max-w-xs font-medium">
                        {exam.description || 'No description provided'}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-[#0B2447] font-bold">
                        <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
                        <span>
                          {exam.durationMinutes} mins (+{exam.graceMinutes}m grace)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Window: {new Date(exam.examWindowStart).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-extrabold text-[#0B2447]">{exam.totalMarks} Marks</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Passing: {exam.passingMarks} Marks
                      </p>
                    </td>

                    {/* Dedicated Question Paper Status Column */}
                    <td className="py-4 px-4">
                      {getQPStatusBadge(exam.questionPaperFileId)}
                    </td>

                    <td className="py-4 px-4">{getStatusBadge(exam.publishStatus)}</td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUploadModalExam(exam)}
                          className={cn(
                            'h-9 rounded-xl text-xs font-extrabold gap-1.5 px-3 transition-all',
                            exam.questionPaperFileId
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 animate-pulse',
                          )}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {exam.questionPaperFileId ? '✓ QP Uploaded' : '⚠️ Upload QP'}
                        </Button>

                        {exam.publishStatus === 'DRAFT' && (
                          <Button
                            size="sm"
                            onClick={() =>
                              exam.allExamIds.forEach((id) => publishExamMutation.mutate(id))
                            }
                            disabled={publishExamMutation.isPending}
                            className="h-9 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-2xs px-3"
                          >
                            {publishExamMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              'Publish Exam'
                            )}
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
                            className="h-9 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-2xs gap-1 px-3"
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
