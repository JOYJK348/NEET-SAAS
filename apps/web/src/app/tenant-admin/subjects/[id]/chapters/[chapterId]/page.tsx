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
  Upload,
  ListPlus,
  Loader2,
  BookMarked,
  Layers,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCourses } from '@/features/master-data/hooks/use-courses';

function ChapterTopicsManagerContent() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;
  const chapterId = params.chapterId as string;

  const [search, setSearch] = useState('');

  // Single Topic Form State
  const [topicName, setTopicName] = useState('');
  const [topicHours, setTopicHours] = useState(2);
  const [topicSessions, setTopicSessions] = useState(2);
  const [topicDifficulty, setTopicDifficulty] = useState('MEDIUM');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  // Bulk Import Topics State
  const [showBulkTopics, setShowBulkTopics] = useState(false);
  const [bulkTopicsText, setBulkTopicsText] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Fetch Master Course Subject details to locate chapter & topics
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

  const { data: coursesRes } = useCourses({ limit: 10 });
  const firstCourseId = coursesRes?.data?.[0]?.id;

  const activeChapter = courseSubject?.chapters?.find((ch: any) => ch.id === chapterId);
  const topicsList: any[] = activeChapter?.topics || [];

  const handleAddSingleTopic = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topicName.trim() || !chapterId) {
      toast.error('Please enter a valid topic name');
      return;
    }

    setIsAddingTopic(true);
    try {
      const cleanName = topicName.trim();
      const codePrefix =
        cleanName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'TP';
      const order = topicsList.length + 1;

      await api.post('/master/topics', {
        chapterId,
        name: cleanName,
        code: `TP-${codePrefix}-${order}`,
        plannedHours: topicHours || 2,
        plannedSessions: topicSessions || 2,
        difficultyLevel: topicDifficulty,
        displayOrder: order,
      });

      toast.success(`Topic "${cleanName}" added successfully!`);
      setTopicName('');
      void refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add topic');
    } finally {
      setIsAddingTopic(false);
    }
  };

  const handleProcessBulkTopics = async () => {
    if (!bulkTopicsText.trim() || !chapterId) {
      toast.error('Please enter topic names');
      return;
    }

    setIsProcessingBulk(true);
    try {
      const lines = bulkTopicsText
        .split('\n')
        .map((l) => l.trim().replace(/^[0-9]+\.\s*/, '').replace(/^[-*]\s*/, ''))
        .filter(Boolean);

      if (lines.length === 0) {
        toast.error('No valid topic names found');
        setIsProcessingBulk(false);
        return;
      }

      let order = topicsList.length + 1;
      for (const name of lines) {
        const cleanName = name.trim();
        const codePrefix =
          cleanName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'TP';
        await api.post('/master/topics', {
          chapterId,
          name: cleanName,
          code: `TP-${codePrefix}-${order}`,
          plannedHours: 2,
          plannedSessions: 2,
          difficultyLevel: 'MEDIUM',
          displayOrder: order++,
        });
      }

      toast.success(`Added ${lines.length} topics to ${activeChapter?.name || 'chapter'}!`);
      setBulkTopicsText('');
      setShowBulkTopics(false);
      void refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to bulk import topics');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleDeleteTopic = async (topicId: string, name: string) => {
    if (!confirm(`Delete topic "${name}"?`)) return;
    try {
      await api.delete(`/master/topics/${topicId}`);
      toast.success('Topic deleted successfully');
      void refetch();
    } catch {
      toast.error('Failed to delete topic');
    }
  };

  const filteredTopics = topicsList.filter((tp) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return tp.name.toLowerCase().includes(q) || tp.code.toLowerCase().includes(q);
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Navigation Link */}
        <button
          onClick={() => router.push(`/tenant-admin/subjects/${subjectId}`)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-violet-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {courseSubject?.subject?.name || 'Subject'} Syllabus
        </button>

        {/* Hero Header Banner */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-violet-200 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-md text-white">
                Chapter Topics Management
              </span>
              <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-md text-violet-100">
                {courseSubject?.subject?.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {activeChapter?.name || 'Chapter Topics'}
            </h1>
            <p className="text-violet-200 text-xs max-w-xl">
              Manage learning topics for this chapter. Add individual topics or bulk import multiple topics at once.
            </p>
          </div>

          {/* Metrics Card */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shrink-0">
            <div className="text-center px-3">
              <p className="text-[10px] text-violet-200 uppercase font-bold">Topics Count</p>
              <p className="text-2xl font-black text-white">{topicsList.length}</p>
            </div>
          </div>
        </div>

        {/* Topics Catalog */}
        <div className="w-full space-y-4">
            {/* Search Toolbar */}
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search topics by name or code..."
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

              <Button
                onClick={() => setShowBulkTopics(!showBulkTopics)}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100 gap-1.5"
              >
                <ListPlus className="w-4 h-4 text-violet-600" />
                {showBulkTopics ? 'Hide Bulk Paste' : 'Bulk Import Topics 📥'}
              </Button>
            </div>

            {/* Bulk Topics Paste Box */}
            {showBulkTopics && (
              <div className="p-4 rounded-2xl bg-violet-50/80 border border-violet-200 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-violet-600" /> Paste List of Topics (Line by Line):
                  </label>
                  <span className="text-[10px] text-violet-600 font-bold bg-white px-2 py-0.5 rounded-md border border-violet-200">
                    Auto-Generates Topic Codes
                  </span>
                </div>
                <textarea
                  value={bulkTopicsText}
                  onChange={(e) => setBulkTopicsText(e.target.value)}
                  rows={5}
                  placeholder={`1. Newton's First Law of Motion\n2. Newton's Second Law & Inertia\n3. Conservation of Momentum\n4. Impulse and Force Measurements`}
                  className="w-full p-3 rounded-xl border border-violet-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBulkTopics(false)}
                    className="text-xs font-semibold text-slate-500"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isProcessingBulk}
                    onClick={handleProcessBulkTopics}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl gap-1.5"
                  >
                    {isProcessingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Import All Topics
                  </Button>
                </div>
              </div>
            )}

            {/* Topics Catalog Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="p-12 text-center border border-dashed rounded-3xl border-slate-200 bg-white shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center border border-violet-100">
                  <BookMarked className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No topics added to this chapter yet</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Add topics using the form on the right or use Bulk Import Topics above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTopics.map((tp: any, idx: number) => (
                  <div
                    key={tp.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-violet-300 transition-all duration-200 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="w-5 h-5 rounded-md bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-black shrink-0">
                          {idx + 1}
                        </span>
                        <span
                          className={cn(
                            'text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider',
                            tp.difficultyLevel === 'EASY'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : tp.difficultyLevel === 'HARD'
                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100',
                          )}
                        >
                          {tp.difficultyLevel || 'MEDIUM'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 pt-1 line-clamp-2">{tp.name}</h4>
                      <span className="text-[10px] font-mono text-slate-400 block">{tp.code}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px] font-semibold text-slate-500 gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (firstCourseId) {
                              router.push(`/tenant-admin/courses/${firstCourseId}/topics/${tp.id}/preview`);
                            } else {
                              toast.info('Please create a course program to preview topic content');
                              router.push('/tenant-admin/courses');
                            }
                          }}
                          className="gap-1 font-bold text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100 rounded-xl text-[10px] h-7 px-2"
                        >
                          <Eye className="w-3 h-3 text-violet-600" /> View Blocks 👁️
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (firstCourseId) {
                              router.push(
                                `/tenant-admin/courses/${firstCourseId}/builder?topicId=${tp.id}&topicCode=${encodeURIComponent(
                                  tp.code || '',
                                )}&topicName=${encodeURIComponent(tp.name || '')}`,
                              );
                            } else {
                              toast.info('Please create a course program to edit in Course Builder');
                              router.push('/tenant-admin/courses');
                            }
                          }}
                          className="gap-1 bg-[#7c3aed] hover:bg-violet-700 text-white font-bold rounded-xl text-[10px] h-7 px-2 shadow-xs"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" /> Builder 🚀
                        </Button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTopic(tp.id, tp.name)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete topic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ChapterTopicsManagerPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <ChapterTopicsManagerContent />
    </ProtectedRoute>
  );
}
