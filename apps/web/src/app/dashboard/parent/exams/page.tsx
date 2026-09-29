'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type {
  ParentExamsData,
  CompletedExamItem,
} from '@/features/parent-portal/types/parent-portal';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  FileText,
  Calendar,
  Award,
  CheckCircle,
  Target,
  FileSpreadsheet,
  Atom,
  FlaskConical,
  Sprout,
  Dna,
  BookOpen,
  MessageSquare,
  Clock,
  Sparkles,
  TrendingUp,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Search,
  Filter,
  PieChart as PieChartIcon,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { formatDate } from '@/features/students/utils/student-utils';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DonutChart, DonutSegment } from '@/features/parent-portal/components/charts/DonutChart';
import { TrendLineChart, TrendDataPoint } from '@/features/parent-portal/components/charts/TrendLineChart';
import { SubjectBarChart, SubjectScoreItem } from '@/features/parent-portal/components/charts/SubjectBarChart';
import { ScoreGaugeMeter } from '@/features/parent-portal/components/charts/ScoreGaugeMeter';

export default function ParentExamsPage() {
  const { selectedChildId, selectedChild, isLoading: isSwitcherLoading } = useChildSwitcher();
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'COMPLETED' | 'UPCOMING'>('ALL');
  const [chartViewTab, setChartViewTab] = useState<'ALL_CHARTS' | 'MARKS_PIE' | 'PROGRESSION'>('ALL_CHARTS');
  const queryClient = useQueryClient();

  const { data, isLoading: isExamsLoading, refetch } = useQuery<ParentExamsData>({
    queryKey: ['parent', 'exams', selectedChildId || 'default'],
    queryFn: () => parentPortalService.getExams(selectedChildId || 'default'),
    enabled: true,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const prefetchExamResult = (examId: string) => {
    if (!selectedChildId || !examId) return;
    queryClient.prefetchQuery({
      queryKey: ['parent', 'examResult', selectedChildId, examId],
      queryFn: () => parentPortalService.getExamResult(selectedChildId, examId),
      staleTime: 10 * 60 * 1000,
    });
  };

  const isLoading = (isExamsLoading && !data) || isSwitcherLoading;

  const upcoming = data?.upcoming || [];
  const completed = data?.completed || [];

  // Automatic background prefetch for all completed exams once data is loaded
  useEffect(() => {
    if (selectedChildId && completed && completed.length > 0) {
      completed.forEach((exam) => {
        prefetchExamResult(exam.id);
      });
    }
  }, [selectedChildId, completed]);

  const activeExam: CompletedExamItem | null =
    completed.find((e) => e.id === selectedExamId) || completed[0] || null;

  const activeSubjectBreakdown: Array<{
    subject: string;
    obtained: number;
    total: number;
    percentage: number;
    isActive?: boolean;
    inactiveMessage?: string | null;
  }> = activeExam?.subjectBreakdown || [];

  // Summary Metrics Calculation
  const avgPercentage =
    completed.length > 0
      ? Math.round(completed.reduce((acc, c) => acc + (c.percentage || 0), 0) / completed.length)
      : 0;

  const topRank = completed.length > 0 ? Math.min(...completed.map((c) => c.rank || 999)) : 0;

  const filteredCompleted = completed.filter(
    (e) => !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredUpcoming = upcoming.filter(
    (e) => !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // 1. Donut Segments for active exam (Marks breakdown across subjects)
  const donutSegments: DonutSegment[] = useMemo(() => {
    if (!activeSubjectBreakdown || activeSubjectBreakdown.length === 0) return [];
    const colors: Record<string, string> = {
      physics: '#0052CC',
      chemistry: '#10B981',
      botany: '#F59E0B',
      zoology: '#8B5CF6',
      biology: '#EC4899',
    };
    return activeSubjectBreakdown.map((sb) => {
      const s = sb.subject.toLowerCase();
      let color = '#64748B';
      for (const [k, c] of Object.entries(colors)) {
        if (s.includes(k)) {
          color = c;
          break;
        }
      }
      return {
        label: sb.subject,
        value: sb.obtained > 0 ? sb.obtained : 1,
        color,
        subtext: `${sb.obtained}/${sb.total} Marks (${sb.percentage}%)`,
      };
    });
  }, [activeSubjectBreakdown]);

  // 2. Trend Data across all completed exams (chronological progression)
  const examTrendData: TrendDataPoint[] = useMemo(() => {
    if (!completed || completed.length === 0) return [];
    const sorted = [...completed].sort(
      (a, b) => new Date(a.evaluatedAt || 0).getTime() - new Date(b.evaluatedAt || 0).getTime(),
    );
    return sorted.map((e) => ({
      label: e.title.length > 18 ? e.title.substring(0, 18) + '...' : e.title,
      score: e.percentage,
      marks: e.totalScore,
      maxMarks: e.totalPossible,
      date: e.evaluatedAt ? formatDate(e.evaluatedAt) : undefined,
    }));
  }, [completed]);

  // 3. Subject Bar Chart data for active exam
  const subjectBarData: SubjectScoreItem[] = useMemo(() => {
    if (!activeSubjectBreakdown || activeSubjectBreakdown.length === 0) return [];
    return activeSubjectBreakdown.map((sb) => ({
      subject: sb.subject,
      percentage: sb.percentage,
      obtained: sb.obtained,
      total: sb.total,
      targetBenchmark: 80,
    }));
  }, [activeSubjectBreakdown]);

  const getSubjectTheme = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('physic')) {
      return {
        icon: <Atom className="h-5 w-5 text-indigo-600" />,
        bg: 'bg-indigo-50/70',
        border: 'border-indigo-200/80',
        bar: 'bg-indigo-600',
        text: 'text-indigo-700',
      };
    }
    if (s.includes('chem')) {
      return {
        icon: <FlaskConical className="h-5 w-5 text-emerald-600" />,
        bg: 'bg-emerald-50/70',
        border: 'border-emerald-200/80',
        bar: 'bg-emerald-600',
        text: 'text-emerald-700',
      };
    }
    if (s.includes('botan')) {
      return {
        icon: <Sprout className="h-5 w-5 text-green-600" />,
        bg: 'bg-green-50/70',
        border: 'border-green-200/80',
        bar: 'bg-green-600',
        text: 'text-green-700',
      };
    }
    if (s.includes('zoo') || s.includes('bio')) {
      return {
        icon: <Dna className="h-5 w-5 text-purple-600" />,
        bg: 'bg-purple-50/70',
        border: 'border-purple-200/80',
        bar: 'bg-purple-600',
        text: 'text-purple-700',
      };
    }
    return {
      icon: <BookOpen className="h-5 w-5 text-blue-600" />,
      bg: 'bg-blue-50/70',
      border: 'border-blue-200/80',
      bar: 'bg-blue-600',
      text: 'text-blue-700',
    };
  };

  const getSubjectBadge = (pct: number) => {
    if (pct >= 85)
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          High Mastery 🌟
        </span>
      );
    if (pct >= 75)
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
          Good Progress 👍
        </span>
      );
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
        Practice Needed 🎯
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#F8FAFC]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-24">
      {/* ── Header Banner ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-3xl shadow-2xs space-y-3 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Parent Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Examinations & Visual Score Profiles</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447] flex items-center gap-2 flex-wrap">
            <span>Examinations & Visual Analytics</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#0052CC] border border-blue-200 uppercase tracking-wider">
              Score Intelligence 🎓
            </span>
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Visual charts, subject mark shares, NEET projection gauges, and test progression for{' '}
            <strong className="text-[#0B2447] font-bold">
              {selectedChild?.name || 'Student'}
            </strong>
          </p>
        </div>

        <button
          suppressHydrationWarning
          onClick={() => refetch()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-[#0052CC] hover:bg-slate-50 shadow-2xs transition shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-[#0052CC]" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ── Top KPI Stats Cards Row (4 Cards) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-blue-300 flex items-center gap-3.5">
          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Average Score
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5 font-mono">
              {avgPercentage}%
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-amber-300 flex items-center gap-3.5">
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Top Rank Achieved
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-0.5 font-mono">
              {topRank > 0 && topRank < 999 ? `#${topRank}` : 'N/A'}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-emerald-300 flex items-center gap-3.5">
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Evaluated Tests
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-0.5 font-mono">
              {completed.length}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-indigo-300 flex items-center gap-3.5">
          <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-600 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Upcoming Exams
            </p>
            <p className="text-xl sm:text-2xl font-extrabold text-indigo-700 mt-0.5 font-mono">
              {upcoming.length}
            </p>
          </div>
        </Card>
      </div>

      {/* ── Visual Performance Analytics Section ── */}
      {completed.length > 0 && (
        <Card className="rounded-3xl border border-blue-200 bg-white p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
                  <PieChartIcon className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#0B2447] tracking-tight">
                    Visual Score & Concept Analytics
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Pie charts, score trends, and subject benchmarks for in-depth parental insight
                  </p>
                </div>
              </div>
            </div>

            {/* Visual View Mode Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl self-start md:self-auto overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setChartViewTab('ALL_CHARTS')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
                  chartViewTab === 'ALL_CHARTS'
                    ? 'bg-[#0052CC] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>All Visuals</span>
              </button>

              <button
                type="button"
                onClick={() => setChartViewTab('MARKS_PIE')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
                  chartViewTab === 'MARKS_PIE'
                    ? 'bg-[#0052CC] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span>Marks Pie Distribution</span>
              </button>

              <button
                type="button"
                onClick={() => setChartViewTab('PROGRESSION')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
                  chartViewTab === 'PROGRESSION'
                    ? 'bg-[#0052CC] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Score Trajectory</span>
              </button>
            </div>
          </div>

          {/* Quick Exam Selector for Visual Charts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-[#0B2447] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#0052CC]" /> Select Exam for Visual Breakdown:
              </span>
              {activeExam && (
                <span className="text-[11px] font-bold text-slate-500">
                  Showing: <strong className="text-[#0052CC]">{activeExam.title}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {completed.map((exam) => {
                const isSelected = (selectedExamId || activeExam?.id) === exam.id;
                return (
                  <button
                    key={exam.id}
                    type="button"
                    onClick={() => setSelectedExamId(exam.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer text-left',
                      isSelected
                        ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-2xs font-extrabold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-white',
                    )}
                  >
                    <FileSpreadsheet
                      className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-[#0052CC]'}`}
                    />
                    <div className="truncate max-w-[160px]">
                      <p className="truncate font-extrabold">{exam.title}</p>
                      <p
                        className={`text-[10px] font-mono ${
                          isSelected ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {exam.totalScore}/{exam.totalPossible} ({exam.percentage}%)
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── ALL CHARTS OR PIE VIEW ── */}
          {(chartViewTab === 'ALL_CHARTS' || chartViewTab === 'MARKS_PIE') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              {/* Donut Chart: Subject Marks Contribution */}
              <div className="lg:col-span-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-between">
                <div className="w-full text-center pb-2 border-b border-slate-200/60">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2447] flex items-center justify-center gap-1.5">
                    <PieChartIcon className="w-4 h-4 text-[#0052CC]" />
                    Subject Marks Share
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Proportion of marks obtained across subjects in {activeExam?.title || 'this test'}
                  </p>
                </div>

                <div className="my-4 w-full flex justify-center">
                  <DonutChart
                    data={donutSegments}
                    size={220}
                    strokeWidth={26}
                    centerTitle={activeExam ? `${activeExam.percentage}%` : '100%'}
                    centerSubtitle={activeExam ? `${activeExam.totalScore}/${activeExam.totalPossible}` : 'Score'}
                  />
                </div>

                <div className="w-full text-center text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-200/60">
                  💡 Hover on each slice to inspect individual subject marks contribution
                </div>
              </div>

              {/* Score Gauge Meter: NEET Readiness & Projected Cut-off */}
              <div className="lg:col-span-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div className="w-full text-center pb-2 border-b border-slate-200/60">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2447] flex items-center justify-center gap-1.5">
                    <Target className="w-4 h-4 text-[#0052CC]" />
                    Score vs Govt MBBS Cut-Off
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Scaled against NEET target benchmark
                  </p>
                </div>

                <div className="my-2 flex justify-center">
                  <ScoreGaugeMeter
                    score={activeExam?.totalScore || 0}
                    maxScore={activeExam?.totalPossible || 720}
                    targetScore={Math.round((activeExam?.totalPossible || 720) * 0.833)}
                    rank={activeExam?.rank}
                    label="Test Standing"
                    className="border-none shadow-none bg-transparent p-0"
                  />
                </div>

                <div className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-center text-xs font-bold text-slate-700">
                  {activeExam && activeExam.percentage >= 80 ? (
                    <span className="text-emerald-700 flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> High Qualification Probability
                    </span>
                  ) : activeExam && activeExam.percentage >= 60 ? (
                    <span className="text-blue-700 flex items-center justify-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Competitive Trajectory - Maintain Focus
                    </span>
                  ) : (
                    <span className="text-amber-700 flex items-center justify-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> Targeted Revision Recommended
                    </span>
                  )}
                </div>
              </div>

              {/* Subject Benchmark Bar Comparison */}
              <div className="lg:col-span-3 bg-slate-50/70 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div className="w-full pb-2 border-b border-slate-200/60">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2447] flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-[#0052CC]" />
                    Subject Benchmarks
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Target: 80% Benchmark
                  </p>
                </div>

                <div className="my-2 space-y-3">
                  {subjectBarData.map((item) => {
                    const isAbove = item.percentage >= (item.targetBenchmark || 80);
                    return (
                      <div key={item.subject} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-700 truncate max-w-[100px]">
                            {item.subject}
                          </span>
                          <span className="font-mono font-black text-[#0B2447]">
                            {item.percentage}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-700',
                              isAbove ? 'bg-emerald-500' : 'bg-blue-600',
                            )}
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 text-center font-medium">
                  {activeExam?.title}
                </div>
              </div>
            </div>
          )}

          {/* ── ALL CHARTS OR PROGRESSION VIEW ── */}
          {(chartViewTab === 'ALL_CHARTS' || chartViewTab === 'PROGRESSION') && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2447] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#0052CC]" />
                    Historical Score Trajectory (All Completed Tests)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Visual curve showing student performance progression across consecutive examinations
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {completed.length} Tests Recorded
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200">
                <TrendLineChart
                  data={examTrendData}
                  height={220}
                  showAverageLine={true}
                  isChronological={true}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Search Bar & Filter Control Bar ── */}
      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC] flex items-center justify-center font-bold shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black text-[#0B2447] uppercase tracking-wider">Exam Category Filters</h2>
            <p className="text-[11px] text-slate-500 font-medium">Search and filter student exam records</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              suppressHydrationWarning
              placeholder="Search exam title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC] transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setActiveTab('ALL')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5',
                activeTab === 'ALL'
                  ? 'bg-[#0052CC] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <span>All ({completed.length + upcoming.length})</span>
            </button>

            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setActiveTab('COMPLETED')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5',
                activeTab === 'COMPLETED'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-emerald-700 hover:text-emerald-900',
              )}
            >
              <span>Evaluated ({completed.length})</span>
            </button>

            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setActiveTab('UPCOMING')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5',
                activeTab === 'UPCOMING'
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'text-indigo-700 hover:text-indigo-900',
              )}
            >
              <span>Upcoming ({upcoming.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Evaluated Exams List ── */}
      {(activeTab === 'ALL' || activeTab === 'COMPLETED') && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            Completed & Evaluated Exams History ({filteredCompleted.length})
          </h3>

          {filteredCompleted.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCompleted.map((exam) => {
                const isSelected = (selectedExamId || activeExam?.id) === exam.id;
                return (
                  <Card
                    key={exam.id}
                    className={cn(
                      'rounded-2xl border p-5 space-y-4 shadow-2xs transition-all flex flex-col justify-between',
                      isSelected
                        ? 'border-[#0052CC] bg-blue-50/40 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-blue-300',
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-base text-[#0B2447]">{exam.title}</h4>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            Evaluated on {formatDate(exam.evaluatedAt)}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Rank #{exam.rank}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">
                            Total Marks
                          </span>
                          <span className="font-extrabold font-mono text-[#0B2447] text-sm">
                            {exam.totalScore} / {exam.totalPossible}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">
                            Percentage
                          </span>
                          <span className="font-extrabold font-mono text-emerald-600 text-sm">
                            {exam.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        suppressHydrationWarning
                        onClick={() => setSelectedExamId(exam.id)}
                        className="text-xs font-extrabold text-[#0052CC] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <PieChartIcon className="h-3.5 w-3.5" />
                        Inspect in Charts
                      </button>

                      <Link
                        href={`/dashboard/parent/exams/${exam.id}`}
                        onMouseEnter={() => prefetchExamResult(exam.id)}
                        onFocus={() => prefetchExamResult(exam.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs shadow-2xs transition-all cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Detailed Scorecard 🎓
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400 font-medium shadow-2xs">
              No completed exam records found matching selected criteria.
            </Card>
          )}
        </div>
      )}

      {/* ── Active Exam Subject Cards Grid ── */}
      {(activeTab === 'ALL' || activeTab === 'COMPLETED') && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#0052CC]" />
                Subject Concept Strength & Marks Breakdown
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Detailed subject score tiles for {activeExam?.title || 'Selected Exam'}
              </p>
            </div>
            {activeExam && (
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0052CC] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 self-start sm:self-auto">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0052CC]" />
                Selected: {activeExam.title}
              </span>
            )}
          </div>

          {activeSubjectBreakdown.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeSubjectBreakdown.map((item) => {
                const theme = getSubjectTheme(item.subject);
                const isInactive = item.isActive === false || Boolean(item.inactiveMessage);

                return (
                  <Card
                    key={item.subject}
                    className={cn(
                      'p-5 rounded-2xl bg-white border shadow-2xs space-y-4 transition-all flex flex-col justify-between',
                      isInactive
                        ? 'border-rose-200 bg-rose-50/20 opacity-75'
                        : `border-slate-200 hover:border-blue-300`,
                    )}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC] shrink-0">
                            {theme.icon}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm text-[#0B2447] truncate">
                              {item.subject}
                            </h4>
                            <p className="text-[11px] font-mono font-bold text-slate-500 mt-0.5">
                              {item.obtained} / {item.total} Marks
                            </p>
                          </div>
                        </div>
                      </div>

                      {isInactive ? (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1.5">
                          <span>⚠️</span> Currently this subject is inactive
                        </div>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-500">Subject Mastery</span>
                            <span className="font-mono text-[#0B2447] text-sm font-extrabold">
                              {item.percentage}%
                            </span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                theme.bar,
                              )}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      {isInactive ? (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          Inactive
                        </span>
                      ) : (
                        getSubjectBadge(item.percentage)
                      )}
                      <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[100px]">
                        {activeExam ? activeExam.title : 'Exam'}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400 font-medium shadow-2xs">
              No subject breakdown available for the selected exam.
            </Card>
          )}
        </div>
      )}

      {/* ── Faculty Evaluation Remarks Card ── */}
      {(activeTab === 'ALL' || activeTab === 'COMPLETED') && activeExam?.tutorNotes && (
        <Card className="p-6 rounded-2xl bg-white border border-blue-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageSquare className="h-5 w-5 text-[#0052CC]" />
            <h3 className="font-extrabold text-sm text-[#0B2447]">
              Faculty & Tutor Academic Feedback
            </h3>
          </div>
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-800 leading-relaxed space-y-1">
            <p className="font-extrabold text-[#0052CC] text-xs">Evaluator Notes:</p>
            <p className="italic text-slate-700">&ldquo;{activeExam.tutorNotes}&rdquo;</p>
          </div>
        </Card>
      )}

      {/* ── Upcoming Exams Section ── */}
      {(activeTab === 'ALL' || activeTab === 'UPCOMING') && (
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Upcoming Scheduled Examinations ({filteredUpcoming.length})
          </h3>

          {filteredUpcoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUpcoming.map((uExam: any, idx: number) => (
                <Card key={uExam.id || idx} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-base text-[#0B2447]">{uExam.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{uExam.description || 'Upcoming NEET Mock Test Series'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                      Scheduled
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-bold text-[#0B2447]">
                      <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
                      {uExam.durationMinutes || 120} mins
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Window: {formatDate(uExam.examWindowStart || uExam.scheduledStartAt)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400 font-medium shadow-2xs">
              No upcoming exam schedules found.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
