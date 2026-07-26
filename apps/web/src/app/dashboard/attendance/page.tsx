'use client';

import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAttendanceOverview } from '@/features/attendance/hooks/use-attendance-overview';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
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
} from 'lucide-react';

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: 'violet' | 'emerald' | 'amber' | 'rose';
}) {
  const accentMap = {
    violet: 'bg-violet-50 text-violet-600 border-violet-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <div className={cn('p-3 rounded-xl border', accentMap[accent])}>{icon}</div>
      </div>
    </div>
  );
}

function BatchCard({
  batch,
  onClick,
}: {
  batch: {
    batchId: string;
    batchName: string;
    batchCode: string;
    overallRate: number;
    totalStudents: number;
    sessionsConducted: number;
    sessionsMarked: number;
    studentsBelow75: number;
  };
  onClick: () => void;
}) {
  const rateColor =
    batch.overallRate >= 75
      ? 'text-emerald-600'
      : batch.overallRate >= 60
        ? 'text-amber-600'
        : 'text-rose-600';
  const rateBg =
    batch.overallRate >= 75
      ? 'bg-emerald-50'
      : batch.overallRate >= 60
        ? 'bg-amber-50'
        : 'bg-rose-50';

  return (
    <button
      onClick={onClick}
      className="w-full text-left group active:scale-[0.99] transition-transform"
    >
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all p-5">
        <div className="flex items-start gap-4">
          <div className={cn('p-3 rounded-xl', rateBg)}>
            <GraduationCap className={cn('w-5 h-5', rateColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-slate-900 text-sm">{batch.batchName}</p>
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {batch.batchCode}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                <span className={cn('font-bold', rateColor)}>{batch.overallRate}%</span> overall
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Users className="w-3 h-3" /> {batch.totalStudents} students
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ClipboardCheck className="w-3 h-3" /> {batch.sessionsMarked}/
                {batch.sessionsConducted} sessions
              </span>
              {batch.studentsBelow75 > 0 && (
                <span className="text-[11px] text-rose-600 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3 h-3" /> {batch.studentsBelow75} below 75%
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors flex-shrink-0 mt-1" />
        </div>
      </div>
    </button>
  );
}

function AttendanceOverviewContent() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAttendanceOverview();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6">
        <ErrorState
          title="Failed to load attendance"
          message={error.message}
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  const { overview, batches } = data!;

  return (
    <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-base font-black text-slate-900">Attendance Overview</h1>
          <p className="text-xs text-slate-400">Monitor batch-wise attendance</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Overall Attendance"
          value={`${overview.overallRate}%`}
          accent="violet"
        />
        <StatCard
          icon={<CalendarCheck className="w-5 h-5" />}
          label="Today's Sessions"
          value={overview.totalSessions}
          sub={`${overview.markedSessions} marked`}
          accent="emerald"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Pending Marking"
          value={overview.pendingSessions}
          accent="amber"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Low Attendance"
          value={overview.lowAttendanceStudents}
          sub="Students below 75%"
          accent="rose"
        />
      </div>

      {/* Batches list */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-slate-400" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Batch-wise Attendance
          </p>
          <span className="text-xs text-slate-400 ml-auto">{batches.length} batches</span>
        </div>
        {batches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No batches found</p>
            <p className="text-xs text-slate-400 mt-1">
              Attendance data appears once sessions are conducted
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {batches.map((b) => (
              <BatchCard
                key={b.batchId}
                batch={b}
                onClick={() => router.push(`/dashboard/attendance/batches/${b.batchId}`)}
              />
            ))}
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
