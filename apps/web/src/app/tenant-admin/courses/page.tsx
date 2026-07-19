'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import {
  useCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from '@/features/master-data/hooks/use-courses';
import { CourseTable } from '@/features/master-data/components/courses/CourseTable';
import { CourseDialog } from '@/features/master-data/components/courses/CourseDialog';
import { CourseSkeleton } from '@/features/master-data/components/courses/CourseSkeleton';
import { toast } from 'sonner';
import type { Course, CreateCourseInput } from '@/features/master-data/types';

export default function CoursesPage() {
  const [search, setSearch] = useState('');
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

  const handleCreate = () => {
    setSelectedCourse(null);
    setDialogOpen(true);
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setDialogOpen(true);
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

  const handleFormSubmit = async (input: CreateCourseInput) => {
    try {
      if (selectedCourse) {
        await updateMutation.mutateAsync({ id: selectedCourse.id, input });
        toast.success('Course updated successfully');
      } else {
        await createMutation.mutateAsync(input);
        toast.success('Course created successfully');
      }
    } catch (err) {
      toast.error('Operation failed');
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

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-gray-50/50 dark:bg-gray-900/10 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Courses
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage courses, syllabus descriptions, and access dynamic curriculum structures.
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Add Course
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 max-w-sm bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <CourseSkeleton />
        ) : error ? (
          <div className="p-8 text-center border border-dashed rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p className="text-red-500 font-medium">Failed to load courses</p>
            <p className="text-gray-500 text-sm mt-1">Please try again later.</p>
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p className="text-gray-900 dark:text-white font-medium text-lg">No courses found</p>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              Get started by creating your first course.
            </p>
            <Button onClick={handleCreate} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Add Course
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <CourseTable
              courses={data.data}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            {/* Pagination Controls */}
            {data.meta && data.meta.lastPage > 1 && (
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {page} of {data.meta.lastPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.meta.lastPage}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Dialog Form */}
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
