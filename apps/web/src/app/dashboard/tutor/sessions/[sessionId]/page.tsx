'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTutorSession } from '@/features/tutor-dashboard/hooks/use-tutor-session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BulkAttendanceItem } from '@/features/tutor-dashboard/services/session-service';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Layers,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  UserX,
  UserMinus,
  Hourglass,
  Save,
  Loader2,
  CheckCircle,
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getStatusBadge(status: string): {
  label: string;
  className: string;
  icon: React.ElementType;
} {
  switch (status) {
    case 'SCHEDULED':
      return { label: 'Scheduled', className: 'bg-blue-100 text-blue-700', icon: Clock };
    case 'COMPLETED':
      return { label: 'Completed', className: 'bg-green-100 text-green-700', icon: CheckCircle2 };
    case 'CANCELLED':
      return { label: 'Cancelled', className: 'bg-red-100 text-red-700', icon: XCircle };
    case 'DRAFT':
      return { label: 'Draft', className: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-600', icon: AlertTriangle };
  }
}

function getOverrideLabel(type: string | null | undefined): string | null {
  switch (type) {
    case 'TIME_CHANGED':
      return 'Time was rescheduled';
    case 'TUTOR_CHANGED':
      return 'Tutor was changed';
    case 'ROOM_CHANGED':
      return 'Room was changed';
    case 'DATE_CHANGED':
      return 'Date was changed';
    case 'CANCELLED':
      return 'Session was cancelled';
    default:
      return null;
  }
}

// ─── Info Row ───────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-[#111827]">{value}</p>
      </div>
    </div>
  );
}

// ─── ATTENDANCE MARK ROW ─────────────────────────────────────────────────────

function AttendanceMarkRow({
  studentName,
  initials,
  admissionNumber,
  currentStatus,
  lateMinutes,
  onStatusChange,
  onLateMinutesChange,
}: {
  studentName: string;
  initials: string;
  admissionNumber: string | undefined;
  currentStatus: string;
  lateMinutes: number | undefined;
  onStatusChange: (status: string) => void;
  onLateMinutesChange: (minutes: number | undefined) => void;
}) {
  const isLate = currentStatus === 'LATE';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-shadow">
      {/* Avatar + Name */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-9 w-9 border border-slate-200 flex-shrink-0">
          <AvatarFallback className="bg-white text-slate-700 text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{studentName}</p>
          {admissionNumber && (
            <p className="text-[10px] text-slate-400 font-mono truncate">{admissionNumber}</p>
          )}
        </div>
      </div>

      {/* 3 Status Buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
        <button
          type="button"
          onClick={() => onStatusChange('PRESENT')}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95',
            currentStatus === 'PRESENT'
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200',
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Present</span>
        </button>
        <button
          type="button"
          onClick={() => onStatusChange('ABSENT')}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95',
            currentStatus === 'ABSENT'
              ? 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-200'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200',
          )}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Absent</span>
        </button>
        <button
          type="button"
          onClick={() => onStatusChange('LATE')}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95',
            currentStatus === 'LATE'
              ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-200'
              : 'bg-white text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200',
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Late</span>
        </button>
      </div>

      {/* Late minutes input */}
      {isLate && (
        <div className="flex-shrink-0 w-16">
          <input
            type="number"
            min={0}
            max={999}
            placeholder="min"
            value={lateMinutes ?? ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
              onLateMinutesChange(val);
            }}
            className="w-full text-[10px] px-1.5 py-1 rounded border border-amber-200 bg-amber-50 text-amber-700 font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
        </div>
      )}
    </div>
  );
}

// ─── Session Detail Content ─────────────────────────────────────────────────

