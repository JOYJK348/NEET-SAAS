'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStartExam, useStudentExams } from '../../hooks/use-student-exams';
import type { StudentExamItem } from '../../types/student-exams';
import { Card } from '@/components/ui/card';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Calendar,
  Clock,
  Download,
  FileText,
  Play,
  ShieldAlert,
  Sparkles,
  X,
  CheckCircle2,
  FileCheck,
  Lock,
  Laptop,
  Layers,
  Filter,
  ChevronRight,
  Search,
  BookOpen,
  Monitor,
  LayoutGrid,
  List,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const formatExamDateTime = (dateStr?: string | null) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getEffectiveDuration = (exam: {
  durationMinutes?: number;
  examWindowStart?: string | Date;
  examWindowEnd?: string | Date;
  scheduledStartAt?: string | Date;
  scheduledEndAt?: string | Date;
}): number => {
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
};

export function StudentExamsDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'LIVE' | 'SUBMITTED' | 'RESULTS'>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'GRID' | 'TABLE'>('GRID');
  const [startingExam, setStartingExam] = useState<StudentExamItem | null>(null);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: response, isLoading } = useStudentExams();
  const startExamMutation = useStartExam();

  const rawExamList: StudentExamItem[] = Array.isArray(response)
    ? response
    : Array.isArray((response as any)?.data)
      ? (response as any).data
      : [];

  // 1. Deduplicate by unique exam ID
  const uniqueExamsMap = new Map<string, StudentExamItem>();
  rawExamList.forEach((exam) => {
    if (!uniqueExamsMap.has(exam.id)) {
      uniqueExamsMap.set(exam.id, exam);
    }
  });

  // 2. Deduplicate identical exam instances (same title, windowStart, durationMinutes)
  const deduplicatedExamsMap = new Map<string, StudentExamItem>();
  Array.from(uniqueExamsMap.values()).forEach((exam) => {
    const key = `${exam.title.trim().toLowerCase()}-${exam.examWindowStart || ''}-${getEffectiveDuration(exam)}`;
    if (!deduplicatedExamsMap.has(key)) {
      deduplicatedExamsMap.set(key, exam);
    } else {
      const existing = deduplicatedExamsMap.get(key)!;
      if (!existing.submission && exam.submission) {
        deduplicatedExamsMap.set(key, exam);
      } else if (
        existing.submission &&
        exam.submission &&
        (exam.submission.submittedAt || exam.submission.startedAt) &&
        !existing.submission.submittedAt
      ) {
        deduplicatedExamsMap.set(key, exam);
      }
    }
  });

  const examList: StudentExamItem[] = Array.from(deduplicatedExamsMap.values());

  const checkIsOnlineMode = (e: StudentExamItem): boolean => {
    const m = (e.mode || (e as any).examMode || '').toString().trim().toUpperCase();
    if (m === 'ONLINE' || m === 'CBT' || m === 'ONLINE_CBT') {
      return true;
    }
    if (m === 'OFFLINE' || m === 'OMR') {
      return false;
    }
    const textToTest = `${e.title || ''} ${e.description || ''}`.toLowerCase();
    if (textToTest.includes('online') || textToTest.includes('cbt')) {
      return true;
    }
    return false;
  };

  const isResultPub = (e: StudentExamItem) =>
    e.studentExamStatus === 'RESULT_PUBLISHED' ||
    e.publishStatus === 'RESULT_PUBLISHED' ||
    !!e.submission?.isResultsPublished ||
    e.submission?.evaluationStatus === 'PUBLISHED' ||
    e.submission?.evaluationStatus === 'COMPLETED' ||
    (checkIsOnlineMode(e) && (
      !!e.submission?.submittedAt ||
      e.submission?.status === 'SUBMITTED' ||
      e.submission?.status === 'COMPLETED'
    ));

  const isSubmitted = (e: StudentExamItem) => {
    if (isResultPub(e)) return false;
    if (!!e.submission?.submittedAt) return true;
    if (
      e.submission?.status === 'SUBMITTED' ||
      e.submission?.status === 'LATE' ||
      e.submission?.status === 'COMPLETED'
    )
      return true;
    if (
      e.submission?.evaluationStatus === 'UNDER_EVALUATION' ||
      e.submission?.evaluationStatus === 'APPROVED'
    )
      return true;
    return false;
  };

  const getStartMs = (e: StudentExamItem) => {
    const d = new Date(e.examWindowStart || 0);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const getEndMs = (e: StudentExamItem) => {
    const d = new Date(e.examWindowEnd || 0);
    if (isNaN(d.getTime())) return 0;
    const graceMs = (e.graceMinutes ?? 15) * 60 * 1000;
    return d.getTime() + graceMs;
  };

  const isExamUpcoming = (e: StudentExamItem) => {
    if (isResultPub(e) || isSubmitted(e)) return false;
    const startMs = getStartMs(e);
    if (startMs > 0 && nowMs < startMs) return true;
    if (e.studentExamStatus === 'SCHEDULED' || e.studentExamStatus === 'UPCOMING') {
      return startMs > 0 ? nowMs < startMs : true;
    }
    return false;
  };

  const isExamLive = (e: StudentExamItem) => {
    if (isResultPub(e) || isSubmitted(e) || isExamUpcoming(e)) return false;
    if (e.isSubmissionLocked) return false;
    const startMs = getStartMs(e);
    const endMs = getEndMs(e);

    if (startMs > 0 && endMs > 0) {
      if (nowMs >= startMs && nowMs <= endMs) return true;
    }

    if (e.studentExamStatus === 'LIVE' || e.canStart) return true;
    return false;
  };

  const isHistory = (e: StudentExamItem) => {
    if (isResultPub(e)) return false;
    if (isSubmitted(e)) return true;
    const endMs = getEndMs(e);
    if (endMs > 0 && nowMs > endMs) return true;
    if (e.isSubmissionLocked || e.studentExamStatus === 'LOCKED' || e.studentExamStatus === 'EXPIRED')
      return true;
    return false;
  };

  const onlineCount = examList.filter((e) => checkIsOnlineMode(e)).length;
  const offlineCount = examList.filter((e) => !checkIsOnlineMode(e)).length;

  const liveCount = examList.filter((e) => isExamLive(e)).length;
  const upcomingCount = examList.filter((e) => isExamUpcoming(e)).length;
  const resultsCount = examList.filter((e) => isResultPub(e)).length;

  const filteredExams = examList.filter((exam) => {
    const matchesSearch =
      !searchQuery ||
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const isOnline = checkIsOnlineMode(exam);
    if (modeFilter === 'ONLINE' && !isOnline) return false;
    if (modeFilter === 'OFFLINE' && isOnline) return false;

    if (activeTab === 'ALL') return matchesSearch;
    if (activeTab === 'RESULTS') return matchesSearch && isResultPub(exam);
    if (activeTab === 'SUBMITTED') return matchesSearch && isHistory(exam);
    if (activeTab === 'LIVE') return matchesSearch && isExamLive(exam);
    if (activeTab === 'UPCOMING') return matchesSearch && isExamUpcoming(exam);
    return matchesSearch;
  });

  const handleConfirmStart = () => {
    if (!startingExam) return;
    startExamMutation.mutate(startingExam.id, {
      onSuccess: () => {
        setStartingExam(null);
      },
    });
  };

  return (
    <div suppressHydrationWarning className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-20">
      {/* ── Header Banner — ISML LMS Light Blue Style ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <Link href="/dashboard/student" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5 text-[#0052CC]" />
              Student Portal
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>NEET Mock & Test Series</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447] flex items-center gap-2 flex-wrap">
            <span>Student Exam Portal</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#0052CC] border border-blue-200 uppercase tracking-wider">
              NEET Mock & Test Series 🎓
            </span>
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Online CBT & Offline OMR Examinations Dashboard — View Schedule, Start Timers & Scorecards
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard/student')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 shadow-2xs transition shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#0052CC]" />
          <span>Overview</span>
        </button>
      </div>

      {/* ── KPI Summary Stats Cards Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-blue-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Total Exams
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5">
                {examList.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-rose-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Live & Active
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-rose-700 mt-0.5">
                {liveCount}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-indigo-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Upcoming Exams
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-indigo-700 mt-0.5">
                {upcomingCount}
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-teal-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-teal-200 bg-teal-50 text-teal-600 shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Results & Rank
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-teal-700 mt-0.5">
                {resultsCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Mode Switcher Pills & Search Bar ── */}
      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC] flex items-center justify-center font-bold shrink-0">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-[#0B2447] uppercase tracking-wider">Delivery Mode Switcher</h2>
            <p className="text-[11px] text-slate-500 font-medium">Filter test series by examination mode</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search exam title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC] transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
            <button
              type="button"
              onClick={() => setModeFilter('ALL')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5',
                modeFilter === 'ALL'
                  ? 'bg-[#0052CC] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <span>All Modes</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                {examList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setModeFilter('ONLINE')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5',
                modeFilter === 'ONLINE'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'text-purple-700 hover:text-purple-900',
              )}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Online CBT</span>
              <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-900 text-[10px]">
                {onlineCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setModeFilter('OFFLINE')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5',
                modeFilter === 'OFFLINE'
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'text-indigo-700 hover:text-indigo-900',
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Offline OMR</span>
              <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-900 text-[10px]">
                {offlineCount}
              </span>
            </button>
          </div>

          {/* Desktop Layout Switcher (Grid vs Table) */}
          <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl shrink-0">
            <button
              onClick={() => setViewLayout('GRID')}
              className={cn(
                'p-1.5 rounded-lg transition cursor-pointer',
                viewLayout === 'GRID' ? 'bg-white text-[#0052CC] shadow-2xs' : 'text-slate-400 hover:text-slate-600',
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewLayout('TABLE')}
              className={cn(
                'p-1.5 rounded-lg transition cursor-pointer',
                viewLayout === 'TABLE' ? 'bg-white text-[#0052CC] shadow-2xs' : 'text-slate-400 hover:text-slate-600',
              )}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Status Filter Tabs ── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/60 rounded-2xl text-xs font-extrabold overflow-x-auto scrollbar-none">
        {[
          { key: 'ALL', label: 'All Exams', count: examList.length },
          { key: 'LIVE', label: 'Live & Active', count: liveCount },
          { key: 'UPCOMING', label: 'Upcoming Exams', count: upcomingCount },
          { key: 'RESULTS', label: 'Results & Rank', count: resultsCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              'flex-1 min-w-[120px] sm:min-w-[140px] py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-center truncate',
              activeTab === tab.key
                ? 'bg-white text-[#0B2447] shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <span className="truncate">{tab.label}</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-black shrink-0',
                activeTab === tab.key
                  ? 'bg-[#0052CC] text-white'
                  : 'bg-slate-200 text-slate-600',
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Main View Content (Grid vs Table) ── */}
      {viewLayout === 'TABLE' ? (
        /* Desktop Table View */
        <Card className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC]">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider">
                  Student Examination Schedule
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {filteredExams.length} Exams available in this view
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[#0B2447] uppercase font-extrabold text-[10px] border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Exam Details</th>
                  <th className="py-3.5 px-5">Schedule Window</th>
                  <th className="py-3.5 px-5">Duration & Marks</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                      Loading your exams...
                    </td>
                  </tr>
                ) : filteredExams.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-semibold">
                      No exams found matching selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredExams.map((exam) => {
                    const isStarted = !!exam.submission?.startedAt;
                    const isSubmittedCard = !!exam.submission?.submittedAt || exam.submission?.status === 'SUBMITTED';
                    const isOnlineMode = checkIsOnlineMode(exam);

                    const windowEndMs = exam.examWindowEnd ? new Date(exam.examWindowEnd).getTime() : null;
                    const windowGraceEndMs = windowEndMs ? windowEndMs + (exam.graceMinutes || 0) * 60 * 1000 : null;
                    const isWindowExpired = windowGraceEndMs !== null && !isNaN(windowGraceEndMs) && nowMs > windowGraceEndMs;
                    const isLockedOrExpired = exam.isSubmissionLocked || isWindowExpired;

                    return (
                      <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-[#0B2447] text-sm">{exam.title}</span>
                            {isOnlineMode ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 border border-purple-300 text-purple-800 text-[11px] font-black shadow-2xs">
                                💻 ONLINE CBT
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 border border-indigo-300 text-indigo-800 text-[11px] font-black shadow-2xs">
                                📝 OFFLINE OMR
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-1">
                            {exam.description || 'Standard NEET Mock Test Series.'}
                          </p>
                        </td>

                        <td className="py-4 px-5 font-mono text-[11px] text-slate-600">
                          <p className="font-bold text-slate-800">{formatExamDateTime(exam.examWindowStart)}</p>
                          <p className="text-slate-400 text-[10px]">To: {formatExamDateTime(exam.examWindowEnd)}</p>
                        </td>

                        <td className="py-4 px-5 font-extrabold text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-[#0052CC] px-2.5 py-0.5 rounded-md text-xs">
                              <Award className="w-3.5 h-3.5 text-[#0052CC]" />
                              {exam.totalMarks} pts
                            </span>
                            <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {getEffectiveDuration(exam)}m
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-extrabold inline-block shadow-2xs',
                              isSubmittedCard || isResultPub(exam)
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isLockedOrExpired
                                  ? 'bg-slate-100 text-slate-500 border border-slate-300'
                                  : exam.studentExamStatus === 'LIVE'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-blue-50 text-[#0052CC] border border-blue-200',
                            )}
                          >
                            {isSubmittedCard || isResultPub(exam)
                              ? 'SUBMITTED'
                              : isLockedOrExpired
                                ? 'EXPIRED'
                                : exam.studentExamStatus}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right">
                          {isOnlineMode && (isSubmittedCard || isResultPub(exam)) ? (
                            <Link
                              href={`/dashboard/student/exams/${exam.id}`}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5 text-white" /> Scorecard & Solutions 🎓
                            </Link>
                          ) : !isOnlineMode && isResultPub(exam) ? (
                            <Link
                              href={`/dashboard/student/exams/${exam.id}`}
                              className="px-3.5 py-1.5 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5 text-white" /> View Scorecard 🏆
                            </Link>
                          ) : isStarted ? (
                            <Link
                              href={`/dashboard/student/exams/${exam.id}`}
                              className="px-3.5 py-1.5 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              Enter Exam Room <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <button
                              onClick={() => setStartingExam(exam)}
                              disabled={!exam.canStart && exam.studentExamStatus !== 'LIVE'}
                              className="px-3.5 py-1.5 bg-[#0052CC] hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-black shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-white text-white" />
                              Ready to Start 🚀
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Mobile Cards & Responsive Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-slate-500 text-xs font-bold">Loading your exams...</span>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs space-y-2 p-6">
              <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-black text-[#0B2447]">No exams found in this category</p>
              <p className="text-xs text-slate-400 font-medium">
                Try switching the Mode Filter (Online CBT / Offline OMR) or status tabs.
              </p>
            </div>
          ) : (
            filteredExams.map((exam) => {
              const isStarted = !!exam.submission?.startedAt;
              const isSubmittedCard = !!exam.submission?.submittedAt || exam.submission?.status === 'SUBMITTED';
              const isOnlineMode = checkIsOnlineMode(exam);

              let cardTimer: { label: string; style: string } | null = null;
              let isTimerExpired = false;

              const windowEndMs = exam.examWindowEnd ? new Date(exam.examWindowEnd).getTime() : null;
              const windowGraceEndMs = windowEndMs ? windowEndMs + (exam.graceMinutes || 0) * 60 * 1000 : null;
              const isWindowExpired = windowGraceEndMs !== null && !isNaN(windowGraceEndMs) && nowMs > windowGraceEndMs;

              if (isStarted && !isSubmittedCard && exam.submission?.startedAt) {
                const startedAtMs = new Date(exam.submission.startedAt).getTime();

                let calculatedEndMs = exam.submission.calculatedEndAt
                  ? new Date(exam.submission.calculatedEndAt).getTime()
                  : startedAtMs + getEffectiveDuration(exam) * 60 * 1000;

                if (windowEndMs && calculatedEndMs > windowEndMs) {
                  calculatedEndMs = windowEndMs;
                }

                const graceEndMs = exam.submission.graceEndAt
                  ? new Date(exam.submission.graceEndAt).getTime()
                  : calculatedEndMs + (exam.graceMinutes || 0) * 60 * 1000;

                if (nowMs < calculatedEndMs) {
                  const remSec = Math.max(0, Math.floor((calculatedEndMs - nowMs) / 1000));
                  const m = Math.floor(remSec / 60);
                  const s = remSec % 60;
                  cardTimer = {
                    label: `⏳ ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
                    style: 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse',
                  };
                } else if (nowMs < graceEndMs) {
                  const remSec = Math.max(0, Math.floor((graceEndMs - nowMs) / 1000));
                  const m = Math.floor(remSec / 60);
                  const s = remSec % 60;
                  cardTimer = {
                    label: `Grace: ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
                    style: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
                  };
                } else {
                  cardTimer = {
                    label: 'Time Expired',
                    style: 'bg-rose-50 text-rose-700 border-rose-200',
                  };
                  isTimerExpired = true;
                }
              } else if (isWindowExpired && !isSubmittedCard) {
                cardTimer = {
                  label: 'Time Expired',
                  style: 'bg-rose-50 text-rose-700 border-rose-200',
                };
              }

              const isLockedOrExpired = exam.isSubmissionLocked || isTimerExpired || isWindowExpired;

              return (
                <div
                  key={exam.id}
                  className="border-l-4 border-l-[#0052CC] bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 w-full"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Mode Badge Pill */}
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border shadow-2xs',
                            isOnlineMode
                              ? 'bg-purple-100 border-purple-300 text-purple-800'
                              : 'bg-indigo-100 border-indigo-300 text-indigo-800',
                          )}
                        >
                          {isOnlineMode ? <Laptop className="w-3 h-3 text-purple-700" /> : <FileText className="w-3 h-3 text-indigo-700" />}
                          {isOnlineMode ? 'Online CBT' : 'Offline OMR'}
                        </span>

                        {/* Status Badge Pill */}
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs',
                            isSubmittedCard || isResultPub(exam)
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isLockedOrExpired
                                ? 'bg-slate-100 text-slate-500 border border-slate-300'
                                : exam.studentExamStatus === 'LIVE'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-blue-50 text-[#0052CC] border border-blue-200',
                          )}
                        >
                          {isSubmittedCard || isResultPub(exam)
                            ? 'SUBMITTED'
                            : isLockedOrExpired
                              ? 'EXPIRED / CLOSED'
                              : exam.studentExamStatus}
                        </span>
                      </div>

                      {cardTimer ? (
                        <span
                          className={cn(
                            'text-xs flex items-center gap-1 font-mono font-black px-2 py-0.5 rounded-md border',
                            cardTimer.style,
                          )}
                        >
                          {cardTimer.label}
                        </span>
                      ) : (
                        <span className="text-xs text-[#0052CC] flex items-center gap-1 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
                          {getEffectiveDuration(exam)} mins
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-black text-[#0B2447] leading-snug">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">
                        {exam.description || 'Standard NEET Academy Mock Test Series.'}
                      </p>
                    </div>

                    {/* Window Details Box */}
                    <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100/90 space-y-1.5 text-xs text-slate-700 font-medium">
                      <div className="flex items-center justify-between text-slate-500 gap-2">
                        <span className="shrink-0 font-semibold text-slate-600">Window Start:</span>
                        <span className="font-bold text-[#0B2447] font-mono text-right truncate">
                          {formatExamDateTime(exam.examWindowStart)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 gap-2">
                        <span className="shrink-0 font-semibold text-slate-600">Window End:</span>
                        <span className="font-bold text-[#0B2447] font-mono text-right truncate">
                          {formatExamDateTime(exam.examWindowEnd)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-blue-100">
                        <span className="font-semibold text-slate-600">Grace Period:</span>
                        <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          +{exam.graceMinutes} mins
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Controls */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {isOnlineMode && (isSubmittedCard || isResultPub(exam)) ? (
                      <Link
                        href={`/dashboard/student/exams/${exam.id}`}
                        className="w-full text-center px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Award className="w-4 h-4 text-white" /> View Scorecard & Solutions 🎓
                      </Link>
                    ) : !isOnlineMode && isSubmittedCard ? (
                      <button
                        disabled
                        className="w-full text-center px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                      >
                        <FileText className="w-4 h-4 text-slate-400" /> Submitted (OMR Sheet Under Evaluation)
                      </button>
                    ) : !isOnlineMode && isResultPub(exam) ? (
                      <Link
                        href={`/dashboard/student/exams/${exam.id}`}
                        className="w-full text-center px-4 py-2.5 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Award className="w-4 h-4 text-white" /> View Scorecard & Rank 🏆
                      </Link>
                    ) : isLockedOrExpired ? (
                      <button
                        disabled
                        className="w-full text-center px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-xs font-extrabold shadow-2xs flex items-center justify-center gap-2 cursor-not-allowed opacity-70"
                      >
                        <Lock className="w-4 h-4 text-slate-400" /> Time Expired (Exam Closed)
                      </button>
                    ) : isStarted ? (
                      <Link
                        href={`/dashboard/student/exams/${exam.id}`}
                        className="w-full text-center px-4 py-2.5 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Enter Exam Room <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => setStartingExam(exam)}
                        disabled={!exam.canStart && exam.studentExamStatus !== 'LIVE'}
                        className="w-full px-4 py-2.5 bg-[#0052CC] hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-black shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white text-white" />
                        Ready to Start Exam 🚀
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Ready to Start Confirmation Modal */}
      {startingExam && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 text-slate-800 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#0B2447] flex items-center gap-2">
                <Play className="w-4.5 h-4.5 text-[#0052CC] fill-[#0052CC]" />
                Start Exam Confirmation
              </h3>
              <button
                onClick={() => setStartingExam(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 font-medium">
              <p className="text-slate-800">
                You are about to start{' '}
                <strong className="text-[#0B2447] font-black">{startingExam.title}</strong>.
              </p>
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-[#0B2447] space-y-1.5">
                <p className="font-black flex items-center gap-1.5 text-[#0052CC]">
                  <ShieldAlert className="w-4 h-4 text-[#0052CC]" /> Important Exam Rules:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] font-semibold text-slate-700">
                  <li>
                    Your <strong>{getEffectiveDuration(startingExam)}-minute timer</strong> will begin
                    immediately upon confirmation.
                  </li>
                  <li>
                    Timer <strong>cannot be paused or reset</strong> by refreshing or navigating
                    away.
                  </li>
                  <li>Question Paper & OMR sheet will unlock right after starting.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setStartingExam(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-extrabold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStart}
                disabled={startExamMutation.isPending}
                className="px-5 py-2 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-2xs transition flex items-center gap-2 cursor-pointer"
              >
                {startExamMutation.isPending ? 'Starting...' : 'I am Ready — Start Now 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
