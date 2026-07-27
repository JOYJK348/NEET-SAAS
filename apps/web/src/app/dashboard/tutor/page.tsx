'use client';

import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorOverview } from '@/features/tutor-dashboard/hooks/use-tutor-overview';
import { useTutorJoinSession } from '@/features/tutor-dashboard/hooks/use-tutor-session';
import type { TutorialSessionDto } from '@/features/tutor-dashboard/types/overview';
import { StatsSkeleton, LoadingSpinner } from '@/components/ui/loading';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  BookOpen,
  Calendar,
  Users,
  Layers,
  Clock,
  MapPin,
  AlertCircle,
  XCircle,
  Video,
  Loader2,
  Radio,
  Wifi,
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

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'COMPLETED':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'DRAFT':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}

function getDayLabel(dayOfWeek: string | null): string {
  if (!dayOfWeek) return '';
  return dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1).toLowerCase();
}

// ─── Delivery Badge ───────────────────────────────────────────────────────────
function DeliveryBadge({ mode }: { mode?: string | null }) {
  if (!mode) return null;
  const config = {
    ONLINE: {
      label: 'Online',
      cls: 'bg-emerald-100 text-emerald-700',
      icon: <Wifi className="w-3 h-3" />,
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
function LiveStatusBadge({ status }: { status?: string | null }) {
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

// ─── Session Card ────────────────────────────────────────────────────────────

function SessionCard({ session, showDate }: { session: TutorialSessionDto; showDate?: boolean }) {
  const { join, isJoining } = useTutorJoinSession();
  const isCancelled = session.sessionStatus === 'CANCELLED';
  const isRescheduled =
    session.overrideType === 'TIME_CHANGED' || session.overrideType === 'TUTOR_CHANGED';

  const handleJoin = async () => {
    try {
      await join(session.id);
    } catch {
      toast.error('Cannot join class', {
        description: 'Meeting link not configured or class has ended.',
      });
    }
  };

  const subjectColors: Record<string, string> = {
    Physics: 'border-l-blue-400 bg-blue-50/10 hover:bg-blue-50/20',
    Chemistry: 'border-l-emerald-400 bg-emerald-50/10 hover:bg-emerald-50/20',
    Biology: 'border-l-rose-400 bg-rose-50/10 hover:bg-rose-50/20',
    Botany: 'border-l-green-400 bg-green-50/10 hover:bg-green-50/20',
    Zoology: 'border-l-pink-400 bg-pink-50/10 hover:bg-pink-50/20',
  };

  const subjectName = session.subject?.name ?? '';
  const colorClass =
    Object.entries(subjectColors).find(([k]) =>
      subjectName.toLowerCase().includes(k.toLowerCase()),
    )?.[1] ?? 'border-l-slate-300 bg-slate-50';

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border-l-4 border transition-colors',
        isCancelled
          ? 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10'
          : `${colorClass} border-slate-100`,
      )}
    >
      {/* Time column */}
      <div className="flex-shrink-0 text-center sm:text-left sm:w-20">
        <p
          className={cn(
            'text-xs font-black text-slate-900',
            isCancelled && 'text-red-400 line-through',
          )}
        >
          {formatTime(session.startsAt, session.endsAt)}
        </p>
        {showDate && session.date && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            {new Date(session.date).toLocaleDateString('en-US', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}
          </p>
        )}
      </div>

      {/* Session details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-[#111827]">
            {session.subject?.name || 'Unknown Subject'}
          </p>
          {isCancelled && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
              <XCircle className="h-3 w-3" aria-hidden="true" />
              CANCELLED
            </span>
          )}
          {isRescheduled && !isCancelled && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
              <Clock className="h-3 w-3" aria-hidden="true" />
              RESCHEDULED
            </span>
          )}
          <LiveStatusBadge status={session.liveStatus} />
          <DeliveryBadge mode={session.deliveryMode} />
        </div>

        <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-gray-500">
          {session.batch && (
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" aria-hidden="true" />
              {session.batch.name}
            </span>
          )}
          {session.branch && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {session.branch.name}
            </span>
          )}
        </div>

        {isCancelled && session.cancelledReason && (
          <p className="text-xs text-red-500 mt-1 italic">Reason: {session.cancelledReason}</p>
        )}
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

// ─── Overview Stats Row ─────────────────────────────────────────────────────

function OverviewStats({
  overview,
}: {
  overview: NonNullable<ReturnType<typeof useTutorOverview>['overview']>;
}) {
  const stats = [
    {
      name: "Today's Classes",
      value: overview.stats.todaysClasses,
      icon: Calendar,
      color: 'bg-violet-100 text-violet-600',
    },
    {
      name: 'Upcoming Classes',
      value: overview.stats.upcomingClasses,
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      name: 'My Batches',
      value: overview.stats.myBatches,
      icon: Layers,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      name: 'Total Students',
      value: overview.stats.totalStudents,
      icon: Users,
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.name}
            className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7C3AED]/50"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.name}
              </CardTitle>
              <div className={cn('p-2 rounded-xl', stat.color)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-2xl font-bold text-[#111827]">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Schedule List ───────────────────────────────────────────────────────────

function ScheduleSection({
  title,
  sessions,
  icon: Icon,
  showDate,
  emptyMessage,
}: {
  title: string;
  sessions: TutorialSessionDto[];
  icon: React.ElementType;
  showDate?: boolean;
  emptyMessage: string;
}) {
  const activeSessions = sessions.filter((s) => s.sessionStatus !== 'CANCELLED');
  const cancelledSessions = sessions.filter((s) => s.sessionStatus === 'CANCELLED');

  return (
    <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            {title}
          </CardTitle>
          <span className="text-xs text-muted-foreground">({sessions.length})</span>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-3">
        {sessions.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-6 w-6 text-gray-400" />}
            title={emptyMessage}
            description="Your schedule will appear here once classes are assigned."
          />
        ) : (
          <>
            {activeSessions.length > 0 && (
              <div className="space-y-2">
                {activeSessions.map((session) => (
                  <SessionCard key={session.id} session={session} showDate={showDate} />
                ))}
              </div>
            )}

            {cancelledSessions.length > 0 && (
              <details className="group">
                <summary className="flex items-center gap-1 text-xs text-red-500 cursor-pointer hover:text-red-600 py-1 select-none">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  <span>
                    {cancelledSessions.length} cancelled session
                    {cancelledSessions.length > 1 ? 's' : ''}
                  </span>
                  <span className="ml-auto group-open:rotate-180 transition-transform text-gray-400">
                    ▼
                  </span>
                </summary>
                <div className="mt-2 space-y-2">
                  {cancelledSessions.map((session) => (
                    <SessionCard key={session.id} session={session} showDate={showDate} />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

function TutorDashboardContent() {
  const { user } = useAuth();
  const { overview, isLoading, error, refetch } = useTutorOverview();

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="space-y-1">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <StatsSkeleton count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
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

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const liveSessions = overview.todaysSchedule.filter((s) => s.liveStatus === 'LIVE_NOW');

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Good Morning, {user?.firstName || 'Tutor'} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {formattedDate} — Here&apos;s your overview for today.
          </p>
        </div>
      </div>

      {/* Live Now Alert */}
      {liveSessions.length > 0 && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <span className="text-sm font-bold text-emerald-800">
            {liveSessions[0].subject?.name ?? 'A class'} is LIVE right now!
          </span>
        </div>
      )}

      {/* Stats Row */}
      <OverviewStats overview={overview} />

      {/* Today's Schedule + Upcoming Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ScheduleSection
          title="Today's Schedule"
          sessions={overview.todaysSchedule}
          icon={Clock}
          emptyMessage="No classes scheduled for today"
        />

        <ScheduleSection
          title="Upcoming Schedule"
          sessions={overview.upcomingSchedule}
          icon={Calendar}
          showDate
          emptyMessage="No upcoming classes scheduled"
        />
      </div>
    </div>
  );
}

// ─── Page Export ────────────────────────────────────────────────────────────

export default function TutorDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR', 'FACULTY']}>
      <DashboardLayout>
        <TutorDashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
