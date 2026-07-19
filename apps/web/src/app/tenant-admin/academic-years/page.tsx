'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  useAcademicYears,
  useCreateAcademicYear,
  useUpdateAcademicYear,
  useDeleteAcademicYear,
} from '@/features/master-data/hooks/use-academic-years';
import { AcademicYearTable } from '@/features/master-data/components/academic-years/AcademicYearTable';
import { AcademicYearDialog } from '@/features/master-data/components/academic-years/AcademicYearDialog';
import { AcademicYearSkeleton } from '@/features/master-data/components/academic-years/AcademicYearSkeleton';
import { toast } from 'sonner';
import type { AcademicYear, CreateAcademicYearInput } from '@/features/master-data/types';

export default function AcademicYearsPage() {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('displayOrder');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);

  const { data, isLoading, error } = useAcademicYears({
    page,
    limit: 10,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateAcademicYear();
  const updateMutation = useUpdateAcademicYear();
  const deleteMutation = useDeleteAcademicYear();

  const handleCreate = () => {
    setSelectedYear(null);
    setDialogOpen(true);
  };

  const handleEdit = (year: AcademicYear) => {
    setSelectedYear(year);
    setDialogOpen(true);
  };

  const handleSetCurrent = async (id: string) => {
    if (
      confirm(
        'Set this year as the current active year? Doing so resets the previous active current year flag.',
      )
    ) {
      try {
        await updateMutation.mutateAsync({ id, input: { isCurrent: true } });
        toast.success('Academic Year set as current');
      } catch (err) {
        toast.error('Failed to update academic year status');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this academic year?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Academic Year deleted successfully');
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || 'Failed to delete academic year';
        toast.error(errorMsg);
      }
    }
  };

  const handleFormSubmit = async (input: CreateAcademicYearInput) => {
    try {
      if (selectedYear) {
        await updateMutation.mutateAsync({ id: selectedYear.id, input });
        toast.success('Academic Year updated successfully');
      } else {
        await createMutation.mutateAsync(input);
        toast.success('Academic Year created successfully');
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
              Academic Years
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Define academic calendar years, manage active configurations, and configure default
              year filters.
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Add Academic Year
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <AcademicYearSkeleton />
        ) : error ? (
          <div className="p-8 text-center border border-dashed rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p className="text-red-500 font-medium">Failed to load academic years</p>
            <p className="text-gray-500 text-sm mt-1">Please try again later.</p>
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p className="text-gray-900 dark:text-white font-medium text-lg">
              No academic years configured
            </p>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              Get started by creating your very first academic calendar year cycle.
            </p>
            <Button onClick={handleCreate} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Add Academic Year
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <AcademicYearTable
              years={data.data}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetCurrent={handleSetCurrent}
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
        <AcademicYearDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          academicYear={selectedYear}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
