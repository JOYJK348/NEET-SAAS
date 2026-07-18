import {
  Student,
  StudentListItem,
  StudentStats,
  StudentFilters,
  StudentStatus,
  CreateStudentInput,
  UpdateStudentInput,
  TimelineEvent,
} from '@/features/students/types/student';
import type { PaginatedResponse } from '@/types/api';
import { studentMockService } from '@/features/students/mock/students.mock';

/**
 * Student Service
 *
 * This service provides a clean API interface for student operations.
 * Currently uses mock data but is designed to be easily swapped with
 * a real API implementation (e.g., React Query + API calls).
 *
 * The interface matches what a real API would return, making it
 * API-ready for future integration.
 */

export interface StudentService {
  getStudents(filters?: StudentFilters): Promise<PaginatedResponse<StudentListItem>>;
  getStudentById(id: string): Promise<Student | null>;
  getStudentStats(): Promise<StudentStats>;
  createStudent(input: CreateStudentInput): Promise<Student>;
  updateStudent(input: UpdateStudentInput): Promise<Student | null>;
  deleteStudent(id: string): Promise<boolean>;
  bulkUpdateStatus(
    ids: string[],
    status: StudentStatus,
  ): Promise<{ success: number; failed: number }>;
  archiveStudent(id: string): Promise<boolean>;
  getTimelineEvents(studentId: string): Promise<TimelineEvent[]>;
  getBatches(): Promise<{ id: string; name: string }[]>;
  getCourses(): Promise<{ id: string; name: string }[]>;
}

// Mock implementation - replaceable for development
export const studentService: StudentService = {
  async getStudents(filters: StudentFilters = {}) {
    return studentMockService.getStudents(filters);
  },

  async getStudentById(id: string) {
    return studentMockService.getStudentById(id);
  },

  async getStudentStats() {
    return studentMockService.getStudentStats();
  },

  async createStudent(input: CreateStudentInput) {
    return studentMockService.createStudent(input);
  },

  async updateStudent(input: UpdateStudentInput) {
    return studentMockService.updateStudent(input);
  },

  async deleteStudent(id: string) {
    return studentMockService.deleteStudent(id);
  },

  async bulkUpdateStatus(ids: string[], status: StudentStatus) {
    return studentMockService.bulkUpdateStatus(ids, status);
  },

  async archiveStudent(id: string) {
    return studentMockService.archiveStudent(id);
  },

  async getTimelineEvents(studentId: string) {
    return studentMockService.getTimelineEvents(studentId);
  },

  async getBatches() {
    return studentMockService.getBatches();
  },

  async getCourses() {
    return studentMockService.getCourses();
  },
};

// Export a factory function for easy testing and future API swapping
export function createStudentService(): StudentService {
  // In production, this could return an API-based implementation
  // e.g., return new ApiStudentService(apiClient);
  return studentService;
}

// Type-safe service getter for React Query integration
export const studentServiceKeys = {
  all: ['students'] as const,
  lists: () => [...studentServiceKeys.all, 'list'] as const,
  list: (filters: StudentFilters) => [...studentServiceKeys.lists(), filters] as const,
  details: () => [...studentServiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentServiceKeys.details(), id] as const,
  timeline: (studentId: string) => [...studentServiceKeys.detail(studentId), 'timeline'] as const,
  stats: () => [...studentServiceKeys.all, 'stats'] as const,
  batches: () => [...studentServiceKeys.all, 'batches'] as const,
  courses: () => [...studentServiceKeys.all, 'courses'] as const,
};
