import type {
  Batch,
  BatchListItem,
  BatchStats,
  BatchFilters,
  BatchStatus,
  BatchDeliveryType,
  BatchStudentEnrollment,
  BatchStaffAssignment,
  BatchTimelineEvent,
  CreateBatchInput,
  UpdateBatchInput,
} from '@/features/batches/types/batch';
import type { PaginatedResponse } from '@/types/api';
import { VALID_TRANSITIONS } from '@/features/batches/types/batch';

const deliveryTypes: BatchDeliveryType[] = [
  {
    id: 'dt1',
    code: 'CLASSROOM',
    name: 'Classroom',
    description: 'In-person classroom sessions',
    attendanceMode: 'CLASSROOM',
    defaultMaxStudents: 40,
    colorCode: '#4F46E5',
    iconName: 'building',
  },
  {
    id: 'dt2',
    code: 'ONLINE',
    name: 'Online Live',
    description: 'Live online interactive sessions',
    attendanceMode: 'ONLINE',
    defaultMaxStudents: 100,
    colorCode: '#06B6D4',
    iconName: 'monitor',
  },
  {
    id: 'dt3',
    code: 'HYBRID',
    name: 'Hybrid',
    description: 'Blended classroom and online sessions',
    attendanceMode: 'HYBRID',
    defaultMaxStudents: 60,
    colorCode: '#D97706',
    iconName: 'layers',
  },
];

const branches = [
  { id: 'b1', name: 'Koramangala' },
  { id: 'b2', name: 'Indiranagar' },
  { id: 'b3', name: 'Whitefield' },
  { id: 'b4', name: 'JP Nagar' },
];

const courses = [
  { id: 'c1', name: 'NEET Full Course' },
  { id: 'c2', name: 'NEET Crash Course' },
  { id: 'c3', name: 'JEE Main + Advanced' },
  { id: 'c4', name: 'Foundation (Class 11)' },
];

const academicYears = [
  { id: 'ay1', name: '2025-2026' },
  { id: 'ay2', name: '2026-2027' },
];

