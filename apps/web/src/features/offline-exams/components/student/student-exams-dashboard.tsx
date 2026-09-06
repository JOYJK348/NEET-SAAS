'use client';

import { useState, useEffect } from 'react';
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
  CheckCircle2,
  FileCheck,
  Lock,
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

export function StudentExamsDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'LIVE' | 'SUBMITTED' | 'RESULTS'>('ALL');
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
    const key = `${exam.title.trim().toLowerCase()}-${exam.examWindowStart || ''}-${exam.durationMinutes}`;
    if (!deduplicatedExamsMap.has(key)) {
      deduplicatedExamsMap.set(key, exam);
    } else {
      const existing = deduplicatedExamsMap.get(key)!;
      // Prioritize the entry with an active or completed submission
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

  const isResultPub = (e: StudentExamItem) =>
    e.studentExamStatus === 'RESULT_PUBLISHED' ||
    e.publishStatus === 'RESULT_PUBLISHED' ||
    !!e.submission?.isResultsPublished ||
    e.submission?.evaluationStatus === 'PUBLISHED' ||
    e.submission?.evaluationStatus === 'COMPLETED';

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

  const liveCount = examList.filter((e) => isExamLive(e)).length;
  const upcomingCount = examList.filter((e) => isExamUpcoming(e)).length;
  const resultsCount = examList.filter((e) => isResultPub(e)).length;
  const submittedCount = examList.filter((e) => isHistory(e)).length;

  const filteredExams = examList.filter((exam) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'RESULTS') return isResultPub(exam);
    if (activeTab === 'SUBMITTED') return isHistory(exam);
    if (activeTab === 'LIVE') return isExamLive(exam);
    if (activeTab === 'UPCOMING') return isExamUpcoming(exam);
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
    <div className="w-full pb-20 space-y-5 font-sans text-[#0F172A]">
      {/* Top Header Card (Matches ISML LMS Theme) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0B2447] tracking-tight">
              Student Exam Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200 uppercase tracking-wider">
              NEET Mock & Test Series
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Offline OMR & Hybrid Examinations Dashboard — View Schedule, Start Timers & Track
            Results
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard/student')}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0052CC] border border-blue-200 text-xs font-extrabold transition shadow-2xs cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#0052CC]" />
          <span>Student Dashboard</span>
        </button>
      </div>

      {/* Tab Navigation Switcher Pills */}
      <div className="flex items-center p-1 bg-white rounded-2xl border border-slate-200/90 shadow-2xs text-xs font-extrabold text-[#0B2447] overflow-x-auto scrollbar-none">
        {[
          { key: 'ALL', label: 'All Exams', count: examList.length },
          { key: 'LIVE', label: 'Live & Active', count: liveCount },
          { key: 'UPCOMING', label: 'Upcoming Exams', count: upcomingCount },
          { key: 'SUBMITTED', label: 'Submitted & History', count: submittedCount },
          { key: 'RESULTS', label: 'Results & Rank', count: resultsCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              'flex-1 min-w-[110px] sm:min-w-[140px] py-2.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-center truncate',
              activeTab === tab.key
                ? 'bg-[#0052CC] text-white shadow-2xs font-black'
                : 'hover:text-[#0052CC] text-slate-600',
            )}
          >
            <span className="truncate">{tab.label}</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-black shrink-0',
                activeTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-50 text-[#0052CC] border border-blue-200',
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Exam Cards Grid */}
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
              Scheduled tests and mock exam series will appear here.
            </p>
          </div>
        ) : (
          filteredExams.map((exam) => {
            const isStarted = !!exam.submission?.startedAt;
            const isSubmittedCard = !!exam.submission?.submittedAt;

            let cardTimer: { label: string; style: string } | null = null;
            let isTimerExpired = false;

            const windowEndMs = exam.examWindowEnd ? new Date(exam.examWindowEnd).getTime() : null;
            const windowGraceEndMs = windowEndMs ? windowEndMs + (exam.graceMinutes || 0) * 60 * 1000 : null;
            const isWindowExpired = windowGraceEndMs !== null && !isNaN(windowGraceEndMs) && nowMs > windowGraceEndMs;

            if (isStarted && !isSubmittedCard && exam.submission?.startedAt) {
              const startedAtMs = new Date(exam.submission.startedAt).getTime();

              let calculatedEndMs = exam.submission.calculatedEndAt
                ? new Date(exam.submission.calculatedEndAt).getTime()
                : startedAtMs + exam.durationMinutes * 60 * 1000;

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
                className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-4 w-full"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs',
                        isLockedOrExpired && exam.studentExamStatus !== 'RESULT_PUBLISHED' && !isSubmittedCard
                          ? 'bg-slate-100 text-slate-500 border border-slate-300'
                          : exam.studentExamStatus === 'LIVE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : exam.studentExamStatus === 'RESULT_PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-[#0052CC] border border-blue-200',
                      )}
                    >
                      {isLockedOrExpired && exam.studentExamStatus !== 'RESULT_PUBLISHED' && !isSubmittedCard
                        ? 'EXPIRED / CLOSED'
                        : exam.studentExamStatus}
                    </span>
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
                        {exam.durationMinutes} mins
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
                  {exam.studentExamStatus === 'RESULT_PUBLISHED' ||
                  exam.submission?.isResultsPublished ? (
                    <Link
                      href={`/dashboard/student/exams/${exam.id}/result`}
                      className="w-full text-center px-4 py-2.5 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-white" /> View Scorecard & Rank
                    </Link>
                  ) : isSubmittedCard ? (
                    <Link
                      href={`/dashboard/student/exams/${exam.id}`}
                      className="w-full text-center px-4 py-2.5 bg-blue-50 border border-blue-200 text-[#0052CC] rounded-xl text-xs font-extrabold shadow-2xs transition flex items-center justify-center gap-2 hover:bg-blue-100 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-[#0052CC]" /> Submitted (Under Evaluation)
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
                    Your <strong>{startingExam.durationMinutes}-minute timer</strong> will begin
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
