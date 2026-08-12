import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import { STALE_TIMES } from './staleTimes';
import { api } from '@/lib/api';
import { coursesApi } from '@/features/master-data/api/courses.api';
import { subjectsApi } from '@/features/master-data/api/subjects.api';
import { branchesApi } from '@/features/master-data/api/branches.api';
import { academicYearsApi } from '@/features/master-data/api/academic-years.api';
import { batchDeliveryTypesApi } from '@/features/master-data/api/batch-delivery-types.api';

/**
 * Lean Prefetch Orchestrator
 * 
 * Rules:
 * - Fires background prefetching of LIGHT reference master data and Dashboard overview stats.
 * - NEVER prefetches heavy collections (like Students, Recordings, Exam Results) on login.
 * - Uses exact queryKeys and STALE_TIMES so page hooks achieve a 100% cache hit.
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
    console.warn('Lean master data prefetch notice:', error);
  }
}
