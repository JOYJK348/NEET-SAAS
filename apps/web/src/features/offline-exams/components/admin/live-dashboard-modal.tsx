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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl text-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Live Exam Monitor — {data?.title || 'Loading...'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">Auto-refreshes every 15s</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition flex items-center gap-1.5 text-xs font-bold"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefetching ? 'animate-spin text-emerald-600' : ''}`}
              />
              Refresh
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-white">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 font-medium">Loading live metrics...</div>
          ) : (
            <>
              {/* Top Banner Status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">
                    {data?.currentExamState}
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    Operational Real-Time Monitor
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Window Remaining:{' '}
                  <span className="text-slate-900 font-mono font-bold text-sm">
                    {Math.floor((data?.windowRemainingSeconds || 0) / 60)} mins
                  </span>
                </div>
              </div>

              {/* Grid of Real-time Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-sm">
                  <div className="flex justify-center mb-1">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {metrics?.totalStudents || 0}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Total Enrolled</p>
                </div>

                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200/80 text-center shadow-sm">
                  <div className="flex justify-center mb-1">
                    <Wifi className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-700">
                    {metrics?.activeCount || 0}
                  </p>
                  <p className="text-xs text-emerald-800 mt-0.5 font-semibold">Active (&lt;90s)</p>
                </div>

                <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200/80 text-center shadow-sm">
                  <div className="flex justify-center mb-1">
                    <WifiOff className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-amber-700">
                    {metrics?.disconnectedCount || 0}
                  </p>
                  <p className="text-xs text-amber-800 mt-0.5 font-semibold">Disconnected</p>
                </div>

                <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200/80 text-center shadow-sm">
                  <div className="flex justify-center mb-1">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-blue-700">
                    {metrics?.submittedCount || 0}
                  </p>
                  <p className="text-xs text-blue-800 mt-0.5 font-semibold">Submitted</p>
                </div>

                <div className="bg-rose-50/80 p-4 rounded-xl border border-rose-200/80 text-center shadow-sm">
                  <div className="flex justify-center mb-1">
                    <UserX className="w-5 h-5 text-rose-600" />
                  </div>
                  <p className="text-2xl font-extrabold text-rose-700">
                    {metrics?.absentCount || 0}
                  </p>
                  <p className="text-xs text-rose-800 mt-0.5 font-semibold">Absent / Expired</p>
                </div>
              </div>

              {/* Secondary Detail Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Started Exam</span>
                  <span className="font-bold text-slate-900">{metrics?.startedCount || 0}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Never Started</span>
                  <span className="font-bold text-slate-900">
                    {metrics?.neverStartedCount || 0}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Grace Running</span>
                  <span className="font-bold text-amber-700">
                    {metrics?.graceRunningCount || 0}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Upload In Progress</span>
                  <span className="font-bold text-indigo-700">
                    {metrics?.uploadInProgressCount || 0}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-200 bg-slate-50/80">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
          >
            Close Monitor
          </button>
        </div>
      </div>
    </div>
  );
}
