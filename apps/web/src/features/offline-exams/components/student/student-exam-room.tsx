'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  useGetQuestionPaperUrl,
  useHeartbeat,
  useStudentExamDetail,
  useUploadAnswerSheet,
} from '../../hooks/use-student-exams';
import { StudentCbtWorkspace } from '@/features/online-exams/components/student/student-cbt-workspace';
import { StudentCbtResult } from '@/features/online-exams/components/student/student-cbt-result';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  History,
  Lock,
  RefreshCw,
  Upload,
  Wifi,
  X,
} from 'lucide-react';

interface StudentExamRoomProps {
  examId: string;
}

const getEffectiveDuration = (exam?: {
  durationMinutes?: number;
  examWindowStart?: string | Date;
  examWindowEnd?: string | Date;
  scheduledStartAt?: string | Date;
  scheduledEndAt?: string | Date;
}): number => {
  if (!exam) return 120;
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

export function StudentExamRoom({ examId }: StudentExamRoomProps) {
  const router = useRouter();
  const { data: exam, isLoading, refetch } = useStudentExamDetail(examId);

  const isStarted = !!exam?.submission?.startedAt;
  const { lastSyncedAt, isSyncing } = useHeartbeat(examId, isStarted);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [nowMs, setNowMs] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getQPMutation = useGetQuestionPaperUrl();
  const uploadMutation = useUploadAnswerSheet();

  if (isLoading) {
    return <div className="py-24 text-center text-slate-400 font-medium">Loading exam room session...</div>;
  }

  if (!exam) {
    return (
      <div className="p-6 text-center space-y-4 max-w-md mx-auto">
        <p className="text-slate-500 font-medium">Exam not found or unavailable.</p>
        <button
          onClick={() => router.push('/dashboard/student/exams')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Exams Dashboard
        </button>
      </div>
    );
  }

  // Handle ONLINE CBT Mode Exams
  const checkIsOnline = (m?: string) => {
    const raw = (m || (exam as any).examMode || '').toString().trim().toUpperCase();
    if (raw === 'ONLINE' || raw === 'CBT' || raw === 'ONLINE_CBT') return true;
    if (raw === 'OFFLINE' || raw === 'OMR') return false;
    const textToTest = `${exam.title || ''} ${exam.description || ''}`.toLowerCase();
    return textToTest.includes('online') || textToTest.includes('cbt');
  };

  if (checkIsOnline(exam.mode)) {
    const isResultPublished =
      exam.studentExamStatus === 'RESULT_PUBLISHED' ||
      exam.publishStatus === 'RESULT_PUBLISHED' ||
      !!exam.submission?.isResultsPublished ||
      exam.submission?.status === 'SUBMITTED' ||
      exam.submission?.status === 'COMPLETED' ||
      exam.submission?.evaluationStatus === 'PUBLISHED' ||
      exam.submission?.evaluationStatus === 'COMPLETED';

    if (isResultPublished) {
      return (
        <div className="w-full pb-20 space-y-5 font-sans text-[#0F172A]">
          <StudentCbtResult examId={examId} onBack={() => router.push('/dashboard/student/exams')} />
        </div>
      );
    }

    return (
      <StudentCbtWorkspace
        examId={examId}
        onSubmitted={() => refetch()}
        onExit={() => router.push('/dashboard/student/exams')}
      />
    );
  }

  // Real-time calculation using actual system wall-clock time vs submission timestamps
  const startedAtMs = exam.submission?.startedAt
    ? new Date(exam.submission.startedAt).getTime()
    : null;

  const windowEndMs = exam.examWindowEnd ? new Date(exam.examWindowEnd).getTime() : null;

  let calculatedEndMs = exam.submission?.calculatedEndAt
    ? new Date(exam.submission.calculatedEndAt).getTime()
    : startedAtMs
      ? startedAtMs + getEffectiveDuration(exam) * 60 * 1000
      : null;

  if (calculatedEndMs && windowEndMs && calculatedEndMs > windowEndMs) {
    calculatedEndMs = windowEndMs;
  }

  const graceEndMs = exam.submission?.graceEndAt
    ? new Date(exam.submission.graceEndAt).getTime()
    : calculatedEndMs
      ? calculatedEndMs + (exam.graceMinutes || 0) * 60 * 1000
      : null;

  let currentRemainingSec = 0;
  let isGrace = false;
  let isExpired = false;

  if (calculatedEndMs && graceEndMs) {
    if (nowMs < calculatedEndMs) {
      currentRemainingSec = Math.max(0, Math.floor((calculatedEndMs - nowMs) / 1000));
    } else if (nowMs < graceEndMs) {
      currentRemainingSec = Math.max(0, Math.floor((graceEndMs - nowMs) / 1000));
      isGrace = true;
    } else {
      currentRemainingSec = 0;
      isExpired = true;
    }
  } else {
    currentRemainingSec = Math.max(0, exam.remainingSeconds || 0);
    if (currentRemainingSec === 0) {
      if (exam.allowLateUpload) {
        isGrace = true;
      } else {
        isExpired = true;
      }
    }
  }

  const hours = Math.floor(currentRemainingSec / 3600);
  const minutes = Math.floor((currentRemainingSec % 3600) / 60);
  const seconds = currentRemainingSec % 60;

  const timerFormatted =
    hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleDownloadQP = () => {
    getQPMutation.mutate(examId, {
      onSuccess: (data) => {
        const url = (data as any)?.questionPaperSignedUrl || (data as any)?.url;
        if (url) {
          window.open(url, '_blank');
        }
      },
    });
  };

  const handleUploadFile = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(
      { id: examId, file: selectedFile },
      {
        onSuccess: () => {
          setSelectedFile(null);
          refetch();
        },
      },
    );
  };

  return (
    <div className="w-full pb-20 space-y-5 font-sans text-[#0F172A]">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200 uppercase tracking-wider">
              OFFLINE OMR EXAM ROOM
            </span>
            <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              Duration: {getEffectiveDuration(exam)} mins
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0B2447] tracking-tight mt-1">
            {exam.title}
          </h1>
        </div>

        <button
          onClick={() => router.push('/dashboard/student/exams')}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0052CC] border border-blue-200 text-xs font-extrabold transition shadow-2xs cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#0052CC]" />
          <span>Student Exams Dashboard</span>
        </button>
      </div>

      {/* Real-time Session Sync Bar */}
      <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100/90 flex items-center justify-between gap-3 flex-wrap text-xs text-slate-700 font-medium">
        <div className="flex items-center gap-2 text-emerald-700 font-black">
          <Wifi className={`w-4 h-4 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Session Active & Heartbeat Synchronized</span>
        </div>
        <div className="text-slate-500 font-mono text-xs flex items-center gap-1.5">
          <span>Last Heartbeat:</span>
          <strong className="text-[#0B2447] font-black bg-white px-2 py-0.5 rounded-md border border-blue-100">
            {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Just now'}
          </strong>
        </div>
      </div>

      {/* Main Workspace Layout (Left Timer & QP PDF, Right Answer Sheet Upload) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Big Timer & Question Paper PDF */}
        <div className="lg:col-span-2 space-y-5">
          {/* Live Countdown Timer Box */}
          <div
            className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl border text-center space-y-2 shadow-2xs ${
              isExpired
                ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                : isGrace
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900 animate-pulse'
                  : currentRemainingSec < 600
                    ? 'bg-rose-50/80 border-rose-200 text-rose-800 animate-pulse'
                    : 'bg-[#0B2447] border-[#0B2447] text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-[#0052CC] fill-[#0052CC]" />
              <span className="text-xs uppercase font-black tracking-widest text-slate-300">
                {isGrace ? 'Grace Period Remaining' : 'Exam Time Remaining'}
              </span>
            </div>
            <p className="text-4xl sm:text-6xl font-black font-mono tracking-tight">{timerFormatted}</p>
            {isGrace && (
              <p className="text-xs font-bold text-amber-700 bg-amber-100/70 py-1 px-3 rounded-lg inline-block">
                Regular exam window completed! Please submit before grace period expires.
              </p>
            )}
            {isExpired && (
              <p className="text-xs font-bold text-rose-700 bg-rose-100/70 py-1 px-3 rounded-lg inline-block">
                Exam window expired. Answer sheet upload is closed.
              </p>
            )}
          </div>

          {/* Question Paper PDF Download Box */}
          <div className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-3 flex-wrap sm:flex-nowrap">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#0B2447] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0052CC]" /> Question Paper PDF Download
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Download question paper to attempt on physical OMR sheet
                </p>
              </div>

              <button
                onClick={handleDownloadQP}
                disabled={getQPMutation.isPending || isExpired}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#0052CC] hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-black shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {getQPMutation.isPending ? 'Generating Link...' : 'Download QP PDF'}
              </button>
            </div>

            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 text-xs text-slate-700 space-y-2">
              <p className="font-black text-[#0B2447] flex items-center gap-1.5">
                Exam Instructions & Conduct:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 font-semibold text-[11px]">
                <li>Use standard dark blue or black ballpoint pen to fill physical OMR circles.</li>
                <li>Ensure options are clearly shaded without stray markings outside bubbles.</li>
                <li>Upload a high-quality scanned PDF or clean camera photo of your OMR sheet.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: OMR Answer Sheet Upload Card */}
        <div className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-2xl sm:rounded-3xl space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base sm:text-lg font-black text-[#0B2447] flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" /> Answer Sheet Upload
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Submit completed physical OMR answer sheet scan
              </p>
            </div>

            {/* File Dropzone Box */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center space-y-3 bg-slate-50/60 hover:border-blue-400 transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center mx-auto">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-[#0B2447]">Select OMR Sheet File</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  Supported: PDF, PNG, JPG (Max 15MB)
                </p>
              </div>

              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                id="omr-file-input"
              />
              <label
                htmlFor="omr-file-input"
                className="inline-block px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#0052CC] border border-blue-200 text-xs font-extrabold rounded-xl cursor-pointer transition shadow-2xs"
              >
                Browse File
              </label>

              {selectedFile && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold truncate">
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <button
              onClick={handleUploadFile}
              disabled={!selectedFile || uploadMutation.isPending || isExpired}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {uploadMutation.isPending ? 'Uploading Answer Sheet...' : 'Submit OMR Answer Sheet 🚀'}
            </button>
          </div>

          {/* Submission Status Indicator Banner */}
          {exam.submission?.status === 'SUBMITTED' && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 font-bold shadow-2xs mt-4">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              <span>Answer sheet submitted successfully & pending evaluation!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
