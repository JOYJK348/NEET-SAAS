'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  HelpCircle,
  Loader2,
  Sparkles,
  Trophy,
  XCircle,
  ArrowLeft,
  BookOpen,
  Check,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';

export interface CbtResultQuestionReview {
  questionNumber: number;
  questionText: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
  marksAwarded: number;
  explanation: { solutionText?: string; shortExplanation?: string } | null;
}

export interface CbtResultData {
  examId: string;
  examTitle: string;
  resultStatus: 'PASS' | 'FAIL' | 'EVALUATED';
  totalMarks: number;
  obtainedMarks: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  percentage: number;
  rank: number | null;
  passingMarks: number;
  passFail: string;
  questionsReview: CbtResultQuestionReview[];
}

interface StudentCbtResultProps {
  examId: string;
  onBack: () => void;
}

function cleanResultQuestionText(rawText: string) {
  if (!rawText) return { text: '', subjectTag: null };
  let cleaned = rawText.trim();
  let subjectTag: string | null = null;

  const matchSubject = cleaned.match(/^\[(.*?)\]\s*/);
  if (matchSubject) {
    subjectTag = matchSubject[1];
    cleaned = cleaned.replace(/^\[(.*?)\]\s*/, '');
  }

  cleaned = cleaned.replace(/^(?:Q\.?\s*)?\d+[\.\)]\s*/i, '');

  const optionSplitIndex = cleaned.search(/\s*(?:\n|\s)+(?:A\)|\[A\]|1\))\s+/i);
  if (optionSplitIndex !== -1) {
    cleaned = cleaned.substring(0, optionSplitIndex).trim();
  }

  return { text: cleaned, subjectTag };
}

function cleanResultOptionText(rawText: string, label: string) {
  if (!rawText) return '';
  let cleaned = rawText.trim();

  const labelRegex = new RegExp(`^(?:\\[?${label}\\]?|[A-D])[\\.\\)]\\s*`, 'i');
  cleaned = cleaned.replace(labelRegex, '');
  cleaned = cleaned.replace(/^\[.*?\]\s*/, '');

  return cleaned.trim();
}

