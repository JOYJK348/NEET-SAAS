'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/providers/auth-provider';
import { useStudentOverview } from '@/features/student-dashboard/hooks/use-student-overview';
import type { StudentSessionDto } from '@/features/student-dashboard/types/student-dashboard.types';
import { api } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  BookOpen,
  CalendarCheck2,
  ClipboardList,
  GraduationCap,
  Layers,
  Radio,
  Sparkles,
  Video,
  MapPin,
  AlertCircle,
  Search,
  X,
  Calendar,
  Clock,
  FileText,
  PlayCircle,
  CreditCard,
  ChevronRight,
  ArrowRight,
  Building2,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generateGoogleCalendarUrl } from '@/lib/google-calendar-url';

// ─── Skeleton Loading ─────────────────────────────────────────────────────────
function OverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-5 p-4 sm:p-6 pb-24 font-sans">
      <div className="h-16 bg-white border border-slate-200 rounded-2xl" />
      <div className="h-44 bg-blue-50/70 border border-blue-100 rounded-3xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-100 rounded-3xl" />
    </div>
  );
}

// ─── Delivery Mode Badge ──────────────────────────────────────────────────────
function DeliveryBadge({ mode }: { mode: string | null }) {
  if (!mode) return null;
  const config = {
    ONLINE: {
      label: 'Online Live',
      cls: 'bg-blue-50 text-[#0052CC] border border-blue-200',
      icon: <Video className="w-3 h-3 text-[#0052CC]" />,
    },
    CLASSROOM: {
      label: 'Campus Classroom',
      cls: 'bg-amber-50 text-amber-700 border border-amber-200',
      icon: <MapPin className="w-3 h-3 text-amber-600" />,
    },
    HYBRID: {
      label: 'Hybrid Mode',
      cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      icon: <Radio className="w-3 h-3 text-indigo-600" />,
    },
  }[mode] ?? {
    label: mode,
    cls: 'bg-slate-100 text-slate-600 border border-slate-200',
    icon: null,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs',
        config.cls,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Live Status Badge ────────────────────────────────────────────────────────
function LiveStatusBadge({ status }: { status: string }) {
  if (status === 'LIVE_NOW') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
        LIVE NOW
      </span>
    );
  }
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052CC] border border-blue-200">
      Upcoming
    </span>
  );
}

