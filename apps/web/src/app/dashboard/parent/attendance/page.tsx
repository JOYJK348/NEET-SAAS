'use client';

import { useEffect, useState } from 'react';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type { ParentAttendanceData } from '@/features/parent-portal/types/parent-portal';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Atom,
  FlaskConical,
  Sprout,
  Dna,
  TrendingUp,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '@/features/students/utils/student-utils';

export default function ParentAttendancePage() {
  const { selectedChildId, selectedChild } = useChildSwitcher();
  const [data, setData] = useState<ParentAttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedChildId) return;
    let isMounted = true;
    setIsLoading(true);
    parentPortalService
      .getAttendance(selectedChildId)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedChildId]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const attendance = data || {
    overallAttendance: '0%',
    totalClasses: 0,
    presentClasses: 0,
    absentClasses: 0,
    subjectBreakdown: [],
    monthlyBreakdown: [],
    recentRecords: [],
  };

  const getSubjectIcon = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('physic')) return <Atom className="h-5 w-5 text-indigo-600" />;
    if (s.includes('chem')) return <FlaskConical className="h-5 w-5 text-emerald-600" />;
    if (s.includes('botan') || s.includes('plant'))
      return <Sprout className="h-5 w-5 text-teal-600" />;
    if (s.includes('zoo') || s.includes('bio')) return <Dna className="h-5 w-5 text-[#7C3AED]" />;
    return <BookOpen className="h-5 w-5 text-blue-600" />;
  };

  const getSubjectColor = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('physic')) return 'bg-indigo-50 border-indigo-100 text-indigo-700';
    if (s.includes('chem')) return 'bg-violet-50 border-violet-100 text-violet-700';
    if (s.includes('botan')) return 'bg-emerald-50 border-emerald-100 text-emerald-700';
    if (s.includes('zoo') || s.includes('bio'))
      return 'bg-purple-50 border-purple-100 text-purple-700';
    return 'bg-violet-50 border-violet-100 text-violet-700';
  };

  const getStatusBadge = (pct: number) => {
    if (pct >= 85) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
          <Award className="h-3 w-3 text-emerald-600" />
          Excellent
        </span>
      );
    } else if (pct >= 75) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
          <Clock className="h-3 w-3 text-amber-600" />
          Good
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
          <AlertTriangle className="h-3 w-3 text-rose-600" />
          Needs Attention
        </span>
      );
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
            Attendance Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            Classroom Attendance Record
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tracking subject-wise attendance and performance for{' '}
            <strong className="text-slate-900">{selectedChild?.name || 'Student'}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <Calendar className="h-6 w-6 text-violet-600" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Overall Rate</p>
            <p className="text-xl font-black text-slate-900">{attendance.overallAttendance}</p>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Attendance Rate
            </p>
            <p className="text-2xl font-black text-violet-600 mt-0.5">
              {attendance.overallAttendance}
            </p>
          </div>
        </Card>

        <Card className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Classes
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{attendance.totalClasses}</p>
          </div>
        </Card>

        <Card className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Present</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">
              {attendance.presentClasses}
            </p>
          </div>
        </Card>

        <Card className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Absent</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{attendance.absentClasses}</p>
          </div>
        </Card>
      </div>

      {/* Subject-Wise Attendance Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-600" />
            Subject-Wise Attendance Breakdown
          </h2>
          <span className="text-xs text-slate-400 font-semibold">NEET Curriculum Subjects</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {attendance.subjectBreakdown && attendance.subjectBreakdown.length > 0 ? (
            attendance.subjectBreakdown.map((sb) => (
              <Card
                key={sb.subject}
                className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2.5 rounded-xl border ${getSubjectColor(sb.subject)}`}>
                      {getSubjectIcon(sb.subject)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{sb.subject}</h4>
                      <p className="text-[11px] text-slate-400 font-semibold">
                        {sb.presentClasses} of {sb.totalClasses} classes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500">Attendance</span>
                    <span className="font-mono text-violet-700 text-sm">{sb.percentage}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sb.percentage >= 85
                          ? 'bg-emerald-500'
                          : sb.percentage >= 75
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${sb.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  {getStatusBadge(sb.percentage)}
                  <span className="text-[11px] font-bold text-slate-400">
                    {sb.totalClasses - sb.presentClasses > 0
                      ? `${sb.totalClasses - sb.presentClasses} Absent`
                      : '100% Present'}
                  </span>
                </div>
              </Card>
            ))
          ) : (
            <Card className="col-span-full p-8 text-center text-slate-400 rounded-3xl bg-white border border-slate-200">
              No subject-wise attendance recorded yet.
            </Card>
          )}
        </div>
      </div>

      {/* Monthly Breakdown */}
      <Card className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-base border-b border-slate-100 pb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-violet-600" />
          Monthly Attendance Trend
        </h3>

        <div className="space-y-4 pt-1">
          {attendance.monthlyBreakdown.length > 0 ? (
            attendance.monthlyBreakdown.map((m) => (
              <div key={m.month} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">{m.month}</span>
                  <span className="font-mono text-violet-600">{m.percentage}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-600 rounded-full transition-all duration-500"
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-2">No monthly breakdown available.</p>
          )}
        </div>
      </Card>

      {/* Recent Records Log */}
      <Card className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-violet-600" />
            Class Attendance Log
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            {attendance.recentRecords.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Subject</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.recentRecords.length > 0 ? (
                attendance.recentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">{formatDate(r.date)}</td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                        {r.subject || 'NEET Class'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          r.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-700'
                            : r.status === 'LATE'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {r.status === 'PRESENT' ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        ) : r.status === 'LATE' ? (
                          <Clock className="h-3 w-3 text-amber-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-rose-600" />
                        )}
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {r.remarks || 'Regular class attendance'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No detailed attendance logs recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
