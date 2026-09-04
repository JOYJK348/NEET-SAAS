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
  ChevronRight,
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
    <div className={cn('space-y-4 w-full', className)}>
      {/* Top Back & Edit Toolbar */}
      <div className="flex flex-row items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
          <button
            onClick={() => router.push('/dashboard/students')}
            className="hover:underline flex items-center gap-1 font-bold text-slate-600"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#0052CC]" /> Students
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-extrabold text-[#0B2447] truncate max-w-[140px] sm:max-w-none">
            {fullName}
          </span>
        </div>

        {onEdit && (
          <Button
            onClick={onEdit}
            className="gap-1.5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-2xs shrink-0 px-3.5 py-1.5 self-end sm:self-auto"
          >
            <Edit className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="hidden sm:inline">Edit Details</span>
            <span className="sm:hidden">Edit</span>
          </Button>
        )}
      </div>

      {/* Dedicated ISML LMS Style Light Blue Hero Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-xs border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-blue-200 shadow-2xs shrink-0">
            <AvatarImage src={student.profileImage} alt={fullName} />
            <AvatarFallback className="text-xl sm:text-2xl font-black bg-blue-50 text-[#0052CC] rounded-2xl">
              {getInitials(student.firstName, student.lastName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200">
                {student.studentId || 'STD-REG'}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200',
                )}
              >
                {isActive ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Student
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3 text-rose-500" />
                    Inactive
                  </>
                )}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B2447] leading-snug truncate">
              {fullName}
            </h1>

            <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
              {student.courseName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
                  <GraduationCap className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                  {student.courseName}
                </span>
              )}
              {student.batchName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
                  <Users className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                  {student.batchName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
