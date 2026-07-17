'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Student,
  STUDENT_STATUS_LABELS,
  STUDENT_STATUS_COLORS,
  StudentStatus,
} from '@/features/students/types/student';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CalendarDays, BookOpen, Users, Hash, GraduationCap } from 'lucide-react';

interface StudentSummaryCardProps {
  student: Student;
  className?: string;
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function StudentSummaryCard({ student, className }: StudentSummaryCardProps) {
  const summaryItems = [
    { icon: Hash, label: 'Student ID', value: student.studentId },
    { icon: GraduationCap, label: 'Age', value: `${calculateAge(student.dateOfBirth)} years` },
    { icon: BookOpen, label: 'Course', value: student.courseName },
    { icon: Users, label: 'Batch', value: student.batchName },
    { icon: CalendarDays, label: 'Admitted', value: formatDate(student.admissionDate) },
  ];

  return (
    <Card className={cn('rounded-2xl border-[#E5E7EB] bg-white shadow-sm', className)}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Summary
          </h3>
          <Badge
            variant="outline"
            className={cn(
              STUDENT_STATUS_COLORS[student.status as StudentStatus],
              'whitespace-nowrap',
            )}
          >
            {STUDENT_STATUS_LABELS[student.status as StudentStatus]}
          </Badge>
        </div>
        <div className="space-y-3">
          {summaryItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium text-[#111827] truncate">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