export function StudentCbtResult({ examId, onBack }: StudentCbtResultProps) {
  const [result, setResult] = useState<CbtResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchResult() {
      setIsLoading(true);
      try {
        const res = await api.get<CbtResultData>(`/online-exams/${examId}/result`);
        setResult(res);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to load exam result';
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    }

    fetchResult();
  }, [examId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500 space-y-3 font-sans">
        <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
        <p className="text-sm font-extrabold text-slate-700">Evaluating Performance & Generating Detailed Scorecard...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-4 shadow-sm font-sans max-w-lg mx-auto">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900">Scorecard Pending Evaluation</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your exam attempt has been recorded. The detailed scorecard and answer key explanations will display here once evaluated.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition shadow-md cursor-pointer"
        >
          Return to Examinations
        </button>
      </div>
    );
  }

  const correctCount = Number(result.correctCount || 0);
  const wrongCount = Number(result.wrongCount || 0);
  const skippedCount = Number(result.skippedCount || 0);
  const totalMarks = Number(result.totalMarks || 0);
  const obtainedMarks = Number(result.obtainedMarks || 0);
  const percentage = Number(result.percentage || 0);

  const isPassed = result.passFail === 'PASS' || obtainedMarks >= (result.passingMarks || 0);

  return (
    <div className="w-full pb-20 space-y-5 font-sans text-[#0F172A]">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#0B2447] tracking-tight">
              Online CBT Scorecard & Solutions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
              EVALUATED
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Comprehensive breakdown of your test score, accuracy rate, rank, and step-by-step solution key.
          </p>
        </div>

        <button
          onClick={onBack}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0052CC] border border-blue-200 text-xs font-extrabold transition shadow-2xs cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#0052CC]" />
          <span>Student Exams Dashboard</span>
        </button>
      </div>

      {/* Score Hero Banner (Clean Light Theme) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-full text-xs font-extrabold text-[#0052CC] border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-[#0052CC]" /> Official NTA CBT Result Performance
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-[#0B2447]">{result.examTitle}</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-lg leading-relaxed">
            Detailed evaluation of your answer sheet, question marks, and rank standings.
          </p>
        </div>

        {/* Big Score Badge (Light Clean Theme) */}
        <div className="bg-blue-50/80 border border-blue-200 p-5 rounded-2xl sm:rounded-3xl text-center shrink-0 min-w-44 shadow-2xs space-y-1">
          <div className="text-3xl sm:text-4xl font-black text-[#0B2447]">
            {obtainedMarks} <span className="text-base text-slate-500 font-bold">/ {totalMarks}</span>
          </div>
          <div className="text-xs font-black text-[#0052CC]">{percentage.toFixed(1)}% Marks</div>
          <div
            className={`mt-2 inline-block px-3.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider ${
              isPassed ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-rose-600 text-white shadow-2xs'
            }`}
          >
            {isPassed ? 'PASSED 🏆' : 'NEEDS PRACTICE'}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Correct</span>
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <p className="text-2xl font-black text-[#0B2447]">{correctCount}</p>
          <p className="text-xs text-emerald-600 font-extrabold">+{correctCount * 4} Marks</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Wrong</span>
            <XCircle className="w-4.5 h-4.5" />
          </div>
          <p className="text-2xl font-black text-[#0B2447]">{wrongCount}</p>
          <p className="text-xs text-rose-500 font-extrabold">-{wrongCount * 1} Deducted</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Unattempted</span>
            <AlertCircle className="w-4.5 h-4.5" />
          </div>
          <p className="text-2xl font-black text-[#0B2447]">{skippedCount}</p>
          <p className="text-xs text-slate-400 font-bold">0 Marks</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#0052CC]">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Batch Rank</span>
            <Trophy className="w-4.5 h-4.5" />
          </div>
          <p className="text-2xl font-black text-[#0B2447]">#{result.rank || 1}</p>
          <p className="text-xs text-[#0052CC] font-bold">Top Percentile</p>
        </Card>
      </div>

      {/* Question-by-Question Solution Review Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200/90 pb-3 gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC] flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#0B2447]">
                Question-by-Question Solution & Explanation Review
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Review your answers, correct options, and step-by-step explanations
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-[#0052CC] font-black text-xs rounded-xl">
            {result.questionsReview?.length || 0} Questions Total
          </span>
        </div>

        <div className="space-y-3">
          {result.questionsReview?.map((q, idx) => {
            const isExpanded = expandedIndex === idx;
            const { text: cleanQText, subjectTag } = cleanResultQuestionText(q.questionText);

            const statusBadge = q.isCorrect ? (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                CORRECT (+{q.marksAwarded || 4})
              </span>
            ) : q.selectedOption ? (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                WRONG ({q.marksAwarded || -1}) • Selected: {q.selectedOption}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-300">
                UNATTEMPTED (0)
              </span>
            );

            return (
              <Card
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition"
              >
                {/* Question Header Bar */}
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        q.isCorrect
                          ? 'bg-emerald-600 text-white shadow-md'
                          : q.selectedOption
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {q.questionNumber}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {subjectTag && (
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold rounded-md">
                            {subjectTag}
                          </span>
                        )}
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {cleanQText}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {statusBadge}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details & Solutions */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/60 space-y-4 text-xs">
                    <div className="font-medium text-slate-900 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm">
                      <p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider mb-1.5">
                        Question {q.questionNumber}:
                      </p>
                      {cleanQText}
                    </div>

                    {/* Options Review Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt) => {
                        const cleanedOptText = cleanResultOptionText(opt.text, opt.label);
                        const isUserChoice = q.selectedOption === opt.label;
                        const isCorrectChoice = opt.isCorrect || opt.label === q.correctOption;

                        let optClass = 'bg-white border-slate-200 text-slate-800';
                        if (isCorrectChoice) {
                          optClass = 'bg-emerald-50/90 border-emerald-400 text-emerald-900 font-extrabold ring-1 ring-emerald-400/40';
                        } else if (isUserChoice) {
                          optClass = 'bg-rose-50/90 border-rose-400 text-rose-900 font-extrabold ring-1 ring-rose-400/40';
                        }

                        return (
                          <div
                            key={opt.label}
                            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${optClass}`}
                          >
                            <span className="font-black text-xs shrink-0 w-5">{opt.label}.</span>
                            <span className="flex-1 font-medium leading-relaxed">{cleanedOptText}</span>
                            {isCorrectChoice && (
                              <span className="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-md shrink-0">
                                CORRECT
                              </span>
                            )}
                            {isUserChoice && !isCorrectChoice && (
                              <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded-md shrink-0">
                                YOUR ANSWER
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Solution Explanation Box */}
                    <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-1 text-slate-900">
                      <h5 className="font-extrabold text-blue-900 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Explanation & Solution:
                      </h5>
                      <p className="text-xs font-normal leading-relaxed text-slate-800 pt-0.5">
                        {q.explanation?.solutionText || q.explanation?.shortExplanation || 'Correct Answer is ' + q.correctOption + '.'}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