function SessionDetailContent() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const { user } = useAuth();
  const { sessionDetails, isLoading, error, refetch, markAttendance, isMarking, markResult } =
    useTutorSession(sessionId);

  // Local attendance state: map of admissionId → status
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [lateMinutesMap, setLateMinutesMap] = useState<Record<string, number | undefined>>({});

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    const attendance = sessionDetails?.attendance;
    if (!attendance) return;
    if (attendance.records && attendance.records.length > 0) {
      initializedRef.current = true;
      const map: Record<string, string> = {};
      const lateMap: Record<string, number | undefined> = {};
      for (const r of attendance.records) {
        map[r.admission?.id ?? r.id] = r.attendanceStatus;
        if (r.lateMinutes !== null && r.lateMinutes !== undefined) {
          lateMap[r.admission?.id ?? r.id] = r.lateMinutes;
        }
      }
      setAttendanceMap(map);
      setLateMinutesMap(lateMap);
    } else if (attendance.enrolledStudents && attendance.enrolledStudents.length > 0) {
      initializedRef.current = true;
      const map: Record<string, string> = {};
      for (const s of attendance.enrolledStudents) {
        map[s.admissionId] = '';
      }
      setAttendanceMap(map);
      setLateMinutesMap({});
    }
  }, [sessionDetails]);

  // Handle status change
  const handleStatusChange = useCallback((admissionId: string, status: string) => {
    setAttendanceMap((prev) => ({ ...prev, [admissionId]: status }));
    if (status !== 'LATE') {
      setLateMinutesMap((prev) => ({ ...prev, [admissionId]: undefined }));
    }
  }, []);

  const handleLateMinutesChange = useCallback(
    (admissionId: string, minutes: number | undefined) => {
      setLateMinutesMap((prev) => ({ ...prev, [admissionId]: minutes }));
    },
    [],
  );

  const handleMarkAllPresent = useCallback(() => {
    const allPresent: Record<string, string> = {};
    const att = sessionDetails?.attendance;
    if (att?.records && att.records.length > 0) {
      for (const r of att.records) {
        allPresent[r.admission?.id ?? r.id] = 'PRESENT';
      }
    } else if (att?.enrolledStudents && att.enrolledStudents.length > 0) {
      for (const s of att.enrolledStudents) {
        allPresent[s.admissionId] = 'PRESENT';
      }
    }
    setAttendanceMap(allPresent);
    setLateMinutesMap({});
  }, [sessionDetails]);

  // Submit attendance
  const handleSubmitAttendance = useCallback(async () => {
    const records: BulkAttendanceItem[] = Object.entries(attendanceMap)
      .filter(([, status]) => status !== '')
      .map(([admissionId, status]) => ({
        studentAdmissionId: admissionId,
        attendanceStatus: status as BulkAttendanceItem['attendanceStatus'],
        lateMinutes: status === 'LATE' ? lateMinutesMap[admissionId] : undefined,
      }));

    if (records.length === 0) {
      toast.error('No attendance records to save');
      return;
    }

    try {
      const result = await markAttendance({ records });
      if (result.errorCount > 0) {
        toast.error(`Saved ${result.successCount}/${result.totalProcessed}`, {
          description: `${result.errorCount} record(s) failed. ${(result.errors ?? []).join(', ')}`,
        });
      } else {
        toast.success(`Attendance saved`, {
          description: `${result.successCount} student(s) marked successfully.`,
        });
      }
      // Refetch session details to get updated attendance
      refetch();
    } catch (err) {
      toast.error('Failed to save attendance', {
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    }
  }, [attendanceMap, lateMinutesMap, markAttendance, refetch]);

  // ─── Loading ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse" />
          <div className="space-y-1">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-64 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <ErrorState
          title="Failed to load session"
          message={error.message || 'This session could not be found or you do not have access.'}
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  // ─── Not found ─────────────────────────────────────────────────────────

  if (!sessionDetails) {
    return (
      <div className="p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
        <EmptyState
          title="Session not found"
          description="This session does not exist or has been removed."
        />
      </div>
    );
  }

  const { session, attendance } = sessionDetails;
  const statusBadge = getStatusBadge(session.sessionStatus);
  const StatusIcon = statusBadge.icon;
  const overrideLabel = getOverrideLabel(session.overrideType);
  const isCancelled = session.sessionStatus === 'CANCELLED';

  // Build enrolled students list from attendance records for marking
  // When no records exist, we still show the card but can't mark (no data on who to mark)
  // The backend controls which students can be marked via batch enrollment validation
  const hasUnmarkedStudents =
    attendance.totalStudents > 0 && attendance.records.length < attendance.totalStudents;

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* ── Back + Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
        <div>
          <Link
            href="/dashboard/tutor/timetable"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-[#7C3AED] transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Back to Timetable
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {session.subject?.name || 'Session Details'}
            </h1>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
                statusBadge.className,
              )}
            >
              <StatusIcon className="h-3 w-3" aria-hidden="true" />
              {statusBadge.label}
            </span>
            {session.overrideType && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                {getOverrideLabel(session.overrideType)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(session.attendanceDate)} • {formatTime(session.startsAt, session.endsAt)}
          </p>
        </div>
      </div>

      {/* ── Session Info + Attendance Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Session Info */}
        <Card className="lg:col-span-2 rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 p-0 pb-4">
            <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Session Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={BookOpen} label="Subject" value={session.subject?.name} />
              <InfoRow icon={Layers} label="Batch" value={session.batch?.name} />
              <InfoRow icon={MapPin} label="Branch" value={session.branch?.name} />
              <InfoRow icon={MapPin} label="Room" value={session.room?.name} />
              <InfoRow icon={Calendar} label="Date" value={formatDate(session.attendanceDate)} />
              <InfoRow
                icon={Clock}
                label="Time"
                value={formatTime(session.startsAt, session.endsAt)}
              />
              {session.schedule && (
                <>
                  <InfoRow
                    icon={Calendar}
                    label="Recurring Day"
                    value={session.schedule.dayOfWeek}
                  />
                  <InfoRow
                    icon={Clock}
                    label="Scheduled Time"
                    value={
                      session.schedule.startTime && session.schedule.endTime
                        ? formatTime(session.schedule.startTime, session.schedule.endTime)
                        : null
                    }
                  />
                </>
              )}
              {session.room?.capacity && (
                <InfoRow
                  icon={Users}
                  label="Room Capacity"
                  value={`${session.room.capacity} seats`}
                />
              )}
            </div>
            {overrideLabel && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm">
                <div className="flex items-center gap-2 text-amber-700 font-semibold">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  <span>Override Information</span>
                </div>
                <p className="text-amber-600 mt-1 text-xs">
                  {overrideLabel}
                  {session.cancelledReason && (
                    <span className="block mt-0.5 italic">Reason: {session.cancelledReason}</span>
                  )}
                </p>
              </div>
            )}
            {session.remarks && (
              <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-[#E5E7EB] text-sm">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Remarks
                </p>
                <p className="text-[#111827]">{session.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Stats */}
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 p-0 pb-4">
            <UserCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            {isCancelled ? (
              <div className="text-center p-4 rounded-xl bg-red-50 border border-red-200">
                <XCircle className="h-8 w-8 text-red-400 mx-auto mb-1" aria-hidden="true" />
                <p className="text-sm font-bold text-red-700">Session Cancelled</p>
                <p className="text-xs text-red-500 mt-1">
                  No attendance was recorded for this session.
                </p>
              </div>
            ) : attendance.markedCount === 0 && attendance.totalStudents > 0 ? (
              <div className="text-center p-4 rounded-xl bg-amber-50 border border-amber-200">
                <Hourglass className="h-8 w-8 text-amber-400 mx-auto mb-1" aria-hidden="true" />
                <p className="text-sm font-bold text-amber-700">No attendance marked yet</p>
                <p className="text-xs text-amber-600 mt-1">
                  {attendance.totalStudents} enrolled student(s) — use the marking panel below.
                </p>
              </div>
            ) : attendance.markedCount === 0 ? (
              <EmptyState
                icon={<UserCheck className="h-8 w-8 text-gray-400" />}
                title="No attendance records"
                description="No students are enrolled in this batch."
              />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: 'Present',
                      count: attendance.presentCount,
                      icon: UserCheck,
                      color: 'text-green-500',
                    },
                    {
                      label: 'Absent',
                      count: attendance.absentCount,
                      icon: UserX,
                      color: 'text-red-500',
                    },
                    {
                      label: 'Late',
                      count: attendance.lateCount,
                      icon: Hourglass,
                      color: 'text-amber-500',
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="flex flex-col items-center p-3 rounded-xl border border-[#E5E7EB] bg-white"
                    >
                      <s.icon className={cn('h-5 w-5 mb-1', s.color)} aria-hidden="true" />
                      <p className="text-lg font-bold text-[#111827]">{s.count}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="text-center text-xs text-muted-foreground pt-2 border-t border-[#E5E7EB]">
                  <span className="font-semibold">{attendance.markedCount}</span> of{' '}
                  <span className="font-semibold">{attendance.totalStudents}</span> students marked
                  {attendance.unmarkedCount > 0 && (
                    <span className="text-amber-600 font-semibold">
                      {' '}
                      · {attendance.unmarkedCount} unmarked
                    </span>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Attendance Marking Panel ── */}
      {!isCancelled && (
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0 p-0 pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Mark Attendance
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                ({Object.values(attendanceMap).filter(Boolean).length} marked of{' '}
                {attendance.totalStudents} total enrolled)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleMarkAllPresent}
                size="sm"
                variant="outline"
                className="text-xs font-bold gap-1.5 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark All Present
              </Button>
              <Button
                onClick={handleSubmitAttendance}
                disabled={isMarking || Object.values(attendanceMap).filter(Boolean).length === 0}
                size="sm"
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold gap-1.5 rounded-lg"
              >
                {isMarking ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" aria-hidden="true" />
                    Save Attendance
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-1.5">
            {attendance.totalStudents === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8 text-gray-400" />}
                title="No students enrolled"
                description="This batch doesn't have any enrolled students to mark attendance for."
              />
            ) : attendance.records.length > 0 ? (
              attendance.records.map((record) => {
                const admissionId = record.admission?.id ?? record.id;
                const fullName = record.student
                  ? `${record.student.firstName} ${record.student.lastName}`
                  : 'Unknown Student';
                const initials = record.student
                  ? `${record.student.firstName.charAt(0)}${record.student.lastName.charAt(0)}`
                  : '??';

                return (
                  <AttendanceMarkRow
                    key={record.id}
                    studentName={fullName}
                    initials={initials}
                    admissionNumber={record.admission?.admissionNumber}
                    currentStatus={attendanceMap[admissionId] ?? record.attendanceStatus}
                    lateMinutes={lateMinutesMap[admissionId] ?? record.lateMinutes ?? undefined}
                    onStatusChange={(status) => handleStatusChange(admissionId, status)}
                    onLateMinutesChange={(minutes) => handleLateMinutesChange(admissionId, minutes)}
                  />
                );
              })
            ) : attendance.enrolledStudents?.length > 0 ? (
              attendance.enrolledStudents.map((enrolled) => {
                const fullName = `${enrolled.firstName} ${enrolled.lastName}`;
                const initials = `${enrolled.firstName.charAt(0)}${enrolled.lastName.charAt(0)}`;
                const currentStatus = attendanceMap[enrolled.admissionId] ?? '';

                return (
                  <AttendanceMarkRow
                    key={enrolled.admissionId}
                    studentName={fullName}
                    initials={initials}
                    admissionNumber={enrolled.admissionNumber}
                    currentStatus={currentStatus}
                    lateMinutes={lateMinutesMap[enrolled.admissionId] ?? undefined}
                    onStatusChange={(status) => handleStatusChange(enrolled.admissionId, status)}
                    onLateMinutesChange={(minutes) =>
                      handleLateMinutesChange(enrolled.admissionId, minutes)
                    }
                  />
                );
              })
            ) : null}

            {/* Success banner */}
            {markResult && markResult.successCount > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                <p className="text-xs font-semibold text-green-700">
                  {markResult.successCount} record(s) saved successfully.
                  {markResult.errorCount > 0 && (
                    <span className="text-red-600"> {markResult.errorCount} failed.</span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Existing Attendance Records ── */}
      {!isCancelled && attendance.records.length > 0 && (
        <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Saved Attendance Records
              </CardTitle>
              <span className="text-xs text-muted-foreground">({attendance.records.length})</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-1">
            {attendance.records.map((record) => {
              const fullName = record.student
                ? `${record.student.firstName} ${record.student.lastName}`
                : 'Unknown Student';
              const initials = record.student
                ? `${record.student.firstName.charAt(0)}${record.student.lastName.charAt(0)}`
                : '??';
              const StatusIcon =
                record.attendanceStatus === 'PRESENT'
                  ? CheckCircle2
                  : record.attendanceStatus === 'ABSENT'
                    ? XCircle
                    : Hourglass;
              const iconColor =
                record.attendanceStatus === 'PRESENT'
                  ? 'text-green-500'
                  : record.attendanceStatus === 'ABSENT'
                    ? 'text-red-500'
                    : 'text-amber-500';
              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB]"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-7 w-7 flex-shrink-0 border border-[#E5E7EB]">
                      <AvatarFallback className="bg-[#7C3AED]/10 text-[#7C3AED] text-[10px] font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#111827] truncate">{fullName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {record.admission && (
                          <span className="font-mono">{record.admission.admissionNumber}</span>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(record.markedAt).toLocaleString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <StatusIcon className={cn('h-3.5 w-3.5', iconColor)} aria-hidden="true" />
                    <span
                      className={cn(
                        'text-[10px] font-bold',
                        record.attendanceStatus === 'PRESENT' && 'text-green-600',
                        record.attendanceStatus === 'ABSENT' && 'text-red-600',
                        record.attendanceStatus === 'LATE' && 'text-amber-600',
                      )}
                    >
                      {record.attendanceStatus}
                    </span>
                    {record.lateMinutes && (
                      <span className="text-[9px] text-muted-foreground">
                        ({record.lateMinutes} min)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Page Export ────────────────────────────────────────────────────────────

export default function SessionDetailsPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <DashboardLayout>
        <SessionDetailContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
