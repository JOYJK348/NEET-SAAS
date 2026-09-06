'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Send,
  ShieldAlert,
  Zap,
  LayoutGrid,
  X,
  BookOpen,
  Award,
  AlertCircle,
  Sparkles,
  Check,
  User as UserIcon,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

export interface CbtQuestionOption {
  id: string;
  optionLabel: string;
  optionText: string;
  attachmentId?: string | null;
}

export interface CbtQuestion {
  id: string;
  questionCode?: string | null;
  questionText: string;
  questionType: string;
  marks: number;
  negativeMarks: number;
  sectionId?: string | null;
  sectionName?: string | null;
  options: CbtQuestionOption[];
}

export interface CbtAttempt {
  id: string;
  examId: string;
  examTitle: string;
  durationMinutes: number;
  startedAt: string;
  expiresAt: string;
  timeRemainingSeconds: number;
  questions: CbtQuestion[];
  savedAnswers: Record<
    string,
    {
      selectedOption: string | null;
      answerStatus: 'ANSWERED' | 'NOT_ANSWERED' | 'MARKED_FOR_REVIEW' | 'ANSWERED_AND_MARKED';
    }
  >;
}

interface StudentCbtWorkspaceProps {
  examId: string;
  onSubmitted: (attemptId: string) => void;
  onExit: () => void;
}

/**
 * Clean up raw question text:
 * Strips leading question numbers (e.g. "5. ", "Q5. "), subject tags (e.g. "[Biology]"),
 * and raw embedded option text (e.g. "A) Red blood cells B)...")
 */
function cleanQuestionText(rawText: string) {
  if (!rawText) return { text: '', subjectTag: null };
  let cleaned = rawText.trim();
  let subjectTag: string | null = null;

  // Extract [Subject] tag if present at start
  const matchSubject = cleaned.match(/^\[(.*?)\]\s*/);
  if (matchSubject) {
    subjectTag = matchSubject[1];
    cleaned = cleaned.replace(/^\[(.*?)\]\s*/, '');
  }

  // Remove leading question number e.g. "5. " or "Q5. "
  cleaned = cleaned.replace(/^(?:Q\.?\s*)?\d+[\.\)]\s*/i, '');

  // Truncate embedded option strings if rawText contains "A) " or "\nA) "
  const optionSplitIndex = cleaned.search(/\s*(?:\n|\s)+(?:A\)|\[A\]|1\))\s+/i);
  if (optionSplitIndex !== -1) {
    cleaned = cleaned.substring(0, optionSplitIndex).trim();
  }

  return { text: cleaned, subjectTag };
}

/**
 * Clean up option text:
 * Strips option label prefixes (e.g. "A) ", "A. "), subject tags, or duplicate question strings
 */
function cleanOptionText(rawText: string, label: string) {
  if (!rawText) return '';
  let cleaned = rawText.trim();

  // Strip leading label prefix like "A) ", "A. ", "[A] "
  const labelRegex = new RegExp(`^(?:\\[?${label}\\]?|[A-D])[\\.\\)]\\s*`, 'i');
  cleaned = cleaned.replace(labelRegex, '');

  // Strip subject tag if repeated
  cleaned = cleaned.replace(/^\[.*?\]\s*/, '');

  return cleaned.trim();
}

