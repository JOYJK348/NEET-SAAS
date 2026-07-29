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
    <div className="p-4 sm:p-6 space-y-6 text-slate-800 min-h-screen bg-slate-50 w-full">
      {/* Top Navigation Action */}
      <div>
        <button
          onClick={() => router.push('/dashboard/student')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          Back to Student Dashboard
        </button>
      </div>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Student Exam Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Offline OMR & Hybrid Examinations Dashboard — View Schedule, Start Timers & Track
            Results
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 border-b border-slate-200 text-xs font-semibold pb-3">
        {[
          { key: 'LIVE', label: 'Live & Active Exams', count: liveCount },
          { key: 'UPCOMING', label: 'Upcoming Exams', count: upcomingCount },
          { key: 'SUBMITTED', label: 'Submitted', count: submittedCount },
          { key: 'RESULTS', label: 'Results & Scorecards', count: resultsCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`py-2 px-3 sm:px-4 rounded-xl font-bold transition flex items-center justify-between sm:justify-start gap-2 border ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700'
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
          <div className="col-span-full py-16 text-center text-slate-400 font-medium">
            Loading your exams...
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 font-medium">
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
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold rounded-full uppercase">
                      {exam.studentExamStatus}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono font-medium">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      {exam.durationMinutes} mins
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">{exam.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {exam.description || 'No instructions specified.'}
                    </p>
                  </div>

                  {/* Window Details Box */}
                  <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between text-slate-500 gap-2">
                      <span className="shrink-0 font-medium">Window Start:</span>
                      <span className="font-semibold text-slate-800 font-mono text-right">
                        {formatExamDateTime(exam.examWindowStart)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 gap-2">
                      <span className="shrink-0 font-medium">Window End:</span>
                      <span className="font-semibold text-slate-800 font-mono text-right">
                        {formatExamDateTime(exam.examWindowEnd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                      <span className="font-medium">Grace Period:</span>
                      <span className="font-bold text-amber-700">
                        +{exam.graceMinutes} mins
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  {exam.studentExamStatus === 'RESULT_PUBLISHED' ||
                  exam.submission?.isResultsPublished ? (
                    <Link
                      href={`/dashboard/student/exams/${exam.id}/result`}
                      className="w-full text-center px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <Award className="w-4 h-4" /> View Scorecard & Rank
                    </Link>
                  ) : isSubmitted ? (
                    <Link
                      href={`/dashboard/student/exams/${exam.id}`}
                      className="w-full text-center px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2 hover:bg-amber-100"
                    >
                      <FileText className="w-4 h-4 text-amber-600" /> Submitted (Under Evaluation)
                    </Link>
                  ) : isStarted ? (
                    <Link
                      href={`/dashboard/student/exams/${exam.id}`}
                      className="w-full text-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
                    >
                      Enter Exam Room <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => setStartingExam(exam)}
                      disabled={!exam.canStart && exam.studentExamStatus !== 'LIVE'}
                      className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-5 text-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                Start Exam Timer Confirmation
              </h3>
              <button
                onClick={() => setStartingExam(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                You are about to start <strong className="text-slate-900">{startingExam.title}</strong>.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-800">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> Important Rules:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
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
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStart}
                disabled={startExamMutation.isPending}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
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
