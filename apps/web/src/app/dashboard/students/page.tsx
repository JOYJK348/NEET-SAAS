'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Download,
  Filter,
  Upload,
  X,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  GraduationCap,
  Clock,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';

import { StudentStatus, StudentFilters } from '@/features/students/types/student';
import { studentService } from '@/features/students/services/student-service';
import {
  useStudents,
  useStudentStats,
  useUpdateStudent,
  useDeleteStudent,
  usePrefetchStudentDetail,
} from '@/features/students/hooks/use-students';
import {
  useCoursesForAdmission,
  useBranchesForAdmission,
  useAcademicYearsForAdmission,
  useBatchesForAdmission,
} from '@/features/admissions/hooks/use-admissions';
import { BulkImportDialog } from '@/features/students/components/BulkImportDialog';
import { StudentTable } from '@/features/students/components/StudentTable';
import { StudentList } from '@/features/students/components/StudentList';
import { StudentSearch } from '@/features/students/components/StudentSearch';
import { StudentFilters as StudentFiltersComponent } from '@/features/students/components/StudentFilters';
import { StudentPagination } from '@/features/students/components/StudentPagination';
import { StudentSkeleton } from '@/features/students/components/StudentSkeleton';
import { StudentEmptyState } from '@/features/students/components/StudentEmptyState';
import { StudentErrorState } from '@/features/students/components/StudentErrorState';
import { toast } from '@/hooks/use-toast';

