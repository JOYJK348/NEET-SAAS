'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Layers,
  Search,
  LayoutGrid,
  Plus,
  Bookmark,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Re-using Master Subjects components and hooks
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from '@/features/master-data/hooks/use-subjects';
import { SubjectTable } from '@/features/master-data/components/subjects/SubjectTable';
import { SubjectDialog } from '@/features/master-data/components/subjects/SubjectDialog';
import { SubjectSkeleton } from '@/features/master-data/components/subjects/SubjectSkeleton';

// Re-using Course creation tools
import {
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from '@/features/master-data/hooks/use-courses';
import { CourseDialog } from '@/features/master-data/components/courses/CourseDialog';
import { Edit2, Trash2, Power } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type {
  Subject,
  CreateSubjectInput,
  Course as MasterCourse,
  CreateCourseInput,
} from '@/features/master-data/types';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Course {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  durationMonths: number;
  courseType: string;
  isActive: boolean;
}

// ─── Fetch ──────────────────────────────────────────────────────────────────────
const fetchCourses = (): Promise<Course[]> =>
  api
    .get<{ data: Course[] }>('/master/courses?limit=100')
    .then((r) => ((r as any)?.data ?? r ?? []) as Course[]);

// ─── Component ──────────────────────────────────────────────────────────────────
export default function CurriculumPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'courses' | 'subjects'>('courses');
  const [search, setSearch] = useState('');

  // Course Hub state
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();

  const {
    data: courses = [],
    isLoading: coursesLoading,
    refetch: refetchCoursesList,
  } = useQuery<Course[]>({
    queryKey: ['curriculum-courses'],
    queryFn: fetchCourses,
    enabled: activeTab === 'courses',
  });

  const filteredCourses = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setCourseDialogOpen(true);
  };

  const handleEditCourse = (c: Course) => {
    setSelectedCourse(c);
    setCourseDialogOpen(true);
  };

  const handleDeleteCourse = async (id: string) => {
    if (
      confirm('Are you sure you want to delete this course and its associated syllabus mappings?')
    ) {
      try {
        await deleteCourseMutation.mutateAsync(id);
        toast.success('Course deleted successfully');
        void refetchCoursesList();
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || 'Failed to delete course';
        toast.error(errorMsg);
      }
    }
  };

  const handleToggleCourseStatus = async (c: Course) => {
    try {
      await updateCourseMutation.mutateAsync({
        id: c.id,
        input: {
          isActive: !c.isActive,
        } as any,
      });
      toast.success(`Course ${!c.isActive ? 'activated' : 'deactivated'} successfully`);
      void refetchCoursesList();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleCourseFormSubmit = async (
    input: CreateCourseInput & { branchId?: string; academicYearId?: string },
  ) => {
    try {
      if (selectedCourse) {
        await updateCourseMutation.mutateAsync({ id: selectedCourse.id, input: input as any });
        toast.success('Course updated successfully');
      } else {
        await createCourseMutation.mutateAsync(input);
        toast.success('Course created successfully');
      }
      setCourseDialogOpen(false);
      void refetchCoursesList();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to save course';
      toast.error(errorMsg);
    }
  };

  // Master Subjects state
  const [subjectPage, setSubjectPage] = useState(1);
  const [subjectSortBy, setSubjectSortBy] = useState('name');
  const [subjectSortOrder, setSubjectSortOrder] = useState<'asc' | 'desc'>('asc');
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const {
    data: subjectsData,
    isLoading: subjectsLoading,
    error: subjectsError,
  } = useSubjects(
    {
      page: subjectPage,
      limit: 10,
      search: activeTab === 'subjects' && search ? search : undefined,
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

  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setSubjectDialogOpen(true);
  };

  const handleDeleteSubject = async (id: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      try {
        await deleteSubjectMutation.mutateAsync(id);
        toast.success('Subject deleted successfully');
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || 'Failed to delete subject';
        toast.error(errorMsg);
      }
    }
  };

  const handleToggleSubjectStatus = async (s: Subject) => {
    try {
      await updateSubjectMutation.mutateAsync({
        id: s.id,
        input: {
          isActive: !s.isActive,
        } as any,
      });
      toast.success(`Subject ${!s.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleSubjectFormSubmit = async (input: CreateSubjectInput) => {
    try {
      if (selectedSubject) {
        await updateSubjectMutation.mutateAsync({ id: selectedSubject.id, input });
        toast.success('Subject updated successfully');
      } else {
        await createSubjectMutation.mutateAsync(input);
        toast.success('Subject created successfully');
      }
      setSubjectDialogOpen(false);
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

  if (courseDialogOpen) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#FAFAFA] p-4 lg:p-8">
          <CourseDialog
            open={courseDialogOpen}
            onOpenChange={setCourseDialogOpen}
            course={
              selectedCourse
                ? ({
                    ...selectedCourse,
                    branchId: '',
                    academicYearId: '',
                  } as any)
                : null
            }
            onSubmit={handleCourseFormSubmit}
            isSubmitting={createCourseMutation.isPending || updateCourseMutation.isPending}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#FAFAFA] p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Curriculum</h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeTab === 'courses'
                ? 'Select a course to manage its subjects, chapters, and topics.'
                : 'Manage reusable core subjects across the syllabus curriculum.'}
            </p>
          </div>
          {activeTab === 'courses' ? (
            <Button onClick={handleCreateCourse} className="gap-2 btn-primary">
              <Plus className="h-4 w-4" /> Add Course
            </Button>
          ) : (
            <Button onClick={handleCreateSubject} className="gap-2 btn-primary">
              <Plus className="h-4 w-4" /> Add Subject
            </Button>
          )}
        </div>

        {/* Tab Interface */}
        <div className="flex justify-start border-b border-gray-250 dark:border-gray-800 gap-6 mb-6">
          <button
            onClick={() => {
              setActiveTab('courses');
              setSearch('');
            }}
            className={cn(
              'border-b-2 px-2 py-3 text-sm font-medium transition-colors flex items-center gap-2',
              activeTab === 'courses'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-900',
            )}
          >
            <BookOpen className="h-4 w-4" />
            Courses Curriculum
          </button>
          <button
            onClick={() => {
              setActiveTab('subjects');
              setSearch('');
            }}
            className={cn(
              'border-b-2 px-2 py-3 text-sm font-medium transition-colors flex items-center gap-2',
              activeTab === 'subjects'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-900',
            )}
          >
            <Bookmark className="h-4 w-4" />
            Master Subjects List
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 max-w-sm shadow-sm">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder={activeTab === 'courses' ? 'Search courses...' : 'Search subjects...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
          />
        </div>

        {/* Tab Contents: Courses Curriculum */}
        {activeTab === 'courses' && (
          <>
            {coursesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <LayoutGrid className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-500 text-sm font-medium">No courses found</p>
                <p className="text-gray-400 text-xs mt-1">
                  {search ? 'Try a different search term.' : 'Create a course first.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((c) => (
                  <div
                    key={c.id}
                    className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-400 flex flex-col"
                    style={{ minHeight: '260px' }}
                  >
                    {/* ── Card Hero Header ── */}
                    <div className="relative bg-[#7c3aed] px-5 pt-5 pb-10 overflow-hidden">
                      {/* Decorative Background Circles */}
                      <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 blur-lg" />
                      <div className="absolute top-2 right-4 w-12 h-12 rounded-full bg-white/5" />
                      <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-indigo-500/30" />

                      {/* Top Row: Icon + Actions */}
                      <div className="relative flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-white" />
                        </div>
                        {/* Hover-reveal Action Buttons */}
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            type="button"
                            onClick={() => handleEditCourse(c)}
                            className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                            title="Edit course"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c.id)}
                            className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-400/60 transition-colors"
                            title="Delete course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Course Name */}
                      <div className="relative">
                        <h3 className="text-white font-bold text-lg leading-tight mb-0.5">
                          {c.displayName || c.name}
                        </h3>
                        <span className="text-[10px] font-mono font-semibold text-white/60 uppercase tracking-widest">
                          {c.code}
                        </span>
                      </div>
                    </div>

                    {/* ── Card Body ── */}
                    <div className="relative bg-white flex-1 px-5 pt-4 pb-5 flex flex-col justify-between">
                      {/* Top Info Seam */}
                      <div className="flex items-center justify-between mb-3 text-[10px] text-gray-400 font-mono">
                        <span>COURSE DESCRIPTION</span>
                        <span>ID: {c.id.slice(0, 8).toUpperCase()}</span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-5 flex-1">
                        {c.description || 'No description configured for this course program yet.'}
                      </p>

                      {/* Bottom Footer Row */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-150">
                        {/* Stats Info */}
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-xs font-semibold text-[#7c3aed] bg-[#7c3aed]/10 px-2.5 py-1 rounded-lg border border-[#7c3aed]/20">
                            <span className="text-[10px]">⏱</span>
                            {c.durationMonths}M
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 uppercase">
                            {c.courseType}
                          </span>
                        </div>

                        {/* Status Toggle & Manage Navigation */}
                        <div className="flex items-center gap-4">
                          {/* Sliding Toggle Control */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleCourseStatus(c)}
                              className={cn(
                                'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out outline-hidden',
                                c.isActive ? 'bg-emerald-500' : 'bg-gray-300',
                              )}
                              title="Toggle status"
                            >
                              <span
                                className={cn(
                                  'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                                  c.isActive ? 'translate-x-3' : 'translate-x-0',
                                )}
                              />
                            </button>
                            <span
                              className={cn(
                                'text-[9px] font-bold uppercase tracking-wider',
                                c.isActive ? 'text-emerald-600' : 'text-gray-500',
                              )}
                            >
                              {c.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <Link
                            href={`/tenant-admin/courses/${c.id}?tab=curriculum`}
                            className="flex items-center gap-1 text-xs font-bold text-[#7c3aed] hover:opacity-75 transition-opacity group/cta border-l border-gray-200 pl-3"
                          >
                            Manage
                            <ChevronRight className="h-3.5 w-3.5 group-hover/cta:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab Contents: Subjects */}
        {activeTab === 'subjects' && (
          <>
            {subjectsLoading ? (
              <div className="p-8 text-center text-sm text-gray-500">Loading subjects...</div>
            ) : !subjectsData?.data || subjectsData.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Bookmark className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-500 text-sm font-medium">No master subjects found</p>
                <p className="text-gray-400 text-xs mt-1">
                  Click &quot;Add Subject&quot; to create core subjects.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjectsData.data.map((s) => (
                    <div
                      key={s.id}
                      className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-400 flex flex-col bg-white"
                      style={{ minHeight: '220px' }}
                    >
                      {/* ── Card Hero Header ── */}
                      <div className="relative bg-[#7c3aed] px-5 pt-5 pb-8 overflow-hidden">
                        {/* Decorative Background Shapes */}
                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-md" />
                        <div className="absolute top-2 right-4 w-10 h-10 rounded-full bg-white/5" />

                        {/* Top Row: Icon + Actions */}
                        <div className="relative flex items-start justify-between mb-3">
                          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Layers className="h-4.5 w-4.5 text-white" />
                          </div>
                          {/* Hover-reveal Action Buttons */}
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              type="button"
                              onClick={() => handleEditSubject(s)}
                              className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                              title="Edit subject"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubject(s.id)}
                              className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-400/60 transition-colors"
                              title="Delete subject"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Subject Title */}
                        <div className="relative">
                          <h3 className="text-white font-bold text-base leading-tight mb-0.5 truncate">
                            {s.name}
                          </h3>
                          <span className="text-[9px] font-mono font-semibold text-white/70 uppercase tracking-widest">
                            {s.code}
                          </span>
                        </div>
                      </div>

                      {/* ── Card Body ── */}
                      <div className="relative flex-1 px-5 pt-4 pb-4 flex flex-col justify-between">
                        {/* Description / DisplayName */}
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
                            Display Name
                          </p>
                          <p className="text-xs text-gray-700 font-medium mb-4 line-clamp-2">
                            {s.displayName || 'No display name configured.'}
                          </p>
                        </div>

                        {/* Bottom Footer Row */}
                        <div className="flex items-center justify-between pt-3.5 border-t border-gray-100">
                          {/* Left: Short Name / Code */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 uppercase">
                              {s.shortName || 'N/A'}
                            </span>
                            <span className="text-[10px] font-semibold text-[#7c3aed] bg-[#7c3aed]/10 px-2 py-0.5 rounded border border-[#7c3aed]/20 uppercase">
                              {s.subjectType}
                            </span>
                          </div>

                          {/* Right: Active/Inactive Sliding Toggle */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleSubjectStatus(s)}
                              className={cn(
                                'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out outline-hidden',
                                s.isActive ? 'bg-emerald-500' : 'bg-gray-300',
                              )}
                              title="Toggle status"
                            >
                              <span
                                className={cn(
                                  'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                                  s.isActive ? 'translate-x-3' : 'translate-x-0',
                                )}
                              />
                            </button>
                            <span
                              className={cn(
                                'text-[9px] font-bold uppercase tracking-wider',
                                s.isActive ? 'text-emerald-600' : 'text-gray-500',
                              )}
                            >
                              {s.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {subjectsData.meta && subjectsData.meta.lastPage > 1 && (
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={subjectPage <= 1}
                      onClick={() => setSubjectPage(subjectPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-xs self-center text-gray-500">
                      Page {subjectPage} of {subjectsData.meta.lastPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={subjectPage >= subjectsData.meta.lastPage}
                      onClick={() => setSubjectPage(subjectPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Dialog Form for Course Quick Action */}
        <CourseDialog
          open={courseDialogOpen}
          onOpenChange={setCourseDialogOpen}
          course={null}
          onSubmit={handleCourseFormSubmit}
          isSubmitting={createCourseMutation.isPending}
        />

        {/* Dialog Form for Subject Create/Edit */}
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
