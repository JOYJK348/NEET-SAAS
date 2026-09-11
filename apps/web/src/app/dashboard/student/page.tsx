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
import { Card } from '@/components/ui/card';
import {
  BookOpen,
  CalendarCheck2,
  ClipboardList,
  GraduationCap,
  Layers,
  Radio,
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
  BrainCircuit,
  Lock,
  RefreshCw,
  BookMarked,
  Zap,
  FlaskConical,
  Dna,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generateGoogleCalendarUrl } from '@/lib/google-calendar-url';
import { getClassStatus } from '@/lib/class-status';

// ─── Skeleton Loading (Matching Tenant Admin Skeleton Style) ───────────────
function OverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-4 pb-24 font-sans w-full">
      <div className="h-20 bg-blue-50/70 border border-blue-200 rounded-2xl" />
      <div className="h-20 bg-blue-50/70 border border-blue-200 rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-2xl border border-slate-200" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-2xl border border-slate-200" />
        ))}
      </div>
      <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200" />
    </div>
  );
}

// ─── Delivery Mode Badge (Tenant Admin Vibrant Mild Theme) ───────────────────
function DeliveryBadge({ mode }: { mode: string | null }) {
  if (!mode) return null;
  const config = {
    ONLINE: {
      label: 'Online Live',
      cls: 'bg-sky-100/90 text-sky-800 border-sky-300',
      icon: <Video className="w-3 h-3 text-sky-700" />,
    },
    CLASSROOM: {
      label: 'Campus Classroom',
      cls: 'bg-amber-100/90 text-amber-800 border-amber-300',
      icon: <MapPin className="w-3 h-3 text-amber-700" />,
    },
    HYBRID: {
      label: 'Hybrid Mode',
      cls: 'bg-indigo-100/90 text-indigo-800 border-indigo-300',
      icon: <Radio className="w-3 h-3 text-indigo-700" />,
    },
  }[mode] ?? {
    label: mode,
    cls: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: null,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs',
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
      <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#F31260] text-white shadow-2xs uppercase tracking-wider">
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        LIVE NOW
      </span>
    );
  }
  if (status === 'COMPLETED') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-300 shadow-2xs">
      Upcoming
    </span>
  );
}

