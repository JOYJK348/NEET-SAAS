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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl text-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              Post-Publish Analytics — {analytics?.title || 'Loading...'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Comprehensive Performance & Score Distribution Report
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 font-medium">Loading analytics data...</div>
          ) : (
            <>
              {/* Overall Percentage Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">Attendance</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">
                    {overall?.attendancePercent || 0}%
                  </p>
                </div>

                <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/80 text-center shadow-sm">
                  <p className="text-xs text-emerald-800 font-semibold">Pass Rate</p>
                  <p className="text-xl font-extrabold text-emerald-700 mt-1">
                    {overall?.passPercent || 0}%
                  </p>
                </div>

                <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200/80 text-center shadow-sm">
                  <p className="text-xs text-rose-800 font-semibold">Fail Rate</p>
                  <p className="text-xl font-extrabold text-rose-700 mt-1">
                    {overall?.failPercent || 0}%
                  </p>
                </div>

                <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 text-center shadow-sm">
                  <p className="text-xs text-amber-800 font-semibold">Absent Rate</p>
                  <p className="text-xl font-extrabold text-amber-700 mt-1">
                    {overall?.absentPercent || 0}%
                  </p>
                </div>

                <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-200/80 text-center shadow-sm">
                  <p className="text-xs text-indigo-800 font-semibold">Late Rate</p>
                  <p className="text-xl font-extrabold text-indigo-700 mt-1">
                    {overall?.latePercent || 0}%
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center shadow-sm">
                  <p className="text-xs text-slate-500 font-medium">Evaluated</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-1">
                    {overall?.evaluatedCount || 0}
                  </p>
                </div>
              </div>

              {/* Marks Summary */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/60 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Highest Score</p>
                    <p className="text-2xl font-black text-emerald-700 mt-0.5">
                      {marks?.highest || 0}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-emerald-600/30" />
                </div>

                <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200/60 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Average Score</p>
                    <p className="text-2xl font-black text-indigo-700 mt-0.5">
                      {marks?.average || 0}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-indigo-600/30" />
                </div>

                <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200/60 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Median Score</p>
                    <p className="text-2xl font-black text-purple-700 mt-0.5">
                      {marks?.median || 0}
                    </p>
                  </div>
                  <PieChart className="w-8 h-8 text-purple-600/30" />
                </div>

                <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200/60 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Lowest Score</p>
                    <p className="text-2xl font-black text-rose-700 mt-0.5">{marks?.lowest || 0}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-rose-600/30" />
                </div>
              </div>

              {/* Dynamic Section Breakdown */}
              {sectionData?.sectionAnalytics && sectionData.sectionAnalytics.length > 0 && (
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                    Section Average Marks Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {sectionData.sectionAnalytics.map((sec) => (
                      <div
                        key={sec.sectionName}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm"
                      >
                        <p className="text-xs font-bold text-slate-900">{sec.sectionName}</p>
                        <p className="text-lg font-bold text-teal-700 mt-1">
                          {sec.averageMarks}{' '}
                          <span className="text-xs text-slate-400 font-normal">
                            / {sec.maxMarks}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
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
                <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-200/60 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-2 uppercase tracking-wider">
                    <Award className="w-4 h-4 text-emerald-600" /> Top 5 Performers
                  </h4>
                  <div className="space-y-2">
                    {topStudents?.map((s, idx) => (
                      <div
                        key={s.submissionId}
                        className="flex items-center justify-between bg-white p-2.5 rounded-lg text-xs border border-emerald-100 shadow-sm"
                      >
                        <span className="font-bold text-slate-900">
                          #{idx + 1} {s.studentName}
                        </span>
                        <div className="text-right">
                          <span className="font-extrabold text-emerald-700">{s.obtainedMarks} pts</span>
                          {s.rank && (
                            <span className="text-[10px] text-slate-500 ml-2 font-medium">
                              (Rank #{s.rank})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom 5 */}
                <div className="bg-rose-50/40 p-4 rounded-xl border border-rose-200/60 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-rose-800 flex items-center gap-2 uppercase tracking-wider">
                    <TrendingDown className="w-4 h-4 text-rose-600" /> Needs Remediation (Bottom 5)
                  </h4>
                  <div className="space-y-2">
                    {bottomStudents?.map((s, idx) => (
                      <div
                        key={s.submissionId}
                        className="flex items-center justify-between bg-white p-2.5 rounded-lg text-xs border border-rose-100 shadow-sm"
                      >
                        <span className="font-bold text-slate-900">{s.studentName}</span>
                        <div className="text-right">
                          <span className="font-extrabold text-rose-700">{s.obtainedMarks} pts</span>
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
        <div className="flex justify-end px-6 py-4 border-t border-slate-200 bg-slate-50/80">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
