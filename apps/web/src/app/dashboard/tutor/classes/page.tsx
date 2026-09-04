'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorOverview } from '@/features/tutor-dashboard/hooks/use-tutor-overview';
import { useTutorTimetable } from '@/features/tutor-dashboard/hooks/use-tutor-timetable';
import type { TutorialSessionDto } from '@/features/tutor-dashboard/types/overview';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  BookOpen,
  Clock,
  MapPin,
  Video,
  Radio,
  Layers,
  Sparkles,
  Search,
  X,
  CalendarDays,
  Users,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper: Format HH:mm to 12-hour AM/PM
function formatTime(startsAt: string, endsAt: string): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  return `${fmt(startsAt)} – ${fmt(endsAt)}`;
}

// Delivery Mode Badge
function DeliveryBadge({ mode }: { mode: string | null }) {
  if (!mode) return null;
  const config = {
    ONLINE: {
      label: 'Online Class',
      cls: 'bg-sky-50 text-sky-700 border-sky-200/80',
      icon: <Video className="w-3 h-3 text-sky-600" />,
    },
    CLASSROOM: {
      label: 'Classroom',
      cls: 'bg-amber-50 text-amber-700 border-amber-200/80',
      icon: <MapPin className="w-3 h-3 text-amber-600" />,
    },
    HYBRID: {
      label: 'Hybrid Mode',
      cls: 'bg-violet-50 text-violet-700 border-violet-200/80',
      icon: <Radio className="w-3 h-3 text-violet-600" />,
    },
  }[mode] ?? { label: mode, cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: null };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg border shadow-2xs',
        config.cls,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// Live Status Badge
function LiveStatusBadge({ status }: { status: string }) {
  if (status === 'LIVE_NOW') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        LIVE NOW
      </span>
    );
  }
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
        Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 border border-violet-200">
      Upcoming
    </span>
  );
}

import { getClassStatus } from '@/lib/class-status';

