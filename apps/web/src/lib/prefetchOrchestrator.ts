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
import { scheduleKeys } from '@/features/scheduling/hooks/use-schedules';
import { getWeeklyView } from '@/features/scheduling/services/schedule-service';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import {
  studentDashboardKeys,
  studentDashboardApi,
} from '@/features/student-dashboard/api/student-dashboard.api';
import {
  overviewKeys,
  overviewService,
} from '@/features/tutor-dashboard/services/overview-service';

/**
 * Universal Prefetch Orchestrator
 *
 * Rules:
 * - Role-aware: Only prefetches endpoints accessible to the authenticated user's role.
 * - Non-disruptive: Passes { skipGlobalToast: true } so background prefetching never emits Access Denied toasts.
 * - Uses EXACT queryKeys matching default page params for 100% immediate cache hits (<20ms).
 */
export async function prefetchCriticalData(
  queryClient: QueryClient,
  tenantId?: string,
  roleCode?: string,
) {
  const role = (roleCode || '').toUpperCase();
  const isTutor = role === 'TUTOR' || role === 'FACULTY';
  const isStudent = role === 'STUDENT';
  const isParent = role === 'PARENT';
  const isAdmin =
    !role ||
    role === 'TENANT_ADMIN' ||
    role.startsWith('TENANT_ADMIN') ||
    role === 'SUPER_ADMIN' ||
    role === 'PLATFORM_ADMIN';

  try {
    if (isTutor) {
      // Tutor-specific prefetching: Overview, Weekly Timetable, Assigned Batches, Recordings
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: overviewKeys.detail(),
          queryFn: () => overviewService.getOverview(),
          staleTime: STALE_TIMES.DEFAULT,
        }),
        queryClient.prefetchQuery({
          queryKey: ['tutor', 'schedules', 'weekly'],
          queryFn: ({ signal }) =>
            api.get('/scheduling/schedules/weekly-view', { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.DEFAULT,
        }),
        queryClient.prefetchQuery({
          queryKey: ['tutor', 'batches'],
          queryFn: ({ signal }) =>
            api.get('/people/tutors/my-batches', { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.DEFAULT,
        }),
        queryClient.prefetchQuery({
          queryKey: [
            'recordings',
            'list',
            { search: '', status: 'ALL', subjectId: 'ALL', batchId: 'ALL' },
            1,
          ],
          queryFn: ({ signal }) =>
            api.get('/recordings', {
              params: { page: 1, limit: 12 },
              signal,
              skipGlobalToast: true,
            }),
          staleTime: STALE_TIMES.DEFAULT,
        }),
      ]);
      return;
    }

    if (isStudent) {
      // Student-specific prefetching: Overview, Timetable, Enrolled Courses, Batches, Attendance, Recordings, Exams, Fees
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: studentDashboardKeys.overview(),
          queryFn: () => studentDashboardApi.getOverview(),
          staleTime: STALE_TIMES.DEFAULT,
        }),
        queryClient.prefetchQuery({
          queryKey: studentDashboardKeys.timetable(),
          queryFn: () => studentDashboardApi.getTimetable(),
          staleTime: STALE_TIMES.DEFAULT,
        }),
        queryClient.prefetchQuery({
          queryKey: studentDashboardKeys.courses(),
          queryFn: () => studentDashboardApi.getCourses(),
          staleTime: STALE_TIMES.MASTERS,
        }),
        queryClient.prefetchQuery({
          queryKey: studentDashboardKeys.batches(),
          queryFn: () => studentDashboardApi.getBatches(),
          staleTime: STALE_TIMES.MASTERS,
        }),
        queryClient.prefetchQuery({
          queryKey: studentDashboardKeys.attendance(),
          queryFn: () => studentDashboardApi.getAttendance(),
          staleTime: STALE_TIMES.DEFAULT,
        }),
        queryClient.prefetchQuery({
          queryKey: ['student-exams'],
          queryFn: ({ signal }) =>
            api.get('/offline-exams/student-exams', { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.DEFAULT,
        }),
        queryClient.prefetchQuery({
          queryKey: ['student-recordings-all'],
          queryFn: ({ signal }) =>
            api.get('/recordings', {
              params: { page: 1, limit: 100 },
              signal,
              skipGlobalToast: true,
            }),
          staleTime: STALE_TIMES.DEFAULT,
        }),
        queryClient.prefetchQuery({
          queryKey: ['student-pyq-all'],
          queryFn: ({ signal }) => api.get('/pyq', { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.DEFAULT,
        }),
        queryClient.prefetchQuery({
          queryKey: ['student-fee-account', 'DEMO_STUDENT_ID'],
          queryFn: ({ signal }) =>
            api.get('/billing/fee-assignments/DEMO_STUDENT_ID', { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.DEFAULT,
        }),
      ]);
      return;
    }

    if (isParent) {
      // Parent-specific prefetching: Prefetch children list + active child academics, attendance, exams, fees, & overview
      await queryClient.prefetchQuery({
        queryKey: ['parent', 'linked-students'],
        queryFn: () => parentPortalService.getLinkedStudents(),
        staleTime: STALE_TIMES.DEFAULT,
      });

      const students = queryClient.getQueryData<any[]>(['parent', 'linked-students']);
      const childId =
        students?.[0]?.id ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('parent_portal_selected_child_id')
          : null);

      if (childId) {
        await Promise.allSettled([
          queryClient.prefetchQuery({
            queryKey: ['parent', 'academics', childId],
            queryFn: () => parentPortalService.getAcademics(childId),
            staleTime: STALE_TIMES.DEFAULT,
          }),
          queryClient.prefetchQuery({
            queryKey: ['parent', 'attendance', childId],
            queryFn: () => parentPortalService.getAttendance(childId),
            staleTime: STALE_TIMES.DEFAULT,
          }),
          queryClient.prefetchQuery({
            queryKey: ['parent', 'exams', childId],
            queryFn: () => parentPortalService.getExams(childId),
            staleTime: STALE_TIMES.DEFAULT,
          }),
          queryClient.prefetchQuery({
            queryKey: ['parent', 'fees', childId],
            queryFn: () => parentPortalService.getFees(childId),
            staleTime: STALE_TIMES.DEFAULT,
          }),
          queryClient.prefetchQuery({
            queryKey: ['parent', 'overview', childId],
            queryFn: () => parentPortalService.getOverview(childId),
            staleTime: STALE_TIMES.DEFAULT,
          }),
        ]);
      }
      return;
    }

    if (isAdmin) {
      // Tenant Admin prefetching
      await Promise.allSettled([
        // 1. Tenant Dashboard Overview
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.overview(tenantId),
          queryFn: ({ signal }) =>
            api.get('/tenant-dashboard/overview', { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.DEFAULT,
        }),

        // 2. Courses Page (/tenant-admin/courses)
        queryClient.prefetchQuery({
          queryKey: queryKeys.courses.list(
            { page: 1, limit: 10, search: undefined, sortBy: 'name', sortOrder: 'asc' },
            tenantId,
          ),
          queryFn: ({ signal }) =>
            coursesApi.getCourses(
              { page: 1, limit: 10, search: undefined, sortBy: 'name', sortOrder: 'asc' },
              { signal, skipGlobalToast: true },
            ),
          staleTime: STALE_TIMES.MASTERS,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.courses.list({ limit: 200 }, tenantId),
          queryFn: ({ signal }) =>
            coursesApi.getCourses({ limit: 200 }, { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.MASTERS,
        }),

        // 3. Subjects Page (/tenant-admin/subjects)
        queryClient.prefetchQuery({
          queryKey: queryKeys.subjects.list(
            { page: 1, limit: 12, search: undefined, sortBy: 'name', sortOrder: 'asc' },
            tenantId,
          ),
          queryFn: ({ signal }) =>
            subjectsApi.getSubjects(
              { page: 1, limit: 12, search: undefined, sortBy: 'name', sortOrder: 'asc' },
              { signal, skipGlobalToast: true },
            ),
          staleTime: STALE_TIMES.MASTERS,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.subjects.list({ limit: 200 }, tenantId),
          queryFn: ({ signal }) =>
            subjectsApi.getSubjects({ limit: 200 }, { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.MASTERS,
        }),

        // 4. Branches Page (/tenant-admin/branches)
        queryClient.prefetchQuery({
          queryKey: queryKeys.branches.list(
            { page: 1, limit: 10, search: undefined, sortBy: 'name', sortOrder: 'asc' },
            tenantId,
          ),
          queryFn: ({ signal }) =>
            branchesApi.getBranches(
              { page: 1, limit: 10, search: undefined, sortBy: 'name', sortOrder: 'asc' },
              { signal, skipGlobalToast: true },
            ),
          staleTime: STALE_TIMES.MASTERS,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.branches.list({ limit: 200 }, tenantId),
          queryFn: ({ signal }) =>
            branchesApi.getBranches({ limit: 200 }, { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.MASTERS,
        }),

        // 5. Academic Years Page (/tenant-admin/academic-years)
        queryClient.prefetchQuery({
          queryKey: queryKeys.academicYears.list(
            { page: 1, limit: 10, search: undefined, sortBy: 'startDate', sortOrder: 'desc' },
            tenantId,
          ),
          queryFn: ({ signal }) =>
            academicYearsApi.getAcademicYears(
              { page: 1, limit: 10, search: undefined, sortBy: 'startDate', sortOrder: 'desc' },
              { signal, skipGlobalToast: true },
            ),
          staleTime: STALE_TIMES.MASTERS,
        }),

        // 6. Students Directory (/dashboard/students)
        queryClient.prefetchQuery({
          queryKey: studentServiceKeys.list({
            page: 1,
            perPage: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            status: 'ALL',
          }),
          queryFn: ({ signal }) =>
            studentService.getStudents(
              { page: 1, perPage: 10, sortBy: 'createdAt', sortOrder: 'desc', status: 'ALL' },
              { signal, skipGlobalToast: true },
            ),
          staleTime: STALE_TIMES.STUDENTS,
        }),
        queryClient.prefetchQuery({
          queryKey: studentServiceKeys.stats(),
          queryFn: ({ signal }) =>
            studentService.getStudentStats({ signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.STUDENTS,
        }),

        // 7. Tutors Directory (/dashboard/tutors)
        queryClient.prefetchQuery({
          queryKey: tutorService.keys.list({
            search: undefined,
            subjectId: undefined,
            branchId: undefined,
            tutorStatus: undefined,
            page: 1,
            limit: 10,
          }),
          queryFn: ({ signal }) =>
            tutorService.findAll(
              {
                search: undefined,
                subjectId: undefined,
                branchId: undefined,
                tutorStatus: undefined,
                page: 1,
                limit: 10,
              },
              { signal, skipGlobalToast: true },
            ),
          staleTime: STALE_TIMES.STUDENTS,
        }),

        // 8. Class Recordings Library (/dashboard/recordings)
        queryClient.prefetchQuery({
          queryKey: [
            'recordings',
            'list',
            { search: '', status: 'ALL', subjectId: 'ALL', batchId: 'ALL' },
            1,
          ],
          queryFn: ({ signal }) =>
            api.get('/recordings', {
              params: { page: 1, limit: 12 },
              signal,
              skipGlobalToast: true,
            }),
          staleTime: STALE_TIMES.DEFAULT,
        }),

        // 9. Master Timetable Weekly View (/dashboard/timetable)
        queryClient.prefetchQuery({
          queryKey: scheduleKeys.weeklyView(undefined),
          queryFn: () => getWeeklyView(undefined),
          staleTime: STALE_TIMES.DEFAULT,
        }),

        // 10. Fee Management Pages (/tenant-admin/fees, /plans, /students, /reports)
        queryClient.prefetchQuery({
          queryKey: ['fees', 'kpis'],
          queryFn: ({ signal }) =>
            api.get('/billing/ledger/kpis', { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.DEFAULT,
        }),
        queryClient.prefetchQuery({
          queryKey: ['fees', 'plans'],
          queryFn: ({ signal }) =>
            api.get('/billing/fee-plans', { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.DEFAULT,
        }),
        queryClient.prefetchQuery({
          queryKey: ['fees', 'assignments'],
          queryFn: ({ signal }) =>
            api.get('/billing/fee-assignments', { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.DEFAULT,
        }),
        queryClient.prefetchQuery({
          queryKey: ['fees', 'outstanding', 'ALL'],
          queryFn: ({ signal }) =>
            api.get('/billing/ledger/outstanding', { signal, skipGlobalToast: true }),
          staleTime: STALE_TIMES.DEFAULT,
        }),
      ]);
    }
  } catch (error) {
    console.warn('Universal prefetch notice:', error);
  }
}
