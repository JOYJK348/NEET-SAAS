'use client';

import {
  useAdminBottomStudents,
  useAdminPostPublishAnalytics,
  useAdminSectionAnalytics,
  useAdminTopStudents,
} from '../../hooks/use-admin-exams';
import {
  Award,
  BarChart3,
  CheckCircle2,
  PieChart,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';

interface PostPublishAnalyticsModalProps {
  examId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PostPublishAnalyticsModal({
  examId,
  isOpen,
  onClose,
}: PostPublishAnalyticsModalProps) {
  const { data: analytics, isLoading } = useAdminPostPublishAnalytics(examId);
  const { data: sectionData } = useAdminSectionAnalytics(examId);
  const { data: topStudents } = useAdminTopStudents(examId, 5);
  const { data: bottomStudents } = useAdminBottomStudents(examId, 5);

  if (!isOpen) return null;

  const overall = analytics?.overallStats;
  const marks = analytics?.marksAnalytics;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-400" />
              Post-Publish Analytics — {analytics?.title || 'Loading...'}
            </h2>
            <p className="text-xs text-slate-400">
              Comprehensive Performance & Score Distribution Report
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">Loading analytics data...</div>
          ) : (
            <>
              {/* Overall Percentage Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-xs text-slate-400">Attendance</p>
                  <p className="text-xl font-extrabold text-white mt-1">
                    {overall?.attendancePercent || 0}%
                  </p>
                </div>

                <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-800/40 text-center">
                  <p className="text-xs text-emerald-300">Pass Rate</p>
                  <p className="text-xl font-extrabold text-emerald-400 mt-1">
                    {overall?.passPercent || 0}%
                  </p>
                </div>

                <div className="bg-rose-950/20 p-3 rounded-xl border border-rose-800/40 text-center">
                  <p className="text-xs text-rose-300">Fail Rate</p>
                  <p className="text-xl font-extrabold text-rose-400 mt-1">
                    {overall?.failPercent || 0}%
                  </p>
                </div>

                <div className="bg-amber-950/20 p-3 rounded-xl border border-amber-800/40 text-center">
                  <p className="text-xs text-amber-300">Absent Rate</p>
                  <p className="text-xl font-extrabold text-amber-400 mt-1">
                    {overall?.absentPercent || 0}%
                  </p>
                </div>

                <div className="bg-indigo-950/20 p-3 rounded-xl border border-indigo-800/40 text-center">
                  <p className="text-xs text-indigo-300">Late Rate</p>
                  <p className="text-xl font-extrabold text-indigo-400 mt-1">
                    {overall?.latePercent || 0}%
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <p className="text-xs text-slate-400">Evaluated</p>
                  <p className="text-xl font-extrabold text-white mt-1">
                    {overall?.evaluatedCount || 0}
                  </p>
                </div>
              </div>

              {/* Marks Summary */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Highest Score</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-0.5">
                      {marks?.highest || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-400/20" />
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Average Score</p>
                    <p className="text-2xl font-bold text-indigo-400 mt-0.5">
                      {marks?.average || 0}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-indigo-400/20" />
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Median Score</p>
                    <p className="text-2xl font-bold text-purple-400 mt-0.5">
                      {marks?.median || 0}
                    </p>
                  </div>
                  <PieChart className="w-8 h-8 text-purple-400/20" />
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Lowest Score</p>
                    <p className="text-2xl font-bold text-rose-400 mt-0.5">{marks?.lowest || 0}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-rose-400/20" />
                </div>
              </div>

              {/* Dynamic Section Breakdown */}
              {sectionData?.sectionAnalytics && sectionData.sectionAnalytics.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-400" />
                    Section Average Marks Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {sectionData.sectionAnalytics.map((sec) => (
                      <div
                        key={sec.sectionName}
                        className="bg-slate-900 p-3 rounded-lg border border-slate-800"
                      >
                        <p className="text-xs font-semibold text-slate-300">{sec.sectionName}</p>
                        <p className="text-lg font-bold text-teal-400 mt-1">
                          {sec.averageMarks}{' '}
                          <span className="text-xs text-slate-500 font-normal">
                            / {sec.maxMarks}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Evaluated: {sec.evaluatedCount}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top vs Bottom Students */}
              <div className="grid grid-cols-2 gap-4">
                {/* Top 5 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
                    <Award className="w-4 h-4" /> Top 5 Performers
                  </h4>
                  <div className="space-y-2">
                    {topStudents?.map((s, idx) => (
                      <div
                        key={s.submissionId}
                        className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg text-xs"
                      >
                        <span className="font-semibold text-slate-200">
                          #{idx + 1} {s.studentName}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-emerald-400">{s.obtainedMarks} pts</span>
                          {s.rank && (
                            <span className="text-[10px] text-slate-400 ml-2">
                              (Rank #{s.rank})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom 5 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-rose-400 flex items-center gap-2 uppercase tracking-wider">
                    <TrendingDown className="w-4 h-4" /> Needs Remediation (Bottom 5)
                  </h4>
                  <div className="space-y-2">
                    {bottomStudents?.map((s, idx) => (
                      <div
                        key={s.submissionId}
                        className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg text-xs"
                      >
                        <span className="font-semibold text-slate-200">{s.studentName}</span>
                        <div className="text-right">
                          <span className="font-bold text-rose-400">{s.obtainedMarks} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
