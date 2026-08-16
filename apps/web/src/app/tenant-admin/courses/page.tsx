'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Plus,
  Search,
  Sparkles,
  BookMarked,
  CheckCircle2,
  Layers,
  X,
  BookOpen,
} from 'lucide-react';
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from '@/features/master-data/hooks/use-courses';
import { CourseTable } from '@/features/master-data/components/courses/CourseTable';
import { CourseDialog } from '@/features/master-data/components/courses/CourseDialog';
import { CourseSkeleton } from '@/features/master-data/components/courses/CourseSkeleton';
import { useCreateBranchCourse } from '@/features/master-data/hooks/use-branch-courses';
import { toast } from 'sonner';
import type { Course } from '@/features/master-data/types';
import { cn } from '@/lib/utils';

export default function CoursesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const { data, isLoading, error } = useCourses({
    page,
    limit: 10,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();
  const deleteMutation = useDeleteCourse();
  const createBranchCourseMutation = useCreateBranchCourse();

  const handleCreate = () => {
    router.push('/tenant-admin/courses/new');
  };

  const handleEdit = (course: Course) => {
    router.push(`/tenant-admin/courses/new?id=${course.id}`);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to archive/delete this course?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Course archived successfully');
      } catch (err: any) {
        const message = err?.response?.data?.message;
        const isCourseDependency =
          typeof message === 'string' && message.startsWith('Cannot delete course:');
        const displayMessage = isCourseDependency
          ? 'This course cannot be deleted because it is currently being used by active batches, admissions, exams, learning materials, or fee structures. Please remove or archive those dependencies first.'
          : message || 'Failed to delete course because active mappings exist.';
        toast.error('Conflict', { description: displayMessage });
      }
    }
  };

  const handleFormSubmit = async (input: any) => {
    try {
      const cleanInput = {
        ...input,
        startDate: input.startDate || undefined,
        endDate: input.endDate || undefined,
      };

      if (selectedCourse) {
        await updateMutation.mutateAsync({ id: selectedCourse.id, input: cleanInput });
        toast.success('Course updated successfully');
      } else {
        const { branchId, academicYearId, ...payload } = cleanInput;
        const newCourse = await createMutation.mutateAsync(payload);
        if (newCourse && branchId && academicYearId) {
          await createBranchCourseMutation.mutateAsync({
            courseId: newCourse.id,
            branchId,
            academicYearId,
          });
        }
        toast.success('Course created and mapped successfully');
      }
      setDialogOpen(false);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Operation failed';
      toast.error(errMsg);
    }
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const allCourses = data?.data || [];
  const filteredCourses = allCourses.filter((c) => {
    if (statusFilter === 'ACTIVE') return c.isActive !== false;
    if (statusFilter === 'INACTIVE') return c.isActive === false;
    return true;
  });

  const totalCourses = data?.meta?.total ?? allCourses.length;
  const activeCount = allCourses.filter((c) => c.isActive !== false).length;
  const neetCount = allCourses.filter((c) => c.name?.toUpperCase().includes('NEET') || c.code?.toUpperCase().includes('NEET')).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Welcome Header Banner - Signature Violet Gradient */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                Academic Course Management
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
              Courses & Academic Programs 📚
            </h1>
            <p className="text-violet-200 text-xs mt-0.5">
              Manage courses, syllabus descriptions, subjects mapping, and dynamic curriculum structures.
            </p>
          </div>

          <Button
            onClick={handleCreate}
            className="w-full sm:w-auto gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold border-0 shadow-xs shrink-0 rounded-xl text-xs"
          >
            <Plus className="h-4 w-4 text-violet-600 shrink-0" aria-hidden="true" />
            <span>Add New Course</span>
          </Button>
        </div>

        {/* KPI Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl border border-violet-100 bg-violet-50 text-violet-600 shrink-0">
              <BookMarked className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Total Programs
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">{totalCourses}</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Active Courses
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">{activeCount}</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                NEET Programs
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">{neetCount}</p>
            </div>
          </Card>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by course name, code, description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-row w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden lg:inline">
              Filter Status:
            </span>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center',
                  statusFilter === st
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200',
                )}
              >
                {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Table / Cards */}
        {isLoading ? (
          <CourseSkeleton />
        ) : error ? (
          <div className="p-10 text-center border border-rose-200 rounded-2xl bg-rose-50/50 text-rose-700">
            <p className="font-bold text-sm">Failed to load courses</p>
            <p className="text-xs mt-1 text-rose-500">
              Please check network or backend connectivity.
            </p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-2xl border-slate-200 bg-white shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center border border-violet-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No courses found</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              No matching course records found. Get started by creating your first academic course.
            </p>
            <Button
              onClick={handleCreate}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
            >
              <Plus className="h-4 w-4" /> Add Course
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
              <CourseTable
                courses={filteredCourses}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </Card>

            {/* Pagination Controls */}
            {data?.meta && data.meta.lastPage > 1 && (
              <div className="flex justify-between items-center bg-white border border-[#E5E7EB] rounded-2xl px-5 py-3 shadow-xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-xl text-xs font-bold text-slate-700"
                >
                  Previous
                </Button>
                <span className="text-xs font-bold text-slate-500">
                  Page {page} of {data.meta.lastPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.meta.lastPage}
                  onClick={() => setPage(page + 1)}
                  className="rounded-xl text-xs font-bold text-slate-700"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Dialog Modal */}
        <CourseDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          course={selectedCourse}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
