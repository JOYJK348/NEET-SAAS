'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useBatchStudents } from '@/features/tutor-dashboard/hooks/use-tutor-batches';
import type { BatchStudentDto } from '@/features/tutor-dashboard/types/batches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Users,
  GraduationCap,
  MapPin,
  Calendar,
  Wifi,
  WifiOff,
  Mail,
  CheckCircle2,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Active',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      };
    case 'INACTIVE':
      return {
        label: 'Inactive',
        className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      };
    case 'COMPLETED':
      return {
        label: 'Completed',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      };
    case 'ARCHIVED':
      return {
        label: 'Archived',
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-600' };
  }
}

function DeliveryTypeIcon({ code }: { code?: string | null }) {
  if (code === 'ONLINE') return <Wifi className="h-4 w-4" aria-hidden="true" />;
  if (code === 'OFFLINE') return <WifiOff className="h-4 w-4" aria-hidden="true" />;
  return null;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Student Row ─────────────────────────────────────────────────────────────

function StudentRow({ student }: { student: BatchStudentDto }) {
  const initials = student.student
    ? `${student.student.firstName.charAt(0)}${student.student.lastName.charAt(0)}`
    : '??';
  const fullName = student.student
    ? `${student.student.firstName} ${student.student.lastName}`
    : 'Unknown Student';

  const statusBadge = student.admission?.admissionStatus
    ? getStatusBadge(student.admission.admissionStatus)
    : null;

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] hover:border-[#7C3AED]/20 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-8 w-8 flex-shrink-0 border border-[#E5E7EB]">
          <AvatarFallback className="bg-[#7C3AED]/10 text-[#7C3AED] text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-[#111827] truncate">{fullName}</h4>
            {statusBadge && (
              <span
                className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0',
                  statusBadge.className,
                )}
              >
                {statusBadge.label}
              </span>
            )}
            {student.isPrimary && (
              <span className="text-[9px] font-bold text-[#7C3AED] bg-[#7C3AED]/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                PRIMARY
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            {student.admission && (
              <span className="font-mono text-[10px]">{student.admission.admissionNumber}</span>
            )}
            {student.student?.email && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="h-2.5 w-2.5 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{student.student.email}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Enrollment date */}
      <div className="flex-shrink-0 ml-3 text-right">
        <p className="text-[10px] text-muted-foreground">Joined</p>
        <p className="text-[10px] font-semibold text-[#111827]">
          {new Date(student.joinedAt).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
          })}
        </p>
      </div>
    </div>
  );
}

// ─── Batch Detail Content ────────────────────────────────────────────────────

function BatchDetailContent() {
  const params = useParams();
  const batchId = params?.batchId as string;
  const { user } = useAuth();
  const { batchStudents, isLoading, error, refetch } = useBatchStudents(batchId);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse" />
          <div className="space-y-1">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <ErrorState
          title="Failed to load batch details"
          message={
            error.message || 'Could not load student data. You may not have access to this batch.'
          }
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  if (!batchStudents) {
    return (
      <div className="p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <EmptyState
          title="Batch not found"
          description="This batch could not be found or you don't have access."
        />
      </div>
    );
  }

  const batch = batchStudents.batch;
  const students = batchStudents.students;
  const statusBadge = getStatusBadge(batch.status);
  const totalEnrolled = batch.studentCount || students.length;

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* ── Header Banner - Signature Violet Gradient (Tenant Admin Match) ───── */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/tutor/batches"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-bold transition-all shadow-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4 text-violet-200" />
            <span>← Back to My Batches</span>
          </Link>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="bg-white/15 px-2.5 py-0.5 rounded-lg border border-white/20 font-mono text-xs font-bold text-white">
              {batch.code}
            </span>
            <span
              className={cn(
                'text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs',
                statusBadge.className,
              )}
            >
              {statusBadge.label}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black leading-tight text-white mt-1">
            {batch.name}
          </h1>
          <p className="text-violet-200 text-xs mt-0.5 flex items-center gap-2 flex-wrap">
            <span>
              Course: <strong className="text-white">{batch.course?.name || 'N/A'}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Branch: <strong className="text-white">{batch.branch?.name || 'N/A'}</strong>
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-xl text-center w-full sm:w-auto">
            <p className="text-[10px] font-bold text-violet-200 uppercase tracking-wider">
              Enrolled Students
            </p>
            <p className="text-lg font-black text-white">{totalEnrolled} Students</p>
          </div>
        </div>
      </div>

      {/* ── KPI Highlight Cards Grid (Tenant Admin Match) ────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-violet-300">
          <div className="p-2.5 rounded-xl border border-violet-100 bg-violet-50 text-violet-600 shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Course
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-[#111827] mt-0.5 truncate">
              {batch.course?.name || '—'}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-blue-300">
          <div className="p-2.5 rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Branch
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-[#111827] mt-0.5 truncate">
              {batch.branch?.name || '—'}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
          <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shrink-0">
            {batch.deliveryType && <DeliveryTypeIcon code={batch.deliveryType.code} />}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Delivery Type
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-[#111827] mt-0.5 truncate">
              {batch.deliveryType?.name || '—'}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-amber-300">
          <div className="p-2.5 rounded-xl border border-amber-100 bg-amber-50 text-amber-600 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
              Academic Year
            </p>
            <p className="text-xs sm:text-sm font-extrabold text-[#111827] mt-0.5 truncate">
              {batch.academicYear?.name || '—'}
            </p>
          </div>
        </Card>
      </div>

      {/* ── Enrolled Students Roster Section ─────────────────────────────────── */}
      <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-50 border border-violet-100 text-violet-600">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Enrolled Students Roster</h3>
              <p className="text-xs text-slate-400">
                Total active students linked to this batch ({totalEnrolled})
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          {students.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8 text-gray-400" />}
              title="No students enrolled"
              description="This batch doesn't have any active students yet."
            />
          ) : (
            students.map((s) => <StudentRow key={s.enrollmentId} student={s} />)
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Page Export ────────────────────────────────────────────────────────────

export default function BatchStudentsPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <DashboardLayout>
        <BatchDetailContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
