'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Search,
  Sparkles,
  Edit2,
  Trash2,
  X,
  FileText,
  Upload,
  Layers,
  ChevronDown,
  ChevronRight,
  ListPlus,
  Loader2,
  Clock,
  BookMarked,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function SubjectDetailSyllabusContent() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;

  const [search, setSearch] = useState('');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  // Form states for adding chapter
  const [newChName, setNewChName] = useState('');
  const [newChHours, setNewChHours] = useState(10);
  const [newChSessions, setNewChSessions] = useState(8);
  const [isAddingCh, setIsAddingCh] = useState(false);

  // Form states for bulk import
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Topic Modal State
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null);
  const [topicName, setTopicName] = useState('');
  const [topicHours, setTopicHours] = useState(2);
  const [topicSessions, setTopicSessions] = useState(2);
  const [topicDifficulty, setTopicDifficulty] = useState('MEDIUM');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  // Fetch Master Course Subject details (includes Subject, Chapters & Topics)
  const {
    data: courseSubject,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['master-subject-details', subjectId],
    queryFn: async () => {
      const res = await api.get<any>(`/master/subjects/${subjectId}/course-subject`);
      return res;
    },
    enabled: !!subjectId,
  });

  const toggleChapterExpand = (chId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chId)) next.delete(chId);
      else next.add(chId);
      return next;
    });
  };

  const handleAddChapter = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newChName.trim() || !courseSubject?.id) {
      toast.error('Please enter a valid chapter name');
      return;
    }

    setIsAddingCh(true);
    try {
      const cleanName = newChName.trim();
      const codePrefix =
        cleanName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'CH';
      const existing = courseSubject.chapters || [];
      const order = existing.length + 1;

      await api.post('/master/chapters', {
        courseSubjectId: courseSubject.id,
        name: cleanName,
        code: `CH-${codePrefix}-${order}`,
        plannedHours: newChHours || 10,
        estimatedSessions: newChSessions || 8,
        displayOrder: order,
      });

      toast.success(`Chapter "${cleanName}" added successfully!`);
      setNewChName('');
      void refetch();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to add chapter';
      toast.error(errorMsg);
    } finally {
      setIsAddingCh(false);
    }
  };

  const handleProcessBulkPaste = async () => {
    if (!bulkText.trim() || !courseSubject?.id) {
      toast.error('Please enter chapter names');
      return;
    }

    setIsProcessingBulk(true);
    try {
      const lines = bulkText
        .split('\n')
        .map((l) => l.trim().replace(/^[0-9]+\.\s*/, '').replace(/^[-*]\s*/, ''))
        .filter(Boolean);

      if (lines.length === 0) {
        toast.error('No valid chapter names found');
        setIsProcessingBulk(false);
        return;
      }

      const existing = courseSubject.chapters || [];
      let order = existing.length + 1;

      for (const name of lines) {
        const cleanName = name.trim();
        const codePrefix =
          cleanName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'CH';
        await api.post('/master/chapters', {
          courseSubjectId: courseSubject.id,
          name: cleanName,
          code: `CH-${codePrefix}-${order}`,
          plannedHours: 10,
          estimatedSessions: 8,
          displayOrder: order++,
        });
      }

      toast.success(`Added ${lines.length} chapters from bulk list!`);
      setBulkText('');
      setShowBulkPaste(false);
      void refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to process bulk chapters');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string, name: string) => {
    if (!confirm(`Delete chapter "${name}"?`)) return;
    try {
      await api.delete(`/master/chapters/${chapterId}`);
      toast.success('Chapter deleted successfully');
      void refetch();
    } catch {
      toast.error('Failed to delete chapter');
    }
  };

  const handleOpenAddTopicModal = (chapterId: string) => {
    setTargetChapterId(chapterId);
    setTopicName('');
    setTopicHours(2);
    setTopicSessions(2);
    setTopicDifficulty('MEDIUM');
    setTopicModalOpen(true);
  };

  const handleCreateTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim() || !targetChapterId) return;

    setIsAddingTopic(true);
    try {
      const cleanName = topicName.trim();
      const codePrefix =
        cleanName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'TP';

      const parentCh = courseSubject?.chapters?.find((ch: any) => ch.id === targetChapterId);
      const existingTopics = parentCh?.topics || [];
      const order = existingTopics.length + 1;

      await api.post('/master/topics', {
        chapterId: targetChapterId,
        name: cleanName,
        code: `TP-${codePrefix}-${order}`,
        plannedHours: topicHours || 2,
        plannedSessions: topicSessions || 2,
        difficultyLevel: topicDifficulty,
        displayOrder: order,
      });

      toast.success(`Topic "${cleanName}" added successfully!`);
      setTopicModalOpen(false);
      setTopicName('');
      // Auto expand chapter
      setExpandedChapters((prev) => new Set(prev).add(targetChapterId));
      void refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add topic');
    } finally {
      setIsAddingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId: string, name: string) => {
    if (!confirm(`Delete topic "${name}"?`)) return;
    try {
      await api.delete(`/master/topics/${topicId}`);
      toast.success('Topic deleted');
      void refetch();
    } catch {
      toast.error('Failed to delete topic');
    }
  };

  const chapters: any[] = courseSubject?.chapters || [];

  const filteredChapters = chapters.filter((ch) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchCh = ch.name.toLowerCase().includes(q) || ch.code.toLowerCase().includes(q);
    const matchTp = ch.topics?.some(
      (t: any) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q),
    );
    return matchCh || matchTp;
  });

  const totalTopicsCount = chapters.reduce((acc, ch) => acc + (ch.topics?.length || 0), 0);
  const totalPlannedHours = chapters.reduce((acc, ch) => acc + (ch.plannedHours || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Back Link */}
        <button
          onClick={() => router.push('/tenant-admin/subjects')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-violet-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Master Subjects Library
        </button>

        {/* Hero Header Banner */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-violet-200 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-md text-white">
                Master Subject Syllabus
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/80 px-2 py-0.5 rounded-md text-white uppercase">
                Active Repository
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {courseSubject?.subject?.name || 'Master Subject Syllabus'}
            </h1>
            <p className="text-violet-200 text-xs max-w-xl">
              Configure master chapters and topics. Any changes made here are automatically cloned whenever this subject is mapped into Course Programs.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shrink-0">
            <div className="text-center px-3 border-r border-white/20">
              <p className="text-[10px] text-violet-200 uppercase font-bold">Chapters</p>
              <p className="text-xl font-black text-white">{chapters.length}</p>
            </div>
            <div className="text-center px-3 border-r border-white/20">
              <p className="text-[10px] text-violet-200 uppercase font-bold">Topics</p>
              <p className="text-xl font-black text-white">{totalTopicsCount}</p>
            </div>
            <div className="text-center px-3">
              <p className="text-[10px] text-violet-200 uppercase font-bold">Total Hours</p>
              <p className="text-xl font-black text-white">{totalPlannedHours}h</p>
            </div>
          </div>
        </div>

        {/* Master Chapters Catalog */}
        <div className="w-full space-y-4">
            {/* Search Toolbar */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search chapters or topics by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowBulkPaste(!showBulkPaste)}
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs font-bold text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100 gap-1.5"
                >
                  <ListPlus className="w-4 h-4 text-violet-600" />
                  {showBulkPaste ? 'Hide Bulk Paste' : 'Quick Bulk Paste'}
                </Button>
              </div>
            </div>

            {/* Bulk Paste Expandable Box */}
            {showBulkPaste && (
              <div className="p-4 rounded-2xl bg-violet-50/80 border border-violet-200 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                    <ListPlus className="w-4 h-4 text-violet-600" /> Paste List of Chapters (Line by Line):
                  </label>
                  <span className="text-[10px] text-violet-600 font-bold bg-white px-2 py-0.5 rounded-md border border-violet-200">
                    Auto-Generates Chapter Codes & Order
                  </span>
                </div>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={5}
                  placeholder={`1. Physical World and Measurement\n2. Kinematics & Motion\n3. Laws of Motion\n4. Work, Energy & Power`}
                  className="w-full p-3 rounded-xl border border-violet-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBulkPaste(false)}
                    className="text-xs font-semibold text-slate-500"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isProcessingBulk}
                    onClick={handleProcessBulkPaste}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl gap-1.5"
                  >
                    {isProcessingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Process & Import All Chapters
                  </Button>
                </div>
              </div>
            )}

            {/* Chapters Catalog Tree */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : filteredChapters.length === 0 ? (
              <div className="p-12 text-center border border-dashed rounded-3xl border-slate-200 bg-white shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center border border-violet-100">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No chapters configured yet</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Use the Quick Add Chapter panel on the right or Bulk Paste to add chapters to this subject.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredChapters.map((ch: any, idx: number) => {
                  const isExpanded = expandedChapters.has(ch.id);
                  const topicList: any[] = ch.topics || [];
                  return (
                    <div
                      key={ch.id}
                      className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all duration-200 hover:border-violet-300"
                    >
                      {/* Chapter Card Header */}
                      <div
                        onClick={() => toggleChapterExpand(ch.id)}
                        className="p-4 flex items-center justify-between cursor-pointer select-none bg-white hover:bg-slate-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-black shrink-0"
                          >
                            {idx + 1}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900 truncate">{ch.name}</h3>
                              <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0">
                                {ch.code}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span className="text-violet-600 font-semibold">
                                {topicList.length} Topics
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/tenant-admin/subjects/${subjectId}/chapters/${ch.id}`);
                            }}
                            className="bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold rounded-xl text-xs h-8 px-3 border border-violet-200 gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Manage Topics ↗
                          </Button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChapter(ch.id, ch.name);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete chapter"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="p-1 text-slate-400">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-violet-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Topics Expandable Section */}
                      {isExpanded && (
                        <div className="bg-slate-50/70 border-t border-slate-100 p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
                            <span>Topics in {ch.name} ({topicList.length}):</span>
                            <button
                              type="button"
                              onClick={() => router.push(`/tenant-admin/subjects/${subjectId}/chapters/${ch.id}`)}
                              className="text-violet-600 hover:underline flex items-center gap-1 text-[11px]"
                            >
                              <Plus className="w-3 h-3" /> Manage Topics & Bulk Upload ↗
                            </button>
                          </div>

                          {topicList.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2 text-center bg-white rounded-xl border border-slate-200">
                              No topics created for this chapter yet. Click &quot;Add Topic&quot; above.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {topicList.map((tp: any, tIdx: number) => (
                                <div
                                  key={tp.id}
                                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-violet-300 transition-all flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-4 h-4 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                                        {tIdx + 1}
                                      </span>
                                      <h5 className="text-xs font-bold text-slate-900 truncate">
                                        {tp.name}
                                      </h5>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                                      <span
                                        className={cn(
                                          'font-bold uppercase px-1.5 py-0.2 rounded text-[9px]',
                                          tp.difficultyLevel === 'EASY'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : tp.difficultyLevel === 'HARD'
                                              ? 'bg-rose-50 text-rose-700'
                                              : 'bg-amber-50 text-amber-700',
                                        )}
                                      >
                                        {tp.difficultyLevel || 'MEDIUM'}
                                      </span>
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTopic(tp.id, tp.name)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                                    title="Delete topic"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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
        </div>

      </div>
    </DashboardLayout>
  );
}

export default function SubjectDetailSyllabusPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <SubjectDetailSyllabusContent />
    </ProtectedRoute>
  );
}
