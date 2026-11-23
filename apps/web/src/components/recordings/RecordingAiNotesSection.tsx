'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  HelpCircle,
  FileText,
  ListChecks,
  ChevronDown,
  ChevronUp,
  Brain,
  Atom,
  Edit3,
  Send,
  EyeOff,
  ShieldCheck,
  History,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { RecordingNotesEditor } from './RecordingNotesEditor';
import { NotionSettingsModal } from './NotionSettingsModal';

interface RecordingAiNotesSectionProps {
  recordingId: string;
}

interface AnalysisStatus {
  jobId: string | null;
  recordingId: string;
  status: 'IDLE' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  attemptNumber: number;
  progressPercentage: number;
  currentStep: string;
  error: string | null;
  hasContent: boolean;
  isStaged: boolean;
}

export function RecordingAiNotesSection({ recordingId }: RecordingAiNotesSectionProps) {
  const { user } = useAuthStore();
  const isStudent = user?.roleCode === 'STUDENT';

  // Tutor / Admin state
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [notesData, setNotesData] = useState<any | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isNotionModalOpen, setIsNotionModalOpen] = useState(false);
  const [retryingNotionSync, setRetryingNotionSync] = useState(false);

  // Student state
  const [studentNotesData, setStudentNotesData] = useState<any | null>(null);
  const [loadingStudentNotes, setLoadingStudentNotes] = useState(false);
  const [studentNotesAvailable, setStudentNotesAvailable] = useState(false);

  // View state
  const [activeTab, setActiveTab] = useState<
    'overview' | 'topics' | 'formulas' | 'definitions' | 'mcq' | 'examples' | 'checklist'
  >('overview');
  const [expandedTopics, setExpandedTopics] = useState<Record<number, boolean>>({ 0: true });

  // ─── Fetch Handlers ────────────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.get<AnalysisStatus>(`/recordings/${recordingId}/analysis-status`);
      setStatus(data);
      return data;
    } catch {
      return null;
    } finally {
      setLoadingStatus(false);
    }
  }, [recordingId]);

  const fetchTutorNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const data = await api.get<any>(`/recordings/${recordingId}/notes`);
      setNotesData(data);
    } catch {
      // Handled gracefully in UI
    } finally {
      setLoadingNotes(false);
    }
  }, [recordingId]);

  const fetchStudentNotes = useCallback(async () => {
    setLoadingStudentNotes(true);
    try {
      const data = await api.get<any>(`/recordings/${recordingId}/student-notes`);
      setStudentNotesData(data);
      setStudentNotesAvailable(true);
    } catch {
      setStudentNotesAvailable(false);
    } finally {
      setLoadingStudentNotes(false);
    }
  }, [recordingId]);

  // Initial load
  useEffect(() => {
    fetchStatus();
    if (isStudent) {
      fetchStudentNotes();
    }
  }, [isStudent, fetchStatus, fetchStudentNotes]);

  // Polling for ongoing analysis
  useEffect(() => {
    if (!status) return;

    if (status.status === 'PENDING' || status.status === 'RUNNING') {
      const interval = setInterval(async () => {
        const latest = await fetchStatus();
        if (latest?.status === 'COMPLETED' && latest.hasContent) {
          if (isStudent) {
            fetchStudentNotes();
          } else {
            fetchTutorNotes();
          }
        }
      }, 4000);
      return () => clearInterval(interval);
    }

    if (status.status === 'COMPLETED' && status.hasContent) {
      if (isStudent && !studentNotesData && !loadingStudentNotes) {
        fetchStudentNotes();
      } else if (!isStudent && !notesData && !loadingNotes) {
        fetchTutorNotes();
      }
    }
  }, [status, isStudent, fetchStatus, fetchStudentNotes, fetchTutorNotes, studentNotesData, loadingStudentNotes, notesData, loadingNotes]);

  const handleTriggerAnalysis = async () => {
    setTriggering(true);
    try {
      await api.post(`/recordings/${recordingId}/analyze`);
      await fetchStatus();
      toast.success('AI Analysis started. The video is being analyzed in the background.');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to trigger AI analysis');
    } finally {
      setTriggering(false);
    }
  };

  const handleQuickApprove = async () => {
    try {
      await api.post(`/recordings/${recordingId}/notes/approve`);
      toast.success('Study notes approved! Ready to publish to students.');
      await fetchTutorNotes();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve study notes');
    }
  };

  const handleQuickPublish = async () => {
    try {
      await api.post(`/recordings/${recordingId}/notes/publish`, {
        version: notesData?.version || 1,
      });
      toast.success('Study notes published to students and Notion synchronization queued!');
      await fetchTutorNotes();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish study notes');
    }
  };

  const handleRetryNotionSync = async () => {
    setRetryingNotionSync(true);
    try {
      await api.post(`/recordings/${recordingId}/notes/notion-sync/retry`);
      toast.success('Notion synchronization retry queued!');
      await fetchTutorNotes();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to retry Notion sync');
    } finally {
      setRetryingNotionSync(false);
    }
  };

  const handleRefresh = async () => {
    if (isStudent) {
      await fetchStudentNotes();
    } else {
      await fetchStatus();
      await fetchTutorNotes();
    }
  };

  // ─── 1. Student Presentation ─────────────────────────────────────────────

  if (isStudent) {
    if (loadingStudentNotes && !status) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex items-center justify-center gap-3 text-slate-500 text-xs font-semibold">
          <Loader2 className="w-4 h-4 text-[#0052CC] animate-spin" />
          Loading class study notes...
        </div>
      );
    }

    const isRunning = status?.status === 'PENDING' || status?.status === 'RUNNING';
    const isFailed = status?.status === 'FAILED';

    if (isRunning) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
              <Brain className="w-5 h-5 text-[#0052CC]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0B2447]">
                Generating AI Study Notes
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Gemini AI is analyzing the recorded video, extracting formulas, and structuring high-yield NEET points.
              </p>
            </div>
          </div>
          <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-extrabold text-[#0B2447]">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-[#0052CC] animate-spin" />
                {status?.currentStep || 'Analyzing recorded video with Gemini AI...'}
              </span>
              <span className="font-mono text-[#0052CC]">{status?.progressPercentage ?? 35}%</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#0052CC] h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(10, status?.progressPercentage ?? 35)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Notes will appear here automatically as soon as generation completes.
            </p>
          </div>
        </div>
      );
    }

    if (isFailed && (!studentNotesAvailable || !studentNotesData?.notes)) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
          <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-rose-900">Analysis Attempt Failed</h4>
                <p className="text-xs text-rose-700 font-medium">
                  {status?.error || 'An error occurred while generating notes from the lecture video.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleTriggerAnalysis}
              disabled={triggering}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {triggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Retry Generation
            </button>
          </div>
        </div>
      );
    }

    if (!studentNotesAvailable || !studentNotesData?.notes) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052CC] mx-auto flex items-center justify-center border border-blue-100 shadow-2xs">
            <Brain className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-[#0B2447]">AI Study Notes Available for this Lecture</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
              Generate instant structured lecture notes, formula sheets, definitions, and NEET high-yield exam insights directly from this recording.
            </p>
          </div>
          <button
            onClick={handleTriggerAnalysis}
            disabled={triggering}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {triggering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Notes...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate AI Study Notes
              </>
            )}
          </button>
        </div>
      );
    }

    const sNotes = studentNotesData.notes;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
        {/* Student Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#0B2447]">
                  {sNotes.lecture?.title || 'NEET Lecture Study Notes'}
                </h2>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Official Notes · v{studentNotesData.version}
                </span>

                {studentNotesData.notionPageUrl && (
                  <a
                    href={studentNotesData.notionPageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border bg-slate-900 text-white border-slate-800 shadow-2xs hover:bg-slate-800 transition-colors"
                    title="Open notes in Notion workspace"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Notion v{studentNotesData.version} View
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                High-yield NEET lecture breakdown, formulas, definitions, and exam problem strategies.
              </p>
            </div>
          </div>
        </div>

        {/* Student Tabs Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-extrabold">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
              activeTab === 'overview'
                ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-[#0B2447]',
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
              activeTab === 'topics'
                ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-[#0B2447]',
            )}
          >
            Topics ({sNotes.topics?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('formulas')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
              activeTab === 'formulas'
                ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-[#0B2447]',
            )}
          >
            Formulas ({sNotes.formulaCheatSheet?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('definitions')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
              activeTab === 'definitions'
                ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-[#0B2447]',
            )}
          >
            Definitions ({sNotes.definitions?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('mcq')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
              activeTab === 'mcq'
                ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-[#0B2447]',
            )}
          >
            NEET Points ({sNotes.neetExamPoints?.length ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
              activeTab === 'examples'
                ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-[#0B2447]',
            )}
          >
            Worked Examples ({sNotes.workedExamples?.length ?? 0})
          </button>
          {sNotes.lectureConclusion?.revisionChecklist?.length > 0 && (
            <button
              onClick={() => setActiveTab('checklist')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                activeTab === 'checklist'
                  ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-[#0B2447]',
              )}
            >
              Revision Checklist
            </button>
          )}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wide">
                Lecture Synopsis
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {sNotes.lecture?.overview}
              </p>
            </div>

            {sNotes.lecture?.learningObjectives?.length > 0 && (
              <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-200/60 space-y-3">
                <h3 className="text-xs font-extrabold text-[#0052CC] uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#0052CC]" /> Key Learning Objectives
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 font-medium list-disc pl-4">
                  {sNotes.lecture.learningObjectives.map((obj: string, i: number) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Topics */}
        {activeTab === 'topics' && (
          <div className="space-y-3">
            {sNotes.topics?.map((topic: any, i: number) => {
              const isOpen = expandedTopics[i] ?? false;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedTopics((prev) => ({ ...prev, [i]: !isOpen }))}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0052CC] text-xs font-extrabold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-xs font-bold text-[#0B2447]">{topic.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                        {topic.timestampLabel || '00:00'}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-100 bg-slate-50/30">
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">
                        {topic.explanation || topic.summary}
                      </p>
                      {topic.subtopics?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {topic.subtopics.map((st: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md shadow-2xs"
                            >
                              {st}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Formulas */}
        {activeTab === 'formulas' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sNotes.formulaCheatSheet?.map((f: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#0052CC]">{f.name}</h4>
                  {f.siUnits && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {f.siUnits}
                    </span>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 font-mono text-xs font-bold text-[#0B2447]">
                  {f.expression}
                </div>
                {f.variableExplanations && (
                  <p className="text-[11px] text-slate-600 font-medium">{f.variableExplanations}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Definitions */}
        {activeTab === 'definitions' && (
          <div className="space-y-2.5">
            {sNotes.definitions?.map((d: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs"
              >
                <h4 className="text-xs font-extrabold text-[#0052CC]">{d.term}</h4>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">{d.definition}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: NEET Exam Points */}
        {activeTab === 'mcq' && (
          <div className="space-y-3">
            {sNotes.neetExamPoints?.map((p: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase">
                    {p.relevance || 'CRITICAL'} HIGH YIELD
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-bold">{p.point}</p>
                {p.potentialQuestionAngle && (
                  <div className="pt-2 border-t border-amber-200/60">
                    <p className="text-[11px] text-amber-900 font-medium">
                      <strong>Potential MCQ Angle:</strong> {p.potentialQuestionAngle}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 6: Worked Examples */}
        {activeTab === 'examples' && (
          <div className="space-y-4">
            {sNotes.workedExamples?.map((ex: any, i: number) => (
              <div
                key={i}
                className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
              >
                <h4 className="text-xs font-extrabold text-[#0B2447]">
                  Example {i + 1}: {ex.problem}
                </h4>
                {ex.stepByStepExplanation && (
                  <ol className="space-y-1.5 text-xs text-slate-700 pl-4 list-decimal font-medium">
                    {ex.stepByStepExplanation.map((step: string, sIdx: number) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ol>
                )}
                {ex.finalResult && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                    Final Result: {ex.finalResult}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 7: Revision Checklist */}
        {activeTab === 'checklist' && (
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-extrabold text-[#0052CC] uppercase tracking-wide flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-[#0052CC]" /> Rapid Revision Checklist
            </h3>
            <ul className="space-y-2 text-xs text-slate-700 font-medium">
              {sNotes.lectureConclusion?.revisionChecklist?.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // ─── 2. Tutor / Faculty Review Presentation ──────────────────────────────

  if (loadingStatus) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex items-center justify-center gap-3 text-slate-500 text-xs font-semibold">
        <Loader2 className="w-4 h-4 text-[#0052CC] animate-spin" />
        Checking AI Study Notes status...
      </div>
    );
  }

  const isRunning = status?.status === 'PENDING' || status?.status === 'RUNNING';
  const isCompleted = status?.status === 'COMPLETED' && status?.hasContent;
  const isFailed = status?.status === 'FAILED';
  const notes = notesData?.notes;
  const lifecycle = notesData?.lifecycle || {
    state: notesData?.isPublished ? 'PUBLISHED' : 'AI_GENERATED',
    currentVersion: notesData?.version || 1,
  };
  const isPublished = notesData?.isPublished;
  const isApproved = lifecycle.state === 'APPROVED';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
      {/* Tutor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
              <Sparkles className="w-5 h-5 text-[#0052CC]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#0B2447]">
                  NEET AI Lecture Notes Studio
                </h2>
                {isCompleted && (
                  <span
                    className={cn(
                      'text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border',
                      lifecycle.state === 'PUBLISHED' && 'bg-emerald-50 text-emerald-800 border-emerald-300',
                      lifecycle.state === 'APPROVED' && 'bg-purple-50 text-purple-800 border-purple-300',
                      lifecycle.state === 'DRAFT' && 'bg-amber-50 text-amber-800 border-amber-300',
                      lifecycle.state === 'AI_GENERATED' && 'bg-blue-50 text-blue-800 border-blue-300',
                      lifecycle.state === 'UNPUBLISHED' && 'bg-slate-100 text-slate-700 border-slate-300',
                    )}
                  >
                    {lifecycle.state === 'AI_GENERATED' && 'AI Generated · Pending Review'}
                    {lifecycle.state === 'DRAFT' && `Draft Revision (v${notesData?.version || 1})`}
                    {lifecycle.state === 'APPROVED' && `Approved · Ready to Publish (v${notesData?.version || 1})`}
                    {lifecycle.state === 'PUBLISHED' && `Published to Students (v${lifecycle.publishedVersion || notesData?.version || 1})`}
                    {lifecycle.state === 'UNPUBLISHED' && 'Unpublished'}
                  </span>
                )}

                {/* Notion Sync Status Pill */}
                {isCompleted && notesData?.notionSync && (
                  <>
                    {notesData.notionSync.syncStatus === 'SYNCED' && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border bg-slate-900 text-white border-slate-800 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Notion v{notesData.notionSync.syncedVersion || notesData.version || 1}
                        {notesData.notionSync.notionPageUrl && (
                          <a
                            href={notesData.notionSync.notionPageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-300 hover:text-white"
                            title="Open in Notion"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </span>
                    )}

                    {(notesData.notionSync.syncStatus === 'PENDING' || notesData.notionSync.syncStatus === 'SYNCING') && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border bg-blue-50 text-[#0052CC] border-blue-200">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Syncing to Notion...
                      </span>
                    )}

                    {notesData.notionSync.syncStatus === 'FAILED' && (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          Notion Sync Failed
                        </span>
                        <button
                          onClick={handleRetryNotionSync}
                          disabled={retryingNotionSync}
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          <RefreshCw className={cn('w-2.5 h-2.5', retryingNotionSync && 'animate-spin')} />
                          Retry
                        </button>
                      </div>
                    )}

                    {notesData.notionSync.syncStatus === 'UNPUBLISHED' && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-300">
                        Unpublished in Notion
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Multimodal AI extraction of explanations, formulas, definitions, and high-yield NEET exam insights.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isCompleted && !isRunning && (
            <button
              onClick={handleTriggerAnalysis}
              disabled={triggering}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-extrabold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {triggering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Queuing Analysis...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" /> Generate AI Study Notes
                </>
              )}
            </button>
          )}

          {isCompleted && (
            <>
              <button
                onClick={() => setIsEditorOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-extrabold shadow-2xs transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#0052CC]" /> Review & Edit
              </button>

              {!isApproved && !isPublished && (
                <button
                  onClick={handleQuickApprove}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-2xs transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Approve
                </button>
              )}

              {isApproved && (
                <button
                  onClick={handleQuickPublish}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-2xs transition-all cursor-pointer animate-pulse"
                >
                  <Send className="w-3.5 h-3.5" /> Publish to Students
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Progress / Running state */}
      {isRunning && (
        <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-extrabold text-[#0B2447]">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#0052CC] animate-spin" />
              {status?.currentStep || 'Analyzing recorded video with Gemini...'}
            </span>
            <span className="font-mono text-[#0052CC]">{status?.progressPercentage ?? 35}%</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#0052CC] h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(10, status?.progressPercentage ?? 35)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Gemini Multimodal AI is streaming and analyzing video content in the background. You can navigate away and return anytime.
          </p>
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-extrabold text-rose-900">Analysis Attempt Failed</h4>
              <p className="text-xs text-rose-700 font-medium">
                {status?.error || 'An unexpected error occurred while processing the video with Gemini.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleTriggerAnalysis}
            disabled={triggering}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
          >
            Retry Analysis
          </button>
        </div>
      )}

      {/* Idle / Staged state */}
      {!isRunning && !isCompleted && !isFailed && (
        <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
          <Brain className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-extrabold text-[#0B2447]">No AI study notes generated yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
            Convert this recorded class into structured, curriculum-grounded study notes, formulas, definitions, and NEET exam tips using Gemini AI.
          </p>
        </div>
      )}

      {/* Completed Notes Content Preview for Tutor */}
      {isCompleted && (
        <div className="space-y-5">
          {loadingNotes ? (
            <div className="py-12 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
              <Loader2 className="w-4 h-4 text-[#0052CC] animate-spin" /> Loading study notes...
            </div>
          ) : notes ? (
            <div className="space-y-5">
              {/* Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-extrabold">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                    activeTab === 'overview'
                      ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-[#0B2447]',
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('topics')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                    activeTab === 'topics'
                      ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-[#0B2447]',
                  )}
                >
                  Topics ({notes.topics?.length ?? 0})
                </button>
                <button
                  onClick={() => setActiveTab('formulas')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                    activeTab === 'formulas'
                      ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-[#0B2447]',
                  )}
                >
                  Formulas ({notes.formulaCheatSheet?.length ?? 0})
                </button>
                <button
                  onClick={() => setActiveTab('definitions')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                    activeTab === 'definitions'
                      ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-[#0B2447]',
                  )}
                >
                  Definitions ({notes.definitions?.length ?? 0})
                </button>
                <button
                  onClick={() => setActiveTab('mcq')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                    activeTab === 'mcq'
                      ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-[#0B2447]',
                  )}
                >
                  NEET Points ({notes.neetExamPoints?.length ?? 0})
                </button>
                <button
                  onClick={() => setActiveTab('examples')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
                    activeTab === 'examples'
                      ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-[#0B2447]',
                  )}
                >
                  Worked Examples ({notes.workedExamples?.length ?? 0})
                </button>
              </div>

              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <h3 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wide">
                      Lecture Synopsis
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">
                      {notes.lecture?.overview}
                    </p>
                  </div>

                  {notes.lecture?.learningObjectives?.length > 0 && (
                    <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-200/60 space-y-3">
                      <h3 className="text-xs font-extrabold text-[#0052CC] uppercase tracking-wide flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#0052CC]" /> Core Learning Objectives
                      </h3>
                      <ul className="space-y-1.5 text-xs text-slate-700 font-medium list-disc pl-4">
                        {notes.lecture.learningObjectives.map((obj: string, i: number) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Topics */}
              {activeTab === 'topics' && (
                <div className="space-y-3">
                  {notes.topics?.map((topic: any, i: number) => {
                    const isOpen = expandedTopics[i] ?? false;
                    return (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all"
                      >
                        <button
                          onClick={() => setExpandedTopics((prev) => ({ ...prev, [i]: !isOpen }))}
                          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0052CC] text-xs font-extrabold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-xs font-bold text-[#0B2447]">{topic.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                              {topic.timestampLabel || '00:00'}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-100 bg-slate-50/30">
                            <p className="text-xs text-slate-700 leading-relaxed font-normal">
                              {topic.explanation || topic.summary}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 3: Formulas */}
              {activeTab === 'formulas' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {notes.formulaCheatSheet?.map((f: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs"
                    >
                      <h4 className="text-xs font-extrabold text-[#0052CC]">{f.name}</h4>
                      <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 font-mono text-xs font-bold text-[#0B2447]">
                        {f.expression}
                      </div>
                      {f.variableExplanations && (
                        <p className="text-[11px] text-slate-600 font-medium">
                          {f.variableExplanations}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: Definitions */}
              {activeTab === 'definitions' && (
                <div className="space-y-2.5">
                  {notes.definitions?.map((d: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs"
                    >
                      <h4 className="text-xs font-extrabold text-[#0052CC]">{d.term}</h4>
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">
                        {d.definition}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 5: NEET High-Yield */}
              {activeTab === 'mcq' && (
                <div className="space-y-3">
                  {notes.neetExamPoints?.map((p: any, i: number) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2 shadow-2xs"
                    >
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase">
                        {p.relevance || 'CRITICAL'} HIGH YIELD
                      </span>
                      <p className="text-xs text-slate-800 font-bold">{p.point}</p>
                      {p.potentialQuestionAngle && (
                        <p className="text-[11px] text-amber-900 font-medium pt-1 border-t border-amber-200/60">
                          <strong>Potential MCQ Angle:</strong> {p.potentialQuestionAngle}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 6: Worked Examples */}
              {activeTab === 'examples' && (
                <div className="space-y-4">
                  {notes.workedExamples?.map((ex: any, i: number) => (
                    <div
                      key={i}
                      className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
                    >
                      <h4 className="text-xs font-extrabold text-[#0B2447]">
                        Example {i + 1}: {ex.problem}
                      </h4>
                      {ex.stepByStepExplanation && (
                        <ol className="space-y-1.5 text-xs text-slate-700 pl-4 list-decimal font-medium">
                          {ex.stepByStepExplanation.map((step: string, sIdx: number) => (
                            <li key={sIdx}>{step}</li>
                          ))}
                        </ol>
                      )}
                      {ex.finalResult && (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
                          Final Result: {ex.finalResult}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium text-center">
              Notes could not be loaded. Please refresh the page.
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && notesData && (
        <RecordingNotesEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          recordingId={recordingId}
          initialData={notesData}
          onRefresh={handleRefresh}
        />
      )}

      {/* Notion Settings Modal */}
      <NotionSettingsModal
        isOpen={isNotionModalOpen}
        onClose={() => setIsNotionModalOpen(false)}
        onConnectionChanged={handleRefresh}
      />
    </div>
  );
}
