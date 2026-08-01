'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, Users, Clock, Activity, Sparkles, BookOpen } from 'lucide-react';
import {
  useBatches,
  useBatchStats,
  useCoursesForBatch,
  useBranchesForBatch,
  useDeliveryTypes,
  usePrefetchBatchDetail,
  useUpdateBatch,
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
  const { updateBatch } = useUpdateBatch();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleStatus = useCallback(
    async (id: string, currentActive: boolean) => {
      try {
        const result = await updateBatch({
          id,
          isActive: !currentActive,
        });
        if (result) {
          toast({
            title: 'Success',
            description: `Batch status updated to ${!currentActive ? 'Active' : 'Inactive'}.`,
          });
        }
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to update status',
          variant: 'destructive',
        });
      }
    },
    [updateBatch],
  );

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
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Welcome Header Banner - Signature Violet Gradient */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-200" />
            <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
              Course Batches & Sections
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
            Course Batches & Sections 📚
          </h1>
          <p className="text-violet-200 text-xs mt-0.5">
            Manage active student batches, section allocations, capacity limits, and course
            schedules.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex-1 sm:flex-none px-3 gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl text-xs font-bold"
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Export</span>
          </Button>
          <Button
            onClick={handleCreate}
            className="flex-1 sm:flex-none px-3 gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold border-0 shadow-xs rounded-xl text-xs"
          >
            <Plus className="h-3.5 w-3.5 text-violet-600 shrink-0" aria-hidden="true" />
            <span>New Batch</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
          <div className="p-2.5 rounded-xl border border-violet-100 bg-violet-50 text-violet-600 shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Total Batches
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">
              {stats?.total ?? 0}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
          <div className="p-2.5 rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Planned Batches
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">
              {stats?.planned ?? 0}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
          <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shrink-0">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Active Running
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">
              {stats?.active ?? 0}
            </p>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs space-y-3">
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
      </div>

      {/* Results Counter Bar */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>
            Showing <span className="font-extrabold text-slate-900">{meta?.from ?? 0}</span> &ndash;{' '}
            <span className="font-extrabold text-slate-900">{meta?.to ?? 0}</span> of{' '}
            <span className="font-extrabold text-slate-900">{meta?.total ?? 0}</span> batch records
          </span>
          {hasFilters && (
            <span className="bg-violet-50 text-violet-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-violet-100">
              Filtered
            </span>
          )}
        </div>
      </div>

      {/* Table / Card View */}
      {isLoading ? (
        <BatchSkeleton variant={isMobile ? 'card' : 'table'} />
      ) : batches.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-slate-200 bg-white p-8">
          <BatchEmptyState
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            variant={filters.search ? 'search' : hasFilters ? 'filter' : 'default'}
          />
        </Card>
      ) : (
        <>
          {/* Mobile View: Rich Cards List (block sm:hidden) */}
          <div className="block sm:hidden">
            <BatchList
              batches={batches}
              onView={handleView}
              onToggleStatus={handleToggleStatus}
              onPrefetch={prefetchBatch}
            />
          </div>

          {/* Desktop View: Rich Table Layout (hidden sm:block) */}
          <div className="hidden sm:block">
            <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
              <BatchTable
                batches={batches}
                onView={handleView}
                onToggleStatus={handleToggleStatus}
                onPrefetch={prefetchBatch}
              />
            </Card>
          </div>
        </>
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
