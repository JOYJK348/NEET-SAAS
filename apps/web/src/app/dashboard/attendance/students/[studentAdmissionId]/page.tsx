'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStudentAttendanceDetail } from '@/features/attendance/hooks/use-student-attendance-detail';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
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
  ChevronRight,
} from 'lucide-react';

const STATUS_CFG: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
  PRESENT: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: 'Present',
    cls: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  ABSENT: {
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: 'Absent',
    cls: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  LATE: {
    icon: <Timer className="w-3.5 h-3.5" />,
    label: 'Late',
    cls: 'text-amber-600 bg-amber-50 border-amber-200',
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
        <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6">
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
      <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-24">
        {/* Header Banner - ISML LMS Light Blue Style */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shrink-0"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5 text-[#0052CC]" />
            </Button>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
                <span>Attendance Roster</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
                <span>Student Log ({studentCode})</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
                {studentName}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Individual student attendance history and session logs.
              </p>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0052CC]" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Attendance Rate
              </span>
            </div>
            <p
              className={cn(
                'text-2xl font-extrabold mt-1',
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Sessions
            </p>
            <p className="text-lg font-extrabold text-[#0B2447] mt-1">{summary.total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Present
            </p>
            <p className="text-lg font-extrabold text-emerald-600 mt-1">{summary.present}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4">
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Absent
            </p>
            <p className="text-lg font-extrabold text-rose-600 mt-1">{summary.absent}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" /> Late
            </p>
            <p className="text-lg font-extrabold text-amber-600 mt-1">{summary.late}</p>
          </div>
        </div>

        {/* Records */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Clock className="w-4 h-4 text-[#0052CC]" />
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Attendance Records
            </p>
            <span className="text-xs text-slate-500 font-bold ml-auto">
              Last {records.length} sessions
            </span>
          </div>

          {records.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-8 w-8 text-slate-300" />}
              title="No attendance records"
              description="Records appear once attendance is marked for this student"
            />
          ) : (
            <div className="space-y-2">
              {records.map((r) => {
                const cfg = STATUS_CFG[r.attendanceStatus] ?? {
                  icon: null,
                  label: r.attendanceStatus,
                  cls: 'text-slate-600 bg-slate-50 border-slate-200',
                };
                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-2xs px-4 py-3 flex items-center gap-3"
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border',
                        cfg.cls,
                      )}
                    >
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#0B2447]">
                          {r.date ?? '—'}
                        </span>
                        {r.subject && (
                          <span className="text-[10px] text-[#0052CC] font-extrabold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            <BookOpen className="w-3 h-3 text-[#0052CC]" /> {r.subject.name}
                          </span>
                        )}
                      </div>
                      {r.remarks && (
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{r.remarks}</p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0',
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
