'use client';

import { useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useStudentAttendance } from '@/features/student-dashboard/hooks/use-student-attendance';
import type {
  AttendanceRecordDto,
  SubjectAttendanceDto,
} from '@/features/student-dashboard/types/student-dashboard.types';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  UserCheck,
  UserX,
  XCircle,
  ClipboardList,
  RefreshCw,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─── Subject Theme Helpers ───────────────────────────────────────────────────

const SUBJECT_THEMES: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  physics: { bg: 'bg-blue-50/60', text: 'text-[#0052CC]', border: 'border-blue-200', bar: 'bg-[#0052CC]' },
  chemistry: { bg: 'bg-indigo-50/60', text: 'text-indigo-700', border: 'border-indigo-200', bar: 'bg-indigo-600' },
  biology: { bg: 'bg-emerald-50/60', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-600' },
  botany: { bg: 'bg-teal-50/60', text: 'text-teal-700', border: 'border-teal-200', bar: 'bg-teal-600' },
  zoology: { bg: 'bg-sky-50/60', text: 'text-sky-700', border: 'border-sky-200', bar: 'bg-sky-600' },
};

function getSubjectTheme(name: string) {
  const lower = name.toLowerCase();
  return (
    Object.entries(SUBJECT_THEMES).find(([k]) => lower.includes(k))?.[1] ?? {
      bg: 'bg-slate-50',
      text: 'text-[#0052CC]',
      border: 'border-slate-200',
      bar: 'bg-[#0052CC]',
    }
  );
}

