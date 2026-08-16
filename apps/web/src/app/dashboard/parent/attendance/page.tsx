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

export default function ParentAttendancePage() {
  const { selectedChildId, selectedChild, isLoading: isSwitcherLoading } = useChildSwitcher();

  const {
    data,
    isLoading: isAttendanceLoading,
  } = useQuery<ParentAttendanceData>({
    queryKey: ['parent', 'attendance', selectedChildId],
    queryFn: () => parentPortalService.getAttendance(selectedChildId!),
    enabled: Boolean(selectedChildId),
    staleTime: STALE_TIMES.DEFAULT,
    placeholderData: keepPreviousData,
  });

  const isLoading = (isAttendanceLoading && !data) || isSwitcherLoading;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#FAFAFA]">
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
    <div className="space-y-6 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Welcome Progress Hero Banner - Signature Violet Theme */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-md shadow-violet-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/20 text-white">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Attendance & Classroom Participation Tracker</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl shadow-inner border border-white/30 shrink-0 text-white">
              {studentName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {studentName}&apos;s Attendance Record
              </h1>
              <p className="text-violet-200 text-xs mt-0.5 font-medium">
                Live attendance logs, subject participation rates, and absence history
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center shrink-0 self-start md:self-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200">Overall Attendance</p>
          <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">{overallRate}</p>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm flex items-center gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Attendance Rate
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">{overallRate}</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm flex items-center gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Attended
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">{presentClasses} Sessions</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm flex items-center gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Absences
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">{absentClasses} Sessions</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm flex items-center gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Conducted
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">{totalClasses} Sessions</p>
          </div>
        </Card>
      </div>

      {/* Subject-Wise Attendance Breakdown */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-violet-600" />
          Subject-Wise Attendance Breakdown
        </h3>

        {subjectBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjectBreakdown.map((item) => (
              <Card
                key={item.subject}
                className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#111827]">{item.subject}</h4>
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
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
                  <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                    <span>Attended Sessions</span>
                    <span className="font-mono text-slate-900 font-bold">
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
          <Card className="p-6 rounded-2xl bg-white border border-[#E5E7EB] text-center text-xs text-slate-400">
            No subject-wise attendance logs available yet.
          </Card>
        )}
      </div>

      {/* Recent Attendance Logs Table */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-violet-600" />
          Recent Session Logs History ({recentRecords.length})
        </h3>

        <Card className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
          {recentRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-[#E5E7EB] text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Subject</th>
                    <th className="p-4">Batch</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {recentRecords.map((record) => {
                    const st = (record.status || 'PRESENT').toUpperCase();
                    const isPresent = st === 'PRESENT' || st === 'LATE';
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-semibold text-slate-800">
                          {formatDate(record.date)}
                        </td>
                        <td className="p-4 font-bold text-[#111827]">
                          {record.subject || 'Class Session'}
                        </td>
                        <td className="p-4 font-medium text-slate-600">
                          {record.batchName || 'Main Batch'}
                        </td>
                        <td className="p-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[11px]',
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
                        <td className="p-4 text-slate-500 italic">
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
