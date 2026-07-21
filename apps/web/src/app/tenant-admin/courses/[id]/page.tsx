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
  const createChapterMutation = useCreateChapter(selectedCourseSubjectId || '');
  const updateChapterMutation = useUpdateChapter(selectedCourseSubjectId || '');
  const createTopicMutation = useCreateTopic(selectedChapterId || '');
  const updateTopicMutation = useUpdateTopic(selectedChapterId || '');
  const deleteChapterMutation = useDeleteChapter(selectedCourseSubjectId || '');
  const deleteTopicMutation = useDeleteTopic(selectedChapterId || '');

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

  // Submissions
  const onAssign = async (data: any) => {
    try {
      await assignMutation.mutateAsync({
        courseId,
        subjectId: data.subjectId,
        displayOrder: data.displayOrder,
        isMandatory: data.isMandatory,
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks,
        credits: data.credits,
        plannedHours: data.plannedHours,
      });
      toast.success('Subject mapped to course');
      setAssignOpen(false);
      resetAssign();
    } catch (err) {
      toast.error('Assignment failed or duplicate mapped subject');
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
            <div className="space-y-3">
              {/* Header Bar */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Subjects & Chapters
                </p>
                <button
                  onClick={() => setAssignOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#7c3aed] px-3 py-1.5 rounded-xl shadow-sm hover:opacity-90 transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5" /> Map Subject
                </button>
              </div>

              {/* Loading / Empty State */}
              {mappingsLoading ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">
                  Loading curriculum...
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
                /* Subject Cards */
                courseSubjects.map((cs, sIdx) => {
                  const isSubjectOpen = selectedCourseSubjectId === cs.id;
                  const subjectName =
                    cs.subject?.displayName || cs.subject?.name || cs.subject?.code || 'Subject';

                  return (
                    <div
                      key={cs.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                    >
                      {/* Subject Row */}
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          setSelectedCourseSubjectId(isSubjectOpen ? null : cs.id);
                          setSelectedChapterId(null);
                        }}
                        onMouseEnter={() => handleSubjectHover(cs.id)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#7c3aed] flex items-center justify-center text-white font-bold text-xs shrink-0">
                          {cs.subject?.code?.slice(0, 3) || `S${sIdx + 1}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm truncate">{subjectName}</p>
                          <p className="text-[10px] text-gray-400">
                            {cs.plannedHours}h planned · {cs.isMandatory ? 'Mandatory' : 'Optional'}
                          </p>
                        </div>
                        <div
                          className="flex items-center gap-2 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setSelectedCourseSubjectId(cs.id);
                              setChapterOpen(true);
                            }}
                            className="text-[10px] font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-2.5 py-1 rounded-lg"
                          >
                            + Chapter
                          </button>
                          <button
                            onClick={() => handleUnassign(cs.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-gray-400 shrink-0">
                          {isSubjectOpen ? (
                            <ChevronDown className="h-4 w-4 text-[#7c3aed]" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {/* Chapters Section */}
                      {isSubjectOpen && (
                        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 space-y-2">
                          {chaptersLoading ? (
                            <p className="text-xs text-gray-400 text-center py-3">
                              Loading chapters...
                            </p>
                          ) : (
                            <>
                              {chapters.map((ch, cIdx) => {
                                const isChapterOpen = selectedChapterId === ch.id;
                                return (
                                  <div
                                    key={ch.id}
                                    className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                                  >
                                    {/* Chapter Row */}
                                    <div
                                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                                      onClick={() =>
                                        setSelectedChapterId(isChapterOpen ? null : ch.id)
                                      }
                                      onMouseEnter={() => handleChapterHover(ch.id)}
                                    >
                                      <span className="w-6 h-6 rounded-lg bg-[#7c3aed]/10 text-[#7c3aed] font-bold text-[10px] flex items-center justify-center shrink-0">
                                        {cIdx + 1}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-800 truncate">
                                          Ch {cIdx + 1}: {ch.name}
                                        </p>
                                        <p className="text-[9px] text-gray-400 font-mono">
                                          {ch.code}
                                        </p>
                                      </div>
                                      <div
                                        className="flex items-center gap-1.5 shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          onClick={() => {
                                            setSelectedChapterId(ch.id);
                                            setTopicOpen(true);
                                          }}
                                          className="text-[9px] font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-1 rounded-md"
                                        >
                                          + Topic
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingChapter(ch);
                                            setChapterOpen(true);
                                          }}
                                          className="p-1 text-gray-400 hover:text-[#7c3aed] transition-colors"
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteChapter(ch.id)}
                                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                      <div className="text-gray-400 shrink-0">
                                        {isChapterOpen ? (
                                          <ChevronDown className="h-3.5 w-3.5 text-[#7c3aed]" />
                                        ) : (
                                          <ChevronRight className="h-3.5 w-3.5" />
                                        )}
                                      </div>
                                    </div>

                                    {/* Topics Section */}
                                    {isChapterOpen && (
                                      <div className="border-t border-gray-100 bg-gray-50/50 px-3 py-2 space-y-1.5">
                                        {topicsLoading ? (
                                          <p className="text-[10px] text-gray-400 text-center py-2">
                                            Loading topics...
                                          </p>
                                        ) : (
                                          <>
                                            {topics.map((tp, tIdx) => (
                                              <div
                                                key={tp.id}
                                                className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-lg border border-gray-100"
                                              >
                                                <span className="text-[9px] font-mono font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-1.5 py-0.5 rounded shrink-0">
                                                  {sIdx + 1}.{cIdx + 1}.{tIdx + 1}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-semibold text-gray-800 truncate">
                                                    {tp.name}
                                                  </p>
                                                  <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span
                                                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                        tp.difficultyLevel === 'EASY'
                                                          ? 'bg-emerald-100 text-emerald-700'
                                                          : tp.difficultyLevel === 'MEDIUM'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-rose-100 text-rose-700'
                                                      }`}
                                                    >
                                                      {tp.difficultyLevel}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400">
                                                      {tp.plannedHours}h · {tp.plannedSessions}{' '}
                                                      sessions
                                                    </span>
                                                  </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                  <button
                                                    onClick={() => {
                                                      setEditingTopic(tp);
                                                      setTopicOpen(true);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-[#7c3aed] transition-colors"
                                                  >
                                                    <Edit2 className="h-3 w-3" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteTopic(tp.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}

                                            {/* Add Topic Inline Card */}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedChapterId(ch.id);
                                                setTopicOpen(true);
                                              }}
                                              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-[#7c3aed]/30 hover:border-[#7c3aed] bg-white text-[10px] font-bold text-[#7c3aed] transition-all hover:bg-[#7c3aed]/5"
                                            >
                                              <Plus className="h-3.5 w-3.5" /> Add Topic inside
                                              Chapter
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Add Chapter Inline Card */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCourseSubjectId(cs.id);
                                  setChapterOpen(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-[#7c3aed]/20 hover:border-[#7c3aed]/60 bg-white text-xs font-bold text-[#7c3aed] transition-all hover:bg-[#7c3aed]/5"
                              >
                                <Plus className="h-4 w-4" /> Add Chapter inside Subject
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {courseSubjects.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAssignOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-[#7c3aed]/20 hover:border-[#7c3aed]/60 bg-white text-xs font-bold text-[#7c3aed] transition-all hover:bg-[#7c3aed]/5 shadow-xs"
                >
                  <Plus className="h-4 w-4" /> Map Another Subject to Course
                </button>
              )}
            </div>
          )}

          {/* Branches Tab */}
          {activeTab === 'branches' && <BranchCoursesMappingSection courseId={courseId} />}
        </div>

        {/* ── DIALOGS ── */}

        {/* Dialog 1: Map Subject */}
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border border-border shadow-2xl">
            <div className="bg-[#7c3aed] p-5">
              <DialogTitle className="text-base font-bold text-white">
                Map Subject to Course
              </DialogTitle>
              <DialogDescription className="text-white/70 text-xs mt-0.5">
                Assign a subject to this course syllabus.
              </DialogDescription>
            </div>
            <form onSubmit={handleAssignSubmit(onAssign)} className="p-5 space-y-3 bg-card">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Select Subject</Label>
                <Select onValueChange={(val) => setAssignVal('subjectId', val)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Choose a subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="font-medium">{s.name}</span>{' '}
                        <span className="text-xs text-muted-foreground ml-1">({s.code})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignErrors.subjectId && (
                  <p className="text-xs text-destructive">{assignErrors.subjectId.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Planned Hours</Label>
                  <Input type="number" className="h-9 rounded-xl" {...regAssign('plannedHours')} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Display Order</Label>
                  <Input type="number" className="h-9 rounded-xl" {...regAssign('displayOrder')} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Total Marks</Label>
                  <Input type="number" className="h-9 rounded-xl" {...regAssign('totalMarks')} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Passing Marks</Label>
                  <Input type="number" className="h-9 rounded-xl" {...regAssign('passingMarks')} />
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssignOpen(false)}
                  className="flex-1 h-9 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-9 rounded-xl text-xs bg-[#7c3aed] hover:opacity-90 text-white"
                >
                  Map Subject
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog 2: Create/Edit Chapter */}
        <Dialog open={chapterOpen} onOpenChange={handleChapterOpenChange}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border border-border shadow-2xl">
            <div className="bg-[#7c3aed] p-5">
              <DialogTitle className="text-base font-bold text-white">
                {editingChapter ? 'Edit Chapter' : 'Add Chapter'}
              </DialogTitle>
              <DialogDescription className="text-white/70 text-xs mt-0.5">
                {editingChapter
                  ? "Update this chapter's details."
                  : 'Add a new chapter to this subject.'}
              </DialogDescription>
            </div>
            <form onSubmit={handleChapterSubmit(onAddChapter)} className="p-5 space-y-3 bg-card">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Chapter Code</Label>
                <Input
                  placeholder="e.g. PHY-CH01"
                  className="h-9 rounded-xl font-mono text-xs"
                  {...regChapter('code')}
                  disabled={!!editingChapter}
                />
                {chapterErrors.code && (
                  <p className="text-xs text-destructive">{chapterErrors.code.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Chapter Title</Label>
                <Input
                  placeholder="e.g. Thermodynamics"
                  className="h-9 rounded-xl"
                  {...regChapter('name')}
                />
                {chapterErrors.name && (
                  <p className="text-xs text-destructive">{chapterErrors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Planned Hours</Label>
                  <Input type="number" className="h-9 rounded-xl" {...regChapter('plannedHours')} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Est. Sessions</Label>
                  <Input
                    type="number"
                    className="h-9 rounded-xl"
                    {...regChapter('estimatedSessions')}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleChapterOpenChange(false)}
                  className="flex-1 h-9 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-9 rounded-xl text-xs bg-[#7c3aed] hover:opacity-90 text-white"
                >
                  {editingChapter ? 'Save Changes' : 'Create Chapter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog 3: Create/Edit Topic */}
        <Dialog open={topicOpen} onOpenChange={handleTopicOpenChange}>
          <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-2xl border border-border shadow-2xl">
            <div className="bg-[#7c3aed] p-5">
              <DialogTitle className="text-base font-bold text-white">
                {editingTopic ? 'Edit Topic' : 'Add Topic'}
              </DialogTitle>
              <DialogDescription className="text-white/70 text-xs mt-0.5">
                {editingTopic
                  ? 'Update topic details.'
                  : 'Add a new lecture topic to this chapter.'}
              </DialogDescription>
            </div>
            <form onSubmit={handleTopicSubmit(onAddTopic)} className="p-5 space-y-3 bg-card">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Topic Code</Label>
                <Input
                  placeholder="e.g. PHY-CH01-T01"
                  className="h-9 rounded-xl font-mono text-xs"
                  {...regTopic('code')}
                  disabled={!!editingTopic}
                />
                {topicErrors.code && (
                  <p className="text-xs text-destructive">{topicErrors.code.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Topic Name</Label>
                <Input
                  placeholder="e.g. Newton's Laws of Motion"
                  className="h-9 rounded-xl"
                  {...regTopic('name')}
                />
                {topicErrors.name && (
                  <p className="text-xs text-destructive">{topicErrors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Difficulty</Label>
                  <Select
                    value={difficultyVal}
                    onValueChange={(val: any) => setTopicVal('difficultyLevel', val)}
                  >
                    <SelectTrigger className="h-9 rounded-xl">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Planned Hours</Label>
                  <Input type="number" className="h-9 rounded-xl" {...regTopic('plannedHours')} />
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleTopicOpenChange(false)}
                  className="flex-1 h-9 rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-9 rounded-xl text-xs bg-[#7c3aed] hover:opacity-90 text-white"
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
