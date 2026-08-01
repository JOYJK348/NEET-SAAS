'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  useAdminLiveDashboard,
  useAdminExamDetail,
} from '@/features/offline-exams/hooks/use-admin-exams';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
  Users,
  Wifi,
  WifiOff,
  UserX,
} from 'lucide-react';

function ExamLiveMonitorContent() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const { data: exam, isLoading: examLoading } = useAdminExamDetail(examId);
  const {
    data,
    isLoading: liveLoading,
    refetch,
    isRefetching,
  } = useAdminLiveDashboard(examId, 15000);

  const isLoading = examLoading || liveLoading;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data && !exam) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState
          title="Failed to load live exam monitor"
          message="Live monitor data is currently unavailable for this exam."
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  const metrics = data?.liveMetrics;

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Signature Violet Gradient Banner Header */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 text-white border-0 shrink-0"
            onClick={() => router.push('/dashboard/exams')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                Real-Time Exam Operational Monitor (Auto-Refreshes 15s)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-white flex items-center gap-2">
              Live Monitor — {data?.title || exam?.title || 'Live Exam'} 📡
            </h1>
            <p className="text-violet-200 text-xs mt-0.5">
              Monitor live student connections, active timers, submissions, and connectivity events
              in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="px-4 gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                isRefetching && 'animate-spin text-emerald-300',
              )}
            />
            <span>{isRefetching ? 'Refetching...' : 'Refresh'}</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/exams')}
            className="px-4 gap-2 bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-xl text-xs font-bold shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Exams
          </Button>
        </div>
      </div>

      {/* Operational State Banner */}
      <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
            {data?.currentExamState || 'LIVE'}
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Operational Real-Time Exam State</p>
            <p className="text-xs text-slate-500">Live background heartbeat active</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
          <Clock className="w-4 h-4 text-violet-600" />
          <span>Window Remaining:</span>
          <span className="font-mono font-black text-slate-900 text-sm">
            {Math.floor((data?.windowRemainingSeconds || 0) / 60)} mins
          </span>
        </div>
      </Card>

      {/* Real-time KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 text-center shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-2">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics?.totalStudents || 0}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
            Total Enrolled
          </p>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-emerald-50/70 p-4 text-center shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
            <Wifi className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-emerald-700">{metrics?.activeCount || 0}</p>
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mt-1">
            Active (&lt;90s)
          </p>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-amber-50/70 p-4 text-center shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
            <WifiOff className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-amber-700">{metrics?.disconnectedCount || 0}</p>
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mt-1">
            Disconnected
          </p>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-blue-50/70 p-4 text-center shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-blue-700">{metrics?.submittedCount || 0}</p>
          <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mt-1">Submitted</p>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-rose-50/70 p-4 text-center shadow-xs">
          <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-2">
            <UserX className="w-5 h-5" />
          </div>
          <p className="text-2xl font-black text-rose-700">{metrics?.absentCount || 0}</p>
          <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mt-1">
            Absent / Expired
          </p>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 flex items-center justify-between shadow-xs">
          <span className="text-slate-500">Started Exam</span>
          <span className="font-extrabold text-slate-900 text-base">
            {metrics?.startedCount || 0}
          </span>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 flex items-center justify-between shadow-xs">
          <span className="text-slate-500">Never Started</span>
          <span className="font-extrabold text-slate-900 text-base">
            {metrics?.neverStartedCount || 0}
          </span>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 flex items-center justify-between shadow-xs">
          <span className="text-slate-500">Grace Running</span>
          <span className="font-extrabold text-amber-600 text-base">
            {metrics?.graceRunningCount || 0}
          </span>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 flex items-center justify-between shadow-xs">
          <span className="text-slate-500">Upload In Progress</span>
          <span className="font-extrabold text-indigo-600 text-base">
            {metrics?.uploadInProgressCount || 0}
          </span>
        </Card>
      </div>
    </div>
  );
}

export default function ExamLiveMonitorPage() {
  return (
    <DashboardLayout>
      <ExamLiveMonitorContent />
    </DashboardLayout>
  );
}
