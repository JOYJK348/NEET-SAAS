import { z } from 'zod';

export const personalInfoSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => {
      if (!val) return true;
      const dob = new Date(val);
      if (isNaN(dob.getTime())) return false;
      const now = new Date();
      let age = now.getFullYear() - dob.getFullYear();
      const monthDiff = now.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
        age--;
      }
      return age >= 15 && age <= 25;
    }, 'Student age must be between 15 and 25 years'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    required_error: 'Please select a gender',
  }),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must be at most 200 characters'),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City must be at most 50 characters'),
  state: z
    .string()
    .min(2, 'State must be at least 2 characters')
    .max(50, 'State must be at most 50 characters'),
  pincode: z
    .string()
    .min(5, 'Pincode must be at least 5 characters')
    .max(10, 'Pincode must be at most 10 characters'),
  profileImage: z.string().optional(),
});

export const academicInfoSchema = z.object({
  branchId: z.string().min(1, 'Please select a branch'),
  academicYearId: z.string().min(1, 'Please select an academic year'),
  courseId: z.string().min(1, 'Please select a course'),
  batchId: z.string().min(1, 'Please select a batch'),
  admissionDate: z.string().min(1, 'Admission date is required'),
});

export const parentInfoSchema = z.object({
  parentName: z
    .string()
    .min(2, 'Parent name must be at least 2 characters')
    .max(50, 'Parent name must be at most 50 characters')
    .optional()
    .or(z.literal('')),
  parentPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be at most 15 digits')
    .optional()
    .or(z.literal('')),
  parentEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  emergencyContact: z
    .string()
    .min(10, 'Emergency contact must be at least 10 digits')
    .max(15, 'Emergency contact must be at most 15 digits')
    .optional()
    .or(z.literal('')),
});

export const medicalInfoSchema = z.object({
  bloodGroup: z.string().optional().or(z.literal('')),
  aadharNumber: z
    .string()
    .regex(/^\d{4}-\d{4}-\d{4}$/, 'Aadhar number must be in format XXXX-XXXX-XXXX')
    .optional()
    .or(z.literal('')),
});

export const studentFormSchema = z.object({
  ...personalInfoSchema.shape,
  ...academicInfoSchema.shape,
  ...parentInfoSchema.shape,
  ...medicalInfoSchema.shape,
});

export type StudentFormData = z.infer<typeof studentFormSchema>;

export const defaultFormValues: StudentFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: 'MALE',
  address: '',
  city: '',
  state: '',
  pincode: '',
  profileImage: undefined,
  branchId: '',
  academicYearId: '',
  courseId: '',
  batchId: '',
  admissionDate: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  emergencyContact: '',
  bloodGroup: '',
  aadharNumber: '',
};
