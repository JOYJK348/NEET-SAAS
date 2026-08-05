'use client';

import { useQuery } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/protected-route';
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
  Sparkles,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  FileText,
  GraduationCap,
  Upload,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Re-using Master Subjects components and hooks
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from '@/features/master-data/hooks/use-subjects';
import { SubjectDialog } from '@/features/master-data/components/subjects/SubjectDialog';

// Re-using Course creation tools
import {
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from '@/features/master-data/hooks/use-courses';
import { CourseDialog } from '@/features/master-data/components/courses/CourseDialog';

import type { Subject, CreateSubjectInput, CreateCourseInput } from '@/features/master-data/types';

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
function CurriculumContent() {
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
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.displayName && c.displayName.toLowerCase().includes(search.toLowerCase())),
  );

  const handleCreateCourse = () => {
    router.push('/tenant-admin/courses/new');
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

  const { data: subjectsData, isLoading: subjectsLoading } = useSubjects({
    page: 1,
    limit: 10,
  });

  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  const handleCreateSubject = () => {
    router.push('/tenant-admin/subjects/new');
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

  const handleManageSubjectSyllabus = async (subjectId: string) => {
    try {
      toast.loading('Opening Master Syllabus Builder...', { id: 'master-syllabus' });
      const cs = await api.get<any>(`/master/subjects/${subjectId}/course-subject`);
      toast.dismiss('master-syllabus');
      if (cs?.courseId) {
        router.push(`/tenant-admin/courses/${cs.courseId}/builder`);
      }
    } catch {
      toast.dismiss('master-syllabus');
      toast.error('Failed to open master syllabus builder');
    }
  };

  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleBulkImportSubmit = async () => {
    if (!bulkImportText.trim()) {
      toast.error('Please paste or enter subjects data');
      return;
    }

    setIsImporting(true);
    try {
      let subjectsPayload: any[] = [];
      try {
        const parsed = JSON.parse(bulkImportText);
        if (Array.isArray(parsed)) subjectsPayload = parsed;
      } catch {
        const lines = bulkImportText.split('\n');
        let currentSubject: { name: string; chapters: Array<{ name: string }> } | null = null;
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          if (line.toLowerCase().startsWith('subject:') || line.endsWith(':')) {
            const subjName = line.replace(/^(subject:|\s*)/i, '').replace(/:$/, '').trim();
            if (subjName) {
              currentSubject = { name: subjName, chapters: [] };
              subjectsPayload.push(currentSubject);
            }
          } else if (line.startsWith('-') || line.startsWith('*') || /^[0-9]+\./.test(line)) {
            const chName = line.replace(/^[-*0-9.]+\s*/, '').trim();
            if (chName) {
              if (!currentSubject) {
                currentSubject = { name: 'General Subject', chapters: [] };
                subjectsPayload.push(currentSubject);
              }
              currentSubject.chapters.push({ name: chName });
            }
          } else {
            if (!currentSubject) {
              currentSubject = { name: line, chapters: [] };
              subjectsPayload.push(currentSubject);
            } else {
              currentSubject.chapters.push({ name: line });
            }
          }
        }
      }

      if (subjectsPayload.length === 0) {
        toast.error('Could not parse any valid subjects from input');
        setIsImporting(false);
        return;
      }

      const res = await api.post<any>('/master/subjects/bulk', subjectsPayload);
      toast.success(
        `Successfully imported ${res.count || subjectsPayload.length} Master Subjects with chapters!`,
      );
      setBulkImportOpen(false);
      setBulkImportText('');
      window.location.reload();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to bulk import subjects';
      toast.error(errorMsg);
    } finally {
      setIsImporting(false);
    }
  };

  if (courseDialogOpen) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#FAFAFA] p-4 lg:p-6">
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

  const activeCoursesCount = courses.filter((c) => c.isActive).length;
  const totalSubjectsCount = subjectsData?.meta?.total ?? (subjectsData?.data?.length || 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Welcome Header Banner - Signature Violet Gradient */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                Curriculum & Syllabus Architecture
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
              Curriculum & Course Programs 🎓
            </h1>
            <p className="text-violet-200 text-xs mt-0.5">
              Manage course syllabi, master subject repositories, chapter structures, and learning
              topics.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button
              onClick={() => router.push('/tenant-admin/subjects')}
              className="w-full sm:w-auto gap-2 bg-white/20 hover:bg-white/30 text-white font-bold border border-white/20 shadow-xs shrink-0 rounded-xl text-xs"
            >
              <Bookmark className="h-4 w-4 text-violet-100" /> Go to Subjects Library 📚
            </Button>
            <Button
              onClick={handleCreateCourse}
              className="w-full sm:w-auto gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold border-0 shadow-xs shrink-0 rounded-xl text-xs"
            >
              <Plus className="h-4 w-4 text-violet-600" /> Add Course Program
            </Button>
          </div>
        </div>

        {/* Mild KPI Cards Strip - 3 Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                Total Course Programs
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">
                {courses.length}
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                Active Courses
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">
                {activeCoursesCount}
              </p>
            </div>
          </Card>

          <Card
            onClick={() => router.push('/tenant-admin/subjects')}
            className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50 group"
          >
            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <Bookmark className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs font-bold text-[#6B7280] uppercase tracking-wider flex items-center justify-between">
                Master Subjects <ChevronRight className="w-3.5 h-3.5 text-violet-500" />
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">
                {totalSubjectsCount} Subjects
              </p>
            </div>
          </Card>
        </div>

        {/* Toolbar & Guidance Strip */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 max-w-md bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search course programs by name or code..."
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

          <div className="p-3 rounded-xl bg-violet-50/80 border border-violet-100 text-xs text-violet-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
              <span>
                <strong>Curriculum Workflow:</strong> Select any course below and click{' '}
                <strong>&quot;Map Subjects / Manage Curriculum&quot;</strong> to configure course syllabus.
              </span>
            </div>
          </div>
        </div>

        {/* Tab Contents: Courses Curriculum */}
        {activeTab === 'courses' && (
          <>
            {coursesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-56 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="p-12 text-center border border-dashed rounded-2xl border-slate-200 bg-white shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center border border-violet-100">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No courses found</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {search ? 'Try a different search query.' : 'Create your first course program.'}
                </p>
                <Button
                  onClick={handleCreateCourse}
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
                >
                  <Plus className="h-4 w-4" /> Add Course Program
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((c) => (
                  <div
                    key={c.id}
                    className="group relative rounded-3xl overflow-hidden border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:border-violet-300 transition-all duration-300 flex flex-col justify-between"
                  >
                    {/* Premium Header Strip with Gradient & Background Glow */}
                    <div className="bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-700 p-5 text-white relative overflow-hidden">
                      {/* Ambient Decorative Background Glows */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-indigo-400/20 blur-lg pointer-events-none" />

                      <div className="flex items-start justify-between gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0 shadow-xs">
                          <GraduationCap className="h-5 w-5 text-white" />
                        </div>

                        {/* Top Right Action Icons */}
                        <div className="flex items-center gap-1.5 bg-black/10 backdrop-blur-xs p-1 rounded-xl border border-white/15">
                          <button
                            type="button"
                            onClick={() => handleEditCourse(c)}
                            className="w-7 h-7 rounded-lg hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition-colors"
                            title="Edit course"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(c.id)}
                            className="w-7 h-7 rounded-lg hover:bg-rose-500/80 flex items-center justify-center text-white/90 hover:text-white transition-colors"
                            title="Delete course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 relative z-10">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black tracking-widest uppercase text-violet-100 bg-white/15 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-white/10">
                          {c.code}
                        </span>
                        <h3 className="text-lg font-black text-white mt-1.5 leading-snug line-clamp-1 group-hover:text-violet-100 transition-colors">
                          {c.displayName || c.name}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-5 bg-white">
                      <p className="text-xs text-slate-600 font-medium line-clamp-3 leading-relaxed">
                        {c.description ||
                          'Comprehensive NEET syllabus course program configured with chapters, subjects, and topics.'}
                      </p>

                      <div className="space-y-4 pt-3 border-t border-slate-100">
                        {/* Meta Tags Row */}
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1.5 rounded-xl border border-violet-100/80 shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-violet-500" />
                            {c.durationMonths} Months Program
                          </span>
                          <span className="inline-flex items-center text-[10px] font-extrabold text-indigo-700 bg-indigo-50/80 px-2.5 py-1.5 rounded-xl border border-indigo-100 uppercase tracking-wider">
                            {c.courseType}
                          </span>
                        </div>

                        {/* Status + CTA Button Row */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleCourseStatus(c)}
                              className={cn(
                                'relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out',
                                c.isActive ? 'bg-emerald-500' : 'bg-slate-300',
                              )}
                              title="Toggle status"
                            >
                              <span
                                className={cn(
                                  'pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5',
                                  c.isActive ? 'translate-x-3.5' : 'translate-x-0',
                                )}
                              />
                            </button>
                            <span
                              className={cn(
                                'text-[10px] font-extrabold uppercase tracking-wider',
                                c.isActive ? 'text-emerald-600' : 'text-slate-400',
                              )}
                            >
                              {c.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <Link
                            href={`/tenant-admin/courses/${c.id}?tab=curriculum`}
                            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 px-4 py-2 rounded-xl shadow-md shadow-violet-500/20 active:scale-95 transition-all"
                          >
                            Manage Curriculum
                            <ChevronRight className="h-4 w-4" />
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
              <div className="p-8 text-center text-sm text-slate-500">
                Loading master subjects...
              </div>
            ) : !subjectsData?.data || subjectsData.data.length === 0 ? (
              <div className="p-12 text-center border border-dashed rounded-2xl border-slate-200 bg-white shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center border border-violet-100">
                  <Bookmark className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">No master subjects found</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Click &quot;Add Master Subject&quot; to create core syllabus subjects.
                </p>
                <Button
                  onClick={handleCreateSubject}
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
                >
                  <Plus className="h-4 w-4" /> Add Master Subject
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {subjectsData.data.map((s) => (
                    <Card
                      key={s.id}
                      className="group relative rounded-2xl overflow-hidden border-[#E5E7EB] bg-white shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                      {/* Header Strip */}
                      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white relative">
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditSubject(s)}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                              title="Edit subject"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubject(s.id)}
                              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/80 flex items-center justify-center text-white transition-colors"
                              title="Delete subject"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3">
                          <span className="text-[10px] font-black tracking-widest uppercase text-violet-200 bg-white/10 px-2 py-0.5 rounded-md">
                            {s.code}
                          </span>
                          <h3 className="text-base font-bold text-white mt-1.5 leading-snug line-clamp-1">
                            {s.name}
                          </h3>
                        </div>
                      </div>

                      {/* Subject Body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {s.displayName || 'No display name configured.'}
                        </p>

                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-lg uppercase flex items-center gap-1">
                              <Layers className="w-3 h-3 text-violet-600" />
                              {(s as any)._count?.chapters ?? 0} Chapters • {(s as any)._count?.topics ?? 0} Topics
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              Type: {s.subjectType}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleSubjectStatus(s)}
                                className={cn(
                                  'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out',
                                  s.isActive ? 'bg-emerald-500' : 'bg-slate-300',
                                )}
                                title="Toggle status"
                              >
                                <span
                                  className={cn(
                                    'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out',
                                    s.isActive ? 'translate-x-3' : 'translate-x-0',
                                  )}
                                />
                              </button>
                              <span
                                className={cn(
                                  'text-[10px] font-bold uppercase tracking-wider',
                                  s.isActive ? 'text-emerald-600' : 'text-slate-400',
                                )}
                              >
                                {s.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleManageSubjectSyllabus(s.id)}
                              className="text-[11px] font-extrabold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-xl shadow-xs transition-all flex items-center gap-1 shrink-0"
                            >
                              Manage Syllabus 📚 <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {subjectsData.meta && subjectsData.meta.lastPage > 1 && (
                  <div className="flex justify-between items-center bg-white border border-[#E5E7EB] rounded-2xl px-5 py-3 shadow-xs">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={subjectPage <= 1}
                      onClick={() => setSubjectPage(subjectPage - 1)}
                      className="rounded-xl text-xs font-bold text-slate-700"
                    >
                      Previous
                    </Button>
                    <span className="text-xs font-bold text-slate-500">
                      Page {subjectPage} of {subjectsData.meta.lastPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={subjectPage >= subjectsData.meta.lastPage}
                      onClick={() => setSubjectPage(subjectPage + 1)}
                      className="rounded-xl text-xs font-bold text-slate-700"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Bulk Import Subjects Modal */}
        {bulkImportOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Bulk Import Master Subjects & Chapters
                    </h3>
                    <p className="text-xs text-slate-400">
                      Paste structured subjects with chapters to import all at once!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBulkImportOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Paste Format (Text list or JSON Array):
                  </label>
                  <span className="text-[10px] text-violet-600 font-bold bg-violet-50 px-2 py-0.5 rounded-md">
                    Auto-Detects Subjects & Chapters
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[11px] text-slate-600 font-mono space-y-1">
                  <p className="font-bold text-slate-700">Sample Text Format:</p>
                  <pre className="text-[10px] text-slate-500 overflow-x-auto">
{`Subject: Physics
- Physical World and Measurement
- Kinematics & Motion
- Laws of Motion

Subject: Chemistry
- Some Basic Concepts of Chemistry
- Structure of Atom`}
                  </pre>
                </div>

                <textarea
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  rows={8}
                  placeholder={`Subject: Physics\n- Physical World and Measurement\n- Kinematics & Motion\n- Laws of Motion\n\nSubject: Chemistry\n- Some Basic Concepts of Chemistry\n- Structure of Atom`}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBulkImportOpen(false)}
                  className="rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isImporting}
                  onClick={handleBulkImportSubmit}
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs px-5"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Import All Subjects & Chapters
                </Button>
              </div>
            </div>
          </div>
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

export default function CurriculumPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <CurriculumContent />
    </ProtectedRoute>
  );
}
