'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Student,
  STUDENT_STATUS_LABELS,
  STUDENT_STATUS_COLORS,
  StudentStatus,
} from '@/features/students/types/student';
import { Edit, Archive, ArrowLeft } from 'lucide-react';
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
  const statusColor = STUDENT_STATUS_COLORS[student.status as StudentStatus];

  return (
    <div className={cn('bg-white rounded-2xl border border-[#E5E7EB] shadow-sm', className)}>
      <div className="p-5 sm:p-6">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#111827] transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Avatar */}
          <Avatar className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-[#E5E7EB]">
            <AvatarImage src={student.profileImage} alt={fullName} />
            <AvatarFallback className="text-2xl font-bold bg-primary-light text-primary rounded-2xl">
              {getInitials(student.firstName, student.lastName)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight truncate">
                {fullName}
              </h1>
              <Badge variant="outline" className={cn(statusColor, 'whitespace-nowrap')}>
                {STUDENT_STATUS_LABELS[student.status as StudentStatus]}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="font-medium text-[#111827]">{student.studentId}</span>
              <span className="hidden sm:inline text-[#E5E7EB]">|</span>
              <span>{student.courseName}</span>
              <span className="hidden sm:inline text-[#E5E7EB]">|</span>
              <span>{student.batchName}</span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
