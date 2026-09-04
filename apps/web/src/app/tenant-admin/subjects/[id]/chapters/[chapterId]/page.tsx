'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Search,
  Trash2,
  X,
  Upload,
  ListPlus,
  Loader2,
  BookMarked,
  FileSpreadsheet,
  Eye,
  Sparkles,
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

  const handleProcessBulkTopics = async () => {
    if (!bulkTopicsText.trim() || !chapterId) {
      toast.error('Please enter topic names');
      return;
    }

    setIsProcessingBulk(true);
    try {
      const lines = bulkTopicsText
        .split('\n')
        .map((l) =>
          l
            .trim()
            .replace(/^[0-9]+\.\s*/, '')
            .replace(/^[-*]\s*/, ''),
        )
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
          cleanName
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 4)
            .toUpperCase() || 'TP';
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
      <div className="w-full space-y-6 text-[#0F172A] font-sans">
        {/* Navigation Link */}
        <button
          onClick={() => router.push(`/tenant-admin/subjects/${subjectId}`)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition shadow-2xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#0052CC] shrink-0" />
          <span>Back to {courseSubject?.subject?.name || 'Subject'} Syllabus</span>
        </button>

        {/* Header Banner - ISML LMS Light Blue Style */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-5 sm:p-6 rounded-2xl shadow-2xs border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#0052CC] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                Chapter Topics Management
              </span>
              <span className="text-[10px] font-extrabold bg-blue-50 text-[#0052CC] px-2 py-0.5 rounded-md border border-blue-200">
                {courseSubject?.subject?.name}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2447] leading-tight">
              {activeChapter?.name || 'Chapter Topics'}
            </h1>
            <p className="text-xs text-slate-600 font-medium max-w-xl">
              Manage learning topics for this chapter. Add individual topics or bulk import multiple
              topics at once.
            </p>
          </div>

          {/* Metrics Card */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shrink-0 shadow-2xs">
            <div className="text-center px-3">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Topics Count</p>
              <p className="text-2xl font-extrabold text-[#0052CC]">{topicsList.length}</p>
            </div>
          </div>
        </div>

        {/* Topics Catalog */}
        <div className="w-full space-y-4">
          {/* Search Toolbar */}
          <Card className="p-3.5 border border-slate-200 bg-white rounded-2xl shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search topics by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full font-medium"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Button
              onClick={() => setShowBulkTopics(!showBulkTopics)}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold text-[#0052CC] border-blue-200 bg-blue-50 hover:bg-blue-100 gap-1.5"
            >
              <ListPlus className="w-4 h-4 text-[#0052CC]" />
              {showBulkTopics ? 'Hide Bulk Paste' : 'Bulk Import Topics'}
            </Button>
          </Card>

          {/* Bulk Topics Paste Box */}
          {showBulkTopics && (
            <Card className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#0B2447] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#0052CC]" /> Paste List of Topics (Line
                  by Line):
                </label>
                <span className="text-[10px] text-[#0052CC] font-extrabold bg-white px-2 py-0.5 rounded-md border border-blue-200">
                  Auto-Generates Topic Codes
                </span>
              </div>
              <textarea
                value={bulkTopicsText}
                onChange={(e) => setBulkTopicsText(e.target.value)}
                rows={5}
                placeholder={`1. Newton's First Law of Motion\n2. Newton's Second Law & Inertia\n3. Conservation of Momentum\n4. Impulse and Force Measurements`}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBulkTopics(false)}
                  className="text-xs font-bold text-slate-500"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isProcessingBulk}
                  onClick={handleProcessBulkTopics}
                  className="bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl gap-1.5 shadow-2xs"
                >
                  {isProcessingBulk ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Import All Topics
                </Button>
              </div>
            </Card>
          )}

          {/* Topics Catalog Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filteredTopics.length === 0 ? (
            <Card className="p-12 text-center border border-dashed rounded-3xl border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052CC] mx-auto flex items-center justify-center border border-blue-200">
                <BookMarked className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-[#0B2447]">
                No topics added to this chapter yet
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
                Add topics using Bulk Import Topics above.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTopics.map((tp: any, idx: number) => (
                <Card
                  key={tp.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-all duration-200 shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="w-5 h-5 rounded-md bg-blue-50 text-[#0052CC] flex items-center justify-center text-xs font-extrabold shrink-0 border border-blue-200">
                        {idx + 1}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider border',
                          tp.difficultyLevel === 'EASY'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : tp.difficultyLevel === 'HARD'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200',
                        )}
                      >
                        {tp.difficultyLevel || 'MEDIUM'}
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-[#0B2447] pt-1 line-clamp-2">
                      {tp.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold block">
                      {tp.code}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px] font-bold text-slate-500 gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (firstCourseId) {
                            router.push(
                              `/tenant-admin/courses/${firstCourseId}/topics/${tp.id}/preview`,
                            );
                          } else {
                            toast.info('Please create a course program to preview topic content');
                            router.push('/tenant-admin/courses');
                          }
                        }}
                        className="gap-1 font-bold text-[#0052CC] border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-xl text-[10px] h-7 px-2"
                      >
                        <Eye className="w-3 h-3 text-[#0052CC]" /> View Blocks
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
                        className="gap-1 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-[10px] h-7 px-2 shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3 text-white" /> Builder
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(tp.id, tp.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete topic"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
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
