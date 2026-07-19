'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import {
  useBatchDeliveryTypes,
  useCreateBatchDeliveryType,
  useUpdateBatchDeliveryType,
  useDeleteBatchDeliveryType,
} from '@/features/master-data/hooks/use-batch-delivery-types';
import { DeliveryTypeTable } from '@/features/master-data/components/batch-delivery-types/DeliveryTypeTable';
import { DeliveryTypeDialog } from '@/features/master-data/components/batch-delivery-types/DeliveryTypeDialog';
import { DeliveryTypeSkeleton } from '@/features/master-data/components/batch-delivery-types/DeliveryTypeSkeleton';
import { toast } from 'sonner';
import type { BatchDeliveryType, CreateBatchDeliveryTypeInput } from '@/features/master-data/types';

export default function BatchDeliveryTypesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('displayOrder');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<BatchDeliveryType | null>(null);

  const { data, isLoading, error } = useBatchDeliveryTypes({
    page,
    limit: 10,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateBatchDeliveryType();
  const updateMutation = useUpdateBatchDeliveryType();
  const deleteMutation = useDeleteBatchDeliveryType();

  const handleCreate = () => {
    setSelectedType(null);
    setDialogOpen(true);
  };

  const handleEdit = (type: BatchDeliveryType) => {
    setSelectedType(type);
    setDialogOpen(true);
  };

  const handleSetDefault = async (id: string) => {
    if (confirm('Set this delivery type as default? Doing so clears the previous default flag.')) {
      try {
        await updateMutation.mutateAsync({ id, input: { isDefault: true } });
        toast.success('Batch Delivery Type set as default');
      } catch (err) {
        toast.error('Failed to set default status');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this delivery type?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Batch Delivery Type deleted successfully');
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || 'Failed to delete delivery type';
        toast.error(errorMsg);
      }
    }
  };

  const handleFormSubmit = async (input: CreateBatchDeliveryTypeInput) => {
    try {
      if (selectedType) {
        await updateMutation.mutateAsync({ id: selectedType.id, input });
        toast.success('Batch Delivery Type updated successfully');
      } else {
        await createMutation.mutateAsync(input);
        toast.success('Batch Delivery Type created successfully');
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
              Batch Delivery Types
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Define the default configurations for batch styles (e.g. online courses vs classroom
              batches).
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Add Delivery Type
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 max-w-sm bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search delivery types..."
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
          <DeliveryTypeSkeleton />
        ) : error ? (
          <div className="p-8 text-center border border-dashed rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p className="text-red-500 font-medium">Failed to load batch delivery types</p>
            <p className="text-gray-500 text-sm mt-1">Please try again later.</p>
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p className="text-gray-900 dark:text-white font-medium text-lg">
              No delivery types found
            </p>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              Get started by creating your first batch delivery style template.
            </p>
            <Button onClick={handleCreate} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Add Delivery Type
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <DeliveryTypeTable
              types={data.data}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
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
        <DeliveryTypeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          deliveryType={selectedType}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
