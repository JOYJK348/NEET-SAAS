/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { NotFoundException } from '@nestjs/common';
import { SortOrder } from '../../common/dto/query-params.dto';
import { StudentsService } from './students.service';

describe('StudentsService', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';
  const studentProfile = {
    userId: 'student-1',
    tenantId,
    studentCode: 'STU-2026-0001',
    admittedAt: new Date(),
    dateOfBirth: new Date('2005-06-15'),
    gender: 'MALE',
    bloodGroup: 'O_POS',
    academicStatus: 'ACTIVE',
    createdAt: new Date(),
    createdBy: userId,
    updatedAt: new Date(),
    updatedBy: userId,
    deletedAt: null,
    deletedBy: null,
    version: 1,
    profileVersion: 1,
    lastProfileUpdatedAt: new Date(),
    profileCompletionPercentage: 0,
    userIdusers: {
      id: 'student-1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      status: 'ACTIVE',
    },
  };

  let prismaService: any;
  let tenantScoped: any;
  let service: StudentsService;

  beforeEach(() => {
    prismaService = {
      users: {
        create: jest.fn().mockResolvedValue({ id: 'student-1' }),
        update: jest.fn().mockResolvedValue({}),
      },
      studentProfiles: {
        create: jest.fn().mockResolvedValue(studentProfile),
        findFirst: jest.fn().mockResolvedValue(studentProfile),
        findMany: jest.fn().mockResolvedValue([studentProfile]),
        count: jest.fn().mockResolvedValue(1),
        update: jest.fn().mockResolvedValue(studentProfile),
      },
      $transaction: jest.fn((cb: any) => cb(prismaService)),
    };

    tenantScoped = {
      buildWhere: jest
        .fn()
        .mockImplementation((tid: string, extra?: Record<string, unknown>) => ({
          tenantId: tid,
          deletedAt: null,
          ...extra,
        })),
    };

    service = new StudentsService(prismaService, tenantScoped);
  });

  describe('create', () => {
    it('creates a user and student profile', async () => {
      const dto = {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        studentCode: 'STU-2026-0001',
        dateOfBirth: '2005-06-15T00:00:00.000Z',
        gender: 'MALE' as const,
        bloodGroup: 'O_POS' as const,
        academicStatus: 'ACTIVE' as const,
        phone: '+1234567890',
      };

      const result = await service.create(dto, tenantId, userId);

      expect(prismaService.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'john@example.com',
          userType: 'STUDENT',
          status: 'ACTIVE',
          tenantId,
        }),
      });
      expect(prismaService.studentProfiles.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'student-1',
          studentCode: 'STU-2026-0001',
          tenantId,
        }),
        include: { userIdusers: true },
      });
      expect(result.id).toBe('student-1');
      expect(result.email).toBe('john@example.com');
    });
  });

  describe('findAll', () => {
    it('returns paginated results', async () => {
      prismaService.studentProfiles.count.mockResolvedValue(1);

      const result = await service.findAll(tenantId, {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: SortOrder.DESC,
      });

      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('student-1');
    });
  });

  describe('findOne', () => {
    it('returns a student by id', async () => {
      const result = await service.findOne('student-1', tenantId);

      expect(result.id).toBe('student-1');
      expect(result.email).toBe('john@example.com');
    });

    it('throws NotFoundException when not found', async () => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates student fields', async () => {
      const dto = { firstName: 'Jane' };

      const result = await service.update('student-1', dto, tenantId, userId);

      expect(prismaService.users.update).toHaveBeenCalled();
      expect(prismaService.studentProfiles.update).toHaveBeenCalled();
      expect(result.id).toBe('student-1');
    });

    it('throws NotFoundException when not found', async () => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', {}, tenantId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes a student', async () => {
      await service.remove('student-1', tenantId, userId);

      expect(prismaService.studentProfiles.update).toHaveBeenCalledWith({
        where: { userId: 'student-1' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          deletedBy: userId,
        }),
      });
    });

    it('throws NotFoundException when not found', async () => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent', tenantId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('returns student by studentCode', async () => {
      const result = await service.findByCode('STU-2026-0001', tenantId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('student-1');
    });

    it('returns null when not found', async () => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(null);

      const result = await service.findByCode('NONEXISTENT', tenantId);

      expect(result).toBeNull();
    });
  });
});
