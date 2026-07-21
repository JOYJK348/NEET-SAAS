import type {
  Admission,
  AdmissionListItem,
  AdmissionStats,
  AdmissionFilters,
  CreateAdmissionInput,
  UpdateAdmissionStatusInput,
  TimelineEvent,
  AdmissionStatus,
  AdmissionStudent,
  AdmissionCourse,
  AdmissionBranch,
  AdmissionBatch,
  AdmissionParent,
} from '@/features/admissions/types/admission';
import type { PaginatedResponse } from '@/types/api';

const mockStudents: AdmissionStudent[] = [
  {
    id: 's1',
    firstName: 'Arjun',
    lastName: 'Sharma',
    email: 'arjun.sharma@example.com',
    phone: '9876543210',
    dateOfBirth: '2006-05-15',
    gender: 'MALE',
  },
  {
    id: 's2',
    firstName: 'Priya',
    lastName: 'Verma',
    email: 'priya.verma@example.com',
    phone: '9876543211',
    dateOfBirth: '2007-02-20',
    gender: 'FEMALE',
  },
  {
    id: 's3',
    firstName: 'Rahul',
    lastName: 'Singh',
    email: 'rahul.singh@example.com',
    phone: '9876543212',
    dateOfBirth: '2006-08-10',
    gender: 'MALE',
  },
  {
    id: 's4',
    firstName: 'Sneha',
    lastName: 'Patel',
    email: 'sneha.patel@example.com',
    phone: '9876543213',
    dateOfBirth: '2007-11-05',
    gender: 'FEMALE',
  },
  {
    id: 's5',
    firstName: 'Vikram',
    lastName: 'Reddy',
    email: 'vikram.reddy@example.com',
    phone: '9876543214',
    dateOfBirth: '2006-03-25',
    gender: 'MALE',
  },
  {
    id: 's6',
    firstName: 'Ananya',
    lastName: 'Gupta',
    email: 'ananya.gupta@example.com',
    phone: '9876543215',
    dateOfBirth: '2007-07-18',
    gender: 'FEMALE',
  },
  {
    id: 's7',
    firstName: 'Rohit',
    lastName: 'Kumar',
    email: 'rohit.kumar@example.com',
    phone: '9876543216',
    dateOfBirth: '2006-12-01',
    gender: 'MALE',
  },
  {
    id: 's8',
    firstName: 'Kavya',
    lastName: 'Nair',
    email: 'kavya.nair@example.com',
    phone: '9876543217',
    dateOfBirth: '2007-04-14',
    gender: 'FEMALE',
  },
  {
    id: 's9',
    firstName: 'Amit',
    lastName: 'Joshi',
    email: 'amit.joshi@example.com',
    phone: '9876543218',
    dateOfBirth: '2006-09-30',
    gender: 'MALE',
  },
  {
    id: 's10',
    firstName: 'Divya',
    lastName: 'Menon',
    email: 'divya.menon@example.com',
    phone: '9876543219',
    dateOfBirth: '2007-01-22',
    gender: 'FEMALE',
  },
  {
    id: 's11',
    firstName: 'Karthik',
    lastName: 'Iyer',
    email: 'karthik.iyer@example.com',
    phone: '9876543220',
    dateOfBirth: '2006-06-08',
    gender: 'MALE',
  },
  {
    id: 's12',
    firstName: 'Meera',
    lastName: 'Chopra',
    email: 'meera.chopra@example.com',
    phone: '9876543221',
    dateOfBirth: '2007-10-12',
    gender: 'FEMALE',
  },
  {
    id: 's13',
    firstName: 'Siddharth',
    lastName: 'Das',
    email: 'siddharth.das@example.com',
    phone: '9876543222',
    dateOfBirth: '2006-04-19',
    gender: 'MALE',
  },
];

const mockCourses: AdmissionCourse[] = [
  { id: 'c1', name: 'NEET Full Course', code: 'NEET-FC', duration: '12 months' },
  { id: 'c2', name: 'NEET Crash Course', code: 'NEET-CC', duration: '6 months' },
  { id: 'c3', name: 'JEE Main + Advanced', code: 'JEE-MA', duration: '12 months' },
  { id: 'c4', name: 'Foundation (Class 11)', code: 'FND-11', duration: '24 months' },
];

const mockBranches: AdmissionBranch[] = [
  { id: 'b1', name: 'Koramangala', code: 'KMG' },
  { id: 'b2', name: 'Indiranagar', code: 'IND' },
  { id: 'b3', name: 'Whitefield', code: 'WFD' },
  { id: 'b4', name: 'JP Nagar', code: 'JPN' },
];

const mockBatches: AdmissionBatch[] = [
  { id: 'bt1', name: 'NEET 2026 Batch A', courseName: 'NEET Full Course' },
  { id: 'bt2', name: 'NEET 2026 Batch B', courseName: 'NEET Full Course' },
  { id: 'bt3', name: 'NEET Crash Jan', courseName: 'NEET Crash Course' },
  { id: 'bt4', name: 'JEE 2026 Alpha', courseName: 'JEE Main + Advanced' },
  { id: 'bt5', name: 'Foundation XI A', courseName: 'Foundation (Class 11)' },
];

