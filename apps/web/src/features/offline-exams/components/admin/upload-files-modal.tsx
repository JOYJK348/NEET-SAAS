'use client';

import { useState } from 'react';
import {
  useAdminExamDetail,
  useUploadAnswerKey,
  useUploadQuestionPaper,
} from '../../hooks/use-admin-exams';
import type { ExamItem } from '../../types/admin-exams';
import { Eye, FileCheck, FileText, Upload, X } from 'lucide-react';

interface UploadFilesModalProps {
  exam: ExamItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UploadFilesModal({ exam, isOpen, onClose }: UploadFilesModalProps) {
  const [qpFile, setQpFile] = useState<File | null>(null);
  const [akFile, setAkFile] = useState<File | null>(null);

  const { data: detail } = useAdminExamDetail(exam?.id || '');

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

  const qpSignedUrl = detail?.questionPaperSignedUrl;
  const akSignedUrl = detail?.answerKeySignedUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 text-[#0F172A] font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50">
          <div>
            <h3 className="text-base font-extrabold text-[#0B2447] flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#0052CC]" />
              Upload & View Exam Documents
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{exam.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-white">
          {/* Question Paper Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-[#0B2447] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0052CC]" />
                Question Paper (PDF)
              </h4>
              <div className="flex items-center gap-2">
                {qpSignedUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(qpSignedUrl, '_blank')}
                    className="px-3 py-1 bg-blue-50 border border-blue-200 text-[#0052CC] hover:bg-blue-100 text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> View QP
                  </button>
                )}
                {exam.questionPaperFileId ? (
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold rounded-full flex items-center gap-1">
                    <FileCheck className="w-3 h-3" /> Uploaded & Verified
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold rounded-full">
                    Missing PDF
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium">
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
                className="flex-1 py-2 px-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-semibold cursor-pointer truncate text-slate-700 transition shadow-2xs"
              >
                {qpFile ? qpFile.name : 'Select Question Paper PDF...'}
              </label>
              {qpFile && (
                <button
                  onClick={handleUploadQP}
                  disabled={uploadQPMutation.isPending}
                  className="px-4 py-2 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-2xs transition flex items-center gap-1.5 shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadQPMutation.isPending ? 'Uploading...' : 'Upload QP'}
                </button>
              )}
            </div>
          </div>

          {/* Answer Key Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-[#0B2447] flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Answer Key (PDF)
              </h4>
              <div className="flex items-center gap-2">
                {akSignedUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(akSignedUrl, '_blank')}
                    className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold rounded-lg transition inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Key
                  </button>
                )}
                {exam.answerKeyFileId ? (
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold rounded-full flex items-center gap-1">
                    <FileCheck className="w-3 h-3" /> Uploaded & Verified
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-slate-200 text-slate-600 text-[11px] font-bold rounded-full">
                    Optional
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium">
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
                className="flex-1 py-2 px-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-semibold cursor-pointer truncate text-slate-700 transition shadow-2xs"
              >
                {akFile ? akFile.name : 'Select Answer Key PDF...'}
              </label>
              {akFile && (
                <button
                  onClick={handleUploadAK}
                  disabled={uploadAKMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-2xs transition flex items-center gap-1.5 shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploadAKMutation.isPending ? 'Uploading...' : 'Upload Key'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
}
