'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type { ParentAttendanceData } from '@/features/parent-portal/types/parent-portal';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { STALE_TIMES } from '@/lib/staleTimes';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BookOpen,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/features/students/utils/student-utils';

import { ChevronRight } from 'lucide-react';

export default function ParentAttendancePage() {
  const { selectedChildId, selectedChild, isLoading: isSwitcherLoading } = useChildSwitcher();

  const { data, isLoading: isAttendanceLoading } = useQuery<ParentAttendanceData>({
    queryKey: ['parent', 'attendance', selectedChildId],
    queryFn: () => parentPortalService.getAttendance(selectedChildId!),
    enabled: Boolean(selectedChildId),
    staleTime: STALE_TIMES.DEFAULT,
    placeholderData: keepPreviousData,
  });

  const isLoading = (isAttendanceLoading && !data) || isSwitcherLoading;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#F8FAFC]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const studentName = selectedChild?.name || 'Student';
  const overallRate = data?.overallAttendance || '0%';
  const totalClasses = data?.totalClasses ?? 0;
  const presentClasses = data?.presentClasses ?? 0;
  const absentClasses = data?.absentClasses ?? 0;

  const subjectBreakdown = data?.subjectBreakdown || [];
  const recentRecords = data?.recentRecords || [];

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* ── ISML LMS Light Blue Header Banner ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-3 border border-blue-200">
        <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
          <span>Parent Portal</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
          <span>Attendance Tracker</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-[#0052CC] text-white flex items-center justify-center font-extrabold text-xl shadow-2xs shrink-0">
              {studentName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447]">
                {studentName}&apos;s Attendance Record
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Live attendance logs, subject participation rates, and absence history
              </p>
            </div>
          </div>

          <div className="bg-white px-5 py-3 rounded-xl border border-blue-200 text-center shrink-0 self-start md:self-auto shadow-2xs">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0052CC]">
              Overall Attendance
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0B2447] mt-0.5">
              {overallRate}
            </p>
          </div>
        </div>
      </div>

      {/* ── KPI Metric Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center gap-3 hover:border-blue-300 transition-all">
          <div className="p-3 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Attendance Rate
            </p>
            <p className="text-2xl font-extrabold text-[#0B2447] mt-0.5">{overallRate}</p>
          </div>
        </Card>

        {/* Attended */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center gap-3 hover:border-emerald-300 transition-all">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Sessions Attended
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{presentClasses}</p>
          </div>
        </Card>

        {/* Absences */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center gap-3 hover:border-rose-300 transition-all">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Absences
            </p>
            <p className="text-2xl font-extrabold text-rose-600 mt-0.5">{absentClasses}</p>
          </div>
        </Card>

        {/* Total Conducted */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center gap-3 hover:border-indigo-300 transition-all">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Conducted
            </p>
            <p className="text-2xl font-extrabold text-[#0B2447] mt-0.5">{totalClasses}</p>
          </div>
        </Card>
      </div>

      {/* ── Subject-Wise Attendance Breakdown ── */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#0052CC]" />
          Subject-Wise Attendance Breakdown
        </h3>

        {subjectBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjectBreakdown.map((item) => (
              <Card
                key={item.subject}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-[#0B2447]">{item.subject}</h4>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border',
                      item.percentage >= 85
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : item.percentage >= 70
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200',
                    )}
                  >
                    {item.percentage}% Rate
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                    <span>Attended Sessions</span>
                    <span className="font-mono text-[#0B2447] font-bold">
                      {item.presentClasses} / {item.totalClasses}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        item.percentage >= 85
                          ? 'bg-emerald-500'
                          : item.percentage >= 70
                            ? 'bg-amber-500'
                            : 'bg-rose-500',
                      )}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400 font-medium shadow-2xs">
            No subject-wise attendance logs available yet.
          </Card>
        )}
      </div>

      {/* ── Recent Attendance Logs Table ── */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-[#0052CC]" />
          Recent Session Logs History ({recentRecords.length})
        </h3>

        <Card className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          {recentRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Batch</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRecords.map((record) => {
                    const st = (record.status || 'PRESENT').toUpperCase();
                    const isPresent = st === 'PRESENT' || st === 'LATE';
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-700">{formatDate(record.date)}</td>
                        <td className="p-4 font-extrabold text-[#0B2447]">
                          {record.subject || 'Class Session'}
                        </td>
                        <td className="p-4 font-medium text-slate-600">
                          {record.batchName || 'Main Batch'}
                        </td>
                        <td className="p-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-extrabold text-[11px]',
                              isPresent
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200',
                            )}
                          >
                            {isPresent ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            )}
                            {st}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-medium italic">
                          {record.remarks || 'No remarks recorded'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-medium text-slate-400">
              No recent attendance logs recorded.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
