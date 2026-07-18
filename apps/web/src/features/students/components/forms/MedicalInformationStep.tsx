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

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

interface MedicalInformationStepProps {
  register: UseFormRegister<StudentFormData>;
  errors: FieldErrors<StudentFormData>;
  values: StudentFormData;
  onFieldChange: (field: keyof StudentFormData, value: string) => void;
}

export function MedicalInformationStep({
  register,
  errors,
  values,
  onFieldChange,
}: MedicalInformationStepProps) {
  return (
    <StudentFormSection
      title="Medical Information"
      description="Optional medical details for the student"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bloodGroup">Blood Group (optional)</Label>
          <Select
            value={values.bloodGroup || ''}
            onValueChange={(value) => onFieldChange('bloodGroup', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map((bg) => (
                <SelectItem key={bg} value={bg}>
                  {bg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="aadharNumber">Aadhar Number (optional)</Label>
          <Input id="aadharNumber" {...register('aadharNumber')} placeholder="XXXX-XXXX-XXXX" />
          {errors.aadharNumber && (
            <p className="text-xs text-destructive">{errors.aadharNumber.message}</p>
          )}
        </div>
      </div>
    </StudentFormSection>
  );
}
