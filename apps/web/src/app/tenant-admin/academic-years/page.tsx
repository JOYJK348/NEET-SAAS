'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmActionModal } from '@/components/ui/confirm-modal';
import {
  Plus,
  Search,
  Calendar,
  Sparkles,
  CheckCircle2,
  CalendarCheck,
  Clock,
  X,
} from 'lucide-react';
import {
  useAcademicYears,
  useUpdateAcademicYear,
  useDeleteAcademicYear,
} from '@/features/master-data/hooks/use-academic-years';
import { AcademicYearTable } from '@/features/master-data/components/academic-years/AcademicYearTable';
import { AcademicYearSkeleton } from '@/features/master-data/components/academic-years/AcademicYearSkeleton';
import { toast } from 'sonner';
import type { AcademicYear } from '@/features/master-data/types';
import { cn } from '@/lib/utils';

function AcademicYearsContent() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('displayOrder');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Confirmation Modal Targets
  const [deleteTarget, setDeleteTarget] = useState<AcademicYear | null>(null);
  const [setCurrentTarget, setSetCurrentTarget] = useState<AcademicYear | null>(null);

  const { data, isLoading, error } = useAcademicYears({
    page,
    limit: 10,
    search: search || undefined,
    sortBy,
    sortOrder,
  });

  const updateMutation = useUpdateAcademicYear();
  const deleteMutation = useDeleteAcademicYear();

  const handleCreate = () => {
    router.push('/tenant-admin/academic-years/new');
  };

  const handleView = (year: AcademicYear) => {
    router.push(`/tenant-admin/academic-years/${year.id}`);
  };

  const handleRequestSetCurrent = (id: string) => {
    const target = (data?.data || []).find((y) => y.id === id);
    if (target) setSetCurrentTarget(target);
  };

  const handleConfirmSetCurrent = async () => {
    if (!setCurrentTarget) return;
    try {
      await updateMutation.mutateAsync({ id: setCurrentTarget.id, input: { isCurrent: true } });
      toast.success(`"${setCurrentTarget.name}" set as current active session`);
    } catch (err) {
      toast.error('Failed to update academic year status');
    }
  };

  const handleStatusToggle = async (year: AcademicYear, newStatus: boolean) => {
    try {
      await updateMutation.mutateAsync({
        id: year.id,
        input: { isActive: newStatus },
      });
      toast.success(`Academic Year "${year.name}" set to ${newStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleRequestDelete = (id: string) => {
    const target = (data?.data || []).find((y) => y.id === id);
    if (target) setDeleteTarget(target);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Academic Year "${deleteTarget.name}" deleted successfully`);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to delete academic year';
      toast.error(errorMsg);
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

  const allYears = data?.data || [];
  const filteredYears = allYears.filter((y) => {
    if (statusFilter === 'ACTIVE') return y.isActive;
    if (statusFilter === 'INACTIVE') return !y.isActive;
    return true;
  });

  const totalYears = data?.meta?.total ?? allYears.length;
  const activeCount = allYears.filter((y) => y.isActive).length;
  const currentYear = allYears.find((y) => y.isCurrent);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Welcome Header Banner - Signature Violet Gradient */}
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                Institutional Academic Sessions
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
              Academic Years & Sessions 📅
            </h1>
            <p className="text-violet-200 text-xs mt-0.5">
              Define academic calendar years, manage active configurations, and configure default
              filters.
            </p>
          </div>

          <Button
            onClick={handleCreate}
            onMouseEnter={() => router.prefetch('/tenant-admin/academic-years/new')}
            className="w-full sm:w-auto gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold border-0 shadow-sm shrink-0 rounded-xl"
          >
            <Plus className="h-4 w-4 text-violet-600" /> Add Academic Year
          </Button>
        </div>

        {/* Mild KPI Cards Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-5 shadow-xs flex items-center gap-2.5 sm:gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
              <Calendar className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Total Sessions
              </p>
              <p className="text-xl sm:text-2xl font-bold text-[#111827] mt-0.5">{totalYears}</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-5 shadow-xs flex items-center gap-2.5 sm:gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
              <CheckCircle2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Active Sessions
              </p>
              <p className="text-xl sm:text-2xl font-bold text-[#111827] mt-0.5">{activeCount}</p>
            </div>
          </Card>

          <Card className="col-span-2 lg:col-span-1 rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-5 shadow-xs flex items-center gap-2.5 sm:gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
              <CalendarCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Current Active Session
              </p>
              <p className="text-sm sm:text-base font-bold text-[#111827] mt-0.5 truncate">
                {currentYear ? currentYear.name : 'None Selected'}
              </p>
            </div>
          </Card>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by academic year code, name..."
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

        {/* Content */}
        {isLoading ? (
          <AcademicYearSkeleton />
        ) : error ? (
          <div className="p-8 text-center border border-rose-200 rounded-2xl bg-rose-50/50 text-rose-700">
            <p className="font-bold text-sm">Failed to load academic years</p>
            <p className="text-xs mt-1">Please refresh or try again later.</p>
          </div>
        ) : filteredYears.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-3xl border-slate-200 bg-white">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-900 font-bold text-base">No academic years found</p>
            <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
              Get started by establishing your institution's academic session calendar.
            </p>
            <Button
              onClick={handleCreate}
              className="mt-4 gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
            >
              <Plus className="h-4 w-4" /> Add Academic Year
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <AcademicYearTable
              years={filteredYears}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onView={handleView}
              onDelete={handleRequestDelete}
              onSetCurrent={handleRequestSetCurrent}
              onStatusToggle={handleStatusToggle}
            />

            {/* Pagination Controls */}
            {data?.meta && data.meta.lastPage > 1 && (
              <div className="flex justify-between items-center bg-white border border-[#E5E7EB] rounded-2xl px-5 py-3 shadow-xs">
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

        {/* ── Mobile-Friendly, Theme-Consistent Action Dialogs ── */}

        {/* 1. Delete Confirmation Dialog */}
        <ConfirmActionModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Academic Year?"
          itemName={deleteTarget?.name}
          variant="danger"
          confirmText="Yes, Delete Session"
          cancelText="Cancel"
          description={
            <div className="space-y-1">
              <p>Are you sure you want to permanently delete this academic session?</p>
              <p className="text-[11px] text-rose-600 font-bold mt-1">
                ⚠️ Warning: This will un-assign any linked batches or courses associated with this session.
              </p>
            </div>
          }
        />

        {/* 2. Set Current Active Session Confirmation Dialog */}
        <ConfirmActionModal
          isOpen={!!setCurrentTarget}
          onClose={() => setSetCurrentTarget(null)}
          onConfirm={handleConfirmSetCurrent}
          title="Set Active Session?"
          itemName={setCurrentTarget?.name}
          variant="primary"
          confirmText="Set as Active Session"
          cancelText="Keep Current"
          description={
            <p>
              Setting this year as the primary active session will automatically un-flag any previously selected active session across the platform.
            </p>
          }
        />
      </div>
    </DashboardLayout>
  );
}

export default function AcademicYearsPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <AcademicYearsContent />
    </ProtectedRoute>
  );
}
