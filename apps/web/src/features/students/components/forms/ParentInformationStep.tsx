import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { StudentFormData } from '@/features/students/validation/student-schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { StudentFormSection } from '@/features/students/components/StudentFormSection';
import { ShieldCheck, UserCheck } from 'lucide-react';

interface ParentInformationStepProps {
  register: UseFormRegister<StudentFormData>;
  errors: FieldErrors<StudentFormData>;
  values: StudentFormData;
  onFieldChange: (field: keyof StudentFormData, value: any) => void;
}

export function ParentInformationStep({
  register,
  errors,
  values,
  onFieldChange,
}: ParentInformationStepProps) {
  const isEnabled = values.isParentPortalEnabled ?? false;
  const relationship = values.parentRelationshipType || 'FATHER';

  return (
    <StudentFormSection
      title="Parent / Guardian Information"
      description="Enter contact details and manage Parent Portal account creation"
    >
      <div className="space-y-6">
        {/* Relationship type selection */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Primary Relationship</Label>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'FATHER', label: 'Father' },
              { id: 'MOTHER', label: 'Mother' },
              { id: 'GUARDIAN', label: 'Guardian' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onFieldChange('parentRelationshipType', item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  relationship === item.id
                    ? 'border-violet-600 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:text-slate-300'
                }`}
              >
                <UserCheck className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="parentName">
              Parent / Guardian Name {isEnabled && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="parentName"
              {...register('parentName')}
              placeholder="Enter parent full name"
            />
            {errors.parentName && (
              <p className="text-xs text-destructive">{errors.parentName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentPhone">
              Parent Phone {isEnabled && <span className="text-destructive">*</span>}
            </Label>
            <Input id="parentPhone" {...register('parentPhone')} placeholder="+91-XXXXXXXXXX" />
            {errors.parentPhone && (
              <p className="text-xs text-destructive">{errors.parentPhone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentEmail">
              Parent Email {isEnabled && <span className="text-destructive">*</span>}
            </Label>
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

        {/* Parent Portal Toggle Card */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Create Parent Portal Account
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Allows parent to log in and monitor academic progress, attendance, and fees
                </p>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => onFieldChange('isParentPortalEnabled', checked)}
              aria-label="Toggle Parent Portal Account Creation"
            />
          </div>

          {isEnabled && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-medium text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                <span>🔐</span> Secure Password will be auto-generated by backend and shown once
                after creation.
              </p>
              <p>
                If an account with this email already exists in this tenant, the student will be
                linked to the existing parent profile automatically without resetting their
                password.
              </p>
            </div>
          )}
        </div>
      </div>
    </StudentFormSection>
  );
}
