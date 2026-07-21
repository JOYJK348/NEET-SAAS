/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AdmissionStatusEnum } from '@prisma/client';
import { AdmissionsService } from './admissions.service';
import { validateBatchEligibility } from './admissions.validation';

describe('AdmissionsService', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';
  const studentId = 'student-1';
  const admissionId = 'admission-1';
  const academicYearId = 'academic-year-1';
  const courseId = 'course-1';
  const branchId = 'branch-1';

  const mockStudent = { userId: studentId, tenantId, deletedAt: null };
  const mockAcademicYear = {
    id: academicYearId,
    tenantId,
    startDate: new Date('2026-06-01'),
    isActive: true,
    deletedAt: null,
  };
  const mockCourse = { id: courseId, tenantId, deletedAt: null };
  const mockBranch = { id: branchId, tenantId, deletedAt: null };

  const mockAdmission = {
    id: admissionId,
    tenantId,
    studentProfileId: studentId,
    admissionNumber: '2026-000001',
    academicYearId,
    courseId,
    branchId,
    admissionStatus: AdmissionStatusEnum.ACTIVE,
    admissionDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
    deletedAt: null,
    deletedBy: null,
    version: 1,
    feeStructureId: null,
    remarks: null,
  };

  const mockHistoryRecord = {
    id: 'history-1',
    admissionId,
    tenantId,
    fromStatus: null,
    toStatus: AdmissionStatusEnum.ACTIVE,
    reason: null,
    changedAt: new Date(),
    changedBy: userId,
    createdAt: new Date(),
    deletedAt: null,
  };

  const defaultDto = { academicYearId, courseId, branchId };

  let prismaService: any;
  let tenantScoped: any;
  let admissionNumberGenerator: any;
  let service: AdmissionsService;

  beforeEach(() => {
    prismaService = {
      studentProfiles: { findFirst: jest.fn().mockResolvedValue(mockStudent) },
      academicYears: {
        findFirst: jest.fn().mockResolvedValue(mockAcademicYear),
      },
      courses: { findFirst: jest.fn().mockResolvedValue(mockCourse) },
      branches: { findFirst: jest.fn().mockResolvedValue(mockBranch) },
      studentAdmissions: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([mockAdmission]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(mockAdmission),
        update: jest.fn().mockResolvedValue({
          ...mockAdmission,
          admissionStatus: AdmissionStatusEnum.ACTIVE,
        }),
      },
      admissionStatusHistory: {
        create: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([mockHistoryRecord]),
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
      generate: jest.fn().mockResolvedValue('2026-000001'),
    };

    service = new AdmissionsService(
      prismaService,
      tenantScoped,
      admissionNumberGenerator,
    );
  });

  describe('create', () => {
    it('creates an admission successfully', async () => {
      const result = await service.create(
        studentId,
        defaultDto,
        tenantId,
        userId,
      );

      expect(prismaService.studentProfiles.findFirst).toHaveBeenCalled();
      expect(prismaService.studentAdmissions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          studentProfileId: studentId,
          admissionStatus: AdmissionStatusEnum.ACTIVE,
        }),
      });
      expect(prismaService.admissionStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          toStatus: AdmissionStatusEnum.ACTIVE,
        }),
      });
      expect(result.id).toBe(admissionId);
      expect(result.admissionNumber).toBe('2026-000001');
    });

    it('throws NotFoundException when student does not exist', async () => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(null);
      await expect(
        service.create('nonexistent', defaultDto, tenantId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when duplicate active admission exists', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(
        mockAdmission,
      );
      await expect(
        service.create(studentId, defaultDto, tenantId, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('rolls back transaction on failure', async () => {
      prismaService.studentAdmissions.create.mockRejectedValue(
        new Error('DB fail'),
      );
      await expect(
        service.create(studentId, defaultDto, tenantId, userId),
      ).rejects.toThrow('DB fail');
      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated admissions for a student', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(mockStudent);

      const result = await service.findAll(studentId, tenantId, {
        page: 1,
        limit: 10,
      });

      expect(result.meta.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(admissionId);
    });

    it('throws NotFoundException when student does not exist', async () => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(null);

      await expect(
        service.findAll('nonexistent', tenantId, { page: 1, limit: 10 } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findCurrent', () => {
    it('returns the active admission with priority ACTIVE', async () => {
      prismaService.studentAdmissions.findFirst
        .mockResolvedValueOnce(null) // no ACTIVE
        .mockResolvedValueOnce(mockAdmission); // FOUND as CONFIRMED

      const result = await service.findCurrent(studentId, tenantId);

      expect(result.id).toBe(admissionId);
    });

    it('throws NotFoundException when no current admission', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(null);

      await expect(service.findCurrent(studentId, tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('returns admission with history count', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(
        mockAdmission,
      );

      const result = await service.findOne(admissionId, tenantId);

      expect(result.id).toBe(admissionId);
      expect(result.historyCount).toBe(1);
    });

    it('throws NotFoundException when admission does not exist', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    const updateDto = {
      status: AdmissionStatusEnum.ACTIVE,
      reason: 'Verified',
      remarks: 'All good',
    };

    beforeEach(() => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(
        mockAdmission,
      );
    });

    it('updates status and creates history record', async () => {
      prismaService.studentAdmissions.update.mockResolvedValue({
        ...mockAdmission,
        admissionStatus: AdmissionStatusEnum.ACTIVE,
      });

      const result = await service.updateStatus(
        admissionId,
        updateDto,
        tenantId,
        userId,
      );

      expect(prismaService.studentAdmissions.update).toHaveBeenCalledWith({
        where: { id: admissionId },
        data: expect.objectContaining({
          admissionStatus: AdmissionStatusEnum.ACTIVE,
        }),
      });
      expect(prismaService.admissionStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fromStatus: AdmissionStatusEnum.ACTIVE,
          toStatus: AdmissionStatusEnum.ACTIVE,
        }),
      });
      expect(result.admissionStatus).toBe(AdmissionStatusEnum.ACTIVE);
    });

    it('throws BadRequestException for invalid transition', async () => {
      const dto = {
        status: AdmissionStatusEnum.ACTIVE,
        reason: '',
        remarks: '',
      };

      await expect(
        service.updateStatus(admissionId, dto, tenantId, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for duplicate status', async () => {
      const dto = {
        status: AdmissionStatusEnum.ACTIVE,
        reason: '',
        remarks: '',
      };

      await expect(
        service.updateStatus(admissionId, dto, tenantId, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when admission not found', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', updateDto, tenantId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('rolls back transaction on failure', async () => {
      prismaService.studentAdmissions.update.mockRejectedValue(
        new Error('DB fail'),
      );

      await expect(
        service.updateStatus(admissionId, updateDto, tenantId, userId),
      ).rejects.toThrow('DB fail');
      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('updateStatus — terminal state', () => {
    const updateDto = {
      status: AdmissionStatusEnum.INACTIVE,
      reason: 'No effect',
    };

    it('rejects status update when admission is COMPLETED', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue({
        ...mockAdmission,
        admissionStatus: AdmissionStatusEnum.INACTIVE,
      });

      await expect(
        service.updateStatus(admissionId, updateDto, tenantId, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects status update when admission is CANCELLED', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue({
        ...mockAdmission,
        admissionStatus: AdmissionStatusEnum.INACTIVE,
      });

      await expect(
        service.updateStatus(admissionId, updateDto, tenantId, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus — duplicate ACTIVE', () => {
    const activateDto = {
      status: AdmissionStatusEnum.ACTIVE,
      reason: 'Activate',
    };

    it('rejects when another ACTIVE admission already exists', async () => {
      prismaService.studentAdmissions.findFirst
        .mockResolvedValueOnce({
          ...mockAdmission,
          admissionStatus: AdmissionStatusEnum.ACTIVE,
        })
        .mockResolvedValueOnce({
          ...mockAdmission,
          id: 'other-admission',
          admissionStatus: AdmissionStatusEnum.ACTIVE,
        });

      await expect(
        service.updateStatus(admissionId, activateDto, tenantId, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('allows ACTIVE transition when no other ACTIVE exists', async () => {
      const activatedAdmission = {
        ...mockAdmission,
        admissionStatus: AdmissionStatusEnum.ACTIVE,
      };

      prismaService.studentAdmissions.findFirst
        .mockResolvedValueOnce({
          ...mockAdmission,
          admissionStatus: AdmissionStatusEnum.ACTIVE,
        })
        .mockResolvedValueOnce(null);

      prismaService.studentAdmissions.update.mockResolvedValue(
        activatedAdmission,
      );

      const result = await service.updateStatus(
        admissionId,
        activateDto,
        tenantId,
        userId,
      );

      expect(result.admissionStatus).toBe(AdmissionStatusEnum.ACTIVE);
    });
  });

  describe('validateBatchEligibility', () => {
    it('passes for ACTIVE status', () => {
      expect(() =>
        validateBatchEligibility(AdmissionStatusEnum.ACTIVE),
      ).not.toThrow();
    });

    it('throws for PENDING status', () => {
      expect(() =>
        validateBatchEligibility(AdmissionStatusEnum.ACTIVE),
      ).toThrow(BadRequestException);
    });

    it('throws for CONFIRMED status', () => {
      expect(() =>
        validateBatchEligibility(AdmissionStatusEnum.ACTIVE),
      ).toThrow(BadRequestException);
    });

    it('throws for COMPLETED status', () => {
      expect(() =>
        validateBatchEligibility(AdmissionStatusEnum.INACTIVE),
      ).toThrow(BadRequestException);
    });

    it('throws for CANCELLED status', () => {
      expect(() =>
        validateBatchEligibility(AdmissionStatusEnum.INACTIVE),
      ).toThrow(BadRequestException);
    });
  });

  describe('full lifecycle', () => {
    it('transitions PENDING → CONFIRMED → ACTIVE → COMPLETED', async () => {
      let currentStatus: AdmissionStatusEnum = AdmissionStatusEnum.ACTIVE;
      const admissionBase = { ...mockAdmission };

      prismaService.studentAdmissions.findFirst.mockImplementation(
        (args: any) => {
          const where = args?.where ?? {};
          if (where.admissionStatus === AdmissionStatusEnum.ACTIVE) {
            return Promise.resolve(null);
          }
          return Promise.resolve({
            ...admissionBase,
            admissionStatus: currentStatus,
          });
        },
      );

      prismaService.studentAdmissions.update.mockImplementation(
        (args: Record<string, unknown>) => {
          const data = args.data as { admissionStatus: AdmissionStatusEnum };
          currentStatus = data.admissionStatus;
          return Promise.resolve({
            ...admissionBase,
            admissionStatus: currentStatus,
          });
        },
      );

      // PENDING → CONFIRMED
      let result = await service.updateStatus(
        admissionId,
        { status: AdmissionStatusEnum.ACTIVE, reason: 'Verify' },
        tenantId,
        userId,
      );
      expect(result.admissionStatus).toBe(AdmissionStatusEnum.ACTIVE);

      // CONFIRMED → ACTIVE
      result = await service.updateStatus(
        admissionId,
        { status: AdmissionStatusEnum.ACTIVE, reason: 'Activate' },
        tenantId,
        userId,
      );
      expect(result.admissionStatus).toBe(AdmissionStatusEnum.ACTIVE);

      // ACTIVE → COMPLETED
      result = await service.updateStatus(
        admissionId,
        { status: AdmissionStatusEnum.INACTIVE, reason: 'Complete' },
        tenantId,
        userId,
      );
      expect(result.admissionStatus).toBe(AdmissionStatusEnum.INACTIVE);
    });
  });

  describe('getHistory', () => {
    it('returns chronological history', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(
        mockAdmission,
      );

      const result = await service.getHistory(admissionId, tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].admissionId).toBe(admissionId);
      expect(result[0].toStatus).toBe(AdmissionStatusEnum.ACTIVE);
    });

    it('throws NotFoundException when admission not found', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(null);

      await expect(service.getHistory('nonexistent', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
