'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Save,
  CheckCircle2,
  Send,
  Eye,
  History,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  BookOpen,
  Atom,
  HelpCircle,
  FileText,
  ListChecks,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShieldCheck,
  EyeOff,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RecordingNotesEditorProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: string;
  initialData: any;
  onRefresh: () => void;
}

export function RecordingNotesEditor({
  isOpen,
  onClose,
  recordingId,
  initialData,
  onRefresh,
}: RecordingNotesEditorProps) {
  const [activeMainTab, setActiveMainTab] = useState<'edit' | 'preview' | 'history'>('edit');
  const [activeEditSubTab, setActiveEditSubTab] = useState<
    'overview' | 'topics' | 'formulas' | 'definitions' | 'concepts' | 'examples' | 'neet' | 'conclusion'
  >('overview');

  const [notes, setNotes] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);

  // Modals
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [unpublishReason, setUnpublishReason] = useState('');

  // History state
  const [versionHistory, setVersionHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (initialData?.notes) {
      // Deep clone initial notes to isolate working copy
      setNotes(JSON.parse(JSON.stringify(initialData.notes)));
      setIsDirty(false);
    }
  }, [initialData]);

  if (!isOpen || !notes) return null;

  const lifecycle = initialData?.lifecycle || { state: 'AI_GENERATED', currentVersion: initialData?.version || 1 };
  const currentVersion = initialData?.version || 1;
  const isCurrentlyPublished = initialData?.isPublished;
  const isApproved = lifecycle.state === 'APPROVED';

  const updateNotesField = (field: string, val: any) => {
    setNotes((prev: any) => ({ ...prev, [field]: val }));
    setIsDirty(true);
  };

  const updateLectureField = (field: string, val: any) => {
    setNotes((prev: any) => ({
      ...prev,
      lecture: { ...prev.lecture, [field]: val },
    }));
    setIsDirty(true);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await api.put(`/recordings/${recordingId}/notes/draft`, {
        notes,
        changeSummary: changeSummary.trim() || 'Draft revision saved by faculty',
        expectedVersion: currentVersion,
      });
      toast.success('Draft saved successfully');
      setIsDirty(false);
      setShowSaveModal(false);
      setChangeSummary('');
      onRefresh();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error('Conflict: Another faculty member updated this note. Please refresh to get latest changes.');
      } else {
        toast.error(err instanceof Error ? err.message : 'Failed to save draft');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (isDirty) {
      toast.error('Please save your pending draft changes before approving.');
      return;
    }
    setApproving(true);
    try {
      await api.post(`/recordings/${recordingId}/notes/approve`);
      toast.success('Study notes approved successfully. Ready to publish to students.');
      onRefresh();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve study notes');
    } finally {
      setApproving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await api.post(`/recordings/${recordingId}/notes/publish`, {
        version: currentVersion,
      });
      toast.success('Study notes published to students and synced to topic curriculum successfully!');
      setShowPublishModal(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish study notes');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setUnpublishing(true);
    try {
      await api.post(`/recordings/${recordingId}/notes/unpublish`, {
        reason: unpublishReason.trim() || undefined,
      });
      toast.success('Study notes unpublished. Student access revoked.');
      setShowUnpublishModal(false);
      setUnpublishReason('');
      onRefresh();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to unpublish study notes');
    } finally {
      setUnpublishing(false);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.get(`/recordings/${recordingId}/notes/versions`);
      setVersionHistory(data);
    } catch {
      toast.error('Failed to load version history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTabChange = (tab: 'edit' | 'preview' | 'history') => {
    setActiveMainTab(tab);
    if (tab === 'history' && !versionHistory) {
      fetchHistory();
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
              <Sparkles className="w-5 h-5 text-[#0052CC]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-[#0B2447]">
                  Faculty Review & Editing Studio
                </h2>
                {/* State Badge */}
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border',
                    lifecycle.state === 'PUBLISHED' && 'bg-emerald-50 text-emerald-800 border-emerald-300',
                    lifecycle.state === 'APPROVED' && 'bg-purple-50 text-purple-800 border-purple-300',
                    lifecycle.state === 'DRAFT' && 'bg-amber-50 text-amber-800 border-amber-300',
                    lifecycle.state === 'AI_GENERATED' && 'bg-blue-50 text-blue-800 border-blue-300',
                    lifecycle.state === 'UNPUBLISHED' && 'bg-slate-100 text-slate-700 border-slate-300',
                  )}
                >
                  {lifecycle.state === 'AI_GENERATED' && 'AI Generated · Pending Review'}
                  {lifecycle.state === 'DRAFT' && `Draft Revision (v${currentVersion})`}
                  {lifecycle.state === 'APPROVED' && `Approved · Ready to Publish (v${currentVersion})`}
                  {lifecycle.state === 'PUBLISHED' && `Published to Students (v${lifecycle.publishedVersion || currentVersion})`}
                  {lifecycle.state === 'UNPUBLISHED' && 'Unpublished'}
                </span>
                {initialData?.notionSync?.syncStatus === 'SYNCED' && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-900 text-white border border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Notion v{initialData.notionSync.syncedVersion || currentVersion}
                  </span>
                )}
                {isDirty && (
                  <span className="text-[11px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Unsaved Edits
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-xl">
                {notes.lecture?.title || 'NEET Study Notes'}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Header & Main Mode Navigation */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-extrabold">
            <button
              onClick={() => handleTabChange('edit')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                activeMainTab === 'edit'
                  ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-[#0B2447]',
              )}
            >
              <FileText className="w-3.5 h-3.5" /> Editor
            </button>
            <button
              onClick={() => handleTabChange('preview')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                activeMainTab === 'preview'
                  ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-[#0B2447]',
              )}
            >
              <Eye className="w-3.5 h-3.5" /> Student Preview
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                activeMainTab === 'history'
                  ? 'bg-white text-[#0052CC] shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-[#0B2447]',
              )}
            >
              <History className="w-3.5 h-3.5" /> Version History
            </button>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            {!isApproved && lifecycle.state !== 'PUBLISHED' && (
              <button
                onClick={handleApprove}
                disabled={approving || isDirty}
                title={isDirty ? 'Please save draft changes first' : 'Approve notes'}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {approving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                Approve Notes
              </button>
            )}

            {isApproved && (
              <button
                onClick={() => setShowPublishModal(true)}
                disabled={publishing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs animate-pulse"
              >
                <Send className="w-3.5 h-3.5" />
                Publish to Students
              </button>
            )}

            {isCurrentlyPublished && (
              <button
                onClick={() => setShowUnpublishModal(true)}
                disabled={unpublishing}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                Unpublish
              </button>
            )}
          </div>
        </div>

        {/* Published Note Notice if editing published version */}
        {isCurrentlyPublished && activeMainTab === 'edit' && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-900 flex items-center justify-between font-medium">
            <span>
              <strong>Note:</strong> A published version (v{lifecycle.publishedVersion || 1}) is currently live for enrolled students. Any edits here will save as draft v{currentVersion + 1} without affecting students until you approve and publish it.
            </span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: FULL EDITOR */}
          {activeMainTab === 'edit' && (
            <div className="space-y-6">
              {/* Sub-Tabs for structured sections */}
              <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 pb-2 text-xs font-bold">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'topics', label: `Topics (${notes.topics?.length ?? 0})` },
                  { id: 'formulas', label: `Formulas (${notes.formulaCheatSheet?.length ?? 0})` },
                  { id: 'definitions', label: `Definitions (${notes.definitions?.length ?? 0})` },
                  { id: 'concepts', label: `Concepts (${notes.importantConcepts?.length ?? 0})` },
                  { id: 'examples', label: `Worked Examples (${notes.workedExamples?.length ?? 0})` },
                  { id: 'neet', label: `NEET Points (${notes.neetExamPoints?.length ?? 0})` },
                  { id: 'conclusion', label: 'Checklist & Conclusion' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setActiveEditSubTab(st.id as any)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg transition-colors cursor-pointer',
                      activeEditSubTab === st.id
                        ? 'bg-[#0052CC] text-white'
                        : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* SubTab 1: Overview */}
              {activeEditSubTab === 'overview' && (
                <div className="space-y-4 max-w-4xl">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Lecture Title
                    </label>
                    <input
                      type="text"
                      value={notes.lecture?.title || ''}
                      onChange={(e) => updateLectureField('title', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Comprehensive Lecture Overview
                    </label>
                    <textarea
                      rows={5}
                      value={notes.lecture?.overview || ''}
                      onChange={(e) => updateLectureField('overview', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs leading-relaxed font-normal rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-extrabold text-slate-700">
                        Learning Objectives
                      </label>
                      <button
                        onClick={() => {
                          const updated = [...(notes.lecture?.learningObjectives || []), ''];
                          updateLectureField('learningObjectives', updated);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0052CC] hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Objective
                      </button>
                    </div>
                    <div className="space-y-2">
                      {notes.lecture?.learningObjectives?.map((obj: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={obj}
                            onChange={(e) => {
                              const updated = [...notes.lecture.learningObjectives];
                              updated[i] = e.target.value;
                              updateLectureField('learningObjectives', updated);
                            }}
                            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                          />
                          <button
                            onClick={() => {
                              const updated = notes.lecture.learningObjectives.filter((_: any, idx: number) => idx !== i);
                              updateLectureField('learningObjectives', updated);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SubTab 2: Topics */}
              {activeEditSubTab === 'topics' && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">
                      Manage curriculum-grounded topic breakdowns and explanations.
                    </p>
                    <button
                      onClick={() => {
                        const newTopic = {
                          title: 'New Topic',
                          startSeconds: 0,
                          endSeconds: 300,
                          timestampLabel: '00:00 - 05:00',
                          explanation: '',
                          subtopics: [],
                        };
                        updateNotesField('topics', [...(notes.topics || []), newTopic]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Topic
                    </button>
                  </div>

                  <div className="space-y-4">
                    {notes.topics?.map((topic: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-extrabold text-[#0B2447]">
                            Topic #{i + 1}
                          </span>
                          <button
                            onClick={() => {
                              const updated = notes.topics.filter((_: any, idx: number) => idx !== i);
                              updateNotesField('topics', updated);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Topic Title
                            </label>
                            <input
                              type="text"
                              value={topic.title || ''}
                              onChange={(e) => {
                                const updated = [...notes.topics];
                                updated[i] = { ...updated[i], title: e.target.value };
                                updateNotesField('topics', updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Timeline (e.g. 05:20 - 12:45)
                            </label>
                            <input
                              type="text"
                              value={topic.timestampLabel || ''}
                              onChange={(e) => {
                                const updated = [...notes.topics];
                                updated[i] = { ...updated[i], timestampLabel: e.target.value };
                                updateNotesField('topics', updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Detailed Explanation & Core Concepts
                          </label>
                          <textarea
                            rows={3}
                            value={topic.explanation || topic.summary || ''}
                            onChange={(e) => {
                              const updated = [...notes.topics];
                              updated[i] = { ...updated[i], explanation: e.target.value };
                              updateNotesField('topics', updated);
                            }}
                            className="w-full px-3 py-1.5 text-xs leading-relaxed rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SubTab 3: Formulas */}
              {activeEditSubTab === 'formulas' && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">
                      Formula Cheat Sheet (Mathematical & Physical relations, SI units, conditions).
                    </p>
                    <button
                      onClick={() => {
                        const newFormula = {
                          name: 'New Formula',
                          expression: '',
                          variableExplanations: '',
                          siUnits: '',
                          conditions: '',
                        };
                        updateNotesField('formulaCheatSheet', [...(notes.formulaCheatSheet || []), newFormula]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Formula
                    </button>
                  </div>

                  <div className="space-y-4">
                    {notes.formulaCheatSheet?.map((f: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#0B2447]">
                            Formula #{i + 1}
                          </span>
                          <button
                            onClick={() => {
                              const updated = notes.formulaCheatSheet.filter((_: any, idx: number) => idx !== i);
                              updateNotesField('formulaCheatSheet', updated);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Formula Name
                            </label>
                            <input
                              type="text"
                              value={f.name || ''}
                              onChange={(e) => {
                                const updated = [...notes.formulaCheatSheet];
                                updated[i] = { ...updated[i], name: e.target.value };
                                updateNotesField('formulaCheatSheet', updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Mathematical Expression
                            </label>
                            <input
                              type="text"
                              value={f.expression || ''}
                              onChange={(e) => {
                                const updated = [...notes.formulaCheatSheet];
                                updated[i] = { ...updated[i], expression: e.target.value };
                                updateNotesField('formulaCheatSheet', updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Variable Explanations
                            </label>
                            <input
                              type="text"
                              value={f.variableExplanations || ''}
                              onChange={(e) => {
                                const updated = [...notes.formulaCheatSheet];
                                updated[i] = { ...updated[i], variableExplanations: e.target.value };
                                updateNotesField('formulaCheatSheet', updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              SI Units & Conditions
                            </label>
                            <input
                              type="text"
                              value={f.siUnits || f.conditions || ''}
                              onChange={(e) => {
                                const updated = [...notes.formulaCheatSheet];
                                updated[i] = { ...updated[i], siUnits: e.target.value };
                                updateNotesField('formulaCheatSheet', updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SubTab 4: Definitions */}
              {activeEditSubTab === 'definitions' && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">
                      Scientific definitions, NCERT verbatim phrases, and terminology.
                    </p>
                    <button
                      onClick={() => {
                        const newDef = {
                          term: '',
                          definition: '',
                          relatedTopic: '',
                        };
                        updateNotesField('definitions', [...(notes.definitions || []), newDef]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Definition
                    </button>
                  </div>

                  <div className="space-y-3">
                    {notes.definitions?.map((d: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#0B2447]">
                            Definition #{i + 1}
                          </span>
                          <button
                            onClick={() => {
                              const updated = notes.definitions.filter((_: any, idx: number) => idx !== i);
                              updateNotesField('definitions', updated);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Term / Concept
                            </label>
                            <input
                              type="text"
                              value={d.term || ''}
                              onChange={(e) => {
                                const updated = [...notes.definitions];
                                updated[i] = { ...updated[i], term: e.target.value };
                                updateNotesField('definitions', updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Formal Scientific Definition
                            </label>
                            <input
                              type="text"
                              value={d.definition || ''}
                              onChange={(e) => {
                                const updated = [...notes.definitions];
                                updated[i] = { ...updated[i], definition: e.target.value };
                                updateNotesField('definitions', updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SubTab 5: Important Concepts */}
              {activeEditSubTab === 'concepts' && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">
                      High-yield concepts, exceptions, differences, and principles.
                    </p>
                    <button
                      onClick={() => {
                        const newConcept = {
                          title: 'New Concept',
                          category: 'HIGH_YIELD',
                          explanation: '',
                          neetRelevance: '',
                        };
                        updateNotesField('importantConcepts', [...(notes.importantConcepts || []), newConcept]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Concept
                    </button>
                  </div>

                  <div className="space-y-3">
                    {notes.importantConcepts?.map((c: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#0B2447]">
                            Concept #{i + 1}
                          </span>
                          <button
                            onClick={() => {
                              const updated = notes.importantConcepts.filter((_: any, idx: number) => idx !== i);
                              updateNotesField('importantConcepts', updated);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={c.title || ''}
                              onChange={(e) => {
                                const updated = [...notes.importantConcepts];
                                updated[i] = { ...updated[i], title: e.target.value };
                                updateNotesField('importantConcepts', updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Category
                            </label>
                            <select
                              value={c.category || 'HIGH_YIELD'}
                              onChange={(e) => {
                                const updated = [...notes.importantConcepts];
                                updated[i] = { ...updated[i], category: e.target.value };
                                updateNotesField('importantConcepts', updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                            >
                              <option value="HIGH_YIELD">HIGH_YIELD</option>
                              <option value="FREQUENTLY_CONFUSED">FREQUENTLY_CONFUSED</option>
                              <option value="DIFFERENCE">DIFFERENCE</option>
                              <option value="PROCESS">PROCESS</option>
                              <option value="EXCEPTION">EXCEPTION</option>
                              <option value="PRINCIPLE">PRINCIPLE</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Explanation & NEET Relevance
                          </label>
                          <textarea
                            rows={2}
                            value={c.explanation || ''}
                            onChange={(e) => {
                              const updated = [...notes.importantConcepts];
                              updated[i] = { ...updated[i], explanation: e.target.value };
                              updateNotesField('importantConcepts', updated);
                            }}
                            className="w-full px-3 py-1.5 text-xs leading-relaxed rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SubTab 6: Worked Examples */}
              {activeEditSubTab === 'examples' && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">
                      Worked examples, numerical problems, and step-by-step solutions.
                    </p>
                    <button
                      onClick={() => {
                        const newEx = {
                          problem: 'New Numerical / Conceptual Problem',
                          stepByStepExplanation: ['Step 1: Formula definition', 'Step 2: Substitution'],
                          finalResult: '',
                        };
                        updateNotesField('workedExamples', [...(notes.workedExamples || []), newEx]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Example
                    </button>
                  </div>

                  <div className="space-y-4">
                    {notes.workedExamples?.map((ex: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#0B2447]">
                            Example #{i + 1}
                          </span>
                          <button
                            onClick={() => {
                              const updated = notes.workedExamples.filter((_: any, idx: number) => idx !== i);
                              updateNotesField('workedExamples', updated);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Problem Statement
                          </label>
                          <textarea
                            rows={2}
                            value={ex.problem || ''}
                            onChange={(e) => {
                              const updated = [...notes.workedExamples];
                              updated[i] = { ...updated[i], problem: e.target.value };
                              updateNotesField('workedExamples', updated);
                            }}
                            className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Final Answer / Key Takeaway
                          </label>
                          <input
                            type="text"
                            value={ex.finalResult || ''}
                            onChange={(e) => {
                              const updated = [...notes.workedExamples];
                              updated[i] = { ...updated[i], finalResult: e.target.value };
                              updateNotesField('workedExamples', updated);
                            }}
                            className="w-full px-3 py-1.5 text-xs font-bold text-emerald-800 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SubTab 7: NEET Points */}
              {activeEditSubTab === 'neet' && (
                <div className="space-y-6 max-w-4xl">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-medium">
                      High-yield exam insights, traps, and expected MCQ question angles.
                    </p>
                    <button
                      onClick={() => {
                        const newPt = {
                          point: '',
                          relevance: 'CRITICAL',
                          potentialQuestionAngle: '',
                        };
                        updateNotesField('neetExamPoints', [...(notes.neetExamPoints || []), newPt]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0052CC] text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Exam Point
                    </button>
                  </div>

                  <div className="space-y-3">
                    {notes.neetExamPoints?.map((p: any, i: number) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#0B2447]">
                            Exam Point #{i + 1}
                          </span>
                          <button
                            onClick={() => {
                              const updated = notes.neetExamPoints.filter((_: any, idx: number) => idx !== i);
                              updateNotesField('neetExamPoints', updated);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              High Yield Concept / Insight
                            </label>
                            <input
                              type="text"
                              value={p.point || ''}
                              onChange={(e) => {
                                const updated = [...notes.neetExamPoints];
                                updated[i] = { ...updated[i], point: e.target.value };
                                updateNotesField('neetExamPoints', updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                              Relevance
                            </label>
                            <select
                              value={p.relevance || 'CRITICAL'}
                              onChange={(e) => {
                                const updated = [...notes.neetExamPoints];
                                updated[i] = { ...updated[i], relevance: e.target.value };
                                updateNotesField('neetExamPoints', updated);
                              }}
                              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                            >
                              <option value="CRITICAL">CRITICAL</option>
                              <option value="HIGH">HIGH</option>
                              <option value="MEDIUM">MEDIUM</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Potential MCQ Angle / Examiner Trap
                          </label>
                          <input
                            type="text"
                            value={p.potentialQuestionAngle || ''}
                            onChange={(e) => {
                              const updated = [...notes.neetExamPoints];
                              updated[i] = { ...updated[i], potentialQuestionAngle: e.target.value };
                              updateNotesField('neetExamPoints', updated);
                            }}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SubTab 8: Conclusion */}
              {activeEditSubTab === 'conclusion' && (
                <div className="space-y-5 max-w-4xl">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      Lecture Conclusion & Summary
                    </label>
                    <textarea
                      rows={3}
                      value={notes.lectureConclusion?.summary || ''}
                      onChange={(e) => {
                        setNotes((prev: any) => ({
                          ...prev,
                          lectureConclusion: { ...prev.lectureConclusion, summary: e.target.value },
                        }));
                        setIsDirty(true);
                      }}
                      className="w-full px-3.5 py-2 text-xs leading-relaxed rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-extrabold text-slate-700">
                        Rapid Revision Checklist
                      </label>
                      <button
                        onClick={() => {
                          const updated = [...(notes.lectureConclusion?.revisionChecklist || []), ''];
                          setNotes((prev: any) => ({
                            ...prev,
                            lectureConclusion: { ...prev.lectureConclusion, revisionChecklist: updated },
                          }));
                          setIsDirty(true);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0052CC] hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Item
                      </button>
                    </div>
                    <div className="space-y-2">
                      {notes.lectureConclusion?.revisionChecklist?.map((item: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const updated = [...notes.lectureConclusion.revisionChecklist];
                              updated[i] = e.target.value;
                              setNotes((prev: any) => ({
                                ...prev,
                                lectureConclusion: { ...prev.lectureConclusion, revisionChecklist: updated },
                              }));
                              setIsDirty(true);
                            }}
                            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                          />
                          <button
                            onClick={() => {
                              const updated = notes.lectureConclusion.revisionChecklist.filter(
                                (_: any, idx: number) => idx !== i,
                              );
                              setNotes((prev: any) => ({
                                ...prev,
                                lectureConclusion: { ...prev.lectureConclusion, revisionChecklist: updated },
                              }));
                              setIsDirty(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STUDENT PREVIEW */}
          {activeMainTab === 'preview' && (
            <div className="max-w-4xl mx-auto space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium">
                <strong>Student View Simulation:</strong> This represents exactly how enrolled students will experience these study notes inside their class recording player and course curriculum topic once published.
              </div>

              {/* Title & Overview */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h1 className="text-xl font-extrabold text-[#0B2447]">
                  {notes.lecture?.title || 'NEET Study Notes'}
                </h1>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {notes.lecture?.overview}
                </p>

                {notes.lecture?.learningObjectives?.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-extrabold text-[#0052CC] mb-2 uppercase tracking-wide">
                      Core Learning Objectives
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-700 font-medium list-disc pl-4">
                      {notes.lecture.learningObjectives.map((obj: string, i: number) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Topics Breakdown */}
              {notes.topics?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-[#0B2447] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#0052CC]" /> Lecture Topics
                  </h3>
                  <div className="space-y-3">
                    {notes.topics.map((t: any, i: number) => (
                      <div
                        key={i}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-[#0B2447]">
                            {i + 1}. {t.title}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                            {t.timestampLabel || '00:00'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {t.explanation || t.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulas */}
              {notes.formulaCheatSheet?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-[#0B2447] flex items-center gap-2">
                    <Atom className="w-4 h-4 text-[#0052CC]" /> Formula Cheat Sheet
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {notes.formulaCheatSheet.map((f: any, i: number) => (
                      <div
                        key={i}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2"
                      >
                        <h4 className="text-xs font-extrabold text-[#0052CC]">{f.name}</h4>
                        <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 font-mono text-xs font-bold text-[#0B2447]">
                          {f.expression}
                        </div>
                        {f.variableExplanations && (
                          <p className="text-[11px] text-slate-600 font-medium">
                            {f.variableExplanations}
                          </p>
                        )}
                        {f.siUnits && (
                          <span className="inline-block text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            Units: {f.siUnits}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Definitions */}
              {notes.definitions?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-[#0B2447] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#0052CC]" /> Scientific Definitions
                  </h3>
                  <div className="space-y-2">
                    {notes.definitions.map((d: any, i: number) => (
                      <div
                        key={i}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1"
                      >
                        <h4 className="text-xs font-extrabold text-[#0052CC]">{d.term}</h4>
                        <p className="text-xs text-slate-800 font-medium">{d.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NEET High Yield Points */}
              {notes.neetExamPoints?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-[#0B2447] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" /> High-Yield NEET Exam Points
                  </h3>
                  <div className="space-y-2.5">
                    {notes.neetExamPoints.map((p: any, i: number) => (
                      <div
                        key={i}
                        className="bg-amber-50/40 border border-amber-200 p-4 rounded-xl shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
                            {p.relevance || 'CRITICAL'} HIGH YIELD
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800">{p.point}</p>
                        {p.potentialQuestionAngle && (
                          <p className="text-[11px] text-amber-900 font-medium pt-1">
                            <strong>Potential MCQ Angle:</strong> {p.potentialQuestionAngle}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist */}
              {notes.lectureConclusion?.revisionChecklist?.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-xs font-extrabold text-[#0052CC] uppercase tracking-wide flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-[#0052CC]" /> Rapid Revision Checklist
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-700 font-medium">
                    {notes.lectureConclusion.revisionChecklist.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VERSION HISTORY & AUDIT TRAIL */}
          {activeMainTab === 'history' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {loadingHistory ? (
                <div className="py-12 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                  <Loader2 className="w-4 h-4 text-[#0052CC] animate-spin" /> Loading version history...
                </div>
              ) : versionHistory ? (
                <div className="space-y-6">
                  {/* Versions Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-[#0B2447]">
                        Historical Version Snapshots
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Current Working Version: v{versionHistory.currentVersion}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {versionHistory.versions?.map((v: any, i: number) => (
                        <div key={i} className="p-4 flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                v{v.version}
                              </span>
                              <span className="text-xs font-bold text-slate-800">
                                {v.changeSummary || 'Snapshot'}
                              </span>
                              {v.state && (
                                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {v.state}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Created at {new Date(v.createdAt).toLocaleString()} by {v.createdBy || 'System'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audit Trail Log */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                      <h3 className="text-xs font-extrabold text-[#0B2447]">
                        Lifecycle Audit Trail
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {versionHistory.auditLog?.map((entry: any, i: number) => (
                        <div key={i} className="p-4 flex items-start gap-3">
                          <div className="p-2 rounded-xl bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                            <History className="w-3.5 h-3.5" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-slate-900">
                                {entry.action}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                {new Date(entry.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">
                              {entry.details || 'Lifecycle action performed'}
                            </p>
                            <span className="text-[10px] text-slate-400">
                              Actor: {entry.actorId} ({entry.actorRole || 'System'}) · Version: {entry.version}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 font-medium">
                  No version history records found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* SAVE DRAFT MODAL */}
        {showSaveModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-sm font-extrabold text-[#0B2447]">Save Draft Notes</h3>
              <p className="text-xs text-slate-500 font-medium">
                Optionally provide a short summary of the edits made in this draft revision.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Revision Change Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g., Added formula conditions and clarified synaptic vesicle explanation"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-xl bg-[#0052CC] text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PUBLISH CONFIRMATION MODAL */}
        {showPublishModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0B2447]">
                    Publish Notes to Students
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Version v{currentVersion}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Publishing will make these study notes immediately accessible to all students enrolled in this class batch, link them to curriculum Topic Items, and automatically synchronize them to your connected Notion workspace.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-2xs"
                >
                  {publishing ? 'Publishing...' : 'Yes, Publish to Students'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UNPUBLISH CONFIRMATION MODAL */}
        {showUnpublishModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                  <EyeOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#0B2447]">
                    Unpublish Study Notes
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Immediate Student Access Revocation
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                This will immediately hide the study notes from students in both the recording watch view and the course curriculum Topic Items, and archive the corresponding Notion page. Faculty can still view, edit, and re-publish them anytime.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Unpublishing (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Need to correct formula notation"
                  value={unpublishReason}
                  onChange={(e) => setUnpublishReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0052CC]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowUnpublishModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnpublish}
                  disabled={unpublishing}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer shadow-2xs"
                >
                  {unpublishing ? 'Unpublishing...' : 'Unpublish Notes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

