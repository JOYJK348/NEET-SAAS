'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Student,
  STUDENT_STATUS_LABELS,
  STUDENT_STATUS_COLORS,
  StudentStatus,
} from '@/features/students/types/student';
import {
  Edit,
  ArrowLeft,
  GraduationCap,
  Users,
  Sparkles,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StudentProfileHeaderProps {
  student: Student;
  onEdit?: () => void;
  onArchive?: () => void;
  className?: string;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
}

export function StudentProfileHeader({
  student,
  onEdit,
  onArchive,
  className,
}: StudentProfileHeaderProps) {
  const router = useRouter();
  const fullName = `${student.firstName} ${student.lastName}`;
  const isActive = student.status === 'ACTIVE';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Top Back Action Bar */}
      <div className="flex flex-row items-center justify-between gap-2 w-full">
        <button
          onClick={() => router.push('/dashboard/students')}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-violet-600 shrink-0" />
          <span className="hidden sm:inline">Back to Student Directory</span>
          <span className="sm:hidden">Back</span>
        </button>

        {onEdit && (
          <Button
            onClick={onEdit}
            className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs shadow-xs shrink-0 px-3 sm:px-4 py-2"
          >
            <Edit className="w-4 h-4 text-white shrink-0" />
            <span className="hidden sm:inline">Edit Student Details</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        )}
      </div>

      {/* Signature Violet Gradient Header Banner */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-violet-200 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Avatar */}
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-white/30 shadow-md shrink-0">
              <AvatarImage src={student.profileImage} alt={fullName} />
              <AvatarFallback className="text-xl sm:text-2xl font-black bg-white/20 text-white rounded-2xl backdrop-blur-md">
                {getInitials(student.firstName, student.lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] sm:text-xs font-mono font-bold text-white border border-white/20">
                  {student.studentId || 'STD-REG'}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border',
                    isActive
                      ? 'bg-emerald-400/20 text-emerald-100 border-emerald-300/30'
                      : 'bg-rose-400/20 text-rose-100 border-rose-300/30',
                  )}
                >
                  {isActive ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active Student
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-rose-200" />
                      Inactive
                    </>
                  )}
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl font-black text-white leading-tight truncate">
                {fullName}
              </h1>

              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-violet-100">
                {student.courseName && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[11px] font-semibold">
                    <GraduationCap className="w-3 h-3 text-violet-200 shrink-0" />
                    {student.courseName}
                  </span>
                )}
                {student.batchName && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[11px] font-semibold">
                    <Users className="w-3 h-3 text-violet-200 shrink-0" />
                    {student.batchName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