// ─── Metric Stat Card (Exact Tenant Admin Card Theme) ────────────────────────
function MetricCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs flex items-center gap-3 transition-all hover:border-[#0052CC]/40">
      <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5 leading-none">
          {value}
        </p>
        {sub && <p className="text-[11px] font-bold text-[#0052CC] mt-1.5 truncate">{sub}</p>}
      </div>
    </Card>
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

// ─── Subject Theme Helper (Light Mild Color Palette) ──────────────────────────
function getSubjectTheme(subjectName?: string) {
  const s = (subjectName || '').toLowerCase();
  if (s.includes('physic')) {
    return {
      cardBg: 'bg-[#EFF6FF] border-blue-200/90 hover:border-[#0052CC]/60 hover:shadow-xs',
      badgeBg: 'bg-[#0052CC] text-white',
      timeBadge: 'bg-white/90 text-[#0052CC] border-blue-200',
      pillBg: 'bg-white/80 text-blue-900 border-blue-200/70',
      titleColor: 'text-[#0B2447]',
      icon: Zap,
    };
  }
  if (s.includes('chemist')) {
    return {
      cardBg: 'bg-[#ECFDF5] border-emerald-200/90 hover:border-emerald-500/60 hover:shadow-xs',
      badgeBg: 'bg-emerald-600 text-white',
      timeBadge: 'bg-white/90 text-emerald-700 border-emerald-200',
      pillBg: 'bg-white/80 text-emerald-950 border-emerald-200/70',
      titleColor: 'text-[#064E3B]',
      icon: FlaskConical,
    };
  }
  if (s.includes('biolog') || s.includes('botan') || s.includes('zoolo')) {
    return {
      cardBg: 'bg-[#FFF1F2] border-rose-200/90 hover:border-rose-500/60 hover:shadow-xs',
      badgeBg: 'bg-rose-600 text-white',
      timeBadge: 'bg-white/90 text-rose-700 border-rose-200',
      pillBg: 'bg-white/80 text-rose-950 border-rose-200/70',
      titleColor: 'text-[#881337]',
      icon: Dna,
    };
  }
  return {
    cardBg: 'bg-[#F5F3FF] border-purple-200/90 hover:border-purple-500/60 hover:shadow-xs',
    badgeBg: 'bg-purple-600 text-white',
    timeBadge: 'bg-white/90 text-purple-700 border-purple-200',
    pillBg: 'bg-white/80 text-purple-950 border-purple-200/70',
    titleColor: 'text-[#4C1D95]',
    icon: BookOpen,
  };
}

// ─── Compact Timeline Session Card (Light Mild Color Theme) ─────────────────
function CompactSessionRow({
  session,
  showDate = false,
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

  const subjectName = session.subject?.name ?? 'Session';
  const theme = getSubjectTheme(subjectName);
  const SubjectIcon = theme.icon;

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const statusInfo = useMemo(() => getClassStatus(session), [session, tick]);
  const canJoinNow = statusInfo.canJoin;

  return (
    <div
      className={cn(
        'rounded-2xl border p-3.5 sm:p-4 space-y-2.5 transition-all shadow-2xs',
        theme.cardBg,
        statusInfo.isLive &&
          'bg-gradient-to-r from-emerald-100/90 via-teal-50 to-white border-emerald-400 ring-2 ring-emerald-400/30 shadow-md',
      )}
    >
      {/* Top Header Row: Subject Title + Status + Delivery Mode */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h4 className={cn('font-extrabold text-xs sm:text-base leading-tight truncate', theme.titleColor)}>
            {subjectName}
          </h4>
          <LiveStatusBadge status={statusInfo.isEnded ? 'COMPLETED' : session.liveStatus} />
        </div>

        <div className="shrink-0">
          <DeliveryBadge mode={session.deliveryMode} />
        </div>
      </div>

      {/* Middle Meta Chips Row (Distinct Vibrant Light Mild Colors) */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium pt-0.5">
        {/* Time Chip - Soft Royal Blue */}
        <span className="font-mono font-black text-[#0052CC] bg-blue-100/90 border border-blue-300 px-2.5 py-0.5 rounded-lg shadow-2xs flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#0052CC] shrink-0" />
          {formatTime(session.startsAt, session.endsAt)}
        </span>

        {/* Date Chip (When shown) - Soft Cyan */}
        {showDate && session.date && (
          <span className="font-extrabold text-cyan-900 bg-cyan-100/90 border border-cyan-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
            <Calendar className="w-3 h-3 text-cyan-700 shrink-0" />
            {new Date(
              session.date.includes('T') ? session.date : session.date + 'T00:00:00',
            ).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
          </span>
        )}

        {/* Batch Chip - Soft Purple */}
        {session.batch?.name && (
          <span className="font-extrabold text-purple-900 bg-purple-100/90 border border-purple-300 px-2.5 py-0.5 rounded-lg truncate max-w-[160px] shadow-2xs">
            {session.batch.name}
          </span>
        )}

        {/* Faculty Chip - Soft Amber Gold */}
        <span className="font-extrabold text-amber-900 bg-amber-100/90 border border-amber-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs">
          <Users className="w-3 h-3 text-amber-700 shrink-0" />
          <span>{session.tutorName || 'Faculty'}</span>
        </span>
      </div>

      {/* Action Footer Row */}
      <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
        <button
          onClick={handleJoin}
          disabled={!canJoinNow}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer truncate',
            canJoinNow
              ? isFeeLocked
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 active:scale-98'
                : 'bg-[#0052CC] hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-98'
              : 'bg-teal-50/90 text-teal-800 border border-teal-200/90 font-extrabold cursor-not-allowed opacity-90',
          )}
        >
          <Video className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{statusInfo.buttonLabel}</span>
        </button>

        <a
          href={generateGoogleCalendarUrl({
            title: `${subjectName} - ${session.batch?.name || 'Class'}`,
            description: `Scheduled Class with Tutor ${session.tutorName || 'Faculty'}.`,
            startTime: session.startsAt,
            endTime: session.endsAt,
            dateStr: session.date || undefined,
            joiningLink: (session as any).meetingUrl || (session as any).meetingLink || undefined,
          })}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-100/80 hover:bg-emerald-200 text-emerald-800 font-black text-xs border border-emerald-300 shadow-2xs transition cursor-pointer shrink-0"
          title="Add to Google Calendar"
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span className="hidden sm:inline">Add Calendar</span>
        </a>
      </div>
    </div>
  );
}

// ─── Date Grouped Upcoming Schedule Component ──────────────────────────────────
function DateGroupedUpcomingSchedule({
  upcomingSchedule,
  isFeeLocked,
}: {
  upcomingSchedule: StudentSessionDto[];
  isFeeLocked?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');

  const subjectList = useMemo(() => {
    const defaultSubjects = ['Physics', 'Chemistry', 'Biology', 'Botany', 'Zoology'];
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

  const groupedByDate = useMemo(() => {
    const map = new Map<string, StudentSessionDto[]>();
    (filteredSchedule || []).forEach((session) => {
      let dateKey = 'Upcoming Sessions';
      if (session.date) {
        const d = new Date(session.date.includes('T') ? session.date : session.date + 'T00:00:00');
        dateKey = d.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
        });
      }
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(session);
    });
    return Array.from(map.entries());
  }, [filteredSchedule]);

  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3.5 flex flex-col justify-between w-full">
      {/* Header Toolbar */}
      <div className="space-y-2.5 border-b border-slate-100 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] shrink-0">
              <CalendarCheck2 className="w-4 h-4 text-[#0052CC]" />
            </div>
            <h2 className="text-xs sm:text-sm font-extrabold text-[#0B2447] tracking-tight">
              Upcoming Schedule (Next 7 Days)
            </h2>
          </div>
          <span className="self-start sm:self-auto text-[11px] font-extrabold text-[#0052CC] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">
            {filteredSchedule.length} of {upcomingSchedule?.length || 0} Sessions
          </span>
        </div>

        {/* Search & Subject Filter Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-0.5">
          <div className="flex items-center gap-2 flex-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subject, faculty or batch..."
              className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {subjectList.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-[11px] font-bold">
              <button
                onClick={() => setSelectedSubjectFilter('ALL')}
                className={cn(
                  'px-2.5 py-1 rounded-xl text-xs font-bold transition-all text-center shrink-0 cursor-pointer',
                  selectedSubjectFilter === 'ALL'
                    ? 'bg-[#0052CC] text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200',
                )}
              >
                All
              </button>
              {subjectList.map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSelectedSubjectFilter(subj)}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-xs font-bold transition-all text-center shrink-0 cursor-pointer',
                    selectedSubjectFilter.toLowerCase() === subj.toLowerCase()
                      ? 'bg-[#0052CC] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200',
                  )}
                >
                  {subj}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Date Grouped Timeline Scrollable Container */}
      <div className="max-h-[500px] overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
        {!upcomingSchedule || upcomingSchedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-4 space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-1 shadow-2xs">
              <CalendarCheck2 className="w-5 h-5 text-[#0052CC]" />
            </div>
            <p className="text-xs font-extrabold text-[#0B2447]">No upcoming classes scheduled</p>
            <p className="text-[11px] text-slate-500 font-medium max-w-xs">
              Upcoming sessions for the next 7 days will appear here.
            </p>
          </div>
        ) : groupedByDate.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40 space-y-2">
            <p className="text-xs font-bold text-slate-700">No sessions match your search criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubjectFilter('ALL');
              }}
              className="px-3 py-1 rounded-xl bg-[#0052CC] text-white text-xs font-extrabold shadow-2xs hover:bg-blue-700 transition cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          groupedByDate.map(([dateGroup, sessions]) => (
            <div key={dateGroup} className="space-y-2">
              <div className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-xs px-3 py-1 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <span className="text-xs font-extrabold text-[#0B2447] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0052CC]" />
                  {dateGroup}
                </span>
                <span className="text-[10px] font-extrabold text-[#0052CC] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
                </span>
              </div>
              <div className="space-y-2">
                {sessions.map((session, idx) => (
                  <CompactSessionRow
                    key={`${session.id || 'upcoming'}-${idx}`}
                    session={session}
                    showDate={false}
                    isFeeLocked={isFeeLocked}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// ─── Unified Schedule Hub with Mobile Segmented Tabs ──────────────────────────
function UnifiedStudentScheduleHub({
  todaysSchedule = [],
  upcomingSchedule = [],
  isFeeLocked,
}: {
  todaysSchedule: StudentSessionDto[];
  upcomingSchedule: StudentSessionDto[];
  isFeeLocked?: boolean;
}) {
  const [activeMobileTab, setActiveMobileTab] = useState<'today' | 'upcoming'>('today');

  return (
    <div className="space-y-4">
      {/* Mobile Segmented Switcher Tab Bar (< lg screens) */}
      <div className="flex lg:hidden items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-extrabold">
        <button
          onClick={() => setActiveMobileTab('today')}
          className={cn(
            'flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer',
            activeMobileTab === 'today'
              ? 'bg-[#0052CC] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900',
          )}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Today ({todaysSchedule.length})</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('upcoming')}
          className={cn(
            'flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer',
            activeMobileTab === 'upcoming'
              ? 'bg-[#0052CC] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900',
          )}
        >
          <CalendarCheck2 className="w-3.5 h-3.5" />
          <span>Upcoming ({upcomingSchedule.length})</span>
        </button>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Schedule */}
        <div
          className={cn(
            'lg:col-span-5 space-y-4',
            activeMobileTab === 'today' ? 'block' : 'hidden lg:block',
          )}
        >
          <Card className="rounded-2xl border-slate-200 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3.5 w-full h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] shrink-0">
                    <BookOpen className="w-4 h-4 text-[#0052CC]" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-extrabold text-[#0B2447] tracking-tight">
                    Today&apos;s Class Schedule
                  </h2>
                </div>
                <span className="text-[11px] font-extrabold text-[#0052CC] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {todaysSchedule.length} Sessions
                </span>
              </div>

              {todaysSchedule.length === 0 ? (
                <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-2xl p-5 text-center shadow-2xs space-y-3 my-auto">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-blue-200 text-[#0052CC] flex items-center justify-center mx-auto shadow-2xs">
                    <CalendarCheck2 className="w-5 h-5 text-[#0052CC]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#0B2447]">
                      No Live Classes Scheduled Today
                    </h3>
                    <p className="text-[11px] text-slate-600 font-medium max-w-xs mx-auto">
                      You have zero scheduled classes today. Catch up on video recordings or attempt a mock test!
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                    <Link
                      href="/dashboard/recordings"
                      className="px-3.5 py-2 rounded-xl bg-[#0052CC] text-white text-xs font-extrabold shadow-2xs hover:bg-blue-700 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Watch Recordings</span>
                    </Link>
                    <Link
                      href="/dashboard/student/exams"
                      className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#0052CC]" />
                      <span>Practice CBT Tests</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {todaysSchedule.map((session, idx) => (
                    <CompactSessionRow
                      key={`${session.id || 'today'}-${idx}`}
                      session={session}
                      showDate={false}
                      isFeeLocked={isFeeLocked}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Upcoming Schedule */}
        <div
          className={cn(
            'lg:col-span-7 space-y-4',
            activeMobileTab === 'upcoming' ? 'block' : 'hidden lg:block',
          )}
        >
          <DateGroupedUpcomingSchedule
            upcomingSchedule={upcomingSchedule}
            isFeeLocked={isFeeLocked}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Student Content ─────────────────────────────────────────────────────
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
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-slate-900">Could not load dashboard</h3>
          <p className="text-xs text-slate-500 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  const stats = overview?.stats;
  const studentName = user?.firstName || 'Student';
  const attendanceRate = stats?.attendanceRate ?? null;

  return (
    <div className="w-full pb-20 space-y-4 font-sans text-[#0F172A]">
      {/* ── 1ST WELCOME HEADER BANNER (EXACT TENANT-ADMIN BANNER THEME) ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-5 rounded-2xl shadow-2xs border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3.5 min-w-0">
          <Avatar className="w-11 h-11 sm:w-13 sm:h-13 border-2 border-[#0052CC] shrink-0 shadow-2xs">
            <AvatarImage src={user?.avatar || undefined} alt={studentName} />
            <AvatarFallback className="bg-[#0052CC] text-white font-extrabold text-sm sm:text-base">
              {studentName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
              <span>Student Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Academic Dashboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B2447] truncate">
              {greeting}, {studentName}!
            </h1>
            <p className="text-xs text-slate-600 font-medium truncate flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[#0B2447]">
                {overview?.enrolledCourses?.[0] || 'NEET Coaching Academy'}
              </span>
              <span className="text-slate-400">•</span>
              <span>AY 2026–2027 Academic Session</span>
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/timetable"
          className="hidden xs:flex px-4 py-2.5 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-2xs items-center gap-1.5 shrink-0 transition-all cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>My Timetable</span>
        </Link>
      </div>

      {/* 🔴 2ND SECTION: LIVE CLASS BANNER (WHEN LIVE CLASS IS ACTIVE) ── */}
      {overview && overview.liveNow && overview.liveNow.length > 0 && (
        (() => {
          const activeLiveSession = overview.liveNow[0];
          return (
            <div className="w-full bg-gradient-to-r from-[#061539] via-[#092256] to-[#0D2D6C] border border-blue-900/50 rounded-2xl p-4 sm:p-5 shadow-lg shadow-blue-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans text-white">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#F31260] text-white px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE NOW
                  </span>
                  <span className="text-xs font-extrabold text-[#38BDF8] truncate">
                    {activeLiveSession.subject?.name || 'Live Masterclass'}
                  </span>
                </div>
                <h3 className="text-xs sm:text-base font-extrabold text-white truncate">
                  {activeLiveSession.batch?.name
                    ? `${activeLiveSession.subject?.name || 'Class'} — ${activeLiveSession.batch.name}`
                    : 'Live Masterclass'}
                </h3>
                <p className="text-xs text-sky-200/90 font-medium flex items-center gap-2 flex-wrap">
                  <span>Prof. {activeLiveSession.tutorName || 'Senior Faculty'}</span>
                  <span>•</span>
                  <span>{formatTime(activeLiveSession.startsAt, activeLiveSession.endsAt)}</span>
                </p>
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
                className="w-full sm:w-auto bg-[#F31260] hover:bg-[#E10E54] active:scale-98 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shrink-0 shadow-md shadow-rose-950/30 flex items-center justify-center gap-2 cursor-pointer transition-all tracking-wide uppercase"
              >
                <span>JOIN LIVE CLASS</span>
                <ArrowRight className="w-4 h-4 text-white shrink-0" />
              </button>
            </div>
          );
        })()
      )}


      {/* ── 4. Metric Stat Cards Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          icon={<CalendarCheck2 className="w-5 h-5 text-[#0052CC]" />}
          label="Today's Classes"
          value={stats?.todaysClasses ?? '0'}
          sub={stats?.upcomingClasses ? `+${stats.upcomingClasses} upcoming` : 'No upcoming'}
        />

        <MetricCard
          icon={<ClipboardList className="w-5 h-5 text-[#0052CC]" />}
          label="Attendance Rate"
          value={attendanceRate != null ? `${attendanceRate}%` : 'Nil'}
          sub={
            attendanceRate != null
              ? attendanceRate >= 75
                ? 'Excellent Attendance'
                : 'Below 75%'
              : 'No history logs'
          }
        />

        <MetricCard
          icon={<Layers className="w-5 h-5 text-[#0052CC]" />}
          label="Active Batches"
          value={stats?.activeBatches ?? '0'}
          sub="Enrolled Batches"
        />

        <MetricCard
          icon={<BookMarked className="w-5 h-5 text-[#0052CC]" />}
          label="Upcoming"
          value={stats?.upcomingClasses ?? '0'}
          sub="Next 7 Days"
        />
      </div>

      {/* ── 5. Unified Mobile-Segmented & Date-Grouped Schedule Hub ─────────── */}
      <UnifiedStudentScheduleHub
        todaysSchedule={overview?.todaysSchedule || []}
        upcomingSchedule={overview?.upcomingSchedule || []}
        isFeeLocked={isFeeLocked}
      />
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
