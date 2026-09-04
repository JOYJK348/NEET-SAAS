'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { ProtectedRoute } from '@/components/auth/protected-route';
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
  ChevronRight,
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

  const handlePageSizeChange = useCallback(() => {}, []);

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
        <div className="w-full space-y-6 text-[#0F172A] font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B2447]">
                Students
              </h1>
              <p className="text-slate-500 mt-1 text-sm">Manage student records and enrollments</p>
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
        <div className="w-full space-y-6 text-[#0F172A] font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B2447]">
                Students
              </h1>
              <p className="text-slate-500 mt-1 text-sm">Manage student records and enrollments</p>
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
      bg: 'bg-blue-50 text-[#0052CC] border-blue-200',
      icon: GraduationCap,
    },
    {
      label: 'Active',
      value: counts.active,
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      icon: CheckCircle,
    },
    {
      label: 'Inactive',
      value: counts.inactive,
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: X,
    },
    {
      label: 'Pending',
      value: counts.pending,
      bg: 'bg-amber-50 text-amber-600 border-amber-200',
      icon: Clock,
    },
  ];

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 text-[#0F172A] font-sans">
        {/* Header Banner - ISML LMS Light Blue Style */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
              <span>Management Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Student Directory</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
              Student Directory & Admissions
            </h1>
            <p className="text-xs text-slate-600">
              Manage student profiles, active enrollments, course assignments, and batch transfers.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:flex sm:flex-row gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="w-full sm:w-auto px-2 sm:px-3.5 gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-xl text-xs font-bold shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-[#0052CC] shrink-0" aria-hidden="true" />
              <span className="truncate">Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/students/import')}
              className="w-full sm:w-auto px-2 sm:px-3.5 gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-xl text-xs font-bold shadow-2xs"
            >
              <Upload className="h-3.5 w-3.5 text-[#0052CC] shrink-0" aria-hidden="true" />
              <span className="truncate">Import</span>
            </Button>
            <Button
              onClick={handleAddStudent}
              className="w-full sm:w-auto px-2 sm:px-3.5 gap-1.5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold border-0 shadow-2xs rounded-xl text-xs"
            >
              <Plus className="h-3.5 w-3.5 text-white shrink-0" aria-hidden="true" />
              <span className="truncate sm:hidden">Add</span>
              <span className="hidden sm:inline">Add Student</span>
            </Button>
          </div>
        </div>

        {/* Mild KPI Cards Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {statCards.map((stat) => {
            const IconComp = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs flex items-center gap-2.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`p-2 rounded-xl border shrink-0 ${stat.bg}`}>
                  <IconComp className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                    {stat.label}
                  </p>
                  <p className="text-lg sm:text-xl font-extrabold text-[#0B2447] mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Import Validation Log Banner */}
        {lastImportLog && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs relative space-y-4">
            <button
              onClick={() => setLastImportLog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss logs"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#0052CC]" />
              <h3 className="font-extrabold text-sm text-[#0B2447]">
                Last Bulk Import Operation Logs
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Status
                </span>
                <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
                  <CheckCircle className="h-4 w-4" />
                  Successfully Imported: {lastImportLog.importedCount} Student(s)
                </p>
              </div>
              <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Validation Errors count
                </span>
                <p
                  className={`text-sm font-bold mt-1 ${lastImportLog.errors.length > 0 ? 'text-rose-600' : 'text-slate-700'}`}
                >
                  {lastImportLog.errors.length} row(s) failed validation rules
                </p>
              </div>
            </div>

            {lastImportLog.errors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4" />
                  Detailed Error log messages
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                  {lastImportLog.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-rose-700 font-medium flex gap-2 items-start"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search & Filters Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
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
              <span className="text-xs font-bold text-[#0052CC]">Active filters applied</span>
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
              <span className="bg-blue-50 text-[#0052CC] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-blue-200">
                Filtered
              </span>
            )}
          </div>
        </div>

        {/* Mobile View: Cards List */}
        <div className="block sm:hidden space-y-3">
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

        {/* Desktop View: Table Layout */}
        <div className="hidden sm:block">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
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
          </div>
        </div>

        {/* Empty State */}
        {students.length === 0 && !isLoading && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8">
            <StudentEmptyState
              variant={hasActiveFilters ? 'filter' : 'default'}
              hasFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              onAddStudent={handleAddStudent}
            />
          </div>
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
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <StudentsPageContent />
    </ProtectedRoute>
  );
}
