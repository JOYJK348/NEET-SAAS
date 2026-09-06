'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAdminExams, usePublishExam, useDeleteExam } from '../../hooks/use-admin-exams';
import { useBatches } from '@/features/students/hooks/use-students';
import { toast } from 'sonner';
import type { ExamItem } from '../../types/admin-exams';
import { CreateExamModal } from './create-exam-modal';
import { EditExamModal } from './edit-exam-modal';
import { LiveDashboardModal } from './live-dashboard-modal';
import { ReviewQueueModal } from './review-queue-modal';
import { PostPublishAnalyticsModal } from './post-publish-analytics-modal';
import { UploadFilesModal } from './upload-files-modal';
import { BulkImportModal } from '@/features/online-exams/components/admin/bulk-import-modal';
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
  Pencil,
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
  Monitor,
  Sparkles,
  BookOpen,
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
  const [modeFilter, setModeFilter] = useState<string>('ALL');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editModalExam, setEditModalExam] = useState<ExamItem | null>(null);
  const [liveModalExamId, setLiveModalExamId] = useState<string | null>(null);
  const [reviewModalExamId, setReviewModalExamId] = useState<string | null>(null);
  const [analyticsModalExamId, setAnalyticsModalExamId] = useState<string | null>(null);
  const [uploadModalExam, setUploadModalExam] = useState<ExamItem | null>(null);
  const [bulkImportExam, setBulkImportExam] = useState<(ExamItem & { allExamIds: string[] }) | null>(null);
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

  const [batchFilter, setBatchFilter] = useState<string>('ALL');

  const onlineCount = exams.filter((e) => (e.mode || '').toUpperCase() === 'ONLINE').length;
  const offlineCount = exams.filter((e) => (e.mode || '').toUpperCase() === 'OFFLINE' || !(e.mode)).length;
  const hybridCount = exams.filter((e) => (e.mode || '').toUpperCase() === 'HYBRID').length;

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'ALL' || exam.publishStatus === activeTab;

    const normMode = (exam.mode || 'OFFLINE').toUpperCase();
    const matchesMode =
      modeFilter === 'ALL' ||
      (modeFilter === 'ONLINE' && normMode === 'ONLINE') ||
      (modeFilter === 'OFFLINE' && normMode === 'OFFLINE') ||
      (modeFilter === 'HYBRID' && normMode === 'HYBRID');

    const matchesBatch =
      batchFilter === 'ALL' ||
      exam.batchId === batchFilter ||
      exam.allExamIds.includes(batchFilter) ||
      exam.batchNames.some((b) => b.toLowerCase().includes(batchFilter.toLowerCase()));

    return matchesSearch && matchesTab && matchesMode && matchesBatch;
  });

  const getModeBadge = (mode?: string) => {
    const normalizedMode = (mode || 'OFFLINE').toUpperCase();
    if (normalizedMode === 'ONLINE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-100 border border-purple-300 text-purple-800 text-[11px] font-black rounded-lg shadow-2xs shrink-0">
          <Monitor className="w-3.5 h-3.5 text-purple-700 shrink-0" />
          <span>ONLINE CBT</span>
        </span>
      );
    }
    if (normalizedMode === 'HYBRID') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-100 border border-indigo-300 text-indigo-800 text-[11px] font-black rounded-lg shadow-2xs shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
          <span>HYBRID</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 border border-blue-300 text-[#0052CC] text-[11px] font-black rounded-lg shadow-2xs shrink-0">
        <FileText className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
        <span>OFFLINE OMR</span>
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-extrabold rounded-full whitespace-nowrap shadow-2xs">
            DRAFT
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-black rounded-full whitespace-nowrap shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            PUBLISHED / LIVE
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-extrabold rounded-full whitespace-nowrap shadow-2xs">
            UNDER REVIEW
          </span>
        );
      case 'ADMIN_REVIEW':
        return (
          <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 border border-blue-200 text-[#0052CC] text-[11px] font-extrabold rounded-full whitespace-nowrap shadow-2xs">
            ADMIN REVIEW
          </span>
        );
      case 'RESULT_PUBLISHED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-700 text-[11px] font-black rounded-full whitespace-nowrap shadow-2xs">
            RESULTS PUBLISHED
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold rounded-full whitespace-nowrap shadow-2xs">
            ARCHIVED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-full whitespace-nowrap shadow-2xs">
            {status}
          </span>
        );
    }
  };

  const getQPStatusBadge = (mode?: string, questionPaperFileId?: string | null) => {
    const isOnline = (mode || '').toUpperCase() === 'ONLINE';

    if (questionPaperFileId) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold rounded-full shadow-2xs whitespace-nowrap">
          <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{isOnline ? 'QP / CBT Attached ✓' : 'QP Uploaded ✓'}</span>
        </span>
      );
    }

    if (isOnline) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold rounded-full shadow-2xs whitespace-nowrap">
          <Monitor className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>Online CBT (Digital)</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-extrabold rounded-full shadow-2xs whitespace-nowrap animate-pulse">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>QP Missing ⚠️</span>
      </span>
    );
  };

  const tabs = [
    { key: 'ALL', label: 'All Exams', count: exams.length },
    { key: 'DRAFT', label: 'Drafts', count: exams.filter((e) => e.publishStatus === 'DRAFT').length },
    { key: 'PUBLISHED', label: 'Published / Live', count: exams.filter((e) => e.publishStatus === 'PUBLISHED').length },
    {
      key: 'UNDER_REVIEW',
      label: 'Under Review',
      count: exams.filter((e) => e.publishStatus === 'UNDER_REVIEW' || e.publishStatus === 'ADMIN_REVIEW').length,
    },
    {
      key: 'RESULT_PUBLISHED',
      label: 'Results Live',
      count: exams.filter((e) => e.publishStatus === 'RESULT_PUBLISHED').length,
    },
  ];

  return (
    <div suppressHydrationWarning className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* Header Banner - ISML LMS Light Blue Style */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Management Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Exams Dashboard</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
            Tenant Admin Exams Management Dashboard
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Manage Online CBT & Offline OMR examination schedules, review student scores, and publish rankings.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 self-end sm:self-auto">
          <Button
            suppressHydrationWarning
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex-1 sm:flex-none px-3 gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 shadow-2xs rounded-xl text-xs cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0 text-[#0052CC]" aria-hidden="true" />
            <span>Refresh</span>
          </Button>
          <Button
            suppressHydrationWarning
            onClick={() => router.push('/dashboard/exams/new')}
            className="flex-1 sm:flex-none px-4 gap-1.5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs rounded-xl text-xs cursor-pointer"
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

        {/* Online CBT */}
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-purple-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 shrink-0">
              <Monitor className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Online CBT
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-purple-700 mt-0.5">
                {onlineCount}
              </p>
            </div>
          </div>
        </Card>

        {/* Offline OMR */}
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-blue-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Offline OMR
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0052CC] mt-0.5">
                {offlineCount}
              </p>
            </div>
          </div>
        </Card>

        {/* Review Queue */}
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-amber-300">
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
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-teal-300">
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

      {/* ── Mode Switcher Pills Bar ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC] flex items-center justify-center font-bold shrink-0">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-[#0B2447] uppercase tracking-wider">Exam Mode Switcher</h2>
            <p className="text-[11px] text-slate-500 font-medium">Filter management table by test delivery mode</p>
          </div>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl text-xs font-bold self-start sm:self-auto flex-wrap">
          <button
            suppressHydrationWarning
            onClick={() => setModeFilter('ALL')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
              modeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <span>All Modes</span>
            <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-[10px] text-slate-700 font-mono">
              {exams.length}
            </span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => setModeFilter('ONLINE')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
              modeFilter === 'ONLINE'
                ? 'bg-purple-600 text-white shadow-2xs font-extrabold'
                : 'text-purple-700 hover:bg-purple-50',
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Online CBT</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-md text-[10px] font-mono',
                modeFilter === 'ONLINE' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800',
              )}
            >
              {onlineCount}
            </span>
          </button>

          <button
            suppressHydrationWarning
            onClick={() => setModeFilter('OFFLINE')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
              modeFilter === 'OFFLINE'
                ? 'bg-[#0052CC] text-white shadow-2xs font-extrabold'
                : 'text-[#0052CC] hover:bg-blue-50',
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Offline OMR</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-md text-[10px] font-mono',
                modeFilter === 'OFFLINE' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800',
              )}
            >
              {offlineCount}
            </span>
          </button>

          {hybridCount > 0 && (
            <button
              suppressHydrationWarning
              onClick={() => setModeFilter('HYBRID')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                modeFilter === 'HYBRID'
                  ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                  : 'text-indigo-700 hover:bg-indigo-50',
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hybrid</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-md text-[10px] font-mono',
                  modeFilter === 'HYBRID' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-800',
                )}
              >
                {hybridCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Status & Batch Filter Bar ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Modern Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              suppressHydrationWarning
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer',
                activeTab === tab.key
                  ? 'bg-[#0052CC] text-white shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-[#0B2447] hover:bg-white/60',
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-md text-[10px] font-mono',
                  activeTab === tab.key
                    ? 'bg-blue-800 text-white'
                    : 'bg-slate-200 text-slate-700',
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Batch Filter & Search Bar */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {/* Batch Selector */}
          <select
            suppressHydrationWarning
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-[#0052CC] cursor-pointer shadow-2xs shrink-0 max-w-[180px]"
          >
            <option value="ALL">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1 lg:w-64 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 focus-within:border-[#0052CC] focus-within:ring-2 focus-within:ring-blue-100">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              suppressHydrationWarning
              placeholder="Search exams by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full font-medium"
            />
          </div>
        </div>
      </div>

      {/* Unified Responsive Exam List & Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile View (< 768px): Sleek Cards */}
        <div className="block md:hidden p-4 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 font-semibold text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#0052CC]" /> Loading exam schedules...
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-semibold text-xs space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">No exams found matching filter</p>
            </div>
          ) : (
            filteredExams.map((exam) => {
              const isDraft = exam.publishStatus === 'DRAFT';
              const isLive = exam.publishStatus === 'PUBLISHED';
              const isResultsLive = exam.publishStatus === 'RESULT_PUBLISHED';
              const isUnderReview =
                exam.publishStatus === 'UNDER_REVIEW' || exam.publishStatus === 'ADMIN_REVIEW';

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getModeBadge(exam.mode)}
                        <h3 className="font-extrabold text-[#0B2447] text-sm leading-snug">
                          {exam.title}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {exam.batchNames.map((bName, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] font-black text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                          >
                            <Layers className="w-2.5 h-2.5 text-[#0052CC]" />
                            {bName}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0">{getStatusBadge(exam.publishStatus)}</div>
                  </div>

                  {exam.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{exam.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-2 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-xl font-semibold">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Timing & Window</p>
                      <p className="text-xs font-bold text-[#0B2447] mt-0.5">
                        {getEffectiveDuration(exam)}m (+{exam.graceMinutes}m)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(exam.examWindowStart).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Marks</p>
                      <p className="text-xs font-bold text-[#0B2447] mt-0.5">{exam.totalMarks} Total</p>
                      <p className="text-[10px] text-slate-500">Passing: {exam.passingMarks}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div>{getQPStatusBadge(exam.mode, exam.questionPaperFileId)}</div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isDraft && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (exam.mode === 'OFFLINE' && !exam.questionPaperFileId) {
                                toast.error('Please upload Question Paper PDF before publishing!');
                                setUploadModalExam(exam);
                                return;
                              }
                              exam.allExamIds.forEach((id) => publishExamMutation.mutate(id));
                            }}
                            disabled={publishExamMutation.isPending}
                            className="h-8 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-black px-3 shadow-2xs cursor-pointer"
                          >
                            Publish
                          </Button>
                          {exam.mode !== 'ONLINE' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUploadModalExam(exam)}
                              className="h-8 rounded-xl text-xs font-extrabold gap-1 px-2.5 bg-amber-50 text-amber-800 border-amber-300"
                            >
                              <Upload className="w-3.5 h-3.5" /> QP
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setBulkImportExam(exam as any)}
                              className="h-8 rounded-xl text-xs font-extrabold gap-1 px-2.5 bg-purple-50 text-purple-800 border-purple-300"
                            >
                              <BookOpen className="w-3.5 h-3.5" /> Qs
                            </Button>
                          )}
                        </>
                      )}

                      {isLive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/exams/${exam.id}/live`)}
                          className="h-8 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 rounded-xl text-xs font-bold gap-1 px-2.5 cursor-pointer"
                        >
                          <Activity className="w-3.5 h-3.5" /> Monitor
                        </Button>
                      )}

                      {isUnderReview && (
                        <Button
                          size="sm"
                          onClick={() => setReviewModalExamId(exam.id)}
                          className="h-8 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black gap-1 px-2.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Review
                        </Button>
                      )}

                      {isResultsLive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/dashboard/exams/${exam.id}/analytics`)}
                          className="h-8 bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200 rounded-xl text-xs font-bold gap-1 px-2.5 cursor-pointer"
                        >
                          <BarChart3 className="w-3.5 h-3.5" /> Analytics
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditModalExam(exam)}
                        className="h-8 bg-blue-50 text-[#0052CC] border-blue-200 rounded-xl text-xs font-extrabold px-2.5 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteModalExam(exam)}
                        disabled={deleteExamMutation.isPending}
                        className="h-8 bg-rose-50 text-rose-700 border-rose-200 rounded-xl text-xs font-extrabold px-2.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View (>= 768px): HTML Table with overflow-x-auto & min-w-[1100px] */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[1100px]">
            <thead className="bg-slate-50/90 text-[#0B2447] uppercase font-black text-[11px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-4 px-6 min-w-[280px]">Exam Details</th>
                <th className="py-4 px-6 min-w-[260px]">Timing, Window & Marks</th>
                <th className="py-4 px-5 min-w-[200px]">Status & QP</th>
                <th className="py-4 px-6 min-w-[280px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 text-[#0052CC] animate-spin" />
                      <span>Loading exam schedules...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-400 font-semibold">
                    No exams found matching your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => {
                  const isDraft = exam.publishStatus === 'DRAFT';
                  const isLive = exam.publishStatus === 'PUBLISHED';
                  const isResultsLive = exam.publishStatus === 'RESULT_PUBLISHED';
                  const isUnderReview =
                    exam.publishStatus === 'UNDER_REVIEW' || exam.publishStatus === 'ADMIN_REVIEW';

                  return (
                    <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Exam Details */}
                      <td className="py-4 px-6 align-top">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getModeBadge(exam.mode)}
                            <span className="font-extrabold text-[#0B2447] text-sm leading-snug">
                              {exam.title}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {exam.batchNames.map((bName, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[10px] font-black text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 whitespace-nowrap"
                              >
                                <Layers className="w-3 h-3 text-[#0052CC]" />
                                {bName}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 font-medium">
                            {exam.description || 'No description provided'}
                          </p>
                        </div>
                      </td>

                      {/* Timing, Window & Marks (Combined Column) */}
                      <td className="py-4 px-6 align-top">
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-1.5 text-[#0B2447] font-extrabold text-xs whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                            <span>
                              {getEffectiveDuration(exam)}m (+{exam.graceMinutes}m grace)
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium whitespace-nowrap">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Window: {new Date(exam.examWindowStart).toLocaleDateString()}</span>
                          </div>
                          <div className="pt-0.5 flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 whitespace-nowrap">
                              <Award className="w-3 h-3 text-amber-600 shrink-0" />
                              {exam.totalMarks} Marks
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">
                              Pass: {exam.passingMarks} Marks
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status & QP */}
                      <td className="py-4 px-5 align-top">
                        <div className="flex flex-col items-start gap-1.5">
                          <div>{getStatusBadge(exam.publishStatus)}</div>
                          <div>{getQPStatusBadge(exam.mode, exam.questionPaperFileId)}</div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {isDraft && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (exam.mode === 'OFFLINE' && !exam.questionPaperFileId) {
                                    toast.error('Please upload Question Paper PDF before publishing offline exam!');
                                    setUploadModalExam(exam);
                                    return;
                                  }
                                  exam.allExamIds.forEach((id) => publishExamMutation.mutate(id));
                                }}
                                disabled={publishExamMutation.isPending}
                                className="h-8 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-2xs px-3 transition-all cursor-pointer whitespace-nowrap"
                              >
                                {publishExamMutation.isPending ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  'Publish Exam'
                                )}
                              </Button>

                              {exam.mode !== 'ONLINE' ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setUploadModalExam(exam)}
                                  className={cn(
                                    'h-8 rounded-xl text-xs font-extrabold gap-1 px-2.5 transition-all cursor-pointer shadow-2xs whitespace-nowrap',
                                    exam.questionPaperFileId
                                      ? 'bg-blue-50 text-[#0052CC] border-blue-200 hover:bg-blue-100'
                                      : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100',
                                  )}
                                  title={exam.questionPaperFileId ? 'Replace QP File' : 'Upload QP File'}
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  {exam.questionPaperFileId ? 'QP' : 'Upload QP'}
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setBulkImportExam(exam as any)}
                                  className="h-8 rounded-xl text-xs font-extrabold gap-1.5 px-3 transition-all cursor-pointer shadow-2xs bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100 whitespace-nowrap"
                                  title="Import Questions for Online CBT"
                                >
                                  <BookOpen className="w-3.5 h-3.5" />
                                  Import Qs
                                </Button>
                              )}
                            </>
                          )}

                          {isLive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/exams/${exam.id}/live`)}
                              className="h-8 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 rounded-xl text-xs font-bold gap-1 px-3 cursor-pointer whitespace-nowrap"
                            >
                              <Activity className="w-3.5 h-3.5" /> Live Monitor
                            </Button>
                          )}

                          {isUnderReview && (
                            <Button
                              size="sm"
                              onClick={() => setReviewModalExamId(exam.id)}
                              className="h-8 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-2xs gap-1 px-3 cursor-pointer whitespace-nowrap"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Review Queue
                            </Button>
                          )}

                          {isResultsLive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/exams/${exam.id}/analytics`)}
                              className="h-8 bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200 rounded-xl text-xs font-bold gap-1 px-3 cursor-pointer whitespace-nowrap"
                            >
                              <BarChart3 className="w-3.5 h-3.5" /> Analytics
                            </Button>
                          )}

                          {/* Icon-Only Edit Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditModalExam(exam)}
                            className="h-8 w-8 p-0 bg-blue-50 hover:bg-blue-100 text-[#0052CC] border border-blue-200 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center shrink-0"
                            title="Edit Exam Details"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[#0052CC]" />
                          </Button>

                          {/* Icon-Only Delete Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteModalExam(exam)}
                            disabled={deleteExamMutation.isPending}
                            className="h-8 w-8 p-0 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center justify-center shrink-0"
                            title="Delete Exam"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UploadFilesModal
        exam={uploadModalExam}
        isOpen={!!uploadModalExam}
        onClose={() => setUploadModalExam(null)}
      />

      {bulkImportExam && (
        <BulkImportModal
          examId={bulkImportExam.id}
          examTitle={bulkImportExam.title}
          isOpen={!!bulkImportExam}
          onClose={() => setBulkImportExam(null)}
          onSuccess={() => {
            refetch();
            setBulkImportExam(null);
          }}
        />
      )}

      <CreateExamModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      <EditExamModal
        exam={editModalExam}
        isOpen={!!editModalExam}
        onClose={() => setEditModalExam(null)}
      />

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
