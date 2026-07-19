'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from '@/features/master-data/hooks/use-subjects';
import { SubjectTable } from '@/features/master-data/components/subjects/SubjectTable';
import { SubjectDialog } from '@/features/master-data/components/subjects/SubjectDialog';
import { SubjectSkeleton } from '@/features/master-data/components/subjects/SubjectSkeleton';
import { toast } from 'sonner';
import type { Subject, CreateSubjectInput } from '@/features/master-data/types';

export default function SubjectsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const { data, isLoading, error } = useSubjects({
    page,
    limit: 10,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateSubject();
  const updateMutation = useUpdateSubject();
  const deleteMutation = useDeleteSubject();

  const handleCreate = () => {
    setSelectedSubject(null);
    setDialogOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Subject deleted successfully');
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || 'Failed to delete subject';
        toast.error(errorMsg);
      }
    }
  };

  const handleFormSubmit = async (input: CreateSubjectInput) => {
    try {
      if (selectedSubject) {
        await updateMutation.mutateAsync({ id: selectedSubject.id, input });
        toast.success('Subject updated successfully');
      } else {
        await createMutation.mutateAsync(input);
        toast.success('Subject created successfully');
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
              Subjects
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage course subjects and modular components reusable across curriculum paths.
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Add Subject
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 max-w-sm bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search subjects..."
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
          <SubjectSkeleton />
        ) : error ? (
          <div className="p-8 text-center border border-dashed rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p className="text-red-500 font-medium">Failed to load subjects</p>
            <p className="text-gray-500 text-sm mt-1">Please try again later.</p>
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <p className="text-gray-900 dark:text-white font-medium text-lg">No subjects found</p>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              Get started by creating your first reusable curriculum subject.
            </p>
            <Button onClick={handleCreate} variant="outline" className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Add Subject
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <SubjectTable
              subjects={data.data}
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
        <SubjectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          subject={selectedSubject}
          onSubmit={handleFormSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
