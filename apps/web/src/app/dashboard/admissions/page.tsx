'use client';

import { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, Users, CheckCircle2, Clock, XCircle, Activity } from 'lucide-react';
import type { AdmissionStatus } from '@/features/admissions/types/admission';
import {
  useAdmissions,
  useAdmissionStats,
  useCoursesForAdmission,
  useBranchesForAdmission,
  useUpdateAdmissionStatus,
  usePrefetchAdmissionDetail,
} from '@/features/admissions/hooks/use-admissions';
import {
  AdmissionTable,
  type SortField,
  type SortOrder,
} from '@/features/admissions/components/AdmissionTable';
import { AdmissionMobileCard } from '@/features/admissions/components/AdmissionMobileCard';
import { AdmissionSearch } from '@/features/admissions/components/AdmissionSearch';
import { AdmissionFilters as AdmissionFiltersComponent } from '@/features/admissions/components/AdmissionFilters';
import { AdmissionPagination } from '@/features/admissions/components/AdmissionPagination';
import { AdmissionSkeleton } from '@/features/admissions/components/AdmissionSkeleton';
import { AdmissionEmptyState } from '@/features/admissions/components/AdmissionEmptyState';
import { AdmissionErrorState } from '@/features/admissions/components/AdmissionErrorState';
import { AdmissionStatCard } from '@/features/admissions/components/AdmissionStatCard';
import { StatusUpdateDialog } from '@/features/admissions/components/StatusUpdateDialog';
import { toast } from '@/hooks/use-toast';

