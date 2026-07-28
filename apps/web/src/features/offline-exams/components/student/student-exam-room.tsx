'use client';

import { useState } from 'react';
import {
  useGetQuestionPaperUrl,
  useHeartbeat,
  useStudentExamDetail,
  useUploadAnswerSheet,
} from '../../hooks/use-student-exams';
import {
  AlertTriangle,
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

export function StudentExamRoom({ examId }: StudentExamRoomProps) {
  const { data: exam, isLoading, refetch } = useStudentExamDetail(examId);

  const isStarted = !!exam?.submission?.startedAt;
  const { lastSyncedAt, isSyncing } = useHeartbeat(examId, isStarted);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getQPMutation = useGetQuestionPaperUrl();
  const uploadMutation = useUploadAnswerSheet();

  if (isLoading) {
    return <div className="py-24 text-center text-slate-400">Loading exam room session...</div>;
  }

  if (!exam) {
    return <div className="py-24 text-center text-slate-400">Exam not found or unavailable.</div>;
  }

  const remainingSeconds = exam.remainingSeconds || 0;
  const isGrace = remainingSeconds === 0 && exam.allowLateUpload;
  const isExpired = remainingSeconds === 0 && !exam.allowLateUpload;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timerFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const getTimerColorClass = () => {
    if (isGrace) return 'text-amber-400 bg-amber-950/40 border-amber-800/60 animate-pulse';
    if (remainingSeconds < 600)
      return 'text-rose-400 bg-rose-950/40 border-rose-800/60 animate-pulse';
    return 'text-emerald-400 bg-slate-900 border-slate-800';
  };

  const handleDownloadQP = () => {
    getQPMutation.mutate(examId, {
      onSuccess: (data) => {
        if (data.questionPaperSignedUrl) {
          window.open(data.questionPaperSignedUrl, '_blank');
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
    <div className="p-6 space-y-6 text-slate-100 min-h-screen bg-slate-950 max-w-6xl mx-auto">
      {/* Top Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold rounded-full">
              LIVE SESSION
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Duration: {exam.durationMinutes} mins
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">{exam.title}</h1>
        </div>

        {/* Connection & Heartbeat Sync Badge */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Wifi className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Connected</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Last Synced:{' '}
            <span className="text-slate-200 font-mono">
              {lastSyncedAt
                ? lastSyncedAt.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : 'Just now'}
            </span>
          </span>
        </div>
      </div>

      {/* Main Grid: Left Timer & QP Guard / Right Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Timer & Question Paper */}
        <div className="lg:col-span-2 space-y-6">
          {/* Large Countdown Clock Widget */}
          <div
            className={`p-8 rounded-2xl border text-center shadow-2xl transition space-y-3 ${getTimerColorClass()}`}
          >
            <p className="text-xs uppercase font-bold tracking-widest text-slate-400 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              {isGrace ? 'GRACE PERIOD RUNNING' : 'REMAINING TIME'}
            </p>

            <div className="text-6xl font-black font-mono tracking-tight">{timerFormatted}</div>

            {remainingSeconds < 600 && remainingSeconds > 0 && (
              <p className="text-xs text-rose-300 font-semibold flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Less than 10 minutes remaining!
                Finish and upload your answer sheet.
              </p>
            )}

            {isGrace && (
              <p className="text-xs text-amber-300 font-semibold flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Main timer ended. Submitting
                under Grace Period (marked LATE).
              </p>
            )}
          </div>

          {/* Question Paper Download Guard Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Question Paper PDF
              </h3>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Ready to Start Verified
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Question Paper is strictly guarded. You can download and open the Question Paper PDF
              now.
            </p>

            <button
              onClick={handleDownloadQP}
              disabled={getQPMutation.isPending}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/30 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {getQPMutation.isPending
                ? 'Unlocking Question Paper...'
                : 'Download Question Paper PDF'}
            </button>
          </div>
        </div>

        {/* Right Column (1 Col): OMR Upload & History */}
        <div className="space-y-6">
          {/* Upload Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              Upload Answer Sheet
            </h3>

            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 text-center space-y-3 transition bg-slate-950/60">
              <input
                type="file"
                accept=".pdf,image/*"
                id="omr-file-input"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label htmlFor="omr-file-input" className="cursor-pointer block space-y-2">
                <div className="w-12 h-12 rounded-full bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click or Drag & Drop Answer Sheet PDF'}
                </p>
                <p className="text-[10px] text-slate-500">PDF, JPG, PNG up to 10MB</p>
              </label>
            </div>

            {selectedFile && (
              <button
                onClick={handleUploadFile}
                disabled={uploadMutation.isPending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                {uploadMutation.isPending ? 'Uploading Sheet...' : 'Confirm & Upload Sheet'}
              </button>
            )}
          </div>

          {/* Submission Files Audit History */}
          {exam.submission?.submissionFiles && exam.submission.submissionFiles.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                <History className="w-4 h-4 text-indigo-400" />
                Submission Upload History
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {exam.submission.submissionFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-200 block">
                        Uploaded{' '}
                        {new Date(file.uploadedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        file.fileType === 'CURRENT'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {file.fileType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