// ─── KPI Stat Card ─────────────────────────────────────────────────────────────
function KpiCard({
  icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-start gap-3 hover:-translate-y-0.5 hover:border-blue-300 transition-all duration-200">
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100 shadow-2xs',
          iconBg,
        )}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-black text-[#0B2447] mt-1 leading-none">{value}</p>
        {sub && <p className="text-[11px] font-bold text-slate-500 mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

function formatTime(startsAt: string, endsAt: string): string {
  const fmt = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return t;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  return `${fmt(startsAt)} – ${fmt(endsAt)}`;
}

import { getClassStatus } from '@/lib/class-status';

// ─── Session Card Component ───────────────────────────────────────────────────
function SessionCard({
  session,
  showDate = true,
  isFeeLocked,
}: {
  session: StudentSessionDto;
  showDate?: boolean;
  isFeeLocked?: boolean;
}) {
  const router = useRouter();

  const handleJoin = async () => {
    if (isFeeLocked) {
      toast.error('Live class access is locked due to pending fee dues.');
      router.push('/dashboard/student/fees');
      return;
    }
    const targetUrl = `/dashboard/student/live/${session.id || 'demo-class-1'}`;
    router.push(targetUrl);
    if (typeof window !== 'undefined') {
      window.location.href = targetUrl;
    }
  };

  const subjectName = session.subject?.name ?? 'Subject Session';
  const initial = subjectName.charAt(0).toUpperCase();

  // Tick every 30 seconds so button state auto-updates when class time expires
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const statusInfo = useMemo(() => getClassStatus(session), [session, tick]);
  const isCancelled = statusInfo.isCancelled;
  const isLive = statusInfo.isLive;
  const canJoinNow = statusInfo.canJoin;

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 space-y-3 shadow-2xs transition-all hover:border-blue-300 hover:shadow-xs',
        isLive &&
          'border-emerald-300 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white ring-2 ring-emerald-400/30',
      )}
    >
      {/* Card Header: Subject, Live Status, Date & Time */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC] flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
            {initial}
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-[#0B2447] text-xs sm:text-base leading-tight truncate">
              {subjectName}
            </h4>
            <div className="flex flex-wrap items-center gap-1 mt-1 text-[11px] font-bold font-mono">
              <span className="text-[#0052CC] bg-blue-50/90 px-2 py-0.5 rounded-md border border-blue-100/90">
                {formatTime(session.startsAt, session.endsAt)}
              </span>
              {showDate && session.date && (
                <span className="text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-extrabold flex items-center gap-1">
                  📅{' '}
                  {new Date(
                    session.date.includes('T') ? session.date : session.date + 'T00:00:00',
                  ).toLocaleDateString('en-IN', {
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
          <LiveStatusBadge status={statusInfo.isEnded ? 'COMPLETED' : session.liveStatus} />
        </div>
      </div>

      {/* Meta Chips Row */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {(session.sessionType === 'ONE_TO_ONE' || session.studentName) && (
          <span className="inline-flex items-center gap-1 bg-[#0052CC] text-white border border-[#0052CC] px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black shadow-xs">
            <Sparkles className="w-3 h-3 shrink-0 text-white" />
            <span>1:1 Live</span>
          </span>
        )}
        {session.batch?.name && (
          <span className="inline-flex items-center gap-1 bg-blue-50/60 border border-blue-200/80 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-extrabold text-[#0B2447]">
            <Layers className="w-3 h-3 text-[#0052CC] shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-none">{session.batch.name}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-extrabold text-slate-700">
          <span className="text-slate-400">👤</span>
          <strong className="text-[#0B2447] font-black truncate max-w-[100px] sm:max-w-none">
            {session.tutorName || 'Faculty'}
          </strong>
        </span>
        <DeliveryBadge mode={session.deliveryMode} />
      </div>

      {/* Action Buttons Row */}
      {!isCancelled && (
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={handleJoin}
            disabled={!canJoinNow}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all duration-150 min-h-[36px] shadow-2xs text-center truncate',
              canJoinNow
                ? isFeeLocked
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-rose-500/20 active:scale-98 cursor-pointer'
                  : 'bg-[#0052CC] hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-98 cursor-pointer'
                : 'bg-slate-100 border border-slate-200 text-slate-400 opacity-70 cursor-not-allowed',
            )}
          >
            {isFeeLocked && canJoinNow ? (
              <span className="flex items-center gap-1 truncate">
                <span>🔒</span>
                <span>Fee Due 💳</span>
              </span>
            ) : (
              <>
                <Video className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{statusInfo.buttonLabel}</span>
              </>
            )}
          </button>

          <a
            href={generateGoogleCalendarUrl({
              title: `${subjectName} - ${session.batch?.name || 'NEET Class'}`,
              description: `Scheduled NEET Class with Tutor ${session.tutorName || 'Faculty'}.`,
              startTime: session.startsAt,
              endTime: session.endsAt,
              dateStr: session.date || undefined,
              joiningLink: (session as any).meetingUrl || (session as any).meetingLink || undefined,
            })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0052CC] font-extrabold text-xs border border-blue-200 shadow-2xs transition cursor-pointer shrink-0"
            title="Add this class to Google Calendar"
          >
            <Calendar className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
            <span className="hidden sm:inline">Add Calendar</span>
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptySchedule({
  title = 'No classes today',
  sub = 'Enjoy your free day! 🎉',
}: {
  title?: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-2.5 shadow-2xs">
        <CalendarCheck2 className="w-5 h-5 text-[#0052CC]" />
      </div>
      <p className="text-sm font-black text-[#0B2447]">{title}</p>
      <p className="text-xs text-slate-500 font-medium mt-1 max-w-xs">{sub}</p>
    </div>
  );
}

// ─── Upcoming Schedule Section Component ──────────────────────────────────────
function StudentUpcomingScheduleSection({
  upcomingSchedule,
  isFeeLocked,
}: {
  upcomingSchedule: StudentSessionDto[];
  isFeeLocked?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');

  const subjectList = useMemo(() => {
    const defaultSubjects = ['Physics', 'Chemistry', 'Biology', 'Botany', 'Zoology', 'Maths'];
    const set = new Set<string>(defaultSubjects);
    (upcomingSchedule || []).forEach((s) => {
      if (s.subject?.name) set.add(s.subject.name);
    });
    return Array.from(set);
  }, [upcomingSchedule]);

  const filteredSchedule = useMemo(() => {
    return (upcomingSchedule || []).filter((s) => {
      const subj = (s.subject?.name || '').toLowerCase();
      const batch = (s.batch?.name || '').toLowerCase();
      const tutor = (s.tutorName || '').toLowerCase();
      const mode = (s.deliveryMode || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q || subj.includes(q) || batch.includes(q) || tutor.includes(q) || mode.includes(q);

      const matchesSubject =
        selectedSubjectFilter === 'ALL' ||
        (s.subject?.name || '').toLowerCase() === selectedSubjectFilter.toLowerCase();

      return matchesSearch && matchesSubject;
    });
  }, [upcomingSchedule, searchQuery, selectedSubjectFilter]);

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-3.5 sm:p-5 shadow-2xs space-y-4 flex flex-col justify-between w-full">
      {/* Section Header */}
      <div className="space-y-3 border-b border-slate-100 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="w-4.5 h-4.5 text-[#0052CC] shrink-0" />
            <h2 className="text-sm font-black text-[#0B2447] uppercase tracking-wider">
              Upcoming Sessions (Next 7 Days)
            </h2>
          </div>
          <span className="self-start sm:self-auto text-xs font-extrabold text-[#0052CC] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 shrink-0">
            {filteredSchedule.length} of {upcomingSchedule?.length || 0} Sessions
          </span>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subject, tutor or batch..."
              className="w-full pl-9 pr-7 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 font-medium focus:bg-white focus:outline-none focus:border-[#0052CC] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Subject Filter Pills */}
          {subjectList.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-[11px] font-extrabold">
              <button
                onClick={() => setSelectedSubjectFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg border transition shrink-0 cursor-pointer ${
                  selectedSubjectFilter === 'ALL'
                    ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              {subjectList.map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubjectFilter(subj)}
                  className={`px-2.5 py-1.5 rounded-lg border transition shrink-0 cursor-pointer ${
                    selectedSubjectFilter.toLowerCase() === subj.toLowerCase()
                      ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Height Scrollable Sessions Container */}
      <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
        {!upcomingSchedule || upcomingSchedule.length === 0 ? (
          <EmptySchedule
            title="No upcoming classes scheduled"
            sub="Upcoming sessions for the next 7 days will appear here."
          />
        ) : filteredSchedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40 space-y-2">
            <p className="text-xs font-bold text-slate-700">
              No sessions match your search or filter
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubjectFilter('ALL');
              }}
              className="px-3 py-1.5 rounded-lg bg-[#0052CC] text-white text-xs font-extrabold shadow-2xs hover:bg-blue-700 transition cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredSchedule.map((session, idx) => (
            <SessionCard
              key={`${session.id || 'upcoming'}-${session.startsAt || idx}-${session.date || idx}-${idx}`}
              session={session}
              showDate
              isFeeLocked={isFeeLocked}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function StudentOverviewContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { overview, isLoading, error } = useStudentOverview();
  const [isFeeLocked, setIsFeeLocked] = useState(false);

  useEffect(() => {
    api
      .get<{ isFeeLocked?: boolean }>('/live-classes/check-fee-access', { skipGlobalToast: true })
      .then((res) => {
        if (res?.isFeeLocked) setIsFeeLocked(true);
      })
      .catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 16 ? 'Good Afternoon' : 'Good Evening';

  if (isLoading) return <OverviewSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6 flex items-center justify-center font-sans">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Could not load dashboard</p>
          <p className="text-xs text-slate-400 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  const stats = overview?.stats;
  const liveClassToday =
    overview?.liveNow && overview.liveNow.length > 0
      ? overview.liveNow[0]
      : overview?.todaysSchedule && overview.todaysSchedule.length > 0
        ? overview.todaysSchedule[0]
        : null;

  const studentName = user?.firstName || 'Student';

  return (
    <div className="w-full pb-20 space-y-5 font-sans">
      {/* ── 1. Top Welcome Header Card (Matched with Main ISML LMS Dashboard) ── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-[#0052CC] shrink-0 shadow-2xs">
            <AvatarImage src={user?.avatar || undefined} alt={studentName} />
            <AvatarFallback className="bg-[#0052CC] text-white font-extrabold text-sm sm:text-base">
              {studentName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <h1 className="text-sm sm:text-base font-extrabold text-[#0B2447] truncate">
                {greeting}, {studentName}!
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
                STUDENT PORTAL
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              <span className="font-semibold text-slate-700">
                {overview?.enrolledCourses?.[0] || 'NEET Coaching Academy'}
              </span>
              <span className="mx-1">•</span>
              <span>AY 2026–2027 Academic Session</span>
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/timetable"
          className="hidden xs:flex px-3 py-2 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs items-center gap-1.5 shrink-0 transition-all cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>My Timetable</span>
        </Link>
      </div>

      {/* 🔴 2. LIVE ACADEMIC SESSION BANNER - SHOWN STRICTLY WHEN LIVE CLASS IS ACTIVE ── */}
      {overview &&
        overview.liveNow &&
        overview.liveNow.length > 0 &&
        (() => {
          const activeLiveSession = overview.liveNow[0];
          return (
            <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50/70 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xs space-y-3 border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 font-sans animate-in fade-in duration-200">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] sm:text-xs font-extrabold rounded-full flex items-center gap-1.5 shrink-0 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    LIVE CLASS ACTIVE NOW
                  </span>
                  <span className="text-xs text-[#0052CC] bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-full font-extrabold truncate">
                    {activeLiveSession.subject?.name || 'NEET Live Batch'}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-[#0B2447] tracking-tight leading-snug">
                  {activeLiveSession.batch?.name
                    ? `${activeLiveSession.subject?.name || 'Academic Class'} - ${activeLiveSession.batch.name}`
                    : 'Live NEET Masterclass Session'}
                </h2>

                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 font-medium pt-0.5">
                  <span className="inline-flex items-center gap-1 text-[#0052CC] font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
                    {formatTime(activeLiveSession.startsAt, activeLiveSession.endsAt)}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    Campus: Main Branch
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs font-bold text-slate-800">
                    <Users className="w-3.5 h-3.5 text-[#0052CC]" />
                    Faculty: {activeLiveSession.tutorName || 'Faculty'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (isFeeLocked) {
                    toast.error('Live class access is locked due to pending fee dues.');
                    router.push('/dashboard/student/fees');
                    return;
                  }
                  const targetUrl = `/dashboard/student/live/${activeLiveSession.id || 'demo-class-1'}`;
                  router.push(targetUrl);
                  if (typeof window !== 'undefined') {
                    window.location.href = targetUrl;
                  }
                }}
                className="w-full md:w-auto px-6 py-3.5 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-2xs flex items-center justify-center gap-2 shrink-0 transition-all hover:shadow-md cursor-pointer"
              >
                <Video className="w-4.5 h-4.5 text-white" />
                <span>JOIN LIVE CLASS 🚀</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })()}

      {/* ── 3. Quick Action Shortcuts Strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/dashboard/timetable"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#0052CC] hover:shadow-xs transition group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0052CC] group-hover:bg-[#0052CC] group-hover:text-white transition">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-[#0B2447] truncate">My Timetable</p>
            <p className="text-[10px] text-slate-400 font-bold truncate">Class Schedules</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0052CC] transition" />
        </Link>

        <Link
          href="/dashboard/exams"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#0052CC] hover:shadow-xs transition group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-[#0B2447] truncate">Exams & PYQ</p>
            <p className="text-[10px] text-slate-400 font-bold truncate">Mock Test Series</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition" />
        </Link>

        <Link
          href="/dashboard/recordings"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#0052CC] hover:shadow-xs transition group"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition">
            <PlayCircle className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-[#0B2447] truncate">Recordings</p>
            <p className="text-[10px] text-slate-400 font-bold truncate">Class Archives</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition" />
        </Link>

        <Link
          href="/dashboard/student/fees"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-[#0052CC] hover:shadow-xs transition group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
            <CreditCard className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-[#0B2447] truncate">Fee Accounts</p>
            <p className="text-[10px] text-slate-400 font-bold truncate">Installments & Dues</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition" />
        </Link>
      </div>

      {/* ── 4. KPI Strip ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          icon={<CalendarCheck2 className="w-5 h-5" />}
          label="Today's Classes"
          value={stats?.todaysClasses ?? '—'}
          sub={stats?.upcomingClasses ? `+${stats.upcomingClasses} upcoming` : 'No upcoming'}
          iconBg="bg-blue-50"
          iconColor="text-[#0052CC]"
        />
        <KpiCard
          icon={<Layers className="w-5 h-5" />}
          label="Active Batches"
          value={stats?.activeBatches ?? '—'}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-700"
        />
        <KpiCard
          icon={<ClipboardList className="w-5 h-5" />}
          label="Attendance Rate"
          value={stats?.attendanceRate != null ? `${stats.attendanceRate}%` : 'Nil'}
          sub={
            stats?.attendanceRate != null
              ? stats.attendanceRate >= 75
                ? '✅ On track'
                : '⚠️ Below 75%'
              : 'No records yet'
          }
          iconBg={
            stats?.attendanceRate != null && stats.attendanceRate < 75
              ? 'bg-rose-50'
              : 'bg-amber-50'
          }
          iconColor={
            stats?.attendanceRate != null && stats.attendanceRate < 75
              ? 'text-rose-600'
              : 'text-amber-600'
          }
        />
        <KpiCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Upcoming"
          value={stats?.upcomingClasses ?? '—'}
          sub="Next 7 days"
          iconBg="bg-blue-50"
          iconColor="text-[#0052CC]"
        />
      </div>

      {/* ── 5. Today's Schedule & Upcoming Schedule 2-Column Grid ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-3.5 sm:p-5 shadow-2xs space-y-4 w-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-[#0B2447] uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#0052CC]" />
              Today&apos;s Class Schedule
            </h2>
            <span className="text-xs font-extrabold text-[#0052CC] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {overview?.todaysSchedule?.length || 0} Sessions
            </span>
          </div>

          {!overview || overview.todaysSchedule.length === 0 ? (
            <EmptySchedule title="No classes scheduled for today" sub="Enjoy your free day! 🎉" />
          ) : (
            <div className="space-y-3">
              {overview.todaysSchedule.map((session, idx) => (
                <SessionCard
                  key={`${session.id || 'today'}-${session.startsAt || idx}-${idx}`}
                  session={session}
                  isFeeLocked={isFeeLocked}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bounded Scrollable & Filterable Upcoming Schedule */}
        <StudentUpcomingScheduleSection
          upcomingSchedule={overview?.upcomingSchedule || []}
          isFeeLocked={isFeeLocked}
        />
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function StudentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <DashboardLayout>
        <StudentOverviewContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