function generateBatches(): Batch[] {
  const now = new Date();
  const commonBatches: Array<{
    code: string;
    name: string;
    branchIdx: number;
    courseIdx: number;
    yearIdx: number;
    maxStudents: number;
    status: BatchStatus;
    startDate: string;
    endDate: string;
  }> = [
    {
      code: 'NEET25A',
      name: 'NEET 2026 Batch A',
      branchIdx: 0,
      courseIdx: 0,
      yearIdx: 0,
      maxStudents: 40,
      status: 'ACTIVE',
      startDate: '2025-06-01',
      endDate: '2026-04-30',
    },
    {
      code: 'NEET25B',
      name: 'NEET 2026 Batch B',
      branchIdx: 1,
      courseIdx: 0,
      yearIdx: 0,
      maxStudents: 35,
      status: 'ACTIVE',
      startDate: '2025-06-15',
      endDate: '2026-04-30',
    },
    {
      code: 'NEET25C',
      name: 'NEET 2026 Batch C',
      branchIdx: 2,
      courseIdx: 0,
      yearIdx: 0,
      maxStudents: 30,
      status: 'ACTIVE',
      startDate: '2025-07-01',
      endDate: '2026-04-30',
    },
    {
      code: 'CRSHJAN',
      name: 'NEET Crash Jan',
      branchIdx: 0,
      courseIdx: 1,
      yearIdx: 0,
      maxStudents: 50,
      status: 'PLANNED',
      startDate: '2026-01-01',
      endDate: '2026-04-30',
    },
    {
      code: 'JEEMA26A',
      name: 'JEE 2026 Alpha',
      branchIdx: 0,
      courseIdx: 2,
      yearIdx: 0,
      maxStudents: 45,
      status: 'ACTIVE',
      startDate: '2025-06-01',
      endDate: '2026-05-15',
    },
    {
      code: 'JEEMA26B',
      name: 'JEE 2026 Beta',
      branchIdx: 1,
      courseIdx: 2,
      yearIdx: 0,
      maxStudents: 40,
      status: 'ACTIVE',
      startDate: '2025-06-15',
      endDate: '2026-05-15',
    },
    {
      code: 'FND26XI',
      name: 'Foundation XI A',
      branchIdx: 3,
      courseIdx: 3,
      yearIdx: 0,
      maxStudents: 35,
      status: 'ACTIVE',
      startDate: '2025-04-01',
      endDate: '2027-03-31',
    },
    {
      code: 'NEET_24A',
      name: 'NEET 2025 Batch A',
      branchIdx: 0,
      courseIdx: 0,
      yearIdx: 1,
      maxStudents: 40,
      status: 'COMPLETED',
      startDate: '2024-06-01',
      endDate: '2025-04-30',
    },
    {
      code: 'NEET_24B',
      name: 'NEET 2025 Batch B',
      branchIdx: 2,
      courseIdx: 0,
      yearIdx: 1,
      maxStudents: 35,
      status: 'COMPLETED',
      startDate: '2024-06-15',
      endDate: '2025-04-30',
    },
    {
      code: 'CRSH24',
      name: 'NEET Crash 2025',
      branchIdx: 1,
      courseIdx: 1,
      yearIdx: 1,
      maxStudents: 50,
      status: 'COMPLETED',
      startDate: '2025-01-01',
      endDate: '2025-04-30',
    },
    {
      code: 'CANCEL01',
      name: 'Cancelled Weekend',
      branchIdx: 3,
      courseIdx: 2,
      yearIdx: 0,
      maxStudents: 25,
      status: 'CANCELLED',
      startDate: '2025-09-01',
      endDate: '2026-03-31',
    },
    {
      code: 'ARCH23A',
      name: 'NEET 2024 Batch A',
      branchIdx: 0,
      courseIdx: 0,
      yearIdx: 1,
      maxStudents: 40,
      status: 'ARCHIVED',
      startDate: '2023-06-01',
      endDate: '2024-04-30',
    },
    {
      code: 'JEEMA25A',
      name: 'JEE 2025 Alpha',
      branchIdx: 0,
      courseIdx: 2,
      yearIdx: 1,
      maxStudents: 45,
      status: 'ARCHIVED',
      startDate: '2023-06-01',
      endDate: '2024-05-15',
    },
    {
      code: 'NEET26D',
      name: 'NEET 2026 Batch D',
      branchIdx: 3,
      courseIdx: 0,
      yearIdx: 0,
      maxStudents: 30,
      status: 'PLANNED',
      startDate: '2025-08-01',
      endDate: '2026-04-30',
    },
    {
      code: 'FND27XI',
      name: 'Foundation XI B',
      branchIdx: 1,
      courseIdx: 3,
      yearIdx: 0,
      maxStudents: 30,
      status: 'PLANNED',
      startDate: '2025-04-15',
      endDate: '2027-03-31',
    },
  ];

  return commonBatches.map((b, i) => {
    const branch = branches[b.branchIdx];
    const course = courses[b.courseIdx];
    const year = academicYears[b.yearIdx];
    const dt = deliveryTypes[i % deliveryTypes.length];
    const enrolledCount = Math.floor(Math.random() * b.maxStudents * 0.9);

    return {
      id: `batch-${String(i + 1).padStart(3, '0')}`,
      code: b.code,
      name: b.name,
      description: `${b.name} - ${course.name} program at ${branch.name} branch`,
      branchId: branch.id,
      branchName: branch.name,
      courseId: course.id,
      courseName: course.name,
      academicYearId: year.id,
      academicYearName: year.name,
      deliveryTypeId: dt.id,
      deliveryType: dt,
      status: b.status,
      maxStudents: b.maxStudents,
      enrolledCount,
      startDate: b.startDate,
      endDate: b.endDate,
      allowNewAdmissions: b.status === 'ACTIVE' || b.status === 'PLANNED',
      createdAt: new Date(now.getTime() - 86400000 * 365).toISOString(),
      updatedAt: new Date(now.getTime() - 86400000 * Math.floor(Math.random() * 30)).toISOString(),
    };
  });
}

