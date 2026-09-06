'use client';

import { useEffect, useState } from 'react';
import { useEvaluateSubmission, useTutorSubmissionDetail } from '../../hooks/use-tutor-exams';
import type { SectionMarksBreakdownInput, CbtQuestionBreakdownItem } from '../../types/tutor-exams';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  History,
  Laptop,
  Lock,
  MinusCircle,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

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

interface TutorEvaluationWorkspaceProps {
  examId: string;
  submissionId: string;
}

export function TutorEvaluationWorkspace({ examId, submissionId }: TutorEvaluationWorkspaceProps) {
  const { data: detail, isLoading, refetch } = useTutorSubmissionDetail(examId, submissionId);
  const evaluateMutation = useEvaluateSubmission();

  const [sectionMarks, setSectionMarks] = useState<SectionMarksBreakdownInput[]>([]);
  const [tutorNotes, setTutorNotes] = useState('');
  const [pdfExpanded, setPdfExpanded] = useState(false);
  const [showAnswerKeyModal, setShowAnswerKeyModal] = useState(false);

  // CBT Response Filter State
  const [cbtFilter, setCbtFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'SKIPPED'>('ALL');
  const [cbtSearchQuery, setCbtSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (detail) {
      const config = (detail.sectionConfig || []) as any[];
      const rawBreakdown = (detail.marksBreakdown || []) as any[];
      const studentTotalObtained = Number(detail.obtainedMarks || 0);

      const breakdownSum = rawBreakdown.reduce(
        (sum, item) => sum + Number(item.obtainedMarks || 0),
        0,
      );

      const hasValidBreakdown =
        rawBreakdown.length > 0 &&
        (breakdownSum > 0 || (rawBreakdown.length > 1 && rawBreakdown[0].sectionName !== 'General Section'));

      if (hasValidBreakdown) {
        setSectionMarks(
          rawBreakdown.map((item, idx) => {
            const matchedConfig = config[idx] || {};
            const secName =
              item.sectionName && item.sectionName !== 'Section'
                ? item.sectionName
                : matchedConfig.name || matchedConfig.sectionName || `Section ${idx + 1}`;
            const secMax = Number(
              matchedConfig.maxMarks ?? matchedConfig.marks ?? item.maxMarks ?? 100,
            );

            return {
              sectionId: item.sectionId || item.id || matchedConfig.id || matchedConfig.sectionId,
              sectionName: secName,
              obtainedMarks: Number(item.obtainedMarks ?? 0),
              maxMarks: secMax > 0 ? secMax : 100,
            };
          }),
        );
      } else if (config.length > 0) {
        // Manual entry per configured section (NO auto-split!)
        setSectionMarks(
          config.map((sec, idx) => {
            const secMax = Number(sec.maxMarks ?? sec.marks ?? sec.totalMarks ?? 100);
            return {
              sectionId: sec.sectionId || sec.id || `sec-${idx}`,
              sectionName: sec.name || sec.sectionName || `Section ${idx + 1}`,
              obtainedMarks: 0, // Must be entered manually by tutor!
              maxMarks: secMax > 0 ? secMax : 100,
            };
          }),
        );
      } else {
        // Default standard NEET subjects if sectionConfig is empty (NO auto-split!)
        const total = Number(detail.totalMarks || 720);
        const perSubjectMax = Math.max(1, Math.floor(total / 4));
        const subjects = ['Physics', 'Chemistry', 'Botany', 'Zoology'];

        setSectionMarks(
          subjects.map((subName, idx) => ({
            sectionId: `sec-subject-${idx}`,
            sectionName: subName,
            obtainedMarks: 0, // Must be entered manually by tutor!
            maxMarks: perSubjectMax,
          })),
        );
      }

      setTutorNotes(detail.tutorNotes || '');
    }
  }, [detail]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto animate-pulse">
            <FileText className="w-5 h-5 text-[#0052CC]" />
          </div>
          <p className="text-slate-500 font-semibold text-sm">Loading evaluation workspace...</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 font-medium text-sm">Submission not found.</p>
      </div>
    );
  }

  const isOnlineExam = detail.examMode === 'ONLINE' || (detail.cbtBreakdown && detail.cbtBreakdown.length > 0);
  const calculatedTotalMarks = isOnlineExam
    ? Number(detail.obtainedMarks || 0)
    : sectionMarks.reduce((sum, sec) => sum + Number(sec.obtainedMarks || 0), 0);

  const handleMarksChange = (index: number, val: number) => {
    const updated = [...sectionMarks];
    const max = updated[index].maxMarks;
    const clamped = Math.max(0, Math.min(max, val));
    updated[index].obtainedMarks = clamped;
    setSectionMarks(updated);
  };

  const handleSaveEvaluation = () => {
    evaluateMutation.mutate({
      examId,
      submissionId,
      data: {
        obtainedMarks: calculatedTotalMarks,
        marksBreakdown: isOnlineExam ? (detail.marksBreakdown as any) : sectionMarks,
        tutorNotes,
      },
    });
  };

  const isReadOnly = detail.isEvaluationLocked || detail.evaluationApproved;

  // Filter CBT breakdown questions
  const rawCbtList: CbtQuestionBreakdownItem[] = detail.cbtBreakdown || [];
  const filteredCbtList = rawCbtList.filter((item) => {
    const matchesFilter =
      cbtFilter === 'ALL' ||
      (cbtFilter === 'CORRECT' && item.isCorrect) ||
      (cbtFilter === 'INCORRECT' && !item.isCorrect && item.selectedOption) ||
      (cbtFilter === 'SKIPPED' && !item.selectedOption);

    const matchesSearch =
      !cbtSearchQuery ||
      item.questionText.toLowerCase().includes(cbtSearchQuery.toLowerCase()) ||
      String(item.questionIndex).includes(cbtSearchQuery);

    return matchesFilter && matchesSearch;
  });

  const correctCount = detail.cbtStats?.correct ?? rawCbtList.filter((q) => q.isCorrect).length;
  const wrongCount = detail.cbtStats?.wrong ?? rawCbtList.filter((q) => !q.isCorrect && q.selectedOption).length;
  const skippedCount = detail.cbtStats?.skipped ?? rawCbtList.filter((q) => !q.selectedOption).length;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      {/* ── Top Navbar ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-xs">
        {/* Mobile Navbar */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 gap-2">
          <Link
            href={`/dashboard/tutor/exams/${examId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200 transition shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Back</span>
          </Link>

          <div className="flex-1 min-w-0 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-xs font-black text-slate-900 truncate">{detail.examTitle}</span>
              {isOnlineExam ? (
                <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-extrabold shrink-0">
                  CBT
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-extrabold shrink-0">
                  OMR
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-semibold truncate">{detail.studentName}</p>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            {isOnlineExam ? (
              <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-black rounded-xl flex items-center gap-1">
                <Laptop className="w-3 h-3 text-purple-600" /> Auto-Graded CBT
              </span>
            ) : isReadOnly ? (
              <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-black rounded-xl flex items-center gap-1">
                <Lock className="w-3 h-3" /> Read-Only
              </span>
            ) : (
              <button
                onClick={handleSaveEvaluation}
                disabled={evaluateMutation.isPending}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[11px] font-black shadow-2xs transition flex items-center gap-1 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                {evaluateMutation.isPending ? 'Saving...' : 'Save Evaluation'}
              </button>
            )}
          </div>
        </div>

        {/* Desktop Navbar */}
        <div className="hidden md:flex items-center justify-between px-6 py-3 gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/tutor/exams/${examId}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4 text-[#0052CC]" />
              Back to Submissions
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  {detail.examTitle} — {isOnlineExam ? 'CBT Scorecard & Audit' : 'Evaluation Workspace'}
                </h2>
                {isOnlineExam ? (
                  <span className="px-2.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-extrabold rounded-full flex items-center gap-1">
                    <Laptop className="w-3.5 h-3.5" /> ONLINE CBT (Auto-Calculated)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold rounded-full">
                    📝 OFFLINE OMR
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Student: <span className="text-slate-800 font-semibold">{detail.studentName}</span>{' '}
                ({detail.studentAdmissionId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {detail.answerKeySignedUrl && (
              <button
                type="button"
                onClick={() => setShowAnswerKeyModal(true)}
                className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>View Answer Key PDF</span>
              </button>
            )}
            {isOnlineExam ? (
              <span className="px-3.5 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-2xs">
                <Laptop className="w-3.5 h-3.5 text-purple-600" /> Auto-Graded CBT Scorecard
              </span>
            ) : isReadOnly ? (
              <span className="px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold rounded-full flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Read-Only
              </span>
            ) : (
              <button
                onClick={handleSaveEvaluation}
                disabled={evaluateMutation.isPending}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-2xs transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {evaluateMutation.isPending ? 'Saving...' : 'Save Evaluation'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── ONLINE CBT VIEW ─────────────────────────────────────────────── */}
      {isOnlineExam ? (
        <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Banner Info */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 p-4 sm:p-5 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 shrink-0">
                <Laptop className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-extrabold text-[#0B2447]">
                  Auto-Graded CBT Performance Scorecard
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Answers were automatically evaluated by the CBT examination engine upon student submission.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1 bg-white border border-purple-200 text-purple-800 text-xs font-extrabold rounded-xl shadow-2xs">
                Score: {calculatedTotalMarks} / {detail.totalMarks} pts
              </span>
              <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-extrabold rounded-xl shadow-2xs">
                {detail.cbtStats?.percentage ? `${detail.cbtStats.percentage.toFixed(1)}%` : 'Evaluated'}
              </span>
            </div>
          </div>

          {/* KPI Stats Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC] shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Score</p>
                <p className="text-xl font-black text-[#0B2447] mt-0.5 font-mono">
                  {calculatedTotalMarks} <span className="text-xs text-slate-400 font-normal">/ {detail.totalMarks}</span>
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correct (+4)</p>
                <p className="text-xl font-black text-emerald-700 mt-0.5 font-mono">
                  {correctCount}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incorrect (-1)</p>
                <p className="text-xl font-black text-rose-700 mt-0.5 font-mono">
                  {wrongCount}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 shrink-0">
                <MinusCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unanswered (0)</p>
                <p className="text-xl font-black text-slate-700 mt-0.5 font-mono">
                  {skippedCount}
                </p>
              </div>
            </div>
          </div>

          {/* Student Question-by-Question Response & Solution Review Section */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/90">
              <div>
                <h4 className="text-sm font-black text-[#0B2447] flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#0052CC]" />
                  Question-by-Question Solution & Student Mistake Audit
                </h4>
                <p className="text-xs text-slate-500 font-semibold">
                  Review student answers, correct option keys, and step-by-step solution explanations
                </p>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter questions..."
                    value={cbtSearchQuery}
                    onChange={(e) => setCbtSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC] transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-200/60 rounded-xl text-[11px] font-bold">
                  <button
                    onClick={() => setCbtFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      cbtFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({rawCbtList.length})
                  </button>
                  <button
                    onClick={() => setCbtFilter('CORRECT')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      cbtFilter === 'CORRECT'
                        ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Correct ({correctCount})
                  </button>
                  <button
                    onClick={() => setCbtFilter('INCORRECT')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      cbtFilter === 'INCORRECT'
                        ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Incorrect ({wrongCount})
                  </button>
                  <button
                    onClick={() => setCbtFilter('SKIPPED')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      cbtFilter === 'SKIPPED'
                        ? 'bg-slate-700 text-white shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Skipped ({skippedCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Accordion Questions List */}
            <div className="space-y-3">
              {filteredCbtList.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-semibold text-xs">
                  No questions match the selected filter criteria.
                </div>
              ) : (
                filteredCbtList.map((item, idx) => {
                  const isExpanded = expandedIndex === idx;
                  const { text: cleanQText, subjectTag } = cleanResultQuestionText(item.questionText);

                  const statusBadge = item.isCorrect ? (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      CORRECT (+{item.marksAwarded > 0 ? item.marksAwarded : 4})
                    </span>
                  ) : item.selectedOption ? (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                      WRONG ({item.marksAwarded}) • Selected: Option {item.selectedOption}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-300">
                      SKIPPED (0)
                    </span>
                  );

                  return (
                    <div
                      key={item.questionId || idx}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:border-slate-300 transition"
                    >
                      {/* Question Header Bar */}
                      <div
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              item.isCorrect
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : item.selectedOption
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {item.questionIndex}
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
                          {/* Question Text Box */}
                          <div className="font-medium text-slate-900 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm">
                            <p className="font-bold text-slate-500 text-[11px] uppercase tracking-wider mb-1.5">
                              Question {item.questionIndex}:
                            </p>
                            {cleanQText}
                          </div>

                          {/* Options Review Grid */}
                          {item.options && item.options.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {item.options.map((opt) => {
                                const cleanedOptText = cleanResultOptionText(opt.text, opt.label);
                                const isUserChoice = item.selectedOption === opt.label;
                                const isCorrectChoice = opt.isCorrect || opt.label === item.correctOption;

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
                                        CORRECT ANSWER
                                      </span>
                                    )}
                                    {isUserChoice && !isCorrectChoice && (
                                      <span className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-black rounded-md shrink-0">
                                        STUDENT ANSWER
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            /* Fallback summary box if options list is empty */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  Student Choice:
                                </span>
                                <p className="text-xs font-black text-slate-800">
                                  {item.selectedOption ? (
                                    <span className={item.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                                      Option {item.selectedOption} ({item.isCorrect ? 'Correct' : 'Incorrect'})
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic font-normal">Unanswered / Skipped</span>
                                  )}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                                  Official Answer Key:
                                </span>
                                <p className="text-xs font-black text-emerald-800">
                                  Option {item.correctOption}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Solution Explanation Box */}
                          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-1 text-slate-900">
                            <h5 className="font-extrabold text-blue-900 text-xs flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Step-by-Step Solution & Explanation:
                            </h5>
                            <p className="text-xs font-normal leading-relaxed text-slate-800 pt-0.5">
                              {item.explanation?.solutionText ||
                                item.explanation?.shortExplanation ||
                                `Correct Answer is Option ${item.correctOption}.`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── OFFLINE OMR VIEW ─────────────────────────────────────────────── */
        <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden md:h-[calc(100vh-57px)]">
          {/* ── LEFT: PDF Viewer ──────────────────────────────────────────── */}
          <div className="flex flex-col md:w-[60%] md:border-r border-slate-200 bg-slate-100/60 md:h-full">
            {/* PDF Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 gap-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
                <FileText className="w-3.5 h-3.5 text-[#0052CC]" /> Answer Sheet PDF
              </span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {detail.answerKeySignedUrl && (
                  <button
                    type="button"
                    onClick={() => setShowAnswerKeyModal(true)}
                    className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg flex items-center gap-1 text-[11px] font-bold transition cursor-pointer"
                  >
                    <Eye className="w-3 h-3 text-emerald-600" /> View Answer Key
                  </button>
                )}
                {detail.answerSheetSignedUrl && (
                  <a
                    href={detail.answerSheetSignedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg flex items-center gap-1 text-[11px] font-bold transition"
                  >
                    <ExternalLink className="w-3 h-3" /> Open Sheet
                  </a>
                )}
                {detail.answerSheetSignedUrl && (
                  <a
                    href={detail.answerSheetSignedUrl}
                    download
                    className="px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 rounded-lg flex items-center gap-1 text-[11px] font-bold transition"
                  >
                    <Download className="w-3 h-3" /> Download
                  </a>
                )}
              </div>
            </div>

            {/* PDF Frame — collapsible on mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setPdfExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700"
              >
                <span>View Answer Sheet PDF</span>
                {pdfExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {pdfExpanded && (
                <div className="p-2 bg-slate-100/60" style={{ height: '75vh' }}>
                  {detail.answerSheetSignedUrl ? (
                    <iframe
                      src={detail.answerSheetSignedUrl}
                      className="w-full h-full rounded-xl border border-slate-200 bg-white"
                      title="Student Answer Sheet"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                      No Answer Sheet PDF uploaded.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop: always visible PDF with generous height */}
            <div className="hidden md:flex flex-1 min-h-[650px] overflow-hidden p-2">
              {detail.answerSheetSignedUrl ? (
                <iframe
                  src={detail.answerSheetSignedUrl}
                  className="w-full h-full min-h-[650px] rounded-xl border border-slate-200 bg-white shadow-xs"
                  title="Student Answer Sheet"
                />
              ) : (
                <div className="w-full h-full min-h-[650px] flex items-center justify-center text-slate-400 text-sm font-medium">
                  No Answer Sheet PDF uploaded for this student.
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Evaluation Form ────────────────────────────────────── */}
          <div className="md:w-[40%] md:overflow-y-auto bg-white p-4 md:p-6 space-y-4">
            {/* ── Alert Banners ── */}
            {detail.evaluationStatus === 'RE_EVALUATION' && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                <RotateCcw className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-black text-rose-700">Returned for Re-Evaluation</p>
                  <p className="text-[11px] text-rose-600 italic mt-0.5">"{detail.rejectionReason}"</p>
                </div>
              </div>
            )}

            {isReadOnly && (
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3">
                <Lock className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-black text-purple-900">Evaluation Phase Locked</p>
                  <p className="text-[11px] text-purple-700 mt-0.5">
                    Marks have been approved or locked by tenant admin.
                  </p>
                </div>
              </div>
            )}

            {/* ── Student Profile Card ── */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-[#0052CC]" />
                </div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Student Profile</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Name</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{detail.studentName}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Admission No</p>
                  <p className="text-xs font-bold text-slate-700 font-mono mt-0.5 break-all">
                    {detail.studentAdmissionId}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Submitted</p>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">
                    {detail.submittedAt ? new Date(detail.submittedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Section Marks Entry ── */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-[#0B2447] text-white flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-blue-300" />
                    Subject-Wise Manual Mark Entry
                  </p>
                  <p className="text-[10px] text-blue-200 font-medium mt-0.5">
                    Auto-divide disabled 🛑 Must enter manual marks for each subject
                  </p>
                </div>
                <div className="flex items-baseline gap-1 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                  <span className="text-lg font-black text-amber-300 font-mono leading-none">
                    {calculatedTotalMarks}
                  </span>
                  <span className="text-xs text-blue-200 font-semibold">/ {detail.totalMarks} pts</span>
                </div>
              </div>

              <div className="p-4 space-y-3 bg-slate-50/50">
                {sectionMarks.map((sec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-3.5 gap-3 hover:border-blue-300 transition shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#0052CC]" />
                        <p className="text-xs font-black text-[#0B2447] truncate">{sec.sectionName}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 ml-4">
                        Max Allowed: {sec.maxMarks} Marks
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={sec.maxMarks}
                        disabled={isReadOnly}
                        value={sec.obtainedMarks === 0 ? '' : sec.obtainedMarks}
                        placeholder="0"
                        onChange={(e) => {
                          const rawVal = e.target.value;
                          const parsed = rawVal === '' ? 0 : Number(rawVal);
                          handleMarksChange(idx, parsed);
                        }}
                        className="w-24 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-slate-900 text-right font-mono focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 disabled:opacity-50 transition shadow-2xs placeholder:text-slate-300"
                      />
                      <span className="text-xs text-slate-500 font-bold w-8">/ {sec.maxMarks}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Tutor Remarks ── */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Tutor Remarks</p>
              </div>
              <div className="p-4">
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  placeholder="Enter optional feedback for student or admin..."
                  value={tutorNotes}
                  onChange={(e) => setTutorNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 disabled:opacity-50 font-medium resize-none transition"
                />
              </div>
            </div>

            {/* ── Mobile Save Button ── */}
            {!isReadOnly && (
              <div className="md:hidden pb-4">
                <button
                  onClick={handleSaveEvaluation}
                  disabled={evaluateMutation.isPending}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-sm font-black shadow-2xs transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {evaluateMutation.isPending ? 'Saving Evaluation...' : 'Save Evaluation'}
                </button>
              </div>
            )}

            {/* ── Audit History Log ── */}
            {detail.history && detail.history.length > 0 && (
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-[#0052CC]" />
                  <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Revision History</p>
                </div>
                <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
                  {detail.history.map((h) => (
                    <div
                      key={h.id}
                      className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">Score → {h.newMarks} pts</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(h.editedAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 italic truncate max-w-[120px]">
                        {h.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Answer Key PDF Modal ── */}
      {showAnswerKeyModal && detail.answerKeySignedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 text-[#0F172A] font-sans">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0B2447]">
                    Official Answer Key — {detail.examTitle}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Uploaded by Admin for tutor evaluation reference
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={detail.answerKeySignedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                </a>
                <button
                  onClick={() => setShowAnswerKeyModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: PDF iframe */}
            <div className="flex-1 p-3 bg-slate-100">
              <iframe
                src={detail.answerKeySignedUrl}
                className="w-full h-full rounded-xl border border-slate-200 bg-white"
                title="Exam Answer Key PDF"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowAnswerKeyModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
