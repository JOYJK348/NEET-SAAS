'use client';

import { useAdminLiveDashboard } from '../../hooks/use-admin-exams';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  UserCheck,
  UserX,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

interface LiveDashboardModalProps {
  examId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LiveDashboardModal({ examId, isOpen, onClose }: LiveDashboardModalProps) {
  const { data, isLoading, refetch, isRefetching } = useAdminLiveDashboard(examId, 15000);

  if (!isOpen) return null;

  const metrics = data?.liveMetrics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl text-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Live Exam Monitor — {data?.title || 'Loading...'}
              </h2>
              <p className="text-xs text-slate-400">Auto-refreshes every 15s</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefetching ? 'animate-spin text-emerald-400' : ''}`}
              />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">Loading live metrics...</div>
          ) : (
            <>
              {/* Top Banner Status */}
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
                    {data?.currentExamState}
                  </div>
                  <span className="text-sm font-semibold text-slate-200">
                    Operational Real-Time Monitor
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Window Remaining:{' '}
                  <span className="text-slate-200 font-mono font-bold text-sm">
                    {Math.floor((data?.windowRemainingSeconds || 0) / 60)} mins
                  </span>
                </div>
              </div>

              {/* Grid of Real-time Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="flex justify-center mb-1">
                    <Users className="w-5 h-5 text-indigo-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-white">
                    {metrics?.totalStudents || 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Total Enrolled</p>
                </div>

                <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-800/40 text-center">
                  <div className="flex justify-center mb-1">
                    <Wifi className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-400">
                    {metrics?.activeCount || 0}
                  </p>
                  <p className="text-xs text-emerald-300 mt-0.5">Active (Heartbeat &lt;90s)</p>
                </div>

                <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-800/40 text-center">
                  <div className="flex justify-center mb-1">
                    <WifiOff className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-amber-400">
                    {metrics?.disconnectedCount || 0}
                  </p>
                  <p className="text-xs text-amber-300 mt-0.5">Disconnected</p>
                </div>

                <div className="bg-blue-950/20 p-4 rounded-xl border border-blue-800/40 text-center">
                  <div className="flex justify-center mb-1">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-blue-400">
                    {metrics?.submittedCount || 0}
                  </p>
                  <p className="text-xs text-blue-300 mt-0.5">Submitted</p>
                </div>

                <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-800/40 text-center">
                  <div className="flex justify-center mb-1">
                    <UserX className="w-5 h-5 text-rose-400" />
                  </div>
                  <p className="text-2xl font-extrabold text-rose-400">
                    {metrics?.absentCount || 0}
                  </p>
                  <p className="text-xs text-rose-300 mt-0.5">Absent / Expired</p>
                </div>
              </div>

              {/* Secondary Detail Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Started Exam</span>
                  <span className="font-bold text-slate-100">{metrics?.startedCount || 0}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Never Started</span>
                  <span className="font-bold text-slate-100">
                    {metrics?.neverStartedCount || 0}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Grace Running</span>
                  <span className="font-bold text-amber-400">
                    {metrics?.graceRunningCount || 0}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Upload In Progress</span>
                  <span className="font-bold text-indigo-400">
                    {metrics?.uploadInProgressCount || 0}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition"
          >
            Close Monitor
          </button>
        </div>
      </div>
    </div>
  );
}
