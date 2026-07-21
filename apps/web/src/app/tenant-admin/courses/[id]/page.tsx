'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { SubjectTable } from '@/features/master-data/components/subjects/SubjectTable';
import { SubjectDialog } from '@/features/master-data/components/subjects/SubjectDialog';
import { SubjectSkeleton } from '@/features/master-data/components/subjects/SubjectSkeleton';
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
  ClipboardList,
  Edit2,
  ChevronRight,
  ChevronDown,
  Folder,
  Search,
} from 'lucide-react';
import { BranchCoursesMappingSection } from '@/features/master-data/components/courses/BranchCoursesMappingSection';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
  });
  const chapters = chaptersRes?.data || [];

  const { data: topicsRes, isLoading: topicsLoading } = useTopics({
    chapterId: selectedChapterId || undefined,
  });
  const topics = topicsRes?.data || [];

  // Dialog toggles
  const [assignOpen, setAssignOpen] = useState(false);
  const [chapterOpen, setChapterOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any | null>(null);
  const [editingTopic, setEditingTopic] = useState<any | null>(null);

  // Master subjects list for dropdown selection
  const { data: subjectsRes } = useSubjects({ limit: 100 });
  const allSubjects = subjectsRes?.data || [];

  // Mapping Form
  const {
    register: regAssign,
    handleSubmit: handleAssignSubmit,
    setValue: setAssignVal,
    reset: resetAssign,
    formState: { errors: assignErrors },
  } = useForm({
    resolver: zodResolver(courseSubjectSchema),
    defaultValues: {
      subjectId: '',
      displayOrder: 1,
      isMandatory: true,
      totalMarks: 100,
      passingMarks: 40,
      credits: 0,
      plannedHours: 100,
    },
  });

  // Chapter Form
  const {
    register: regChapter,
    handleSubmit: handleChapterSubmit,
    reset: resetChapter,
    formState: { errors: chapterErrors },
  } = useForm({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      code: '',
      name: '',
      plannedHours: 10,
      estimatedSessions: 8,
      displayOrder: 1,
    },
  });

  // Topic Form
  const {
    register: regTopic,
    handleSubmit: handleTopicSubmit,
    setValue: setTopicVal,
    watch: watchTopic,
    reset: resetTopic,
    formState: { errors: topicErrors },
  } = useForm({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      code: '',
      name: '',
      difficultyLevel: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
      plannedHours: 4,
      plannedSessions: 3,
      displayOrder: 1,
    },
  });
  const difficultyVal = watchTopic('difficultyLevel');

  // Master Subjects State
  const [subjectPage, setSubjectPage] = useState(1);
  const [subjectSortBy, setSubjectSortBy] = useState('name');
  const [subjectSortOrder, setSubjectSortOrder] = useState<'asc' | 'desc'>('asc');
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [subjectSearch, setSubjectSearch] = useState('');

  const {
    data: subjectsData,
    isLoading: subjectsLoading,
    refetch: refetchSubjects,
  } = useSubjects(
    {
      page: subjectPage,
      limit: 10,
      search: activeTab === 'subjects' && subjectSearch ? subjectSearch : undefined,
      sortBy: subjectSortBy,
      sortOrder: subjectSortOrder,
    },
    {
      enabled: activeTab === 'subjects',
    },
  );

  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  const handleCreateSubject = () => {
    setSelectedSubject(null);
    setSubjectDialogOpen(true);
  };

  const handleEditSubject = (subject: any) => {
    setSelectedSubject(subject);
    setSubjectDialogOpen(true);
  };

  const handleDeleteSubject = async (id: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      try {
        await deleteSubjectMutation.mutateAsync(id);
        toast.success('Subject deleted successfully');
        void refetchSubjects();
        void queryClient.invalidateQueries({ queryKey: ['subjects'] });
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || 'Failed to delete subject';
        toast.error(errorMsg);
      }
    }
  };

  const handleSubjectFormSubmit = async (input: any) => {
    try {
      if (selectedSubject) {
        await updateSubjectMutation.mutateAsync({ id: selectedSubject.id, input });
        toast.success('Subject updated successfully');
      } else {
        await createSubjectMutation.mutateAsync(input);
        toast.success('Subject created successfully');
      }
      setSubjectDialogOpen(false);
      void refetchSubjects();
      void queryClient.invalidateQueries({ queryKey: ['subjects'] });
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleSubjectSort = (key: string) => {
    if (subjectSortBy === key) {
      setSubjectSortOrder(subjectSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSubjectSortBy(key);
      setSubjectSortOrder('asc');
    }
  };

  // Mutation Triggers
  const updateCourseSubjectMutation = useUpdateCourseSubject(courseId);
  const createChapterMutation = useCreateChapter(selectedCourseSubjectId || '');
  const updateChapterMutation = useUpdateChapter(selectedCourseSubjectId || '');
  const createTopicMutation = useCreateTopic(selectedChapterId || '');
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      toast.error('Failed to update topic status');
    }
  };

  const handleAssignOpenChange = (open: boolean) => {
    setAssignOpen(open);
    if (!open) {
      setEditingCourseSubject(null);
      resetAssign({
        subjectId: '',
        displayOrder: 1,
        isMandatory: true,
        totalMarks: 100,
        passingMarks: 40,
        credits: 0,
        plannedHours: 100,
      });
    }
  };

  const handleChapterOpenChange = (open: boolean) => {
    setChapterOpen(open);
    if (!open) {
      setEditingChapter(null);
      resetChapter({
        code: '',
        name: '',
        plannedHours: 10,
        estimatedSessions: 8,
        displayOrder: 1,
      });
    }
  };

  const handleTopicOpenChange = (open: boolean) => {
    setTopicOpen(open);
    if (!open) {
      setEditingTopic(null);
      resetTopic({
        code: '',
        name: '',
        difficultyLevel: 'MEDIUM',
        plannedHours: 4,
        plannedSessions: 3,
        displayOrder: 1,
      });
    }
  };

  useEffect(() => {
    if (editingChapter) {
      resetChapter({
        code: editingChapter.code,
        name: editingChapter.name,
        plannedHours: editingChapter.plannedHours || 10,
        estimatedSessions: editingChapter.estimatedSessions || 8,
        displayOrder: editingChapter.displayOrder || 1,
      });
    }
  }, [editingChapter, resetChapter]);

  useEffect(() => {
    if (editingTopic) {
      resetTopic({
        code: editingTopic.code,
        name: editingTopic.name,
        difficultyLevel: editingTopic.difficultyLevel || 'MEDIUM',
        plannedHours: editingTopic.plannedHours || 4,
        plannedSessions: editingTopic.plannedSessions || 3,
        displayOrder: editingTopic.displayOrder || 1,
      });
    }
  }, [editingTopic, resetTopic]);

  useEffect(() => {
    if (editingCourseSubject) {
      resetAssign({
        subjectId: editingCourseSubject.subjectId,
        displayOrder: editingCourseSubject.displayOrder || 1,
        isMandatory: editingCourseSubject.isMandatory ?? true,
        totalMarks: editingCourseSubject.totalMarks || 100,
        passingMarks: editingCourseSubject.passingMarks || 40,
        credits: editingCourseSubject.credits || 0,
        plannedHours: editingCourseSubject.plannedHours || 100,
      });
    }
  }, [editingCourseSubject, resetAssign]);

  // Submissions
  const onAssign = async (data: any) => {
    try {
      if (editingCourseSubject) {
        await updateCourseSubjectMutation.mutateAsync({
          id: editingCourseSubject.id,
          input: {
            displayOrder: Number(data.displayOrder),
            isMandatory: data.isMandatory,
            totalMarks: Number(data.totalMarks),
            passingMarks: Number(data.passingMarks),
            credits: Number(data.credits),
            plannedHours: Number(data.plannedHours),
          },
        });
        toast.success('Subject mapping updated successfully');
      } else {
        await assignMutation.mutateAsync({
          courseId,
          subjectId: data.subjectId,
          displayOrder: Number(data.displayOrder),
          isMandatory: data.isMandatory,
          totalMarks: Number(data.totalMarks),
          passingMarks: Number(data.passingMarks),
          credits: Number(data.credits),
          plannedHours: Number(data.plannedHours),
        });
        toast.success('Subject mapped to course');
      }
      setAssignOpen(false);
      setEditingCourseSubject(null);
      resetAssign();
    } catch (err) {
      toast.error('Operation failed. Please verify marks logic and duplicates.');
    }
  };

  const onAddChapter = async (data: any) => {
    if (!selectedCourseSubjectId) return;
    try {
      if (editingChapter) {
        await updateChapterMutation.mutateAsync({
          id: editingChapter.id,
          input: {
            code: data.code,
            name: data.name,
            plannedHours: Number(data.plannedHours),
            estimatedSessions: Number(data.estimatedSessions),
            displayOrder: Number(data.displayOrder),
          },
        });
        toast.success('Chapter updated successfully');
      } else {
        await createChapterMutation.mutateAsync({
          courseSubjectId: selectedCourseSubjectId,
          code: data.code,
          name: data.name,
          plannedHours: Number(data.plannedHours),
          estimatedSessions: Number(data.estimatedSessions),
          displayOrder: Number(data.displayOrder),
        });
        toast.success('Chapter created successfully');
      }
      setChapterOpen(false);
      setEditingChapter(null);
      resetChapter();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save chapter');
    }
  };

  const onAddTopic = async (data: any) => {
    if (!selectedChapterId) return;
    try {
      if (editingTopic) {
        await updateTopicMutation.mutateAsync({
          id: editingTopic.id,
          input: {
            code: data.code,
            name: data.name,
            difficultyLevel: data.difficultyLevel,
            plannedHours: Number(data.plannedHours),
            plannedSessions: Number(data.plannedSessions),
            displayOrder: Number(data.displayOrder),
          },
        });
        toast.success('Topic updated successfully');
      } else {
        await createTopicMutation.mutateAsync({
          chapterId: selectedChapterId,
          code: data.code,
          name: data.name,
          difficultyLevel: data.difficultyLevel,
          plannedHours: Number(data.plannedHours),
          plannedSessions: Number(data.plannedSessions),
          displayOrder: Number(data.displayOrder),
        });
        toast.success('Topic created successfully');
      }
      setTopicOpen(false);
      setEditingTopic(null);
      resetTopic();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save topic');
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
      } catch (err) {
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
      } catch (err) {
        toast.error('Failed to delete topic');
      }
    }
  };

  if (courseLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">Loading course...</div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-red-500">Course not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* ── Page Hero Card Banner ── */}
        <div className="bg-[#7c3aed] rounded-3xl p-6 relative overflow-hidden shadow-md">
          {/* Subtle Decorative Shapes */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-600/30 blur-2xl" />

          {/* Back Navigation Button */}
          <button
            onClick={() => router.back()}
            className="relative z-10 flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold mb-4 transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Curriculum
          </button>

          {/* Title and Metadata */}
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl sm:text-2xl leading-tight">
                {course.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                <span className="text-[10px] font-mono font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  {course.code}
                </span>
                <span className="text-white/60 text-xs font-medium">
                  · {course.durationMonths} Months
                </span>
                <span className="text-white/60 text-xs font-medium">· {course.courseType}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation Bar ── */}
        <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
          {[
            { key: 'curriculum', label: 'Curriculum (Syllabus)' },
            { key: 'branches', label: 'Branch Mappings' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-[#7c3aed] text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Page Content Container ── */}
        <div className="space-y-4 pb-8">
          {/* Curriculum Tab */}
          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              {/* ── Dynamic Breadcrumb trail ── */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-3xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                  <button
                    onClick={() => {
                      setCurriculumLevel('subjects');
                      setSelectedCourseSubjectId(null);
                      setSelectedChapterId(null);
                    }}
                    className="hover:text-[#7c3aed] transition-colors"
                  >
                    Syllabus ({courseSubjects.length})
                  </button>

                  {selectedCourseSubjectId && (
                    <>
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                      <button
                        onClick={() => {
                          setCurriculumLevel('chapters');
                          setSelectedChapterId(null);
                        }}
                        className={cn(
                          'hover:text-[#7c3aed] transition-colors truncate max-w-[120px]',
                          curriculumLevel === 'chapters' && 'text-[#7c3aed]',
                        )}
                      >
                        {courseSubjects.find((cs) => cs.id === selectedCourseSubjectId)?.subject
                          ?.name || 'Subject'}
                      </button>
                    </>
                  )}

                  {selectedChapterId && (
                    <>
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                      <span className="text-[#7c3aed] truncate max-w-[120px]">
                        {chapters.find((ch) => ch.id === selectedChapterId)?.name || 'Chapter'}
                      </span>
                    </>
                  )}
                </div>

                {/* Primary Level Actions */}
                {curriculumLevel === 'subjects' && (
                  <button
                    onClick={() => setAssignOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#7c3aed] px-3.5 py-1.5 rounded-xl shadow-xs hover:opacity-90 transition-opacity"
                  >
                    <Plus className="h-3.5 w-3.5" /> Map Subject
                  </button>
                )}
              </div>

              {/* ── LEVEL 1: Subjects Catalog Grid ── */}
              {curriculumLevel === 'subjects' && (
                <>
                  {mappingsLoading ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-xs text-gray-400 uppercase tracking-widest font-bold animate-pulse">
                      Loading mapped subjects...
                    </div>
                  ) : courseSubjects.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#7c3aed]/10 flex items-center justify-center mx-auto mb-3">
                        <BookOpen className="h-7 w-7 text-[#7c3aed]" />
                      </div>
                      <p className="font-bold text-gray-800 mb-1 text-sm">No subjects mapped yet</p>
                      <p className="text-xs text-gray-400 mb-4">
                        Start by mapping a subject to build the syllabus
                      </p>
                      <button
                        onClick={() => setAssignOpen(true)}
                        className="text-xs font-bold text-white bg-[#7c3aed] px-4 py-2 rounded-xl"
                      >
                        + Map First Subject
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courseSubjects.map((cs, sIdx) => {
                        const subjectName =
                          cs.subject?.displayName ||
                          cs.subject?.name ||
                          cs.subject?.code ||
                          'Subject';
                        return (
                          <div
                            key={cs.id}
                            className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-400 flex flex-col bg-white border border-gray-100"
                            style={{ minHeight: '220px' }}
                          >
                            {/* Card Hero Header */}
                            <div className="relative bg-[#7c3aed] px-5 pt-5 pb-8 overflow-hidden">
                              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-md" />
                              <div className="absolute top-2 right-4 w-10 h-10 rounded-full bg-white/5" />

                              <div className="relative flex items-start justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xs">
                                  {cs.subject?.code?.slice(0, 3) || `S${sIdx + 1}`}
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCourseSubject(cs);
                                      setAssignOpen(true);
                                    }}
                                    className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                                    title="Edit mapping parameters"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUnassign(cs.id)}
                                    className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-400/60 transition-colors"
                                    title="Unmap subject"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="relative">
                                <h3 className="text-white font-bold text-base leading-tight mb-0.5 truncate">
                                  {subjectName}
                                </h3>
                                <span className="text-[9px] font-mono font-semibold text-white/70 uppercase tracking-widest">
                                  {cs.subject?.code || 'CORE'}
                                </span>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="relative flex-1 px-5 pt-4 pb-4 flex flex-col justify-between">
                              <div className="flex-1">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                                  Parameters
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-[10px] font-semibold text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-0.5 rounded border border-[#7c3aed]/20">
                                    ⏱ {cs.plannedHours} Hours
                                  </span>
                                  <span className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-150 uppercase">
                                    {cs.isMandatory ? 'Mandatory' : 'Optional'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-3.5 border-t border-gray-100">
                                {/* Left: Toggle switch */}
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCourseSubjectStatus(cs)}
                                    className={cn(
                                      'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out outline-hidden',
                                      cs.isActive ? 'bg-emerald-500' : 'bg-gray-300',
                                    )}
                                    title="Toggle mapping status"
                                  >
                                    <span
                                      className={cn(
                                        'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                                        cs.isActive ? 'translate-x-3' : 'translate-x-0',
                                      )}
                                    />
                                  </button>
                                  <span
                                    className={cn(
                                      'text-[9px] font-bold uppercase tracking-wider',
                                      cs.isActive ? 'text-emerald-600' : 'text-gray-500',
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
                                  className="flex items-center gap-1 text-xs font-bold text-[#7c3aed] hover:opacity-75 transition-opacity group/cta"
                                >
                                  Manage Chapters
                                  <ChevronRight className="h-3.5 w-3.5 group-hover/cta:translate-x-0.5 transition-transform" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Map Subject Dotted Action Card */}
                      <button
                        type="button"
                        onClick={() => setAssignOpen(true)}
                        className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed border-[#7c3aed]/20 hover:border-[#7c3aed]/60 bg-white text-xs font-bold text-[#7c3aed] transition-all hover:bg-[#7c3aed]/3 shadow-3xs"
                        style={{ minHeight: '220px' }}
                      >
                        <Plus className="h-6 w-6 mb-2" />
                        Map Another Subject
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── LEVEL 2: Chapters Catalog Grid ── */}
              {curriculumLevel === 'chapters' && selectedCourseSubjectId && (
                <>
                  {chaptersLoading ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-xs text-gray-400 uppercase tracking-widest font-bold animate-pulse">
                      Loading chapters...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {chapters.map((ch, cIdx) => (
                        <div
                          key={ch.id}
                          className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-400 flex flex-col bg-white border border-gray-100"
                          style={{ minHeight: '220px' }}
                          onMouseEnter={() => handleChapterHover(ch.id)}
                        >
                          {/* Card Hero Header */}
                          <div className="relative bg-[#7c3aed] px-5 pt-5 pb-8 overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-md" />
                            <div className="absolute top-2 right-4 w-10 h-10 rounded-full bg-white/5" />

                            <div className="relative flex items-start justify-between mb-3">
                              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xs">
                                {cIdx + 1}
                              </div>
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingChapter(ch);
                                    setChapterOpen(true);
                                  }}
                                  className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                                  title="Edit chapter"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteChapter(ch.id)}
                                  className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-400/60 transition-colors"
                                  title="Delete chapter"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="relative">
                              <h3 className="text-white font-bold text-base leading-tight mb-0.5 truncate">
                                {ch.name}
                              </h3>
                              <span className="text-[9px] font-mono font-semibold text-white/70 uppercase tracking-widest">
                                {ch.code}
                              </span>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="relative flex-1 px-5 pt-4 pb-4 flex flex-col justify-between">
                            <div className="flex-1">
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                                Parameters
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[10px] font-semibold text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-0.5 rounded border border-[#7c3aed]/20">
                                  ⏱ {ch.plannedHours} Hours
                                </span>
                                <span className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-150">
                                  Sessions: {ch.estimatedSessions}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3.5 border-t border-gray-100">
                              {/* Left: Toggle switch */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleChapterStatus(ch)}
                                  className={cn(
                                    'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out outline-hidden',
                                    ch.isActive ? 'bg-emerald-500' : 'bg-gray-300',
                                  )}
                                  title="Toggle chapter status"
                                >
                                  <span
                                    className={cn(
                                      'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                                      ch.isActive ? 'translate-x-3' : 'translate-x-0',
                                    )}
                                  />
                                </button>
                                <span
                                  className={cn(
                                    'text-[9px] font-bold uppercase tracking-wider',
                                    ch.isActive ? 'text-emerald-600' : 'text-gray-500',
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
                                className="flex items-center gap-1 text-xs font-bold text-[#7c3aed] hover:opacity-75 transition-opacity group/cta"
                              >
                                Manage Topics
                                <ChevronRight className="h-3.5 w-3.5 group-hover/cta:translate-x-0.5 transition-transform" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add Chapter Action Card */}
                      <button
                        type="button"
                        onClick={() => setChapterOpen(true)}
                        className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed border-[#7c3aed]/20 hover:border-[#7c3aed]/60 bg-white text-xs font-bold text-[#7c3aed] transition-all hover:bg-[#7c3aed]/3 shadow-3xs"
                        style={{ minHeight: '220px' }}
                      >
                        <Plus className="h-6 w-6 mb-2" />
                        Add New Chapter
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ── LEVEL 3: Topics Catalog Grid ── */}
              {curriculumLevel === 'topics' && selectedChapterId && (
                <>
                  {topicsLoading ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-xs text-gray-400 uppercase tracking-widest font-bold animate-pulse">
                      Loading topics...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {topics.map((tp, tIdx) => (
                        <div
                          key={tp.id}
                          className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-400 flex flex-col bg-white border border-gray-100"
                          style={{ minHeight: '200px' }}
                        >
                          {/* Card Hero Header */}
                          <div className="relative bg-[#7c3aed] px-5 pt-5 pb-8 overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-md" />
                            <div className="absolute top-2 right-4 w-10 h-10 rounded-full bg-white/5" />

                            <div className="relative flex items-start justify-between mb-3">
                              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xs">
                                {tIdx + 1}
                              </div>
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTopic(tp);
                                    setTopicOpen(true);
                                  }}
                                  className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                                  title="Edit topic"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTopic(tp.id)}
                                  className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-400/60 transition-colors"
                                  title="Delete topic"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="relative">
                              <h3 className="text-white font-bold text-base leading-tight mb-0.5 truncate">
                                {tp.name}
                              </h3>
                              <span className="text-[9px] font-mono font-semibold text-white/70 uppercase tracking-widest">
                                {tp.code}
                              </span>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="relative flex-1 px-5 pt-4 pb-4 flex flex-col justify-between">
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                                Parameters
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[10px] font-semibold text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-0.5 rounded border border-[#7c3aed]/20">
                                  ⏱ {tp.plannedHours}h · {tp.plannedSessions}s
                                </span>
                                <span
                                  className={cn(
                                    'text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider',
                                    tp.difficultyLevel === 'EASY'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                      : tp.difficultyLevel === 'MEDIUM'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                        : 'bg-rose-50 text-rose-700 border border-rose-100',
                                  )}
                                >
                                  {tp.difficultyLevel}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3.5 border-t border-gray-100">
                              {/* Toggle switch */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTopicStatus(tp)}
                                  className={cn(
                                    'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out outline-hidden',
                                    tp.isActive ? 'bg-emerald-500' : 'bg-gray-300',
                                  )}
                                  title="Toggle topic status"
                                >
                                  <span
                                    className={cn(
                                      'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                                      tp.isActive ? 'translate-x-3' : 'translate-x-0',
                                    )}
                                  />
                                </button>
                                <span
                                  className={cn(
                                    'text-[9px] font-bold uppercase tracking-wider',
                                    tp.isActive ? 'text-emerald-600' : 'text-gray-500',
                                  )}
                                >
                                  {tp.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add Topic Action Card */}
                      <button
                        type="button"
                        onClick={() => setTopicOpen(true)}
                        className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed border-[#7c3aed]/20 hover:border-[#7c3aed]/60 bg-white text-xs font-bold text-[#7c3aed] transition-all hover:bg-[#7c3aed]/3 shadow-3xs"
                        style={{ minHeight: '200px' }}
                      >
                        <Plus className="h-6 w-6 mb-2" />
                        Add New Topic
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Branches Tab */}
          {activeTab === 'branches' && <BranchCoursesMappingSection courseId={courseId} />}
        </div>

        {/* ── DIALOGS ── */}

        {/* Dialog 1: Map Subject */}
        <Dialog open={assignOpen} onOpenChange={handleAssignOpenChange}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-border shadow-2xl transition-all duration-300 max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:max-w-full w-full">
            {/* Mobile Drag Pill */}
            <div className="w-12 h-1 bg-white/30 rounded-full mx-auto my-3 block sm:hidden absolute top-0 left-1/2 -translate-x-1/2" />

            <div className="bg-[#7c3aed] p-6 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/10 blur-xl" />
              <DialogTitle className="text-base font-extrabold tracking-tight">
                {editingCourseSubject ? 'Edit Subject Mapping' : 'Map Subject to Syllabus'}
              </DialogTitle>
              <DialogDescription className="text-white/80 text-xs mt-1">
                {editingCourseSubject
                  ? 'Update mapped subject academic details.'
                  : 'Associate a core subject program to this course syllabus catalog.'}
              </DialogDescription>
            </div>

            <form onSubmit={handleAssignSubmit(onAssign)} className="p-6 space-y-4 bg-white">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Select Subject Catalog
                </Label>
                <Select
                  value={
                    editingCourseSubject ? (editingCourseSubject.subjectId as string) : undefined
                  }
                  onValueChange={(val) => setAssignVal('subjectId', val)}
                  disabled={!!editingCourseSubject}
                >
                  <SelectTrigger className="h-10 rounded-xl border-gray-200">
                    <SelectValue placeholder="Choose a master subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="font-semibold text-gray-800 text-xs">{s.name}</span>{' '}
                        <span className="text-[10px] font-mono text-gray-400 font-bold">
                          ({s.code})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignErrors.subjectId && (
                  <p className="text-2xs text-red-500 font-bold">
                    {assignErrors.subjectId.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Planned Hours
                  </Label>
                  <Input
                    type="number"
                    className="h-10 rounded-xl border-gray-200"
                    placeholder="e.g. 100"
                    {...regAssign('plannedHours')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Display Order
                  </Label>
                  <Input
                    type="number"
                    className="h-10 rounded-xl border-gray-200"
                    placeholder="e.g. 1"
                    {...regAssign('displayOrder')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Total Marks
                  </Label>
                  <Input
                    type="number"
                    className="h-10 rounded-xl border-gray-200"
                    placeholder="e.g. 100"
                    {...regAssign('totalMarks')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Passing Marks
                  </Label>
                  <Input
                    type="number"
                    className="h-10 rounded-xl border-gray-200"
                    placeholder="e.g. 40"
                    {...regAssign('passingMarks')}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 max-sm:pb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAssignOpenChange(false)}
                  className="flex-1 h-10 rounded-xl text-xs font-bold border-gray-250"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 rounded-xl text-xs font-bold bg-[#7c3aed] hover:opacity-90 text-white shadow-sm"
                >
                  {editingCourseSubject ? 'Save Mapping' : 'Map Subject'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog 2: Create/Edit Chapter */}
        <Dialog open={chapterOpen} onOpenChange={handleChapterOpenChange}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-border shadow-2xl transition-all duration-300 max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:max-w-full w-full">
            {/* Mobile Drag Pill */}
            <div className="w-12 h-1 bg-white/30 rounded-full mx-auto my-3 block sm:hidden absolute top-0 left-1/2 -translate-x-1/2" />

            <div className="bg-[#7c3aed] p-6 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/10 blur-xl" />
              <DialogTitle className="text-base font-extrabold tracking-tight">
                {editingChapter ? 'Edit Chapter Details' : 'Create New Chapter'}
              </DialogTitle>
              <DialogDescription className="text-white/80 text-xs mt-1">
                {editingChapter
                  ? "Update this chapter's academic details."
                  : 'Configure a new syllabus chapter.'}
              </DialogDescription>
            </div>

            <form onSubmit={handleChapterSubmit(onAddChapter)} className="p-6 space-y-4 bg-white">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Chapter Code
                </Label>
                <Input
                  placeholder="e.g. PHY-CH01"
                  className="h-10 rounded-xl font-mono text-xs border-gray-200"
                  {...regChapter('code')}
                  disabled={!!editingChapter}
                />
                {chapterErrors.code && (
                  <p className="text-2xs text-red-500 font-bold">{chapterErrors.code.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Chapter Title
                </Label>
                <Input
                  placeholder="e.g. Thermodynamics & Heat Transfers"
                  className="h-10 rounded-xl border-gray-200"
                  {...regChapter('name')}
                />
                {chapterErrors.name && (
                  <p className="text-2xs text-red-500 font-bold">{chapterErrors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Planned Hours
                  </Label>
                  <Input
                    type="number"
                    className="h-10 rounded-xl border-gray-200"
                    placeholder="e.g. 10"
                    {...regChapter('plannedHours')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Estimated Sessions
                  </Label>
                  <Input
                    type="number"
                    className="h-10 rounded-xl border-gray-200"
                    placeholder="e.g. 8"
                    {...regChapter('estimatedSessions')}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 max-sm:pb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleChapterOpenChange(false)}
                  className="flex-1 h-10 rounded-xl text-xs font-bold border-gray-250"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 rounded-xl text-xs font-bold bg-[#7c3aed] hover:opacity-90 text-white shadow-sm"
                >
                  {editingChapter ? 'Save Changes' : 'Create Chapter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog 3: Create/Edit Topic */}
        <Dialog open={topicOpen} onOpenChange={handleTopicOpenChange}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-border shadow-2xl transition-all duration-300 max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:max-w-full w-full">
            {/* Mobile Drag Pill */}
            <div className="w-12 h-1 bg-white/30 rounded-full mx-auto my-3 block sm:hidden absolute top-0 left-1/2 -translate-x-1/2" />

            <div className="bg-[#7c3aed] p-6 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-white/10 blur-xl" />
              <DialogTitle className="text-base font-extrabold tracking-tight">
                {editingTopic ? 'Edit Syllabus Topic' : 'Create Lecture Topic'}
              </DialogTitle>
              <DialogDescription className="text-white/80 text-xs mt-1">
                {editingTopic
                  ? 'Update settings for this syllabus concept.'
                  : 'Configure a new syllabus lecture topic.'}
              </DialogDescription>
            </div>

            <form onSubmit={handleTopicSubmit(onAddTopic)} className="p-6 space-y-4 bg-white">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Topic Code
                </Label>
                <Input
                  placeholder="e.g. PHY-CH01-T01"
                  className="h-10 rounded-xl font-mono text-xs border-gray-200"
                  {...regTopic('code')}
                  disabled={!!editingTopic}
                />
                {topicErrors.code && (
                  <p className="text-2xs text-red-500 font-bold">{topicErrors.code.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Topic Name
                </Label>
                <Input
                  placeholder="e.g. Kinetic Theory of Gases"
                  className="h-10 rounded-xl border-gray-200"
                  {...regTopic('name')}
                />
                {topicErrors.name && (
                  <p className="text-2xs text-red-500 font-bold">{topicErrors.name.message}</p>
                )}
              </div>

              {/* Premium Card-style Difficulty Selector instead of raw dropdown */}
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Difficulty Level
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      val: 'EASY',
                      label: 'Easy',
                      border: 'border-emerald-250',
                      bg: 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/10',
                    },
                    {
                      val: 'MEDIUM',
                      label: 'Medium',
                      border: 'border-amber-250',
                      bg: 'bg-amber-50 text-amber-700 shadow-sm shadow-amber-500/10',
                    },
                    {
                      val: 'HARD',
                      label: 'Hard',
                      border: 'border-rose-250',
                      bg: 'bg-rose-50 text-rose-700 shadow-sm shadow-rose-500/10',
                    },
                  ].map((level) => {
                    const isSelected = difficultyVal === level.val;
                    return (
                      <button
                        key={level.val}
                        type="button"
                        onClick={() => setTopicVal('difficultyLevel', level.val as any)}
                        className={cn(
                          'py-2 px-3 text-xs font-extrabold rounded-xl border text-center transition-all duration-200',
                          isSelected
                            ? `${level.bg} ${level.border} scale-102 ring-1 ring-[#7c3aed]/10`
                            : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50/50',
                        )}
                      >
                        {level.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Planned Hours
                  </Label>
                  <Input
                    type="number"
                    className="h-10 rounded-xl border-gray-200"
                    placeholder="e.g. 4"
                    {...regTopic('plannedHours')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Sessions
                  </Label>
                  <Input
                    type="number"
                    className="h-10 rounded-xl border-gray-200"
                    placeholder="e.g. 3"
                    {...regTopic('plannedSessions')}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 max-sm:pb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleTopicOpenChange(false)}
                  className="flex-1 h-10 rounded-xl text-xs font-bold border-gray-250"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-10 rounded-xl text-xs font-bold bg-[#7c3aed] hover:opacity-90 text-white shadow-sm"
                >
                  {editingTopic ? 'Save Changes' : 'Create Topic'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog 4: Create/Edit Master Subject */}
        <SubjectDialog
          open={subjectDialogOpen}
          onOpenChange={setSubjectDialogOpen}
          subject={selectedSubject}
          onSubmit={handleSubjectFormSubmit}
          isSubmitting={createSubjectMutation.isPending || updateSubjectMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
