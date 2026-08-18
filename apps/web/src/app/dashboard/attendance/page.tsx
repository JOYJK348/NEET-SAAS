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
  Sparkles,
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
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Signature Violet Gradient Banner Header */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-200" />
            <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
              Academic Attendance Dashboard
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight text-white flex items-center gap-2">
            Attendance Overview 📋
          </h1>
          <p className="text-violet-200 text-xs mt-0.5">
            Monitor real-time batch attendance metrics, daily sessions marking, and low attendance
            alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="px-4 gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Refresh Data</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Overall Attendance Rate */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-violet-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-violet-100 bg-violet-50 text-violet-600 shrink-0">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Overall Attendance
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                  {overview.overallRate}%
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Sessions */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-emerald-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shrink-0">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Today's Sessions
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-slate-900">
                  {overview.totalSessions}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  ({overview.markedSessions} marked)
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Marking */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-amber-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-amber-100 bg-amber-50 text-amber-600 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Pending Marking
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {overview.pendingSessions}
              </p>
            </div>
          </div>
        </Card>

        {/* Low Attendance Alert */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-rose-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Low Attendance (&lt;75%)
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-rose-600">
                  {overview.lowAttendanceStudents}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Students</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Batch-wise Attendance Roster Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Users className="w-4 h-4 text-violet-600" />
            <span>Batch-wise Attendance Roster</span>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-xl border border-slate-200">
            {batches.length} Batches
          </span>
        </div>

        {batches.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-3">
              <ClipboardCheck className="w-6 h-6 text-violet-600" />
            </div>
            <p className="text-base font-bold text-slate-900">No Attendance Records Yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
                  className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-xs hover:shadow-md hover:border-violet-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm shadow-purple-500/20 shrink-0">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base group-hover:text-violet-700 transition-colors flex items-center gap-2">
                          {batch.batchName}
                        </h3>
                        <span className="inline-block text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1">
                          {batch.batchCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn('text-xs font-bold px-2.5 py-1 rounded-lg border', rateColor)}
                      >
                        {batch.overallRate}% Avg
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Students</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {batch.totalStudents}
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Marked</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {batch.sessionsMarked} / {batch.sessionsConducted}
                      </p>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
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
