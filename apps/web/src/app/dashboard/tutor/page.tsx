'use client';

import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorOverview } from '@/features/tutor-dashboard/hooks/use-tutor-overview';
import type { TutorialSessionDto } from '@/features/tutor-dashboard/types/overview';
import { StatsSkeleton } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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

// ─── Session Card ────────────────────────────────────────────────────────────

function SessionCard({ session, showDate }: { session: TutorialSessionDto; showDate?: boolean }) {
  const isCancelled = session.sessionStatus === 'CANCELLED';
  const isLive = session.liveStatus === 'LIVE_NOW';

  const handleJoinClass = () => {
    if (session.meetingLink) {
      window.open(session.meetingLink, '_blank', 'noopener,noreferrer');
    }
  };

  const subjectColors: Record<string, { card: string; accent: string; text: string }> = {
    Physics: {
      card: 'border-l-blue-500 bg-gradient-to-r from-blue-50/60 via-white to-white',
      accent: 'bg-blue-600',
      text: 'text-blue-900',
    },
    Chemistry: {
      card: 'border-l-emerald-500 bg-gradient-to-r from-emerald-50/60 via-white to-white',
      accent: 'bg-emerald-600',
      text: 'text-emerald-900',
    },
    Biology: {
      card: 'border-l-amber-500 bg-gradient-to-r from-amber-50/60 via-white to-white',
      accent: 'bg-amber-600',
      text: 'text-amber-900',
    },
    Botany: {
      card: 'border-l-green-500 bg-gradient-to-r from-green-50/60 via-white to-white',
      accent: 'bg-green-600',
      text: 'text-green-900',
    },
    Zoology: {
      card: 'border-l-pink-500 bg-gradient-to-r from-pink-50/60 via-white to-white',
      accent: 'bg-pink-600',
      text: 'text-pink-900',
    },
  };

  const subjectName = session.subject?.name ?? '';
  const style = Object.entries(subjectColors).find(([k]) =>
    subjectName.toLowerCase().includes(k.toLowerCase()),
  )?.[1] ?? {
    card: 'border-l-violet-500 bg-white',
    accent: 'bg-violet-600',
    text: 'text-slate-900',
  };

  return (
    <div
      className={cn(
        'group relative rounded-2xl border-l-[4px] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all duration-200 border border-slate-200/80 shadow-2xs hover:shadow-md',
        isLive
          ? 'border-emerald-300 bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-white shadow-md ring-2 ring-emerald-400/30'
          : isCancelled
            ? 'border-rose-200 bg-rose-50/40 opacity-75'
            : style.card,
      )}
    >
      {/* Upper Info Row (Mobile-Friendly Stack) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
        {/* Time & Date Header Pill */}
        <div className="flex items-center justify-between sm:flex-col sm:justify-center p-2 sm:p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/80 shrink-0 sm:min-w-[105px]">
          <span className="text-xs font-mono font-extrabold text-slate-800">
            {formatTime(session.startsAt, session.endsAt)}
          </span>
          {showDate && session.date && (
            <span className="text-[10px] text-violet-700 bg-violet-50 sm:bg-transparent px-2 py-0.5 sm:p-0 rounded-md font-extrabold sm:mt-0.5">
              {new Date(session.date).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
              })}
            </span>
          )}
        </div>

        {/* Details Box */}
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
            <h4 className="text-sm font-extrabold text-slate-900 truncate group-hover:text-violet-700 transition-colors">
              {session.subject?.name || 'Subject Session'}
            </h4>
            <LiveStatusBadge status={session.liveStatus || (isLive ? 'LIVE_NOW' : 'UPCOMING')} />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-600">
            {session.batch && (
              <span className="inline-flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs font-mono text-[10px]">
                <Layers className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{session.batch.name}</span>
              </span>
            )}
            {session.branch && (
              <span className="inline-flex items-center gap-1 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200/80 text-[10px]">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{session.branch.name}</span>
              </span>
            )}
            <DeliveryBadge mode={session.deliveryMode || 'ONLINE'} />
          </div>

          {isCancelled && session.cancelledReason && (
            <p className="text-xs text-rose-600 italic font-medium pt-1">
              Reason: {session.cancelledReason}
            </p>
          )}
        </div>
      </div>

      {/* Footer Action Buttons (Full width on Mobile) */}
      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0 w-full sm:w-auto">
        {!isCancelled && (
          <Link
            href={`/dashboard/tutor/sessions/${session.id}`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/80 transition-colors shadow-2xs"
          >
            <UserCheck className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span>Mark Attendance</span>
          </Link>
        )}

        {!isCancelled && (isLive || session.canJoin) && (
          <button
            onClick={handleJoinClass}
            className={cn(
              'flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md active:scale-95',
              isLive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/15',
            )}
          >
            <Video className="w-3.5 h-3.5 shrink-0" />
            <span>{isLive ? 'Launch Class 🚀' : 'Join Link 🚀'}</span>
          </button>
        )}
      </div>
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
      bg: 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white',
      cardBg: 'bg-gradient-to-br from-violet-50/50 via-white to-white border-violet-100',
    },
    {
      name: 'Upcoming (7 Days)',
      value: overview.stats.upcomingClasses,
      sub: 'Next week sessions',
      icon: BookOpen,
      bg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white',
      cardBg: 'bg-gradient-to-br from-sky-50/50 via-white to-white border-sky-100',
    },
    {
      name: 'Assigned Batches',
      value: overview.stats.myBatches,
      sub: 'Active student groups',
      icon: Layers,
      bg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white',
      cardBg: 'bg-gradient-to-br from-amber-50/50 via-white to-white border-amber-100',
    },
    {
      name: 'Total Students',
      value: overview.stats.totalStudents,
      sub: 'Enrolled under batches',
      icon: Users,
      bg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
      cardBg: 'bg-gradient-to-br from-emerald-50/50 via-white to-white border-emerald-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className={cn(
              'group relative rounded-3xl border p-5 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between',
              stat.cardBg,
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {stat.name}
              </span>
              <div
                className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform',
                  stat.bg,
                )}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>

            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                {stat.value}
              </p>
              <p className="text-[11px] font-semibold text-slate-400 mt-1.5">{stat.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

function TutorDashboardContent() {
  const { user } = useAuth();
  const { overview, isLoading, error, refetch } = useTutorOverview();

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <div className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
        <StatsSkeleton count={4} />
        <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
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
      <div className="p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <EmptyState
          icon={<Calendar className="h-8 w-8 text-gray-400" />}
          title="No dashboard data available"
          description="Your dashboard overview will appear here once data is available."
        />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* ── Signature Violet Gradient Hero Header Banner (Tenant Admin Match) ───── */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-200" />
            <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
              Faculty Portal & Dashboard
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
            {greeting}, {user?.firstName || 'Faculty'}! 👋
          </h1>
          <p className="text-violet-200 text-xs mt-0.5">
            📅 {formattedDate} — Academic schedule and active batch overview.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Link
            href="/dashboard/tutor/timetable"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-xl text-xs font-bold transition shadow-2xs"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Schedule</span>
          </Link>
          <Link
            href="/dashboard/tutor/batches"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 bg-white text-violet-700 hover:bg-violet-50 font-bold border-0 shadow-xs rounded-xl text-xs"
          >
            <Layers className="w-3.5 h-3.5 text-violet-600" />
            <span>My Batches</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <OverviewStats overview={overview} />

      {/* Quick Action Shortcuts Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-600 shrink-0" />
          <span className="text-xs font-bold text-slate-800">Quick Faculty Actions:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
          <Link
            href="/dashboard/tutor/batches"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition"
          >
            <Layers className="w-3.5 h-3.5 text-violet-600" />
            <span>My Batches</span>
          </Link>
          <Link
            href="/dashboard/tutor/timetable"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition"
          >
            <CalendarDays className="w-3.5 h-3.5 text-violet-600" />
            <span>Schedule Calendar</span>
          </Link>
          <Link
            href="/dashboard/tutor/exams"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-violet-600" />
            <span>Exams & Evaluations</span>
          </Link>
        </div>
      </div>

      {/* ── Today's Schedule & Upcoming Schedule Grids ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-violet-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Today&apos;s Class Schedule
              </h2>
            </div>
            <span className="text-xs font-black text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
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
              {overview.todaysSchedule.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Schedule */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-sky-600" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Upcoming Sessions (Next 7 Days)
              </h2>
            </div>
            <span className="text-xs font-black text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
              {overview.upcomingSchedule.length} Sessions
            </span>
          </div>

          {overview.upcomingSchedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
              <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No upcoming classes scheduled</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                New sessions will appear here once published by management.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {overview.upcomingSchedule.map((session) => (
                <SessionCard key={session.id} session={session} showDate />
              ))}
            </div>
          )}
        </div>
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
