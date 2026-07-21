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
  // 1. Filter branches based on selected academic year mapping config in db
  const filteredBranches = branches.filter((branch) => {
    if (!values.academicYearId) return true; // Show all if no year selected
    return branchCourses.some(
      (mapping) =>
        mapping.academicYearId === values.academicYearId && mapping.branchId === branch.id,
    );
  });

  // 2. Filter courses based on selected branch, academic year, and branchCourses mappings
  const filteredCourses = courses.filter((course) => {
    if (!values.branchId) return true; // Show all if no branch selected
    return branchCourses.some(
      (mapping) =>
        mapping.branchId === values.branchId &&
        mapping.courseId === course.id &&
        (!values.academicYearId || mapping.academicYearId === values.academicYearId),
    );
  });

  // 3. Filter batches based on selected branch, course and academic year
  const filteredBatches = batches.filter((batch) => {
    if (values.academicYearId && batch.academicYearId !== values.academicYearId) return false;
    if (values.branchId && batch.branchId !== values.branchId) return false;
    if (values.courseId && batch.courseId !== values.courseId) return false;
    return true;
  });

  const handleAcademicYearChange = (value: string) => {
    onFieldChange('academicYearId', value);
    // Reset subordinate selections
    onFieldChange('branchId', '');
    onFieldChange('courseId', '');
    onFieldChange('batchId', '');
  };

  const handleBranchChange = (value: string) => {
    onFieldChange('branchId', value);
    onFieldChange('courseId', '');
    onFieldChange('batchId', '');
  };

  const handleCourseChange = (value: string) => {
    onFieldChange('courseId', value);
    onFieldChange('batchId', '');
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
          <Select value={values.academicYearId} onValueChange={handleAcademicYearChange}>
            <SelectTrigger error={!!errors.academicYearId}>
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
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
          <Select
            value={values.branchId}
            onValueChange={handleBranchChange}
            disabled={!values.academicYearId}
          >
            <SelectTrigger error={!!errors.branchId}>
              <SelectValue
                placeholder={values.academicYearId ? 'Select branch' : 'Select academic year first'}
              />
            </SelectTrigger>
            <SelectContent>
              {filteredBranches.map((branch) => (
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
          <Select
            value={values.courseId}
            onValueChange={handleCourseChange}
            disabled={!values.branchId}
          >
            <SelectTrigger error={!!errors.courseId}>
              <SelectValue
                placeholder={values.branchId ? 'Select course' : 'Select branch first'}
              />
            </SelectTrigger>
            <SelectContent>
              {filteredCourses.map((course) => (
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
            value={values.batchId}
            onValueChange={(value) => onFieldChange('batchId', value)}
            disabled={!values.courseId}
          >
            <SelectTrigger error={!!errors.batchId}>
              <SelectValue placeholder={values.courseId ? 'Select batch' : 'Select course first'} />
            </SelectTrigger>
            <SelectContent>
              {filteredBatches.map((batch) => (
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
      </div>
    </StudentFormSection>
  );
}
