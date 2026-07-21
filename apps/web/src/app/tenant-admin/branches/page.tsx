'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from '@/features/master-data/hooks/use-branches';
import { BranchTable } from '@/features/master-data/components/branches/BranchTable';
import { BranchDialog } from '@/features/master-data/components/branches/BranchDialog';
import { BranchSkeleton } from '@/features/master-data/components/branches/BranchSkeleton';
import { BranchDetailsModal } from '@/features/master-data/components/branches/BranchDetailsModal';
import { toast } from 'sonner';
import type { Branch, CreateBranchInput } from '@/features/master-data/types';

export default function BranchesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewBranch, setViewBranch] = useState<Branch | null>(null);

  const { data, isLoading, error } = useBranches({
    page,
    limit: 10,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();

  const handleCreate = () => {
    setSelectedBranch(null);
    setDialogOpen(true);
  };

  const handleView = (branch: Branch) => {
    setViewBranch(branch);
    setDetailModalOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this branch?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Branch deleted successfully');
      } catch (err) {
        toast.error('Failed to delete branch');
      }
    }
  };

  const handleFormSubmit = async (input: CreateBranchInput) => {
    try {
      if (selectedBranch) {
        await updateMutation.mutateAsync({ id: selectedBranch.id, input });
        toast.success('Branch updated successfully');
      } else {
        await createMutation.mutateAsync(input);
        toast.success('Branch created successfully');
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
              Branches
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage different locations, campus branches, and institutional setups.
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Add Branch
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 max-w-sm bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search branches..."
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
          <BranchSkeleton />
        ) : error ? (
          <div className="p-8 text-center border border-dashed rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p className="text-red-500 font-medium">Failed to load branches</p>
            <p className="text-gray-500 text-sm mt-1">Please try again later.</p>
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p className="text-gray-900 dark:text-white font-medium text-lg">No branches found</p>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              Get started by creating your very first campus or institutional branch.
            </p>
            <Button onClick={handleCreate} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Add Branch
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <BranchTable
              branches={data.data}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onView={handleView}
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
        <BranchDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          branch={selectedBranch}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />

        {/* Detail Modal View */}
        <BranchDetailsModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          branch={viewBranch}
        />
      </div>
    </DashboardLayout>
  );
}
