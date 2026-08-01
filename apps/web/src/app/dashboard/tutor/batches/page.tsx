'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorBatches } from '@/features/tutor-dashboard/hooks/use-tutor-batches';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { StatsSkeleton } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import {
  Layers,
  BookOpen,
  MapPin,
  Users,
  Calendar,
  ChevronRight,
  GraduationCap,
  Wifi,
  WifiOff,
  AlertCircle,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import type { BatchAssignmentDto } from '@/features/tutor-dashboard/types/batches';

// ─── Subject Color Mapping ──────────────────────────────────────────────────

function getSubjectBadgeStyle(subjectName?: string) {
  const name = (subjectName || '').toLowerCase();
  if (name.includes('physics')) {
    return 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100/80';
  }
  if (name.includes('chem')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/80';
  }
  if (name.includes('bio') || name.includes('botany') || name.includes('zoology')) {
    return 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100/80';
  }
  return 'bg-violet-50 text-violet-700 border-violet-200/80 hover:bg-violet-100/80';
}

function getStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Active',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      };
    case 'INACTIVE':
      return {
        label: 'Inactive',
        className: 'bg-rose-50 text-rose-700 border-rose-200/80',
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        className: 'bg-sky-50 text-sky-700 border-sky-200/80',
      };
    case 'ARCHIVED':
      return {
        label: 'Archived',
        className: 'bg-amber-50 text-amber-700 border-amber-200/80',
      };
    default:
      return { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
}

function DeliveryTypeIcon({ code }: { code?: string | null }) {
  if (code === 'ONLINE') return <Wifi className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />;
  if (code === 'OFFLINE')
    return <WifiOff className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />;
  return null;
}

// ─── Batch Card ──────────────────────────────────────────────────────────────

