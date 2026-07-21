/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { BatchStatusType, AdmissionStatusEnum } from '@prisma/client';
import { BatchEnrollmentsService } from './batch-enrollments.service';

describe('BatchEnrollmentsService', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';
  const admissionId = 'admission-1';
  const batchId = 'batch-1';
  const enrollmentId = 'enrollment-1';
  const academicYearId = 'academic-year-1';
  const courseId = 'course-1';
  const branchId = 'branch-1';

  const mockAdmission = {
    id: admissionId,
    tenantId,
    studentProfileId: 'student-1',
    academicYearId,
    courseId,
    branchId,
    admissionStatus: AdmissionStatusEnum.ACTIVE,
    admissionNumber: '2026-000001',
    deletedAt: null,
  };

  const mockBatch = {
    id: batchId,
    tenantId,
    branchId,
    courseId,
    academicYearId,
    status: BatchStatusType.ACTIVE,
    maxStudents: 40,
    deletedAt: null,
  };

  const mockEnrollment = {
    id: enrollmentId,
    tenantId,
    studentAdmissionId: admissionId,
    batchId,
    joinedAt: new Date(),
    leftAt: new Date(),
    status: BatchStatusType.ACTIVE,
    isPrimary: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const dto = { batchId, isPrimary: true };

  let prismaService: any;
  let tenantScoped: any;
  let service: BatchEnrollmentsService;

  beforeEach(() => {
    prismaService = {
      studentAdmissions: { findFirst: jest.fn() },
      batches: { findFirst: jest.fn() },
      studentBatchEnrollments: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
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
      softDelete: jest.fn().mockResolvedValue(undefined),
    };

    service = new BatchEnrollmentsService(prismaService, tenantScoped);
  });

  describe('create', () => {
    beforeEach(() => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(
        mockAdmission,
      );
      prismaService.batches.findFirst.mockResolvedValue(mockBatch);
      prismaService.studentBatchEnrollments.findFirst.mockResolvedValue(null);
      prismaService.studentBatchEnrollments.count.mockResolvedValue(0);
      prismaService.studentBatchEnrollments.create.mockResolvedValue(
        mockEnrollment,
      );
      prismaService.studentBatchEnrollments.updateMany.mockResolvedValue({
        count: 0,
      });
    });

    it('creates enrollment successfully', async () => {
      const result = await service.create(
        admissionId,
        { batchId, isPrimary: true },
        tenantId,
        userId,
      );

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.studentBatchEnrollments.create).toHaveBeenCalledWith(
        {
          data: expect.objectContaining({
            studentAdmissionId: admissionId,
            batchId,
            status: BatchStatusType.ACTIVE,
            isPrimary: true,
          }),
        },
      );
      expect(result.id).toBe(enrollmentId);
      expect(result.admissionId).toBe(admissionId);
      expect(result.batchId).toBe(batchId);
    });

    it('throws NotFoundException when admission not found', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(null);

      await expect(
        service.create(admissionId, dto, tenantId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when admission is not ACTIVE', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue({
        ...mockAdmission,
        admissionStatus: AdmissionStatusEnum.ACTIVE,
      });

      await expect(
        service.create(admissionId, dto, tenantId, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when batch not found', async () => {
      prismaService.batches.findFirst.mockResolvedValue(null);

      await expect(
        service.create(admissionId, dto, tenantId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when batch is not ACTIVE', async () => {
      prismaService.batches.findFirst.mockResolvedValue({
        ...mockBatch,
        status: BatchStatusType.PLANNED,
      });

      await expect(
        service.create(admissionId, dto, tenantId, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when academic year mismatches', async () => {
      prismaService.batches.findFirst.mockResolvedValue({
        ...mockBatch,
        academicYearId: 'different-year',
      });

      await expect(
        service.create(admissionId, dto, tenantId, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when course mismatches', async () => {
      prismaService.batches.findFirst.mockResolvedValue({
        ...mockBatch,
        courseId: 'different-course',
      });

      await expect(
        service.create(admissionId, dto, tenantId, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when branch mismatches', async () => {
      prismaService.batches.findFirst.mockResolvedValue({
        ...mockBatch,
        branchId: 'different-branch',
      });

      await expect(
        service.create(admissionId, dto, tenantId, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException for duplicate enrollment', async () => {
      prismaService.studentBatchEnrollments.findFirst.mockResolvedValue(
        mockEnrollment,
      );

      await expect(
        service.create(admissionId, dto, tenantId, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when batch is at capacity', async () => {
      prismaService.studentBatchEnrollments.count.mockResolvedValue(40);

      await expect(
        service.create(admissionId, dto, tenantId, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('auto-unsets previous primary when enrolling with isPrimary=true', async () => {
      await service.create(admissionId, dto, tenantId, userId);

      expect(
        prismaService.studentBatchEnrollments.updateMany,
      ).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId,
          studentAdmissionId: admissionId,
          isPrimary: true,
          deletedAt: null,
        }),
        data: expect.objectContaining({ isPrimary: false }),
      });
    });

    it('does not unset primary when isPrimary=false', async () => {
      prismaService.studentBatchEnrollments.create.mockResolvedValue({
        ...mockEnrollment,
        isPrimary: false,
      });

      const result = await service.create(
        admissionId,
        { batchId, isPrimary: false },
        tenantId,
        userId,
      );

      expect(
        prismaService.studentBatchEnrollments.updateMany,
      ).not.toHaveBeenCalled();
      expect(result.isPrimary).toBe(false);
    });

    it('rolls back transaction on failure', async () => {
      prismaService.studentBatchEnrollments.create.mockRejectedValue(
        new Error('DB fail'),
      );

      await expect(
        service.create(admissionId, dto, tenantId, userId),
      ).rejects.toThrow('DB fail');
      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(
        mockAdmission,
      );
      prismaService.studentBatchEnrollments.findMany.mockResolvedValue([
        mockEnrollment,
      ]);
      prismaService.studentBatchEnrollments.count.mockResolvedValue(1);
    });

    it('returns paginated enrollments', async () => {
      const result = await service.findAll(admissionId, tenantId, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(enrollmentId);
    });

    it('throws NotFoundException when admission not found', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(null);

      await expect(
        service.findAll('nonexistent', tenantId, { page: 1, limit: 10 } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findCurrent', () => {
    it('returns primary enrollment', async () => {
      prismaService.studentBatchEnrollments.findFirst.mockResolvedValue(
        mockEnrollment,
      );

      const result = await service.findCurrent(admissionId, tenantId);

      expect(result.id).toBe(enrollmentId);
      expect(result.isPrimary).toBe(true);
    });

    it('throws NotFoundException when no primary enrollment', async () => {
      prismaService.studentBatchEnrollments.findFirst.mockResolvedValue(null);

      await expect(service.findCurrent(admissionId, tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('soft deletes enrollment', async () => {
      prismaService.studentBatchEnrollments.findFirst.mockResolvedValue(
        mockEnrollment,
      );

      await service.remove(enrollmentId, tenantId, userId);

      expect(tenantScoped.softDelete).toHaveBeenCalledWith(
        expect.anything(),
        enrollmentId,
        tenantId,
        userId,
      );
    });

    it('throws NotFoundException when enrollment not found', async () => {
      prismaService.studentBatchEnrollments.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent', tenantId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
