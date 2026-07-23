import { z } from 'zod';

export const tutorSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  employeeCode: z.string().optional(),
  designation: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  yearsOfExperience: z.coerce.number().min(0).optional(),
  previousInstitution: z.string().optional(),
  bio: z.string().optional(),
  createLogin: z.boolean().optional(),
  subjectIds: z.array(z.string()).optional(),
  branchIds: z.array(z.string()).optional(),
  academicYearId: z.string().optional(),
  branchId: z.string().optional(),
  courseId: z.string().optional(),
  batchId: z.string().optional(),
});

export type TutorFormData = z.infer<typeof tutorSchema>;
