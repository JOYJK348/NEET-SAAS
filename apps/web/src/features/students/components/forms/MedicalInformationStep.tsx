'use client';

import { useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
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

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Other'] as const;

interface MedicalInformationStepProps {
  register: UseFormRegister<StudentFormData>;
  errors: FieldErrors<StudentFormData>;
  values: StudentFormData;
  onFieldChange: (field: keyof StudentFormData, value: string) => void;
  setValue: UseFormSetValue<StudentFormData>;
}

export function MedicalInformationStep({
  register,
  errors,
  values,
  onFieldChange,
  setValue,
}: MedicalInformationStepProps) {
  const [customBloodGroup, setCustomBloodGroup] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(
    values.bloodGroup
      ? !BLOOD_GROUPS.filter((b) => b !== 'Other').includes(values.bloodGroup as any)
      : false,
  );

  const handleBloodGroupSelectChange = (val: string) => {
    if (val === 'Other') {
      setIsOtherSelected(true);
      onFieldChange('bloodGroup', customBloodGroup);
    } else {
      setIsOtherSelected(false);
      onFieldChange('bloodGroup', val);
    }
  };

  const handleCustomBloodGroupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomBloodGroup(val);
    onFieldChange('bloodGroup', val);
  };

  const handleAadharInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    // Strip everything except digits
    let digits = target.value.replace(/\D/g, '');
    if (digits.length > 12) {
      digits = digits.slice(0, 12);
    }
    // Chunk into XXXX-XXXX-XXXX
    const chunks = [];
    for (let i = 0; i < digits.length; i += 4) {
      chunks.push(digits.slice(i, i + 4));
    }
    const maskedValue = chunks.join('-');

    // Programmatically set form state values to sync with schema validation
    setValue('aadharNumber', maskedValue, { shouldValidate: true });
  };

  return (
    <StudentFormSection
      title="Medical Information"
      description="Optional medical details for the student"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bloodGroup">Blood Group (optional)</Label>
          <Select
            value={isOtherSelected ? 'Other' : values.bloodGroup || ''}
            onValueChange={handleBloodGroupSelectChange}
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

          {isOtherSelected && (
            <div className="pt-2">
              <Label htmlFor="customBloodGroup" className="text-xs">
                Specify Blood Group
              </Label>
              <Input
                id="customBloodGroup"
                value={customBloodGroup}
                onChange={handleCustomBloodGroupChange}
                placeholder="Enter blood group details"
                className="mt-1"
              />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="aadharNumber">Aadhar Number (optional)</Label>
          <Input
            id="aadharNumber"
            {...register('aadharNumber')}
            onInput={handleAadharInput}
            maxLength={14}
            placeholder="XXXX-XXXX-XXXX"
          />
          {errors.aadharNumber && (
            <p className="text-xs text-destructive">{errors.aadharNumber.message}</p>
          )}
        </div>
      </div>
    </StudentFormSection>
  );
}
