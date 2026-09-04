'use client';

import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAttendanceOverview } from '@/features/attendance/hooks/use-attendance-overview';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Users,
  CalendarCheck,
  AlertTriangle,
  ChevronRight,
  GraduationCap,
  ClipboardCheck,
  Clock,
  RefreshCw,
} from 'lucide-react';

function AttendanceOverviewContent() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAttendanceOverview();

  if (isLoading || !data) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState
          title="Failed to load attendance overview"
          message={error.message}
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  const { overview, batches } = data;

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* Header Banner - ISML LMS Light Blue Style */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Management Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Attendance Overview</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
            Academic Attendance Overview
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Monitor real-time batch attendance metrics, daily sessions marking, and low attendance
            alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="px-3.5 gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 shadow-2xs rounded-xl text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0 text-[#0052CC]" aria-hidden="true" />
            <span>Refresh Data</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Overall Attendance Rate */}
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] shrink-0">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Overall Attendance
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-extrabold text-[#0B2447]">
                  {overview.overallRate}%
                </span>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Active
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Sessions */}
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shrink-0">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Today's Sessions
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-extrabold text-[#0B2447]">
                  {overview.totalSessions}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  ({overview.markedSessions} marked)
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Marking */}
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Pending Marking
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-0.5">
                {overview.pendingSessions}
              </p>
            </div>
          </div>
        </Card>

        {/* Low Attendance Alert */}
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Low Attendance (&lt;75%)
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-extrabold text-rose-600">
                  {overview.lowAttendanceStudents}
                </span>
                <span className="text-[11px] font-bold text-slate-500">Students</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Batch-wise Attendance Roster Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Users className="w-4 h-4 text-[#0052CC]" />
            <span>Batch-wise Attendance Roster</span>
          </div>
          <span className="text-xs font-extrabold text-[#0052CC] bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
            {batches.length} Batches
          </span>
        </div>

        {batches.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-2xs">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#0052CC] flex items-center justify-center mx-auto mb-3 border border-blue-200">
              <ClipboardCheck className="w-6 h-6 text-[#0052CC]" />
            </div>
            <p className="text-base font-extrabold text-[#0B2447]">No Attendance Records Yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
              Attendance statistics will automatically populate as daily class sessions are marked
              by tutors.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((batch) => {
              const rateColor =
                batch.overallRate >= 75
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : batch.overallRate >= 60
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200';

              return (
                <Card
                  key={batch.batchId}
                  onClick={() => router.push(`/dashboard/attendance/batches/${batch.batchId}`)}
                  className="rounded-2xl border-slate-200 bg-white p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0052CC] font-bold shrink-0">
                        <GraduationCap className="w-6 h-6 text-[#0052CC]" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#0B2447] text-base group-hover:text-[#0052CC] transition-colors flex items-center gap-2">
                          {batch.batchName}
                        </h3>
                        <span className="inline-block text-[10px] font-mono font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 mt-1 uppercase">
                          {batch.batchCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          'text-xs font-extrabold px-2.5 py-1 rounded-lg border',
                          rateColor,
                        )}
                      >
                        {batch.overallRate}% Avg
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#0052CC] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Students</p>
                      <p className="text-sm font-extrabold text-[#0B2447] mt-0.5">
                        {batch.totalStudents}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Marked</p>
                      <p className="text-sm font-extrabold text-[#0B2447] mt-0.5">
                        {batch.sessionsMarked} / {batch.sessionsConducted}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Alert (&lt;75%)
                      </p>
                      <p
                        className={cn(
                          'text-sm font-extrabold mt-0.5',
                          batch.studentsBelow75 > 0 ? 'text-rose-600' : 'text-emerald-600',
                        )}
                      >
                        {batch.studentsBelow75}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <DashboardLayout>
      <AttendanceOverviewContent />
    </DashboardLayout>
  );
}
