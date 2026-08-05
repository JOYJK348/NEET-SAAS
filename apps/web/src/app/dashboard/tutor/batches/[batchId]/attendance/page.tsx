'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useBatchStudents } from '@/features/tutor-dashboard/hooks/use-tutor-batches';
import { useTutorTimetable } from '@/features/tutor-dashboard/hooks/use-tutor-timetable';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { StatsSkeleton } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  X,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';

interface BatchSessionItem {
  id: string;
  date: string;
  startsAt: string;
  endsAt: string;
  subjectName: string;
  roomName: string;
  sessionStatus: string;
  attendanceMarked: boolean;
  presentCount?: number;
  totalCount?: number;
}

function AttendanceLogContent() {
  const params = useParams();
  const batchId = params?.batchId as string;
  const router = useRouter();

  // Query timetable for current year range (or 3 months window) to fetch real sessions
  const dateFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 60); // past 60 days
    return d.toISOString().slice(0, 10);
  }, []);

  const dateTo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // future 30 days
    return d.toISOString().slice(0, 10);
  }, []);

  const { batchStudents, isLoading: isBatchLoading, error: batchError } = useBatchStudents(batchId);
  const { timetable, isLoading: isTimetableLoading } = useTutorTimetable(dateFrom, dateTo);

  const batch = batchStudents?.batch;
  const batchCode = batch?.code || '';
  const batchName = batch?.name || 'Assigned Batch';

  // Extract REAL completed/conducted sessions for this batch directly from API
  const batchSessions = useMemo<BatchSessionItem[]>(() => {
    const list: BatchSessionItem[] = [];

    if (timetable?.timetable) {
      timetable.timetable.forEach((day) => {
        day.sessions.forEach((s) => {
          if (s.batch?.id === batchId || (batchCode && s.batch?.code === batchCode)) {
            const isCompleted = s.sessionStatus === 'COMPLETED' || s.sessionStatus === 'PUBLISHED';
            list.push({
              id: s.id,
              date: day.date,
              startsAt: s.startsAt,
              endsAt: s.endsAt,
              subjectName: s.subject?.name || 'Class Session',
              roomName: s.room?.name || s.branch?.name || 'Classroom',
              sessionStatus: s.sessionStatus || 'SCHEDULED',
              attendanceMarked: isCompleted,
            });
          }
        });
      });
    }

    return list;
  }, [timetable, batchId, batchCode]);

  if (isBatchLoading || isTimetableLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen">
        <div className="h-12 w-48 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-28 bg-slate-200 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-200 rounded-3xl animate-pulse" />
          <div className="h-48 bg-slate-200 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (batchError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen">
        <ErrorState
          title="Failed to load batch"
          message={batchError.message || 'Could not load batch data.'}
          variant="page"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
      {/* ── Top Header Navigation Bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-4 text-white shadow-md">
        <Link
          href={`/dashboard/tutor/batches/${batchId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all"
        >
          <X className="w-4 h-4" />
          <span>Close</span>
        </Link>

        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-violet-200" />
          <h1 className="text-lg font-black tracking-tight text-white uppercase">
            ATTENDANCE LOG
          </h1>
        </div>

        <div className="w-16" />
      </div>

      {/* ── Batch Sub-header Section ────────────────────────────────────────── */}
      <div className="text-center space-y-1 my-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {batchName}
        </h2>
        {batchCode && (
          <p className="text-xs font-bold text-slate-500 font-mono">
            Batch: <span className="text-violet-600">{batchCode}</span>
          </p>
        )}
      </div>

      {/* ── Instruction Pill Banner (Matches User Screenshot) ─────────────── */}
      <div className="p-3.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 text-center max-w-2xl mx-auto shadow-2xs">
        <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          SELECT A CONDUCTED CLASS TO VIEW OR EDIT ({batchSessions.length} Total Classes)
        </p>
      </div>

      {/* ── Conducted Classes Grid ─────────────────────────────────────────── */}
      {batchSessions.length === 0 ? (
        <Card className="rounded-3xl border-dashed border-2 border-slate-200 bg-white p-12 text-center shadow-xs max-w-xl mx-auto mt-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-4 rounded-full bg-violet-50 text-violet-600">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              No Conducted Classes Found
            </h3>
            <p className="text-xs font-medium text-slate-500 max-w-sm">
              There are no class sessions scheduled or completed for this batch in the database yet.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto pt-2">
          {batchSessions.map((session) => {
          const dateStr = new Date(session.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          return (
            <Card
              key={session.id}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Title */}
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                  {session.subjectName}
                </h3>

                {/* Status Pill Badge */}
                <div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full border tracking-wide uppercase',
                      session.attendanceMarked
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200',
                    )}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {session.attendanceMarked ? 'ATTENDANCE MARKED' : 'PENDING MARKING'}
                  </span>
                </div>

                {/* Date & Time Row */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 flex-wrap">
                  <div className="flex items-center gap-1 text-violet-600">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{dateStr}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>
                      {session.startsAt} – {session.endsAt}
                    </span>
                  </div>
                </div>

                {/* Location Row */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <MapPin className="w-4 h-4 text-violet-500 shrink-0" />
                  <span className="truncate">{session.roomName}</span>
                </div>

                {/* Recorded Count */}
                {session.attendanceMarked && session.presentCount !== undefined && (
                  <p className="text-xs font-bold text-slate-800 pt-1">
                    Recorded: <span className="font-black text-slate-900">{session.presentCount} / {session.totalCount}</span> Students Present
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-3">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/tutor/sessions/${session.id}`)}
                  className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-violet-600/20 text-center cursor-pointer block"
                >
                  VIEW / EDIT ATTENDANCE
                </button>
              </div>
            </Card>
          );
        })}
        </div>
      )}
    </div>
  );
}

export default function AttendanceLogPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <DashboardLayout>
        <AttendanceLogContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
