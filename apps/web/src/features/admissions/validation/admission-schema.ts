import { z } from 'zod';

export const admissionWizardSchema = z.object({
  studentProfileId: z.string().min(1, 'Please select a student'),
  academicYearId: z.string().min(1, 'Please select an academic year'),
  courseId: z.string().min(1, 'Please select a course'),
  branchId: z.string().min(1, 'Please select a branch'),
  admissionDate: z.string().min(1, 'Please select an admission date'),
  notes: z.string().optional(),
});

export type AdmissionFormData = z.infer<typeof admissionWizardSchema>;

export const defaultFormValues: AdmissionFormData = {
  studentProfileId: '',
  academicYearId: '',
  courseId: '',
  branchId: '',
  admissionDate: new Date().toISOString().split('T')[0],
  notes: '',
};
