'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorTimetable } from '@/features/tutor-dashboard/hooks/use-tutor-timetable';
import { useTutorBatches } from '@/features/tutor-dashboard/hooks/use-tutor-batches';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  UserCheck,
  AlertCircle,
  Video,
} from 'lucide-react';

function TutorAttendanceOverviewContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');

  // Fetch timetable sessions
  const { timetable, isLoading: isTimetableLoading, error, refetch } = useTutorTimetable();
  const { batches: tutorBatchesData } = useTutorBatches();

  const assignedBatches = useMemo(() => {
    const list = tutorBatchesData?.batches ?? [];
    return list
      .filter((a) => a.batch !== null)
      .map((a) => ({
        id: a.batch!.id,
        name: a.batch!.name,
        code: a.batch!.code,
      }));
  }, [tutorBatchesData]);

  // Flatten and parse all sessions from timetable
  const allSessions = useMemo(() => {
    if (!timetable?.timetable) return [];
    return timetable.timetable.flatMap((day) =>
      (day.sessions || []).map((session) => ({
        ...session,
        date: day.date,
      })),
    );
  }, [timetable]);

  const now = new Date();

  // Categorize sessions into Pending, Marked/Completed, Upcoming
  const categorized = useMemo(() => {
    const pending: typeof allSessions = [];
    const completed: typeof allSessions = [];
    const upcoming: typeof allSessions = [];

    for (const session of allSessions) {
      if (session.sessionStatus === 'CANCELLED') continue;

      const endDateTime = new Date(`${session.date}T${session.endsAt || '23:59'}`);
      const isPast = endDateTime < now;
      const isMarked =
        session.sessionStatus === 'PUBLISHED' ||
        session.sessionStatus === 'LOCKED' ||
        (session as any).hasAttendanceRecords === true;

      if (isMarked) {
        completed.push(session);
      } else if (isPast) {
        pending.push(session);
      } else {
        upcoming.push(session);
      }
    }

    return { pending, completed, upcoming };
  }, [allSessions, now]);

  // Group pending sessions by Batch
  const batchPendingGroups = useMemo(() => {
    const groups: Record<
      string,
      {
        batchId: string;
        batchName: string;
        pendingSessions: typeof allSessions;
        completedCount: number;
        totalCount: number;
      }
    > = {};

    for (const b of assignedBatches) {
      groups[b.id] = {
        batchId: b.id,
        batchName: b.name,
        pendingSessions: [],
        completedCount: 0,
        totalCount: 0,
      };
    }

    for (const session of allSessions) {
      const bId = session.batch?.id;
      const bName = session.batch?.name;

      let key = Object.keys(groups).find(
        (k) => k === bId || groups[k].batchName === bName,
      );

      if (!key && bId) {
        key = bId;
        groups[key] = {
          batchId: bId,
          batchName: bName || 'Batch',
          pendingSessions: [],
          completedCount: 0,
          totalCount: 0,
        };
      }

      if (!key) continue;

      groups[key].totalCount += 1;

      const endDateTime = new Date(`${session.date}T${session.endsAt || '23:59'}`);
      const isPast = endDateTime < now;
      const isMarked =
        session.sessionStatus === 'PUBLISHED' ||
        session.sessionStatus === 'LOCKED' ||
        (session as any).hasAttendanceRecords === true;

      if (isMarked) {
        groups[key].completedCount += 1;
      } else if (isPast) {
        groups[key].pendingSessions.push(session);
      }
    }

    return Object.values(groups);
  }, [allSessions, assignedBatches, now]);

  const [queueTab, setQueueTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');

  // Filtered session lists per batch filter
  const currentBatchPendingSessions = useMemo(() => {
    if (selectedBatchId === 'NONE') return [];
    let list = categorized.pending;
    if (selectedBatchId !== 'ALL') {
      list = list.filter(
        (s) => s.batch?.id === selectedBatchId || s.batch?.name === selectedBatchId,
      );
    }
    return list;
  }, [categorized.pending, selectedBatchId]);

  const currentBatchCompletedSessions = useMemo(() => {
    if (selectedBatchId === 'NONE') return [];
    let list = categorized.completed;
    if (selectedBatchId !== 'ALL') {
      list = list.filter(
        (s) => s.batch?.id === selectedBatchId || s.batch?.name === selectedBatchId,
      );
    }
    return list;
  }, [categorized.completed, selectedBatchId]);

  // Filtered sessions list based on tab, batch filter, and search term
  const filteredSessions = useMemo(() => {
    let list = queueTab === 'PENDING' ? currentBatchPendingSessions : currentBatchCompletedSessions;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.subject?.name?.toLowerCase().includes(term) ||
          s.batch?.name?.toLowerCase().includes(term) ||
          s.date.includes(term),
      );
    }

    return list;
  }, [currentBatchPendingSessions, currentBatchCompletedSessions, queueTab, searchTerm]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="text-left sm:text-center flex-1 space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
            ATTENDANCE MARKING WORKLOAD
          </h1>
          <p className="text-xs font-bold text-slate-500">
            Batch-wise pending & completed attendance queue
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isTimetableLoading}
          className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition-all disabled:opacity-50 shadow-2xs shrink-0"
          title="Refresh attendance workload"
        >
          <RefreshCw className={`w-4 h-4 ${isTimetableLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          onClick={() => setQueueTab('PENDING')}
          className={cn(
            'rounded-3xl border p-5 shadow-2xs flex items-center gap-3 cursor-pointer transition-all',
            queueTab === 'PENDING'
              ? 'border-amber-400 bg-amber-50/80 ring-2 ring-amber-400/30'
              : 'border-amber-200/80 bg-white hover:bg-amber-50/30',
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Pending Attendance
            </p>
            <p className="text-2xl font-black text-amber-700 mt-0.5">
              {categorized.pending.length} Sessions
            </p>
          </div>
        </Card>

        <Card
          onClick={() => setQueueTab('COMPLETED')}
          className={cn(
            'rounded-3xl border p-5 shadow-2xs flex items-center gap-3 cursor-pointer transition-all',
            queueTab === 'COMPLETED'
              ? 'border-emerald-400 bg-emerald-50/80 ring-2 ring-emerald-400/30'
              : 'border-emerald-200/80 bg-white hover:bg-emerald-50/30',
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Marked & Completed
            </p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">
              {categorized.completed.length} Sessions
            </p>
          </div>
        </Card>

        <Card className="rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 via-white to-white p-5 shadow-2xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 border border-violet-200 text-violet-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Assigned Batches
            </p>
            <p className="text-2xl font-black text-violet-700 mt-0.5">
              {assignedBatches.length} Active Batches
            </p>
          </div>
        </Card>
      </div>

      {/* ── Batch-wise Pending Attendance Breakdown Cards ─────────────────── */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">
          Batch-wise Attendance Workload Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batchPendingGroups.map((group) => {
            const hasPending = group.pendingSessions.length > 0;
            const isSelected = selectedBatchId === group.batchId;

            return (
              <Card
                key={group.batchId}
                onClick={() => {
                  if (isSelected) {
                    setSelectedBatchId('ALL');
                  } else {
                    setSelectedBatchId(group.batchId);
                    setQueueTab(hasPending ? 'PENDING' : 'COMPLETED');
                  }
                }}
                className={cn(
                  'rounded-3xl border p-5 shadow-2xs flex flex-col justify-between transition-all cursor-pointer',
                  isSelected
                    ? 'border-violet-500 bg-violet-50/50 ring-2 ring-violet-500/30'
                    : hasPending
                      ? 'border-amber-200 bg-amber-50/30 hover:bg-amber-50/50'
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
                      {group.batchName}
                    </span>

                    {hasPending ? (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-xl text-[10px] font-black animate-pulse">
                        {group.pendingSessions.length} PENDING
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-[10px] font-black">
                        UP TO DATE ✅
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Completed: {group.completedCount}</span>
                    <span>Total Scheduled: {group.totalCount}</span>
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
                    {isSelected
                      ? 'Selected (Click to Clear Filter)'
                      : `View Batch Sessions (${hasPending ? `${group.pendingSessions.length} Pending` : `${group.completedCount} Completed`})`}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Detailed Sessions Queue List (Tabbed: PENDING vs COMPLETED) ──────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => setQueueTab('PENDING')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all',
                queueTab === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Queue ({currentBatchPendingSessions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setQueueTab('COMPLETED')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all',
                queueTab === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed Sessions ({currentBatchCompletedSessions.length})</span>
            </button>
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
              <option value="NONE">Select Batch...</option>
              <option value="ALL">All Batches</option>
              {assignedBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* List Content */}
        {isTimetableLoading ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-400">
            Loading attendance sessions...
          </div>
        ) : error ? (
          <ErrorState
            title="Failed to load attendance list"
            message={error.message || 'Could not load sessions.'}
            onRetry={refetch}
          />
        ) : selectedBatchId === 'NONE' ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
            <Layers className="w-10 h-10 text-violet-400 mx-auto mb-2" />
            <p className="text-sm font-black text-slate-800">Select a Batch to View Attendance Queue 👆</p>
            <p className="text-xs text-slate-400 mt-1">
              Click on any batch card above to view its pending or completed attendance sessions.
            </p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-black text-slate-800">
              {queueTab === 'PENDING' ? 'No Pending Attendance! 🎉' : 'No Completed Sessions Found'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {queueTab === 'PENDING'
                ? 'All past class sessions have complete attendance marked.'
                : 'Completed sessions will appear here once attendance is saved.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs',
                  queueTab === 'PENDING' ? 'border-amber-200/90' : 'border-emerald-200/90 bg-emerald-50/10',
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm shrink-0',
                      queueTab === 'PENDING'
                        ? 'bg-amber-100 border-amber-200 text-amber-700'
                        : 'bg-emerald-100 border-emerald-200 text-emerald-700',
                    )}
                  >
                    {(session.subject?.name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-slate-900 text-sm">
                        {session.subject?.name || 'Class Session'}
                      </h4>
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-md font-extrabold border',
                          queueTab === 'PENDING'
                            ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : 'text-emerald-700 bg-emerald-50 border-emerald-200',
                        )}
                      >
                        📅 {new Date(session.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 font-mono mt-0.5">
                      {session.startsAt} – {session.endsAt} • Batch: <span className="text-slate-900 font-black">{session.batch?.name || 'Assigned Batch'}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {queueTab === 'PENDING' ? (
                    <Link
                      href={`/dashboard/tutor/sessions/${session.id}`}
                      className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all inline-flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 text-center"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Mark Attendance Now 🚀</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/tutor/sessions/${session.id}`}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-extrabold transition-all inline-flex items-center justify-center gap-1.5 text-center"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>View / Edit Attendance</span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TutorAttendanceOverviewPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <DashboardLayout>
        <TutorAttendanceOverviewContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
