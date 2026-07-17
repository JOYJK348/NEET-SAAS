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
  batches: { id: string; name: string }[];
  courses: { id: string; name: string }[];
}

export function AcademicInformationStep({
  register,
  errors,
  values,
  onFieldChange,
  batches,
  courses,
}: AcademicInformationStepProps) {
  return (
    <StudentFormSection
      title="Academic Information"
      description="Select the course and batch for the student"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="courseId">Course</Label>
          <Select
            value={values.courseId}
            onValueChange={(value) => onFieldChange('courseId', value)}
          >
            <SelectTrigger error={!!errors.courseId}>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.courseId && <p className="text-xs text-destructive">{errors.courseId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="batchId">Batch</Label>
          <Select value={values.batchId} onValueChange={(value) => onFieldChange('batchId', value)}>
            <SelectTrigger error={!!errors.batchId}>
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.batchId && <p className="text-xs text-destructive">{errors.batchId.message}</p>}
        </div>
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
