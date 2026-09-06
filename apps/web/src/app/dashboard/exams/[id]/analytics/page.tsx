'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  useAdminPostPublishAnalytics,
  useAdminSectionAnalytics,
  useAdminTopStudents,
  useAdminBottomStudents,
  useAdminExamDetail,
} from '@/features/offline-exams/hooks/use-admin-exams';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  PieChart,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Sparkles,
  FileText,
  Clock,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

function ExamAnalyticsContent() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const { data: exam, isLoading: examLoading } = useAdminExamDetail(examId);
  const {
    data: analytics,
    isLoading: analyticsLoading,
    refetch,
  } = useAdminPostPublishAnalytics(examId);
  const { data: sectionData } = useAdminSectionAnalytics(examId);
  const { data: topStudents = [] } = useAdminTopStudents(examId, 10);
  const { data: bottomStudents = [] } = useAdminBottomStudents(examId, 10);

  const isLoading = examLoading || analyticsLoading;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!analytics && !exam) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState
          title="Failed to load exam analytics"
          message="Analytics data for this exam is unavailable or not yet published."
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  const overall = analytics?.overallStats;
  const marks = analytics?.marksAnalytics;

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-20">
      {/* ── Header Banner — ISML LMS Light Blue Style ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <Link href="/dashboard/exams" className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5 text-[#0052CC]" />
              Exam Management
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Performance Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447] flex items-center gap-2 flex-wrap">
            <span>{analytics?.title || exam?.title || 'Exam Analytics'}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#0052CC] border border-blue-200 uppercase tracking-wider">
              Post-Publish Analytics 📊
            </span>
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Comprehensive report of student marks, ranks distribution, section performance, and pass rates
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard/exams')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 shadow-2xs transition shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#0052CC]" />
          <span>Back to Exams</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 text-center shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Attendance
          </p>
          <p className="text-xl font-black text-slate-900 mt-1">
            {overall?.attendancePercent || 0}%
          </p>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-emerald-50/70 p-3.5 text-center shadow-xs">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
            Pass Rate
          </p>
          <p className="text-xl font-black text-emerald-700 mt-1">{overall?.passPercent || 0}%</p>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-rose-50/70 p-3.5 text-center shadow-xs">
          <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Fail Rate</p>
          <p className="text-xl font-black text-rose-700 mt-1">{overall?.failPercent || 0}%</p>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-amber-50/70 p-3.5 text-center shadow-xs">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            Absent Rate
          </p>
          <p className="text-xl font-black text-amber-700 mt-1">{overall?.absentPercent || 0}%</p>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-indigo-50/70 p-3.5 text-center shadow-xs">
          <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
            Late Rate
          </p>
          <p className="text-xl font-black text-indigo-700 mt-1">{overall?.latePercent || 0}%</p>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 text-center shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluated</p>
          <p className="text-xl font-black text-slate-900 mt-1">{overall?.evaluatedCount || 0}</p>
        </Card>
      </div>

      {/* Marks Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Highest Score
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">
              {marks?.highest || 0} Marks
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Average Score
            </p>
            <p className="text-2xl font-black text-indigo-600 mt-0.5">
              {marks?.average || 0} Marks
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <BarChart3 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Median Score
            </p>
            <p className="text-2xl font-black text-purple-600 mt-0.5">{marks?.median || 0} Marks</p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
            <PieChart className="w-6 h-6" />
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Lowest Score
            </p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{marks?.lowest || 0} Marks</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
            <TrendingDown className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Dynamic Section Breakdown */}
      {sectionData?.sectionAnalytics && sectionData.sectionAnalytics.length > 0 && (
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-600" />
            Section Average Marks Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sectionData.sectionAnalytics.map((sec) => (
              <div
                key={sec.sectionName}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60"
              >
                <p className="text-xs font-bold text-slate-900">{sec.sectionName}</p>
                <p className="text-lg font-black text-violet-700 mt-1">
                  {sec.averageMarks}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ {sec.maxMarks}</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Evaluated: {sec.evaluatedCount}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Performers Split Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Performers */}
        <Card className="rounded-2xl border-emerald-100 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-emerald-800 flex items-center gap-2 uppercase tracking-wider">
            <Award className="w-4 h-4 text-emerald-600" /> Top Performers (Rank 1-10)
          </h3>
          <div className="space-y-2.5">
            {topStudents.map((s, idx) => (
              <div
                key={s.submissionId || idx}
                className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/30 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-[11px]">
                      #{s.rank || idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{s.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{s.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-700 text-sm">
                      {s.obtainedMarks} pts
                    </span>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {analytics?.totalMarks
                        ? `${Math.round((s.obtainedMarks / analytics.totalMarks) * 100)}%`
                        : ''}
                    </p>
                  </div>
                </div>

                {/* Subject-wise breakdown */}
                {s.marksBreakdown && s.marksBreakdown.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-emerald-100/60">
                    {s.marksBreakdown.map((sec, sIdx) => (
                      <span
                        key={sIdx}
                        className="bg-white border border-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md text-[10px] font-bold"
                      >
                        {sec.sectionName}:{' '}
                        <span className="text-emerald-700">{sec.obtainedMarks}</span>
                        {sec.maxMarks ? `/${sec.maxMarks}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Needs Support */}
        <Card className="rounded-2xl border-rose-100 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-rose-800 flex items-center gap-2 uppercase tracking-wider">
            <TrendingDown className="w-4 h-4 text-rose-600" /> Needs Support (Bottom Performers)
          </h3>
          <div className="space-y-2.5">
            {bottomStudents.map((s, idx) => (
              <div
                key={s.submissionId || idx}
                className="p-3 rounded-xl border border-rose-100 bg-rose-50/30 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{s.studentName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{s.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-rose-700 text-sm">{s.obtainedMarks} pts</span>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {analytics?.totalMarks
                        ? `${Math.round((s.obtainedMarks / analytics.totalMarks) * 100)}%`
                        : ''}
                    </p>
                  </div>
                </div>

                {/* Subject-wise breakdown */}
                {s.marksBreakdown && s.marksBreakdown.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-rose-100/60">
                    {s.marksBreakdown.map((sec, sIdx) => (
                      <span
                        key={sIdx}
                        className="bg-white border border-rose-200/80 text-rose-900 px-2 py-0.5 rounded-md text-[10px] font-bold"
                      >
                        {sec.sectionName}:{' '}
                        <span className="text-rose-700">{sec.obtainedMarks}</span>
                        {sec.maxMarks ? `/${sec.maxMarks}` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Complete Student Marks & Scorecard Roster Table */}
      <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-violet-600" />
            <h3 className="text-base font-bold text-slate-900">
              All Student Exam Marks & Ranks Roster
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
            Total Evaluated:{' '}
            {topStudents.length +
              bottomStudents.filter(
                (b) => !topStudents.some((t) => t.submissionId === b.submissionId),
              ).length}{' '}
            Students
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Student Details</th>
                <th className="py-3.5 px-4">Subject / Section Marks Breakdown</th>
                <th className="py-3.5 px-4 text-center">Total Marks</th>
                <th className="py-3.5 px-4 text-center">Percentage</th>
                <th className="py-3.5 px-4 text-center">Result Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {[
                ...topStudents,
                ...bottomStudents.filter(
                  (b) => !topStudents.some((t) => t.submissionId === b.submissionId),
                ),
              ].map((st, i) => {
                const isPass = analytics?.passingMarks
                  ? st.obtainedMarks >= analytics.passingMarks
                  : true;
                const percent = analytics?.totalMarks
                  ? Math.round((st.obtainedMarks / analytics.totalMarks) * 100)
                  : 0;
                return (
                  <tr key={st.submissionId || i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100 font-mono text-xs">
                        #{st.rank || i + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{st.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{st.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {st.marksBreakdown && st.marksBreakdown.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {st.marksBreakdown.map((sec, sIdx) => (
                            <span
                              key={sIdx}
                              className="bg-slate-50 border border-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                            >
                              {sec.sectionName}:{' '}
                              <span className="font-bold text-violet-700">{sec.obtainedMarks}</span>
                              {sec.maxMarks ? (
                                <span className="text-slate-400 font-normal">/{sec.maxMarks}</span>
                              ) : (
                                ''
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">
                          Total Score Evaluation
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-black text-slate-900 text-sm">{st.obtainedMarks}</span>
                      <span className="text-[11px] text-slate-400 ml-1">
                        / {analytics?.totalMarks || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-slate-800">{percent}%</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isPass ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASSED
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold rounded-full inline-flex items-center gap-1">
                          FAILED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function ExamAnalyticsPage() {
  return (
    <DashboardLayout>
      <ExamAnalyticsContent />
    </DashboardLayout>
  );
}
