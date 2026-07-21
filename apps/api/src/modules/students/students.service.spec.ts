/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { SortOrder } from '../../common/dto/query-params.dto';
import { StudentsService } from './students.service';

describe('StudentsService', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';

  const mockUser = { id: 'student-1' };

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
      status: 'ACTIVE',
    },
  };

  let prismaService: any;
  let tenantScoped: any;
  let admissionNumberGenerator: any;
  let service: StudentsService;

  const defaultDto = {
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    studentCode: 'STU-2026-0001',
    dateOfBirth: '2005-06-15T00:00:00.000Z',
    gender: 'MALE' as const,
    bloodGroup: 'O_POS' as const,
    academicStatus: 'ACTIVE' as const,
  };

  beforeEach(() => {
    prismaService = {
      users: {
        create: jest.fn().mockResolvedValue(mockUser),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      studentProfiles: {
        create: jest.fn().mockResolvedValue(studentProfile),
        findFirst: jest.fn().mockResolvedValue(null),
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

    admissionNumberGenerator = {
      generate: jest.fn().mockResolvedValue('ADM-2026-0001'),
    };

    service = new StudentsService(
      prismaService,
      tenantScoped,
      admissionNumberGenerator,
    );
  });

  describe('create', () => {
    it('creates a user and student profile', async () => {
      const result = await service.create(defaultDto, tenantId, userId);

      expect(prismaService.users.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'john@example.com', tenantId, deletedAt: null },
        }),
      );
      expect(prismaService.studentProfiles.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { studentCode: 'STU-2026-0001', tenantId, deletedAt: null },
        }),
      );
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

    it('throws ConflictException on duplicate email', async () => {
      prismaService.users.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create(defaultDto, tenantId, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException on duplicate studentCode', async () => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(studentProfile);

      await expect(
        service.create(defaultDto, tenantId, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException for underage student', async () => {
      const dto = { ...defaultDto, dateOfBirth: '2015-06-15T00:00:00.000Z' };

      await expect(service.create(dto, tenantId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for overage student', async () => {
      const dto = { ...defaultDto, dateOfBirth: '1990-06-15T00:00:00.000Z' };

      await expect(service.create(dto, tenantId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rolls back transaction on failure', async () => {
      prismaService.studentProfiles.create.mockRejectedValue(
        new Error('DB fail'),
      );

      await expect(
        service.create(defaultDto, tenantId, userId),
      ).rejects.toThrow('DB fail');

      expect(prismaService.$transaction).toHaveBeenCalled();
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
    beforeEach(() => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(studentProfile);
    });

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
    beforeEach(() => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(studentProfile);
    });

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

    it('throws ConflictException on duplicate studentCode', async () => {
      prismaService.studentProfiles.findFirst
        .mockResolvedValueOnce(studentProfile)
        .mockResolvedValueOnce({ userId: 'other-student' });

      await expect(
        service.update(
          'student-1',
          { studentCode: 'STU-2026-0002' },
          tenantId,
          userId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException for invalid academic status transition', async () => {
      await expect(
        service.update(
          'student-1',
          { academicStatus: 'ENQUIRY' as any },
          tenantId,
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for underage update', async () => {
      await expect(
        service.update(
          'student-1',
          { dateOfBirth: '2015-06-15T00:00:00.000Z' },
          tenantId,
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(studentProfile);
    });

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
    beforeEach(() => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(studentProfile);
    });

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
