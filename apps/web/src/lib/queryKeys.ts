/**
 * Centralized, Typed & Tenant-Aware Query Key Registry
 * 
 * All feature hooks and prefetch orchestrators MUST use these query keys to guarantee
 * cache key alignment, background sync, and multi-tenant cache isolation.
 */

export const queryKeys = {
  // Master Data (30 min staleTime)
  courses: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'master', 'courses'] as const,
    lists: (tenantId?: string) => [...queryKeys.courses.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.courses.lists(tenantId), params] as const,
    details: (tenantId?: string) => [...queryKeys.courses.all(tenantId), 'detail'] as const,
    detail: (id: string, tenantId?: string) => [...queryKeys.courses.details(tenantId), id] as const,
  },
  subjects: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'master', 'subjects'] as const,
    lists: (tenantId?: string) => [...queryKeys.subjects.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.subjects.lists(tenantId), params] as const,
    details: (tenantId?: string) => [...queryKeys.subjects.all(tenantId), 'detail'] as const,
    detail: (id: string, tenantId?: string) => [...queryKeys.subjects.details(tenantId), id] as const,
  },
  chapters: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'master', 'chapters'] as const,
    lists: (tenantId?: string) => [...queryKeys.chapters.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.chapters.lists(tenantId), params] as const,
  },
  topics: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'master', 'topics'] as const,
    lists: (tenantId?: string) => [...queryKeys.topics.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.topics.lists(tenantId), params] as const,
  },
  branches: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'master', 'branches'] as const,
    lists: (tenantId?: string) => [...queryKeys.branches.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.branches.lists(tenantId), params] as const,
    details: (tenantId?: string) => [...queryKeys.branches.all(tenantId), 'detail'] as const,
    detail: (id: string, tenantId?: string) => [...queryKeys.branches.details(tenantId), id] as const,
  },
  academicYears: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'master', 'academic-years'] as const,
    lists: (tenantId?: string) => [...queryKeys.academicYears.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.academicYears.lists(tenantId), params] as const,
  },
  batchDeliveryTypes: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'master', 'batch-delivery-types'] as const,
    lists: (tenantId?: string) => [...queryKeys.batchDeliveryTypes.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.batchDeliveryTypes.lists(tenantId), params] as const,
  },

  // Operations (5-10 min staleTime)
  batches: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'batches'] as const,
    lists: (tenantId?: string) => [...queryKeys.batches.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.batches.lists(tenantId), params] as const,
    details: (tenantId?: string) => [...queryKeys.batches.all(tenantId), 'detail'] as const,
    detail: (id: string, tenantId?: string) => [...queryKeys.batches.details(tenantId), id] as const,
  },
  students: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'students'] as const,
    lists: (tenantId?: string) => [...queryKeys.students.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.students.lists(tenantId), params] as const,
    details: (tenantId?: string) => [...queryKeys.students.all(tenantId), 'detail'] as const,
    detail: (id: string, tenantId?: string) => [...queryKeys.students.details(tenantId), id] as const,
  },
  admissions: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'admissions'] as const,
    lists: (tenantId?: string) => [...queryKeys.admissions.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.admissions.lists(tenantId), params] as const,
  },
  tutors: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'tutors'] as const,
    lists: (tenantId?: string) => [...queryKeys.tutors.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.tutors.lists(tenantId), params] as const,
  },
  parents: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'parents'] as const,
    lists: (tenantId?: string) => [...queryKeys.parents.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.parents.lists(tenantId), params] as const,
  },

  // Live & Schedule (15s - 2m staleTime)
  liveClasses: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'live-classes'] as const,
    lists: (tenantId?: string) => [...queryKeys.liveClasses.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.liveClasses.lists(tenantId), params] as const,
    details: (tenantId?: string) => [...queryKeys.liveClasses.all(tenantId), 'detail'] as const,
    detail: (id: string, tenantId?: string) => [...queryKeys.liveClasses.details(tenantId), id] as const,
  },
  recordings: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'recordings'] as const,
    lists: (tenantId?: string) => [...queryKeys.recordings.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.recordings.lists(tenantId), params] as const,
    details: (tenantId?: string) => [...queryKeys.recordings.all(tenantId), 'detail'] as const,
    detail: (id: string, tenantId?: string) => [...queryKeys.recordings.details(tenantId), id] as const,
  },
  timetable: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'timetable'] as const,
    lists: (tenantId?: string) => [...queryKeys.timetable.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.timetable.lists(tenantId), params] as const,
  },
  attendance: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'attendance'] as const,
    lists: (tenantId?: string) => [...queryKeys.attendance.all(tenantId), 'list'] as const,
    list: (params?: unknown, tenantId?: string) => [...queryKeys.attendance.lists(tenantId), params] as const,
  },

  // Auth / Permissions (0s staleTime - Security Guard)
  auth: {
    all: ['auth'] as const,
    me: () => ['auth', 'me'] as const,
    permissions: () => ['auth', 'permissions'] as const,
  },

  // Dashboard
  dashboard: {
    all: (tenantId?: string) => ['tenant', tenantId ?? 'default', 'dashboard'] as const,
    stats: (tenantId?: string) => [...queryKeys.dashboard.all(tenantId), 'stats'] as const,
    overview: (tenantId?: string) => [...queryKeys.dashboard.all(tenantId), 'overview'] as const,
  },
} as const;
