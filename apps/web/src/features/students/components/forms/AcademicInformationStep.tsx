'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { StudentFormData } from '@/features/students/validation/student-schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StudentFormSection } from '@/features/students/components/StudentFormSection';

interface AcademicInformationStepProps {
  register: UseFormRegister<StudentFormData>;
  errors: FieldErrors<StudentFormData>;
  values: StudentFormData;
  onFieldChange: (field: keyof StudentFormData, value: string) => void;
  branches: { id: string; name: string }[];
  academicYears: { id: string; name: string }[];
  batches: {
    id: string;
    name: string;
    courseId?: string;
    branchId?: string;
    academicYearId?: string;
  }[];
  courses: { id: string; name: string }[];
  branchCourses?: { id: string; branchId: string; courseId: string; academicYearId: string }[];
}

export function AcademicInformationStep({
  register,
  errors,
  values,
  onFieldChange,
  branches,
  academicYears,
  batches,
  courses,
  branchCourses = [],
}: AcademicInformationStepProps) {
  // 1. Filter branches based on selected academic year mapping config in db (fallback to all branches)
  const filteredBranches = branches.filter((branch) => {
    if (!values.academicYearId) return true;
    return branchCourses.some(
      (mapping) =>
        mapping.academicYearId === values.academicYearId && mapping.branchId === branch.id,
    );
  });
  const availableBranches = filteredBranches.length > 0 ? filteredBranches : branches;

  // 2. Filter courses based on selected branch, academic year (fallback to all courses)
  const filteredCourses = courses.filter((course) => {
    if (!values.branchId) return true;
    return branchCourses.some(
      (mapping) =>
        mapping.branchId === values.branchId &&
        mapping.courseId === course.id &&
        (!values.academicYearId || mapping.academicYearId === values.academicYearId),
    );
  });
  const availableCourses = filteredCourses.length > 0 ? filteredCourses : courses;

  // 3. Filter batches based on selected branch, course and academic year (fallback to all batches)
  const filteredBatches = batches.filter((batch) => {
    if (
      values.academicYearId &&
      batch.academicYearId &&
      batch.academicYearId !== values.academicYearId
    )
      return false;
    if (values.branchId && batch.branchId && batch.branchId !== values.branchId) return false;
    if (values.courseId && batch.courseId && batch.courseId !== values.courseId) return false;
    return true;
  });
  const availableBatches = filteredBatches.length > 0 ? filteredBatches : batches;

  const handleAcademicYearChange = (value: string) => {
    onFieldChange('academicYearId', value);
  };

  const handleBranchChange = (value: string) => {
    onFieldChange('branchId', value);
  };

  const handleCourseChange = (value: string) => {
    onFieldChange('courseId', value);
  };

  return (
    <StudentFormSection
      title="Academic Information"
      description="Select the branch, academic year, course and batch for the student"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Academic Year */}
        <div className="space-y-2">
          <Label htmlFor="academicYearId">Academic Year</Label>
          <Select value={values.academicYearId || ''} onValueChange={handleAcademicYearChange}>
            <SelectTrigger error={!!errors.academicYearId}>
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.academicYearId && (
            <p className="text-xs text-destructive">{errors.academicYearId.message}</p>
          )}
        </div>

        {/* Branch */}
        <div className="space-y-2">
          <Label htmlFor="branchId">Branch</Label>
          <Select value={values.branchId || ''} onValueChange={handleBranchChange}>
            <SelectTrigger error={!!errors.branchId}>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {availableBranches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.branchId && <p className="text-xs text-destructive">{errors.branchId.message}</p>}
        </div>

        {/* Course */}
        <div className="space-y-2">
          <Label htmlFor="courseId">Course</Label>
          <Select value={values.courseId || ''} onValueChange={handleCourseChange}>
            <SelectTrigger error={!!errors.courseId}>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {availableCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.courseId && <p className="text-xs text-destructive">{errors.courseId.message}</p>}
        </div>

        {/* Batch */}
        <div className="space-y-2">
          <Label htmlFor="batchId">Batch</Label>
          <Select
            value={values.batchId || ''}
            onValueChange={(value) => onFieldChange('batchId', value)}
          >
            <SelectTrigger error={!!errors.batchId}>
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {availableBatches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.batchId && <p className="text-xs text-destructive">{errors.batchId.message}</p>}
        </div>

        {/* Admission Date */}
        <div className="space-y-2">
          <Label htmlFor="admissionDate">Admission Date</Label>
          <Input id="admissionDate" type="date" {...register('admissionDate')} />
          {errors.admissionDate && (
            <p className="text-xs text-destructive">{errors.admissionDate.message}</p>
          )}
        </div>

        {/* Class Type */}
        <div className="space-y-2">
          <Label htmlFor="classType">Class Type</Label>
          <Select
            value={values.classType || 'CLASSROOM'}
            onValueChange={(value) => onFieldChange('classType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLASSROOM">Offline / Classroom</SelectItem>
              <SelectItem value="ONLINE">Online</SelectItem>
              <SelectItem value="HYBRID">Hybrid</SelectItem>
            </SelectContent>
          </Select>
          {errors.classType && (
            <p className="text-xs text-destructive">{errors.classType.message}</p>
          )}
        </div>
      </div>
    </StudentFormSection>
  );
}
