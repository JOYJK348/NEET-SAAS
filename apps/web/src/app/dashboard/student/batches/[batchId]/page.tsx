'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStudentBatches } from '@/features/student-dashboard/hooks/use-student-batches';
import { useStudentAttendance } from '@/features/student-dashboard/hooks/use-student-attendance';
import { useStudentTimetable } from '@/features/student-dashboard/hooks/use-student-timetable';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  FlaskConical,
  GraduationCap,
  Layers,
  MapPin,
  Star,
  Users,
  Video,
  WifiOff,
  XCircle,
  ClipboardList,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import { getClassStatus } from '@/lib/class-status';

export function BatchDetailView({ batchId }: { batchId: string }) {
  const { batches, isLoading: isBatchesLoading } = useStudentBatches();
  const { attendance, isLoading: isAttendanceLoading } = useStudentAttendance();

  // Date range for timetable
  const today = new Date();
  const dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const dateTo = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];

  const { timetable, isLoading: isTimetableLoading } = useStudentTimetable(dateFrom, dateTo);

  const enrollment = batches?.batches.find((b) => b.batch.id === batchId);
  const batch = enrollment?.batch;

  if (isBatchesLoading || isAttendanceLoading || isTimetableLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
        <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/dashboard/student/batches"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-100 shadow-2xs transition"
          >
            <ArrowLeft className="w-4 h-4 text-violet-600" />
            <span>Back to Batches</span>
          </Link>
        </div>
        <Card className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Batch Details Not Found</p>
          <p className="text-xs text-slate-400 mt-1">
            The batch you requested could not be found or you are not enrolled in it.
          </p>
        </Card>
      </div>
    );
  }

  // Filter attendance records for this batch
  const batchAttendanceRecords = (attendance?.records || []).filter(
    (r) => r.batch?.id === batch.id || r.batch?.name === batch.name,
  );

  const totalSessions = batchAttendanceRecords.length;
  const presentCount = batchAttendanceRecords.filter((r) => r.status === 'PRESENT').length;
  const absentCount = batchAttendanceRecords.filter((r) => r.status === 'ABSENT').length;
  const lateCount = batchAttendanceRecords.filter(
    (r) => r.status === 'LATE' || r.lateMinutes > 0,
  ).length;
  const attendanceRate =
    totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : null;

  // Filter timetable sessions for this batch
  const batchSessions = (timetable?.timetable || [])
    .flatMap((d) => (d.sessions || []).map((s) => ({ ...s, date: d.date })))
    .filter((s) => s.batch?.id === batch.id || s.batch?.name === batch.name);

  const pastSessionsCount = batchSessions.filter((s) => {
    const endDateTime = s.date ? new Date(`${s.date}T${s.endsAt || '23:59'}`) : new Date(0);
    return endDateTime < new Date() && s.sessionStatus !== 'CANCELLED';
  }).length;
  const pendingAttendanceCount = Math.max(0, pastSessionsCount - totalSessions);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <Link
          href="/dashboard/student/batches"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:text-slate-900 hover:bg-slate-100 shadow-2xs transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-violet-600" />
          <span>Back to Batches</span>
        </Link>

        <div className="text-left sm:text-center flex-1 space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            {batch.name}
          </h1>
          <p className="text-xs font-bold text-slate-500">
            Batch Code: <span className="font-mono text-slate-700">{batch.code}</span> • Detailed
            Student Workspace
          </p>
        </div>

        <div className="hidden sm:block w-36 shrink-0" />
      </div>

      {/* ── Batch Meta Details Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Branch Info Card */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-100 border border-violet-200 text-violet-600 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Branch
            </p>
            <p className="text-sm font-black text-slate-900 mt-0.5 truncate">
              {batch.branch?.name || 'Head Office'}
            </p>
          </div>
        </Card>

        {/* Academic Year Info Card */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Academic Year
            </p>
            <p className="text-sm font-black text-slate-900 mt-0.5 truncate">
              {batch.academicYear?.name || '2026-2027'}
            </p>
          </div>
        </Card>

        {/* Course Info Card */}
        <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Assigned Course
            </p>
            <p className="text-sm font-black text-slate-900 mt-0.5 truncate">
              {batch.course?.name || 'NEET Standard Prep'}
            </p>
          </div>
        </Card>
      </div>

      {/* ── Attendance Overview & Breakdown ────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="w-4.5 h-4.5 text-violet-600" />
            Batch Attendance History
          </h2>
          <span
            className={cn(
              'text-xs font-black px-3 py-1 rounded-full border',
              attendanceRate != null && attendanceRate < 75
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200',
            )}
          >
            {attendanceRate != null ? `${attendanceRate}% Attendance Rate` : 'No Records Yet'}
          </span>
        </div>

        {/* Stat Summary Grid (5 Cards: Total, Present, Absent, Late, Pending Tutor Mark) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-lg font-black text-slate-900">{totalSessions}</p>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
              Total Sessions
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
            <p className="text-lg font-black text-emerald-700">{presentCount}</p>
            <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider mt-0.5">
              Present
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 text-center">
            <p className="text-lg font-black text-rose-700">{absentCount}</p>
            <p className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider mt-0.5">
              Absent
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 text-center">
            <p className="text-lg font-black text-amber-700">{lateCount}</p>
            <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider mt-0.5">
              Late
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-center col-span-2 sm:col-span-1">
            <p className="text-lg font-black text-purple-700">{pendingAttendanceCount}</p>
            <p className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider mt-0.5">
              Pending Mark ⏳
            </p>
          </div>
        </div>

        {/* Attendance Records List */}
        {batchAttendanceRecords.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
            <p className="text-xs font-bold text-slate-500">
              No attendance marked for this batch yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Session Log History
            </p>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-white">
              {batchAttendanceRecords.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-extrabold text-slate-900">
                      {r.subject?.name || 'Class Session'}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                      {r.date
                        ? new Date(r.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          })
                        : 'N/A'}{' '}
                      • {r.startsAt || '08:00 AM'}
                    </p>
                  </div>

                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-xl text-[10px] font-black',
                      r.status === 'PRESENT' &&
                        'bg-emerald-50 text-emerald-700 border border-emerald-200',
                      r.status === 'ABSENT' && 'bg-rose-50 text-rose-700 border border-rose-200',
                      (r.status === 'LATE' || r.lateMinutes > 0) &&
                        'bg-amber-50 text-amber-700 border border-amber-200',
                    )}
                  >
                    {r.status} {r.lateMinutes > 0 ? `(${r.lateMinutes}m)` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Scheduled Classes List ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-sky-600" />
            Batch Scheduled Sessions ({batchSessions.length})
          </h2>
        </div>

        {batchSessions.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
            <p className="text-xs font-bold text-slate-500">
              No scheduled sessions found for this batch.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {batchSessions.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 text-violet-700 flex items-center justify-center font-black text-sm shrink-0">
                    {(s.subject?.name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-slate-900 text-sm">
                        {s.subject?.name || 'Class Session'}
                      </h4>
                      {s.date && (
                        <span className="text-[10px] text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md font-extrabold">
                          📅{' '}
                          {new Date(s.date + 'T00:00:00').toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-500 font-mono mt-0.5">
                      {s.startsAt} – {s.endsAt} • 👤 Tutor:{' '}
                      <span className="text-slate-900 font-extrabold">
                        {s.tutorName || 'Bharathi M'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {(() => {
                    const statusInfo = getClassStatus(s);
                    const effectiveStatus = statusInfo.statusBadgeText;

                    return (
                      <div className="flex items-center gap-2">
                        {(s.deliveryMode === 'ONLINE' ||
                          s.deliveryMode === 'HYBRID' ||
                          (s as any).meetingLink ||
                          statusInfo.isLive) &&
                          !statusInfo.isCancelled && (
                            <button
                              onClick={() => {
                                if (!statusInfo.canJoin) return;
                                const targetUrl = `/dashboard/student/live/${s.id || 'demo-class-1'}`;
                                if (typeof window !== 'undefined') window.location.href = targetUrl;
                              }}
                              disabled={!statusInfo.canJoin}
                              className={cn(
                                'px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition',
                                statusInfo.canJoin
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white cursor-pointer'
                                  : 'bg-slate-100 border border-slate-200 text-slate-400 opacity-70 cursor-not-allowed',
                              )}
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>{statusInfo.buttonLabel}</span>
                            </button>
                          )}
                        <span
                          className={cn(
                            'text-[10px] font-black px-2.5 py-1 rounded-xl border',
                            statusInfo.isLive &&
                              'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse',
                            (effectiveStatus === 'COMPLETED' || effectiveStatus === 'ENDED') &&
                              'bg-emerald-50 text-emerald-700 border-emerald-200',
                            effectiveStatus === 'CANCELLED' &&
                              'bg-rose-50 text-rose-700 border-rose-200',
                            effectiveStatus === 'SCHEDULED' &&
                              'bg-violet-50 text-violet-700 border-violet-200',
                          )}
                        >
                          {effectiveStatus}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentBatchDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }> | { batchId: string };
}) {
  const resolvedParams =
    typeof (params as any).then === 'function'
      ? (use(params as Promise<{ batchId: string }>) as { batchId: string })
      : (params as { batchId: string });

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <BatchDetailView batchId={resolvedParams.batchId} />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
