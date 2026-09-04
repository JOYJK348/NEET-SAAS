'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCourse } from '@/features/master-data/hooks/use-courses';
import {
  useCourseSubjects,
  useAssignSubject,
  useUnassignSubject,
  useUpdateCourseSubject,
  courseSubjectKeys,
  courseSubjectsApi,
} from '@/features/master-data/hooks/use-course-subjects';
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from '@/features/master-data/hooks/use-subjects';
import { SubjectDialog } from '@/features/master-data/components/subjects/SubjectDialog';
import {
  useChapters,
  useCreateChapter,
  useUpdateChapter,
  useDeleteChapter,
  chapterKeys,
  chaptersApi,
} from '@/features/master-data/hooks/use-chapters';
import {
  useTopics,
  useCreateTopic,
  useUpdateTopic,
  useDeleteTopic,
  topicKeys,
  topicsApi,
} from '@/features/master-data/hooks/use-topics';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  Search,
  Sparkles,
  Loader2,
  Eye,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { BranchCoursesMappingSection } from '@/features/master-data/components/courses/BranchCoursesMappingSection';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  courseSubjectSchema,
  chapterSchema,
  topicSchema,
} from '@/features/master-data/validation/schemas';
import { toast } from 'sonner';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params?.id as string;
  const queryClient = useQueryClient();

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const [activeTab, setActiveTab] = useState(() => searchParams?.get('tab') || 'curriculum');

  // Mappings (lazy fetched when Curriculum tab is active)
  const { data: courseSubjects = [], isLoading: mappingsLoading } = useCourseSubjects(courseId, {
    enabled: activeTab === 'curriculum',
  });
  const assignMutation = useAssignSubject(courseId);
  const unassignMutation = useUnassignSubject(courseId);

  // Background prefetching on mount
  useEffect(() => {
    if (courseId) {
      void queryClient.prefetchQuery({
        queryKey: courseSubjectKeys.byCourse(courseId),
        queryFn: () => courseSubjectsApi.getCourseSubjects(courseId),
      });
    }
  }, [courseId, queryClient]);

  // Hover prefetching helpers
  const handleSubjectHover = (courseSubjectId: string) => {
    void queryClient.prefetchQuery({
      queryKey: chapterKeys.list({ courseSubjectId }),
      queryFn: () => chaptersApi.getChapters({ courseSubjectId }),
    });
  };

  const handleChapterHover = (chapterId: string) => {
    void queryClient.prefetchQuery({
      queryKey: topicKeys.list({ chapterId }),
      queryFn: () => topicsApi.getTopics({ chapterId }),
    });
  };

  // Hierarchy selections
  const [curriculumLevel, setCurriculumLevel] = useState<'subjects' | 'chapters' | 'topics'>(
    'subjects',
  );
  const [selectedCourseSubjectId, setSelectedCourseSubjectId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  // Lazy-fetched list query queries
  const { data: chaptersRes, isLoading: chaptersLoading } = useChapters({
    courseSubjectId: selectedCourseSubjectId || undefined,
    limit: 1000,
  });
  const chapters = useMemo(() => {
    const list = (chaptersRes?.data as any[]) || [];
    return [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [chaptersRes?.data]);

  const { data: topicsRes, isLoading: topicsLoading } = useTopics({
    chapterId: selectedChapterId || undefined,
    limit: 1000,
  });
  const topics = useMemo(() => {
    const list = (topicsRes?.data as any[]) || [];
    return [...list].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [topicsRes?.data]);

  // Dialog toggles
  const [assignOpen, setAssignOpen] = useState(false);
  const [chapterOpen, setChapterOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any | null>(null);
  const [editingTopic, setEditingTopic] = useState<any | null>(null);
  const [isSyncingMaster, setIsSyncingMaster] = useState(false);

  const handleSyncMasterChapters = async () => {
    if (!selectedCourseSubjectId) return;
    setIsSyncingMaster(true);
    try {
      const res = await api.post<any>(
        `/master/course-subjects/${selectedCourseSubjectId}/sync-master`,
      );
      toast.success(`Synchronized master chapters! (${res?.count || 0} new chapters added)`);
      void queryClient.invalidateQueries({
        queryKey: chapterKeys.list({ courseSubjectId: selectedCourseSubjectId }),
      });
      void queryClient.invalidateQueries({ queryKey: ['master', 'course-subjects'] });
    } catch {
      toast.error('Failed to sync master chapters');
    } finally {
      setIsSyncingMaster(false);
    }
  };

  // Master subjects list for dropdown selection
  const { data: subjectsRes } = useSubjects({ limit: 100 });

  // Mutation Triggers
  const updateCourseSubjectMutation = useUpdateCourseSubject(courseId);
  const updateChapterMutation = useUpdateChapter(selectedCourseSubjectId || '');
  const updateTopicMutation = useUpdateTopic(selectedChapterId || '');
  const deleteChapterMutation = useDeleteChapter(selectedCourseSubjectId || '');
  const deleteTopicMutation = useDeleteTopic(selectedChapterId || '');

  const [editingCourseSubject, setEditingCourseSubject] = useState<any | null>(null);

  const handleToggleCourseSubjectStatus = async (cs: any) => {
    try {
      await updateCourseSubjectMutation.mutateAsync({
        id: cs.id,
        input: { isActive: !cs.isActive },
      });
      toast.success(`Subject mapping status updated successfully`);
    } catch {
      toast.error('Failed to update mapping status');
    }
  };

  const handleToggleChapterStatus = async (ch: any) => {
    try {
      await updateChapterMutation.mutateAsync({
        id: ch.id,
        input: { isActive: !ch.isActive } as any,
      });
      toast.success(`Chapter status updated successfully`);
    } catch {
      toast.error('Failed to update chapter status');
    }
  };

  const handleToggleTopicStatus = async (tp: any) => {
    try {
      await updateTopicMutation.mutateAsync({
        id: tp.id,
        input: { isActive: !tp.isActive } as any,
      });
      toast.success(`Topic status updated successfully`);
    } catch {
      toast.error('Failed to update topic status');
    }
  };

  const handleUnassign = async (id: string) => {
    if (confirm('Unassign this subject?')) {
      try {
        await unassignMutation.mutateAsync(id);
        toast.success('Subject unassigned');
        if (selectedCourseSubjectId === id) {
          setSelectedCourseSubjectId(null);
          setSelectedChapterId(null);
        }
      } catch {
        toast.error('Failed to unassign subject');
      }
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (confirm('Delete this chapter?')) {
      try {
        await deleteChapterMutation.mutateAsync(id);
        toast.success('Chapter deleted');
        if (selectedChapterId === id) setSelectedChapterId(null);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Delete chapter failed.');
      }
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (confirm('Delete this topic?')) {
      try {
        await deleteTopicMutation.mutateAsync(id);
        toast.success('Topic deleted');
      } catch {
        toast.error('Failed to delete topic');
      }
    }
  };

  if (courseLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-xs font-bold text-slate-500">
          Loading course details...
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-xs font-bold text-rose-600">
          Course program not found.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 text-[#0F172A] font-sans">
        {/* Navigation Link */}
        <button
          onClick={() => router.push('/tenant-admin/courses')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition shadow-2xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#0052CC] shrink-0" />
          <span>Back to Courses</span>
        </button>

        {/* Header Banner - ISML LMS Light Blue Style */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-5 sm:p-6 rounded-2xl shadow-2xs border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#0052CC] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                {course.code}
              </span>
              <span className="text-[10px] font-extrabold bg-blue-50 text-[#0052CC] px-2 py-0.5 rounded-md border border-blue-200 uppercase">
                {course.courseType} &bull; {course.durationMonths} Months
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2447] leading-tight">
              {course.name}
            </h1>
            <p className="text-xs text-slate-600 font-medium max-w-xl">
              {course.description ||
                'Manage curriculum syllabus, subjects mapping, chapters, and branch allocations.'}
            </p>
          </div>

          <Button
            onClick={() => router.push(`/tenant-admin/courses/${courseId}/builder`)}
            className="px-4 py-2 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-2xs gap-2 shrink-0 self-end md:self-auto"
          >
            <Layers className="h-4 w-4 text-white" />
            <span>Open Builder</span>
            <ExternalLink className="h-3.5 w-3.5 text-white" />
          </Button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="bg-white p-1 rounded-2xl shadow-2xs border border-slate-200 flex gap-1">
          {[
            { key: 'curriculum', label: 'Curriculum (Syllabus)' },
            { key: 'branches', label: 'Branch Mappings' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-[#0052CC] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Page Content Container */}
        <div className="space-y-4">
          {/* Curriculum Tab */}
          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              {/* Dynamic Breadcrumb trail */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <button
                    onClick={() => {
                      setCurriculumLevel('subjects');
                      setSelectedCourseSubjectId(null);
                      setSelectedChapterId(null);
                    }}
                    className="hover:text-[#0052CC] transition-colors"
                  >
                    Syllabus ({courseSubjects.length})
                  </button>

                  {selectedCourseSubjectId && (
                    <>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      <button
                        onClick={() => {
                          setCurriculumLevel('chapters');
                          setSelectedChapterId(null);
                        }}
                        className={cn(
                          'hover:text-[#0052CC] transition-colors truncate max-w-[140px]',
                          curriculumLevel === 'chapters' && 'text-[#0052CC] font-extrabold',
                        )}
                      >
                        {courseSubjects.find((cs) => cs.id === selectedCourseSubjectId)?.subject
                          ?.name || 'Subject'}
                      </button>
                    </>
                  )}

                  {selectedChapterId && (
                    <>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-[#0052CC] font-extrabold truncate max-w-[140px]">
                        {chapters.find((ch) => ch.id === selectedChapterId)?.name || 'Chapter'}
                      </span>
                    </>
                  )}
                </div>

                {/* Primary Level Actions */}
                {curriculumLevel === 'subjects' && (
                  <button
                    onClick={() => router.push(`/tenant-admin/courses/${courseId}/map-subject`)}
                    className="flex items-center gap-1.5 text-xs font-extrabold text-white bg-[#0052CC] hover:bg-blue-700 px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Map Subject
                  </button>
                )}
              </div>

              {/* LEVEL 1: Subjects Catalog Grid */}
              {curriculumLevel === 'subjects' && (
                <>
                  {mappingsLoading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400 uppercase tracking-widest font-extrabold animate-pulse">
                      Loading mapped subjects...
                    </div>
                  ) : courseSubjects.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052CC] flex items-center justify-center mx-auto border border-blue-200">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <h3 className="font-extrabold text-[#0B2447] text-base">
                        No subjects mapped yet
                      </h3>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
                        Start by mapping a subject to build the syllabus structure.
                      </p>
                      <button
                        onClick={() => router.push(`/tenant-admin/courses/${courseId}/map-subject`)}
                        className="text-xs font-extrabold text-white bg-[#0052CC] hover:bg-blue-700 px-4 py-2 rounded-xl shadow-2xs"
                      >
                        + Map First Subject
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {courseSubjects.map((cs, sIdx) => {
                        const subjectName =
                          cs.subject?.displayName ||
                          cs.subject?.name ||
                          cs.subject?.code ||
                          'Subject';
                        return (
                          <div
                            key={cs.id}
                            className="group relative rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col bg-white border border-slate-200"
                            style={{ minHeight: '210px' }}
                          >
                            {/* Card Hero Header */}
                            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-4 text-white">
                              <div className="relative flex items-start justify-between mb-2">
                                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-xs border border-white/25">
                                  {cs.subject?.code?.slice(0, 3) || `S${sIdx + 1}`}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button
                                    type="button"
                                    onClick={() => handleUnassign(cs.id)}
                                    className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-rose-500/80 transition-colors"
                                    title="Unmap subject"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="relative">
                                <h3 className="text-white font-extrabold text-base leading-tight truncate">
                                  {subjectName}
                                </h3>
                                <span className="text-[10px] font-mono font-extrabold text-white/80 uppercase tracking-wider">
                                  {cs.subject?.code || 'CORE'}
                                </span>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="relative flex-1 p-4 flex flex-col justify-between space-y-4">
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                                  Syllabus Metrics
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-[10px] font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-[#0052CC]" /> {cs.plannedHours}{' '}
                                    Hours
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg uppercase">
                                    {cs.isMandatory ? 'Mandatory' : 'Optional'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                {/* Toggle switch */}
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCourseSubjectStatus(cs)}
                                    className={cn(
                                      'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out',
                                      cs.isActive ? 'bg-emerald-500' : 'bg-slate-300',
                                    )}
                                    title="Toggle mapping status"
                                  >
                                    <span
                                      className={cn(
                                        'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-2xs transition duration-200 ease-in-out',
                                        cs.isActive ? 'translate-x-3' : 'translate-x-0',
                                      )}
                                    />
                                  </button>
                                  <span
                                    className={cn(
                                      'text-[10px] font-bold uppercase tracking-wider',
                                      cs.isActive ? 'text-emerald-600' : 'text-slate-400',
                                    )}
                                  >
                                    {cs.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCourseSubjectId(cs.id);
                                    setCurriculumLevel('chapters');
                                  }}
                                  className="flex items-center gap-1 text-xs font-extrabold text-white bg-[#0052CC] hover:bg-blue-700 px-3 py-1.5 rounded-xl shadow-2xs transition-all"
                                >
                                  Manage Chapters
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Map Subject Dotted Action Card */}
                      <button
                        type="button"
                        onClick={() => router.push(`/tenant-admin/courses/${courseId}/map-subject`)}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-blue-200 hover:border-[#0052CC] bg-white text-xs font-extrabold text-[#0052CC] transition-all hover:bg-blue-50/50 shadow-2xs"
                        style={{ minHeight: '210px' }}
                      >
                        <Plus className="h-6 w-6 mb-1.5 text-[#0052CC]" />
                        Map Another Subject
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* LEVEL 2: Chapters Catalog Grid */}
              {curriculumLevel === 'chapters' && selectedCourseSubjectId && (
                <>
                  {/* Master Sync Info Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-800 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0052CC] shrink-0" />
                      <span className="font-medium">
                        <strong className="text-[#0B2447]">Master Chapters Synchronized:</strong>{' '}
                        Chapters & Topics are auto-populated from Master Subjects.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        disabled={isSyncingMaster}
                        onClick={handleSyncMasterChapters}
                        className="font-extrabold text-xs text-white bg-[#0052CC] hover:bg-blue-700 rounded-xl h-8 px-3 gap-1.5 shadow-2xs"
                      >
                        {isSyncingMaster ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        Sync Master Chapters
                      </Button>
                    </div>
                  </div>

                  {chaptersLoading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400 uppercase tracking-widest font-extrabold animate-pulse">
                      Loading chapters...
                    </div>
                  ) : chapters.length === 0 ? (
                    <Card className="p-12 text-center border border-dashed rounded-3xl border-slate-200 bg-white shadow-2xs space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052CC] mx-auto flex items-center justify-center border border-blue-200">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-extrabold text-[#0B2447]">
                        No chapters mapped to this subject yet
                      </h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                        If chapters were created in the Master Subjects Library, click below to sync
                        them into this course program.
                      </p>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <Button
                          type="button"
                          disabled={isSyncingMaster}
                          onClick={handleSyncMasterChapters}
                          className="bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl gap-1.5 shadow-2xs"
                        >
                          {isSyncingMaster ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          Sync Master Chapters
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {chapters.map((ch, cIdx) => (
                        <div
                          key={ch.id}
                          className="group relative rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col bg-white border border-slate-200"
                          style={{ minHeight: '210px' }}
                          onMouseEnter={() => handleChapterHover(ch.id)}
                        >
                          {/* Card Hero Header */}
                          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-4 text-white">
                            <div className="relative flex items-start justify-between mb-2">
                              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-xs border border-white/25">
                                {cIdx + 1}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChapter(ch.id)}
                                  className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-rose-500/80 transition-colors"
                                  title="Delete chapter"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="relative">
                              <h3 className="text-white font-extrabold text-base leading-tight truncate">
                                {ch.name}
                              </h3>
                              <span className="text-[10px] font-mono font-extrabold text-white/80 uppercase tracking-wider">
                                {ch.code}
                              </span>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="relative flex-1 p-4 flex flex-col justify-between space-y-4">
                            <div className="space-y-1">
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                                Chapter Specs
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[10px] font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#0052CC]" /> {ch.plannedHours}{' '}
                                  Hours
                                </span>
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                                  Sessions: {ch.estimatedSessions}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                              {/* Toggle switch */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleChapterStatus(ch)}
                                  className={cn(
                                    'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out',
                                    ch.isActive ? 'bg-emerald-500' : 'bg-slate-300',
                                  )}
                                  title="Toggle chapter status"
                                >
                                  <span
                                    className={cn(
                                      'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-2xs transition duration-200 ease-in-out',
                                      ch.isActive ? 'translate-x-3' : 'translate-x-0',
                                    )}
                                  />
                                </button>
                                <span
                                  className={cn(
                                    'text-[10px] font-bold uppercase tracking-wider',
                                    ch.isActive ? 'text-emerald-600' : 'text-slate-400',
                                  )}
                                >
                                  {ch.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChapterId(ch.id);
                                  setCurriculumLevel('topics');
                                }}
                                className="flex items-center gap-1 text-xs font-extrabold text-white bg-[#0052CC] hover:bg-blue-700 px-3 py-1.5 rounded-xl shadow-2xs transition-all"
                              >
                                Manage Topics
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* LEVEL 3: Topics Catalog Grid */}
              {curriculumLevel === 'topics' && selectedChapterId && (
                <>
                  {topicsLoading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400 uppercase tracking-widest font-extrabold animate-pulse">
                      Loading topics...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {topics.map((tp, tIdx) => (
                        <div
                          key={tp.id}
                          className="group relative rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col bg-white border border-slate-200"
                          style={{ minHeight: '190px' }}
                        >
                          {/* Card Hero Header */}
                          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-4 text-white">
                            <div className="relative flex items-start justify-between mb-2">
                              <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-xs border border-white/25">
                                {tIdx + 1}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTopic(tp.id)}
                                  className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-rose-500/80 transition-colors"
                                  title="Delete topic"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="relative">
                              <h3 className="text-white font-extrabold text-base leading-tight truncate">
                                {tp.name}
                              </h3>
                              <span className="text-[10px] font-mono font-extrabold text-white/80 uppercase tracking-wider">
                                {tp.code}
                              </span>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="relative flex-1 p-4 flex flex-col justify-between space-y-3">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">
                                Topic Parameters
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[10px] font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#0052CC]" /> {tp.plannedHours}h
                                  &bull; {tp.plannedSessions}s
                                </span>
                                <span
                                  className={cn(
                                    'text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border',
                                    tp.difficultyLevel === 'EASY'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : tp.difficultyLevel === 'MEDIUM'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200',
                                  )}
                                >
                                  {tp.difficultyLevel}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                              {/* Toggle switch */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTopicStatus(tp)}
                                  className={cn(
                                    'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out',
                                    tp.isActive ? 'bg-emerald-500' : 'bg-slate-300',
                                  )}
                                  title="Toggle topic status"
                                >
                                  <span
                                    className={cn(
                                      'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-2xs transition duration-200 ease-in-out',
                                      tp.isActive ? 'translate-x-3' : 'translate-x-0',
                                    )}
                                  />
                                </button>
                                <span
                                  className={cn(
                                    'text-[10px] font-bold uppercase tracking-wider',
                                    tp.isActive ? 'text-emerald-600' : 'text-slate-400',
                                  )}
                                >
                                  {tp.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/tenant-admin/courses/${courseId}/topics/${tp.id}/preview`,
                                  )
                                }
                                className="gap-1 font-extrabold text-[#0052CC] border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-xl text-[10px] h-7 px-2.5"
                              >
                                <Eye className="w-3 h-3 text-[#0052CC]" /> View Blocks
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Branches Tab */}
          {activeTab === 'branches' && <BranchCoursesMappingSection courseId={courseId} />}
        </div>
      </div>
    </DashboardLayout>
  );
}
