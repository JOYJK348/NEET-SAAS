/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  FileCategoryEnum,
  FileModuleEnum,
  BucketTypeEnum,
} from '@prisma/client';
import { SupabaseStorageService } from './supabase-storage.service';

describe('SupabaseStorageService', () => {
  let service: SupabaseStorageService;
  let mockConfigService: any;
  let mockPrismaService: any;

  const tenantId = 'tenant-101';
  const userId = 'user-202';

  const createMockFile = (
    originalname = 'test-document.pdf',
    mimetype = 'application/pdf',
    size = 1024,
  ): Express.Multer.File =>
    ({
      fieldname: 'file',
      originalname,
      encoding: '7bit',
      mimetype,
      size,
      buffer: Buffer.from('mock file content'),
      stream: null,
      destination: '',
      filename: originalname,
      path: '',
    }) as unknown as Express.Multer.File;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'storage.supabaseUrl') return 'https://mock.supabase.co';
        if (key === 'storage.supabaseServiceRoleKey') return 'mock-key';
        if (key === 'storage.supabasePrivateBucket') return 'private-files';
        return null;
      }),
    };

    mockPrismaService = {
      fileUploads: {
        create: jest.fn().mockImplementation(({ data }: any) =>
          Promise.resolve({
            id: 'file-upload-uuid-1',
            ...data,
            createdAt: new Date('2026-07-28T00:00:00Z'),
            updatedAt: new Date('2026-07-28T00:00:00Z'),
          }),
        ),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new SupabaseStorageService(mockConfigService, mockPrismaService);
  });

  describe('validateFilePayload (Validation Matrix)', () => {
    it('throws BadRequestException for empty 0-byte file payload', async () => {
      const emptyFile = createMockFile('empty.pdf', 'application/pdf', 0);
      emptyFile.buffer = Buffer.alloc(0);

      await expect(
        service.uploadFile({
          tenantId,
          userId,
          file: emptyFile,
          fileType: FileCategoryEnum.QUESTION_PAPER,
          moduleCode: FileModuleEnum.EXAMS,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when filename exceeds 255 characters', async () => {
      const longName = 'a'.repeat(256) + '.pdf';
      const invalidFile = createMockFile(longName, 'application/pdf', 1024);

      await expect(
        service.uploadFile({
          tenantId,
          userId,
          file: invalidFile,
          fileType: FileCategoryEnum.QUESTION_PAPER,
          moduleCode: FileModuleEnum.EXAMS,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when MIME type is not allowed for category', async () => {
      const invalidFile = createMockFile(
        'hacked.exe',
        'application/x-msdownload',
        1024,
      );

      await expect(
        service.uploadFile({
          tenantId,
          userId,
          file: invalidFile,
          fileType: FileCategoryEnum.QUESTION_PAPER,
          moduleCode: FileModuleEnum.EXAMS,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when file size exceeds category limit', async () => {
      const oversizedFile = createMockFile(
        'huge-photo.jpg',
        'image/jpeg',
        10 * 1024 * 1024, // 10MB > 5MB limit for PROFILE_PHOTO
      );

      await expect(
        service.uploadFile({
          tenantId,
          userId,
          file: oversizedFile,
          fileType: FileCategoryEnum.PROFILE_PHOTO,
          moduleCode: FileModuleEnum.PROFILES,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMetadata & Tenant Scoping', () => {
    it('returns metadata record for valid tenant and active file', async () => {
      const mockRecord = {
        id: 'file-1',
        tenantId,
        storedFileName: 'uuid.pdf',
        originalFileName: 'paper.pdf',
        fileSizeBytes: BigInt(1024),
        mimeType: 'application/pdf',
        fileType: FileCategoryEnum.QUESTION_PAPER,
        moduleCode: FileModuleEnum.EXAMS,
        bucket: BucketTypeEnum.PRIVATE,
        deletedAt: null,
      };

      mockPrismaService.fileUploads.findFirst.mockResolvedValue(mockRecord);

      const result = await service.getMetadata({
        tenantId,
        fileUploadId: 'file-1',
      });

      expect(mockPrismaService.fileUploads.findFirst).toHaveBeenCalledWith({
        where: { id: 'file-1', tenantId, deletedAt: null },
      });
      expect(result).toEqual(mockRecord);
    });

    it('throws NotFoundException when tenant ID does not match or record is soft-deleted', async () => {
      mockPrismaService.fileUploads.findFirst.mockResolvedValue(null);

      await expect(
        service.getMetadata({
          tenantId: 'wrong-tenant',
          fileUploadId: 'file-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
