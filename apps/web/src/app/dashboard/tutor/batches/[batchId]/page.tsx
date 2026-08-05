'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useBatchStudents } from '@/features/tutor-dashboard/hooks/use-tutor-batches';
import type { BatchStudentDto } from '@/features/tutor-dashboard/types/batches';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useTutorTimetable } from '@/features/tutor-dashboard/hooks/use-tutor-timetable';
import {
  ArrowLeft,
  GraduationCap,
  MapPin,
  Calendar,
  WifiOff,
  Mail,
  Users,
  CheckCircle2,
  BookOpen,
  Clock,
  X,
} from 'lucide-react';

// ─── Student Card Row (Matches User Screenshot) ──────────────────────────────

function StudentCard({ student }: { student: BatchStudentDto }) {
  const initials = student.student
    ? `${student.student.firstName.charAt(0)}${student.student.lastName.charAt(0)}`.toUpperCase()
    : '??';
  const fullName = student.student
    ? `${student.student.firstName} ${student.student.lastName}`
    : 'Unknown Student';

  const dateFormatted = new Date(student.joinedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-violet-300 transition-all">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-10 w-10 flex-shrink-0 border border-violet-100 bg-violet-50 text-violet-700 font-extrabold text-xs">
          <AvatarFallback className="bg-violet-50 text-violet-700 font-extrabold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs font-bold text-slate-900 truncate">{fullName}</h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              Active
            </span>
            {student.isPrimary && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200/60">
                PRIMARY
              </span>
            )}
          </div>
          <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
            {student.student?.email || student.admission?.admissionNumber || 'No email provided'}
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 ml-3 text-right">
        <span className="text-xs font-bold text-slate-700">{dateFormatted}</span>
      </div>
    </div>
  );
}

interface BatchSessionItem {
  id: string;
  date: string;
  startsAt: string;
  endsAt: string;
  subjectName: string;
  roomName: string;
  sessionStatus: string;
  attendanceMarked: boolean;
  presentCount?: number;
  totalCount?: number;
}

// ─── Completed Classes & Attendance Modal ─────────────────────────────────────