function BatchCard({ assignment }: { assignment: BatchAssignmentDto }) {
  const batch = assignment.batch;
  if (!batch) return null;

  const isCourseDeactivated = batch.course && batch.course.isActive === false;
  const isBatchInactive = batch.isActive === false || batch.status === 'INACTIVE';
  const isDeactivated = isCourseDeactivated || isBatchInactive;
  const statusBadge = getStatusBadge(batch.status);
  const subjectStyle = getSubjectBadgeStyle(assignment.subject?.name);

  const enrolledCount = batch.studentCount || 0;
  const maxStudents = batch.maxStudents || 40;
  const percent = Math.min(100, Math.round((enrolledCount / maxStudents) * 100));

  return (
    <Card
      className={cn(
        'w-full rounded-2xl border-[#E5E7EB] bg-white shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between',
        isDeactivated
          ? 'border-rose-200/80 bg-rose-50/20 opacity-70 saturate-50'
          : 'hover:border-violet-300',
      )}
    >
      <CardContent className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
        {/* Top Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-violet-50 text-violet-700 border border-violet-100 font-mono">
                  {batch.code}
                </span>
                {assignment.subject && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border',
                      subjectStyle,
                    )}
                  >
                    <BookOpen className="h-3 w-3" />
                    {assignment.subject.name}
                  </span>
                )}
              </div>
              <Link
                href={isDeactivated ? '#' : `/dashboard/tutor/batches/${batch.id}`}
                className={cn(
                  'block font-extrabold text-slate-900 text-base leading-snug truncate transition-colors',
                  isDeactivated ? 'text-rose-900' : 'hover:text-violet-600',
                )}
                onClick={(e) => isDeactivated && e.preventDefault()}
              >
                {batch.name}
              </Link>
              {batch.course && (
                <p className="text-xs text-slate-500 font-semibold truncate flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  {batch.course.name}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span
                className={cn(
                  'text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs',
                  statusBadge.className,
                )}
              >
                {statusBadge.label}
              </span>
              {batch.deliveryType && (
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 text-[10px] font-semibold text-slate-600">
                  <DeliveryTypeIcon code={batch.deliveryType.code} />
                  <span>{batch.deliveryType.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {batch.branch && (
              <div className="flex items-center gap-1.5 p-2 bg-slate-50/80 rounded-xl border border-slate-100">
                <MapPin className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                <span className="truncate font-semibold text-slate-700">{batch.branch.name}</span>
              </div>
            )}
            {batch.academicYear && (
              <div className="flex items-center gap-1.5 p-2 bg-slate-50/80 rounded-xl border border-slate-100">
                <Calendar className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                <span className="truncate font-semibold text-slate-700">
                  {batch.academicYear.name}
                </span>
              </div>
            )}
          </div>

          {/* Capacity Progress Bar (Tenant Admin Style) */}
          <div className="space-y-1.5 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span>Enrolled Students</span>
              </div>
              <span className="font-extrabold text-slate-900">
                {enrolledCount} / {maxStudents} ({percent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  percent >= 90 ? 'bg-rose-500' : percent >= 70 ? 'bg-amber-500' : 'bg-violet-600',
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Deactivation Warning */}
          {isDeactivated && (
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <p className="text-xs font-bold text-rose-800 leading-tight">
                {isCourseDeactivated
                  ? 'Course deactivated by admin'
                  : 'Batch is currently inactive'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Action Button */}
        <div className="pt-3 border-t border-slate-100 mt-3">
          <Link
            href={isDeactivated ? '#' : `/dashboard/tutor/batches/${batch.id}`}
            className={cn(
              'flex items-center justify-center gap-1.5 w-full h-9 rounded-xl text-xs font-bold transition-all shadow-2xs',
              isDeactivated
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20',
            )}
            onClick={(e) => isDeactivated && e.preventDefault()}
          >
            <span>View Batch Portal</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Batches Main Content ───────────────────────────────────────────────────

function MyBatchesContent() {
  const { user } = useAuth();
  const { batches, isLoading, error, refetch } = useTutorBatches();

  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const batchList = useMemo(() => batches?.batches ?? [], [batches]);

  // Extract unique subjects
  const availableSubjects = useMemo(() => {
    const subs = new Set<string>();
    batchList.forEach((b) => {
      if (b.subject?.name) subs.add(b.subject.name);
    });
    return Array.from(subs);
  }, [batchList]);

  // Filtered list
  const filteredBatches = useMemo(() => {
    return batchList.filter((assignment) => {
      const b = assignment.batch;
      if (!b) return false;

      const matchesSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.course?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSubject = subjectFilter === 'ALL' || assignment.subject?.name === subjectFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && b.status === 'ACTIVE' && b.isActive !== false) ||
        (statusFilter === 'INACTIVE' && (b.status === 'INACTIVE' || b.isActive === false));

      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [batchList, searchTerm, subjectFilter, statusFilter]);

  const activeCount = useMemo(
    () =>
      batchList.filter((b) => b.batch?.status === 'ACTIVE' && b.batch?.isActive !== false).length,
    [batchList],
  );

  const totalStudents = useMemo(
    () => batchList.reduce((acc, curr) => acc + (curr.batch?.studentCount || 0), 0),
    [batchList],
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 lg:p-8 bg-slate-50/50 min-h-screen">
        <div className="h-28 rounded-3xl bg-slate-200 animate-pulse" />
        <StatsSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8 bg-slate-50/50 min-h-screen">
        <ErrorState
          title="Failed to load batches"
          message={error.message || 'Could not load your assigned batches. Please try again.'}
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Welcome Header Banner - Signature Violet Gradient (Tenant Admin Match) */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-200" />
            <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
              Tutor Batch Roster & Allocations
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
            Assigned Batches & Classes 📚
          </h1>
          <p className="text-violet-200 text-xs mt-0.5">
            Welcome back, <span className="font-bold text-white">{user?.firstName}</span>! Manage
            your assigned student batches, section schedules, and subject progress.
          </p>
        </div>
      </div>

      {/* KPI Cards (Tenant Admin Exact Layout) */}
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
              {batchList.length}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
          <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Active Batches
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">{activeCount}</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
          <div className="p-2.5 rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Total Students
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">{totalStudents}</p>
          </div>
        </Card>
      </div>

      {/* ── Search & Filter Bar (Tenant Admin Style) ────────────────────────── */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search batch name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {availableSubjects.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSubjectFilter('ALL')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                  subjectFilter === 'ALL'
                    ? 'bg-white text-violet-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900',
                )}
              >
                All Subjects
              </button>
              {availableSubjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubjectFilter(sub)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                    subjectFilter === sub
                      ? 'bg-white text-violet-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900',
                  )}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900',
              )}
            >
              All Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900',
              )}
            >
              Active Only
            </button>
          </div>
        </div>
      </div>

      {/* ── Empty State ──────────────────────────────────────────────────────── */}
      {filteredBatches.length === 0 && (
        <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-white p-12 text-center shadow-xs">
          <EmptyState
            icon={<Layers className="h-10 w-10 text-slate-300" />}
            title="No matching batches found"
            description={
              batchList.length === 0
                ? "You haven't been assigned to any batches yet. Contact your tenant administrator."
                : 'Try adjusting your search query or filter selection.'
            }
          />
        </Card>
      )}

      {/* ── Batch Cards Grid ─────────────────────────────────────────────────── */}
      {filteredBatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((assignment) => (
            <BatchCard key={assignment.assignmentId} assignment={assignment} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page Export ────────────────────────────────────────────────────────────

export default function MyBatchesPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <DashboardLayout>
        <MyBatchesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
