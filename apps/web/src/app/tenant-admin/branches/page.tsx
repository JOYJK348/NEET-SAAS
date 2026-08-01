'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Sparkles,
  CheckCircle2,
  Layers,
  Radio,
  SlidersHorizontal,
  X,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

function BranchesContent() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
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
    router.push('/tenant-admin/branches/new');
  };

  const handleView = (branch: Branch) => {
    router.push(`/tenant-admin/branches/${branch.id}`);
  };

  const handleEdit = (branch: Branch) => {
    router.push(`/tenant-admin/branches/${branch.id}`);
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

  const handleStatusToggle = async (branch: Branch, newStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      await updateMutation.mutateAsync({
        id: branch.id,
        input: { status: newStatus },
      });
      toast.success(
        `Branch "${branch.name}" set to ${newStatus === 'ACTIVE' ? 'Active' : 'Inactive'}`,
      );
    } catch (err) {
      toast.error('Failed to update branch status');
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

  const allBranches = data?.data || [];
  const filteredBranches = allBranches.filter((b) => {
    if (statusFilter === 'ACTIVE') return b.status === 'ACTIVE';
    if (statusFilter === 'INACTIVE') return b.status !== 'ACTIVE';
    return true;
  });

  const totalBranches = data?.meta?.total ?? allBranches.length;
  const activeCount = allBranches.filter((b) => b.status === 'ACTIVE').length;
  const mainCount = allBranches.filter((b) => b.branchType?.toUpperCase().includes('MAIN')).length;
  const subCount = allBranches.filter((b) => !b.branchType?.toUpperCase().includes('MAIN')).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Welcome Header Banner - Signature Violet Gradient */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                Campus & Branch Management
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
              Institutional Branches & Campuses 🏫
            </h1>
            <p className="text-violet-200 text-xs mt-0.5">
              Manage physical campuses, regional branches, online centers, and facility parameters.
            </p>
          </div>

          <Button
            onClick={handleCreate}
            className="w-full sm:w-auto gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold border-0 shadow-sm shrink-0 rounded-xl"
          >
            <Plus className="h-4 w-4 text-violet-600" /> Add New Branch
          </Button>
        </div>

        {/* Mild KPI Cards Strip - Mobile Responsive 2-column Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-5 shadow-xs flex items-center gap-2.5 sm:gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
              <Building2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Total Campuses
              </p>
              <p className="text-xl sm:text-2xl font-bold text-[#111827] mt-0.5">{totalBranches}</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-5 shadow-xs flex items-center gap-2.5 sm:gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
              <CheckCircle2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Active Campuses
              </p>
              <p className="text-xl sm:text-2xl font-bold text-[#111827] mt-0.5">{activeCount}</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-5 shadow-xs flex items-center gap-2.5 sm:gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
              <MapPin className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Main Campuses
              </p>
              <p className="text-xl sm:text-2xl font-bold text-[#111827] mt-0.5">{mainCount}</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-5 shadow-xs flex items-center gap-2.5 sm:gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
              <Layers className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Sub-Branches
              </p>
              <p className="text-xl sm:text-2xl font-bold text-[#111827] mt-0.5">{subCount}</p>
            </div>
          </Card>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by branch name, code, city..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-row w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden lg:inline">
              Filter Status:
            </span>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center',
                  statusFilter === st
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200',
                )}
              >
                {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <BranchSkeleton />
        ) : error ? (
          <div className="p-10 text-center border border-rose-200 rounded-2xl bg-rose-50/50 text-rose-700">
            <p className="font-bold text-sm">Failed to load branches</p>
            <p className="text-xs mt-1 text-rose-500">
              Please check network or backend connectivity.
            </p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-2xl border-slate-200 bg-white shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center border border-violet-100">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No branches found</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              No matching branch records found. Create your first campus or branch location.
            </p>
            <Button
              onClick={handleCreate}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
            >
              <Plus className="h-4 w-4" /> Add Branch
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <BranchTable
              branches={filteredBranches}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusToggle={handleStatusToggle}
            />

            {/* Pagination Controls */}
            {data?.meta && data.meta.lastPage > 1 && (
              <div className="flex justify-between items-center bg-white border border-[#E5E7EB] rounded-2xl px-5 py-3 shadow-sm">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-xl text-xs font-bold text-slate-700"
                >
                  Previous
                </Button>
                <span className="text-xs font-bold text-slate-500">
                  Page {page} of {data.meta.lastPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.meta.lastPage}
                  onClick={() => setPage(page + 1)}
                  className="rounded-xl text-xs font-bold text-slate-700"
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

export default function BranchesPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <BranchesContent />
    </ProtectedRoute>
  );
}
