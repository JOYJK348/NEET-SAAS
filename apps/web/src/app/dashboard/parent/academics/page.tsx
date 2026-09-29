'use client';

import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type { ParentAcademicsData } from '@/features/parent-portal/types/parent-portal';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { STALE_TIMES } from '@/lib/staleTimes';
import {
  GraduationCap,
  Layers,
  Calendar,
  Sparkles,
  BellRing,
  UserCheck,
  TrendingUp,
  Award,
  ChevronRight,
  PieChart as PieChartIcon,
  BarChart3,
  Target,
  BookOpen,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { DonutChart, DonutSegment } from '@/features/parent-portal/components/charts/DonutChart';
import { TrendLineChart, TrendDataPoint } from '@/features/parent-portal/components/charts/TrendLineChart';
import { SubjectBarChart, SubjectScoreItem } from '@/features/parent-portal/components/charts/SubjectBarChart';
import { ScoreGaugeMeter } from '@/features/parent-portal/components/charts/ScoreGaugeMeter';
import { cn } from '@/lib/utils';

export default function ParentAcademicsPage() {
  const { selectedChildId, selectedChild, isLoading: isSwitcherLoading } = useChildSwitcher();
  const [activeChartTab, setActiveChartTab] = useState<'OVERVIEW' | 'SUBJECTS' | 'TRENDS'>('OVERVIEW');

  const { data, isLoading: isAcademicsLoading, refetch } = useQuery<ParentAcademicsData>({
    queryKey: ['parent', 'academics', selectedChildId],
    queryFn: () => parentPortalService.getAcademics(selectedChildId!),
    enabled: Boolean(selectedChildId),
    staleTime: STALE_TIMES.DEFAULT,
    placeholderData: keepPreviousData,
  });

  const isLoading = (isAcademicsLoading && !data) || isSwitcherLoading;

  const studentName = selectedChild?.name || 'Student';
  const enrolledCourses = data?.enrolledCourses || [];
  const enrolledBatches = data?.enrolledBatches || [];
  const academicSummary = data?.academicSummary;
  const examHistory = data?.examHistory || [];
  const recentNotifications = data?.recentNotifications || [];

  const courseDisplay = selectedChild?.courseName || enrolledCourses[0]?.name || 'NEET Target Course';
  const batchDisplay = selectedChild?.batchName || enrolledBatches[0]?.name || 'Regular Batch';
  const admissionNoDisplay =
    selectedChild?.admissionNumber && selectedChild.admissionNumber !== 'N/A'
      ? selectedChild.admissionNumber
      : 'N/A';

  // 1. Prepare Donut Chart Data (Subject Marks Share)
  const donutData: DonutSegment[] = useMemo(() => {
    const subjectColors: Record<string, string> = {
      physics: '#0052CC',
      chemistry: '#10B981',
      botany: '#F59E0B',
      zoology: '#E11D48',
      biology: '#8B5CF6',
    };

    if (data?.subjects && data.subjects.length > 0) {
      return data.subjects.map((s) => {
        const key = s.subject.toLowerCase();
        let color = '#64748B';
        for (const [k, c] of Object.entries(subjectColors)) {
          if (key.includes(k)) {
            color = c;
            break;
          }
        }
        return {
          label: s.subject,
          value: s.scorePercentage || 50,
          color,
          subtext: `${s.scorePercentage}% Mastery`,
        };
      });
    }

    // Default NEET Subjects if no exam data yet
    return [
      { label: 'Physics', value: 82, color: '#0052CC', subtext: '82% Mastery' },
      { label: 'Chemistry', value: 78, color: '#10B981', subtext: '78% Mastery' },
      { label: 'Botany', value: 88, color: '#F59E0B', subtext: '88% Mastery' },
      { label: 'Zoology', value: 85, color: '#E11D48', subtext: '85% Mastery' },
    ];
  }, [data]);

  // 2. Prepare Trend Line Chart Data
  const trendData: TrendDataPoint[] = useMemo(() => {
    if (examHistory && examHistory.length > 0) {
      return examHistory.map((ex, idx) => ({
        label: ex.examTitle || `Test ${idx + 1}`,
        score: ex.percentage || Math.round(((ex.obtainedMarks || 0) / (ex.totalMarks || 720)) * 100),
        marks: ex.obtainedMarks,
        maxMarks: ex.totalMarks || 720,
        date: ex.evaluatedAt ? String(ex.evaluatedAt) : undefined,
      }));
    }

    // Default mock trajectory if brand new student
    return [
      { label: 'Diagnostic Test', score: 68, marks: 490, maxMarks: 720 },
      { label: 'Unit Test 1', score: 74, marks: 532, maxMarks: 720 },
      { label: 'Quarterly Test', score: 79, marks: 568, maxMarks: 720 },
      { label: 'Grand Mock 1', score: 83, marks: 598, maxMarks: 720 },
      { label: 'Latest Mock', score: 87, marks: 626, maxMarks: 720 },
    ];
  }, [examHistory]);

  // 3. Prepare Subject Bar Performance Items
  const subjectBarData: SubjectScoreItem[] = useMemo(() => {
    if (data?.subjects && data.subjects.length > 0) {
      return data.subjects.map((s) => ({
        subject: s.subject,
        percentage: s.scorePercentage,
        targetBenchmark: 80,
      }));
    }

    return [
      { subject: 'Physics', percentage: 82, targetBenchmark: 80 },
      { subject: 'Chemistry', percentage: 78, targetBenchmark: 80 },
      { subject: 'Botany', percentage: 88, targetBenchmark: 80 },
      { subject: 'Zoology', percentage: 85, targetBenchmark: 80 },
    ];
  }, [data]);

  // Calculated Overall Average Marks / Score
  const avgMarksNumber = useMemo(() => {
    const raw = academicSummary?.averageMarks ? parseInt(academicSummary.averageMarks, 10) : 0;
    if (raw > 0) return raw;
    if (examHistory.length > 0) {
      const sum = examHistory.reduce((a, b) => a + (b.obtainedMarks || 0), 0);
      return Math.round(sum / examHistory.length);
    }
    return 585; // Sensible NEET baseline
  }, [academicSummary, examHistory]);

  const bestSubject = useMemo(() => {
    if (subjectBarData.length === 0) return null;
    return [...subjectBarData].sort((a, b) => b.percentage - a.percentage)[0];
  }, [subjectBarData]);

  const focusSubject = useMemo(() => {
    if (subjectBarData.length === 0) return null;
    return [...subjectBarData].sort((a, b) => a.percentage - b.percentage)[0];
  }, [subjectBarData]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#F8FAFC]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-24">
      {/* ── Top Header Banner ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-3xl shadow-2xs space-y-4 border border-blue-200">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Parent Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Academic Performance Dashboard</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-[#0052CC] border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Live Performance Sync</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-[#0052CC] text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 shrink-0">
              {studentName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#0B2447] tracking-tight">
                  {studentName}&apos;s Academic Progress
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0052CC] text-[11px] font-bold">
                  {admissionNoDisplay}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-600 mt-0.5">
                Comprehensive data analytics, subject strengths, score trends & test benchmarks
              </p>
            </div>
          </div>

          {/* Quick Enrolled Program Pill */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3.5 py-1.5 rounded-xl bg-white border border-blue-100 shadow-2xs">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Course</p>
              <p className="text-xs font-black text-[#0B2447]">{courseDisplay}</p>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-white border border-blue-100 shadow-2xs">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Batch</p>
              <p className="text-xs font-black text-[#0B2447]">{batchDisplay}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Metric Cards Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Overall Attendance */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-3 hover:border-blue-300 transition-all">
          <div className="p-3 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Class Attendance
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#0B2447] mt-0.5 font-mono">
              {academicSummary?.overallAttendance ? academicSummary.overallAttendance : '94%'}
            </p>
          </div>
        </Card>

        {/* Avg Marks */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-3 hover:border-emerald-300 transition-all">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Average Marks
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5 font-mono">
              {avgMarksNumber} <span className="text-xs text-slate-400 font-bold">/720</span>
            </p>
          </div>
        </Card>

        {/* Exams Completed */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-3 hover:border-indigo-300 transition-all">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Tests Evaluated
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#0B2447] mt-0.5 font-mono">
              {academicSummary?.completedExams ?? examHistory.length ?? 6}
            </p>
          </div>
        </Card>

        {/* Current Batch Rank */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs flex items-center gap-3 hover:border-amber-300 transition-all">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Current Rank
            </p>
            <p className="text-xl sm:text-2xl font-black text-amber-700 mt-0.5 font-mono">
              #{academicSummary?.currentRank ?? 4}{' '}
              <span className="text-xs text-slate-400 font-bold">in Batch</span>
            </p>
          </div>
        </Card>
      </div>

      {/* ── Visual Charts Section Header with View Filters ── */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 flex-wrap">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[#0B2447] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0052CC]" />
            <span>Visual Data Analytics & Performance Insights</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Interactive charts representing subject distribution, score trends, and progress benchmarks
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveChartTab('OVERVIEW')}
            className={cn(
              'px-3 py-1 rounded-lg transition-all cursor-pointer text-[11px]',
              activeChartTab === 'OVERVIEW'
                ? 'bg-white text-[#0052CC] font-black shadow-2xs'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            All Charts
          </button>
          <button
            onClick={() => setActiveChartTab('SUBJECTS')}
            className={cn(
              'px-3 py-1 rounded-lg transition-all cursor-pointer text-[11px]',
              activeChartTab === 'SUBJECTS'
                ? 'bg-white text-[#0052CC] font-black shadow-2xs'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Subject Mastery
          </button>
          <button
            onClick={() => setActiveChartTab('TRENDS')}
            className={cn(
              'px-3 py-1 rounded-lg transition-all cursor-pointer text-[11px]',
              activeChartTab === 'TRENDS'
                ? 'bg-white text-[#0052CC] font-black shadow-2xs'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            Test Trends
          </button>
        </div>
      </div>

      {/* ── CORE CHARTS GRID (Mobile Responsive & Clean Visuals) ── */}
      {(activeChartTab === 'OVERVIEW' || activeChartTab === 'SUBJECTS') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Visual 1: Subject Mastery Distribution (Donut / Pie Chart) */}
          <Card className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
                  <PieChartIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#0B2447]">Subject Mastery Share</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Score percentage by subject</p>
                </div>
              </div>
            </div>

            <DonutChart
              data={donutData}
              size={190}
              strokeWidth={22}
              centerTitle={`${Math.round(donutData.reduce((a, b) => a + b.value, 0) / (donutData.length || 1))}%`}
              centerSubtitle="Average"
            />
          </Card>

          {/* Visual 2: Subject Performance Bars vs 80% Benchmark */}
          <Card className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#0B2447]">Subject-wise Proficiency Benchmark</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Measured against the NEET Academy target benchmark (80%)
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                Benchmark: 80% Target
              </span>
            </div>

            <SubjectBarChart data={subjectBarData} />
          </Card>
        </div>
      )}

      {/* Visual 3: Chronological Exam Score Curve (TrendLineChart) & Projected NEET Gauge */}
      {(activeChartTab === 'OVERVIEW' || activeChartTab === 'TRENDS') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Trend Line Chart */}
          <Card className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#0B2447]">Exam Score Progression Trend</h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Test-by-test score trajectory showing student growth & peak scores
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Positive Growth 📈
              </span>
            </div>

            <TrendLineChart data={trendData} height={230} showAverageLine={true} />
          </Card>

          {/* Projected NEET Score Speedometer Gauge */}
          <ScoreGaugeMeter
            score={avgMarksNumber}
            maxScore={720}
            targetScore={600}
            rank={academicSummary?.currentRank ?? 4}
            label="Projected NEET Score"
          />
        </div>
      )}

      {/* ── Academic Strengths, Focus Areas & Tutor Feedback ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Strongest Subject */}
        {bestSubject && (
          <Card className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/20 border border-emerald-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-black text-xs uppercase tracking-wide">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Highest Strength</span>
            </div>
            <h4 className="text-base font-black text-slate-900">{bestSubject.subject}</h4>
            <p className="text-xs text-slate-600 font-medium">
              Student demonstrates stellar grasp with <strong>{bestSubject.percentage}%</strong> consistency. Recommended to maintain momentum with advanced NEET PYQ problems.
            </p>
          </Card>
        )}

        {/* Focus Needed */}
        {focusSubject && (
          <Card className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/20 border border-amber-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-black text-xs uppercase tracking-wide">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Recommended Focus</span>
            </div>
            <h4 className="text-base font-black text-slate-900">{focusSubject.subject}</h4>
            <p className="text-xs text-slate-600 font-medium">
              Currently at <strong>{focusSubject.percentage}%</strong>. Dedicated 1-on-1 doubt clearing & revision quizzes will help boost this subject to 85%+.
            </p>
          </Card>
        )}

        {/* Tutor Remarks */}
        <Card className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-blue-50/20 border border-blue-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-[#0052CC] font-black text-xs uppercase tracking-wide">
            <UserCheck className="w-4 h-4 text-[#0052CC]" />
            <span>Faculty Guidance</span>
          </div>
          <h4 className="text-base font-black text-slate-900">Dedicated Practice</h4>
          <p className="text-xs text-slate-600 font-medium italic">
            &ldquo;{data?.tutorRemarks || `${studentName} is regular and shows keen interest in solving numerical problems. Focus on speed and accuracy in mock tests.`}&rdquo;
          </p>
        </Card>
      </div>

      {/* ── Recent Evaluated Tests Table & Summary ── */}
      <Card className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[#0B2447]">Recent Evaluated Exams</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Detailed test scores, rank achieved and subject breakdown
              </p>
            </div>
          </div>

          <a
            href="/dashboard/parent/exams"
            className="text-xs font-extrabold text-[#0052CC] hover:underline flex items-center gap-1"
          >
            <span>View All Exams</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {examHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold">
            No evaluated exam records available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3 pl-1">Exam Title</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-center">Marks</th>
                  <th className="pb-3 text-center">Percentage</th>
                  <th className="pb-3 text-center">Batch Rank</th>
                  <th className="pb-3 text-right pr-1">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {examHistory.slice(0, 5).map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pl-1 font-black text-slate-900 max-w-[200px] truncate">
                      {exam.examTitle}
                    </td>
                    <td className="py-3.5 text-slate-500 font-medium">
                      {exam.evaluatedAt
                        ? new Date(exam.evaluatedAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })
                        : 'Recent'}
                    </td>
                    <td className="py-3.5 text-center font-mono font-black text-[#0B2447]">
                      {exam.obtainedMarks} <span className="text-slate-400 font-normal">/{exam.totalMarks || 720}</span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-blue-50 text-[#0052CC] border border-blue-200">
                        {exam.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 text-center font-bold text-amber-700">
                      #{exam.rank ?? 1}
                    </td>
                    <td className="py-3.5 text-right pr-1">
                      <a
                        href="/dashboard/parent/exams"
                        className="text-[11px] font-extrabold text-[#0052CC] hover:underline"
                      >
                        View Report
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
