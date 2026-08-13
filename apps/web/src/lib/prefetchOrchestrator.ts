import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { STALE_TIMES } from './staleTimes';
import { api } from '@/lib/api';
import { coursesApi } from '@/features/master-data/api/courses.api';
import { subjectsApi } from '@/features/master-data/api/subjects.api';
import { branchesApi } from '@/features/master-data/api/branches.api';
import { academicYearsApi } from '@/features/master-data/api/academic-years.api';
import { batchDeliveryTypesApi } from '@/features/master-data/api/batch-delivery-types.api';
import { studentService, studentServiceKeys } from '@/features/students/services/student-service';
import { tutorService } from '@/features/tutors/services/tutor-service';

/**
 * Universal Prefetch Orchestrator
 * 
 * Rules:
 * - Fires background prefetching of master data, dashboard overview, students, tutors, and parents.
 * - Uses exact queryKeys and STALE_TIMES so page hooks achieve a 100% immediate cache hit on first visit (<20ms).
 */
export async function prefetchCriticalData(queryClient: QueryClient, tenantId?: string) {
  try {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.overview(tenantId),
        queryFn: ({ signal }) => api.get('/tenant-dashboard/overview', { signal }),
        staleTime: STALE_TIMES.DEFAULT,
      }),
      queryClient.prefetchQuery({
        queryKey: studentServiceKeys.list({ page: 1, perPage: 10, sortBy: 'createdAt', sortOrder: 'desc', status: 'ALL' }),
        queryFn: ({ signal }) => studentService.getStudents({ page: 1, perPage: 10, sortBy: 'createdAt', sortOrder: 'desc', status: 'ALL' }, { signal }),
        staleTime: STALE_TIMES.STUDENTS,
      }),
      queryClient.prefetchQuery({
        queryKey: studentServiceKeys.stats(),
        queryFn: ({ signal }) => studentService.getStudentStats({ signal }),
        staleTime: STALE_TIMES.STUDENTS,
      }),
      queryClient.prefetchQuery({
        queryKey: tutorService.keys.list({ page: 1, limit: 10 }),
        queryFn: ({ signal }) => tutorService.findAll({ page: 1, limit: 10 }, { signal }),
        staleTime: STALE_TIMES.STUDENTS,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.parents.list({ limit: 100 }, tenantId),
        queryFn: async ({ signal }) => {
          const res = await api.get<any>('/students?limit=100', { signal });
          const studentsList = res.data?.data || res.data || [];
          const parentMap = new Map<string, any>();
          studentsList.forEach((s: any) => {
            if (s.parentEmail && s.parentEmail !== 'Not provided') {
              const pEmail = s.parentEmail.toLowerCase();
              if (!parentMap.has(pEmail)) {
                parentMap.set(pEmail, {
                  id: s.id,
                  email: s.parentEmail,
                  name: s.parentName || 'Parent',
                  phone: s.parentPhone || 'Not provided',
                  status: 'ACTIVE',
                  lastLogin: s.createdAt,
                  children: [
                    {
                      studentId: s.id,
                      name: `${s.firstName} ${s.lastName}`,
                      courseName: s.courseName || 'NEET',
                      batchName: s.batchName || 'Main',
                    },
                  ],
                });
              } else {
                const existing = parentMap.get(pEmail)!;
                existing.children.push({
                  studentId: s.id,
                  name: `${s.firstName} ${s.lastName}`,
                  courseName: s.courseName || 'NEET',
                  batchName: s.batchName || 'Main',
                });
              }
            }
          });
          return Array.from(parentMap.values());
        },
        staleTime: STALE_TIMES.STUDENTS,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.courses.list({ limit: 200 }, tenantId),
        queryFn: ({ signal }) => coursesApi.getCourses({ limit: 200 }, { signal }),
        staleTime: STALE_TIMES.MASTERS,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.subjects.list({ limit: 200 }, tenantId),
        queryFn: ({ signal }) => subjectsApi.getSubjects({ limit: 200 }, { signal }),
        staleTime: STALE_TIMES.MASTERS,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.branches.list({ limit: 200 }, tenantId),
        queryFn: ({ signal }) => branchesApi.getBranches({ limit: 200 }, { signal }),
        staleTime: STALE_TIMES.MASTERS,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.academicYears.list({ limit: 50 }, tenantId),
        queryFn: () => academicYearsApi.getAcademicYears({ limit: 50 }),
        staleTime: STALE_TIMES.MASTERS,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.batchDeliveryTypes.list({ limit: 50 }, tenantId),
        queryFn: () => batchDeliveryTypesApi.getDeliveryTypes({ limit: 50 }),
        staleTime: STALE_TIMES.MASTERS,
      }),
    ]);
  } catch (error) {
    console.warn('Universal prefetch notice:', error);
  }
}
