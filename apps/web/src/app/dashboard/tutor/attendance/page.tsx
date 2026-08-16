'use client';

import { useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorTimetable } from '@/features/tutor-dashboard/hooks/use-tutor-timetable';
import { useTutorBatches } from '@/features/tutor-dashboard/hooks/use-tutor-batches';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Search,
  Save,
  CheckCheck,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/features/students/utils/student-utils';

interface DummyStudent {
  id: string;
  name: string;
  rollNo: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

function TutorAttendanceContent() {
  const { timetable, isLoading } = useTutorTimetable();
  const { batches: tutorBatchesData } = useTutorBatches();

  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Sample student roster for attendance marking
  const [roster, setRoster] = useState<DummyStudent[]>([
    { id: '1', name: 'Aravind Kumar', rollNo: 'NEET-2026-001', status: 'PRESENT' },
    { id: '2', name: 'Bhavana Sharma', rollNo: 'NEET-2026-002', status: 'PRESENT' },
    { id: '3', name: 'Charan Raj', rollNo: 'NEET-2026-003', status: 'ABSENT' },
    { id: '4', name: 'Divya N', rollNo: 'NEET-2026-004', status: 'PRESENT' },
    { id: '5', name: 'Elango S', rollNo: 'NEET-2026-005', status: 'LATE' },
    { id: '6', name: 'Farhana Parveen', rollNo: 'NEET-2026-006', status: 'PRESENT' },
    { id: '7', name: 'Gokulnath M', rollNo: 'NEET-2026-007', status: 'PRESENT' },
    { id: '8', name: 'Harini V', rollNo: 'NEET-2026-008', status: 'PRESENT' },
  ]);

  const batches = useMemo(() => {
    const list = tutorBatchesData?.batches ?? [];
    return list
      .filter((a) => a.batch !== null)
      .map((a) => ({
        id: a.batch!.id,
        name: a.batch!.name,
        code: a.batch!.code,
      }));
  }, [tutorBatchesData]);

  const filteredRoster = useMemo(() => {
    return roster.filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q);
    });
  }, [roster, search]);

  const toggleStatus = (id: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setRoster((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
    );
    setIsSaved(false);
  };

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    setRoster((prev) => prev.map((s) => ({ ...s, status })));
    setIsSaved(false);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const presentCount = roster.filter((s) => s.status === 'PRESENT' || s.status === 'LATE').length;
  const absentCount = roster.filter((s) => s.status === 'ABSENT').length;
  const totalCount = roster.length;
  const rate = Math.round((presentCount / (totalCount || 1)) * 100);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-violet-600 via-cyan-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-md shadow-cyan-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/20 text-white">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Daily Classroom Attendance Register</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Class Attendance Manager 📋
          </h1>
          <p className="text-cyan-100 text-xs mt-0.5 font-medium">
            Mark student presence, track session absences, and record daily classroom attendance
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center shrink-0 self-start md:self-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-100">Attendance Rate</p>
          <p className="text-2xl sm:text-3xl font-black text-white mt-0.5">{rate}%</p>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Enrolled
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">{totalCount} Students</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Present Today
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">{presentCount}</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Absent Today
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">{absentCount}</p>
          </div>
        </Card>

        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Late Arrivals
            </p>
            <p className="text-2xl font-bold text-[#111827] mt-0.5">
              {roster.filter((s) => s.status === 'LATE').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Control Bar: Batch Selector, Search, Bulk Actions */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Select Batch */}
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <Filter className="h-4 w-4 text-violet-600 shrink-0" />
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="bg-transparent border-0 outline-none text-xs font-bold text-slate-800 w-full cursor-pointer"
            >
              <option value="">Select Batch Section...</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 flex-1">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search student by name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full"
            />
          </div>
        </div>

        {/* Bulk Action Buttons & Save */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => markAll('PRESENT')}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-colors"
          >
            Mark All Present
          </button>
          <button
            type="button"
            onClick={() => markAll('ABSENT')}
            className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors"
          >
            Mark All Absent
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs shadow-violet-200 transition-all cursor-pointer"
          >
            {isSaved ? <CheckCheck className="h-4 w-4 text-emerald-300" /> : <Save className="h-4 w-4" />}
            {isSaved ? 'Saved!' : 'Submit Register'}
          </button>
        </div>
      </div>

      {/* Student Roster Table */}
      <Card className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] bg-slate-50 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-[#111827]">
            Student Attendance Marking List ({filteredRoster.length})
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Date: {formatDate(new Date())}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 border-b border-[#E5E7EB] text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">Roll / Adm Code</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Mark Status</th>
                <th className="p-4 text-right">Quick Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredRoster.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-600">{s.rollNo}</td>
                  <td className="p-4 font-extrabold text-[#111827]">{s.name}</td>
                  <td className="p-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-[11px]',
                        s.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.status === 'ABSENT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200',
                      )}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleStatus(s.id, 'PRESENT')}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors',
                          s.status === 'PRESENT'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-600 hover:bg-emerald-50 border-slate-200',
                        )}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(s.id, 'ABSENT')}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors',
                          s.status === 'ABSENT'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-600 hover:bg-rose-50 border-slate-200',
                        )}
                      >
                        Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleStatus(s.id, 'LATE')}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors',
                          s.status === 'LATE'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-slate-600 hover:bg-amber-50 border-slate-200',
                        )}
                      >
                        Late
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function TutorAttendancePage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR', 'FACULTY', 'TENANT_ADMIN']}>
      <DashboardLayout>
        <TutorAttendanceContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
