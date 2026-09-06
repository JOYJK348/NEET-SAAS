'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  FileCheck,
  FileText,
  HelpCircle,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';

export interface ParsedOption {
  label: string;
  text: string;
}

export interface ParsedQuestionItem {
  questionNumber: number;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  options: ParsedOption[];
  correctAnswer: string | null;
  marks: number;
  negativeMarks: number;
  explanation: string | null;
  status: 'VALID' | 'WARNING' | 'NEEDS_REVIEW' | 'INVALID';
  validationMessage?: string;
}

interface BulkImportModalProps {
  examId: string;
  examTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImportModal({
  examId,
  examTitle,
  isOpen,
  onClose,
  onSuccess,
}: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ParsedQuestionItem[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<ParsedQuestionItem | null>(null);

  if (!isOpen) return null;

  const handleUploadAndParse = async () => {
    if (!file) {
      toast.error('Please select a PDF or DOCX question paper file first!');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await api.post<any>(`/online-exams/${examId}/import/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setJobId(data.jobId);
      setQuestions(data.questions || []);

      toast.success(`Successfully Extracted ${data.totalQuestionsFound || 0} Questions! ⚡`, {
        description: `${data.validCount || 0} Valid, ${data.needsReviewCount || 0} Need Review.`,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to extract questions.';
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetCorrectAnswer = (questionNumber: number, label: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.questionNumber === questionNumber) {
          return {
            ...q,
            correctAnswer: label,
            status: 'VALID',
            validationMessage: undefined,
          };
        }
        return q;
      }),
    );

    if (editingQuestion && editingQuestion.questionNumber === questionNumber) {
      setEditingQuestion((prev) => (prev ? { ...prev, correctAnswer: label, status: 'VALID' } : null));
    }
  };

  const handleCommitImport = async () => {
    if (!jobId) {
      toast.error('No parsed job ready to import.');
      return;
    }

    const validQuestions = questions.filter(
      (q) => q.status === 'VALID' || q.status === 'WARNING' || (q.status === 'NEEDS_REVIEW' && q.correctAnswer),
    );

    if (validQuestions.length === 0) {
      toast.error('No valid questions available to import. Please review answer keys first!');
      return;
    }

    setIsCommitting(true);
    try {
      const res = await api.post<any>(`/online-exams/${examId}/import/commit`, {
        jobId,
        questions,
      });

      toast.success(`Imported ${res.importedCount || validQuestions.length} Questions into Exam! 🎉`, {
        description: `Dynamic Total Marks: ${res.dynamicTotalMarks} pts.`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to commit import job.';
      toast.error(msg);
    } finally {
      setIsCommitting(false);
    }
  };

  const validCount = questions.filter((q) => q.status === 'VALID').length;
  const needsReviewCount = questions.filter(
    (q) => (q.status === 'NEEDS_REVIEW' || q.status === 'WARNING') && !q.correctAnswer,
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 text-[#0F172A] font-sans overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50">
          <div>
            <h3 className="text-base font-extrabold text-[#0B2447] flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#0052CC]" />
              Bulk Question Import & AI Parser
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{examTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-white">
          {/* Step 1: Upload File Section */}
          {questions.length === 0 ? (
            <div className="bg-slate-50 p-8 rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-4 max-w-xl mx-auto my-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-[#0052CC]">
                <FileText className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-[#0B2447]">
                  Upload Question Paper (PDF or DOCX)
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Support text & scanned PDFs with 100+ questions. Parser automatically extracts
                  questions, options, and answer keys.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  id="bulk-file-input"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="bulk-file-input"
                  className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 hover:border-blue-400 rounded-xl text-xs font-bold cursor-pointer text-slate-700 truncate transition shadow-2xs"
                >
                  {file ? file.name : 'Select PDF / DOCX File...'}
                </label>

                {file && (
                  <button
                    onClick={handleUploadAndParse}
                    disabled={isUploading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#0052CC] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Parsing Document...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-white" />
                        <span>Extract & Parse Questions</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Step 2: Interactive Validation & Preview Table */
            <div className="space-y-4">
              {/* Summary Pill Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC]">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider">
                      Parsed Questions Preview ({questions.length} Total Found)
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Review extracted options & correct answers before importing
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} Valid
                  </span>
                  {needsReviewCount > 0 && (
                    <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl flex items-center gap-1 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5" /> {needsReviewCount} Needs Review
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setQuestions([]);
                      setJobId(null);
                      setFile(null);
                    }}
                    className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 rounded-xl flex items-center gap-1 text-xs transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-upload
                  </button>
                </div>
              </div>

              {/* Questions Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[#0B2447] uppercase font-extrabold text-[10px] border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Question Text</th>
                      <th className="py-3 px-4">Options</th>
                      <th className="py-3 px-4 text-center">Answer Key</th>
                      <th className="py-3 px-4 text-center">Marks</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {questions.map((q) => {
                      const isNeedsReview = q.status === 'NEEDS_REVIEW' || !q.correctAnswer;
                      return (
                        <tr
                          key={q.questionNumber}
                          className={`transition-colors ${
                            isNeedsReview ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="py-3 px-4 font-black text-center text-[#0B2447]">
                            {q.questionNumber}
                          </td>

                          <td className="py-3 px-4 font-extrabold text-[#0B2447] max-w-xs truncate">
                            {q.questionText}
                          </td>

                          <td className="py-3 px-4 text-slate-600 font-semibold">
                            <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-[11px]">
                              {q.options.length} Options ({q.options.map((o) => o.label).join(',')})
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {q.correctAnswer ? (
                              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black rounded-lg">
                                Option {q.correctAnswer}
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                {['A', 'B', 'C', 'D'].map((lbl) => (
                                  <button
                                    key={lbl}
                                    type="button"
                                    onClick={() => handleSetCorrectAnswer(q.questionNumber, lbl)}
                                    className="px-2 py-1 bg-white border border-amber-300 text-amber-900 hover:bg-emerald-600 hover:text-white rounded-md text-[11px] font-black transition cursor-pointer"
                                  >
                                    {lbl}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center font-bold text-slate-800">
                            +{q.marks} / -{q.negativeMarks}
                          </td>

                          <td className="py-3 px-4 text-center">
                            {q.status === 'VALID' ? (
                              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold rounded-md">
                                VALID
                              </span>
                            ) : isNeedsReview ? (
                              <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-extrabold rounded-md">
                                NEEDS REVIEW
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold rounded-md">
                                INVALID
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setEditingQuestion(q)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Edit Question"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            Cancel
          </button>

          {questions.length > 0 && (
            <button
              onClick={handleCommitImport}
              disabled={isCommitting || validCount === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {isCommitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Importing Batch...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>IMPORT ALL ({validCount} VALID QUESTIONS)</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
