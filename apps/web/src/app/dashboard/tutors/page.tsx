'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Users,
  BookOpen,
  MapPin,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  X,
  GraduationCap,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useTutors, useSubjects, useBranches } from '@/features/tutors/hooks/use-tutors';
import {
  useCoursesForAdmission,
  useBranchesForAdmission,
  useAcademicYearsForAdmission,
  useBatchesForAdmission,
} from '@/features/admissions/hooks/use-admissions';
import { TutorBulkImportDialog } from '@/features/tutors/components/TutorBulkImportDialog';
import { tutorService } from '@/features/tutors/services/tutor-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TutorTable } from '@/features/tutors/components/TutorTable';
import { TutorList } from '@/features/tutors/components/TutorList';
import { TutorPagination } from '@/features/tutors/components/TutorPagination';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function TutorsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Bulk Import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [lastImportLog, setLastImportLog] = useState<{
    importedCount: number;
    errors: string[];
  } | null>(null);

  // Load cascading dropdown targets
  const { years: yearOptions } = useAcademicYearsForAdmission();
  const { branches: branchOptions } = useBranchesForAdmission();
  const { courses: courseOptions } = useCoursesForAdmission();
  const { batches: batchOptions } = useBatchesForAdmission();

  const { data, isLoading, refetch } = useTutors({
    search: search || undefined,
    subjectId: subjectFilter || undefined,
    branchId: branchFilter || undefined,
    tutorStatus: statusFilter || undefined,
    page,
    limit: perPage,
  });
  const { data: subjects = [] } = useSubjects();
  const { data: branches = [] } = useBranches();
  const queryClient = useQueryClient();

  const subjectMap = useMemo(() => {
    const map = new Map<string, string>();
    (subjects ?? []).forEach((s: any) => map.set(s.id, s.name));
    return map;
  }, [subjects]);

  const branchMap = useMemo(() => {
    const map = new Map<string, string>();
    (branches ?? []).forEach((b: any) => map.set(b.id, b.name));
    return map;
  }, [branches]);

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tutorService.update(id, { status }),
    onMutate: async ({ id, status }) => {
      const key = tutorService.keys.all;
      await queryClient.cancelQueries({ queryKey: key });
      const queries = queryClient.getQueriesData({ queryKey: key });
      queryClient.setQueriesData({ queryKey: key }, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((t: any) => (t.id === id ? { ...t, status } : t)),
        };
      });
      return { previous: queries };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        for (const [qKey, qData] of context.previous) {
          queryClient.setQueryData(qKey, qData);
        }
      }
      toast({ title: 'Status update failed', variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tutorService.keys.all });
    },
  });

  const handleStatusChange = (id: string, status: string) => {
    toggleMutation.mutate({ id, status });
  };

  const handleDeleteTutor = async (tutor: any) => {
    try {
      await tutorService.remove(tutor.id);
      toast({ title: 'Faculty record deleted' });
      queryClient.invalidateQueries({ queryKey: tutorService.keys.all });
    } catch {
      toast({ title: 'Failed to delete faculty record', variant: 'destructive' });
    }
  };

  const handleExport = () => {
    toast({ title: 'Exporting Faculty Directory...', description: 'CSV file download starting' });
  };

  const tutors = data?.data ?? [];
  const meta = data?.meta;

  const hasActiveFilters =
    !!search || !!subjectFilter || !!branchFilter || (!!statusFilter && statusFilter !== 'ALL');

  const activeCount = useMemo(
    () => tutors.filter((t: any) => t.status === 'ACTIVE').length,
    [tutors],
  );
  const inactiveCount = useMemo(
    () => tutors.filter((t: any) => t.status === 'INACTIVE' || t.status === 'SUSPENDED').length,
    [tutors],
  );

  const statCards = [
    {
      label: 'Total Faculty',
      value: meta?.total ?? tutors.length,
      icon: Users,
      bg: 'bg-blue-50 text-[#0052CC] border-blue-200',
    },
    {
      label: 'Active Tutors',
      value: activeCount,
      icon: CheckCircle,
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      label: 'Inactive Tutors',
      value: inactiveCount,
      icon: X,
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    {
      label: 'Subjects Covered',
      value: subjects.length,
      icon: BookOpen,
      bg: 'bg-sky-50 text-sky-600 border-sky-200',
    },
    {
      label: 'Branches Assigned',
      value: branches.length,
      icon: MapPin,
      bg: 'bg-blue-50 text-[#0052CC] border-blue-200',
    },
    {
      label: 'Active Batches',
      value: batchOptions.length,
      icon: GraduationCap,
      bg: 'bg-amber-50 text-amber-600 border-amber-200',
    },
  ];

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 text-[#0F172A] font-sans">
        {/* Header Banner - ISML LMS Light Blue Style */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
              <span>Management Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Faculty Directory</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
              Tutor & Faculty Directory
            </h1>
            <p className="text-xs text-slate-600">
              Manage teaching faculty, subject specializations, branch assignments, and active batch
              schedules.
            </p>
          </div>

          {/* Action Buttons: 3 Equal Columns Grid on Mobile (Zero Scrollbar) */}
          <div className="grid grid-cols-3 sm:flex sm:flex-row gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="w-full sm:w-auto px-2 sm:px-3.5 gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-xl text-xs font-bold shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-[#0052CC] shrink-0" aria-hidden="true" />
              <span className="truncate">Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/tutors/import')}
              className="w-full sm:w-auto px-2 sm:px-3.5 gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-xl text-xs font-bold shadow-2xs"
            >
              <Upload className="h-3.5 w-3.5 text-[#0052CC] shrink-0" aria-hidden="true" />
              <span className="truncate">Import</span>
            </Button>
            <Button
              onClick={() => router.push('/dashboard/tutors/new')}
              className="w-full sm:w-auto px-2 sm:px-4 gap-1.5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs rounded-xl text-xs"
            >
              <Plus className="h-3.5 w-3.5 text-white shrink-0" aria-hidden="true" />
              <span className="truncate sm:hidden">Add</span>
              <span className="hidden sm:inline">Add Tutor</span>
            </Button>
          </div>
        </div>

        {/* Mild KPI Cards Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {statCards.map((stat) => {
            const IconComp = stat.icon;
            return (
              <Card
                key={stat.label}
                className="rounded-2xl border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs flex items-center gap-2.5 transition-all hover:border-[#0052CC]/40"
              >
                <div className={`p-2 rounded-xl border shrink-0 ${stat.bg}`}>
                  <IconComp className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                    {stat.label}
                  </p>
                  <p className="text-lg font-extrabold text-[#0B2447] leading-none mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Persistent Import Validation Log with Dismiss Action */}
        {lastImportLog && (
          <Card className="rounded-2xl border-blue-200 bg-blue-50/40 p-5 shadow-2xs relative space-y-4">
            <button
              onClick={() => setLastImportLog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Dismiss logs"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#0052CC]" />
              <h3 className="font-extrabold text-sm text-[#0B2447]">
                Last Bulk Import Operation Summary
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Status
                </span>
                <p className="text-sm font-extrabold text-emerald-700 flex items-center gap-1.5 mt-1">
                  <CheckCircle className="h-4 w-4" />
                  Successfully Imported: {lastImportLog.importedCount} Faculty Profile(s)
                </p>
              </div>
              <div className="space-y-1 bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Validation Errors
                </span>
                <p
                  className={`text-sm font-extrabold mt-1 ${lastImportLog.errors.length > 0 ? 'text-rose-700' : 'text-slate-700'}`}
                >
                  {lastImportLog.errors.length} row(s) failed validation
                </p>
              </div>
            </div>

            {lastImportLog.errors.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-blue-200">
                <div className="flex items-center gap-1.5 text-rose-600 font-extrabold text-xs uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4" />
                  Detailed Error Log
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 bg-rose-50/50 p-4 rounded-xl border border-rose-200">
                  {lastImportLog.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-rose-700 font-semibold flex gap-2 items-start"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Search & Filters Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center">
            {/* Search Input */}
            <div className="flex-1 min-w-0 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 shrink-0" />
              <Input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by tutor name, email, or employee code..."
                className="pl-10 pr-10 h-10 rounded-xl bg-slate-50 border-slate-200 hover:border-blue-300 focus-visible:border-[#0052CC] focus-visible:ring-2 focus-visible:ring-blue-100 text-xs sm:text-sm font-medium transition-all shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Zero-Scrollbar 3-Column Mobile Filter Grid */}
            <div className="grid grid-cols-3 sm:flex sm:flex-row items-center gap-1.5 sm:gap-2.5 w-full sm:w-auto shrink-0">
              {/* Status Filter */}
              <div className="w-full sm:w-[150px] min-w-0">
                <Select
                  value={statusFilter || 'ALL_STATUS'}
                  onValueChange={(val) => {
                    setStatusFilter(val === 'ALL_STATUS' ? '' : val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      'w-full h-9 sm:h-10 px-2 sm:px-3 rounded-xl bg-slate-50 border-slate-200 hover:border-blue-300 text-[11px] sm:text-xs font-bold transition-all shadow-2xs truncate',
                      !!statusFilter &&
                        statusFilter !== 'ALL_STATUS' &&
                        'border-[#0052CC] bg-blue-50 text-[#0052CC]',
                    )}
                  >
                    <div className="flex items-center gap-1 min-w-0 truncate">
                      <Filter className="h-3 w-3 text-slate-400 shrink-0 hidden sm:inline" />
                      <SelectValue placeholder="Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="ALL_STATUS">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Filter */}
              <div className="w-full sm:w-[160px] min-w-0">
                <Select
                  value={subjectFilter || 'ALL_SUBJECTS'}
                  onValueChange={(val) => {
                    setSubjectFilter(val === 'ALL_SUBJECTS' ? '' : val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      'w-full h-9 sm:h-10 px-2 sm:px-3 rounded-xl bg-slate-50 border-slate-200 hover:border-blue-300 text-[11px] sm:text-xs font-bold transition-all shadow-2xs truncate',
                      !!subjectFilter &&
                        subjectFilter !== 'ALL_SUBJECTS' &&
                        'border-[#0052CC] bg-blue-50 text-[#0052CC]',
                    )}
                  >
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-60 overflow-y-auto">
                    <SelectItem value="ALL_SUBJECTS">All Subjects</SelectItem>
                    {(subjects ?? []).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Branch Filter */}
              <div className="w-full sm:w-[160px] min-w-0">
                <Select
                  value={branchFilter || 'ALL_BRANCHES'}
                  onValueChange={(val) => {
                    setBranchFilter(val === 'ALL_BRANCHES' ? '' : val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      'w-full h-9 sm:h-10 px-2 sm:px-3 rounded-xl bg-slate-50 border-slate-200 hover:border-blue-300 text-[11px] sm:text-xs font-bold transition-all shadow-2xs truncate',
                      !!branchFilter &&
                        branchFilter !== 'ALL_BRANCHES' &&
                        'border-[#0052CC] bg-blue-50 text-[#0052CC]',
                    )}
                  >
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-60 overflow-y-auto">
                    <SelectItem value="ALL_BRANCHES">All Branches</SelectItem>
                    {(branches ?? []).map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setSubjectFilter('');
                    setBranchFilter('');
                    setStatusFilter('');
                    setPage(1);
                  }}
                  className="col-span-3 sm:col-span-1 h-8 sm:h-10 rounded-xl gap-1 px-2 text-[11px] sm:text-xs font-extrabold text-[#0052CC] bg-blue-50 hover:bg-blue-100 border-blue-200 shrink-0 w-full sm:w-auto mt-0.5 sm:mt-0"
                >
                  <X className="h-3 w-3 text-[#0052CC]" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>
              Showing{' '}
              <span className="font-extrabold text-[#0B2447]">
                {meta
                  ? Math.min((meta.page - 1) * meta.limit + 1, meta.total)
                  : tutors.length > 0
                    ? 1
                    : 0}
              </span>{' '}
              &ndash;{' '}
              <span className="font-extrabold text-[#0B2447]">
                {meta ? Math.min(meta.page * meta.limit, meta.total) : tutors.length}
              </span>{' '}
              of{' '}
              <span className="font-extrabold text-[#0B2447]">{meta?.total ?? tutors.length}</span>{' '}
              faculty records
            </span>
            {hasActiveFilters && (
              <span className="bg-blue-50 text-[#0052CC] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-blue-200">
                Filtered
              </span>
            )}
          </div>
        </div>

        {/* Mobile Cards View (`block sm:hidden`) */}
        <div className="block sm:hidden">
          <TutorList
            tutors={tutors}
            subjectMap={subjectMap}
            branchMap={branchMap}
            onView={(tutor) => router.push(`/dashboard/tutors/${tutor.id}`)}
            onDelete={handleDeleteTutor}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        </div>

        {/* Desktop Table View (`hidden sm:block`) */}
        <div className="hidden sm:block">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-2xs overflow-hidden">
            <TutorTable
              tutors={tutors}
              subjectMap={subjectMap}
              branchMap={branchMap}
              onView={(tutor) => router.push(`/dashboard/tutors/${tutor.id}`)}
              onDelete={handleDeleteTutor}
              onStatusChange={handleStatusChange}
              isLoading={isLoading}
            />

            {meta && meta.totalPages > 1 && (
              <TutorPagination
                currentPage={meta.page || page}
                totalPages={meta.totalPages}
                totalItems={meta.total || tutors.length}
                itemsPerPage={meta.limit || perPage}
                onPageChange={(p) => setPage(p)}
                onItemsPerPageChange={(sz) => {
                  setPerPage(sz);
                  setPage(1);
                }}
              />
            )}
          </Card>
        </div>

        {/* Empty State */}
        {tutors.length === 0 && !isLoading && (
          <Card className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-3 text-[#0052CC]">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-base font-extrabold text-[#0B2447]">
              {hasActiveFilters
                ? 'No faculty records match your filter'
                : 'No faculty members added yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-medium">
              {hasActiveFilters
                ? 'Try clearing your search query or adjusting your subject and branch filter selections.'
                : 'Get started by creating your first tutor profile to begin assigning courses and batches.'}
            </p>
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSubjectFilter('');
                  setBranchFilter('');
                  setStatusFilter('');
                }}
                className="mt-4 rounded-xl text-xs font-bold text-[#0052CC] bg-blue-50 border-blue-200 hover:bg-blue-100"
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/dashboard/tutors/new')}
                className="mt-4 rounded-xl text-xs font-extrabold bg-[#0052CC] hover:bg-blue-700 text-white shadow-2xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add First Tutor
              </Button>
            )}
          </Card>
        )}
      </div>

      <TutorBulkImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={refetch}
        onImportComplete={(res) => setLastImportLog(res)}
        academicYears={yearOptions}
        branches={branchOptions}
        courses={courseOptions}
        batches={batchOptions}
        subjects={subjects as any}
      />
    </DashboardLayout>
  );
}