function AdmissionsContent() {
  const router = useRouter();
  const {
    admissions,
    meta,
    isLoading,
    error,
    filters,
    setSearch,
    setStatus,
    setCourse,
    setBranch,
    setPage,
    clearFilters,
    refetch,
  } = useAdmissions();

  const { stats } = useAdmissionStats();
  const { courses } = useCoursesForAdmission();
  const { branches } = useBranchesForAdmission();
  const { updateStatus, isUpdating } = useUpdateAdmissionStatus();
  const prefetchAdmission = usePrefetchAdmissionDetail();

  const [isMobile, setIsMobile] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>('admissionDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusDialogId, setStatusDialogId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
      const handleResize = () => setIsMobile(window.innerWidth < 768);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
    },
    [setSearch],
  );

  const handleClearSearch = useCallback(() => {
    setSearch('');
  }, [setSearch]);

  const handleView = useCallback(
    (id: string) => {
      router.push(`/dashboard/admissions/${id}`);
    },
    [router],
  );

  const handleStatusClick = useCallback((id: string) => {
    setStatusDialogId(id);
  }, []);

  const handleStatusConfirm = useCallback(
    async (newStatus: AdmissionStatus, notes?: string) => {
      if (!statusDialogId) return;
      const result = await updateStatus({ id: statusDialogId, status: newStatus, notes });
      if (result) {
        toast({
          title: 'Status Updated',
          description: `Admission status changed to ${newStatus}.`,
        });
        setStatusDialogId(null);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update admission status.',
          variant: 'destructive',
        });
      }
    },
    [statusDialogId, updateStatus],
  );

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(field);
        setSortOrder('asc');
      }
    },
    [sortBy],
  );

  const handleExport = useCallback(() => {
    const csvContent = [
      ['Admission #', 'Student', 'Course', 'Branch', 'Status', 'Date'].join(','),
      ...admissions.map((a) =>
        [
          a.admissionNumber,
          a.studentName,
          a.courseName,
          a.branchName,
          a.admissionStatus,
          a.admissionDate,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admissions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: 'Admissions data exported as CSV.',
    });
  }, [admissions]);

  const sortedAdmissions = useMemo(() => {
    const sorted = [...admissions];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'studentName':
          cmp = a.studentName.localeCompare(b.studentName);
          break;
        case 'courseName':
          cmp = a.courseName.localeCompare(b.courseName);
          break;
        case 'branchName':
          cmp = a.branchName.localeCompare(b.branchName);
          break;
        case 'admissionStatus':
          cmp = a.admissionStatus.localeCompare(b.admissionStatus);
          break;
        case 'admissionDate':
          cmp = new Date(a.admissionDate).getTime() - new Date(b.admissionDate).getTime();
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [admissions, sortBy, sortOrder]);

  const hasFilters = !!(
    filters.search ||
    filters.status !== 'ALL' ||
    filters.courseId ||
    filters.branchId
  );

  const currentStatus = statusDialogId
    ? admissions.find((a) => a.id === statusDialogId)?.admissionStatus
    : undefined;
  const currentAdmissionNumber = statusDialogId
    ? admissions.find((a) => a.id === statusDialogId)?.admissionNumber
    : undefined;

  if (error && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AdmissionErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admissions</h1>
          <p className="text-sm text-gray-500">Manage student admissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-11 px-5" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            className="rounded-xl h-11 px-5 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => router.push('/dashboard/admissions/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Admission
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <AdmissionStatCard
          label="Total"
          value={stats?.total ?? 0}
          icon={Users}
          bgColor="bg-purple-50"
        />
        <AdmissionStatCard
          label="Pending"
          value={stats?.pending ?? 0}
          icon={Clock}
          bgColor="bg-yellow-50"
        />
        <AdmissionStatCard
          label="Confirmed"
          value={stats?.confirmed ?? 0}
          icon={CheckCircle2}
          bgColor="bg-blue-50"
        />
        <AdmissionStatCard
          label="Active"
          value={stats?.active ?? 0}
          icon={Activity}
          bgColor="bg-green-50"
        />
        <AdmissionStatCard
          label="Completed"
          value={stats?.completed ?? 0}
          icon={CheckCircle2}
          bgColor="bg-gray-50"
        />
        <AdmissionStatCard
          label="Cancelled"
          value={stats?.cancelled ?? 0}
          icon={XCircle}
          bgColor="bg-red-50"
        />
      </div>

      {/* Search & Filters */}
      <Card className="border border-gray-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <AdmissionSearch
              value={filters.search || ''}
              onChange={handleSearch}
              onClear={handleClearSearch}
              className="flex-1"
            />
          </div>
          <AdmissionFiltersComponent
            status={filters.status || 'ALL'}
            onStatusChange={setStatus}
            course={filters.courseId || ''}
            onCourseChange={setCourse}
            branch={filters.branchId || ''}
            onBranchChange={setBranch}
            courses={courses}
            branches={branches}
          />
        </CardContent>
      </Card>

      {/* Table / Card View */}
      {isLoading ? (
        <AdmissionSkeleton variant={isMobile ? 'card' : 'table'} count={5} />
      ) : sortedAdmissions.length === 0 ? (
        <Card className="border border-gray-200">
          <AdmissionEmptyState
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            variant={filters.search ? 'search' : hasFilters ? 'filter' : 'default'}
          />
        </Card>
      ) : isMobile ? (
        <div className="space-y-3">
          {sortedAdmissions.map((admission) => (
            <AdmissionMobileCard
              key={admission.id}
              admission={admission}
              onView={handleView}
              onStatusChange={handleStatusClick}
              onPrefetch={prefetchAdmission}
            />
          ))}
        </div>
      ) : (
        <AdmissionTable
          admissions={sortedAdmissions}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onView={handleView}
          onStatusChange={handleStatusClick}
          onPrefetch={prefetchAdmission}
        />
      )}

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <AdmissionPagination
          currentPage={meta.currentPage}
          totalPages={meta.lastPage}
          totalItems={meta.total}
          itemsPerPage={meta.perPage}
          onPageChange={setPage}
        />
      )}

      {/* Status Update Dialog */}
      {statusDialogId && currentStatus && currentAdmissionNumber && (
        <StatusUpdateDialog
          open={!!statusDialogId}
          onOpenChange={(open) => !open && setStatusDialogId(null)}
          currentStatus={currentStatus}
          admissionNumber={currentAdmissionNumber}
          onConfirm={handleStatusConfirm}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
}

export default function AdmissionsPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
          </div>
        }
      >
        <AdmissionsContent />
      </Suspense>
    </DashboardLayout>
  );
}
