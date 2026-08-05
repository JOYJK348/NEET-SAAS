'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/providers/auth-provider';
import { useStudentOverview } from '@/features/student-dashboard/hooks/use-student-overview';
import { useJoinSession } from '@/features/student-dashboard/hooks/use-student-timetable';
import type { StudentSessionDto } from '@/features/student-dashboard/types/student-dashboard.types';
import {
  BookOpen,
  CalendarCheck2,
  ClipboardList,
  GraduationCap,
  Layers,
  Loader2,
  Radio,
  Sparkles,
  Video,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function OverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-5 p-4 sm:p-6 pb-24">
      <div className="h-28 bg-slate-100 rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
        ))}
      </div>
      <div className="h-56 bg-slate-100 rounded-2xl" />
    </div>
  );
}

// ─── Delivery Mode Badge ──────────────────────────────────────────────────────
function DeliveryBadge({ mode }: { mode: string | null }) {
  if (!mode) return null;
  const config = {
    ONLINE: {
      label: 'Online',
      cls: 'bg-sky-100 text-sky-700',
      icon: <Video className="w-3 h-3" />,
    },
    CLASSROOM: {
      label: 'Classroom',
      cls: 'bg-amber-100 text-amber-700',
      icon: <MapPin className="w-3 h-3" />,
    },
    HYBRID: {
      label: 'Hybrid',
      cls: 'bg-violet-100 text-violet-700',
      icon: <Radio className="w-3 h-3" />,
    },
  }[mode] ?? { label: mode, cls: 'bg-slate-100 text-slate-600', icon: null };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
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
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        LIVE
      </span>
    );
  }
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
        Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
      Upcoming
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
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
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-start gap-3 hover:-translate-y-0.5 transition-all duration-200">
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-100 shadow-2xs',
          iconBg,
        )}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1 leading-none">{value}</p>
        {sub && <p className="text-[11px] font-semibold text-slate-400 mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({ session, showDate }: { session: StudentSessionDto; showDate?: boolean }) {
  const { join, isJoining } = useJoinSession();
  const [isWaitingApproval, setIsWaitingApproval] = useState(false);

  const handleJoin = async () => {
    setIsWaitingApproval(true);
    toast.info("Waiting for Tutor's Approval ⏳", {
      description: `Request sent to ${session.tutorName || 'Bharathi M'}. You will be redirected once approved.`,
    });

    try {
      setTimeout(async () => {
        try {
          await join(session.id);
          setIsWaitingApproval(false);
        } catch {
          setIsWaitingApproval(false);
          toast.error('Cannot join class', {
            description: 'Meeting link not available or class has ended.',
          });
        }
      }, 2500);
    } catch {
      setIsWaitingApproval(false);
      toast.error('Cannot join class', {
        description: 'Meeting link not available or class has ended.',
      });
    }
  };

  const subjectName = session.subject?.name ?? 'Subject Session';
  const initial = subjectName.charAt(0).toUpperCase();
  const isLive = session.liveStatus === 'LIVE_NOW';

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3.5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs',
        isLive && 'border-emerald-300 bg-gradient-to-r from-emerald-50/60 via-teal-50/30 to-white ring-2 ring-emerald-400/20',
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
              <span>{session.startsAt} – {session.endsAt}</span>
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
          <LiveStatusBadge status={session.liveStatus} />
        </div>
      </div>

      {/* Meta Details Row: Batch, Tutor Name & Delivery Mode */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {session.batch?.name && (
          <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-extrabold text-slate-700">
            <Layers className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            <span className="truncate max-w-[150px] sm:max-w-none">{session.batch.name}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-extrabold text-slate-700">
          <span className="text-slate-400">👤 Tutor:</span>
          <strong className="text-slate-900 font-black">
            {session.tutorName || 'Bharathi M'}
          </strong>
        </span>
        <DeliveryBadge mode={session.deliveryMode} />
      </div>

      {/* Action Button: Full-width on Mobile */}
      {(session.canJoin || isLive) && (
        <div className="pt-1 border-t border-slate-100">
          <button
            onClick={handleJoin}
            disabled={isJoining || isWaitingApproval}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-150 min-h-[42px] disabled:opacity-75 disabled:cursor-not-allowed shadow-2xs active:scale-98 text-center',
              isWaitingApproval
                ? 'bg-amber-500 text-white shadow-amber-500/20 animate-pulse'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20',
            )}
          >
            {isJoining || isWaitingApproval ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Video className="w-4 h-4" />
            )}
            {isWaitingApproval ? "Waiting for Tutor's Approval... ⏳" : 'Join Live Class 🚀'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptySchedule({ title = 'No classes today', sub = 'Enjoy your free day! 🎉' }: { title?: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-2.5">
        <CalendarCheck2 className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm font-bold text-slate-700">{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs">{sub}</p>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function StudentOverviewContent() {
  const { user } = useAuth();
  const { overview, isLoading, error } = useStudentOverview();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  if (isLoading) return <OverviewSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Could not load dashboard</p>
          <p className="text-xs text-slate-400 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  const stats = overview?.stats;

  return (
    <div className="min-h-screen bg-[#F7F8FC] p-4 sm:p-6 pb-24 space-y-5">
      {/* ── Welcome Banner ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md shadow-violet-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span className="text-xs font-semibold text-violet-200 uppercase tracking-wider">
                Student Dashboard
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight">
              {greeting}, {user?.firstName}! 👋
            </h1>
            <p className="text-violet-200 text-xs mt-0.5">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {overview?.enrolledCourses && overview.enrolledCourses.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/20 backdrop-blur-sm text-[11px] font-bold text-white border border-white/20">
                  Course: {overview.enrolledCourses.join(', ')}
                </span>
              )}
              {overview?.enrolledBatches && overview.enrolledBatches.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/20 backdrop-blur-sm text-[11px] font-bold text-white border border-white/20">
                  Batches: {overview.enrolledBatches.join(', ')}
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Live Now Alert */}
        {overview && overview.liveNow.length > 0 && (
          <div className="mt-4 flex items-center gap-2 bg-emerald-500/20 rounded-xl px-3 py-2 border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold text-emerald-100">
              {overview.liveNow[0].subject?.name ?? 'A class'} is LIVE right now!
            </span>
          </div>
        )}
      </div>

      {/* ── KPI Strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          icon={<CalendarCheck2 className="w-5 h-5" />}
          label="Today's Classes"
          value={stats?.todaysClasses ?? '—'}
          sub={stats?.upcomingClasses ? `+${stats.upcomingClasses} upcoming` : 'No upcoming'}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <KpiCard
          icon={<Layers className="w-5 h-5" />}
          label="Active Batches"
          value={stats?.activeBatches ?? '—'}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <KpiCard
          icon={<ClipboardList className="w-5 h-5" />}
          label="Attendance"
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
              ? 'text-rose-500'
              : 'text-amber-500'
          }
        />
        <KpiCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Upcoming"
          value={stats?.upcomingClasses ?? '—'}
          sub="Next 7 days"
          iconBg="bg-violet-50"
          iconColor="text-violet-500"
        />
      </div>

      {/* ── Today's Schedule & Upcoming Schedule 2-Column Responsive Grid ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Classes */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-600" />
              Today&apos;s Class Schedule
            </h2>
            <span className="text-xs font-black text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
              {overview?.todaysSchedule?.length || 0} Sessions
            </span>
          </div>

          {!overview || overview.todaysSchedule.length === 0 ? (
            <EmptySchedule title="No classes scheduled for today" sub="Enjoy your free day! 🎉" />
          ) : (
            <div className="space-y-3">
              {overview.todaysSchedule.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Sessions (Next 7 Days) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-sky-600" />
              Upcoming Sessions (Next 7 Days)
            </h2>
            <span className="text-xs font-black text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
              {overview?.upcomingSchedule?.length || 0} Sessions
            </span>
          </div>

          {!overview || !overview.upcomingSchedule || overview.upcomingSchedule.length === 0 ? (
            <EmptySchedule title="No upcoming classes scheduled" sub="Upcoming sessions for the next 7 days will appear here." />
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