export function StudentCbtWorkspace({
  examId,
  onSubmitted,
  onExit,
}: StudentCbtWorkspaceProps) {
  const { user } = useAuthStore();
  const candidateName = user ? `${user.firstName} ${user.lastName}`.trim() : 'NEET Candidate';

  const [attempt, setAttempt] = useState<CbtAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<string>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [acceptedInstructions, setAcceptedInstructions] = useState(false);

  const [answers, setAnswers] = useState<
    Record<
      string,
      {
        selectedOption: string | null;
        answerStatus: 'ANSWERED' | 'NOT_ANSWERED' | 'MARKED_FOR_REVIEW' | 'ANSWERED_AND_MARKED';
      }
    >
  >({});
  const [visited, setVisited] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Toggle Fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // 1. Fetch or Start CBT Attempt
  useEffect(() => {
    async function initAttempt() {
      setIsLoading(true);
      try {
        const data = await api.post<CbtAttempt>(`/online-exams/${examId}/start`);
        setAttempt(data);
        setAnswers(data.savedAnswers || {});
        setTimeLeft(data.timeRemainingSeconds || data.durationMinutes * 60);

        if (data.questions && data.questions.length > 0) {
          setVisited({ [data.questions[0].id]: true });
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to start CBT attempt';
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    }

    initAttempt();
  }, [examId]);

  // 2. Countdown Timer Loop
  useEffect(() => {
    if (!isStarted || !attempt || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.warning('Time is Up! Auto-submitting exam attempt...');
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, attempt, timeLeft]);

  // Autosave helper function
  const triggerAutosave = (
    questionId: string,
    selectedOption: string | null,
    status: 'ANSWERED' | 'NOT_ANSWERED' | 'MARKED_FOR_REVIEW' | 'ANSWERED_AND_MARKED',
  ) => {
    if (!attempt) return;

    if (saveTimeoutRef.current[questionId]) {
      clearTimeout(saveTimeoutRef.current[questionId]);
    }

    saveTimeoutRef.current[questionId] = setTimeout(async () => {
      try {
        await api.put(`/online-exams/attempt/${attempt.id}/answer`, {
          questionId,
          selectedOption,
          answerStatus: status,
        });
      } catch (err) {
        console.error('Autosave failed for question', questionId, err);
      }
    }, 400);
  };

  const handleSelectOption = (questionId: string, optionLabel: string) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      const isSelected = current?.selectedOption === optionLabel;
      const newOption = isSelected ? null : optionLabel;
      const newStatus =
        current?.answerStatus === 'MARKED_FOR_REVIEW' || current?.answerStatus === 'ANSWERED_AND_MARKED'
          ? newOption
            ? 'ANSWERED_AND_MARKED'
            : 'MARKED_FOR_REVIEW'
          : newOption
            ? 'ANSWERED'
            : 'NOT_ANSWERED';

      const updated = {
        ...prev,
        [questionId]: { selectedOption: newOption, answerStatus: newStatus as any },
      };

      triggerAutosave(questionId, newOption, newStatus as any);
      return updated;
    });
  };

  const handleClearAnswer = (questionId: string) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      const newStatus =
        current?.answerStatus === 'ANSWERED_AND_MARKED' || current?.answerStatus === 'MARKED_FOR_REVIEW'
          ? 'MARKED_FOR_REVIEW'
          : 'NOT_ANSWERED';

      const updated = {
        ...prev,
        [questionId]: { selectedOption: null, answerStatus: newStatus as any },
      };

      triggerAutosave(questionId, null, newStatus as any);
      return updated;
    });
  };

  const handleToggleMarkForReview = (questionId: string, advanceToNext = false) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      const hasAnswer = Boolean(current?.selectedOption);

      let newStatus: 'ANSWERED' | 'NOT_ANSWERED' | 'MARKED_FOR_REVIEW' | 'ANSWERED_AND_MARKED';

      if (current?.answerStatus === 'MARKED_FOR_REVIEW' || current?.answerStatus === 'ANSWERED_AND_MARKED') {
        newStatus = hasAnswer ? 'ANSWERED' : 'NOT_ANSWERED';
      } else {
        newStatus = hasAnswer ? 'ANSWERED_AND_MARKED' : 'MARKED_FOR_REVIEW';
      }

      const updated = {
        ...prev,
        [questionId]: { selectedOption: current?.selectedOption || null, answerStatus: newStatus },
      };

      triggerAutosave(questionId, current?.selectedOption || null, newStatus);
      return updated;
    });

    if (advanceToNext && attempt && currentIndex < attempt.questions.length - 1) {
      handleNavigate(currentIndex + 1);
    }
  };

  const handleNavigate = (newIdx: number) => {
    if (!attempt || newIdx < 0 || newIdx >= attempt.questions.length) return;
    const targetQ = attempt.questions[newIdx];
    setVisited((prev) => ({ ...prev, [targetQ.id]: true }));
    setCurrentIndex(newIdx);
    setShowMobilePalette(false);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isStarted || !attempt || showSubmitModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const currentQ = attempt.questions[currentIndex];
      if (!currentQ) return;

      if (e.key === '1' || e.key === 'a' || e.key === 'A') {
        const opt = currentQ.options.find((o) => o.optionLabel === 'A');
        if (opt) handleSelectOption(currentQ.id, 'A');
      } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
        const opt = currentQ.options.find((o) => o.optionLabel === 'B');
        if (opt) handleSelectOption(currentQ.id, 'B');
      } else if (e.key === '3' || e.key === 'c' || e.key === 'C') {
        const opt = currentQ.options.find((o) => o.optionLabel === 'C');
        if (opt) handleSelectOption(currentQ.id, 'C');
      } else if (e.key === '4' || e.key === 'd' || e.key === 'D') {
        const opt = currentQ.options.find((o) => o.optionLabel === 'D');
        if (opt) handleSelectOption(currentQ.id, 'D');
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < attempt.questions.length - 1) handleNavigate(currentIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) handleNavigate(currentIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, attempt, currentIndex, showSubmitModal]);

  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (!attempt) return;
    setIsSubmitting(true);
    try {
      await api.post(`/online-exams/attempt/${attempt.id}/submit`, {
        isAutoSubmit,
      });

      toast.success(isAutoSubmit ? 'Exam Auto-Submitted' : 'Exam Successfully Submitted! 🎓');
      onSubmitted(attempt.id);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit exam.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A0F1D] flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <div className="relative">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center animate-pulse shadow-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
          <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-base font-bold text-white tracking-wide">Initializing NEET CBT Exam Portal</h3>
          <p className="text-xs text-slate-400">Loading NTA standard examination environment...</p>
        </div>
      </div>
    );
  }

  if (!attempt || !attempt.questions || attempt.questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A0F1D] flex flex-col items-center justify-center text-white space-y-5 p-4 text-center font-sans">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-amber-400" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-xl font-black text-white">No Questions Found for Exam</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            This online CBT exam does not have questions populated yet. Please inform your administrator.
          </p>
        </div>
        <button
          onClick={onExit}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
        >
          Return to Exams Dashboard
        </button>
      </div>
    );
  }

  // Extract Section names from questions
  const uniqueSections = Array.from(
    new Set(
      attempt.questions
        .map((q) => q.sectionName)
        .filter((s): s is string => Boolean(s && s.trim() !== '')),
    ),
  );

  const sectionsList = uniqueSections.length > 0 ? uniqueSections : ['Physics', 'Chemistry', 'Botany', 'Zoology'];

  // Welcome / Instructions Screen (NTA Official Instructions Sheet)
  if (!isStarted) {
    const totalMarksEstimate = attempt.questions.reduce((sum, q) => sum + (Number(q.marks) || 4), 0);

    return (
      <div className="fixed inset-0 z-50 bg-[#0A0F1D] text-white flex flex-col font-sans overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between shrink-0 bg-[#0F172A]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-blue-600/30">
              NTA
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">
                NTA Standard CBT Examination Portal
              </span>
              <h1 className="text-sm sm:text-base font-black text-white truncate max-w-xs sm:max-w-md">
                {attempt.examTitle}
              </h1>
            </div>
          </div>

          <button
            onClick={onExit}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Exit Exam"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Candidate Chip */}
          <div className="bg-gradient-to-r from-blue-950/60 via-slate-900/90 to-indigo-950/50 border border-blue-500/20 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-base shadow-lg shadow-blue-600/30 shrink-0">
                {candidateName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Candidate Profile</p>
                <h3 className="text-lg font-black text-white">{candidateName}</h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Roll / ID: NEET-{(attempt.id || '000').slice(-6).toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl shrink-0">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">
                Timer Auto-Starts on Launch
              </span>
            </div>
          </div>

          {/* Test Meta Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl space-y-1 shadow-md">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Duration</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-white">{attempt.durationMinutes} Mins</p>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl space-y-1 shadow-md">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <BookOpen className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Questions</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-white">{attempt.questions.length} MCQs</p>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl space-y-1 shadow-md">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Award className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Marks</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-white">{totalMarksEstimate} Marks</p>
            </div>

            <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl space-y-1 shadow-md">
              <div className="flex items-center gap-1.5 text-purple-400">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Marking Scheme</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-white">+4 / -1</p>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-4 shadow-md">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <AlertCircle className="w-4 h-4 text-cyan-400" />
              Official Examination Instructions & Rules
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                <p>
                  <strong>Server Timer:</strong> Countdown clock displays remaining duration. Test auto-submits when timer completes.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                <p>
                  <strong>Color Legend:</strong>
                  <span className="inline-flex items-center gap-1.5 mx-1 px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[11px]">Green = Answered</span>
                  <span className="inline-flex items-center gap-1.5 mx-1 px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[11px]">Red = Not Answered</span>
                  <span className="inline-flex items-center gap-1.5 mx-1 px-2 py-0.5 rounded bg-purple-600 text-white font-bold text-[11px]">Purple = Marked for Review</span>
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                <p>
                  <strong>Autosave Engine:</strong> Your selected answers are instantly saved to the database in real time.
                </p>
              </div>
            </div>

            {/* Checkbox Declaration */}
            <label className="flex items-start gap-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 cursor-pointer hover:border-blue-500/40 transition">
              <input
                type="checkbox"
                checked={acceptedInstructions}
                onChange={(e) => setAcceptedInstructions(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900 mt-0.5 shrink-0"
              />
              <span className="text-xs text-slate-300 font-semibold leading-relaxed">
                I have read and agree to follow all examination rules and candidate code of conduct.
              </span>
            </label>
          </div>

          {/* Action CTA */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onExit}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
            >
              Cancel & Exit
            </button>

            <button
              disabled={!acceptedInstructions}
              onClick={() => setIsStarted(true)}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-xl shadow-blue-600/30 transition cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>Start CBT Exam Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = attempt.questions[currentIndex];
  const currentAnswer = answers[currentQ.id];
  const selectedOpt = currentAnswer?.selectedOption || null;

  // Clean question & option strings dynamically
  const { text: formattedQuestionText, subjectTag } = cleanQuestionText(currentQ.questionText);

  // 5 NTA states calculation
  const totalQ = attempt.questions.length;
  let answeredCount = 0;
  let notAnsweredCount = 0;
  let markedForReviewCount = 0;
  let answeredAndMarkedCount = 0;
  let notVisitedCount = 0;

  attempt.questions.forEach((q) => {
    const ans = answers[q.id];
    const isVis = visited[q.id];
    const hasOpt = Boolean(ans?.selectedOption);
    const status = ans?.answerStatus;

    if (hasOpt && (status === 'ANSWERED_AND_MARKED' || status === 'MARKED_FOR_REVIEW')) {
      answeredAndMarkedCount++;
    } else if (!hasOpt && status === 'MARKED_FOR_REVIEW') {
      markedForReviewCount++;
    } else if (hasOpt) {
      answeredCount++;
    } else if (isVis) {
      notAnsweredCount++;
    } else {
      notVisitedCount++;
    }
  });

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const timerDisplay =
    hours > 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isTimeCritical = timeLeft < 300; // less than 5 minutes

  const handleSelectSection = (secName: string) => {
    setActiveSection(secName);
    if (!attempt || secName === 'ALL') return;
    const firstIdx = attempt.questions.findIndex((q) => q.sectionName === secName);
    if (firstIdx !== -1) {
      handleNavigate(firstIdx);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0F1D] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Header Bar - NTA Standard Clean Header */}
      <header className="h-14 sm:h-16 bg-[#0F172A] border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md shrink-0">
            CBT
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-black text-white truncate max-w-[140px] sm:max-w-md">
              {attempt.examTitle}
            </h1>
            <p className="text-[10px] text-cyan-400 font-semibold truncate hidden sm:block">
              NEET Online Examination Engine
            </p>
          </div>
        </div>

        {/* Center Digital Clock Timer */}
        <div
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border font-mono font-black text-xs sm:text-sm transition shadow-inner ${
            isTimeCritical
              ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse'
              : 'bg-slate-950 border-slate-700/80 text-cyan-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{timerDisplay}</span>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Question Palette Trigger Button */}
          <button
            type="button"
            onClick={() => setShowMobilePalette(true)}
            className="md:hidden px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <LayoutGrid className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px]">{answeredCount + answeredAndMarkedCount}/{totalQ}</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition hidden sm:flex items-center gap-1 cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Maximize Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black tracking-wide uppercase shadow-lg shadow-emerald-600/30 transition cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Submit Exam</span>
            <span className="sm:hidden">Submit</span>
          </button>
        </div>
      </header>

      {/* Subject / Section Filter Pill Bar */}
      <div className="bg-[#0F172A]/90 border-b border-slate-800 px-3 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wider pr-1 shrink-0">
          Subjects:
        </span>

        <button
          type="button"
          onClick={() => handleSelectSection('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer shrink-0 ${
            activeSection === 'ALL'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All ({totalQ})
        </button>

        {sectionsList.map((sec) => {
          const secQCount = attempt.questions.filter((q) => q.sectionName === sec).length;
          const secAnsCount = attempt.questions.filter(
            (q) => q.sectionName === sec && Boolean(answers[q.id]?.selectedOption),
          ).length;
          const isActive = activeSection === sec;

          return (
            <button
              key={sec}
              type="button"
              onClick={() => handleSelectSection(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{sec}</span>
              <span className="px-1.5 py-0.2 bg-white/20 text-white text-[10px] font-black rounded-md">
                {secAnsCount}/{secQCount || attempt.questions.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Container: Question & Options Workspace */}
        <div className="flex-1 flex flex-col bg-[#0A0F1D] overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-5 pb-24 md:pb-6">
          {/* Question Header Meta */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-black rounded-xl">
                Question {currentIndex + 1} of {totalQ}
              </span>
              {(subjectTag || currentQ.sectionName) && (
                <span className="px-2.5 py-1 bg-slate-800 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700">
                  {subjectTag || currentQ.sectionName}
                </span>
              )}
            </div>

            <div className="text-xs text-slate-300 font-bold flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
              <span>Marks: <strong className="text-emerald-400">+{currentQ.marks}</strong></span>
              <span>Negative: <strong className="text-rose-400">-{currentQ.negativeMarks}</strong></span>
            </div>
          </div>

          {/* Question Text Box */}
          <div className="bg-[#0F172A] border border-slate-800 p-4 sm:p-6 rounded-2xl text-sm sm:text-base font-medium text-slate-100 leading-relaxed shadow-lg">
            <p className="whitespace-pre-line leading-relaxed">{formattedQuestionText}</p>
          </div>

          {/* MCQ Options List */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Select Your Answer:
              </h4>
              <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                Press A, B, C, D to select
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
              {currentQ.options.map((opt) => {
                const isSelected = selectedOpt === opt.optionLabel;
                const cleanedOptText = cleanOptionText(opt.optionText, opt.optionLabel);

                // Skip option if it duplicates the full question text due to parsing errors
                if (cleanedOptText === formattedQuestionText && currentQ.options.length > 4) {
                  return null;
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, opt.optionLabel)}
                    className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/50 shadow-lg'
                        : 'bg-[#0F172A] border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md scale-105'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {opt.optionLabel}
                    </span>
                    <span className="pt-1 leading-relaxed font-normal">{cleanedOptText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Navigation Footer */}
          <div className="hidden md:flex pt-4 items-center justify-between gap-3 border-t border-slate-800/90 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleClearAnswer(currentQ.id)}
                disabled={!selectedOpt}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear Response
              </button>

              <button
                type="button"
                onClick={() => handleToggleMarkForReview(currentQ.id, true)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  answers[currentQ.id]?.answerStatus === 'MARKED_FOR_REVIEW' ||
                  answers[currentQ.id]?.answerStatus === 'ANSWERED_AND_MARKED'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-extrabold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Flag className="w-3.5 h-3.5" /> Mark for Review & Next
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavigate(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <button
                type="button"
                onClick={() => handleNavigate(currentIndex + 1)}
                disabled={currentIndex === totalQ - 1}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/30"
              >
                Save & Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar (Question Palette) */}
        <div className="hidden md:flex w-80 lg:w-88 bg-[#0F172A] border-l border-slate-800 p-4 flex-col shrink-0 justify-between h-full overflow-hidden space-y-4">
          {/* Candidate Card */}
          <div className="bg-[#0A0F1D] p-3 rounded-2xl border border-slate-800 flex items-center gap-3 shadow-sm shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-md shrink-0">
              {candidateName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-white truncate">{candidateName}</p>
              <p className="text-[10px] text-cyan-400 font-mono font-bold mt-0.5 truncate">
                ID: NEET-{(attempt.id || '000').slice(-6).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Palette Legend */}
          <div className="space-y-2 shrink-0">
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Question Legend
            </h3>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="w-3.5 h-3.5 rounded bg-rose-600 shrink-0" />
                <span>Not Ans ({notAnsweredCount})</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-600 shrink-0" />
                <span>Marked ({markedForReviewCount})</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-700 border border-emerald-400 shrink-0" />
                <span>Ans & Marked ({answeredAndMarkedCount})</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-2 rounded-xl border border-slate-800 text-[10px] font-bold text-slate-400">
              <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700 shrink-0" />
              <span>Not Visited ({notVisitedCount})</span>
            </div>
          </div>

          {/* Palette Numbers Grid Container */}
          <div className="flex-1 min-h-0 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-400 shrink-0">
              <span>Question Palette</span>
              <span>{activeSection !== 'ALL' ? activeSection : 'All Questions'}</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-5 gap-2">
                {attempt.questions.map((q, idx) => {
                  if (activeSection !== 'ALL' && q.sectionName && q.sectionName !== activeSection) {
                    return null;
                  }

                  const qAns = answers[q.id];
                  const isCurrent = idx === currentIndex;
                  const hasOpt = Boolean(qAns?.selectedOption);
                  const status = qAns?.answerStatus;
                  const isVis = visited[q.id];

                  let bgClass = 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700';
                  if (hasOpt && (status === 'ANSWERED_AND_MARKED' || status === 'MARKED_FOR_REVIEW')) {
                    bgClass = 'bg-purple-700 text-white border-emerald-400 font-black relative';
                  } else if (!hasOpt && status === 'MARKED_FOR_REVIEW') {
                    bgClass = 'bg-purple-600 text-white border-purple-400 font-black';
                  } else if (hasOpt) {
                    bgClass = 'bg-emerald-600 text-white border-emerald-400 font-black';
                  } else if (isVis) {
                    bgClass = 'bg-rose-600 text-white border-rose-500 font-extrabold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleNavigate(idx)}
                      className={`h-9 rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer relative ${bgClass} ${
                        isCurrent ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 scale-105' : ''
                      }`}
                    >
                      {idx + 1}
                      {hasOpt && (status === 'ANSWERED_AND_MARKED' || status === 'MARKED_FOR_REVIEW') && (
                        <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Submit Test Button */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" /> Submit Examination
          </button>
        </div>
      </div>

      {/* Mobile Sticky Navigation Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F172A] border-t border-slate-800 p-2.5 flex items-center justify-between gap-2 shadow-2xl backdrop-blur-lg">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleNavigate(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer border border-slate-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => handleToggleMarkForReview(currentQ.id, false)}
            className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center border cursor-pointer ${
              answers[currentQ.id]?.answerStatus === 'MARKED_FOR_REVIEW' ||
              answers[currentQ.id]?.answerStatus === 'ANSWERED_AND_MARKED'
                ? 'bg-purple-600/40 border-purple-500 text-purple-200'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
            title="Mark for Review"
          >
            <Flag className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => handleClearAnswer(currentQ.id)}
            disabled={!selectedOpt}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer border border-slate-700"
            title="Clear Answer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleNavigate(currentIndex + 1)}
          disabled={currentIndex === totalQ - 1}
          className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shadow-lg shadow-blue-600/30 cursor-pointer"
        >
          Save & Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Question Palette Drawer Modal */}
      {showMobilePalette && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex justify-end md:hidden">
          <div className="w-full max-w-xs bg-[#0F172A] h-full p-4 flex flex-col space-y-4 shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black text-white">Question Palette</h3>
              </div>
              <button
                onClick={() => setShowMobilePalette(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Card */}
            <div className="bg-[#0A0F1D] p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                {candidateName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-white truncate">{candidateName}</p>
                <p className="text-[10px] text-cyan-400 font-mono font-bold truncate">
                  ID: NEET-{(attempt.id || '000').slice(-6).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Status Legend */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="w-3 h-3 rounded bg-emerald-600 shrink-0" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="w-3 h-3 rounded bg-rose-600 shrink-0" />
                <span>Not Ans ({notAnsweredCount})</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0" />
                <span>Marked ({markedForReviewCount})</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 p-2 rounded-xl border border-slate-800">
                <span className="w-3 h-3 rounded-full bg-purple-700 border border-emerald-400 shrink-0" />
                <span>Ans & Marked ({answeredAndMarkedCount})</span>
              </div>
            </div>

            {/* Palette Numbers Grid */}
            <div className="flex-1 space-y-2">
              <p className="text-[11px] font-black uppercase text-slate-400">Select Question</p>
              <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto pr-1">
                {attempt.questions.map((q, idx) => {
                  if (activeSection !== 'ALL' && q.sectionName && q.sectionName !== activeSection) {
                    return null;
                  }

                  const qAns = answers[q.id];
                  const isCurrent = idx === currentIndex;
                  const hasOpt = Boolean(qAns?.selectedOption);
                  const status = qAns?.answerStatus;
                  const isVis = visited[q.id];

                  let bgClass = 'bg-slate-800 text-slate-400 border-slate-700';
                  if (hasOpt && (status === 'ANSWERED_AND_MARKED' || status === 'MARKED_FOR_REVIEW')) {
                    bgClass = 'bg-purple-700 text-white border-emerald-400 font-black relative';
                  } else if (!hasOpt && status === 'MARKED_FOR_REVIEW') {
                    bgClass = 'bg-purple-600 text-white border-purple-400 font-black';
                  } else if (hasOpt) {
                    bgClass = 'bg-emerald-600 text-white border-emerald-400 font-black';
                  } else if (isVis) {
                    bgClass = 'bg-rose-600 text-white border-rose-500 font-extrabold';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleNavigate(idx)}
                      className={`h-9 rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer relative ${bgClass} ${
                        isCurrent ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 scale-105' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setShowMobilePalette(false);
                setShowSubmitModal(true);
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" /> Submit Exam
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Submit Examination?</h3>
              <p className="text-xs text-slate-400 font-medium">
                Are you sure you want to finalize and submit your NEET CBT Test?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-xs font-bold text-slate-300">
              <div>Total MCQs: <span className="text-white">{totalQ}</span></div>
              <div>Answered: <span className="text-emerald-400">{answeredCount + answeredAndMarkedCount}</span></div>
              <div>Marked Review: <span className="text-purple-400">{markedForReviewCount + answeredAndMarkedCount}</span></div>
              <div>Unanswered: <span className="text-rose-400">{totalQ - (answeredCount + answeredAndMarkedCount)}</span></div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Return to Test
              </button>

              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
