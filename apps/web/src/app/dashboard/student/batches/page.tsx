'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStudentBatches } from '@/features/student-dashboard/hooks/use-student-batches';
import type { StudentEnrollmentDto } from '@/features/student-dashboard/types/student-dashboard.types';
import { Card } from '@/components/ui/card';
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
  Video,
  Sparkles,
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
  const isBatchInactive = batch.isActive === false || batch.status === 'INACTIVE';
  const isDeactivated = isCourseDeactivated || isBatchInactive;

  const enrolledCount = (batch as any).studentCount || 0;
  const maxStudents = batch.maxStudents || 40;
  const percent = Math.min(100, Math.round((enrolledCount / maxStudents) * 100));

  return (
    <div
      className={cn(
        'w-full rounded-2xl border-[#E5E7EB] bg-white shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between p-4 sm:p-5 space-y-4',
        isDeactivated
          ? 'border-rose-200/80 bg-rose-50/20 opacity-70 saturate-50'
          : 'hover:border-violet-300',
      )}
    >
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-violet-50 text-violet-700 border border-violet-100 font-mono">
                {batch.code}
              </span>
              {isPrimary && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  PRIMARY SECTION
                </span>
              )}
            </div>
            <h3
              className={cn(
                'font-extrabold text-slate-900 text-base leading-snug truncate',
                isDeactivated && 'text-rose-900',
              )}
            >
              {batch.name}
            </h3>
            {batch.course && (
              <p className="text-xs text-slate-500 font-semibold truncate flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {batch.course.name}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StatusBadge status={batch.status} />
            <DeliveryBadge code={batch.deliveryType?.code} />
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
              <CalendarDays className="h-3.5 w-3.5 text-violet-600 shrink-0" />
              <span className="truncate font-semibold text-slate-700">
                {batch.academicYear.name}
              </span>
            </div>
          )}
        </div>

        {/* Deactivation Warning */}
        {isDeactivated && (
          <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="text-xs font-bold text-rose-800 leading-tight">
              {isCourseDeactivated ? 'Course deactivated by admin' : 'Batch is currently inactive'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function BatchesContent() {
  const { batches, isLoading, error, refetch } = useStudentBatches();

  const totalBatches = batches?.batches.length || 0;
  const activeBatches = batches?.batches.filter((b) => b.batch.status === 'ACTIVE').length || 0;

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* ── Signature Violet Gradient Hero Banner ────────────────────────────── */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-200" />
            <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
              Student Enrollments
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
            My Enrolled Batches 📚
          </h1>
          <p className="text-violet-200 text-xs mt-0.5">
            View your active course sections, assigned branch details, and enrollment status.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-xl text-center w-full sm:w-auto">
            <p className="text-[10px] font-bold text-violet-200 uppercase tracking-wider">
              Enrolled Batches
            </p>
            <p className="text-lg font-black text-white">{totalBatches} Sections</p>
          </div>
        </div>
      </div>

      {/* ── KPI Stats Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-violet-300">
          <div className="p-2.5 rounded-xl border border-violet-100 bg-violet-50 text-violet-600 shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Total Enrolled Batches
            </p>
            <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">{totalBatches}</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
          <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Active Running Sections
            </p>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
              {activeBatches}
            </p>
          </div>
        </Card>
      </div>

      {/* ── Batches List Content ─────────────────────────────────────────────── */}
      {isLoading ? (
        <BatchesSkeleton />
      ) : error ? (
        <Card className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xs">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Failed to load batches</p>
          <button
            onClick={refetch}
            className="mt-3 text-xs font-bold text-violet-600 hover:underline"
          >
            Try again
          </button>
        </Card>
      ) : !batches || batches.batches.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No active batch enrollments found</p>
          <p className="text-xs text-slate-400 mt-1">
            Please contact your administrator if your batch is missing.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
