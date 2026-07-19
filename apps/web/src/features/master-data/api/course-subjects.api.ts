import { api } from '@/lib/api';
import type { CourseSubject, CreateCourseSubjectInput } from '../types';

export const courseSubjectsApi = {
  async getCourseSubjects(courseId: string): Promise<CourseSubject[]> {
    return api.get<CourseSubject[]>(`/master/course-subjects/by-course/${courseId}`);
  },

  async assignSubject(input: CreateCourseSubjectInput): Promise<CourseSubject> {
    return api.post<CourseSubject>('/master/course-subjects', input);
  },

  async unassignSubject(id: string): Promise<void> {
    return api.delete<void>(`/master/course-subjects/${id}`);
  },
};
