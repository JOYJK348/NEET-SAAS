'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStudentAttendance } from '@/features/student-dashboard/hooks/use-student-attendance';
import type {
  AttendanceRecordDto,
  SubjectAttendanceDto,
} from '@/features/student-dashboard/types/student-dashboard.types';
import { AlertCircle, CheckCircle2, ClipboardList, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function AttendanceSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-100 rounded-2xl" />
    </div>
  );
}

// ─── Rate Bar ─────────────────────────────────────────────────────────────────
function RateBar({ rate, colorClass }: { rate: number | null; colorClass: string }) {
  const pct = rate ?? 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-700', colorClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Subject Breakdown Card ───────────────────────────────────────────────────
const SUBJECT_COLORS: Record<string, { bar: string; bg: string; text: string }> = {
  physics: { bar: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  chemistry: { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  biology: { bar: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700' },
  botany: { bar: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
  zoology: { bar: 'bg-pink-500', bg: 'bg-pink-50', text: 'text-pink-700' },
};

function getSubjectTheme(name: string) {
  const lower = name.toLowerCase();
  return (
    Object.entries(SUBJECT_COLORS).find(([k]) => lower.includes(k))?.[1] ?? {
      bar: 'bg-violet-500',
      bg: 'bg-violet-50',
      text: 'text-violet-700',
    }
  );
}

function SubjectCard({ sub }: { sub: SubjectAttendanceDto }) {
  const theme = getSubjectTheme(sub.subjectName);
  const belowThreshold = sub.rate != null && sub.rate < 75;

  return (
    <div className={cn('rounded-2xl border border-slate-100 p-4 space-y-3', theme.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-black text-slate-800">{sub.subjectName}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {sub.present}/{sub.total} classes attended
          </p>
        </div>
        <span
          className={cn(
            'text-sm font-black px-2.5 py-1 rounded-xl',
            belowThreshold ? 'bg-rose-100 text-rose-700' : `${theme.bg} ${theme.text}`,
          )}
        >
          {sub.rate != null ? `${sub.rate}%` : 'N/A'}
        </span>
      </div>
      <RateBar rate={sub.rate} colorClass={belowThreshold ? 'bg-rose-500' : theme.bar} />
      {belowThreshold && (
        <p className="text-[10px] text-rose-600 font-bold">⚠️ Below 75% — at risk</p>
      )}
    </div>
  );
}

// ─── Status Chip ──────────────────────────────────────────────────────────────
function StatusChip({ status, lateMinutes }: { status: string; lateMinutes: number }) {
  if (status === 'LATE' || (status === 'PRESENT' && lateMinutes > 0)) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        <Clock className="w-3 h-3" />
        Late {lateMinutes}m
      </span>
    );
  }
  if (status === 'PRESENT') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="w-3 h-3" />
        Present
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
      <XCircle className="w-3 h-3" />
      Absent
    </span>
  );
}

// ─── Record Row ───────────────────────────────────────────────────────────────
function RecordRow({ record }: { record: AttendanceRecordDto }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-900 truncate">
          {record.subject?.name ?? 'Unknown Subject'}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {record.date ?? '—'}
          {record.startsAt ? ` • ${record.startsAt}` : ''} • {record.batch?.name ?? ''}
        </p>
      </div>
      <StatusChip status={record.status} lateMinutes={record.lateMinutes} />
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function AttendanceContent() {
  const { attendance, isLoading, error, refetch } = useStudentAttendance();

  return (
    <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <ClipboardList className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-base font-black text-slate-900">Attendance</h1>
          <p className="text-xs text-slate-400">Your attendance history</p>
        </div>
      </div>

      {isLoading ? (
        <AttendanceSkeleton />
      ) : error ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Failed to load attendance</p>
          <button
            onClick={refetch}
            className="mt-3 text-xs font-bold text-violet-600 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : !attendance || attendance.summary.total === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No attendance records yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Records appear after your tutor marks attendance
          </p>
        </div>
      ) : (
        <>
          {/* ── Overall Summary ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">
              Overall Summary
            </h2>

            {/* Big rate ring area */}
            <div className="flex items-center gap-6 mb-5">
              <div className="flex-shrink-0 text-center">
                <p
                  className={cn(
                    'text-4xl font-black',
                    attendance.summary.rate != null && attendance.summary.rate < 75
                      ? 'text-rose-600'
                      : 'text-violet-600',
                  )}
                >
                  {attendance.summary.rate != null ? `${attendance.summary.rate}%` : 'N/A'}
                </p>
                <p className="text-[10px] font-semibold text-slate-400 mt-1">Overall Rate</p>
              </div>
              <div className="flex-1 space-y-2">
                <RateBar
                  rate={attendance.summary.rate}
                  colorClass={
                    attendance.summary.rate != null && attendance.summary.rate < 75
                      ? 'bg-rose-500'
                      : 'bg-violet-500'
                  }
                />
                {attendance.summary.rate != null && attendance.summary.rate < 75 && (
                  <p className="text-[10px] text-rose-600 font-bold">⚠️ Below 75% threshold</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total', value: attendance.summary.total, cls: 'text-slate-900' },
                { label: 'Present', value: attendance.summary.present, cls: 'text-emerald-600' },
                { label: 'Absent', value: attendance.summary.absent, cls: 'text-rose-600' },
                { label: 'Late', value: attendance.summary.late, cls: 'text-amber-600' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={cn('text-xl font-black', stat.cls)}>{stat.value}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Subject Breakdown ───────────────────────────────────────── */}
          {attendance.subjectBreakdown.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider px-1">
                Subject Breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attendance.subjectBreakdown.map((sub) => (
                  <SubjectCard key={sub.subjectId} sub={sub} />
                ))}
              </div>
            </div>
          )}

          {/* ── Record History ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Recent Records
                <span className="ml-2 text-slate-300 font-normal normal-case">
                  (last {attendance.records.length})
                </span>
              </h2>
            </div>
            <div>
              {attendance.records.map((record) => (
                <RecordRow key={record.id} record={record} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function StudentAttendancePage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <AttendanceContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
