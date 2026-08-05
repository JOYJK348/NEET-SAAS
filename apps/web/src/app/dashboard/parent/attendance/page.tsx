'use client';

import { useEffect, useMemo, useState } from 'react';
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
  UserCheck,
  UserX,
  Search,
  ClipboardList,
  RefreshCw,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { formatDate } from '@/features/students/utils/student-utils';
import { cn } from '@/lib/utils';

// ─── Subject Theme Helpers ──────────────────────────────────────────────────

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
  sb,
  isSelected,
  onClick,
}: {
  sb: { subject: string; percentage: number; presentClasses: number; totalClasses: number };
  isSelected: boolean;
  onClick: () => void;
}) {
  const theme = getSubjectTheme(sb.subject);
  const belowThreshold = sb.percentage < 75;

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
            <h3 className="text-sm font-black text-slate-900 truncate">{sb.subject}</h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {sb.presentClasses} of {sb.totalClasses} classes attended
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
            {sb.percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-700', belowThreshold ? 'bg-rose-500' : theme.bar)}
            style={{ width: `${sb.percentage}%` }}
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

// ─── Record Row Component ─────────────────────────────────────────────────────

function RecordRow({ record }: { record: { id: string; date: string | Date; subject?: string; batchName?: string; status: string; remarks?: string } }) {
  const isPresent = record.status === 'PRESENT';
  const isAbsent = record.status === 'ABSENT';
  const isLate = record.status === 'LATE';

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
          {(record.subject || 'S').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-black text-slate-900 text-sm truncate">
              {record.subject || 'Class Session'}
            </h4>
            {record.date && (
              <span className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-extrabold font-mono">
                📅 {formatDate(record.date)}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-500 font-mono mt-0.5 truncate">
            Batch: <span className="text-slate-900 font-black">{record.batchName || 'NEET Crash Course 2027'}</span>
            {record.remarks && <span className="ml-2 text-slate-500 font-semibold">• {record.remarks}</span>}
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
          <span>{record.status}</span>
        </span>
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

export default function ParentAttendancePage() {
  const { selectedChildId, selectedChild, isLoading: isSwitcherLoading } = useChildSwitcher();
  const [data, setData] = useState<ParentAttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  const fetchAttendance = () => {
    if (!selectedChildId) {
      if (!isSwitcherLoading) setIsLoading(false);
      return;
    }
    setIsLoading(true);
    parentPortalService
      .getAttendance(selectedChildId)
      .then((res) => setData(res))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedChildId, isSwitcherLoading]);

  const attendance = data || {
    overallAttendance: '0%',
    totalClasses: 0,
    presentClasses: 0,
    absentClasses: 0,
    subjectBreakdown: [],
    monthlyBreakdown: [],
    recentRecords: [],
  };

  const batchList = attendance.batchBreakdown || [];
  const subjectList = attendance.subjectBreakdown || [];
  const records = attendance.recentRecords || [];

  const filteredRecords = useMemo(() => {
    let list = records;

    if (selectedBatchId !== 'ALL') {
      list = list.filter((r) => r.batchId === selectedBatchId || r.batchName === selectedBatchId);
    }

    if (selectedSubject !== 'ALL') {
      list = list.filter((r) => r.subject === selectedSubject);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          r.subject?.toLowerCase().includes(term) ||
          r.batchName?.toLowerCase().includes(term) ||
          String(r.date).toLowerCase().includes(term) ||
          r.remarks?.toLowerCase().includes(term),
      );
    }

    return list;
  }, [records, selectedBatchId, selectedSubject, searchTerm]);

  if (isLoading || isSwitcherLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="text-left sm:text-center flex-1 space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            CHILD ATTENDANCE WORKLOAD
          </h1>
          <p className="text-xs font-bold text-slate-500">
            Attendance monitoring for <span className="text-slate-900 font-extrabold">{selectedChild?.name || 'Student'}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAttendance}
          disabled={isLoading}
          className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-all disabled:opacity-50 shadow-2xs shrink-0 cursor-pointer"
          title="Refresh attendance records"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 via-white to-white p-5 shadow-2xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 border border-violet-200 text-violet-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Overall Attendance</p>
            <p className="text-2xl font-black text-violet-700 mt-0.5">
              {attendance.overallAttendance}
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
              {attendance.presentClasses} / {attendance.totalClasses}
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
              {attendance.absentClasses} Classes
            </p>
          </div>
        </Card>

        <Card className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-white p-5 shadow-2xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Sessions</p>
            <p className="text-2xl font-black text-amber-700 mt-0.5">
              {attendance.totalClasses} Sessions
            </p>
          </div>
        </Card>
      </div>

      {/* ── Batch-wise Attendance Breakdown Cards ────────────────────────── */}
      {batchList.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">
            Batch-wise Attendance Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batchList.map((b) => {
              const isSelected = selectedBatchId === b.batchId || selectedBatchId === b.batchName;

              return (
                <Card
                  key={b.batchId}
                  onClick={() => setSelectedBatchId(isSelected ? 'ALL' : b.batchId || b.batchName)}
                  className={cn(
                    'rounded-3xl border p-5 shadow-2xs flex flex-col justify-between transition-all cursor-pointer',
                    isSelected
                      ? 'border-violet-500 bg-violet-50/50 ring-2 ring-violet-500/30'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/50',
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1 border',
                          isSelected
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-violet-50 border-violet-100 text-violet-700',
                        )}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        {b.batchName}
                      </span>

                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-black">
                        {b.percentage}% ATTENDED
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Attended: {b.presentClasses}</span>
                      <span>Total Sessions: {b.totalClasses}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      className={cn(
                        'w-full py-2.5 rounded-xl text-xs font-extrabold transition-all text-center shadow-2xs border',
                        isSelected
                          ? 'bg-violet-600 text-white border-violet-600 shadow-violet-600/20'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50',
                      )}
                    >
                      {isSelected ? 'Selected (Showing Batch Records)' : `Click to View ${b.batchName} Records`}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Subject Breakdown Summary Cards ───────────────────────────────── */}
      {subjectList.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">
            Subject-wise Attendance Breakdown
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectList.map((sb) => {
              const isSelected = selectedSubject === sb.subject;
              return (
                <SubjectCard
                  key={sb.subject}
                  sb={sb}
                  isSelected={isSelected}
                  onClick={() => setSelectedSubject(isSelected ? 'ALL' : sb.subject)}
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
              Student Attendance Record History ({filteredRecords.length})
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
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Batches</option>
              {batchList.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  {b.batchName}
                </option>
              ))}
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Subjects</option>
              {subjectList.map((s) => (
                <option key={s.subject} value={s.subject}>
                  {s.subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* List Content */}
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-black text-slate-800">No Attendance Records Found</p>
            <p className="text-xs text-slate-400 mt-1">
              Records will appear here once session attendance is marked by tutors.
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
