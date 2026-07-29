'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStartExam, useStudentExams } from '../../hooks/use-student-exams';
import type { StudentExamItem } from '../../types/student-exams';
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
} from 'lucide-react';

const formatExamDateTime = (dateStr?: string | null) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export function StudentExamsDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'LIVE' | 'SUBMITTED' | 'RESULTS'>('LIVE');
  const [startingExam, setStartingExam] = useState<StudentExamItem | null>(null);

  const { data: response, isLoading } = useStudentExams();
  const startExamMutation = useStartExam();

  const examList: StudentExamItem[] = Array.isArray(response)
    ? response
    : Array.isArray((response as any)?.data)
      ? (response as any).data
      : [];

  const isExamLive = (e: StudentExamItem) => {
    if (!!e.submission) return false;
    if (e.studentExamStatus === 'LIVE') return true;
    const now = new Date();
    const start = new Date(e.examWindowStart);
    const end = new Date(e.examWindowEnd);
    return now >= start && now <= end && e.studentExamStatus !== 'RESULT_PUBLISHED';
  };

  const isExamUpcoming = (e: StudentExamItem) => {
    if (!!e.submission) return false;
    if (e.studentExamStatus === 'SCHEDULED' || e.studentExamStatus === 'UPCOMING') return true;
    const now = new Date();
    const start = new Date(e.examWindowStart);
    return now < start && e.studentExamStatus !== 'RESULT_PUBLISHED';
  };

  const liveCount = examList.filter(isExamLive).length;
  const upcomingCount = examList.filter(isExamUpcoming).length;
  const submittedCount = examList.filter(
    (e) =>
      !!e.submission &&
      e.studentExamStatus !== 'RESULT_PUBLISHED' &&
      !e.submission?.isResultsPublished,
  ).length;
  const resultsCount = examList.filter(
    (e) => e.studentExamStatus === 'RESULT_PUBLISHED' || !!e.submission?.isResultsPublished,
  ).length;

  const filteredExams = examList.filter((exam) => {
    const isResultPub =
      exam.studentExamStatus === 'RESULT_PUBLISHED' || !!exam.submission?.isResultsPublished;

    if (activeTab === 'RESULTS') {
      return isResultPub;
    }
    if (activeTab === 'SUBMITTED') {
      return !!exam.submission && !isResultPub;
    }
    if (activeTab === 'LIVE') {
      return isExamLive(exam);
    }
    if (activeTab === 'UPCOMING') {
      return isExamUpcoming(exam);
    }
    return true;
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
    <div className="p-4 sm:p-6 space-y-6 text-slate-100 min-h-screen bg-slate-950 w-full">
      {/* Top Navigation Action */}
      <div>
        <button
          onClick={() => router.push('/dashboard/student')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-400" />
          Back to Student Dashboard
        </button>
      </div>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            Student Exam Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Offline OMR & Hybrid Examinations Dashboard — View Schedule, Start Timers & Track
            Results
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs font-semibold overflow-x-auto">
        {[
          { key: 'LIVE', label: 'Live & Active Exams', count: liveCount },
          { key: 'UPCOMING', label: 'Upcoming Exams', count: upcomingCount },
          { key: 'SUBMITTED', label: 'Submitted / Under Evaluation', count: submittedCount },
          { key: 'RESULTS', label: 'Results & Scorecards', count: resultsCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 px-4 border-b-2 font-bold transition flex items-center gap-2 shrink-0 ${
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === tab.key
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            Loading your exams...
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            No exams found in this tab category.
          </div>
        ) : (
          filteredExams.map((exam) => {
            const isStarted = !!exam.submission?.startedAt;
            const isSubmitted =
              exam.submission?.status === 'SUBMITTED' || exam.submission?.status === 'LATE';

            return (
              <div
                key={exam.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-bold rounded-full uppercase">
                      {exam.studentExamStatus}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      {exam.durationMinutes} mins
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{exam.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {exam.description || 'No instructions specified.'}
                    </p>
                  </div>

                  {/* Window Details Box */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between text-slate-400 gap-2">
                      <span className="shrink-0">Window Start:</span>
                      <span className="font-semibold text-slate-200 font-mono text-right">
                        {formatExamDateTime(exam.examWindowStart)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 gap-2">
                      <span className="shrink-0">Window End:</span>
                      <span className="font-semibold text-slate-200 font-mono text-right">
                        {formatExamDateTime(exam.examWindowEnd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-900">
                      <span>Grace Period:</span>
                      <span className="font-semibold text-amber-400">
                        +{exam.graceMinutes} mins
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  {exam.studentExamStatus === 'RESULT_PUBLISHED' ||
                  exam.submission?.isResultsPublished ? (
                    <Link
                      href={`/dashboard/student/exams/${exam.id}/result`}
                      className="w-full text-center px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-2"
                    >
                      <Award className="w-4 h-4" /> View Scorecard & Rank
                    </Link>
                  ) : isSubmitted ? (
                    <Link
                      href={`/dashboard/student/exams/${exam.id}`}
                      className="w-full text-center px-4 py-2.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-2 hover:bg-amber-500/30"
                    >
                      <FileText className="w-4 h-4 text-amber-400" /> Submitted (Under Evaluation)
                    </Link>
                  ) : isStarted ? (
                    <Link
                      href={`/dashboard/student/exams/${exam.id}`}
                      className="w-full text-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-2"
                    >
                      Enter Exam Room <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => setStartingExam(exam)}
                      disabled={!exam.canStart && exam.studentExamStatus !== 'LIVE'}
                      className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Ready to Start Exam
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ready to Start Confirmation Modal */}
      {startingExam && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                Start Exam Timer Confirmation
              </h3>
              <button
                onClick={() => setStartingExam(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                You are about to start <strong>{startingExam.title}</strong>.
              </p>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" /> Important Rules:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90">
                  <li>
                    Your <strong>{startingExam.durationMinutes}-minute timer</strong> will begin
                    immediately.
                  </li>
                  <li>
                    Timer <strong>cannot be paused or reset</strong> by refreshing or logging out.
                  </li>
                  <li>Question Paper download unlocks right after starting.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setStartingExam(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStart}
                disabled={startExamMutation.isPending}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/30 transition flex items-center gap-2"
              >
                {startExamMutation.isPending ? 'Starting...' : 'I am Ready — Start Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