function SubjectCard({
  sub,
  isSelected,
  onClick,
}: {
  sub: SubjectAttendanceDto;
  isSelected: boolean;
  onClick: () => void;
}) {
  const theme = getSubjectTheme(sub.subjectName);
  const belowThreshold = sub.rate != null && sub.rate < 75;

  return (
    <Card
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all cursor-pointer flex flex-col justify-between space-y-3 group',
        isSelected
          ? 'border-[#0052CC] bg-blue-50/40 ring-2 ring-blue-100 shadow-xs'
          : belowThreshold
            ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
            : `${theme.border} bg-white hover:border-[#0052CC]/50 hover:shadow-xs`,
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-[#0B2447] truncate group-hover:text-[#0052CC] transition-colors">
              {sub.subjectName}
            </h3>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              {sub.present} of {sub.total} classes attended
            </p>
          </div>

          <span
            className={cn(
              'text-xs font-extrabold px-2.5 py-1 rounded-xl border shrink-0',
              belowThreshold
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200',
            )}
          >
            {sub.rate != null ? `${sub.rate}%` : 'N/A'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
          <div
            className={cn('h-full rounded-full transition-all duration-700', belowThreshold ? 'bg-rose-500' : theme.bar)}
            style={{ width: `${sub.rate ?? 0}%` }}
          />
        </div>

        {belowThreshold && (
          <p className="text-[11px] text-rose-600 font-extrabold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Below 75% requirement — attendance alert</span>
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span
          className={cn(
            'text-[10px] font-extrabold uppercase tracking-wider',
            isSelected ? 'text-[#0052CC]' : 'text-slate-400 group-hover:text-[#0052CC]',
          )}
        >
          {isSelected ? 'Filter Applied ✓' : 'Click to Filter'}
        </span>
        <ChevronRight className={cn('w-4 h-4 transition-transform', isSelected ? 'text-[#0052CC] translate-x-0.5' : 'text-slate-400 group-hover:translate-x-0.5')} />
      </div>
    </Card>
  );
}

function RecordRow({ record }: { record: AttendanceRecordDto }) {
  const isPresent = record.status === 'PRESENT';
  const isAbsent = record.status === 'ABSENT';
  const isLate = record.status === 'LATE' || record.lateMinutes > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-[#0052CC]/40 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            'w-10 h-10 rounded-xl border flex items-center justify-center font-extrabold text-sm shrink-0 shadow-2xs',
            isPresent && 'bg-emerald-50 border-emerald-200 text-emerald-700',
            isAbsent && 'bg-rose-50 border-rose-200 text-rose-700',
            isLate && 'bg-amber-50 border-amber-200 text-amber-700',
          )}
        >
          {(record.subject?.name || 'S').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-extrabold text-[#0B2447] text-sm truncate">
              {record.subject?.name || 'Class Session'}
            </h4>
            {record.date && (
              <span className="text-[10px] text-[#0052CC] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-mono font-extrabold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#0052CC]" />
                {new Date(record.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-500 font-mono truncate">
            {record.startsAt || 'Class Schedule'} • Batch: <span className="text-[#0B2447] font-extrabold">{record.batch?.name || 'Assigned Section'}</span>
          </p>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <span
          className={cn(
            'px-3 py-1 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 shadow-2xs',
            isPresent && 'bg-emerald-50 text-emerald-800 border-emerald-300',
            isAbsent && 'bg-rose-50 text-rose-800 border-rose-300',
            isLate && 'bg-amber-50 text-amber-800 border-amber-300',
          )}
        >
          {isPresent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
          {isAbsent && <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
          {isLate && <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
          <span>{record.status} {record.lateMinutes > 0 ? `(${record.lateMinutes}m late)` : ''}</span>
        </span>
      </div>
    </div>
  );
}

function AttendanceContent() {
  const { attendance, isLoading, error, refetch } = useStudentAttendance();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'LATE'>('ALL');

  const subjects = attendance?.subjectBreakdown || [];
  const records = attendance?.records || [];

  const filteredRecords = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    let list = records.filter((r) => !r.date || r.date <= todayStr);

    if (selectedSubjectId !== 'ALL') {
      list = list.filter((r) => r.subject?.id === selectedSubjectId || r.subject?.name === selectedSubjectId);
    }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'LATE') {
        list = list.filter((r) => r.status === 'LATE' || r.lateMinutes > 0);
      } else {
        list = list.filter((r) => r.status === statusFilter);
      }
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          r.subject?.name?.toLowerCase().includes(term) ||
          r.batch?.name?.toLowerCase().includes(term) ||
          r.date?.includes(term),
      );
    }

    return list;
  }, [records, selectedSubjectId, statusFilter, searchTerm]);

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* ── ISML Light Blue Header Banner ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-3 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Student Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>My Attendance Log</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447]">
            My Attendance Register 📋
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Personal attendance summary, subject breakdown, and complete class presence history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0052CC] border border-blue-200 text-xs font-extrabold shadow-2xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-[#0052CC] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ── KPI Summary Cards ── */}
      {attendance && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border border-blue-200 bg-white p-4 shadow-2xs flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Rate</p>
              <p
                className={cn(
                  'text-xl sm:text-2xl font-extrabold mt-0.5',
                  attendance.summary.rate != null && attendance.summary.rate < 75
                    ? 'text-rose-600'
                    : 'text-[#0052CC]',
                )}
              >
                {attendance.summary.rate != null ? `${attendance.summary.rate}%` : 'N/A'}
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-2xs flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Attended</p>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-0.5">
                {attendance.summary.present} / {attendance.summary.total}
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl border border-rose-200 bg-rose-50/20 p-4 shadow-2xs flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-100 text-rose-700 border border-rose-300 shrink-0">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Absences</p>
              <p className="text-xl sm:text-2xl font-extrabold text-rose-700 mt-0.5">
                {attendance.summary.absent} Classes
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl border border-amber-200 bg-amber-50/20 p-4 shadow-2xs flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-700 border border-amber-300 shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Late Arrivals</p>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-0.5">
                {attendance.summary.late} Classes
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ── Subject Breakdown Section ── */}
      {subjects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#0052CC]" />
              <span>Subject-wise Attendance Breakdown</span>
            </h2>
            {selectedSubjectId !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedSubjectId('ALL')}
                className="text-xs font-extrabold text-[#0052CC] hover:underline cursor-pointer"
              >
                Clear Subject Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => {
              const isSelected = selectedSubjectId === sub.subjectId || selectedSubjectId === sub.subjectName;
              return (
                <SubjectCard
                  key={sub.subjectId}
                  sub={sub}
                  isSelected={isSelected}
                  onClick={() =>
                    setSelectedSubjectId(isSelected ? 'ALL' : sub.subjectId || sub.subjectName)
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Attendance Records List ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#0052CC]" />
            <h2 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider">
              Class Attendance History Logs ({filteredRecords.length})
            </h2>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer',
                  statusFilter === 'ALL'
                    ? 'bg-white text-[#0B2447] shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PRESENT')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer',
                  statusFilter === 'PRESENT'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-700 hover:bg-emerald-50',
                )}
              >
                Present
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ABSENT')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer',
                  statusFilter === 'ABSENT'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-rose-700 hover:bg-rose-50',
                )}
              >
                Absent
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('LATE')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer',
                  statusFilter === 'LATE'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-amber-700 hover:bg-amber-50',
                )}
              >
                Late
              </button>
            </div>

            {/* Subject Select */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0B2447] outline-none focus:border-[#0052CC] cursor-pointer"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.subjectId} value={s.subjectId || s.subjectName}>
                  {s.subjectName}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 w-full sm:w-56">
              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search subject or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full font-medium"
              />
            </div>
          </div>
        </div>

        {/* Records Content List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs font-extrabold text-slate-400 uppercase tracking-widest animate-pulse">
            Loading attendance records...
          </div>
        ) : error ? (
          <Card className="rounded-2xl border border-rose-200 bg-rose-50/20 p-8 text-center shadow-2xs space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-extrabold text-slate-800">Failed to load attendance history</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-[#0052CC] text-white text-xs font-extrabold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </Card>
        ) : filteredRecords.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-[#0B2447]">No Attendance Records Found</h3>
            <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
              Class session presence logs will appear here once recorded by your course tutors.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <RecordRow key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentAttendancePage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <AttendanceContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
