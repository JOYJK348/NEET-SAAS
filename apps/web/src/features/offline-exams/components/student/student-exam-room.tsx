'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  useGetQuestionPaperUrl,
  useHeartbeat,
  useStudentExamDetail,
  useUploadAnswerSheet,
} from '../../hooks/use-student-exams';
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

  const getTimerColorClass = () => {
    if (isExpired) return 'text-slate-500 bg-slate-100 border-slate-300';
    if (isGrace) return 'text-amber-700 bg-amber-50 border-amber-200 animate-pulse';
    if (currentRemainingSec < 600)
      return 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  };

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
    <div className="p-4 sm:p-6 space-y-6 text-slate-800 min-h-screen bg-slate-50 w-full">
      {/* Top Navigation Action */}
      <div>
        <button
          onClick={() => router.push('/dashboard/student/exams')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          Back to Exams Dashboard
        </button>
      </div>

      {/* Top Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
              LIVE SESSION
            </span>
            <span className="text-xs text-slate-500 font-mono font-medium">
              Duration: {getEffectiveDuration(exam)} mins
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">{exam.title}</h1>
        </div>

        {/* Connection & Heartbeat Sync Badge */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold">
            <Wifi className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Connected</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-medium">
            Last Synced:{' '}
            <strong className="text-slate-800 font-mono">
              {lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Just now'}
            </strong>
          </span>
        </div>
      </div>

      {/* 2-Column Split: Left Question Paper & Timer, Right Answer Sheet Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Timer Box & QP Download */}
        <div className="lg:col-span-2 space-y-6">
          {/* Big Live Countdown Timer Box */}
          <div
            className={`p-8 rounded-3xl border text-center space-y-3 shadow-sm ${getTimerColorClass()}`}
          >
            <div className="flex justify-center">
              <Clock className="w-8 h-8" />
            </div>
            <p className="text-xs uppercase font-bold tracking-widest text-slate-500">
              {isGrace ? 'Grace Period Remaining' : 'Time Remaining'}
            </p>
            <p className="text-6xl font-black font-mono tracking-tight">{timerFormatted}</p>
            {isGrace && (
              <p className="text-xs font-semibold text-amber-700">
                Regular exam window ended! Submit during grace period.
              </p>
            )}
            {isExpired && (
              <p className="text-xs font-semibold text-rose-700">
                Exam window expired. Submissions are closed.
              </p>
            )}
          </div>

          {/* Question Paper Box */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Question Paper PDF
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Download & view questions for offline OMR marking
                </p>
              </div>

              <button
                onClick={handleDownloadQP}
                disabled={getQPMutation.isPending || isExpired}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {getQPMutation.isPending ? 'Generating Link...' : 'Download QP'}
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800">Exam Instructions & Code of Conduct:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Use standard blue or black ballpoint pen for filling physical OMR sheet.</li>
                <li>Ensure all bubbles are completely filled without stray marks.</li>
                <li>Upload clear scanned PDF or JPEG image of your completed OMR answer sheet.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right 1 Col: OMR Upload Panel */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" /> Answer Sheet Upload
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload your completed physical OMR scan
              </p>
            </div>

            {/* File Dropzone */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-3 bg-slate-50/50 hover:border-indigo-300 transition">
              <div className="flex justify-center">
                <FileCheck className="w-10 h-10 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">Select OMR Scan File</p>
                <p className="text-[11px] text-slate-400 mt-0.5">PDF, PNG, JPG (Max 15MB)</p>
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
                className="inline-block px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer transition"
              >
                Browse File
              </label>

              {selectedFile && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium truncate">
                  Selected: {selectedFile.name}
                </div>
              )}
            </div>

            {/* Submit Action */}
            <button
              onClick={handleUploadFile}
              disabled={!selectedFile || uploadMutation.isPending || isExpired}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {uploadMutation.isPending ? 'Uploading Scan...' : 'Submit Answer Sheet'}
            </button>
          </div>

          {/* Submission Status Indicator */}
          {exam.submission?.status === 'SUBMITTED' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Answer sheet submitted successfully & pending evaluation!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
