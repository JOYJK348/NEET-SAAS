'use client';

import { useState } from 'react';
import { useUploadAnswerKey, useUploadQuestionPaper } from '../../hooks/use-admin-exams';
import type { ExamItem } from '../../types/admin-exams';
import { FileCheck, FileText, Upload, X } from 'lucide-react';

interface UploadFilesModalProps {
  exam: ExamItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UploadFilesModal({ exam, isOpen, onClose }: UploadFilesModalProps) {
  const [qpFile, setQpFile] = useState<File | null>(null);
  const [akFile, setAkFile] = useState<File | null>(null);

  const uploadQPMutation = useUploadQuestionPaper();
  const uploadAKMutation = useUploadAnswerKey();

  if (!isOpen || !exam) return null;

  const handleUploadQP = () => {
    if (!qpFile) return;
    uploadQPMutation.mutate(
      { id: exam.id, file: qpFile },
      {
        onSuccess: () => {
          setQpFile(null);
        },
      },
    );
  };

  const handleUploadAK = () => {
    if (!akFile) return;
    uploadAKMutation.mutate(
      { id: exam.id, file: akFile },
      {
        onSuccess: () => {
          setAkFile(null);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl text-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              Upload Exam Documents
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{exam.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Question Paper Section */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Question Paper (PDF)
              </h4>
              {exam.questionPaperFileId ? (
                <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold rounded-full flex items-center gap-1">
                  <FileCheck className="w-3 h-3" /> Uploaded to Supabase
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold rounded-full">
                  Missing PDF
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Students will be able to download this PDF in the exam room after clicking "Ready to
              Start".
            </p>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="file"
                accept="application/pdf"
                id="qp-file-input"
                onChange={(e) => setQpFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="qp-file-input"
                className="flex-1 py-2 px-3 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-lg text-xs font-semibold cursor-pointer truncate text-slate-300 transition"
              >
                {qpFile ? qpFile.name : 'Select Question Paper PDF...'}
              </label>
              {qpFile && (
                <button
                  onClick={handleUploadQP}
                  disabled={uploadQPMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadQPMutation.isPending ? 'Uploading...' : 'Upload QP'}
                </button>
              )}
            </div>
          </div>

          {/* Answer Key Section */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Answer Key (PDF)
              </h4>
              {exam.answerKeyFileId ? (
                <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold rounded-full flex items-center gap-1">
                  <FileCheck className="w-3 h-3" /> Uploaded to Supabase
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 text-[11px] font-bold rounded-full">
                  Optional
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Answer key PDF for tutors and evaluator reference during mark evaluation.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="file"
                accept="application/pdf"
                id="ak-file-input"
                onChange={(e) => setAkFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="ak-file-input"
                className="flex-1 py-2 px-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-lg text-xs font-semibold cursor-pointer truncate text-slate-300 transition"
              >
                {akFile ? akFile.name : 'Select Answer Key PDF...'}
              </label>
              {akFile && (
                <button
                  onClick={handleUploadAK}
                  disabled={uploadAKMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1.5 shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadAKMutation.isPending ? 'Uploading...' : 'Upload Key'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
}
