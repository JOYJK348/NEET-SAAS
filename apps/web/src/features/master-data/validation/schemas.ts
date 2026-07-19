import { z } from 'zod';

export const branchSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(50),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100),
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  displayName: z.string().min(2, 'Display Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 characters').max(20),
  branchType: z.enum(['HEAD_OFFICE', 'CAMPUS', 'FRANCHISE', 'ONLINE']),
  status: z.string().default('ACTIVE'),
  timezone: z.string().default('Asia/Kolkata'),
});

export const academicYearSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(50),
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start Date is required'),
  endDate: z.string().min(1, 'End Date is required'),
  displayOrder: z.coerce.number().int().default(1),
  isCurrent: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const courseSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(50),
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  displayName: z.string().min(2, 'Display Name must be at least 2 characters').max(255),
  description: z.string().optional(),
  courseType: z.string().default('REGULAR'),
  durationMonths: z.coerce.number().int().min(1, 'Duration must be at least 1 month').default(12),
  displayOrder: z.coerce.number().int().default(1),
  isActive: z.boolean().default(true),
});

export const subjectSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(50),
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  shortName: z.string().max(50).optional(),
  displayName: z.string().min(2, 'Display Name must be at least 2 characters').max(255),
  description: z.string().optional(),
  subjectType: z.string().default('CORE'),
  displayOrder: z.coerce.number().int().default(1),
  isActive: z.boolean().default(true),
});

export const courseSubjectSchema = z.object({
  subjectId: z.string().min(1, 'Please select a subject'),
  displayOrder: z.coerce.number().int().default(1),
  isMandatory: z.boolean().default(true),
  totalMarks: z.coerce.number().int().min(0).default(100),
  passingMarks: z.coerce.number().int().min(0).default(40),
  credits: z.coerce.number().int().min(0).default(0),
  plannedHours: z.coerce.number().int().min(0).default(100),
});

export const chapterSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(50),
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  shortName: z.string().optional(),
  description: z.string().optional(),
  plannedHours: z.coerce.number().int().min(0).default(10),
  estimatedSessions: z.coerce.number().int().min(0).default(8),
  displayOrder: z.coerce.number().int().default(1),
  isActive: z.boolean().default(true),
});

export const topicSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(50),
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  shortName: z.string().optional(),
  description: z.string().optional(),
  learningObjectives: z.string().optional(),
  difficultyLevel: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  plannedHours: z.coerce.number().int().min(0).default(4),
  plannedSessions: z.coerce.number().int().min(0).default(3),
  displayOrder: z.coerce.number().int().default(1),
  isActive: z.boolean().default(true),
});

export const batchDeliveryTypeSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  attendanceMode: z.enum(['CLASSROOM', 'ONLINE', 'HYBRID']),
  defaultMaxStudents: z.coerce.number().int().min(1).default(40),
  defaultStartTime: z.string().min(1, 'Start Time is required'),
  defaultEndTime: z.string().min(1, 'End Time is required'),
  colorCode: z.string().optional(),
  iconName: z.string().optional(),
  displayOrder: z.coerce.number().int().default(1),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
