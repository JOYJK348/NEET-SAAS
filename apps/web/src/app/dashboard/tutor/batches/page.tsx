'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorBatches } from '@/features/tutor-dashboard/hooks/use-tutor-batches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner, StatsSkeleton } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import type { BatchAssignmentDto } from '@/features/tutor-dashboard/types/batches';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    case 'INACTIVE':
      return { label: 'Inactive', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
    case 'COMPLETED':
      return { label: 'Completed', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
    case 'ARCHIVED':
      return { label: 'Archived', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-600' };
  }
}

function DeliveryTypeIcon({ code }: { code?: string | null }) {
  if (code === 'ONLINE') return <Wifi className="h-3 w-3" aria-hidden="true" />;
  if (code === 'OFFLINE') return <WifiOff className="h-3 w-3" aria-hidden="true" />;
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

  return (
    <Link
      href={isDeactivated ? '#' : `/dashboard/tutor/batches/${batch.id}`}
      className={cn('block group', isDeactivated && 'cursor-not-allowed')}
      onClick={(e) => isDeactivated && e.preventDefault()}
    >
      <Card className={cn(
        'rounded-2xl border bg-white p-5 shadow-sm transition-all duration-150',
        isDeactivated
          ? 'border-red-200 opacity-60 saturate-0'
          : 'border-[#E5E7EB] hover:-translate-y-0.5 hover:border-[#7C3AED]/50 hover:shadow-md cursor-pointer',
      )}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 p-0 pb-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2.5 rounded-xl transition-colors',
              isDeactivated ? 'bg-red-100 text-red-500' : 'bg-violet-100 text-violet-600 group-hover:bg-violet-200',
            )}>
              <Layers className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className={cn(
                  'text-base font-bold transition-colors',
                  isDeactivated ? 'text-red-800' : 'text-[#111827] group-hover:text-[#7C3AED]',
                )}>
                  {batch.name}
                </CardTitle>
                {isCourseDeactivated && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200 flex-shrink-0">
                    <AlertCircle className="w-3 h-3" />
                    Course Deactivated
                  </span>
                )}
                {!isCourseDeactivated && isBatchInactive && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200 flex-shrink-0">
                    <AlertCircle className="w-3 h-3" />
                    Batch Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{batch.code}</p>
            </div>
          </div>
          {!isDeactivated && (
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#7C3AED] transition-colors flex-shrink-0 mt-1" aria-hidden="true" />
          )}
        </CardHeader>

        <CardContent className="p-0 space-y-2.5">
          {/* Course + Subject */}
          <div className="flex items-center gap-2 flex-wrap">
            {batch.course && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                <GraduationCap className="h-3 w-3" aria-hidden="true" />
                {batch.course.name}
              </span>
            )}
            {assignment.subject && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                <BookOpen className="h-3 w-3" aria-hidden="true" />
                {assignment.subject.name}
              </span>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-500">
            {batch.branch && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{batch.branch.name}</span>
              </div>
            )}
            {batch.academicYear && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{batch.academicYear.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
              <span>{batch.studentCount} student{batch.studentCount !== 1 ? 's' : ''}</span>
            </div>
            {batch.deliveryType && (
              <div className="flex items-center gap-1.5">
                <DeliveryTypeIcon code={batch.deliveryType.code} />
                <span className="truncate">{batch.deliveryType.name}</span>
              </div>
            )}
          </div>

          {/* Deactivation Hint Message */}
          {isDeactivated && (
            <div className="mt-2 p-2 rounded bg-red-50/50 border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-[10px] font-semibold text-red-700 leading-tight">
                {isCourseDeactivated
                  ? 'This batch course is currently deactivated.'
                  : 'This batch is currently deactivated.'}
              </p>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2 pt-1">
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusBadge.className)}>
              {statusBadge.label}
            </span>
            {batch.maxStudents && (
              <span className="text-[10px] text-gray-400">
                Max {batch.maxStudents} students
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Batches List ────────────────────────────────────────────────────────────

function MyBatchesContent() {
  const { user } = useAuth();
  const { batches, isLoading, error, refetch } = useTutorBatches();

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="space-y-1">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <StatsSkeleton count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <ErrorState
          title="Failed to load batches"
          message={error.message || 'Could not load your assigned batches. Please try again.'}
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  const batchList = batches?.batches ?? [];

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">My Batches</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user?.firstName}, you are assigned to {batchList.length} batch{batchList.length !== 1 ? 'es' : ''}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {batchList.length === 0 && (
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
          <EmptyState
            icon={<Layers className="h-8 w-8 text-gray-400" />}
            title="No batches assigned"
            description="You haven't been assigned to any batches yet. Contact your administrator."
          />
        </Card>
      )}

      {/* Batch cards grid */}
      {batchList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batchList.map((assignment) => (
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

