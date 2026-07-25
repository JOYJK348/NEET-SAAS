import { api } from '@/lib/api';
import type { TutorCourseListResponseDto } from '@/features/tutor-dashboard/types/courses';

export const coursesService = {
  getCourses(): Promise<TutorCourseListResponseDto> {
    return api.get<TutorCourseListResponseDto>('/tutor-dashboard/courses');
  },
};

export const courseKeys = {
  all: ['tutor-courses'] as const,
  list: () => [...courseKeys.all, 'list'] as const,
};