function generateTimeline(batchId: string, status: BatchStatus): BatchTimelineEvent[] {
  const now = new Date();
  const events: BatchTimelineEvent[] = [
    {
      id: `evt-${batchId}-create`,
      batchId,
      type: 'CREATED',
      title: 'Batch Created',
      createdBy: 'Admin User',
      createdAt: new Date(now.getTime() - 86400000 * 90).toISOString(),
    },
  ];

  if (
    status === 'ACTIVE' ||
    status === 'COMPLETED' ||
    status === 'CANCELLED' ||
    status === 'ARCHIVED'
  ) {
    events.push({
      id: `evt-${batchId}-activate`,
      batchId,
      type: 'STATUS_CHANGED',
      title: 'Batch Activated',
      fromStatus: 'PLANNED',
      toStatus: 'ACTIVE',
      createdBy: 'Admin User',
      createdAt: new Date(now.getTime() - 86400000 * 60).toISOString(),
    });
  }

  if (status === 'CANCELLED') {
    events.push({
      id: `evt-${batchId}-cancel`,
      batchId,
      type: 'STATUS_CHANGED',
      title: 'Batch Cancelled',
      fromStatus: 'PLANNED',
      toStatus: 'CANCELLED',
      description: 'Insufficient enrollments',
      createdBy: 'Admin User',
      createdAt: new Date(now.getTime() - 86400000 * 30).toISOString(),
    });
  }

  if (status === 'COMPLETED') {
    events.push({
      id: `evt-${batchId}-complete`,
      batchId,
      type: 'STATUS_CHANGED',
      title: 'Batch Completed',
      fromStatus: 'ACTIVE',
      toStatus: 'COMPLETED',
      createdBy: 'System',
      createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
    });
  }

  if (status === 'ARCHIVED') {
    events.push({
      id: `evt-${batchId}-completed`,
      batchId,
      type: 'STATUS_CHANGED',
      title: 'Batch Completed',
      fromStatus: 'ACTIVE',
      toStatus: 'COMPLETED',
      createdBy: 'System',
      createdAt: new Date(now.getTime() - 86400000 * 35).toISOString(),
    });
    events.push({
      id: `evt-${batchId}-archived`,
      batchId,
      type: 'STATUS_CHANGED',
      title: 'Batch Archived',
      fromStatus: 'COMPLETED',
      toStatus: 'ARCHIVED',
      createdBy: 'Admin User',
      createdAt: new Date(now.getTime() - 86400000 * 1).toISOString(),
    });
  }

  return events;
}

const mockBatches = generateBatches();

const mockTimelineEvents: Record<string, BatchTimelineEvent[]> = {};
mockBatches.forEach((b) => {
  mockTimelineEvents[b.id] = generateTimeline(b.id, b.status);
});

const mockStudentEnrollments: Record<string, BatchStudentEnrollment[]> = {};
mockBatches.forEach((b) => {
  const count = Math.min(b.enrolledCount, 8);
  mockStudentEnrollments[b.id] = Array.from({ length: count }, (_, i) => ({
    id: `enr-${b.id}-${i + 1}`,
    studentId: `stu-${b.id}-${i + 1}`,
    studentName: `Student ${i + 1} - ${b.name}`,
    email: `student${i + 1}@example.com`,
    phone: `9876543${String(i + 1).padStart(4, '0')}`,
    joinedAt: b.startDate,
    status: b.status === 'ACTIVE' || b.status === 'PLANNED' ? 'ACTIVE' : 'COMPLETED',
    isPrimary: i === 0,
  }));
});

const mockStaffAssignments: Record<string, BatchStaffAssignment[]> = {};
mockBatches.forEach((b) => {
  const subjects = b.courseName.includes('NEET')
    ? ['Biology', 'Physics', 'Chemistry']
    : b.courseName.includes('JEE')
      ? ['Physics', 'Chemistry', 'Mathematics']
      : ['Science', 'Mathematics', 'English'];

  mockStaffAssignments[b.id] = subjects.map((subject, i) => ({
    id: `staff-${b.id}-${i + 1}`,
    staffId: `staff-${i + 1}`,
    staffName: ['Dr. Sharma', 'Prof. Patel', 'Ms. Reddy'][i],
    subject,
    effectiveFrom: b.startDate,
    effectiveTo: b.status === 'COMPLETED' || b.status === 'ARCHIVED' ? b.endDate : undefined,
    isActive: b.status === 'ACTIVE' || b.status === 'PLANNED',
  }));
});

const batchesDb = [...mockBatches];

