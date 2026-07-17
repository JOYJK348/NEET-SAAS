import {
  Student,
  StudentListItem,
  StudentStats,
  StudentFilters,
  StudentStatus,
  CreateStudentInput,
  TimelineEvent,
} from '@/features/students/types/student';
import type { PaginatedResponse } from '@/types/api';

// Mock student data
const mockStudents: Student[] = [
  {
    id: '1',
    studentId: 'STU-2024-001',
    firstName: 'Arjun',
    lastName: 'Sharma',
    email: 'arjun.sharma@email.com',
    phone: '+91-9876543210',
    dateOfBirth: '2006-03-15',
    gender: 'MALE',
    status: 'ACTIVE',
    batchId: 'BATCH-001',
    batchName: 'NEET 2025 - Batch A',
    courseId: 'COURSE-001',
    courseName: 'NEET Premium',
    parentName: 'Rajesh Sharma',
    parentPhone: '+91-9876543211',
    parentEmail: 'rajesh.sharma@email.com',
    address: '123 MG Road',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    admissionDate: '2024-01-15',
    profileImage: undefined,
    emergencyContact: '+91-9876543212',
    bloodGroup: 'O+',
    aadharNumber: '1234-5678-9012',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    studentId: 'STU-2024-002',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@email.com',
    phone: '+91-9876543213',
    dateOfBirth: '2006-07-22',
    gender: 'FEMALE',
    status: 'ACTIVE',
    batchId: 'BATCH-001',
    batchName: 'NEET 2025 - Batch A',
    courseId: 'COURSE-001',
    courseName: 'NEET Premium',
    parentName: 'Amit Patel',
    parentPhone: '+91-9876543214',
    parentEmail: 'amit.patel@email.com',
    address: '456 Park Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    admissionDate: '2024-01-20',
    profileImage: undefined,
    emergencyContact: '+91-9876543215',
    bloodGroup: 'A+',
    aadharNumber: '2345-6789-0123',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: '3',
    studentId: 'STU-2024-003',
    firstName: 'Rahul',
    lastName: 'Kumar',
    email: 'rahul.kumar@email.com',
    phone: '+91-9876543216',
    dateOfBirth: '2005-11-08',
    gender: 'MALE',
    status: 'PENDING',
    batchId: 'BATCH-002',
    batchName: 'NEET 2025 - Batch B',
    courseId: 'COURSE-002',
    courseName: 'NEET Foundation',
    parentName: 'Suresh Kumar',
    parentPhone: '+91-9876543217',
    parentEmail: 'suresh.kumar@email.com',
    address: '789 Lake View',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    admissionDate: '2024-02-01',
    profileImage: undefined,
    emergencyContact: '+91-9876543218',
    bloodGroup: 'B+',
    aadharNumber: '3456-7890-1234',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z',
  },
  {
    id: '4',
    studentId: 'STU-2024-004',
    firstName: 'Sneha',
    lastName: 'Reddy',
    email: 'sneha.reddy@email.com',
    phone: '+91-9876543219',
    dateOfBirth: '2006-05-30',
    gender: 'FEMALE',
    status: 'ACTIVE',
    batchId: 'BATCH-002',
    batchName: 'NEET 2025 - Batch B',
    courseId: 'COURSE-001',
    courseName: 'NEET Premium',
    parentName: 'Venkat Reddy',
    parentPhone: '+91-9876543220',
    parentEmail: 'venkat.reddy@email.com',
    address: '321 Hill Road',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',
    admissionDate: '2024-01-25',
    profileImage: undefined,
    emergencyContact: '+91-9876543221',
    bloodGroup: 'AB+',
    aadharNumber: '4567-8901-2345',
    createdAt: '2024-01-25T10:00:00Z',
    updatedAt: '2024-01-25T10:00:00Z',
  },
  {
    id: '5',
    studentId: 'STU-2024-005',
    firstName: 'Vikram',
    lastName: 'Singh',
    email: 'vikram.singh@email.com',
    phone: '+91-9876543222',
    dateOfBirth: '2005-09-12',
    gender: 'MALE',
    status: 'SUSPENDED',
    batchId: 'BATCH-003',
    batchName: 'NEET 2025 - Batch C',
    courseId: 'COURSE-002',
    courseName: 'NEET Foundation',
    parentName: 'Harpreet Singh',
    parentPhone: '+91-9876543223',
    parentEmail: 'harpreet.singh@email.com',
    address: '555 Green Avenue',
    city: 'Chandigarh',
    state: 'Punjab',
    pincode: '160001',
    admissionDate: '2024-02-10',
    profileImage: undefined,
    emergencyContact: '+91-9876543224',
    bloodGroup: 'O-',
    aadharNumber: '5678-9012-3456',
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-02-10T10:00:00Z',
  },
  {
    id: '6',
    studentId: 'STU-2024-006',
    firstName: 'Anjali',
    lastName: 'Gupta',
    email: 'anjali.gupta@email.com',
    phone: '+91-9876543225',
    dateOfBirth: '2006-01-18',
    gender: 'FEMALE',
    status: 'ACTIVE',
    batchId: 'BATCH-001',
    batchName: 'NEET 2025 - Batch A',
    courseId: 'COURSE-001',
    courseName: 'NEET Premium',
    parentName: 'Rakesh Gupta',
    parentPhone: '+91-9876543226',
    parentEmail: 'rakesh.gupta@email.com',
    address: '777 Rose Garden',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    admissionDate: '2024-01-18',
    profileImage: undefined,
    emergencyContact: '+91-9876543227',
    bloodGroup: 'A-',
    aadharNumber: '6789-0123-4567',
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-18T10:00:00Z',
  },
  {
    id: '7',
    studentId: 'STU-2024-007',
    firstName: 'Karthik',
    lastName: 'Nair',
    email: 'karthik.nair@email.com',
    phone: '+91-9876543228',
    dateOfBirth: '2006-04-25',
    gender: 'MALE',
    status: 'INACTIVE',
    batchId: 'BATCH-003',
    batchName: 'NEET 2025 - Batch C',
    courseId: 'COURSE-001',
    courseName: 'NEET Premium',
    parentName: 'Ravi Nair',
    parentPhone: '+91-9876543229',
    parentEmail: 'ravi.nair@email.com',
    address: '888 Beach Road',
    city: 'Kochi',
    state: 'Kerala',
    pincode: '682001',
    admissionDate: '2024-02-15',
    profileImage: undefined,
    emergencyContact: '+91-9876543230',
    bloodGroup: 'B-',
    aadharNumber: '7890-1234-5678',
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
  },
  {
    id: '8',
    studentId: 'STU-2024-008',
    firstName: 'Meera',
    lastName: 'Iyer',
    email: 'meera.iyer@email.com',
    phone: '+91-9876543231',
    dateOfBirth: '2005-12-03',
    gender: 'FEMALE',
    status: 'GRADUATED',
    batchId: 'BATCH-004',
    batchName: 'NEET 2024 - Batch A',
    courseId: 'COURSE-001',
    courseName: 'NEET Premium',
    parentName: 'Sundar Iyer',
    parentPhone: '+91-9876543232',
    parentEmail: 'sundar.iyer@email.com',
    address: '999 Temple Street',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600001',
    admissionDate: '2023-01-10',
    profileImage: undefined,
    emergencyContact: '+91-9876543233',
    bloodGroup: 'AB-',
    aadharNumber: '8901-2345-6789',
    createdAt: '2023-01-10T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
  },
  {
    id: '9',
    studentId: 'STU-2024-009',
    firstName: 'Aditya',
    lastName: 'Verma',
    email: 'aditya.verma@email.com',
    phone: '+91-9876543234',
    dateOfBirth: '2006-08-14',
    gender: 'MALE',
    status: 'ACTIVE',
    batchId: 'BATCH-002',
    batchName: 'NEET 2025 - Batch B',
    courseId: 'COURSE-002',
    courseName: 'NEET Foundation',
    parentName: 'Manoj Verma',
    parentPhone: '+91-9876543235',
    parentEmail: 'manoj.verma@email.com',
    address: '111 Market Lane',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226001',
    admissionDate: '2024-02-20',
    profileImage: undefined,
    emergencyContact: '+91-9876543236',
    bloodGroup: 'O+',
    aadharNumber: '9012-3456-7890',
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-02-20T10:00:00Z',
  },
  {
    id: '10',
    studentId: 'STU-2024-010',
    firstName: 'Kavya',
    lastName: 'Nair',
    email: 'kavya.nair@email.com',
    phone: '+91-9876543237',
    dateOfBirth: '2006-02-28',
    gender: 'FEMALE',
    status: 'DROPPED_OUT',
    batchId: 'BATCH-003',
    batchName: 'NEET 2025 - Batch C',
    courseId: 'COURSE-001',
    courseName: 'NEET Premium',
    parentName: 'Gopal Nair',
    parentPhone: '+91-9876543238',
    parentEmail: 'gopal.nair@email.com',
    address: '222 River View',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700001',
    admissionDate: '2024-02-25',
    profileImage: undefined,
    emergencyContact: '+91-9876543239',
    bloodGroup: 'A+',
    aadharNumber: '0123-4567-8901',
    createdAt: '2024-02-25T10:00:00Z',
    updatedAt: '2024-05-10T10:00:00Z',
  },
  {
    id: '11',
    studentId: 'STU-2024-011',
    firstName: 'Rohan',
    lastName: 'Das',
    email: 'rohan.das@email.com',
    phone: '+91-9876543240',
    dateOfBirth: '2005-10-17',
    gender: 'MALE',
    status: 'ACTIVE',
    batchId: 'BATCH-001',
    batchName: 'NEET 2025 - Batch A',
    courseId: 'COURSE-002',
    courseName: 'NEET Foundation',
    parentName: 'Subhash Das',
    parentPhone: '+91-9876543241',
    parentEmail: 'subhash.das@email.com',
    address: '333 Hill Top',
    city: 'Guwahati',
    state: 'Assam',
    pincode: '781001',
    admissionDate: '2024-01-22',
    profileImage: undefined,
    emergencyContact: '+91-9876543242',
    bloodGroup: 'B+',
    aadharNumber: '1234-5678-9013',
    createdAt: '2024-01-22T10:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z',
  },
  {
    id: '12',
    studentId: 'STU-2024-012',
    firstName: 'Ishita',
    lastName: 'Mehta',
    email: 'ishita.mehta@email.com',
    phone: '+91-9876543243',
    dateOfBirth: '2006-06-09',
    gender: 'FEMALE',
    status: 'PENDING',
    batchId: 'BATCH-004',
    batchName: 'NEET 2025 - Batch D',
    courseId: 'COURSE-001',
    courseName: 'NEET Premium',
    parentName: 'Vikram Mehta',
    parentPhone: '+91-9876543244',
    parentEmail: 'vikram.mehta@email.com',
    address: '444 Valley View',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    admissionDate: '2024-03-01',
    profileImage: undefined,
    emergencyContact: '+91-9876543245',
    bloodGroup: 'O-',
    aadharNumber: '2345-6789-0124',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
  },
  {
    id: '13',
    studentId: 'STU-2024-013',
    firstName: 'Aarav',
    lastName: 'Joshi',
    email: 'aarav.joshi@email.com',
    phone: '+91-9876543246',
    dateOfBirth: '2006-03-21',
    gender: 'MALE',
    status: 'ACTIVE',
    batchId: 'BATCH-002',
    batchName: 'NEET 2025 - Batch B',
    courseId: 'COURSE-001',
    courseName: 'NEET Premium',
    parentName: 'Rajesh Joshi',
    parentPhone: '+91-9876543247',
    parentEmail: 'rajesh.joshi@email.com',
    address: '555 Sunrise Ave',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380001',
    admissionDate: '2024-02-28',
    profileImage: undefined,
    emergencyContact: '+91-9876543248',
    bloodGroup: 'AB+',
    aadharNumber: '3456-7890-1235',
    createdAt: '2024-02-28T10:00:00Z',
    updatedAt: '2024-02-28T10:00:00Z',
  },
  {
    id: '14',
    studentId: 'STU-2024-014',
    firstName: 'Diya',
    lastName: 'Shah',
    email: 'diya.shah@email.com',
    phone: '+91-9876543249',
    dateOfBirth: '2005-08-11',
    gender: 'FEMALE',
    status: 'ACTIVE',
    batchId: 'BATCH-003',
    batchName: 'NEET 2025 - Batch C',
    courseId: 'COURSE-002',
    courseName: 'NEET Foundation',
    parentName: 'Hiren Shah',
    parentPhone: '+91-9876543250',
    parentEmail: 'hiren.shah@email.com',
    address: '666 Garden City',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395001',
    admissionDate: '2024-03-05',
    profileImage: undefined,
    emergencyContact: '+91-9876543251',
    bloodGroup: 'A-',
    aadharNumber: '4567-8901-2346',
    createdAt: '2024-03-05T10:00:00Z',
    updatedAt: '2024-03-05T10:00:00Z',
  },
  {
    id: '15',
    studentId: 'STU-2024-015',
    firstName: 'Yash',
    lastName: 'Agarwal',
    email: 'yash.agarwal@email.com',
    phone: '+91-9876543252',
    dateOfBirth: '2006-11-02',
    gender: 'MALE',
    status: 'ACTIVE',
    batchId: 'BATCH-004',
    batchName: 'NEET 2025 - Batch D',
    courseId: 'COURSE-001',
    courseName: 'NEET Premium',
    parentName: 'Anil Agarwal',
    parentPhone: '+91-9876543253',
    parentEmail: 'anil.agarwal@email.com',
    address: '777 Tech Park',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    admissionDate: '2024-03-10',
    profileImage: undefined,
    emergencyContact: '+91-9876543254',
    bloodGroup: 'B-',
    aadharNumber: '5678-9012-3457',
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
];

// Convert to list items
export const mockStudentListItems: StudentListItem[] = mockStudents.map((student) => ({
  id: student.id,
  studentId: student.studentId,
  fullName: `${student.firstName} ${student.lastName}`,
  email: student.email,
  phone: student.phone,
  batchName: student.batchName,
  courseName: student.courseName,
  status: student.status,
  admissionDate: student.admissionDate,
  profileImage: student.profileImage,
}));

// Mock stats
export const mockStudentStats: StudentStats = {
  total: mockStudents.length,
  active: mockStudents.filter((s) => s.status === 'ACTIVE').length,
  inactive: mockStudents.filter((s) => s.status === 'INACTIVE').length,
  pending: mockStudents.filter((s) => s.status === 'PENDING').length,
  suspended: mockStudents.filter((s) => s.status === 'SUSPENDED').length,
  graduated: mockStudents.filter((s) => s.status === 'GRADUATED').length,
  droppedOut: mockStudents.filter((s) => s.status === 'DROPPED_OUT').length,
};

// Mock batches for filter dropdown
export const mockBatches = [
  { id: 'BATCH-001', name: 'NEET 2025 - Batch A' },
  { id: 'BATCH-002', name: 'NEET 2025 - Batch B' },
  { id: 'BATCH-003', name: 'NEET 2025 - Batch C' },
  { id: 'BATCH-004', name: 'NEET 2025 - Batch D' },
];

// Mock courses for filter dropdown
export const mockCourses = [
  { id: 'COURSE-001', name: 'NEET Premium' },
  { id: 'COURSE-002', name: 'NEET Foundation' },
];

// Mock timeline events per student
const mockTimelineEvents: Record<string, TimelineEvent[]> = {
  '1': [
    {
      id: 'EVT-001',
      studentId: '1',
      type: 'CREATED',
      title: 'Student Record Created',
      description: 'Student enrolled in NEET Premium course, Batch A',
      createdAt: '2024-01-15T10:00:00Z',
      createdBy: 'Admin',
    },
    {
      id: 'EVT-002',
      studentId: '1',
      type: 'STATUS_CHANGED',
      title: 'Status Changed to Active',
      description: 'Admission confirmed and fees verified',
      createdAt: '2024-01-16T09:00:00Z',
      createdBy: 'Admin',
    },
    {
      id: 'EVT-003',
      studentId: '1',
      type: 'PROFILE_UPDATED',
      title: 'Profile Updated',
      description: 'Emergency contact details added',
      createdAt: '2024-02-01T14:30:00Z',
      createdBy: 'Staff',
    },
  ],
  '2': [
    {
      id: 'EVT-004',
      studentId: '2',
      type: 'CREATED',
      title: 'Student Record Created',
      description: 'Student enrolled in NEET Foundation course, Batch B',
      createdAt: '2024-01-20T10:00:00Z',
      createdBy: 'Admin',
    },
    {
      id: 'EVT-005',
      studentId: '2',
      type: 'BATCH_CHANGED',
      title: 'Batch Changed',
      description: 'Moved from Batch B to Batch A',
      createdAt: '2024-02-15T11:00:00Z',
      createdBy: 'Admin',
    },
  ],
  '3': [
    {
      id: 'EVT-006',
      studentId: '3',
      type: 'CREATED',
      title: 'Student Record Created',
      createdAt: '2024-02-01T10:00:00Z',
      createdBy: 'Admin',
    },
  ],
};

// Mock service functions
const studentsDb = [...mockStudents];

function applyFilters(students: Student[], filters: StudentFilters): Student[] {
  let filtered = [...students];

  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.firstName.toLowerCase().includes(search) ||
        s.lastName.toLowerCase().includes(search) ||
        s.studentId.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search) ||
        s.phone.includes(search) ||
        s.batchName.toLowerCase().includes(search) ||
        s.courseName.toLowerCase().includes(search),
    );
  }

  if (filters.status && filters.status !== 'ALL') {
    filtered = filtered.filter((s) => s.status === filters.status);
  }

  if (filters.batchId) {
    filtered = filtered.filter((s) => s.batchId === filters.batchId);
  }

  if (filters.courseId) {
    filtered = filtered.filter((s) => s.courseId === filters.courseId);
  }

  if (filters.gender) {
    filtered = filtered.filter((s) => s.gender === filters.gender);
  }

  if (filters.dateFrom) {
    filtered = filtered.filter((s) => s.admissionDate >= filters.dateFrom!);
  }

  if (filters.dateTo) {
    filtered = filtered.filter((s) => s.admissionDate <= filters.dateTo!);
  }

  // Sorting
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[filters.sortBy as keyof Student];
      const bVal = b[filters.sortBy as keyof Student];
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

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const studentMockService = {
  async getStudents(filters: StudentFilters = {}): Promise<PaginatedResponse<StudentListItem>> {
    await delay(300); // Simulate network delay

    const filtered = applyFilters(studentsDb, filters);
    const page = filters.page || 1;
    const perPage = filters.perPage || 10;

    const paginated = paginate(filtered, page, perPage);

    return {
      data: paginated.data.map((s) => ({
        id: s.id,
        studentId: s.studentId,
        fullName: `${s.firstName} ${s.lastName}`,
        email: s.email,
        phone: s.phone,
        batchName: s.batchName,
        courseName: s.courseName,
        status: s.status,
        admissionDate: s.admissionDate,
        profileImage: s.profileImage,
      })),
      meta: paginated.meta,
    };
  },

  async getStudentById(id: string): Promise<Student | null> {
    await delay(200);
    return studentsDb.find((s) => s.id === id) || null;
  },

  async getStudentStats(): Promise<StudentStats> {
    await delay(150);
    return {
      total: studentsDb.length,
      active: studentsDb.filter((s) => s.status === 'ACTIVE').length,
      inactive: studentsDb.filter((s) => s.status === 'INACTIVE').length,
      pending: studentsDb.filter((s) => s.status === 'PENDING').length,
      suspended: studentsDb.filter((s) => s.status === 'SUSPENDED').length,
      graduated: studentsDb.filter((s) => s.status === 'GRADUATED').length,
      droppedOut: studentsDb.filter((s) => s.status === 'DROPPED_OUT').length,
    };
  },

  async createStudent(input: CreateStudentInput): Promise<Student> {
    await delay(500);
    const newStudent: Student = {
      ...input,
      id: String(studentsDb.length + 1),
      studentId: `STU-2024-${String(studentsDb.length + 1).padStart(3, '0')}`,
      status: 'PENDING',
      batchName: mockBatches.find((b) => b.id === input.batchId)?.name || '',
      courseName: mockCourses.find((c) => c.id === input.courseId)?.name || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    studentsDb.unshift(newStudent);
    return newStudent;
  },

  async updateStudent(
    input: { id: string } & Partial<CreateStudentInput> & { status?: StudentStatus },
  ): Promise<Student | null> {
    await delay(400);
    const index = studentsDb.findIndex((s) => s.id === input.id);
    if (index === -1) return null;

    studentsDb[index] = {
      ...studentsDb[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    return studentsDb[index];
  },

  async deleteStudent(id: string): Promise<boolean> {
    await delay(300);
    const index = studentsDb.findIndex((s) => s.id === id);
    if (index === -1) return false;
    studentsDb.splice(index, 1);
    return true;
  },

  async bulkUpdateStatus(
    ids: string[],
    status: StudentStatus,
  ): Promise<{ success: number; failed: number }> {
    await delay(400);
    let success = 0;
    let failed = 0;
    for (const id of ids) {
      const index = studentsDb.findIndex((s) => s.id === id);
      if (index !== -1) {
        studentsDb[index].status = status;
        studentsDb[index].updatedAt = new Date().toISOString();
        success++;
      } else {
        failed++;
      }
    }
    return { success, failed };
  },

  async archiveStudent(id: string): Promise<boolean> {
    await delay(300);
    const index = studentsDb.findIndex((s) => s.id === id);
    if (index === -1) return false;
    studentsDb[index].status = 'DROPPED_OUT';
    studentsDb[index].updatedAt = new Date().toISOString();
    const event: TimelineEvent = {
      id: `EVT-${Date.now()}`,
      studentId: id,
      type: 'ARCHIVED',
      title: 'Student Archived',
      description: 'Student status changed to Dropped Out',
      createdAt: new Date().toISOString(),
      createdBy: 'Admin',
    };
    if (mockTimelineEvents[id]) {
      mockTimelineEvents[id].unshift(event);
    } else {
      mockTimelineEvents[id] = [event];
    }
    return true;
  },

  async getTimelineEvents(studentId: string): Promise<TimelineEvent[]> {
    await delay(200);
    return mockTimelineEvents[studentId] || [];
  },

  getBatches() {
    return mockBatches;
  },

  getCourses() {
    return mockCourses;
  },
};

// Export raw data for direct access if needed
export { mockStudents };
