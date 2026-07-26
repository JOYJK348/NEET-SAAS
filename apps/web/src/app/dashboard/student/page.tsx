'use client';

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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-start gap-3 hover:-translate-y-0.5 transition-transform duration-150">
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          iconBg,
        )}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
          {label}
        </p>
        <p className="text-xl font-black text-slate-900 mt-1 leading-none">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────
function SessionCard({ session }: { session: StudentSessionDto }) {
  const { join, isJoining } = useJoinSession();

  const handleJoin = async () => {
    try {
      await join(session.id);
    } catch {
      toast.error('Cannot join class', {
        description: 'Meeting link not available or class has ended.',
      });
    }
  };

  const subjectColors: Record<string, string> = {
    Physics: 'border-l-blue-400 bg-blue-50',
    Chemistry: 'border-l-emerald-400 bg-emerald-50',
    Biology: 'border-l-rose-400 bg-rose-50',
    Botany: 'border-l-green-400 bg-green-50',
    Zoology: 'border-l-pink-400 bg-pink-50',
  };

  const subjectName = session.subject?.name ?? '';
  const colorClass =
    Object.entries(subjectColors).find(([k]) =>
      subjectName.toLowerCase().includes(k.toLowerCase()),
    )?.[1] ?? 'border-l-slate-300 bg-slate-50';

  return (
    <div
      className={cn(
        'rounded-xl border-l-4 p-4 flex flex-col sm:flex-row sm:items-center gap-3',
        colorClass,
        'border border-slate-100',
      )}
    >
      {/* Time */}
      <div className="flex-shrink-0 text-center sm:text-left sm:w-20">
        <p className="text-xs font-black text-slate-900">{session.startsAt}</p>
        <p className="text-[10px] text-slate-400">– {session.endsAt}</p>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 truncate">
          {session.subject?.name ?? 'Unknown Subject'}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{session.batch?.name ?? ''}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <LiveStatusBadge status={session.liveStatus} />
          <DeliveryBadge mode={session.deliveryMode} />
        </div>
      </div>

      {/* Action */}
      {session.canJoin && (
        <button
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold transition-all duration-150 min-h-[40px] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-emerald-200"
        >
          {isJoining ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Video className="w-3.5 h-3.5" />
          )}
          Join Live Class
        </button>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptySchedule() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <CalendarCheck2 className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">No classes today</p>
      <p className="text-xs text-slate-400 mt-1">Enjoy your free day! 🎉</p>
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
            <p className="text-violet-200 text-sm mt-1">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
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
          value={stats?.attendanceRate != null ? `${stats.attendanceRate}%` : 'N/A'}
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

      {/* ── Today's Schedule ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
            Today&apos;s Classes
          </h2>
          {overview?.todaysSchedule && overview.todaysSchedule.length > 0 && (
            <span className="text-xs font-bold text-violet-600">
              {overview.todaysSchedule.length} session
              {overview.todaysSchedule.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {!overview || overview.todaysSchedule.length === 0 ? (
          <EmptySchedule />
        ) : (
          <div className="space-y-3">
            {overview.todaysSchedule.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
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
