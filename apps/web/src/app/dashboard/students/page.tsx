'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';

import { StudentStatus, StudentFilters } from '@/features/students/types/student';
import { studentService } from '@/features/students/services/student-service';
import { useStudentStats, useBatches, useCourses } from '@/features/students/hooks/use-students';
import { StudentTable } from '@/features/students/components/StudentTable';
import { StudentList } from '@/features/students/components/StudentList';
import { StudentSearch } from '@/features/students/components/StudentSearch';
import { StudentFilters as StudentFiltersComponent } from '@/features/students/components/StudentFilters';
import { StudentPagination } from '@/features/students/components/StudentPagination';
import { StudentSkeleton } from '@/features/students/components/StudentSkeleton';
import { StudentEmptyState } from '@/features/students/components/StudentEmptyState';
import { StudentErrorState } from '@/features/students/components/StudentErrorState';
import type { PaginationMeta } from '@/types/api';

const DEFAULT_PAGE_SIZE = 10;

function StudentsContent() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    lastPage: 1,
  });
  const [sortKey, setSortKey] = useState<string>('admissionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState({
    search: '',
    status: '' as StudentStatus | '' | 'ALL',
    course: '',
    batch: '',
  });
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [isMobile, setIsMobile] = useState(false);

  const { stats: studentStats, isLoading: statsLoading } = useStudentStats();
  const { batches: batchOptions } = useBatches();
  const { courses: courseOptions } = useCourses();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiFilters: StudentFilters = {
        search: filters.search || undefined,
        status:
          filters.status === 'ALL' || filters.status === ''
            ? undefined
            : (filters.status as StudentStatus),
        courseId: filters.course || undefined,
        batchId: filters.batch || undefined,
        page: pagination.page,
        perPage: pagination.pageSize,
        sortBy: sortKey,
        sortOrder: sortOrder,
      };
      const result = await studentService.getStudents(apiFilters);
      setStudents(result.data);
      setPagination((prev) => ({
        ...prev,
        total: result.meta.total,
        lastPage: result.meta.lastPage,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize, sortKey, sortOrder]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

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

  const handleSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleStatusChange = useCallback((status: StudentStatus | 'ALL') => {
    setFilters((prev) => ({ ...prev, status }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleCourseChange = useCallback((course: string) => {
    setFilters((prev) => ({ ...prev, course }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleBatchChange = useCallback((batch: string) => {
    setFilters((prev) => ({ ...prev, batch }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ search: '', status: '', course: '', batch: '' });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleSort = useCallback(
    (key: string) => {
      setSortOrder((prev) => (key === sortKey && prev === 'asc' ? 'desc' : 'asc'));
      setSortKey(key);
    },
    [sortKey],
  );

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPagination((prev) => ({ ...prev, pageSize: size, page: 1 }));
  }, []);

  const handleStatusUpdate = useCallback(async (student: any, status: StudentStatus) => {
    try {
      await studentService.updateStudent({ id: student.id, status });
      setStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, status } : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }, []);

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

  const handleAddStudent = useCallback(() => {
    router.push('/dashboard/students/new');
  }, [router]);

  const handleExport = useCallback(async () => {
    try {
      const apiFilters: StudentFilters = {
        search: filters.search || undefined,
        status:
          filters.status === 'ALL' || filters.status === ''
            ? undefined
            : (filters.status as StudentStatus),
        courseId: filters.course || undefined,
        batchId: filters.batch || undefined,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export students');
    }
  }, [filters]);

  const hasActiveFilters = !!(filters.status || filters.course || filters.batch || filters.search);

  if (isLoading) {
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
          <StudentSkeleton variant={isMobile ? 'card' : 'table'} count={5} />
        </div>
      </DashboardLayout>
    );
  }

  if (error && students.length === 0) {
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
          <StudentErrorState message={error} onRetry={loadStudents} />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { label: 'Total Students', value: counts.total, bg: 'bg-purple-100' },
    { label: 'Active', value: counts.active, bg: 'bg-green-100' },
    { label: 'Inactive', value: counts.inactive, bg: 'bg-gray-100' },
    { label: 'Graduated', value: counts.graduated, bg: 'bg-blue-100' },
    { label: 'Dropped Out', value: counts.droppedOut, bg: 'bg-red-100' },
    { label: 'Pending', value: counts.pending, bg: 'bg-yellow-100' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage student records and enrollments
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="w-full sm:w-auto gap-2"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export
            </Button>
            <Button onClick={handleAddStudent} className="w-full sm:w-auto gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-[#111827] mt-1">{stat.value}</p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}
                  >
                    <div className="w-5 h-5 rounded-full bg-purple-600/20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filters */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <StudentSearch
                value={filters.search}
                onChange={handleSearch}
                onClear={() => handleSearch('')}
              />
            </div>
            <div className="w-full sm:w-auto">
              <StudentFiltersComponent
                status={filters.status as StudentStatus | 'ALL'}
                onStatusChange={handleStatusChange}
                course={filters.course}
                onCourseChange={handleCourseChange}
                batch={filters.batch}
                onBatchChange={handleBatchChange}
                courses={courses}
                batches={batches}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Clear all filters
              </Button>
            </div>
          )}
        </Card>

        {/* View Toggle & Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Showing{' '}
              <span className="font-medium">{(pagination.page - 1) * pagination.pageSize + 1}</span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> students
            </span>
            {hasActiveFilters && <span className="text-sm font-medium">(filtered)</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className="h-9 px-3"
            >
              Table
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('card')}
              aria-label="Card view"
              className="h-9 px-3"
            >
              Cards
            </Button>
          </div>
        </div>

        {/* Students Table/List */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
          {viewMode === 'table' ? (
            <>
              <StudentTable
                students={students}
                sortBy={sortKey}
                sortOrder={sortOrder}
                onSort={handleSort}
                onView={handleView}
                onEdit={handleEdit}
                onStatusChange={handleStatusUpdate}
                isLoading={isLoading}
              />
              {students.length > 0 && (
                <StudentPagination
                  currentPage={pagination.page}
                  totalPages={pagination.lastPage}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.pageSize}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handlePageSizeChange}
                />
              )}
            </>
          ) : (
            <StudentList
              students={students}
              onView={handleView}
              onEdit={handleEdit}
              onStatusChange={handleStatusUpdate}
              isLoading={isLoading}
            />
          )}

          {students.length === 0 && !isLoading && (
            <StudentEmptyState
              variant={hasActiveFilters ? 'filter' : 'default'}
              hasFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              onAddStudent={handleAddStudent}
            />
          )}
        </Card>
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
