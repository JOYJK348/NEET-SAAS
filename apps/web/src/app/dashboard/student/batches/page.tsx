'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStudentBatches } from '@/features/student-dashboard/hooks/use-student-batches';
import type { StudentEnrollmentDto } from '@/features/student-dashboard/types/student-dashboard.types';
import {
  AlertCircle,
  BookOpen,
  Building2,
  CalendarDays,
  GraduationCap,
  Layers,
  MapPin,
  Radio,
  Star,
  Users,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function BatchesSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-52 bg-slate-100 rounded-2xl" />
      ))}
    </div>
  );
}

// ─── Delivery Mode Badge ──────────────────────────────────────────────────────
function DeliveryBadge({ code }: { code?: string }) {
  if (!code) return null;
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    ONLINE: {
      label: 'Online',
      cls: 'bg-sky-100 text-sky-700',
      icon: <Video className="w-3 h-3" />,
    },
    OFFLINE: {
      label: 'Classroom',
      cls: 'bg-amber-100 text-amber-700',
      icon: <MapPin className="w-3 h-3" />,
    },
    HYBRID: {
      label: 'Hybrid',
      cls: 'bg-violet-100 text-violet-700',
      icon: <Radio className="w-3 h-3" />,
    },
    CLASSROOM: {
      label: 'Classroom',
      cls: 'bg-amber-100 text-amber-700',
      icon: <MapPin className="w-3 h-3" />,
    },
  };
  const cfg = map[code.toUpperCase()] ?? {
    label: code,
    cls: 'bg-slate-100 text-slate-600',
    icon: null,
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full',
        cfg.cls,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  return (
    <span
      className={cn(
        'text-[10px] font-bold px-2.5 py-1 rounded-full',
        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
      )}
    >
      {isActive ? '● Active' : status}
    </span>
  );
}

// ─── Batch Card ───────────────────────────────────────────────────────────────
function BatchCard({ enrollment }: { enrollment: StudentEnrollmentDto }) {
  const { batch, isPrimary } = enrollment;

  const isCourseDeactivated = batch.course?.isActive === false;
  const isBatchInactive = batch.isActive === false;
  const isDeactivated = isCourseDeactivated || isBatchInactive;

  const formatDate = (d?: string | null) =>
    d
      ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-150',
        isDeactivated
          ? 'border-red-200 opacity-60 saturate-0'
          : 'border-slate-100 hover:-translate-y-0.5',
      )}
    >
      {/* Card header */}
      <div
        className={cn(
          'px-5 py-4 border-b',
          isDeactivated
            ? 'bg-red-50 border-red-100'
            : 'bg-gradient-to-r from-violet-50 to-indigo-50 border-slate-100',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {isPrimary && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  Primary
                </span>
              )}
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
              {!isDeactivated && <StatusBadge status={batch.status} />}
              <DeliveryBadge code={batch.deliveryType?.code} />
            </div>
            <h3
              className={cn(
                'text-base font-black leading-tight',
                isDeactivated ? 'text-red-800' : 'text-slate-900',
              )}
            >
              {batch.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{batch.code}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5 text-violet-500" />
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Course */}
        <div className="flex items-start gap-2">
          <BookOpen className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Course
            </p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{batch.course?.name ?? '—'}</p>
          </div>
        </div>

        {/* Branch */}
        <div className="flex items-start gap-2">
          <Building2 className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Branch
            </p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{batch.branch?.name ?? '—'}</p>
          </div>
        </div>

        {/* Academic Year */}
        <div className="flex items-start gap-2">
          <GraduationCap className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Year
            </p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              {batch.academicYear?.name ?? '—'}
            </p>
          </div>
        </div>

        {/* Students */}
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Students
            </p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">
              {batch.totalEnrolled}
              {batch.maxStudents ? ` / ${batch.maxStudents}` : ''}
            </p>
          </div>
        </div>

        {/* Start Date */}
        <div className="flex items-start gap-2">
          <CalendarDays className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Starts
            </p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{formatDate(batch.startDate)}</p>
          </div>
        </div>

        {/* End Date */}
        <div className="flex items-start gap-2">
          <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Ends
            </p>
            <p className="text-xs font-bold text-slate-800 mt-0.5">{formatDate(batch.endDate)}</p>
          </div>
        </div>
      </div>

      {/* Deactivation hint */}
      {isDeactivated && (
        <div className="mx-5 mb-3 p-2 rounded bg-red-50/50 border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-[10px] font-semibold text-red-700 leading-tight">
            {isCourseDeactivated
              ? 'This batch course is currently deactivated.'
              : 'This batch is currently deactivated.'}
          </p>
        </div>
      )}

      {batch.description && (
        <div className="px-5 pb-4">
          <p className="text-xs text-slate-500 line-clamp-2">{batch.description}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function BatchesContent() {
  const { batches, isLoading, error, refetch } = useStudentBatches();

  return (
    <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Layers className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-base font-black text-slate-900">My Batches</h1>
          <p className="text-xs text-slate-400">Your active enrollments</p>
        </div>
        {batches && (
          <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            {batches.batches.length} batch{batches.batches.length !== 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <BatchesSkeleton />
      ) : error ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Failed to load batches</p>
          <button
            onClick={refetch}
            className="mt-3 text-xs font-bold text-violet-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : !batches || batches.batches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No active batches</p>
          <p className="text-xs text-slate-400 mt-1">Contact your admin if this seems wrong</p>
        </div>
      ) : (
        <div className="space-y-4">
          {batches.batches.map((enrollment) => (
            <BatchCard key={enrollment.enrollmentId} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function StudentBatchesPage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <BatchesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
