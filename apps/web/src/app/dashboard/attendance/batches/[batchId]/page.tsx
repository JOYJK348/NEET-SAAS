'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useBatchAttendance } from '@/features/attendance/hooks/use-batch-attendance';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  BarChart3,
  Users,
  CalendarCheck,
  AlertTriangle,
  Search,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';

export default function BatchAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;
  const { data, isLoading, error, refetch } = useBatchAttendance(batchId);
  const [search, setSearch] = useState('');
  const [filterBelow75, setFilterBelow75] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6">
          <ErrorState
            title="Failed to load batch attendance"
            message={error.message}
            onRetry={refetch}
            variant="page"
          />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const {
    batchName,
    batchCode,
    overallRate,
    totalStudents,
    sessionsConducted,
    sessionsMarked,
    students,
  } = data;

  const filtered = students.filter((s) => {
    const match =
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(search.toLowerCase());
    return filterBelow75 ? match && (s.rate ?? 0) < 75 : match;
  });

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
        {/* Header Banner - ISML LMS Light Blue Style */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shrink-0"
              onClick={() => router.push('/dashboard/attendance')}
            >
              <ArrowLeft className="h-5 w-5 text-[#0052CC]" />
            </Button>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
                <span>Attendance Overview</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
                <span>Batch Roster ({batchCode})</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">{batchName}</h1>
              <p className="text-xs text-slate-600 font-medium">
                Detailed student attendance roster, session metrics, and performance analytics.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3 transition-all hover:border-[#0052CC]/40">
            <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] shrink-0">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Average Attendance
              </p>
              <p
                className={cn(
                  'text-xl sm:text-2xl font-extrabold mt-0.5',
                  overallRate >= 75
                    ? 'text-emerald-600'
                    : overallRate >= 60
                      ? 'text-amber-600'
                      : 'text-rose-600',
                )}
              >
                {overallRate}%
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3 transition-all hover:border-[#0052CC]/40">
            <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Enrolled Students
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5">
                {totalStudents}
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3 transition-all hover:border-[#0052CC]/40">
            <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shrink-0">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Total Sessions
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-xl sm:text-2xl font-extrabold text-[#0B2447]">
                  {sessionsConducted}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  ({sessionsMarked} marked)
                </span>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3 transition-all hover:border-[#0052CC]/40">
            <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Low Attendance (&lt;75%)
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-0.5">
                {students.filter((s) => (s.rate ?? 0) < 75).length}
              </p>
            </div>
          </Card>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search student by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl h-11 border-slate-200 bg-white focus:border-[#0052CC] text-xs font-bold"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setFilterBelow75(!filterBelow75)}
            className={cn(
              'rounded-xl h-11 px-4 text-xs font-extrabold transition-all w-full sm:w-auto',
              filterBelow75
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-rose-500" />
            {filterBelow75 ? 'Showing Below 75% Only' : 'Filter Below 75%'}
          </Button>
        </div>

        {/* Table Roster */}
        {filtered.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-slate-200 bg-white p-8">
            <EmptyState
              icon={<Users className="h-8 w-8 text-slate-300" />}
              title="No students found"
              description={
                search ? 'Try a different search query' : 'No attendance records for this batch yet'
              }
            />
          </Card>
        ) : (
          <Card className="rounded-2xl border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-4 py-3.5">
                      Student Details
                    </th>
                    <th className="text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-3 py-3.5">
                      Present
                    </th>
                    <th className="text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-3 py-3.5">
                      Absent
                    </th>
                    <th className="text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-3 py-3.5">
                      Late
                    </th>
                    <th className="text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-3 py-3.5">
                      Attendance Rate
                    </th>
                    <th className="text-right px-4 py-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((s) => (
                    <tr
                      key={s.studentAdmissionId}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-[#0052CC]">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-[#0B2447]">{s.studentName}</p>
                            <p className="text-[10px] text-[#0052CC] font-mono font-bold mt-0.5">
                              {s.studentCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center px-3 py-3.5">
                        <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          {s.present}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3.5">
                        <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                          {s.absent}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3.5">
                        <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                          {s.late}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3.5">
                        <span
                          className={cn(
                            'text-xs font-extrabold px-3 py-1 rounded-lg border inline-block',
                            (s.rate ?? 0) >= 75
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : (s.rate ?? 0) >= 60
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200',
                          )}
                        >
                          {s.rate != null ? `${s.rate}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="text-right px-4 py-3.5">
                        <Link
                          href={`/dashboard/attendance/students/${s.studentAdmissionId}`}
                          className="text-xs font-extrabold text-[#0052CC] hover:underline inline-flex items-center gap-1"
                        >
                          View Log <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