function applyFilters(batches: Batch[], filters: BatchFilters): Batch[] {
  let filtered = [...batches];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.branchName.toLowerCase().includes(q) ||
        b.courseName.toLowerCase().includes(q),
    );
  }

  if (filters.status && filters.status !== 'ALL') {
    filtered = filtered.filter((b) => b.status === filters.status);
  }

  if (filters.courseId) {
    filtered = filtered.filter((b) => b.courseId === filters.courseId);
  }

  if (filters.branchId) {
    filtered = filtered.filter((b) => b.branchId === filters.branchId);
  }

  if (filters.academicYearId) {
    filtered = filtered.filter((b) => b.academicYearId === filters.academicYearId);
  }

  if (filters.deliveryTypeId) {
    filtered = filtered.filter((b) => b.deliveryTypeId === filters.deliveryTypeId);
  }

  if (filters.sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof Batch];
      const bVal = b[filters.sortBy as keyof Batch];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return filtered;
}

function paginate<T>(items: T[], page: number, perPage: number): PaginatedResponse<T> {
  const total = items.length;
  const lastPage = Math.ceil(total / perPage);
  const currentPage = Math.max(1, Math.min(page, lastPage));
  const from = (currentPage - 1) * perPage;
  const to = Math.min(from + perPage, total);

  return {
    data: items.slice(from, to),
    meta: {
      currentPage,
      perPage,
      total,
      lastPage,
      from: total > 0 ? from + 1 : null,
      to: total > 0 ? to : null,
    },
  };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function toListItem(batch: Batch): BatchListItem {
  return {
    id: batch.id,
    code: batch.code,
    name: batch.name,
    status: batch.status,
    branchId: batch.branchId,
    branchName: batch.branchName,
    courseId: batch.courseId,
    courseName: batch.courseName,
    academicYearId: batch.academicYearId,
    academicYearName: batch.academicYearName,
    deliveryTypeName: batch.deliveryType?.name ?? '',
    attendanceMode: batch.deliveryType?.attendanceMode ?? 'CLASSROOM',
    maxStudents: batch.maxStudents,
    enrolledCount: batch.enrolledCount,
    startDate: batch.startDate,
    endDate: batch.endDate,
    allowNewAdmissions: batch.allowNewAdmissions,
  };
}

export const batchMockService = {
  async getBatches(filters: BatchFilters = {}): Promise<PaginatedResponse<BatchListItem>> {
    await delay(300);
    const filtered = applyFilters(batchesDb, filters);
    const page = filters.page || 1;
    const perPage = filters.perPage || 10;
    const paginated = paginate(filtered, page, perPage);
    return {
      data: paginated.data.map(toListItem),
      meta: paginated.meta,
    };
  },

  async getBatchById(id: string): Promise<Batch | null> {
    await delay(200);
    const batch = batchesDb.find((b) => b.id === id) || null;
    if (batch) {
      batch.deliveryType = deliveryTypes.find((dt) => dt.id === batch.deliveryTypeId);
    }
    return batch;
  },

  async getBatchStats(): Promise<BatchStats> {
    await delay(150);
    const total = batchesDb.length;
    const planned = batchesDb.filter((b) => b.status === 'PLANNED').length;
    const active = batchesDb.filter((b) => b.status === 'ACTIVE').length;
    const completed = batchesDb.filter((b) => b.status === 'COMPLETED').length;
    const cancelled = batchesDb.filter((b) => b.status === 'CANCELLED').length;
    const archived = batchesDb.filter((b) => b.status === 'ARCHIVED').length;
    const totalCapacity = batchesDb.reduce((sum, b) => sum + b.maxStudents, 0);
    const totalEnrolled = batchesDb.reduce((sum, b) => sum + b.enrolledCount, 0);

    return {
      total,
      planned,
      active,
      completed,
      cancelled,
      archived,
      totalCapacity,
      totalEnrolled,
      utilizationRate: totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0,
    };
  },

  async createBatch(input: CreateBatchInput): Promise<Batch> {
    await delay(500);
    const course = courses.find((c) => c.id === input.courseId) ?? courses[0];
    const branch = branches.find((b) => b.id === input.branchId) ?? branches[0];
    const year = academicYears.find((y) => y.id === input.academicYearId) ?? academicYears[0];
    const dt = deliveryTypes.find((d) => d.id === input.deliveryTypeId) ?? deliveryTypes[0];
    const newId = `batch-${String(batchesDb.length + 1).padStart(3, '0')}`;

    const batch: Batch = {
      id: newId,
      code: input.code,
      name: input.name,
      description: input.description,
      branchId: input.branchId,
      branchName: branch.name,
      courseId: input.courseId,
      courseName: course.name,
      academicYearId: input.academicYearId,
      academicYearName: year.name,
      deliveryTypeId: input.deliveryTypeId,
      deliveryType: dt,
      status: 'PLANNED',
      maxStudents: input.maxStudents,
      enrolledCount: 0,
      startDate: input.startDate,
      endDate: input.endDate,
      allowNewAdmissions: input.allowNewAdmissions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    batchesDb.unshift(batch);
    mockTimelineEvents[batch.id] = [
      {
        id: `evt-${batch.id}-create`,
        batchId: batch.id,
        type: 'CREATED',
        title: 'Batch Created',
        createdBy: 'Current User',
        createdAt: new Date().toISOString(),
      },
    ];
    mockStudentEnrollments[batch.id] = [];
    mockStaffAssignments[batch.id] = [];
    return batch;
  },

  async updateBatch(input: UpdateBatchInput): Promise<Batch | null> {
    await delay(400);
    const index = batchesDb.findIndex((b) => b.id === input.id);
    if (index === -1) return null;

    const { id: _id, ...rest } = input;
    const updates: Record<string, unknown> = { ...rest };

    if (rest.status && rest.status !== batchesDb[index].status) {
      const allowed = VALID_TRANSITIONS[batchesDb[index].status];
      if (!allowed || !allowed.includes(rest.status as BatchStatus)) {
        return null;
      }
    }

    if (rest.status && rest.status !== batchesDb[index].status) {
      mockTimelineEvents[batchesDb[index].id]?.unshift({
        id: `evt-${Date.now()}`,
        batchId: batchesDb[index].id,
        type: 'STATUS_CHANGED',
        title: `Status changed to ${rest.status}`,
        fromStatus: batchesDb[index].status,
        toStatus: rest.status,
        createdBy: 'Current User',
        createdAt: new Date().toISOString(),
      });
    }

    if (rest.courseId) {
      const course = courses.find((c) => c.id === rest.courseId);
      if (course) updates.courseName = course.name;
    }
    if (rest.branchId) {
      const branch = branches.find((b) => b.id === rest.branchId);
      if (branch) updates.branchName = branch.name;
    }
    if (rest.academicYearId) {
      const year = academicYears.find((y) => y.id === rest.academicYearId);
      if (year) updates.academicYearName = year.name;
    }

    batchesDb[index] = {
      ...batchesDb[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return batchesDb[index];
  },

  async archiveBatch(id: string): Promise<boolean> {
    await delay(300);
    const index = batchesDb.findIndex((b) => b.id === id);
    if (index === -1) return false;

    const previousStatus = batchesDb[index].status;
    batchesDb[index].status = 'ARCHIVED';
    batchesDb[index].allowNewAdmissions = false;
    batchesDb[index].updatedAt = new Date().toISOString();

    mockTimelineEvents[id]?.unshift({
      id: `evt-${Date.now()}`,
      batchId: id,
      type: 'STATUS_CHANGED',
      title: 'Batch Archived',
      fromStatus: previousStatus,
      toStatus: 'ARCHIVED',
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
    });

    return true;
  },

  async getTimelineEvents(batchId: string): Promise<BatchTimelineEvent[]> {
    await delay(200);
    return mockTimelineEvents[batchId] || [];
  },

  async getBatchStudents(batchId: string): Promise<BatchStudentEnrollment[]> {
    await delay(200);
    return mockStudentEnrollments[batchId] || [];
  },

  async getBatchStaffAssignments(batchId: string): Promise<BatchStaffAssignment[]> {
    await delay(200);
    return mockStaffAssignments[batchId] || [];
  },

  async getDeliveryTypes(): Promise<BatchDeliveryType[]> {
    await delay(100);
    return deliveryTypes;
  },

  async getCourses(): Promise<{ id: string; name: string }[]> {
    await delay(100);
    return courses;
  },

  async getBranches(): Promise<{ id: string; name: string }[]> {
    await delay(100);
    return branches;
  },

  async getAcademicYears(): Promise<{ id: string; name: string }[]> {
    await delay(100);
    return academicYears;
  },
};
