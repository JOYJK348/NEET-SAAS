'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { useSubjects } from '@/features/master-data/hooks/use-subjects';
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
import { ArrowLeft, BookOpen, Layers, Plus, Trash2, ClipboardList, Edit2 } from 'lucide-react';
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
  const courseId = params?.id as string;
  const queryClient = useQueryClient();

  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const [activeTab, setActiveTab] = useState('overview');

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
      <div className="space-y-6 p-4 lg:p-6 bg-gray-50/50 dark:bg-gray-900/10 min-h-screen">
        {/* Back Link */}
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </Button>

        {/* Course Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {course.name}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Code: <span className="font-semibold">{course.code}</span> &bull; Duration:{' '}
              {course.durationMonths} Months
            </p>
          </div>
        </div>

        {/* Tab Interface */}
        <div className="space-y-6">
          <div className="w-full flex justify-start border-b border-gray-200 dark:border-gray-800 gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`border-b-2 px-2 py-3 text-sm font-medium transition-colors ${
                activeTab === 'curriculum'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Curriculum (Syllabus)
            </button>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <Card>
              <CardHeader>
                <CardTitle>Course Specifications</CardTitle>
                <CardDescription>Basic descriptions and properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-gray-400">Display Name</Label>
                    <p className="font-medium">{course.displayName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Course Type</Label>
                    <p className="font-medium">{course.courseType}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Duration</Label>
                    <p className="font-medium">{course.durationMonths} Months</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Status</Label>
                    <p className="font-medium">
                      {course.isActive ? (
                        <span className="text-green-600 font-semibold">Active</span>
                      ) : (
                        <span className="text-red-500 font-semibold">Inactive</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Label className="text-gray-400">Description</Label>
                  <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {course.description || 'No description provided.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Curriculum Hierarchical Management Tab Content */}
          {activeTab === 'curriculum' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Column 1: Subjects (Mappings) */}
              <Card className="xl:col-span-1 border border-gray-200 dark:border-gray-800">
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Subjects</CardTitle>
                    <CardDescription>Mapped core subjects</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setAssignOpen(true)} className="gap-1">
                    <Plus className="h-4 w-4" /> Map
                  </Button>
                </CardHeader>
                <CardContent className="px-2">
                  {mappingsLoading ? (
                    <div className="p-4 text-center text-sm">Loading mappings...</div>
                  ) : courseSubjects.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      No subjects mapped. Click &quot;Map&quot; to assign.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {courseSubjects.map((cs) => (
                        <div
                          key={cs.id}
                          onClick={() => {
                            setSelectedCourseSubjectId(cs.id);
                            setSelectedChapterId(null);
                          }}
                          onMouseEnter={() => handleSubjectHover(cs.id)}
                          className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedCourseSubjectId === cs.id
                              ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <div>
                              <p className="text-sm">{cs.subject?.name || 'Loading...'}</p>
                              <p className="text-xs opacity-80">{cs.plannedHours} planned hours</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnassign(cs.id);
                            }}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Column 2: Chapters (Lazy fetched on subject select) */}
              <Card className="xl:col-span-1 border border-gray-200 dark:border-gray-800">
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Chapters</CardTitle>
                    <CardDescription>Syllabus modules</CardDescription>
                  </div>
                  {selectedCourseSubjectId && (
                    <Button size="sm" onClick={() => setChapterOpen(true)} className="gap-1">
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="px-2">
                  {!selectedCourseSubjectId ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      Select a subject on the left to load its chapters.
                    </div>
                  ) : chaptersLoading ? (
                    <div className="p-4 text-center text-sm">Loading chapters...</div>
                  ) : chapters.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      No chapters defined for this subject yet.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {chapters.map((ch) => (
                        <div
                          key={ch.id}
                          onClick={() => setSelectedChapterId(ch.id)}
                          onMouseEnter={() => handleChapterHover(ch.id)}
                          className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedChapterId === ch.id
                              ? 'bg-purple-500/10 text-purple-600 font-medium border border-purple-500/20'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800/40 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            <div>
                              <p className="text-sm">{ch.name}</p>
                              <p className="text-xs opacity-85">Code: {ch.code}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChapter(ch);
                                setChapterOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-primary"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChapter(ch.id);
                              }}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Column 3: Topics (Lazy fetched on chapter select) */}
              <Card className="xl:col-span-1 border border-gray-200 dark:border-gray-800">
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Topics</CardTitle>
                    <CardDescription>Individual lecture concepts</CardDescription>
                  </div>
                  {selectedChapterId && (
                    <Button size="sm" onClick={() => setTopicOpen(true)} className="gap-1">
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="px-2">
                  {!selectedChapterId ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      Select a chapter to view its teaching topics.
                    </div>
                  ) : topicsLoading ? (
                    <div className="p-4 text-center text-sm">Loading topics...</div>
                  ) : topics.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">
                      No topics mapped for this chapter yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {topics.map((tp) => (
                        <div
                          key={tp.id}
                          className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">{tp.name}</p>
                              <div className="flex gap-2 items-center mt-1">
                                <span className="text-2xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded uppercase">
                                  {tp.difficultyLevel}
                                </span>
                                <span className="text-2xs text-gray-500">
                                  {tp.plannedHours} hrs
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingTopic(tp);
                                setTopicOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-primary"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTopic(tp.id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* DIALOG 1: Map Subject */}
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Map Subject to Course</DialogTitle>
              <DialogDescription>
                Assign a reusable core subject to this syllabus template.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAssignSubmit(onAssign)} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Select Subject</Label>
                <Select onValueChange={(val) => setAssignVal('subjectId', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignErrors.subjectId && (
                  <p className="text-xs text-red-500">{assignErrors.subjectId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plannedHours">Planned Hours</Label>
                  <Input id="plannedHours" type="number" {...regAssign('plannedHours')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input id="displayOrder" type="number" {...regAssign('displayOrder')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input id="totalMarks" type="number" {...regAssign('totalMarks')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passingMarks">Passing Marks</Label>
                  <Input id="passingMarks" type="number" {...regAssign('passingMarks')} />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Assign</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: Create/Edit Chapter */}
        <Dialog open={chapterOpen} onOpenChange={handleChapterOpenChange}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>{editingChapter ? 'Edit Chapter' : 'Add Chapter'}</DialogTitle>
              <DialogDescription>
                {editingChapter
                  ? 'Modify the properties of this syllabus chapter.'
                  : 'Define a new syllabus chapter group.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleChapterSubmit(onAddChapter)} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="chCode">Chapter Code</Label>
                <Input
                  id="chCode"
                  placeholder="e.g. PHY-CH01"
                  {...regChapter('code')}
                  disabled={!!editingChapter}
                />
                {chapterErrors.code && (
                  <p className="text-xs text-red-500">{chapterErrors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chName">Chapter Name</Label>
                <Input
                  id="chName"
                  placeholder="e.g. Physical World & Dimensions"
                  {...regChapter('name')}
                />
                {chapterErrors.name && (
                  <p className="text-xs text-red-500">{chapterErrors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chHours">Planned Hours</Label>
                  <Input id="chHours" type="number" {...regChapter('plannedHours')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chSessions">Estimated Sessions</Label>
                  <Input id="chSessions" type="number" {...regChapter('estimatedSessions')} />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleChapterOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">{editingChapter ? 'Save Changes' : 'Add Chapter'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: Create/Edit Topic */}
        <Dialog open={topicOpen} onOpenChange={handleTopicOpenChange}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>{editingTopic ? 'Edit Topic' : 'Add Topic'}</DialogTitle>
              <DialogDescription>
                {editingTopic
                  ? 'Modify the details of this teaching lecture topic.'
                  : 'Add a new teaching lecture topic module.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTopicSubmit(onAddTopic)} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="tpCode">Topic Code</Label>
                <Input
                  id="tpCode"
                  placeholder="e.g. PHY-CH01-T01"
                  {...regTopic('code')}
                  disabled={!!editingTopic}
                />
                {topicErrors.code && (
                  <p className="text-xs text-red-500">{topicErrors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tpName">Topic Name</Label>
                <Input id="tpName" placeholder="e.g. Units & Measurements" {...regTopic('name')} />
                {topicErrors.name && (
                  <p className="text-xs text-red-500">{topicErrors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select
                    value={difficultyVal}
                    onValueChange={(val: any) => setTopicVal('difficultyLevel', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tpHours">Planned Hours</Label>
                  <Input id="tpHours" type="number" {...regTopic('plannedHours')} />
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleTopicOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">{editingTopic ? 'Save Changes' : 'Add Topic'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
