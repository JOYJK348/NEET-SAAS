/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AdmissionStatusEnum } from '@prisma/client';
import { AdmissionsService } from './admissions.service';

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
    admissionStatus: AdmissionStatusEnum.PENDING,
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
    toStatus: AdmissionStatusEnum.PENDING,
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
          admissionStatus: AdmissionStatusEnum.CONFIRMED,
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
          admissionStatus: AdmissionStatusEnum.PENDING,
        }),
      });
      expect(prismaService.admissionStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          toStatus: AdmissionStatusEnum.PENDING,
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
      status: AdmissionStatusEnum.CONFIRMED,
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
        admissionStatus: AdmissionStatusEnum.CONFIRMED,
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
          admissionStatus: AdmissionStatusEnum.CONFIRMED,
        }),
      });
      expect(prismaService.admissionStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fromStatus: AdmissionStatusEnum.PENDING,
          toStatus: AdmissionStatusEnum.CONFIRMED,
        }),
      });
      expect(result.admissionStatus).toBe(AdmissionStatusEnum.CONFIRMED);
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
        status: AdmissionStatusEnum.PENDING,
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

  describe('getHistory', () => {
    it('returns chronological history', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(
        mockAdmission,
      );

      const result = await service.getHistory(admissionId, tenantId);

      expect(result).toHaveLength(1);
      expect(result[0].admissionId).toBe(admissionId);
      expect(result[0].toStatus).toBe(AdmissionStatusEnum.PENDING);
    });

    it('throws NotFoundException when admission not found', async () => {
      prismaService.studentAdmissions.findFirst.mockResolvedValue(null);

      await expect(service.getHistory('nonexistent', tenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
