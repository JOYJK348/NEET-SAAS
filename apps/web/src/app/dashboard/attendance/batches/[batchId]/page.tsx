'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useBatchAttendance } from '@/features/attendance/hooks/use-batch-attendance';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  BarChart3,
  Users,
  ClipboardCheck,
  AlertTriangle,
  Search,
  ChevronRight,
  GraduationCap,
  Timer,
  CalendarCheck,
  XCircle,
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
        <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6">
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
      <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6 pb-24 space-y-5">
        {/* Back + Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/attendance')}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900">{batchName}</h1>
            <p className="text-xs text-slate-400 font-mono">{batchCode}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-semibold text-slate-400">Attendance</span>
            </div>
            <p
              className={cn(
                'text-xl font-black mt-1',
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
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-slate-400">Students</span>
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">{totalStudents}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold text-slate-400">Sessions</span>
            </div>
            <p className="text-xl font-black text-slate-900 mt-1">{sessionsConducted}</p>
            <p className="text-[10px] text-slate-400">{sessionsMarked} marked</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-semibold text-slate-400">Below 75%</span>
            </div>
            <p className="text-xl font-black text-rose-600 mt-1">
              {students.filter((s) => (s.rate ?? 0) < 75).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
            />
          </div>
          <button
            onClick={() => setFilterBelow75(!filterBelow75)}
            className={cn(
              'text-xs font-bold px-3 py-2 rounded-xl border transition-colors',
              filterBelow75
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300',
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
            Below 75%
          </button>
        </div>

        {/* Student list */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8 text-slate-300" />}
            title="No students found"
            description={
              search ? 'Try a different search term' : 'No attendance records for this batch yet'
            }
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3">
                      Student
                    </th>
                    <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-3">
                      Present
                    </th>
                    <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-3">
                      Absent
                    </th>
                    <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-3">
                      Late
                    </th>
                    <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-3">
                      %
                    </th>
                    <th className="text-right px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.studentAdmissionId}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-3.5 h-3.5 text-violet-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{s.studentName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{s.studentCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className="text-xs font-bold text-emerald-600">{s.present}</span>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className="text-xs font-bold text-rose-600">{s.absent}</span>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span className="text-xs font-bold text-amber-600">{s.late}</span>
                      </td>
                      <td className="text-center px-3 py-3">
                        <span
                          className={cn(
                            'text-xs font-black px-2 py-0.5 rounded-full',
                            (s.rate ?? 0) >= 75
                              ? 'bg-emerald-100 text-emerald-700'
                              : (s.rate ?? 0) >= 60
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700',
                          )}
                        >
                          {s.rate != null ? `${s.rate}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="text-right px-3 py-3">
                        <Link
                          href={`/dashboard/attendance/students/${s.studentAdmissionId}`}
                          className="text-[10px] font-bold text-violet-600 hover:text-violet-800 hover:underline inline-flex items-center gap-1"
                        >
                          Details <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
