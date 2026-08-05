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
  Sparkles,
  UserCheck,
  UserX,
  XCircle,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─── Subject Theme Colors ─────────────────────────────────────────────────────

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  physics: { bg: 'bg-blue-50/70', text: 'text-blue-700', border: 'border-blue-200/80', bar: 'bg-blue-500' },
  chemistry: { bg: 'bg-emerald-50/70', text: 'text-emerald-700', border: 'border-emerald-200/80', bar: 'bg-emerald-500' },
  biology: { bg: 'bg-rose-50/70', text: 'text-rose-700', border: 'border-rose-200/80', bar: 'bg-rose-500' },
  botany: { bg: 'bg-green-50/70', text: 'text-green-700', border: 'border-green-200/80', bar: 'bg-green-500' },
  zoology: { bg: 'bg-pink-50/70', text: 'text-pink-700', border: 'border-pink-200/80', bar: 'bg-pink-500' },
};

function getSubjectTheme(name: string) {
  const lower = name.toLowerCase();
  return (
    Object.entries(SUBJECT_COLORS).find(([k]) => lower.includes(k))?.[1] ?? {
      bg: 'bg-violet-50/70',
      text: 'text-violet-700',
      border: 'border-violet-200/80',
      bar: 'bg-violet-500',
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
        'rounded-3xl border p-5 shadow-2xs transition-all cursor-pointer flex flex-col justify-between',
        isSelected
          ? 'border-violet-500 bg-violet-50/50 ring-2 ring-violet-500/30'
          : belowThreshold
            ? 'border-rose-200 bg-rose-50/30 hover:bg-rose-50/50'
            : `${theme.border} ${theme.bg} hover:shadow-xs`,
      )}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900 truncate">{sub.subjectName}</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {sub.present} of {sub.total} classes attended
            </p>
          </div>

          <span
            className={cn(
              'text-xs font-black px-2.5 py-1 rounded-xl border shrink-0',
              belowThreshold
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : 'bg-white text-emerald-800 border-emerald-200',
            )}
          >
            {sub.rate != null ? `${sub.rate}%` : 'N/A'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700', belowThreshold ? 'bg-rose-500' : theme.bar)}
            style={{ width: `${sub.rate ?? 0}%` }}
          />
        </div>

        {belowThreshold && (
          <p className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1">
            <span>⚠️ Below 75% — attendance alert</span>
          </p>
        )}
      </div>

      <div className="pt-3 mt-2 border-t border-slate-200/60">
        <span className="text-[10px] font-extrabold text-violet-700 uppercase tracking-wider">
          {isSelected ? 'Selected (Showing Subject Records)' : 'Click to Filter Records'}
        </span>
      </div>
    </Card>
  );
}

// ─── Record Row Component (Matching Tutor Page Style) ─────────────────────────

function RecordRow({ record }: { record: AttendanceRecordDto }) {
  const isPresent = record.status === 'PRESENT';
  const isAbsent = record.status === 'ABSENT';
  const isLate = record.status === 'LATE' || record.lateMinutes > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-violet-200 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            'w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm shrink-0',
            isPresent && 'bg-emerald-100 border-emerald-200 text-emerald-700',
            isAbsent && 'bg-rose-100 border-rose-200 text-rose-700',
            isLate && 'bg-amber-100 border-amber-200 text-amber-700',
          )}
        >
          {(record.subject?.name || 'S').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-black text-slate-900 text-sm truncate">
              {record.subject?.name || 'Class Session'}
            </h4>
            {record.date && (
              <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-extrabold font-mono">
                📅 {new Date(record.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-500 font-mono mt-0.5 truncate">
            {record.startsAt || 'Class Schedule'} • Batch: <span className="text-slate-900 font-black">{record.batch?.name || 'Assigned Section'}</span>
          </p>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <span
          className={cn(
            'px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5',
            isPresent && 'bg-emerald-50 text-emerald-700 border-emerald-200',
            isAbsent && 'bg-rose-50 text-rose-700 border-rose-200',
            isLate && 'bg-amber-50 text-amber-700 border-amber-200',
          )}
        >
          {isPresent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          {isAbsent && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
          {isLate && <Clock className="w-3.5 h-3.5 text-amber-600" />}
          <span>{record.status} {record.lateMinutes > 0 ? `(${record.lateMinutes}m)` : ''}</span>
        </span>
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function AttendanceContent() {
  const { attendance, isLoading, error, refetch } = useStudentAttendance();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');

  const subjects = attendance?.subjectBreakdown || [];
  const records = attendance?.records || [];

  const filteredRecords = useMemo(() => {
    let list = records;

    if (selectedSubjectId !== 'ALL') {
      list = list.filter((r) => r.subject?.id === selectedSubjectId || r.subject?.name === selectedSubjectId);
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
  }, [records, selectedSubjectId, searchTerm]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="text-left sm:text-center flex-1 space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            MY ATTENDANCE WORKLOAD
          </h1>
          <p className="text-xs font-bold text-slate-500">
            Personal attendance summary, subject breakdown & session history log
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-all disabled:opacity-50 shadow-2xs shrink-0 cursor-pointer"
          title="Refresh attendance records"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────────────── */}
      {attendance && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 via-white to-white p-5 shadow-2xs flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 border border-violet-200 text-violet-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Overall Attendance</p>
              <p
                className={cn(
                  'text-2xl font-black mt-0.5',
                  attendance.summary.rate != null && attendance.summary.rate < 75
                    ? 'text-rose-600'
                    : 'text-violet-700',
                )}
              >
                {attendance.summary.rate != null ? `${attendance.summary.rate}%` : 'N/A'}
              </p>
            </div>
          </Card>

          <Card className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-white p-5 shadow-2xs flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Classes Attended</p>
              <p className="text-2xl font-black text-emerald-700 mt-0.5">
                {attendance.summary.present} / {attendance.summary.total}
              </p>
            </div>
          </Card>

          <Card className="rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50/60 via-white to-white p-5 shadow-2xs flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Absences Recorded</p>
              <p className="text-2xl font-black text-rose-700 mt-0.5">
                {attendance.summary.absent} Classes
              </p>
            </div>
          </Card>

          <Card className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-white p-5 shadow-2xs flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Late Arrivals</p>
              <p className="text-2xl font-black text-amber-700 mt-0.5">
                {attendance.summary.late} Classes
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ── Subject Breakdown Summary Cards ───────────────────────────────── */}
      {subjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">
            Subject-wise Attendance Breakdown
          </h2>

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

      {/* ── Detailed Attendance Log Queue List ──────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-violet-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Personal Session Attendance Log ({filteredRecords.length})
            </h2>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-violet-500"
              />
            </div>

            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.subjectId} value={s.subjectId || s.subjectName}>
                  {s.subjectName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* List Content */}
        {isLoading ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-400">
            Loading attendance records...
          </div>
        ) : error ? (
          <Card className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xs">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Failed to load attendance history</p>
            <button
              onClick={refetch}
              className="mt-3 text-xs font-bold text-violet-600 hover:underline"
            >
              Try again
            </button>
          </Card>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-black text-slate-800">No Attendance Records Found</p>
            <p className="text-xs text-slate-400 mt-1">
              Records will appear here once your tutor marks session attendance.
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

// ─── Export ───────────────────────────────────────────────────────────────────

export default function StudentAttendancePage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <AttendanceContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
