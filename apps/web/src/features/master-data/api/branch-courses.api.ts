import { api } from '@/lib/api';

export interface BranchCourseMapping {
  id: string;
  tenantId: string;
  branchId: string;
  courseId: string;
  academicYearId: string;
  isActive: boolean;
  createdAt: string;
}

export interface MapBranchCourseInput {
  branchId: string;
  courseId: string;
  academicYearId: string;
  isActive?: boolean;
}

export const branchCoursesApi = {
  async getMappings(): Promise<BranchCourseMapping[]> {
    return api.get<BranchCourseMapping[]>('/master/branch-courses');
  },

  async getMappingsByBranch(branchId: string): Promise<BranchCourseMapping[]> {
    return api.get<BranchCourseMapping[]>(`/master/branch-courses/by-branch/${branchId}`);
  },

  async createMapping(input: MapBranchCourseInput): Promise<BranchCourseMapping> {
    return api.post<BranchCourseMapping>('/master/branch-courses', input);
  },

  async deleteMapping(id: string): Promise<void> {
    return api.delete<void>(`/master/branch-courses/${id}`);
  },
};
