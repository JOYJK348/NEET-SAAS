'use client';

import { useState, useMemo, useEffect } from 'react';

import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorOverview } from '@/features/tutor-dashboard/hooks/use-tutor-overview';
import type { TutorialSessionDto } from '@/features/tutor-dashboard/types/overview';
import { StatsSkeleton } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { generateGoogleCalendarUrl } from '@/lib/google-calendar-url';
import {
  BookOpen,
  Calendar,
  Users,
  Layers,
  Clock,
  MapPin,
  AlertCircle,
  XCircle,
  Sparkles,
  Video,
  Radio,
  UserCheck,
  ChevronRight,
  ArrowUpRight,
  Award,
  GraduationCap,
  CalendarDays,
  FileCheck2,
  Zap,
  Search,
  X,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(startsAt: string, endsAt: string): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  return `${fmt(startsAt)} – ${fmt(endsAt)}`;
}

// ─── Delivery Mode Badge ──────────────────────────────────────────────────────
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

// ─── Live Status Badge ────────────────────────────────────────────────────────
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

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// ─── Session Card ────────────────────────────────────────────────────────────

import { getClassStatus } from '@/lib/class-status';

function SessionCard({ session, showDate = true }: { session: TutorialSessionDto; showDate?: boolean }) {
  const router = useRouter();

  // Tick every 30 seconds so button state auto-updates when class time expires
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const statusInfo = useMemo(() => getClassStatus(session, { isTutor: true }), [session, tick]);
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
      {/* Card Header: Subject Icon Avatar, Title & Live Status Badge */}
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
          <LiveStatusBadge status={session.liveStatus || (isLive ? 'LIVE_NOW' : 'UPCOMING')} />
        </div>
      </div>

      {/* Meta Tags Row: Batch Name, Branch, Delivery Mode */}
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

      {/* Action Buttons & 1-Click Google Calendar Link */}
      {!isCancelled && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100">
          {canJoinNow ? (
            <button
              onClick={handleJoinClass}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all shadow-2xs text-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20 active:scale-98 cursor-pointer"
            >
              <Video className="w-4 h-4 shrink-0" />
              <span>{statusInfo.buttonLabel}</span>
            </button>
          ) : (
            <button
              disabled
              className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80"
            >
              <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span>{statusInfo.buttonLabel}</span>
            </button>
          )}

          <a
            href={generateGoogleCalendarUrl({
              title: `${subjectName} - ${session.batch?.name || 'NEET Class'}`,
              description: `Faculty Class Session for ${session.batch?.name || 'Batch'}. Student: ${session.studentName || 'Class'}`,
              startTime: session.startsAt,
              endTime: session.endsAt,
              dateStr: session.date || undefined,
              joiningLink: session.meetingLink || undefined,
            })}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 font-extrabold text-xs border border-violet-200 shadow-2xs transition cursor-pointer shrink-0"
            title="Add this class to Google Calendar with 15-min reminder alert"
          >
            <Calendar className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span>Add to Calendar 📅</span>
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Creative Overview KPI Cards ─────────────────────────────────────────────

function OverviewStats({
  overview,
}: {
  overview: NonNullable<ReturnType<typeof useTutorOverview>['overview']>;
}) {
  const stats = [
    {
      name: "Today's Classes",
      value: overview.stats.todaysClasses,
      sub: overview.stats.todaysClasses > 0 ? 'Sessions scheduled' : 'Free schedule',
      icon: CalendarDays,
      iconColor: 'text-[#0052CC]',
      bgColor: 'bg-blue-50 border-blue-200',
    },
    {
      name: 'Upcoming (7 Days)',
      value: overview.stats.upcomingClasses,
      sub: 'Next week sessions',
      icon: BookOpen,
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-200',
    },
    {
      name: 'Assigned Batches',
      value: overview.stats.myBatches,
      sub: 'Active student groups',
      icon: Layers,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-200',
    },
    {
      name: 'Total Students',
      value: overview.stats.totalStudents,
      sub: 'Enrolled under batches',
      icon: Users,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.name}
            className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-blue-300 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                {stat.name}
              </span>
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105',
                  stat.bgColor,
                  stat.iconColor,
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#0B2447] tracking-tight leading-none">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-slate-500 mt-1.5">{stat.sub}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Bounded Scrollable & Filterable Upcoming Schedule Section ─────────────

function UpcomingScheduleSection({ upcomingSchedule }: { upcomingSchedule: TutorialSessionDto[] }) {
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
    return upcomingSchedule.filter((s) => {
      const subj = (s.subject?.name || '').toLowerCase();
      const batch = (s.batch?.name || '').toLowerCase();
      const branch = (s.branch?.name || '').toLowerCase();
      const mode = (s.deliveryMode || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q || subj.includes(q) || batch.includes(q) || branch.includes(q) || mode.includes(q);

      const matchesSubject =
        selectedSubjectFilter === 'ALL' ||
        (s.subject?.name || '').toLowerCase() === selectedSubjectFilter.toLowerCase();

      return matchesSearch && matchesSubject;
    });
  }, [upcomingSchedule, searchQuery, selectedSubjectFilter]);

  return (
    <Card className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
      {/* Section Header */}
      <div className="space-y-3 border-b border-slate-100 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-[#0052CC] shrink-0" />
            <h2 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider">
              Upcoming Sessions (Next 7 Days)
            </h2>
          </div>
          <span className="self-start sm:self-auto text-xs font-extrabold text-[#0052CC] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 shrink-0">
            {filteredSchedule.length} of {upcomingSchedule.length} Sessions
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
              placeholder="Search subject, batch or mode..."
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
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-[11px] font-bold">
              <button
                onClick={() => setSelectedSubjectFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg border transition shrink-0 cursor-pointer ${
                  selectedSubjectFilter === 'ALL'
                    ? 'bg-[#0052CC] text-white border-[#0052CC] font-extrabold shadow-2xs'
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
                      ? 'bg-[#0052CC] text-white border-[#0052CC] font-extrabold shadow-2xs'
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
        {upcomingSchedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
            <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No upcoming classes scheduled</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              New sessions will appear here once published by management.
            </p>
          </div>
        ) : filteredSchedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40 space-y-2">
            <p className="text-xs font-bold text-slate-700">No sessions match your search/filter</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubjectFilter('ALL');
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0052CC] text-white text-xs font-extrabold shadow-2xs hover:bg-blue-700 transition cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filteredSchedule.map((session, index) => (
            <SessionCard key={`${session.id || 'upcoming'}-${index}`} session={session} showDate />
          ))
        )}
      </div>
    </Card>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

function TutorDashboardContent() {
  const { user } = useAuth();
  const { overview, isLoading, error, refetch } = useTutorOverview();

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen">
        <div className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
        <StatsSkeleton count={4} />
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 bg-[#F8FAFC] min-h-screen">
        <ErrorState
          title="Failed to load overview"
          message={error.message || 'Could not load your dashboard. Please try again.'}
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="p-4 lg:p-6 bg-[#F8FAFC] min-h-screen">
        <EmptyState
          icon={<Calendar className="h-8 w-8 text-gray-400" />}
          title="No dashboard data available"
          description="Your dashboard overview will appear here once data is available."
        />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 16 ? 'Good Afternoon' : 'Good Evening';

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* ── ISML LMS Light Blue Header Banner ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 rounded-2xl p-4 sm:p-6 text-slate-900 border border-blue-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Faculty Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Dashboard Overview</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold leading-tight text-[#0B2447]">
            {greeting}, {user?.firstName || 'Faculty'}! 👋
          </h1>
          <p className="text-slate-600 text-xs font-medium">
            📅 {formattedDate} — Live academic schedule & active batch overview.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Link
            href="/dashboard/tutor/timetable"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs"
          >
            <CalendarDays className="w-4 h-4 text-[#0052CC]" />
            <span>Schedule</span>
          </Link>
          <Link
            href="/dashboard/tutor/batches"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs rounded-xl text-xs"
          >
            <Layers className="w-4 h-4 text-white" />
            <span>My Batches</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <OverviewStats overview={overview} />

      {/* Quick Action Shortcuts Banner */}
      <Card className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#0052CC] shrink-0" />
          <span className="text-xs font-extrabold text-[#0B2447]">Quick Faculty Shortcuts:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs font-extrabold">
          <Link
            href="/dashboard/tutor/batches"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 hover:bg-blue-100 transition"
          >
            <Layers className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>My Batches</span>
          </Link>
          <Link
            href="/dashboard/tutor/timetable"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 hover:bg-blue-100 transition"
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Schedule Calendar</span>
          </Link>
          <Link
            href="/dashboard/tutor/exams"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 hover:bg-blue-100 transition"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Exams & Evaluations</span>
          </Link>
        </div>
      </Card>

      {/* ── Today's Schedule & Upcoming Schedule Grids ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-[#0052CC]" />
              <h2 className="text-xs font-extrabold text-[#0B2447] uppercase tracking-wider">
                Today&apos;s Class Schedule
              </h2>
            </div>
            <span className="text-xs font-extrabold text-[#0052CC] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              {overview.todaysSchedule.length} Sessions
            </span>
          </div>

          {overview.todaysSchedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
              <Calendar className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No classes scheduled for today</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Enjoy your free day or prepare for your upcoming sessions.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {overview.todaysSchedule.map((session, index) => (
                <SessionCard key={`${session.id || 'today'}-${index}`} session={session} />
              ))}
            </div>
          )}
        </Card>

        {/* Bounded Scrollable & Filterable Upcoming Schedule */}
        <UpcomingScheduleSection upcomingSchedule={overview.upcomingSchedule} />
      </div>
    </div>
  );
}

// ─── Page Export ────────────────────────────────────────────────────────────

export default function TutorDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <DashboardLayout>
        <TutorDashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