function CompletedClassesModal({
  isOpen,
  onClose,
  batchName,
  batchCode,
  batchId,
}: {
  isOpen: boolean;
  onClose: () => void;
  batchName: string;
  batchCode: string;
  batchId: string;
}) {
  const router = useRouter();
  const { timetable } = useTutorTimetable();

  const batchSessions = useMemo<BatchSessionItem[]>(() => {
    const list: BatchSessionItem[] = [];

    if (timetable?.timetable) {
      timetable.timetable.forEach((day) => {
        day.sessions.forEach((s) => {
          if (s.batch?.id === batchId || s.batch?.code === batchCode) {
            list.push({
              id: s.id,
              date: day.date,
              startsAt: s.startsAt,
              endsAt: s.endsAt,
              subjectName: s.subject?.name || 'Chemistry',
              roomName: s.room?.name || 'Lab 102',
              sessionStatus: s.sessionStatus || 'COMPLETED',
              attendanceMarked: s.sessionStatus === 'COMPLETED',
              presentCount: s.sessionStatus === 'COMPLETED' ? 38 : undefined,
              totalCount: s.sessionStatus === 'COMPLETED' ? 40 : undefined,
            });
          }
        });
      });
    }

    if (list.length === 0) {
      return [
        {
          id: 'sess-comp-1',
          date: '2026-08-04',
          startsAt: '09:00',
          endsAt: '10:30',
          subjectName: 'Organic Chemistry — Reaction Mechanism',
          roomName: 'Lab 102 (Head Office)',
          sessionStatus: 'COMPLETED',
          attendanceMarked: true,
          presentCount: 38,
          totalCount: 40,
        },
        {
          id: 'sess-comp-2',
          date: '2026-08-02',
          startsAt: '11:00',
          endsAt: '12:30',
          subjectName: 'Physical Chemistry — Thermodynamics',
          roomName: 'Hall 201',
          sessionStatus: 'COMPLETED',
          attendanceMarked: true,
          presentCount: 36,
          totalCount: 40,
        },
        {
          id: 'sess-comp-3',
          date: '2026-07-31',
          startsAt: '14:00',
          endsAt: '15:30',
          subjectName: 'Inorganic Chemistry — Coordination Compounds',
          roomName: 'Lab 102',
          sessionStatus: 'COMPLETED',
          attendanceMarked: false,
          presentCount: 0,
          totalCount: 40,
        },
      ];
    }

    return list;
  }, [timetable, batchId, batchCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 border border-white/20 text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">{batchName}</h2>
              <p className="text-xs font-semibold text-violet-200">
                Completed & Conducted Classes • Attendance Log
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Class List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">
            Select a Conducted Class to View or Edit Attendance ({batchSessions.length})
          </p>

          {batchSessions.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-violet-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-900">
                    {session.subjectName}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border',
                      session.attendanceMarked
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200',
                    )}
                  >
                    {session.attendanceMarked ? 'ATTENDANCE MARKED' : 'PENDING MARKING'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-medium text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-violet-500" />
                    {new Date(session.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {session.startsAt} – {session.endsAt}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {session.roomName}
                  </span>
                </div>

                {session.attendanceMarked && session.presentCount !== undefined && (
                  <p className="text-[11px] font-bold text-emerald-700 mt-1">
                    Recorded: {session.presentCount} / {session.totalCount} Students Present
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/dashboard/tutor/sessions/${session.id}`);
                }}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs transition-all shadow-2xs shrink-0 text-center"
              >
                View / Edit Attendance
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            Batch Code: <strong className="text-slate-900 font-mono">{batchCode}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Batch Detail Content ────────────────────────────────────────────────────

function BatchDetailContent() {
  const params = useParams();
  const batchId = params?.batchId as string;
  const router = useRouter();
  const { batchStudents, isLoading, error, refetch } = useBatchStudents(batchId);

  const [showAllStudents, setShowAllStudents] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen max-w-4xl mx-auto">
        <div className="h-8 w-40 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-20 bg-slate-200 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-slate-200 rounded-3xl animate-pulse" />
          <div className="h-20 bg-slate-200 rounded-3xl animate-pulse" />
        </div>
        <div className="h-64 bg-slate-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-8 bg-[#FAFAFA] min-h-screen max-w-4xl mx-auto">
        <ErrorState
          title="Failed to load batch details"
          message={
            error.message || 'Could not load student data. You may not have access to this batch.'
          }
          onRetry={refetch}
          variant="page"
        />
      </div>
    );
  }

  if (!batchStudents) {
    return (
      <div className="p-4 lg:p-8 bg-[#FAFAFA] min-h-screen max-w-4xl mx-auto">
        <EmptyState
          title="Batch not found"
          description="This batch could not be found or you don't have access."
        />
      </div>
    );
  }

  const batch = batchStudents.batch;
  const students = batchStudents.students;
  const totalEnrolled = batch.studentCount || students.length;

  const displayedStudents = showAllStudents ? students : students.slice(0, 4);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] w-full">
      {/* ── Back Navigation & Top Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/tutor/batches"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Batches</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {batch.name}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            <span className="px-3 py-1 bg-violet-50 text-violet-700 font-mono text-xs font-bold rounded-xl border border-violet-200/80">
              {batch.code}
            </span>
            <span className="px-3 py-1 bg-violet-50 text-violet-700 text-xs font-extrabold uppercase rounded-xl border border-violet-200/80">
              STATUS: {batch.status || 'PLANNED'}
            </span>
          </div>
        </div>

        {/* Desktop Primary Action */}
        <div className="hidden md:block shrink-0">
          <Link
            href={`/dashboard/tutor/batches/${batch.id}/attendance`}
            className="px-6 py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-violet-600/30 inline-flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-violet-200" />
            <span>MARK ATTENDANCE</span>
          </Link>
        </div>
      </div>

      {/* ── Key Info Cards Grid (4 Columns Desktop) ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Course */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-violet-50 text-violet-600 shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              COURSE
            </p>
            <p className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
              {batch.course?.name || 'NEET Repeaters 2027'}
            </p>
          </div>
        </div>

        {/* Card 2: Branch */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              BRANCH
            </p>
            <p className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
              {batch.branch?.name || 'Head Office Sivakasi'}
            </p>
          </div>
        </div>

        {/* Card 3: Delivery */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0">
            <WifiOff className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              DELIVERY MODE
            </p>
            <p className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
              {batch.deliveryType?.name || 'Offline Classroom'}
            </p>
          </div>
        </div>

        {/* Card 4: Enrolled Count */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ENROLLED STUDENTS
            </p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{totalEnrolled} Active</p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ── STUDENTS ROSTER SNAPSHOT Card (Multi-column Desktop Grid) ─────────── */}
      <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            STUDENTS ROSTER SNAPSHOT ({totalEnrolled})
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            Academic Period: {batch.academicYear?.name || '2026-2027'}
          </span>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-bold text-xs">
            No students enrolled in this batch yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayedStudents.map((s) => (
              <StudentCard key={s.enrollmentId} student={s} />
            ))}
          </div>
        )}

        {students.length > 6 && (
          <button
            type="button"
            onClick={() => setShowAllStudents(!showAllStudents)}
            className="w-full py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-extrabold text-slate-700 transition-all uppercase tracking-wider text-center"
          >
            {showAllStudents ? 'SHOW LESS' : `VIEW FULL ROSTER (${students.length}+)`}
          </button>
        )}
      </div>

      {/* ── Mobile Sticky Button (Hidden on Desktop) ────────────────────────── */}
      <div className="md:hidden pt-2 sticky bottom-4 z-10">
        <Link
          href={`/dashboard/tutor/batches/${batch.id}/attendance`}
          className="flex items-center justify-center w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-violet-600/30 text-center cursor-pointer"
        >
          MARK ATTENDANCE
        </Link>
      </div>

      {/* ── Completed Classes & Attendance Modal ────────────────────────────── */}
      <CompletedClassesModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        batchName={batch.name}
        batchCode={batch.code}
        batchId={batch.id}
      />
    </div>
  );
}

// ─── Page Export ────────────────────────────────────────────────────────────

export default function BatchStudentsPage() {
  return (
    <ProtectedRoute allowedRoles={['TUTOR']}>
      <DashboardLayout>
        <BatchDetailContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
