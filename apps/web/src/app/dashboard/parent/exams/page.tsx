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
} from 'lucide-react';
import { formatDate } from '@/features/students/utils/student-utils';

export default function ParentExamsPage() {
  const { selectedChildId, selectedChild } = useChildSwitcher();
  const [data, setData] = useState<ParentExamsData | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedChildId) return;
    let isMounted = true;
    setIsLoading(true);
    parentPortalService
      .getExams(selectedChildId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          if (res?.completed && res.completed.length > 0) {
            setSelectedExamId(res.completed[0].id);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedChildId]);

  if (isLoading) {
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

  const getSubjectIcon = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('physic')) return <Atom className="h-5 w-5 text-indigo-600" />;
    if (s.includes('chem')) return <FlaskConical className="h-5 w-5 text-violet-600" />;
    if (s.includes('botan')) return <Sprout className="h-5 w-5 text-emerald-600" />;
    if (s.includes('zoo') || s.includes('bio')) return <Dna className="h-5 w-5 text-purple-600" />;
    return <BookOpen className="h-5 w-5 text-blue-600" />;
  };

  const getSubjectBadge = (pct: number) => {
    if (pct >= 85)
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
          High Mastery
        </span>
      );
    if (pct >= 75)
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
          Good Progress
        </span>
      );
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
        Practice Needed
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Examinations & Evaluation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Track tests and evaluate subject results for{' '}
          <strong className="text-slate-800">{selectedChild?.name || 'Selected Student'}</strong>
        </p>
      </div>

      {/* Upcoming Exams */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-500" />
          Upcoming Exams ({upcoming.length})
        </h3>

        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((exam) => (
              <Card
                key={exam.id}
                className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">{exam.title}</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                    Scheduled
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Date: {formatDate(exam.startDate)} • Duration: {exam.durationMins || 180} Mins
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
            No upcoming exams scheduled right now.
          </Card>
        )}
      </div>

      {/* Interactive Exam Selector & Subject Breakdown Section */}
      <div className="space-y-4 pt-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-600" />
            Subject Concept Strength & Marks Breakdown
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Click on an exam below to inspect subject-wise performance
          </p>
        </div>

        {/* Exam Selection Buttons */}
        {completed.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {completed.map((exam) => {
              const isSelected = (selectedExamId || activeExam?.id) === exam.id;
              return (
                <button
                  key={exam.id}
                  type="button"
                  onClick={() => setSelectedExamId(exam.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'
                  }`}
                >
                  <FileSpreadsheet
                    className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-violet-600'}`}
                  />
                  <div className="text-left">
                    <p className="font-extrabold">{exam.title}</p>
                    <p
                      className={`text-[10px] font-mono ${isSelected ? 'text-violet-200' : 'text-slate-400'}`}
                    >
                      Score: {exam.totalScore} / {exam.totalPossible} ({exam.percentage}%)
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

        {/* Active Exam Subject Breakdown Cards Grid */}
        {activeSubjectBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeSubjectBreakdown.map((item) => {
              const isInactive = item.isActive === false || Boolean(item.inactiveMessage);
              return (
                <Card
                  key={item.subject}
                  className={`p-5 rounded-3xl bg-white border shadow-sm space-y-4 transition-all ${
                    isInactive
                      ? 'border-rose-200 bg-rose-50/20 opacity-75'
                      : 'border-slate-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                        {getSubjectIcon(item.subject)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{item.subject}</h4>
                        <p className="text-[11px] font-mono font-bold text-violet-600">
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
                        <span className="font-mono text-violet-700 text-sm">
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.percentage >= 85
                              ? 'bg-emerald-500'
                              : item.percentage >= 75
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {isInactive ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                        Inactive Subject
                      </span>
                    ) : (
                      getSubjectBadge(item.percentage)
                    )}
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
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

      {/* Tutor Feedback Card */}
      {activeExam?.tutorNotes && (
        <Card className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            <h3 className="font-extrabold text-base text-slate-900">
              Faculty & Tutor Academic Feedback
            </h3>
          </div>
          <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs text-purple-950 leading-relaxed space-y-2">
            <p className="font-bold text-sm text-purple-900">Academic Review Remarks:</p>
            <p>&ldquo;{activeExam.tutorNotes}&rdquo;</p>
          </div>
        </Card>
      )}

      {/* Completed Exam Results Cards List */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          Completed & Evaluated Exams Summary
        </h3>

        {completed.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.map((exam) => (
              <Card
                key={exam.id}
                className={`rounded-2xl border p-5 space-y-3 shadow-sm hover:shadow-md transition-all ${
                  (selectedExamId || activeExam?.id) === exam.id
                    ? 'border-violet-400 bg-violet-50/30'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">{exam.title}</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                    Rank #{exam.rank}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-slate-400 block">Marks</span>
                    <span className="font-bold font-mono text-slate-900">
                      {exam.totalScore} / {exam.totalPossible}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Percentage</span>
                    <span className="font-bold font-mono text-emerald-600">{exam.percentage}%</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedExamId(exam.id)}
                    className="text-xs font-bold text-violet-600 hover:underline"
                  >
                    Select Subject Breakdown ↑
                  </button>
                  <a
                    href={`/dashboard/parent/exams/${exam.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm shadow-violet-200 transition-all"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View Detailed Result →
                  </a>
                </div>
              </Card>
            ))}
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
