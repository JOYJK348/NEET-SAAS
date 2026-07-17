'use client';

import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { StudentFormData } from '@/features/students/validation/student-schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StudentFormSection } from '@/features/students/components/StudentFormSection';

interface ParentInformationStepProps {
  register: UseFormRegister<StudentFormData>;
  errors: FieldErrors<StudentFormData>;
  values: StudentFormData;
  onFieldChange: (field: keyof StudentFormData, value: string) => void;
}

export function ParentInformationStep({ register, errors }: ParentInformationStepProps) {
  return (
    <StudentFormSection
      title="Parent / Guardian Information"
      description="Enter the parent or guardian's contact details"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parentName">Parent Name</Label>
          <Input id="parentName" {...register('parentName')} placeholder="Enter parent name" />
          {errors.parentName && (
            <p className="text-xs text-destructive">{errors.parentName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentPhone">Parent Phone</Label>
          <Input id="parentPhone" {...register('parentPhone')} placeholder="+91-XXXXXXXXXX" />
          {errors.parentPhone && (
            <p className="text-xs text-destructive">{errors.parentPhone.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="parentEmail">Parent Email</Label>
          <Input
            id="parentEmail"
            type="email"
            {...register('parentEmail')}
            placeholder="parent@email.com"
          />
          {errors.parentEmail && (
            <p className="text-xs text-destructive">{errors.parentEmail.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContact">Emergency Contact (optional)</Label>
          <Input
            id="emergencyContact"
            {...register('emergencyContact')}
            placeholder="+91-XXXXXXXXXX"
          />
          {errors.emergencyContact && (
            <p className="text-xs text-destructive">{errors.emergencyContact.message}</p>
          )}
        </div>
      </div>
    </StudentFormSection>
  );
}