const mockParents: AdmissionParent[] = [
  { id: 'p1', name: 'Rajesh Sharma', phone: '9988776655', email: 'rajesh.sharma@example.com' },
  { id: 'p2', name: 'Sunita Verma', phone: '9988776654', email: 'sunita.verma@example.com' },
  { id: 'p3', name: 'Amar Singh', phone: '9988776653', email: 'amar.singh@example.com' },
  { id: 'p4', name: 'Neha Patel', phone: '9988776652', email: 'neha.patel@example.com' },
  { id: 'p5', name: 'Suresh Reddy', phone: '9988776651', email: 'suresh.reddy@example.com' },
  { id: 'p6', name: 'Deepak Gupta', phone: '9988776650', email: 'deepak.gupta@example.com' },
  { id: 'p7', name: 'Anita Kumar', phone: '9988776649', email: 'anita.kumar@example.com' },
  { id: 'p8', name: 'Manoj Nair', phone: '9988776648', email: 'manoj.nair@example.com' },
  { id: 'p9', name: 'Priya Joshi', phone: '9988776647', email: 'priya.joshi@example.com' },
  { id: 'p10', name: 'Ravi Menon', phone: '9988776646', email: 'ravi.menon@example.com' },
  { id: 'p11', name: 'Lakshmi Iyer', phone: '9988776645', email: 'lakshmi.iyer@example.com' },
  { id: 'p12', name: 'Vivek Chopra', phone: '9988776644', email: 'vivek.chopra@example.com' },
  { id: 'p13', name: 'Rina Das', phone: '9988776643', email: 'rina.das@example.com' },
];

const academicYears = [
  { id: 'ay1', name: '2025-2026' },
  { id: 'ay2', name: '2026-2027' },
];

function generateAdmissions(): Admission[] {
  const statuses: AdmissionStatus[] = ['ACTIVE', 'ACTIVE', 'INACTIVE', 'ACTIVE', 'INACTIVE'];

  return Array.from({ length: 25 }, (_, i) => {
    const studentIdx = i % mockStudents.length;
    const courseIdx = i % mockCourses.length;
    const branchIdx = i % mockBranches.length;
    const batchIdx = i % mockBatches.length;
    const status = statuses[i % statuses.length];
    const student = mockStudents[studentIdx];

    return {
      id: `adm-${String(i + 1).padStart(3, '0')}`,
      admissionNumber: `ADM-${String(2026001 + i)}`,
      studentProfileId: student.id,
      academicYearId: academicYears[i % 2].id,
      courseId: mockCourses[courseIdx].id,
      branchId: mockBranches[branchIdx].id,
      admissionStatus: status,
      admissionDate: new Date(2026, 0, 15 + i).toISOString(),
      student,
      course: mockCourses[courseIdx],
      branch: mockBranches[branchIdx],
      batch: mockBatches[batchIdx],
      parent: mockParents[studentIdx],
      timeline: [
        {
          id: 't-create',
          type: 'CREATED',
          title: 'Admission Created',
          createdBy: 'Admin User',
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date(2026, 0, 10 + i).toISOString(),
      updatedAt: new Date(2026, 0, 20 + i).toISOString(),
    };
  });
}

const mockAdmissions = generateAdmissions();

function applyFilters(items: Admission[], filters?: AdmissionFilters): Admission[] {
  if (!filters) return items;

  let filtered = [...items];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.admissionNumber.toLowerCase().includes(q) ||
        a.student.firstName.toLowerCase().includes(q) ||
        a.student.lastName.toLowerCase().includes(q) ||
        a.student.email.toLowerCase().includes(q),
    );
  }

  if (filters.status && filters.status !== 'ALL') {
    filtered = filtered.filter((a) => a.admissionStatus === filters.status);
  }

  if (filters.courseId) {
    filtered = filtered.filter((a) => a.courseId === filters.courseId);
  }

  if (filters.branchId) {
    filtered = filtered.filter((a) => a.branchId === filters.branchId);
  }

  if (filters.academicYearId) {
    filtered = filtered.filter((a) => a.academicYearId === filters.academicYearId);
  }

  if (filters.studentProfileId) {
    filtered = filtered.filter((a) => a.studentProfileId === filters.studentProfileId);
  }

  return filtered;
}

function paginate<T>(
  items: T[],
  page: number,
  perPage: number,
): { data: T[]; total: number; lastPage: number; from: number | null; to: number | null } {
  const total = items.length;
  const lastPage = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const data = items.slice(start, start + perPage);
  return {
    data,
    total,
    lastPage,
    from: data.length > 0 ? start + 1 : null,
    to: data.length > 0 ? start + data.length : null,
  };
}

