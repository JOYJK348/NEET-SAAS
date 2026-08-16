'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { formatDate } from '@/features/students/utils/student-utils';
import { cn } from '@/lib/utils';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/staleTimes';

export default function ParentExamsPage() {
  const { selectedChildId, selectedChild, isLoading: isSwitcherLoading } = useChildSwitcher();
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const {
    data,
    isLoading: isExamsLoading,
  } = useQuery<ParentExamsData>({
    queryKey: ['parent', 'exams', selectedChildId],
    queryFn: () => parentPortalService.getExams(selectedChildId!),
    enabled: Boolean(selectedChildId),
    staleTime: STALE_TIMES.DEFAULT,
    placeholderData: keepPreviousData,
  });

  const isLoading = (isExamsLoading && !data) || isSwitcherLoading;

  if (isLoading || isSwitcherLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const upcoming = data?.upcoming || [];
  const completed = data?.completed || [];

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
  const avgPercentage = completed.length > 0
    ? Math.round(completed.reduce((acc, c) => acc + (c.percentage || 0), 0) / completed.length)
    : 0;

  const topRank = completed.length > 0
    ? Math.min(...completed.map((c) => c.rank || 999))
    : 0;

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
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          High Mastery
        </span>
      );
    if (pct >= 75)
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          Good Progress
        </span>
      );
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
        Practice Needed
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Top Banner - Clean Standard Layout matching Student/Tutor */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Examinations & Evaluation
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Track tests, evaluate subject breakdown, and review tutor notes for{' '}
            <strong className="text-slate-800">{selectedChild?.name || 'Selected Student'}</strong>
          </p>
        </div>

        {/* Quick Metrics Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs min-w-[90px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Score</p>
            <p className="text-base font-black font-mono text-indigo-600 mt-0.5">{avgPercentage}%</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs min-w-[90px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Top Rank</p>
            <p className="text-base font-black font-mono text-amber-600 mt-0.5">
              {topRank > 0 && topRank < 999 ? `#${topRank}` : 'N/A'}
            </p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-2xs min-w-[90px]">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tests Taken</p>
            <p className="text-base font-black font-mono text-emerald-600 mt-0.5">{completed.length}</p>
          </div>
        </div>
      </div>

      {/* Upcoming Exams Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-500" />
          Upcoming Scheduled Exams ({upcoming.length})
        </h3>

        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map((exam) => (
              <Card
                key={exam.id}
                className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white p-5 space-y-3 shadow-2xs hover:shadow-xs transition-all"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">{exam.title}</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 shrink-0">
                    Scheduled
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                    {formatDate(exam.startDate)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    {exam.durationMins || 180} Mins
                  </span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 text-center text-xs font-medium text-slate-400">
            No upcoming exams scheduled right now.
          </Card>
        )}
      </div>

      {/* Interactive Exam Selector & Subject Breakdown Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-violet-600" />
              Subject Concept Strength & Marks Breakdown
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select an exam below to inspect subject-wise scores & mastery percentages
            </p>
          </div>
          {activeExam && (
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-xl border border-violet-200/80 self-start sm:self-auto">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-600" />
              Selected: {activeExam.title}
            </span>
          )}
        </div>

        {/* Exam Selection Pills */}
        {completed.length > 0 ? (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {completed.map((exam) => {
              const isSelected = (selectedExamId || activeExam?.id) === exam.id;
              return (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => setSelectedExamId(exam.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-bold transition-all shrink-0 cursor-pointer text-left',
                    isSelected
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-600 shadow-md shadow-violet-200 ring-2 ring-violet-500/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300 hover:bg-violet-50/40',
                  )}
                >
                  <FileSpreadsheet
                    className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-violet-600'}`}
                  />
                  <div>
                    <p className="font-extrabold">{exam.title}</p>
                    <p
                      className={`text-[10px] font-mono mt-0.5 ${
                        isSelected ? 'text-violet-100' : 'text-slate-400'
                      }`}
                    >
                      {exam.totalScore} / {exam.totalPossible} Marks ({exam.percentage}%)
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <Card className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-400">
            No completed exam records available to select.
          </Card>
        )}

        {/* Active Exam Subject Cards */}
        {activeSubjectBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeSubjectBreakdown.map((item) => {
              const theme = getSubjectTheme(item.subject);
              const isInactive = item.isActive === false || Boolean(item.inactiveMessage);

              return (
                <Card
                  key={item.subject}
                  className={cn(
                    'p-5 rounded-3xl bg-white border shadow-2xs space-y-4 transition-all flex flex-col justify-between',
                    isInactive
                      ? 'border-rose-200 bg-rose-50/20 opacity-75'
                      : `${theme.border} ${theme.bg} hover:shadow-xs`,
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2.5 rounded-2xl bg-white border border-slate-100 shrink-0">
                          {theme.icon}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                            {item.subject}
                          </h4>
                          <p className="text-[11px] font-mono font-bold text-slate-500 mt-0.5">
                            {item.obtained} / {item.total} Marks
                          </p>
                        </div>
                      </div>
                    </div>

                    {isInactive ? (
                      <div className="p-2.5 rounded-xl bg-rose-100/70 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
                        <span>⚠️</span> Currently this subject is inactive
                      </div>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-500">Subject Mastery</span>
                          <span className="font-mono text-slate-900 text-sm font-black">
                            {item.percentage}%
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', theme.bar)}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    {isInactive ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
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
          <Card className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400">
            No subject breakdown available for the selected exam.
          </Card>
        )}
      </div>

      {/* Faculty Evaluation Remarks Card */}
      {activeExam?.tutorNotes && (
        <Card className="p-6 rounded-3xl bg-white border border-purple-100 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Faculty & Tutor Academic Feedback
            </h3>
          </div>
          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs text-purple-950 leading-relaxed space-y-1">
            <p className="font-bold text-purple-900 text-xs">Evaluator Notes:</p>
            <p className="italic text-slate-700">&ldquo;{activeExam.tutorNotes}&rdquo;</p>
          </div>
        </Card>
      )}

      {/* Evaluated Exams List */}
      <div className="space-y-3 pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          Completed & Evaluated Exams History ({completed.length})
        </h3>

        {completed.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.map((exam) => {
              const isSelected = (selectedExamId || activeExam?.id) === exam.id;
              return (
                <Card
                  key={exam.id}
                  className={cn(
                    'rounded-3xl border p-5 space-y-4 shadow-2xs transition-all flex flex-col justify-between',
                    isSelected
                      ? 'border-violet-500 bg-violet-50/30 ring-2 ring-violet-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs',
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900">{exam.title}</h4>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          Evaluated on {formatDate(exam.evaluatedAt)}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                        Rank #{exam.rank}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">
                          Total Marks
                        </span>
                        <span className="font-extrabold font-mono text-slate-900 text-sm">
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
                      onClick={() => setSelectedExamId(exam.id)}
                      className="text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Inspect Breakdown
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>

                    <a
                      href={`/dashboard/parent/exams/${exam.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs shadow-violet-200 transition-all"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Detailed Result →
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
            No completed exam records available.
          </Card>
        )}
      </div>
    </div>
  );
}

