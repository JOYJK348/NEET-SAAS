'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AdmissionSectionHeader } from '../AdmissionSectionHeader';
import { AdmissionInfoCard } from '../AdmissionInfoCard';
import { CalendarDays, BookOpen, MapPin, User } from 'lucide-react';
import { formatDate } from '@/features/admissions/utils/admission-utils';
import type {
  AdmissionStudent,
  AdmissionCourse,
  AdmissionBranch,
} from '@/features/admissions/types/admission';

interface ReviewConfirmStepProps {
  student?: AdmissionStudent;
  course?: AdmissionCourse;
  branch?: AdmissionBranch;
  academicYearName?: string;
  admissionDate: string;
  notes?: string;
}

export function ReviewConfirmStep({
  student,
  course,
  branch,
  academicYearName,
  admissionDate,
  notes,
}: ReviewConfirmStepProps) {
  const personalItems = student
    ? [
        { label: 'Name', value: `${student.firstName} ${student.lastName}`, icon: User },
        { label: 'Email', value: student.email },
        { label: 'Phone', value: student.phone },
        { label: 'Gender', value: student.gender || '—' },
      ]
    : [];

  const academicItems = [
    ...(course ? [{ label: 'Course', value: course.name, icon: BookOpen }] : []),
    ...(branch ? [{ label: 'Branch', value: branch.name, icon: MapPin }] : []),
    ...(academicYearName
      ? [{ label: 'Academic Year', value: academicYearName, icon: CalendarDays }]
      : []),
    { label: 'Admission Date', value: formatDate(admissionDate), icon: CalendarDays },
  ];

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200">
        <CardContent className="p-4 lg:p-5">
          <AdmissionSectionHeader
            title="Review & Confirm"
            description="Please verify all information before creating the admission."
          />
        </CardContent>
      </Card>

      {student && personalItems.length > 0 && (
        <AdmissionInfoCard title="Student Information" items={personalItems} columns={2} />
      )}

      <AdmissionInfoCard title="Admission Information" items={academicItems} columns={2} />

      {notes && (
        <Card className="border border-gray-200">
          <CardContent className="p-4 lg:p-5">
            <AdmissionSectionHeader title="Additional Notes" />
            <p className="text-sm text-gray-700">{notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
