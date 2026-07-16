/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { NotFoundException, ConflictException } from '@nestjs/common';
import { AdmissionStatusEnum } from '@prisma/client';
import { AdmissionsService } from './admissions.service';

describe('AdmissionsService', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';
  const studentId = 'student-1';
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
    id: 'admission-1',
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
        create: jest.fn().mockResolvedValue(mockAdmission),
      },
      admissionStatusHistory: {
        create: jest.fn().mockResolvedValue({}),
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

      expect(prismaService.studentProfiles.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, deletedAt: null, userId: studentId },
        }),
      );
      expect(prismaService.academicYears.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, deletedAt: null, id: academicYearId },
        }),
      );
      expect(prismaService.courses.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, deletedAt: null, id: courseId },
        }),
      );
      expect(prismaService.branches.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, deletedAt: null, id: branchId },
        }),
      );
      expect(admissionNumberGenerator.generate).toHaveBeenCalledWith(
        tenantId,
        academicYearId,
      );
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.studentAdmissions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          studentProfileId: studentId,
          admissionNumber: '2026-000001',
          academicYearId,
          courseId,
          branchId,
          admissionStatus: AdmissionStatusEnum.PENDING,
        }),
      });
      expect(prismaService.admissionStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          admissionId: 'admission-1',
          toStatus: AdmissionStatusEnum.PENDING,
          changedBy: userId,
        }),
      });
      expect(result.id).toBe('admission-1');
      expect(result.admissionNumber).toBe('2026-000001');
      expect(result.admissionStatus).toBe(AdmissionStatusEnum.PENDING);
    });

    it('throws NotFoundException when student does not exist', async () => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(null);

      await expect(
        service.create('nonexistent', defaultDto, tenantId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when student is from another tenant', async () => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(null);

      await expect(
        service.create(studentId, defaultDto, 'other-tenant', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when student is soft-deleted', async () => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(null);

      await expect(
        service.create(studentId, defaultDto, tenantId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when academic year does not exist', async () => {
      prismaService.academicYears.findFirst.mockResolvedValue(null);

      await expect(
        service.create(studentId, defaultDto, tenantId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when academic year is not active', async () => {
      prismaService.academicYears.findFirst.mockResolvedValue({
        ...mockAcademicYear,
        isActive: false,
      });

      await expect(
        service.create(studentId, defaultDto, tenantId, userId),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when course does not exist', async () => {
      prismaService.courses.findFirst.mockResolvedValue(null);

      await expect(
        service.create(studentId, defaultDto, tenantId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when branch does not exist', async () => {
      prismaService.branches.findFirst.mockResolvedValue(null);

      await expect(
        service.create(studentId, defaultDto, tenantId, userId),
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

    it('delegates admission number generation to the generator', async () => {
      await service.create(studentId, defaultDto, tenantId, userId);

      expect(admissionNumberGenerator.generate).toHaveBeenCalledWith(
        tenantId,
        academicYearId,
      );
    });

    it('respects tenant isolation', async () => {
      prismaService.studentProfiles.findFirst.mockResolvedValue(null);

      await expect(
        service.create(studentId, defaultDto, 'different-tenant', userId),
      ).rejects.toThrow(NotFoundException);

      expect(prismaService.studentProfiles.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'different-tenant' }),
        }),
      );
    });
  });
});
