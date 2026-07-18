'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Download,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
  Activity,
} from 'lucide-react';
import {
  useBatches,
  useBatchStats,
  useCoursesForBatch,
  useBranchesForBatch,
  useDeliveryTypes,
  usePrefetchBatchDetail,
} from '@/features/batches/hooks/use-batches';
import { BatchTable } from '@/features/batches/components/BatchTable';
import { BatchList } from '@/features/batches/components/BatchList';
import { BatchSearch } from '@/features/batches/components/BatchSearch';
import { BatchFilters as BatchFiltersComponent } from '@/features/batches/components/BatchFilters';
import { BatchPagination } from '@/features/batches/components/BatchPagination';
import { BatchSkeleton } from '@/features/batches/components/BatchSkeleton';
import { BatchEmptyState } from '@/features/batches/components/BatchEmptyState';
import { BatchErrorState } from '@/features/batches/components/BatchErrorState';
import { BatchStatCard } from '@/features/batches/components/BatchStatCard';
import { generateCSV } from '@/features/batches/utils/batch-utils';
import { toast } from '@/hooks/use-toast';

function BatchesContent() {
  const router = useRouter();
  const {
    batches,
    meta,
    isLoading,
    error,
    filters,
    setSearch,
    setStatus,
    setCourse,
    setBranch,
    setPage,
    setPerPage,
    clearFilters,
    refetch,
  } = useBatches();

  const { stats } = useBatchStats();
  const { courses } = useCoursesForBatch();
  const { branches } = useBranchesForBatch();
  const { deliveryTypes } = useDeliveryTypes();
  const prefetchBatch = usePrefetchBatchDetail();

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      router.push(`/dashboard/batches/${id}`);
    },
    [router],
  );

  const handleCreate = useCallback(() => {
    router.push('/dashboard/batches/new');
  }, [router]);

  const handleExport = useCallback(() => {
    const headers = [
      'Code',
      'Name',
      'Course',
      'Branch',
      'Status',
      'Capacity',
      'Enrolled',
      'Start Date',
      'End Date',
    ];
    const rows = batches.map((b) => [
      b.code,
      b.name,
      b.courseName,
      b.branchName,
      b.status,
      String(b.maxStudents),
      String(b.enrolledCount),
      b.startDate,
      b.endDate,
    ]);
    const csvContent = generateCSV(rows, headers);

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batches-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: 'Batches data exported as CSV.',
    });
  }, [batches]);

  const hasFilters = !!(
    filters.search ||
    filters.status !== 'ALL' ||
    filters.courseId ||
    filters.branchId
  );

  if (error && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BatchErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
          <p className="text-sm text-gray-500">Manage course batches and sections</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-11 px-5" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            className="rounded-xl h-11 px-5 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <BatchStatCard
          title="Total"
          value={stats?.total ?? 0}
          icon={<Users className="h-5 w-5" />}
          description="All batches"
        />
        <BatchStatCard
          title="Planned"
          value={stats?.planned ?? 0}
          icon={<Clock className="h-5 w-5" />}
          description="Upcoming batches"
        />
        <BatchStatCard
          title="Active"
          value={stats?.active ?? 0}
          icon={<Activity className="h-5 w-5" />}
          description="Currently running"
        />
        <BatchStatCard
          title="Completed"
          value={stats?.completed ?? 0}
          icon={<CheckCircle2 className="h-5 w-5" />}
          description="Finished batches"
        />
        <BatchStatCard
          title="Cancelled"
          value={stats?.cancelled ?? 0}
          icon={<XCircle className="h-5 w-5" />}
          description="Cancelled batches"
        />
        <BatchStatCard
          title="Archived"
          value={stats?.archived ?? 0}
          icon={<Archive className="h-5 w-5" />}
          description="Historical records"
        />
      </div>

      {/* Search & Filters */}
      <Card className="border border-gray-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <BatchSearch
              value={filters.search || ''}
              onChange={handleSearch}
              onClear={handleClearSearch}
              className="flex-1"
            />
          </div>
          <BatchFiltersComponent
            status={filters.status || 'ALL'}
            onStatusChange={setStatus}
            course={filters.courseId || ''}
            onCourseChange={setCourse}
            branch={filters.branchId || ''}
            onBranchChange={setBranch}
            courses={courses.map((c) => ({ id: c.id, name: c.name }))}
            branches={branches.map((b) => ({ id: b.id, name: b.name }))}
            deliveryTypes={deliveryTypes.map((d) => ({
              id: d.id,
              name: d.name,
              attendanceMode: d.attendanceMode,
            }))}
            onClearFilters={clearFilters}
          />
        </CardContent>
      </Card>

      {/* Table / Card View */}
      {isLoading ? (
        <BatchSkeleton variant={isMobile ? 'card' : 'table'} />
      ) : batches.length === 0 ? (
        <Card className="border border-gray-200">
          <BatchEmptyState
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            variant={filters.search ? 'search' : hasFilters ? 'filter' : 'default'}
          />
        </Card>
      ) : isMobile ? (
        <BatchList batches={batches} onView={handleView} onPrefetch={prefetchBatch} />
      ) : (
        <BatchTable batches={batches} onView={handleView} onPrefetch={prefetchBatch} />
      )}

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <BatchPagination
          currentPage={meta.currentPage}
          totalPages={meta.lastPage}
          totalItems={meta.total}
          itemsPerPage={meta.perPage}
          onPageChange={setPage}
          onItemsPerPageChange={setPerPage}
        />
      )}
    </div>
  );
}

export default function BatchesPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
          </div>
        }
      >
        <BatchesContent />
      </Suspense>
    </DashboardLayout>
  );
}