function StudentsContent() {
  const router = useRouter();
  const {
    students,
    meta,
    isLoading,
    error,
    filters,
    setSearch,
    setStatus,
    setCourse,
    setBatch,
    setPage,
    setSort,
    clearFilters,
    refetch,
  } = useStudents();
  const { stats: studentStats, isLoading: statsLoading } = useStudentStats();
  const { updateStudent } = useUpdateStudent();
  const { deleteStudent } = useDeleteStudent();
  const { years: yearOptions } = useAcademicYearsForAdmission();
  const { branches: branchOptions } = useBranchesForAdmission();
  const { courses: courseOptions } = useCoursesForAdmission();
  const { batches: batchOptions } = useBatchesForAdmission();
  const prefetchStudent = usePrefetchStudentDetail();

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [lastImportLog, setLastImportLog] = useState<{
    importedCount: number;
    errors: string[];
  } | null>(null);

  const courses = useMemo(() => {
    return [...courseOptions].sort((a, b) => a.name.localeCompare(b.name));
  }, [courseOptions]);

  const batches = useMemo(() => {
    return [...batchOptions].sort((a, b) => a.name.localeCompare(b.name));
  }, [batchOptions]);

  const counts = useMemo(() => {
    return {
      total: studentStats?.total ?? 0,
      active: studentStats?.active ?? 0,
      inactive: studentStats?.inactive ?? 0,
      pending: studentStats?.pending ?? 0,
      suspended: studentStats?.suspended ?? 0,
      graduated: studentStats?.graduated ?? 0,
      droppedOut: studentStats?.droppedOut ?? 0,
    };
  }, [studentStats]);

  const handleSearch = useCallback(
    (search: string) => {
      setSearch(search);
    },
    [setSearch],
  );

  const handleStatusChange = useCallback(
    (status: StudentStatus | 'ALL') => {
      setStatus(status);
    },
    [setStatus],
  );

  const handleCourseChange = useCallback(
    (course: string) => {
      setCourse(course);
    },
    [setCourse],
  );

  const handleBatchChange = useCallback(
    (batch: string) => {
      setBatch(batch);
    },
    [setBatch],
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  const handleSort = useCallback(
    (key: string) => {
      const newOrder = key === filters.sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
      setSort(key, newOrder);
    },
    [filters.sortBy, filters.sortOrder, setSort],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
    },
    [setPage],
  );

  const handlePageSizeChange = useCallback(() => {
    // page size changes not currently exposed through the hook
  }, []);

  const handleStatusUpdate = useCallback(
    async (student: any, status: StudentStatus) => {
      const name =
        student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
      try {
        await updateStudent({ id: student.id, status });
        const label =
          status === 'ACTIVE'
            ? 'activated'
            : status === 'SUSPENDED'
              ? 'suspended'
              : status.toLowerCase();
        toast({ title: `Student ${label}`, description: `${name} is now ${label}.` });
      } catch {
        toast({
          title: 'Status update failed',
          description: `Could not update ${name}'s status. Please try again.`,
          variant: 'destructive',
        });
      }
    },
    [updateStudent],
  );

  const handleView = useCallback(
    (student: any) => {
      router.push(`/dashboard/students/${student.id}`);
    },
    [router],
  );

  const handleEdit = useCallback(
    (student: any) => {
      router.push(`/dashboard/students/${student.id}/edit`);
    },
    [router],
  );

  const handleDelete = useCallback(
    async (student: any) => {
      const name =
        student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
      try {
        await deleteStudent(student.id);
        toast({ title: 'Student deleted', description: `${name} has been removed.` });
      } catch {
        toast({
          title: 'Delete failed',
          description: `Could not delete ${name}. Please try again.`,
          variant: 'destructive',
        });
      }
    },
    [deleteStudent],
  );

  const handleAddStudent = useCallback(() => {
    router.push('/dashboard/students/new');
  }, [router]);

  const handleExport = useCallback(async () => {
    try {
      const apiFilters: StudentFilters = {
        search: filters.search || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        courseId: filters.courseId || undefined,
        batchId: filters.batchId || undefined,
      };
      const result = await studentService.getStudents(apiFilters);
      const csvContent = [
        ['ID', 'Name', 'Email', 'Phone', 'Course', 'Batch', 'Status', 'Admission Date'].join(','),
        ...result.data.map((s) =>
          [
            s.studentId,
            s.fullName,
            s.email,
            s.phone,
            s.courseName,
            s.batchName,
            s.status,
            s.admissionDate,
          ].join(','),
        ),
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: 'Export failed',
        description: 'Failed to export students.',
        variant: 'destructive',
      });
    }
  }, [filters]);

  const hasActiveFilters = !!(
    (filters.status && filters.status !== 'ALL') ||
    filters.courseId ||
    filters.batchId ||
    filters.search
  );

  if (isLoading && !meta) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Students</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Manage student records and enrollments
              </p>
            </div>
          </div>
          <StudentSkeleton variant="table" count={5} />
        </div>
      </DashboardLayout>
    );
  }

  if (error && students.length === 0 && !meta) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Students</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Manage student records and enrollments
              </p>
            </div>
          </div>
          <StudentErrorState
            message={error?.message ?? 'Failed to load students'}
            onRetry={refetch}
          />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      label: 'Total Students',
      value: counts.total,
      bg: 'bg-violet-50 text-violet-600 border-violet-100',
      icon: GraduationCap,
    },
    {
      label: 'Active',
      value: counts.active,
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: CheckCircle,
    },
    {
      label: 'Inactive',
      value: counts.inactive,
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: X,
    },
    {
      label: 'Graduated',
      value: counts.graduated,
      bg: 'bg-sky-50 text-sky-600 border-sky-100',
      icon: GraduationCap,
    },
    {
      label: 'Dropped Out',
      value: counts.droppedOut,
      bg: 'bg-rose-50 text-rose-600 border-rose-100',
      icon: AlertTriangle,
    },
    {
      label: 'Pending',
      value: counts.pending,
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      icon: Clock,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Welcome Header Banner - Signature Violet Gradient */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                Student Directory & Enrollments
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
              Student Directory & Admissions 🎓
            </h1>
            <p className="text-violet-200 text-xs mt-0.5">
              Manage student profiles, active enrollments, course assignments, and batch transfers.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:flex sm:flex-row gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="w-full sm:w-auto px-1.5 sm:px-3 gap-1 sm:gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl text-[11px] sm:text-xs font-bold"
            >
              <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/students/import')}
              className="w-full sm:w-auto px-1.5 sm:px-3 gap-1 sm:gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl text-[11px] sm:text-xs font-bold"
            >
              <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">Import</span>
            </Button>
            <Button
              onClick={handleAddStudent}
              className="w-full sm:w-auto px-1.5 sm:px-3 gap-1 sm:gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold border-0 shadow-xs rounded-xl text-[11px] sm:text-xs"
            >
              <Plus className="h-3.5 w-3.5 text-violet-600 shrink-0" aria-hidden="true" />
              <span className="truncate sm:hidden">Add</span>
              <span className="hidden sm:inline">Add Student</span>
            </Button>
          </div>
        </div>

        {/* Mild KPI Cards Strip - Mobile Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {statCards.map((stat) => {
            const IconComp = stat.icon;
            return (
              <Card
                key={stat.label}
                className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-2.5 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50"
              >
                <div className={`p-2 rounded-xl border shrink-0 ${stat.bg}`}>
                  <IconComp className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    {stat.label}
                  </p>
                  <p className="text-lg sm:text-xl font-black text-[#111827] mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Persistent Import Validation Log with Dismiss Action */}
        {lastImportLog && (
          <Card className="rounded-2xl border-purple-100 bg-purple-50/10 p-5 shadow-sm relative space-y-4">
            <button
              onClick={() => setLastImportLog(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss logs"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-purple-600" />
              <h3 className="font-bold text-sm text-gray-800">Last Bulk Import Operation Logs</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 bg-white p-4 rounded-xl border border-gray-100">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Status
                </span>
                <p className="text-sm font-semibold text-green-700 flex items-center gap-1.5 mt-1">
                  <CheckCircle className="h-4 w-4" />
                  Successfully Imported: {lastImportLog.importedCount} Student(s)
                </p>
              </div>
              <div className="space-y-1 bg-white p-4 rounded-xl border border-gray-100">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Validation Errors count
                </span>
                <p
                  className={`text-sm font-semibold mt-1 ${lastImportLog.errors.length > 0 ? 'text-red-700' : 'text-gray-600'}`}
                >
                  {lastImportLog.errors.length} row(s) failed validation rules
                </p>
              </div>
            </div>

            {lastImportLog.errors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-purple-100">
                <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4" />
                  Detailed Error log messages
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 bg-red-50/30 p-4 rounded-xl border border-red-100">
                  {lastImportLog.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-red-700 font-medium flex gap-2 items-start"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Search & Filters Toolbar */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <StudentSearch
                value={filters.search || ''}
                onChange={handleSearch}
                onClear={() => handleSearch('')}
              />
            </div>
            <div className="w-full sm:w-auto">
              <StudentFiltersComponent
                status={(filters.status as StudentStatus | 'ALL') || 'ALL'}
                onStatusChange={handleStatusChange}
                course={filters.courseId || ''}
                onCourseChange={handleCourseChange}
                batch={filters.batchId || ''}
                onBatchChange={handleBatchChange}
                courses={courses}
                batches={batches}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-violet-600">Active filters applied</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="gap-1.5 text-xs text-slate-500 hover:text-slate-800"
              >
                <Filter className="h-3.5 w-3.5" />
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>
              Showing <span className="font-extrabold text-slate-900">{meta?.from ?? 0}</span>{' '}
              &ndash; <span className="font-extrabold text-slate-900">{meta?.to ?? 0}</span> of{' '}
              <span className="font-extrabold text-slate-900">{meta?.total ?? 0}</span> student
              records
            </span>
            {hasActiveFilters && (
              <span className="bg-violet-50 text-violet-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-violet-100">
                Filtered
              </span>
            )}
          </div>
        </div>

        {/* Mobile View: Rich Cards List (block sm:hidden) */}
        <div className="block sm:hidden">
          <StudentList
            students={students}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusUpdate}
            onPrefetch={prefetchStudent}
            isLoading={isLoading}
          />
        </div>

        {/* Desktop View: Rich Table Layout (hidden sm:block) */}
        <div className="hidden sm:block">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
            <StudentTable
              students={students}
              sortBy={filters.sortBy ?? 'admissionDate'}
              sortOrder={(filters.sortOrder as 'asc' | 'desc') ?? 'desc'}
              onSort={handleSort}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusUpdate}
              onPrefetch={prefetchStudent}
              isLoading={isLoading}
            />

            {students.length > 0 && meta && meta.lastPage > 1 && (
              <StudentPagination
                currentPage={meta.currentPage}
                totalPages={meta.lastPage}
                totalItems={meta.total}
                itemsPerPage={meta.perPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handlePageSizeChange}
              />
            )}
          </Card>
        </div>

        {/* Empty State */}
        {students.length === 0 && !isLoading && (
          <Card className="rounded-3xl border border-dashed border-slate-200 bg-white p-8">
            <StudentEmptyState
              variant={hasActiveFilters ? 'filter' : 'default'}
              hasFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              onAddStudent={handleAddStudent}
            />
          </Card>
        )}

        <BulkImportDialog
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onSuccess={refetch}
          onImportComplete={(res) => setLastImportLog(res)}
          academicYears={yearOptions}
          branches={branchOptions}
          courses={courseOptions}
          batches={batchOptions}
        />
      </div>
    </DashboardLayout>
  );
}

function StudentsPageContent() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#FAFAFA]">
            <LoadingSpinner size="lg" />
          </div>
        </DashboardLayout>
      }
    >
      <StudentsContent />
    </Suspense>
  );
}

export default function StudentsPage() {
  return <StudentsPageContent />;
}
