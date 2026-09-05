'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  useAdminLiveDashboard,
  useAdminExamDetail,
} from '@/features/offline-exams/hooks/use-admin-exams';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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
  ShieldCheck,
  Radio,
  FileCheck2,
  Timer,
  Info,
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
      <div className="p-4 sm:p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <LoadingSpinner />
        <p className="text-xs text-slate-500 font-semibold">Connecting to Live Exam Telemetry...</p>
      </div>
    );
  }

  if (!data && !exam) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState
          title="Failed to load live exam monitor"
          message="Live monitor telemetry data is currently unavailable for this exam session."
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  const metrics = data?.liveMetrics;
  const examTitle = data?.title || exam?.title || 'Live Exam';
  const remainingMins = Math.floor((data?.windowRemainingSeconds || 0) / 60);

  return (
    <div className="space-y-6 pb-8 text-[#0F172A] font-sans">
      {/* 1. Standard Platform Clean White Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3.5 min-w-0">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0 shadow-2xs"
            onClick={() => router.push('/dashboard/exams')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h1 className="text-base sm:text-xl font-extrabold text-[#0B2447] truncate">
                Live Monitor — {examTitle}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 uppercase tracking-wider shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Telemetry Live
              </span>
            </div>
            <p className="text-slate-500 text-xs font-medium truncate">
              Real-time student active timers, socket heartbeats, submissions, and network status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="px-3.5 py-2 gap-2 text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <RefreshCw
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-slate-500',
                isRefetching && 'animate-spin text-[#0052CC]',
              )}
            />
            <span>{isRefetching ? 'Refreshing...' : 'Refresh'}</span>
          </Button>

          <Button
            size="sm"
            onClick={() => router.push('/dashboard/exams')}
            className="px-4 py-2 bg-[#0052CC] hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-2xs transition-all"
          >
            <span>Exit Monitor</span>
          </Button>
        </div>
      </div>

      {/* 2. Operational Real-Time Status Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold rounded-full flex items-center gap-1.5 uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            {data?.currentExamState || 'LIVE'}
          </span>

          <div>
            <p className="text-sm font-extrabold text-[#0B2447]">Operational Exam Heartbeat</p>
            <p className="text-xs text-slate-500 font-medium">Active monitoring telemetry node online</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80">
            <Timer className="w-4 h-4 text-[#0052CC]" />
            <span>Time Window Left:</span>
            <span className="font-mono font-black text-[#0B2447] text-sm">
              {remainingMins > 0 ? `${remainingMins} mins` : 'Window Ended'}
            </span>
          </div>

          <Link
            href={`/dashboard/exams/${examId}/review`}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#0052CC] border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Review Submissions</span>
          </Link>
        </div>
      </div>

      {/* 3. Primary Real-Time Metric Cards (5 Column Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Enrolled */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-center">
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center mx-auto">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-[#0B2447]">{metrics?.totalStudents || 0}</p>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Enrolled
          </p>
        </div>

        {/* Active Connected (<90s) */}
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-2 text-center">
          <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <Wifi className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">{metrics?.activeCount || 0}</p>
          <p className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Active (&lt;90s)
          </p>
        </div>

        {/* Disconnected */}
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 shadow-2xs space-y-2 text-center">
          <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <WifiOff className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-amber-700">{metrics?.disconnectedCount || 0}</p>
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
            Disconnected
          </p>
        </div>

        {/* Submitted */}
        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80 shadow-2xs space-y-2 text-center">
          <div className="h-9 w-9 rounded-xl bg-blue-100 text-[#0052CC] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-[#0052CC]">{metrics?.submittedCount || 0}</p>
          <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
            Submitted
          </p>
        </div>

        {/* Absent / Expired */}
        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 shadow-2xs space-y-2 text-center col-span-2 sm:col-span-1">
          <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <UserX className="w-5 h-5" />
          </div>
          <p className="text-2xl font-extrabold text-rose-700">{metrics?.absentCount || 0}</p>
          <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
            Absent / Expired
          </p>
        </div>
      </div>

      {/* 4. Detailed Status Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-semibold">Started Exam</p>
            <p className="text-lg font-extrabold text-[#0B2447] mt-0.5">
              {metrics?.startedCount || 0}
            </p>
          </div>
          <span className="px-2 py-1 bg-blue-50 text-[#0052CC] rounded-lg font-bold">In Progress</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-semibold">Never Started</p>
            <p className="text-lg font-extrabold text-slate-700 mt-0.5">
              {metrics?.neverStartedCount || 0}
            </p>
          </div>
          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold">Unattempted</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-semibold">Grace Period Running</p>
            <p className="text-lg font-extrabold text-amber-600 mt-0.5">
              {metrics?.graceRunningCount || 0}
            </p>
          </div>
          <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg font-bold">Grace Window</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-semibold">Upload In Progress</p>
            <p className="text-lg font-extrabold text-indigo-600 mt-0.5">
              {metrics?.uploadInProgressCount || 0}
            </p>
          </div>
          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold">Uploading</span>
        </div>
      </div>

      {/* 5. Live Telemetry Information & Protocol Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-[#0052CC]">
            <Info className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-[#0B2447] uppercase tracking-wider">
            Live Monitoring Telemetry Guide
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="font-extrabold text-[#0B2447] block">Active Status (&lt;90s)</span>
            <p className="text-slate-500">
              Students whose candidate client sent a socket heartbeat or auto-save event within the last 90 seconds.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="font-extrabold text-[#0B2447] block">Disconnected Candidate Alert</span>
            <p className="text-slate-500">
              Students who started the exam but lost connection or closed the window without submitting.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <span className="font-extrabold text-[#0B2447] block">Grace & Auto-Submission</span>
            <p className="text-slate-500">
              When the time window expires, grace period allows buffer time for pending answer sheet upload.
            </p>
          </div>
        </div>
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
