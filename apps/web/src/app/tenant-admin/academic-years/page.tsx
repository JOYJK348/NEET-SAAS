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
  ChevronRight,
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
      setSetCurrentTarget(null);
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
      setDeleteTarget(null);
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
      <div className="w-full space-y-6 text-[#0F172A] font-sans">
        {/* Header Banner - ISML LMS Learning Page Style */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
              <span>Tenant Administration</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Academic Sessions</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
              Academic Years & Sessions
            </h1>
            <p className="text-xs text-slate-600">
              Define academic calendar years, manage active configurations, and configure default
              session parameters across your coaching network.
            </p>
          </div>

          <Button
            onClick={handleCreate}
            className="w-full sm:w-auto gap-2 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold border-0 shadow-2xs shrink-0 rounded-xl px-4 py-2 text-xs"
          >
            <Plus className="h-4 w-4" /> Add Academic Year
          </Button>
        </div>

        {/* Mild KPI Cards Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-2xs flex items-center gap-2.5 sm:gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                Total Sessions
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5">
                {totalYears}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-2xs flex items-center gap-2.5 sm:gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                Active Sessions
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5">
                {activeCount}
              </p>
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 shadow-2xs flex items-center gap-2.5 sm:gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
            <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                Current Active Session
              </p>
              <p className="text-sm sm:text-base font-bold text-[#0B2447] mt-0.5 truncate">
                {currentYear ? currentYear.name : 'None Selected'}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
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
              className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full font-medium"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-row w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 hidden lg:inline">
              Filter Status:
            </span>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center',
                  statusFilter === st
                    ? 'bg-[#0052CC] text-white shadow-2xs'
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
          <div className="p-12 text-center border border-dashed rounded-2xl border-slate-200 bg-white shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052CC] mx-auto flex items-center justify-center border border-blue-200">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No academic years found</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Get started by establishing your institution's academic session calendar.
            </p>
            <Button
              onClick={handleCreate}
              className="gap-2 bg-[#0052CC] hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
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
              <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-2xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-xl text-xs font-bold text-slate-700 border-slate-200"
                >
                  Previous
                </Button>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  Page {page} of {data.meta.lastPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.meta.lastPage}
                  onClick={() => setPage(page + 1)}
                  className="rounded-xl text-xs font-bold text-slate-700 border-slate-200"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Action Dialogs */}

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
                Warning: This will un-assign any linked batches or courses associated with this
                session.
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
              Setting this year as the primary active session will automatically un-flag any
              previously selected active session across the platform.
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
