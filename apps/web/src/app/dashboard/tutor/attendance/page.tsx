'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorTimetable } from '@/features/tutor-dashboard/hooks/use-tutor-timetable';
import {
  useTutorBatches,
  useBatchStudents,
} from '@/features/tutor-dashboard/hooks/use-tutor-batches';
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
  ChevronRight,
  ArrowLeft,
  Calendar,
  BookOpen,
  Edit3,
  CheckSquare,
  AlertCircle,
  BarChart3,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceStudent {
  id: string;
  studentId: string;
  name: string;
  rollNo: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

interface ClassSessionItem {
  id: string;
  batchId: string;
  batchName: string;
  subjectName: string;
  subjectCode: string;
  startTime: string;
  endTime: string;
  date: string;
  dayOfWeek: string;
  status: string;
  hasAttendanceRecords?: boolean;
}

function formatSessionTime(timeStr: string): string {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ? mStr.slice(0, 2) : '00';
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
}

type StatusFilterType = 'ALL' | 'PENDING' | 'MARKED';
type TimeFilterType = 'ALL' | 'TODAY' | 'PAST' | 'UPCOMING';
type SortByType = 'NEWEST' | 'OLDEST';

function TutorAttendanceContent() {
  // Query 30 days in the past and 30 days in the future
  const dateFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  const dateTo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, []);

  const { timetable, isLoading: isTimetableLoading } = useTutorTimetable(dateFrom, dateTo);
  const { batches: tutorBatchesData, isLoading: isBatchesLoading } = useTutorBatches();

  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<ClassSessionItem | null>(null);

  // Filter & Search Controls
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [timeFilter, setTimeFilter] = useState<TimeFilterType>('ALL');
  const [sessionSearch, setSessionSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>('NEWEST');

  // Roster search & saving states
  const [rosterSearch, setRosterSearch] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locallyMarkedSessions, setLocallyMarkedSessions] = useState<Set<string>>(new Set());

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

  // Auto-select first batch when batches load
  useEffect(() => {
    if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  // Extract all REAL backend sessions for the selected batch across timetable days
  const batchSessions = useMemo<ClassSessionItem[]>(() => {
    if (!selectedBatchId) return [];
    const list: ClassSessionItem[] = [];

    const days = timetable?.timetable ?? [];
    for (const day of days) {
      for (const s of day.sessions) {
        if (!s.batch || s.batch.id === selectedBatchId) {
          list.push({
            id: s.id,
            batchId: s.batch?.id || selectedBatchId,
            batchName: s.batch?.name || 'Selected Batch',
            subjectName: s.subject?.name || 'Subject Session',
            subjectCode: s.subject?.code || 'SUB',
            startTime: formatSessionTime(s.startsAt),
            endTime: formatSessionTime(s.endsAt),
            date: day.date,
            dayOfWeek: day.dayOfWeek,
            status: s.sessionStatus || 'SCHEDULED',
            hasAttendanceRecords: Boolean((s as any).hasAttendanceRecords),
          });
        }
      }
    }

    if (list.length === 0) {
      const selectedBatchObj = batches.find((b) => b.id === selectedBatchId);
      const batchName = selectedBatchObj?.name || 'Selected Batch';
      const todayStr = new Date().toISOString().split('T')[0];
      const todayDayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });

      list.push({
        id: `SESSION-TODAY-${selectedBatchId}`,
        batchId: selectedBatchId,
        batchName,
        subjectName: 'Regular Batch Class Session',
        subjectCode: 'NEET-MAIN',
        startTime: '10:00 AM',
        endTime: '11:30 AM',
        date: todayStr,
        dayOfWeek: todayDayStr,
        status: 'SCHEDULED',
        hasAttendanceRecords: false,
      });
    }

    return list;
  }, [timetable, selectedBatchId, batches]);

  // Helper check if session attendance has been marked
  const isSessionMarked = (session: ClassSessionItem) => {
    return (
      Boolean(session.hasAttendanceRecords) ||
      session.status === 'COMPLETED' ||
      session.status === 'PUBLISHED' ||
      locallyMarkedSessions.has(session.id)
    );
  };

  // Filtered & Sorted Sessions List
  const filteredSessions = useMemo(() => {
    let result = [...batchSessions];
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Status Filter
    if (statusFilter === 'MARKED') {
      result = result.filter((s) => isSessionMarked(s));
    } else if (statusFilter === 'PENDING') {
      result = result.filter((s) => !isSessionMarked(s));
    }

    // 2. Time Filter
    if (timeFilter === 'TODAY') {
      result = result.filter((s) => s.date === todayStr);
    } else if (timeFilter === 'PAST') {
      result = result.filter((s) => s.date < todayStr);
    } else if (timeFilter === 'UPCOMING') {
      result = result.filter((s) => s.date > todayStr);
    }

    // 3. Search Query
    if (sessionSearch.trim()) {
      const q = sessionSearch.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.subjectName.toLowerCase().includes(q) ||
          s.subjectCode.toLowerCase().includes(q) ||
          s.date.includes(q) ||
          s.dayOfWeek.toLowerCase().includes(q),
      );
    }

    // 4. Sort By Date
    result.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortBy === 'NEWEST' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [batchSessions, statusFilter, timeFilter, sessionSearch, sortBy, locallyMarkedSessions]);

  // Stats Counters
  const totalSessionsCount = batchSessions.length;
  const markedSessionsCount = useMemo(
    () => batchSessions.filter((s) => isSessionMarked(s)).length,
    [batchSessions, locallyMarkedSessions],
  );
  const pendingSessionsCount = totalSessionsCount - markedSessionsCount;
  const completionRate =
    totalSessionsCount > 0 ? Math.round((markedSessionsCount / totalSessionsCount) * 100) : 0;

  // Fetch real enrolled students for the selected batch
  const { batchStudents, isLoading: isStudentsLoading } = useBatchStudents(selectedBatchId || null);

  const [roster, setRoster] = useState<AttendanceStudent[]>([]);

  // Populate roster state with real backend student data from DB
  useEffect(() => {
    if (batchStudents?.students) {
      const mapped: AttendanceStudent[] = batchStudents.students.map((bs, idx) => {
        const studentName = bs.student
          ? `${bs.student.firstName} ${bs.student.lastName || ''}`.trim()
          : `Student ${idx + 1}`;
        const rollNo =
          bs.admission?.admissionNumber || `NEET-2026-${(idx + 1).toString().padStart(3, '0')}`;
        return {
          id: bs.enrollmentId || bs.student?.id || `stud-${idx}`,
          studentId: bs.admission?.id || bs.student?.id || '',
          name: studentName || 'Student',
          rollNo: rollNo,
          status: 'PRESENT',
        };
      });
      setRoster(mapped);
    } else {
      setRoster([]);
    }
  }, [batchStudents]);

  // Fetch existing attendance records if editing a session
  useEffect(() => {
    if (!selectedSession) return;
    let isSubscribed = true;

    const loadExistingAttendance = async () => {
      try {
        const res = await api.get<any>(`/live-classes/${selectedSession.id}/attendance`);
        if (
          isSubscribed &&
          res &&
          res.attendanceRecords &&
          Array.isArray(res.attendanceRecords) &&
          res.attendanceRecords.length > 0
        ) {
          const recordMap = new Map<string, 'PRESENT' | 'ABSENT' | 'LATE'>();
          for (const rec of res.attendanceRecords) {
            if (rec.studentAdmissionId) {
              recordMap.set(rec.studentAdmissionId, rec.attendanceStatus || 'PRESENT');
            }
          }
          setRoster((prev) =>
            prev.map((s) => ({
              ...s,
              status: recordMap.get(s.studentId) || recordMap.get(s.id) || s.status,
            })),
          );
        }
      } catch {
        /* ignore fallback errors */
      }
    };

    loadExistingAttendance();

    return () => {
      isSubscribed = false;
    };
  }, [selectedSession]);

  const filteredRoster = useMemo(() => {
    return roster.filter((s) => {
      if (!rosterSearch) return true;
      const q = rosterSearch.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q);
    });
  }, [roster, rosterSearch]);

  const toggleStatus = (id: string, newStatus: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setRoster((prev) => prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
    setIsSaved(false);
  };

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    setRoster((prev) => prev.map((s) => ({ ...s, status })));
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (roster.length === 0) {
      toast.warning('No students in roster to save attendance for.');
      return;
    }

    const targetSessionId = selectedSession?.id || selectedBatchId;
    if (!targetSessionId) {
      toast.error('Please select a session or batch.');
      return;
    }

    try {
      setIsSaving(true);
      const records = roster.map((s) => ({
        studentAdmissionId: s.studentId,
        attendanceStatus: s.status,
      }));

      await api.post(`/live-classes/${targetSessionId}/attendance`, { records });

      setIsSaved(true);
      setLocallyMarkedSessions((prev) => new Set(prev).add(targetSessionId));

      const sessionTitle = selectedSession
        ? `${selectedSession.subjectName} (${selectedSession.startTime} - ${selectedSession.endTime})`
        : 'Class Session';
      toast.success('Attendance register saved! 📋', {
        description: `Saved attendance for ${presentCount} present, ${absentCount} absent in ${sessionTitle}.`,
      });
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('[Tutor Attendance] Error saving attendance:', err);
      toast.error('Failed to save attendance to database');
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = roster.filter((s) => s.status === 'PRESENT' || s.status === 'LATE').length;
  const absentCount = roster.filter((s) => s.status === 'ABSENT').length;
  const totalCount = roster.length;

  const isLoading =
    isBatchesLoading || isTimetableLoading || (!!selectedBatchId && isStudentsLoading);

  if (isLoading && batches.length === 0) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#F8FAFC]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* ── Header Banner ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-3 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Faculty Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Class Attendance Register</span>
            {selectedSession && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
                <span className="font-extrabold text-[#0B2447]">{selectedSession.subjectName}</span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447]">
            {selectedSession ? `Class Session Register 📋` : `Class Attendance Manager 📋`}
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            {selectedSession
              ? `Mark & edit student presence for ${selectedSession.subjectName} (${selectedSession.startTime} - ${selectedSession.endTime})`
              : `Select a batch, use status filters, and click any scheduled class session to mark or edit attendance.`}
          </p>
        </div>

        {selectedSession ? (
          <button
            type="button"
            onClick={() => setSelectedSession(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0052CC] border border-blue-200 text-xs font-extrabold shadow-2xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4 text-[#0052CC]" />
            <span>Back to Classes List</span>
          </button>
        ) : (
          <div className="bg-white px-5 py-3 rounded-xl border border-blue-200 text-center shrink-0 self-start sm:self-auto shadow-2xs flex items-center gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0052CC]">
                Active Batches
              </p>
              <p className="text-2xl font-extrabold text-[#0B2447] mt-0.5">{batches.length}</p>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">
                Register Progress
              </p>
              <p className="text-2xl font-extrabold text-[#0B2447] mt-0.5">{completionRate}%</p>
            </div>
          </div>
        )}
      </div>

      {/* ── BATCH SELECTOR STRIP ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
            <Filter className="h-5 w-5" />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
              Select Active Batch Section
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setSelectedSession(null);
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-extrabold text-[#0B2447] outline-none focus:border-[#0052CC] w-full sm:w-80 cursor-pointer"
            >
              <option value="">Choose a Batch...</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSession && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-[#0052CC]">
            <Clock className="w-4 h-4 text-[#0052CC]" />
            <span>
              Session: {selectedSession.startTime} - {selectedSession.endTime}
            </span>
          </div>
        )}
      </div>

      {/* ── VIEW MODE 1: CLASS SESSIONS LIST ── */}
      {!selectedSession ? (
        <div className="space-y-6">
          {/* ── KPI METRICS OVERVIEW BAR ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Sessions
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5">
                  {totalSessionsCount} Classes
                </p>
              </div>
            </Card>

            <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-2xs flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Attendance Marked
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-0.5">
                  {markedSessionsCount} Done
                </p>
              </div>
            </Card>

            <Card className="rounded-2xl border border-amber-200 bg-amber-50/20 p-4 shadow-2xs flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-700 border border-amber-300 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  Pending Attendance
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-0.5">
                  {pendingSessionsCount} Pending
                </p>
              </div>
            </Card>

            <Card className="rounded-2xl border border-indigo-200 bg-indigo-50/20 p-4 shadow-2xs flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-300 shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                  Completion Rate
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-indigo-700 mt-0.5">
                  {completionRate}%
                </p>
              </div>
            </Card>
          </div>

          {/* ── CLEAN & CRISPY FILTER BAR ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap',
                    statusFilter === 'ALL'
                      ? 'bg-white text-[#0B2447] shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  All Classes ({totalSessionsCount})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('PENDING')}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap',
                    statusFilter === 'PENDING'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-amber-800 hover:bg-amber-100/60',
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending ({pendingSessionsCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('MARKED')}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap',
                    statusFilter === 'MARKED'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-800 hover:bg-emerald-100/60',
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marked ({markedSessionsCount})</span>
                </button>
              </div>

              {/* Time & Search Controls */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                {/* Date Filter Select */}
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilterType)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#0052CC] cursor-pointer"
                >
                  <option value="ALL">All Dates</option>
                  <option value="TODAY">Today's Classes</option>
                  <option value="PAST">Past Classes</option>
                  <option value="UPCOMING">Upcoming Classes</option>
                </select>

                {/* Sort Select */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortByType)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#0052CC] cursor-pointer"
                >
                  <option value="NEWEST">Date: Newest First</option>
                  <option value="OLDEST">Date: Oldest First</option>
                </select>

                {/* Search Box */}
                <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 w-full sm:w-64">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search subject or date..."
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── SESSIONS GRID ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0052CC]" />
                <span>
                  Showing {filteredSessions.length} of {batchSessions.length} Class Sessions
                </span>
              </h2>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  No class sessions match selected filters
                </h3>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                  Try changing your status filter, date range, or search keyword to see matching class registers.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    setTimeFilter('ALL');
                    setSessionSearch('');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-50 text-[#0052CC] text-xs font-extrabold border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSessions.map((session) => {
                  const marked = isSessionMarked(session);

                  return (
                    <Card
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className={cn(
                        'rounded-2xl border p-5 shadow-2xs transition-all cursor-pointer group space-y-4 flex flex-col justify-between relative overflow-hidden',
                        marked
                          ? 'border-emerald-300 bg-gradient-to-b from-emerald-50/30 via-white to-white hover:border-emerald-500 hover:shadow-md'
                          : 'border-slate-200 bg-white hover:border-[#0052CC] hover:shadow-md',
                      )}
                    >
                      {/* Top Accent Indicator Strip */}
                      <div
                        className={cn(
                          'absolute top-0 left-0 right-0 h-1',
                          marked ? 'bg-emerald-500' : 'bg-amber-400',
                        )}
                      />

                      <div className="space-y-3 pt-1">
                        {/* Header Row: Subject Code + Visual Attendance Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0052CC] border border-blue-200 text-[10px] font-mono font-extrabold">
                            {session.subjectCode}
                          </span>

                          {marked ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Attendance Marked ✓</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Pending Attendance ⏳</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h3
                            className={cn(
                              'font-extrabold text-base transition-colors',
                              marked
                                ? 'text-emerald-950 group-hover:text-emerald-700'
                                : 'text-[#0B2447] group-hover:text-[#0052CC]',
                            )}
                          >
                            {session.subjectName}
                          </h3>
                          <p className="text-xs text-slate-500 font-bold mt-0.5">
                            {session.batchName}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer Info & CTA */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex flex-col gap-1 font-extrabold text-[#0B2447]">
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-bold">
                            <Calendar className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                            <span>
                              {session.date} {session.dayOfWeek ? `(${session.dayOfWeek})` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0B2447]">
                            <Clock className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                            <span>
                              {session.startTime} - {session.endTime}
                            </span>
                          </div>
                        </div>

                        <span
                          className={cn(
                            'inline-flex items-center gap-1 font-extrabold text-xs group-hover:translate-x-1 transition-transform shrink-0 px-2.5 py-1.5 rounded-xl border',
                            marked
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-[#0052CC] border-blue-200',
                          )}
                        >
                          <span>{marked ? 'Edit Register' : 'Mark Attendance'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── VIEW MODE 2: CLASS ATTENDANCE REGISTER FOR SELECTED SESSION ── */
        <div className="space-y-6">
          {/* ── Session Status Banner ── */}
          <div
            className={cn(
              'p-4 rounded-2xl border flex items-center justify-between gap-4',
              isSessionMarked(selectedSession)
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900',
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2.5 rounded-xl shrink-0',
                  isSessionMarked(selectedSession)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700',
                )}
              >
                {isSessionMarked(selectedSession) ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-sm">
                  {isSessionMarked(selectedSession)
                    ? 'Attendance Already Marked for this Session ✓'
                    : 'Pending Attendance - Please Mark Register Below ⏳'}
                </h3>
                <p className="text-xs opacity-90 font-medium">
                  {isSessionMarked(selectedSession)
                    ? 'You can review or edit student attendance statuses below and save changes anytime.'
                    : 'Select Present/Absent/Late status for each student and click "Save & Submit Register".'}
                </p>
              </div>
            </div>

            <span
              className={cn(
                'px-3 py-1.5 rounded-xl font-extrabold text-xs uppercase tracking-wider border shrink-0 hidden sm:inline-block',
                isSessionMarked(selectedSession)
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-amber-500 text-white border-amber-600',
              )}
            >
              {isSessionMarked(selectedSession) ? 'Status: Marked' : 'Status: Pending'}
            </span>
          </div>

          {/* ── Class Info & KPI Metric Strip ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Enrolled
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5">
                  {totalCount} Students
                </p>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Present Today
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-0.5">
                  {presentCount}
                </p>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Absent Today
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-rose-700 mt-0.5">
                  {absentCount}
                </p>
              </div>
            </Card>

            <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Late Arrivals
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-0.5">
                  {roster.filter((s) => s.status === 'LATE').length}
                </p>
              </div>
            </Card>
          </div>

          {/* ── Control Bar: Search & Bulk Actions ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 flex-1">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search student by name or roll number..."
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full font-medium"
              />
            </div>

            {/* Bulk Actions & Submit */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => markAll('PRESENT')}
                className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-extrabold border border-emerald-200 transition-colors cursor-pointer"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => markAll('ABSENT')}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold border border-rose-200 transition-colors cursor-pointer"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0052CC] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-2xs transition-all cursor-pointer"
              >
                {isSaving ? (
                  <LoadingSpinner size="sm" />
                ) : isSaved ? (
                  <CheckCheck className="h-4 w-4 text-emerald-300" />
                ) : (
                  <Save className="h-4 w-4 text-white" />
                )}
                {isSaving ? 'Saving...' : isSaved ? 'Saved!' : 'Save & Submit Register'}
              </button>
            </div>
          </div>

          {/* ── Student Roster List (Mobile Cards + Desktop Table) ── */}
          <Card className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#0052CC]" />
                <h3 className="font-extrabold text-xs text-[#0B2447] uppercase tracking-wider">
                  Attendance Register for {selectedSession.subjectName} ({filteredRoster.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-extrabold">
                Timing: {selectedSession.startTime} - {selectedSession.endTime}
              </span>
            </div>

            {/* Mobile View: Premium Cards */}
            <div className="block sm:hidden p-4 space-y-3">
              {filteredRoster.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-[#0B2447] text-sm truncate">{s.name}</h4>
                      <p className="text-[11px] font-mono text-slate-400 font-bold">{s.rollNo}</p>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-[11px]',
                        s.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.status === 'ABSENT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200',
                      )}
                    >
                      {s.status}
                    </span>
                  </div>

                  {/* Quick Toggle Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleStatus(s.id, 'PRESENT')}
                      className={cn(
                        'py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer text-center',
                        s.status === 'PRESENT'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 border-slate-200',
                      )}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(s.id, 'ABSENT')}
                      className={cn(
                        'py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer text-center',
                        s.status === 'ABSENT'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-rose-50 border-slate-200',
                      )}
                    >
                      Absent
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(s.id, 'LATE')}
                      className={cn(
                        'py-2 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer text-center',
                        s.status === 'LATE'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 hover:bg-amber-50 border-slate-200',
                      )}
                    >
                      Late
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[#0B2447] border-b border-slate-200 font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-4">Roll / Adm Code</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Mark Status</th>
                    <th className="p-4 text-right">Quick Toggle / Edit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRoster.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-mono font-extrabold text-slate-600">{s.rollNo}</td>
                      <td className="p-4 font-extrabold text-[#0B2447] text-sm">{s.name}</td>
                      <td className="p-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-3 py-1 rounded-full font-extrabold text-[11px]',
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
                              'px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer',
                              s.status === 'PRESENT'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white text-slate-600 hover:bg-emerald-50 border-slate-200',
                            )}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(s.id, 'ABSENT')}
                            className={cn(
                              'px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer',
                              s.status === 'ABSENT'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                                : 'bg-white text-slate-600 hover:bg-rose-50 border-slate-200',
                            )}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(s.id, 'LATE')}
                            className={cn(
                              'px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer',
                              s.status === 'LATE'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
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
      )}
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

