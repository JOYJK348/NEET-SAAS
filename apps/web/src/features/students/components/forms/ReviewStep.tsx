'use client';

import { StudentFormData } from '@/features/students/validation/student-schema';
import { StudentInfoCard } from '@/features/students/components/StudentInfoCard';
import { StudentSectionHeader } from '@/features/students/components/StudentSectionHeader';
import { STUDENT_GENDER_LABELS } from '@/features/students/types/student';
import {
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  User,
  BookOpen,
  Users,
  Heart,
  Fingerprint,
  ToggleRight,
  ToggleLeft,
} from 'lucide-react';

interface ReviewStepProps {
  values: StudentFormData;
  branches: { id: string; name: string }[];
  academicYears: { id: string; name: string }[];
  batches: { id: string; name: string }[];
  courses: { id: string; name: string }[];
  status?: 'ACTIVE' | 'SUSPENDED';
}

function findLabel(items: { id: string; name: string }[], id: string): string {
  return items.find((item) => item.id === id)?.name || id;
}

export function ReviewStep({
  values,
  branches,
  academicYears,
  batches,
  courses,
  status,
}: ReviewStepProps) {
  const personalItems = [
    { label: 'First Name', value: values.firstName, icon: <User className="h-3.5 w-3.5" /> },
    { label: 'Last Name', value: values.lastName, icon: <User className="h-3.5 w-3.5" /> },
    { label: 'Email', value: values.email, icon: <Mail className="h-3.5 w-3.5" /> },
    { label: 'Phone', value: values.phone, icon: <Phone className="h-3.5 w-3.5" /> },
    {
      label: 'Date of Birth',
      value: values.dateOfBirth,
      icon: <CalendarDays className="h-3.5 w-3.5" />,
    },
    {
      label: 'Gender',
      value:
        STUDENT_GENDER_LABELS[values.gender as keyof typeof STUDENT_GENDER_LABELS] || values.gender,
      icon: <User className="h-3.5 w-3.5" />,
    },
  ];

  const addressItems = [
    { label: 'Address', value: values.address, icon: <MapPin className="h-3.5 w-3.5" /> },
    { label: 'City', value: values.city },
    { label: 'State', value: values.state },
    { label: 'Pincode', value: values.pincode },
  ];

  const academicItems = [
    {
      label: 'Branch',
      value: findLabel(branches, values.branchId),
      icon: <MapPin className="h-3.5 w-3.5" />,
    },
    {
      label: 'Academic Year',
      value: findLabel(academicYears, values.academicYearId),
      icon: <CalendarDays className="h-3.5 w-3.5" />,
    },
    {
      label: 'Course',
      value: findLabel(courses, values.courseId),
      icon: <BookOpen className="h-3.5 w-3.5" />,
    },
    {
      label: 'Batch',
      value: findLabel(batches, values.batchId),
      icon: <Users className="h-3.5 w-3.5" />,
    },
    {
      label: 'Admission Date',
      value: values.admissionDate,
      icon: <CalendarDays className="h-3.5 w-3.5" />,
    },
  ];

  const parentItems = [
    { label: 'Parent Name', value: values.parentName, icon: <User className="h-3.5 w-3.5" /> },
    { label: 'Parent Phone', value: values.parentPhone, icon: <Phone className="h-3.5 w-3.5" /> },
    { label: 'Parent Email', value: values.parentEmail, icon: <Mail className="h-3.5 w-3.5" /> },
    {
      label: 'Emergency Contact',
      value: values.emergencyContact || 'Not provided',
      icon: <Phone className="h-3.5 w-3.5" />,
    },
  ];

  const medicalItems = [
    {
      label: 'Blood Group',
      value: values.bloodGroup || 'Not provided',
      icon: <Heart className="h-3.5 w-3.5" />,
    },
    {
      label: 'Aadhar Number',
      value: values.aadharNumber || 'Not provided',
      icon: <Fingerprint className="h-3.5 w-3.5" />,
    },
  ];

  const isActive = (status ?? 'ACTIVE') === 'ACTIVE';

  return (
    <div className="space-y-6">
      <div>
        <StudentSectionHeader
          title="Review Information"
          description="Please review all the information before submitting"
        />
      </div>
      <div className="flex items-center gap-3 p-4 rounded-xl border border-[#E5E7EB] bg-white">
        {isActive ? (
          <ToggleRight className="h-5 w-5 text-green-600" />
        ) : (
          <ToggleLeft className="h-5 w-5 text-gray-400" />
        )}
        <div>
          <p className="text-sm font-medium text-[#111827]">
            Status: {isActive ? 'Active' : 'Inactive'}
          </p>
          <p className="text-xs text-muted-foreground">
            {isActive
              ? 'Student has access to courses and batches'
              : 'Student is hidden from course/batch listings'}
          </p>
        </div>
      </div>
      <StudentInfoCard title="Personal Information" items={personalItems} columns={2} />
      <StudentInfoCard title="Address" items={addressItems} columns={2} />
      <StudentInfoCard title="Academic Information" items={academicItems} columns={2} />
      <StudentInfoCard title="Parent Information" items={parentItems} columns={2} />
      <StudentInfoCard title="Medical Information" items={medicalItems} columns={2} />
    </div>
  );
}
