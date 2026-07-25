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
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0', statusBadge.className)}>
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
          message={error.message || 'Could not load student data. You may not have access to this batch.'}
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
      {/* Back button + Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
        <div>
          <Link
            href="/dashboard/tutor/batches"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-[#7C3AED] transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Back to My Batches
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{batch.name}</h1>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusBadge.className)}>
              {statusBadge.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 font-mono">{batch.code}</p>
        </div>
      </div>

      {/* Batch Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-sm">
          <CardHeader className="space-y-0 p-0 pb-1">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Course
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-1">
            <div className="flex items-center gap-1.5 text-sm font-bold text-[#111827]">
              <GraduationCap className="h-3.5 w-3.5 text-gray-400" />
              {batch.course?.name || '—'}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-sm">
          <CardHeader className="space-y-0 p-0 pb-1">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Branch
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-1">
            <div className="flex items-center gap-1.5 text-sm font-bold text-[#111827]">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              {batch.branch?.name || '—'}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-sm">
          <CardHeader className="space-y-0 p-0 pb-1">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Delivery Type
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-1">
            <div className="flex items-center gap-1.5 text-sm font-bold text-[#111827]">
              {batch.deliveryType && <DeliveryTypeIcon code={batch.deliveryType.code} />}
              {batch.deliveryType?.name || '—'}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-sm">
          <CardHeader className="space-y-0 p-0 pb-1">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Academic Year
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-1">
            <div className="flex items-center gap-1.5 text-sm font-bold text-[#111827]">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {batch.academicYear?.name || '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Section */}
      <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Enrolled Students
            </CardTitle>
            <span className="text-xs text-muted-foreground">({totalEnrolled})</span>
          </div>
        </CardHeader>

        <CardContent className="p-0 space-y-2">
          {students.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8 text-gray-400" />}
              title="No students enrolled"
              description="This batch doesn't have any active students yet."
            />
          ) : (
            students.map((s) => (
              <StudentRow key={s.enrollmentId} student={s} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Batch Period & Info */}
      {(batch.startDate || batch.endDate || batch.maxStudents) && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground bg-white border border-[#E5E7EB] rounded-2xl px-5 py-3 shadow-sm flex-wrap">
          {batch.startDate && (
            <span><strong>From:</strong> {formatDate(batch.startDate)}</span>
          )}
          {batch.endDate && (
            <span><strong>To:</strong> {formatDate(batch.endDate)}</span>
          )}
          {batch.maxStudents && (
            <span><strong>Capacity:</strong> {batch.maxStudents} students</span>
          )}
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" aria-hidden="true" />
            <strong>Enrolled:</strong> {totalEnrolled} student{totalEnrolled !== 1 ? 's' : ''}
          </span>
        </div>
      )}
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

