import { z } from 'zod';

const baseBatchFormSchema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(30, 'Code must be at most 30 characters')
    .regex(
      /^[A-Z][A-Z0-9_]{1,29}$/,
      'Code must start with uppercase letter and contain only uppercase letters, numbers, and underscores',
    ),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .or(z.literal('')),
  branchId: z.string().min(1, 'Please select a branch'),
  courseId: z.string().min(1, 'Please select a course'),
  academicYearId: z.string().min(1, 'Please select an academic year'),
  deliveryTypeId: z.string().min(1, 'Please select a delivery type'),
  maxStudents: z
    .number()
    .min(1, 'Capacity must be at least 1')
    .max(500, 'Capacity must be at most 500'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  allowNewAdmissions: z.boolean(),
});

export const batchFormSchema = baseBatchFormSchema.refine(
  (data) => !data.startDate || !data.endDate || new Date(data.endDate) >= new Date(data.startDate),
  {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  },
);

export { baseBatchFormSchema };

export type BatchFormData = z.infer<typeof batchFormSchema>;

export const defaultFormValues: BatchFormData = {
  code: '',
  name: '',
  description: '',
  branchId: '',
  courseId: '',
  academicYearId: '',
  deliveryTypeId: '',
  maxStudents: 40,
  startDate: '',
  endDate: '',
  allowNewAdmissions: true,
};