function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toListItem(admission: Admission): AdmissionListItem {
  return {
    id: admission.id,
    admissionNumber: admission.admissionNumber,
    studentName: `${admission.student.firstName} ${admission.student.lastName}`,
    studentPhoto: admission.student.photo,
    courseId: admission.courseId,
    courseName: admission.course.name,
    branchId: admission.branchId,
    branchName: admission.branch.name,
    batchId: admission.batch?.id || null,
    batchName: admission.batch?.name,
    admissionStatus: admission.admissionStatus,
    admissionDate: admission.admissionDate,
  };
}

export const admissionMockService = {
  async getAdmissions(filters?: AdmissionFilters): Promise<PaginatedResponse<AdmissionListItem>> {
    await delay();
    const filtered = applyFilters(mockAdmissions, filters);
    const page = filters?.page || 1;
    const perPage = filters?.perPage || 10;
    const { data, total, lastPage, from, to } = paginate(filtered, page, perPage);
    return {
      data: data.map(toListItem),
      meta: {
        currentPage: page,
        perPage,
        total,
        lastPage,
        from,
        to,
      },
    };
  },

  async getAdmissionById(id: string): Promise<Admission | null> {
    await delay();
    return mockAdmissions.find((a) => a.id === id) ?? null;
  },

  async getAdmissionStats(): Promise<AdmissionStats> {
    await delay(200);
    const total = mockAdmissions.length;
    const active = mockAdmissions.filter((a) => a.admissionStatus === 'ACTIVE').length;
    const inactive = mockAdmissions.filter((a) => a.admissionStatus === 'INACTIVE').length;

    return { total, active, inactive, changeFromLastMonth: 12 };
  },

  async createAdmission(input: CreateAdmissionInput): Promise<Admission> {
    await delay(500);
    const student = mockStudents.find((s) => s.id === input.studentProfileId) ?? mockStudents[0];
    const course = mockCourses.find((c) => c.id === input.courseId) ?? mockCourses[0];
    const branch = mockBranches.find((b) => b.id === input.branchId) ?? mockBranches[0];
    const newId = `adm-${String(mockAdmissions.length + 1).padStart(3, '0')}`;
    const admissionNumber = `ADM-${2027001 + mockAdmissions.length}`;

    const admission: Admission = {
      id: newId,
      admissionNumber,
      studentProfileId: input.studentProfileId,
      academicYearId: input.academicYearId,
      courseId: input.courseId,
      branchId: input.branchId,
      admissionStatus: 'ACTIVE',
      admissionDate: input.admissionDate,
      student,
      course,
      branch,
      batch: mockBatches.find((b) => b.courseName === course.name),
      parent: mockParents.find((p) => mockStudents.indexOf(student) === mockParents.indexOf(p)),
      timeline: [
        {
          id: 't-new',
          type: 'CREATED',
          title: 'Admission Created',
          description: input.notes,
          createdBy: 'Current User',
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockAdmissions.unshift(admission);
    return admission;
  },

  async updateAdmissionStatus(input: UpdateAdmissionStatusInput): Promise<Admission | null> {
    await delay(400);
    const admission = mockAdmissions.find((a) => a.id === input.id);
    if (!admission) return null;

    admission.admissionStatus = input.status;
    admission.updatedAt = new Date().toISOString();

    admission.timeline?.push({
      id: `t-${Date.now()}`,
      type: 'STATUS_CHANGE',
      title: `Status changed to ${input.status}`,
      fromStatus: admission.admissionStatus,
      toStatus: input.status,
      description: input.notes,
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
    });

    return admission;
  },

  async updateAdmissionBatch(input: { id: string; batchId: string }): Promise<Admission | null> {
    await delay(300);
    const admission = mockAdmissions.find((a) => a.id === input.id);
    if (!admission) return null;

    const batch = mockBatches.find((b) => b.id === input.batchId);
    if (batch) {
      admission.batch = batch;
    }
    admission.updatedAt = new Date().toISOString();

    admission.timeline?.push({
      id: `t-${Date.now()}`,
      type: 'BATCH_CHANGE' as any,
      title: `Batch changed to ${batch?.name || input.batchId}`,
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
    });

    return admission;
  },

  async getTimelineEvents(admissionId: string): Promise<TimelineEvent[]> {
    await delay(200);
    const admission = mockAdmissions.find((a) => a.id === admissionId);
    return admission?.timeline ?? [];
  },

  async getStudents(): Promise<AdmissionStudent[]> {
    await delay(200);
    return mockStudents;
  },

  async getCourses(): Promise<AdmissionCourse[]> {
    await delay(200);
    return mockCourses;
  },

  async getBranches(): Promise<AdmissionBranch[]> {
    await delay(200);
    return mockBranches;
  },

  async getBatches(courseId?: string): Promise<AdmissionBatch[]> {
    await delay(200);
    if (courseId) {
      const course = mockCourses.find((c) => c.id === courseId);
      return mockBatches.filter((b) => b.courseName === course?.name);
    }
    return mockBatches;
  },

  async getAcademicYears(): Promise<{ id: string; name: string }[]> {
    await delay(100);
    return academicYears;
  },
};
