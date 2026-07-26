'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStudentAttendanceDetail } from '@/features/attendance/hooks/use-student-attendance-detail';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  XCircle,
  Timer,
  Clock,
  GraduationCap,
  CalendarDays,
  BookOpen,
} from 'lucide-react';

const STATUS_CFG: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
  PRESENT: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: 'Present',
    cls: 'text-emerald-600 bg-emerald-50',
  },
  ABSENT: {
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: 'Absent',
    cls: 'text-rose-600 bg-rose-50',
  },
  LATE: {
    icon: <Timer className="w-3.5 h-3.5" />,
    label: 'Late',
    cls: 'text-amber-600 bg-amber-50',
  },
};

export default function StudentAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const admissionId = params.studentAdmissionId as string;
  const { data, isLoading, error, refetch } = useStudentAttendanceDetail(admissionId);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6">
          <ErrorState
            title="Failed to load student attendance"
            message={error.message}
            onRetry={refetch}
            variant="page"
          />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const { studentName, studentCode, summary, records } = data;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6 pb-24 space-y-5">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900">{studentName}</h1>
              <p className="text-xs text-slate-400 font-mono">{studentCode}</p>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-semibold text-slate-400">Attendance</span>
            </div>
            <p
              className={cn(
                'text-2xl font-black mt-1',
                (summary.rate ?? 0) >= 75
                  ? 'text-emerald-600'
                  : (summary.rate ?? 0) >= 60
                    ? 'text-amber-600'
                    : 'text-rose-600',
              )}
            >
              {summary.rate != null ? `${summary.rate}%` : 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-slate-400 uppercase">Total</p>
            <p className="text-lg font-black text-slate-900 mt-1">{summary.total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-emerald-600 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Present
            </p>
            <p className="text-lg font-black text-emerald-600 mt-1">{summary.present}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-rose-600 uppercase flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Absent
            </p>
            <p className="text-lg font-black text-rose-600 mt-1">{summary.absent}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-amber-600 uppercase flex items-center gap-1">
              <Timer className="w-3 h-3" /> Late
            </p>
            <p className="text-lg font-black text-amber-600 mt-1">{summary.late}</p>
          </div>
        </div>

        {/* Records */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Attendance Records
            </p>
            <span className="text-xs text-slate-400 ml-auto">Last {records.length} sessions</span>
          </div>

          {records.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-8 w-8 text-slate-300" />}
              title="No attendance records"
              description="Records appear once attendance is marked for this student"
            />
          ) : (
            <div className="space-y-1">
              {records.map((r) => {
                const cfg = STATUS_CFG[r.attendanceStatus] ?? {
                  icon: null,
                  label: r.attendanceStatus,
                  cls: 'text-slate-600 bg-slate-50',
                };
                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3"
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        cfg.cls,
                      )}
                    >
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{r.date ?? '—'}</span>
                        {r.subject && (
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> {r.subject.name}
                          </span>
                        )}
                      </div>
                      {r.remarks && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{r.remarks}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                        cfg.cls,
                      )}
                    >
                      {cfg.label}
                      {r.attendanceStatus === 'LATE' && r.lateMinutes > 0 && (
                        <span className="ml-1">({r.lateMinutes}m)</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