// Session Card Component with STRICT Live Button Logic
function SessionCard({ session, showDate }: { session: TutorialSessionDto; showDate?: boolean }) {
  const router = useRouter();

  const isOnlineOrHybrid =
    session.deliveryMode === 'ONLINE' ||
    session.deliveryMode === 'HYBRID' ||
    Boolean(session.meetingLink);

  const statusInfo = useMemo(() => {
    const res = getClassStatus(session, { isTutor: true });
    if (!isOnlineOrHybrid && !res.isCancelled && !res.isEnded) {
      return { ...res, canJoin: false, buttonLabel: 'Classroom Lecture Scheduled (Offline)' };
    }
    return res;
  }, [session, isOnlineOrHybrid]);

  const isCancelled = statusInfo.isCancelled;
  const isLive = statusInfo.isLive;
  const canJoinNow = statusInfo.canJoin;

  const handleJoinClass = () => {
    toast.success('Opening Tutor Live Studio 🚀', {
      description: `Launching classroom studio for ${session.subject?.name || 'Live Class'}...`,
    });
    const queryParams = new URLSearchParams();
    if (session.sessionType) queryParams.set('sessionType', session.sessionType);
    if (session.studentName) queryParams.set('studentName', session.studentName);
    if ((session as any).studentAdmissionId)
      queryParams.set('studentAdmissionId', (session as any).studentAdmissionId);
    const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const targetUrl = `/dashboard/tutor/live/${session.id || 'demo-class-1'}${qs}`;
    router.push(targetUrl);
    if (typeof window !== 'undefined') {
      window.location.href = targetUrl;
    }
  };

  const subjectName = session.subject?.name ?? 'Subject Session';
  const initial = subjectName.charAt(0).toUpperCase();

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3.5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs',
        isLive &&
          'border-emerald-300 bg-gradient-to-r from-emerald-50/60 via-teal-50/30 to-white ring-2 ring-emerald-400/20',
        isCancelled && 'border-rose-200 bg-rose-50/30 opacity-80',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 text-violet-700 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
            {initial}
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-slate-900 text-sm sm:text-base leading-snug truncate">
              {subjectName}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-bold font-mono">
              <Clock className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span>{formatTime(session.startsAt, session.endsAt)}</span>
              {showDate && session.date && (
                <span className="text-[10px] text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md font-extrabold ml-1">
                  {new Date(session.date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <LiveStatusBadge status={session.liveStatus || (isLive ? 'LIVE_NOW' : 'UPCOMING')} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {(session.sessionType === 'ONE_TO_ONE' || session.studentName) && (
          <span className="inline-flex items-center gap-1 bg-violet-600 text-white border border-violet-600 px-2.5 py-1 rounded-xl text-[11px] font-black shadow-xs">
            <Users className="w-3.5 h-3.5 shrink-0 text-white" />
            <span>1:1 Live Class {session.studentName ? `(${session.studentName})` : ''}</span>
          </span>
        )}
        {session.batch && (
          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-extrabold text-slate-700">
            <Layers className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span className="truncate max-w-[150px] sm:max-w-none">{session.batch.name}</span>
          </span>
        )}
        {session.branch && (
          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-extrabold text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{session.branch.name}</span>
          </span>
        )}
        <DeliveryBadge mode={session.deliveryMode || 'ONLINE'} />
      </div>

      {isCancelled && session.cancelledReason && (
        <p className="text-xs text-rose-600 italic font-semibold p-2.5 rounded-xl bg-rose-50 border border-rose-200">
          Cancelled: {session.cancelledReason}
        </p>
      )}

      {/* 1:1 Personalized Class Info Box right near Join Button */}
      {(session.sessionType === 'ONE_TO_ONE' || session.studentName) && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-100/90 via-violet-50 to-indigo-50/80 border border-violet-200 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              👤
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black text-violet-700 uppercase tracking-wider block">
                1:1 Personalized Class
              </span>
              <p className="text-xs font-extrabold text-slate-900 truncate">
                Student:{' '}
                <strong className="text-violet-900 font-black">
                  {session.studentName || 'Assigned Student'}
                </strong>
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black bg-violet-600 text-white px-2.5 py-1 rounded-xl shadow-2xs shrink-0">
            1:1 Live
          </span>
        </div>
      )}

      {/* Action Buttons */}
      {!isCancelled && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          {canJoinNow ? (
            <button
              onClick={handleJoinClass}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all shadow-2xs text-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20 active:scale-98 cursor-pointer"
            >
              <Video className="w-4 h-4 shrink-0" />
              <span>{statusInfo.buttonLabel}</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80"
            >
              <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>{statusInfo.buttonLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import { ChevronRight } from 'lucide-react';

function TutorClassesContent() {
  const { overview, isLoading: isOverviewLoading } = useTutorOverview();
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'CLASSROOM' | 'ONLINE'>('ALL');
  const [daysRange, setDaysRange] = useState<number>(7);

  // Compute dynamic date range string
  const dateParams = useMemo(() => {
    const today = new Date();
    const fromStr = today.toISOString().slice(0, 10);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysRange);
    const toStr = targetDate.toISOString().slice(0, 10);
    return { fromStr, toStr };
  }, [daysRange]);

  // Fetch custom range timetable when range > 7 days
  const { timetable, isLoading: isTimetableLoading } = useTutorTimetable(
    daysRange > 7 ? dateParams.fromStr : undefined,
    daysRange > 7 ? dateParams.toStr : undefined,
  );

  const todaysSchedule = overview?.todaysSchedule || [];

  // Determine upcoming schedule list based on range selection
  const upcomingSchedule = useMemo(() => {
    if (daysRange <= 7) {
      return overview?.upcomingSchedule || [];
    }

    if (!timetable?.timetable) return [];

    const list: TutorialSessionDto[] = [];
    const todayKey = new Date().toISOString().slice(0, 10);

    for (const day of timetable.timetable) {
      if (day.date <= todayKey) continue;

      for (const s of day.sessions) {
        list.push({
          id: s.id,
          date: day.date,
          dayOfWeek: day.dayOfWeek,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          subject: s.subject
            ? { id: s.subject.id, name: s.subject.name, code: s.subject.code }
            : null,
          batch: s.batch ? { id: s.batch.id, name: s.batch.name, code: s.batch.code } : null,
          branch: s.branch ? { id: s.branch.id, name: s.branch.name } : null,
          sessionStatus: s.sessionStatus || 'SCHEDULED',
          liveStatus: 'UPCOMING',
          deliveryMode: (s as any).deliveryMode || 'CLASSROOM',
          meetingLink: (s as any).meetingLink,
          canJoin: false,
        });
      }
    }

    return list;
  }, [daysRange, overview, timetable]);

  const filteredUpcoming = useMemo(() => {
    return upcomingSchedule.filter((s) => {
      if (modeFilter !== 'ALL' && (s.deliveryMode || '').toUpperCase() !== modeFilter) {
        return false;
      }
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (s.subject?.name || '').toLowerCase().includes(q) ||
        (s.batch?.name || '').toLowerCase().includes(q) ||
        (s.branch?.name || '').toLowerCase().includes(q)
      );
    });
  }, [upcomingSchedule, search, modeFilter]);

  const isLoading = isOverviewLoading || (daysRange > 7 && isTimetableLoading);

  if (isLoading && todaysSchedule.length === 0 && upcomingSchedule.length === 0) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#F8FAFC]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const totalSessionsCount = todaysSchedule.length + upcomingSchedule.length;

  const rangeLabels: Record<number, string> = {
    7: 'Next 7 Days',
    30: 'Next 30 Days (1 Month)',
    60: 'Next 60 Days (2 Months)',
    90: 'Next 90 Days (3 Months)',
  };

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* ── ISML LMS Light Blue Header Banner ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-3 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Faculty Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Assigned Classes</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447]">
            My Assigned Classes & Live Sessions 📚
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Real-time schedule of today&apos;s lectures and recurring class sessions (
            {rangeLabels[daysRange]})
          </p>
        </div>

        <div className="bg-white px-5 py-3 rounded-xl border border-blue-200 text-center shrink-0 self-start sm:self-auto shadow-2xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#0052CC]">
            Total Sessions ({daysRange}D)
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0B2447] mt-0.5">
            {totalSessionsCount}
          </p>
        </div>
      </div>

      {/* ── KPI Metric Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center gap-3 hover:border-blue-300 transition-all">
          <div className="p-3 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Today&apos;s Sessions
            </p>
            <p className="text-2xl font-extrabold text-[#0B2447] mt-0.5">{todaysSchedule.length}</p>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center gap-3 hover:border-indigo-300 transition-all">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Upcoming ({rangeLabels[daysRange]})
            </p>
            <p className="text-2xl font-extrabold text-[#0B2447] mt-0.5">
              {upcomingSchedule.length}
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex items-center gap-3 hover:border-emerald-300 transition-all">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </p>
            <p className="text-2xl font-extrabold text-[#0B2447] mt-0.5">
              {overview?.stats?.totalStudents || 0}
            </p>
          </div>
        </Card>
      </div>

      {/* ── Today's Schedule Section ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#0052CC]" />
            <h2 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider">
              Today&apos;s Class Schedule ({todaysSchedule.length})
            </h2>
          </div>
        </div>

        {todaysSchedule.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaysSchedule.map((session, index) => (
              <SessionCard key={`${session.id || 'today'}-${index}`} session={session} />
            ))}
          </div>
        ) : (
          <Card className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs font-medium text-slate-400 shadow-2xs">
            No classes scheduled for today.
          </Card>
        )}
      </div>

      {/* ── Upcoming Sessions Section with Range Filter & Mode Filter ── */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#0052CC]" />
            <h2 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider">
              Upcoming Recurring Sessions ({rangeLabels[daysRange]}) ({filteredUpcoming.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Date Range Selection Filter */}
            <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 text-xs font-bold text-[#0052CC]">
              <Filter className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
              <select
                value={daysRange}
                onChange={(e) => setDaysRange(Number(e.target.value))}
                className="bg-transparent border-0 outline-none font-extrabold text-xs text-[#0052CC] cursor-pointer"
              >
                <option value={7}>Next 7 Days</option>
                <option value={30}>Next 30 Days (1 Month)</option>
                <option value={60}>Next 60 Days (2 Months)</option>
                <option value={90}>Next 90 Days (3 Months)</option>
              </select>
            </div>

            {/* Mode Filter Pills */}
            {(['ALL', 'CLASSROOM', 'ONLINE'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setModeFilter(mode)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer',
                  modeFilter === mode
                    ? 'bg-[#0052CC] text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200',
                )}
              >
                {mode === 'ALL' ? 'All Modes' : mode === 'CLASSROOM' ? 'Classroom' : 'Online'}
              </button>
            ))}
          </div>
        </div>

        {filteredUpcoming.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUpcoming.map((session, index) => (
              <SessionCard
                key={`${session.id || 'upcoming'}-${index}`}
                session={session}
                showDate
              />
            ))}
          </div>
        ) : (
          <Card className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs font-medium text-slate-400 shadow-2xs">
            No upcoming sessions found matching criteria.
          </Card>
        )}
      </div>
    </div>
  );
}

export default function TutorClassesPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR', 'FACULTY', 'TENANT_ADMIN']}>
      <DashboardLayout>
        <TutorClassesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
