import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  FileUploads,
  FileCategoryEnum,
  FileModuleEnum,
  BucketTypeEnum,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  IStorageService,
  BatchSignedUrlResult,
} from './interfaces/storage.interface';
import { buildStoragePath, getBucketName } from './helpers/storage-path.helper';
import {
  MAX_FILE_SIZES,
  ALLOWED_MIME_TYPES,
  DEFAULT_SIGNED_URL_EXPIRY,
} from './constants/storage-defaults.constant';

@Injectable()
export class SupabaseStorageService implements IStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly supabaseClient: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const supabaseUrl =
      this.configService.get<string>('storage.supabaseUrl') ||
      process.env.SUPABASE_URL ||
      '';
    const supabaseServiceRoleKey =
      this.configService.get<string>('storage.supabaseServiceRoleKey') ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      '';

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // --- INTERNAL INFRASTRUCTURE HELPERS (PHASE 3) ---

  /** Resolves internal bucket enum to physical storage bucket name */
  private resolveBucketName(bucket?: BucketTypeEnum): string {
    return getBucketName(bucket ?? BucketTypeEnum.PRIVATE);
  }

  /** Constructs canonical storage object path */
  private generateStoragePath(
    tenantId: string,
    moduleCode: FileModuleEnum,
    storedFileName: string,
    uploadDate?: Date,
  ): string {
    return buildStoragePath(tenantId, moduleCode, storedFileName, uploadDate);
  }

  /** Preserves original extension and generates UUID-based system name */
  private preserveExtension(originalFileName: string): {
    storedFileName: string;
    extension: string;
  } {
    const ext = extname(originalFileName || '').toLowerCase();
    const storedFileName = `${randomUUID()}${ext}`;
    return { storedFileName, extension: ext };
  }

  /** Centralized validation for empty payload, filename length, max size, and MIME whitelist */
  private validateFilePayload(
    file: Express.Multer.File,
    fileType: FileCategoryEnum,
  ): void {
    if (!file || !file.buffer || file.size === 0) {
      throw new BadRequestException('File payload is empty (0 bytes)');
    }

    const originalName = file.originalname || '';
    if (originalName.length > 255) {
      throw new BadRequestException(
        'Filename exceeds maximum allowed length of 255 characters',
      );
    }

    const maxSize = MAX_FILE_SIZES[fileType];
    if (maxSize && file.size > maxSize) {
      const maxMb = (maxSize / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${maxMb}MB for ${fileType}`,
      );
    }

    const allowedMimes = ALLOWED_MIME_TYPES[fileType];
    if (allowedMimes && !allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `MIME type '${file.mimetype}' is not allowed for category ${fileType}. Allowed: ${allowedMimes.join(', ')}`,
      );
    }
  }

  /** Checks if object physically exists in storage bucket */
  private async checkPhysicalExists(
    bucketName: string,
    storagePath: string,
  ): Promise<boolean> {
    try {
      const folderPath = storagePath.substring(0, storagePath.lastIndexOf('/'));
      const fileName = storagePath.substring(storagePath.lastIndexOf('/') + 1);

      const { data, error } = await this.supabaseClient.storage
        .from(bucketName)
        .list(folderPath, { search: fileName });

      if (error || !data) {
        return false;
      }

      return data.some((item) => item.name === fileName);
    } catch {
      return false;
    }
  }

  /** Emits structured, sanitized telemetry logs (redacting signed URLs, raw paths, or secrets) */
  private logSanitizedEvent(
    eventTag: string,
    payload: {
      tenantId?: string;
      fileUploadId?: string;
      moduleCode?: FileModuleEnum;
      fileSizeBytes?: number | bigint;
      storedFileName?: string;
      error?: string;
    },
  ): void {
    const sanitized = {
      event: eventTag,
      tenantId: payload.tenantId,
      fileUploadId: payload.fileUploadId,
      moduleCode: payload.moduleCode,
      fileSizeBytes: payload.fileSizeBytes?.toString(),
      storedFileName: payload.storedFileName,
      error: payload.error,
      timestamp: new Date().toISOString(),
    };

    if (payload.error) {
      this.logger.error(`[${eventTag}] ${JSON.stringify(sanitized)}`);
    } else {
      this.logger.log(`[${eventTag}] ${JSON.stringify(sanitized)}`);
    }
  }

  /** Ensures target Supabase storage bucket exists before uploading */
  private async ensureBucketExists(bucketName: string): Promise<void> {
    try {
      const { data, error } =
        await this.supabaseClient.storage.getBucket(bucketName);
      if (error || !data) {
        this.logger.warn(
          `Bucket '${bucketName}' not found. Creating private storage bucket...`,
        );
        const { error: createErr } =
          await this.supabaseClient.storage.createBucket(bucketName, {
            public: false,
            fileSizeLimit: 52428800, // 50MB limit
          });
        if (createErr) {
          this.logger.error(
            `Failed to auto-create bucket '${bucketName}': ${createErr.message}`,
          );
        } else {
          this.logger.log(
            `Successfully auto-created storage bucket '${bucketName}' in Supabase.`,
          );
        }
      }
    } catch (err) {
      this.logger.error(
        `Error inspecting bucket '${bucketName}': ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  // --- BUSINESS INTERFACE METHODS (PHASE 4) ---

  /**
   * Uploads file buffer to Supabase Storage and creates FileUploads DB record on success.
   */
  async uploadFile(params: {
    tenantId: string;
    userId: string;
    file: Express.Multer.File;
    fileType: FileCategoryEnum;
    moduleCode: FileModuleEnum;
    metadata?: Record<string, unknown> | null;
    bucket?: BucketTypeEnum;
  }): Promise<FileUploads> {
    const {
      tenantId,
      userId,
      file,
      fileType,
      moduleCode,
      metadata,
      bucket = BucketTypeEnum.PRIVATE,
    } = params;

    this.validateFilePayload(file, fileType);

    const bucketName = this.resolveBucketName(bucket);
    await this.ensureBucketExists(bucketName);

    const { storedFileName } = this.preserveExtension(file.originalname);
    const now = new Date();
    const storagePath = this.generateStoragePath(
      tenantId,
      moduleCode,
      storedFileName,
      now,
    );

    this.logSanitizedEvent('STORAGE_UPLOAD_STARTED', {
      tenantId,
      moduleCode,
      fileSizeBytes: file.size,
      storedFileName,
    });

    const { error: uploadError } = await this.supabaseClient.storage
      .from(bucketName)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      this.logSanitizedEvent('STORAGE_UPLOAD_FAILED', {
        tenantId,
        moduleCode,
        fileSizeBytes: file.size,
        storedFileName,
        error: uploadError.message,
      });
      throw new InternalServerErrorException(
        `Failed to upload file to storage: ${uploadError.message}`,
      );
    }

    try {
      const record = await this.prisma.fileUploads.create({
        data: {
          tenantId,
          originalFileName: file.originalname || storedFileName,
          storedFileName,
          fileSizeBytes: BigInt(file.size),
          mimeType: file.mimetype,
          metadata: metadata
            ? (metadata as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          fileType,
          moduleCode,
          bucket,
          createdBy: userId,
          updatedBy: userId,
          createdAt: now,
        },
      });

      this.logSanitizedEvent('STORAGE_UPLOAD_COMPLETED', {
        tenantId,
        fileUploadId: record.id,
        moduleCode,
        fileSizeBytes: record.fileSizeBytes,
        storedFileName,
      });

      return record;
    } catch (dbError) {
      // Best-effort cleanup of orphan physical object if DB record creation fails
      await this.supabaseClient.storage.from(bucketName).remove([storagePath]);

      const errMessage =
        dbError instanceof Error ? dbError.message : 'Unknown DB error';
      this.logSanitizedEvent('STORAGE_UPLOAD_FAILED', {
        tenantId,
        moduleCode,
        storedFileName,
        error: errMessage,
      });

      throw new InternalServerErrorException(
        `Failed to record file metadata: ${errMessage}`,
      );
    }
  }

  /**
   * Safe Replace Execution:
   * 1. Validate file payload
   * 2. Fetch existing active DB record (throws NotFoundException if missing)
   * 3. Upload new file object to Supabase
   * 4. Update FileUploads DB record in-place
   * 5. Delete old file object from Supabase (logged safely; failure does not rollback DB update).
   */
  async replaceFile(params: {
    tenantId: string;
    fileUploadId: string;
    userId: string;
    file: Express.Multer.File;
    metadata?: Record<string, unknown> | null;
  }): Promise<FileUploads> {
    const { tenantId, fileUploadId, userId, file, metadata } = params;

    const existingRecord = await this.prisma.fileUploads.findFirst({
      where: {
        id: fileUploadId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!existingRecord) {
      throw new NotFoundException(
        `FileUpload record '${fileUploadId}' not found for tenant '${tenantId}'`,
      );
    }

    this.validateFilePayload(file, existingRecord.fileType);

    const bucketName = this.resolveBucketName(existingRecord.bucket);
    const oldStoredFileName = existingRecord.storedFileName;
    const oldStoragePath = this.generateStoragePath(
      tenantId,
      existingRecord.moduleCode,
      oldStoredFileName,
      existingRecord.createdAt,
    );

    const { storedFileName: newStoredFileName } = this.preserveExtension(
      file.originalname,
    );
    const now = new Date();
    const newStoragePath = this.generateStoragePath(
      tenantId,
      existingRecord.moduleCode,
      newStoredFileName,
      now,
    );

    this.logSanitizedEvent('STORAGE_REPLACE_STARTED', {
      tenantId,
      fileUploadId,
      moduleCode: existingRecord.moduleCode,
      fileSizeBytes: file.size,
      storedFileName: newStoredFileName,
    });

    // 1. Upload new file object
    const { error: uploadError } = await this.supabaseClient.storage
      .from(bucketName)
      .upload(newStoragePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      this.logSanitizedEvent('STORAGE_REPLACE_FAILED', {
        tenantId,
        fileUploadId,
        moduleCode: existingRecord.moduleCode,
        error: uploadError.message,
      });
      throw new InternalServerErrorException(
        `Failed to upload replacement file to storage: ${uploadError.message}`,
      );
    }

    // 2. Update DB record in-place
    let updatedRecord: FileUploads;
    try {
      updatedRecord = await this.prisma.fileUploads.update({
        where: { id: fileUploadId },
        data: {
          originalFileName: file.originalname || newStoredFileName,
          storedFileName: newStoredFileName,
          fileSizeBytes: BigInt(file.size),
          mimeType: file.mimetype,
          metadata: metadata
            ? (metadata as Prisma.InputJsonValue)
            : (existingRecord.metadata ?? Prisma.JsonNull),
          updatedBy: userId,
        },
      });
    } catch (dbError) {
      // Clean up newly uploaded file if DB update fails
      await this.supabaseClient.storage
        .from(bucketName)
        .remove([newStoragePath]);
      const errMessage =
        dbError instanceof Error ? dbError.message : 'Unknown DB error';
      this.logSanitizedEvent('STORAGE_REPLACE_FAILED', {
        tenantId,
        fileUploadId,
        error: errMessage,
      });
      throw new InternalServerErrorException(
        `Failed to update replacement metadata: ${errMessage}`,
      );
    }

    // 3. Delete old file object from storage (Non-blocking: failure logs error with context without rolling back DB)
    const { error: removeError } = await this.supabaseClient.storage
      .from(bucketName)
      .remove([oldStoragePath]);

    if (removeError) {
      this.logSanitizedEvent('STORAGE_REPLACE_OLD_DELETE_FAILED', {
        tenantId,
        fileUploadId,
        storedFileName: oldStoredFileName,
        error: removeError.message,
      });
    }

    this.logSanitizedEvent('STORAGE_REPLACE_COMPLETED', {
      tenantId,
      fileUploadId,
      moduleCode: updatedRecord.moduleCode,
      fileSizeBytes: updatedRecord.fileSizeBytes,
      storedFileName: newStoredFileName,
    });

    return updatedRecord;
  }

  /**
   * Generates a short-lived signed URL for reading private storage objects.
   * Supports download attachment toggle via Content-Disposition header options.
   */
  async createSignedUrl(params: {
    tenantId: string;
    fileUploadId: string;
    expiresInSeconds?: number;
    download?: boolean;
  }): Promise<string> {
    const { tenantId, fileUploadId, expiresInSeconds, download } = params;

    const record = await this.prisma.fileUploads.findFirst({
      where: {
        id: fileUploadId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!record) {
      throw new NotFoundException(
        `FileUpload record '${fileUploadId}' not found for tenant '${tenantId}'`,
      );
    }

    const bucketName = this.resolveBucketName(record.bucket);
    const storagePath = this.generateStoragePath(
      tenantId,
      record.moduleCode,
      record.storedFileName,
      record.createdAt,
    );

    // Supabase max signed URL expiry is 604,800 seconds (7 days)
    const rawExpiry =
      expiresInSeconds ??
      DEFAULT_SIGNED_URL_EXPIRY[record.moduleCode] ??
      604800;
    const expiry = Math.min(rawExpiry, 604800);

    const options: { download?: string | boolean } = {};
    if (download) {
      options.download = record.originalFileName || true;
    }

    const { data, error } = await this.supabaseClient.storage
      .from(bucketName)
      .createSignedUrl(storagePath, expiry, options);

    if (error || !data?.signedUrl) {
      this.logSanitizedEvent('STORAGE_SIGNED_URL_FAILED', {
        tenantId,
        fileUploadId,
        moduleCode: record.moduleCode,
        error: error?.message || 'Failed to generate signed URL',
      });
      throw new InternalServerErrorException(
        `Failed to generate signed URL: ${error?.message || 'Unknown storage error'}`,
      );
    }

    this.logSanitizedEvent('STORAGE_SIGNED_URL_CREATED', {
      tenantId,
      fileUploadId,
      moduleCode: record.moduleCode,
    });

    return data.signedUrl;
  }

  /**
   * Generates batch signed URLs for list rendering (e.g. tutor answer sheet lists).
   * Eliminates N+1 API calls.
   */
  async createSignedUrls(params: {
    tenantId: string;
    fileUploadIds: string[];
    expiresInSeconds?: number;
    download?: boolean;
  }): Promise<BatchSignedUrlResult[]> {
    const { tenantId, fileUploadIds, expiresInSeconds, download } = params;

    if (!fileUploadIds || fileUploadIds.length === 0) {
      return [];
    }

    const records = await this.prisma.fileUploads.findMany({
      where: {
        id: { in: fileUploadIds },
        tenantId,
        deletedAt: null,
      },
    });

    const recordMap = new Map(records.map((r) => [r.id, r]));
    const results: BatchSignedUrlResult[] = [];

    for (const id of fileUploadIds) {
      const record = recordMap.get(id);
      if (!record) {
        continue;
      }

      try {
        const signedUrl = await this.createSignedUrl({
          tenantId,
          fileUploadId: id,
          expiresInSeconds,
          download,
        });

        const expiry =
          expiresInSeconds ??
          DEFAULT_SIGNED_URL_EXPIRY[record.moduleCode] ??
          900;

        results.push({
          fileUploadId: id,
          signedUrl,
          expiresInSeconds: expiry,
        });
      } catch (err) {
        this.logSanitizedEvent('STORAGE_BATCH_SIGNED_URL_ITEM_FAILED', {
          tenantId,
          fileUploadId: id,
          error: err instanceof Error ? err.message : 'Failed item signed URL',
        });
      }
    }

    return results;
  }

  /**
   * Physically removes storage object from Supabase bucket and sets soft-delete in DB.
   */
  async deleteFile(params: {
    tenantId: string;
    fileUploadId: string;
    userId: string;
  }): Promise<void> {
    const { tenantId, fileUploadId, userId } = params;

    const record = await this.prisma.fileUploads.findFirst({
      where: {
        id: fileUploadId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!record) {
      throw new NotFoundException(
        `FileUpload record '${fileUploadId}' not found for tenant '${tenantId}'`,
      );
    }

    const bucketName = this.resolveBucketName(record.bucket);
    const storagePath = this.generateStoragePath(
      tenantId,
      record.moduleCode,
      record.storedFileName,
      record.createdAt,
    );

    // 1. Hard delete physical object from Supabase
    const { error: removeError } = await this.supabaseClient.storage
      .from(bucketName)
      .remove([storagePath]);

    if (removeError) {
      this.logSanitizedEvent('STORAGE_DELETE_PHYSICAL_FAILED', {
        tenantId,
        fileUploadId,
        storedFileName: record.storedFileName,
        error: removeError.message,
      });
    }

    // 2. Soft delete DB record
    await this.prisma.fileUploads.update({
      where: { id: fileUploadId },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    this.logSanitizedEvent('STORAGE_FILE_DELETED', {
      tenantId,
      fileUploadId,
      moduleCode: record.moduleCode,
      storedFileName: record.storedFileName,
    });
  }

  /**
   * Fetches active FileUploads DB record metadata.
   */
  async getMetadata(params: {
    tenantId: string;
    fileUploadId: string;
  }): Promise<FileUploads> {
    const { tenantId, fileUploadId } = params;

    const record = await this.prisma.fileUploads.findFirst({
      where: {
        id: fileUploadId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!record) {
      throw new NotFoundException(
        `FileUpload record '${fileUploadId}' not found for tenant '${tenantId}'`,
      );
    }

    return record;
  }

  /**
   * Downloads raw file blob directly from Supabase Storage using service role key,
   * bypassing token expiration checks completely for secure backend proxying.
   */
  async downloadFileStream(params: {
    tenantId: string;
    fileUploadId: string;
  }): Promise<{ blob: Blob; record: FileUploads }> {
    const { tenantId, fileUploadId } = params;

    const record = await this.prisma.fileUploads.findFirst({
      where: {
        id: fileUploadId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!record) {
      throw new NotFoundException(
        `FileUpload record '${fileUploadId}' not found for tenant '${tenantId}'`,
      );
    }

    const bucketName = this.resolveBucketName(record.bucket);
    const storagePath = this.generateStoragePath(
      tenantId,
      record.moduleCode,
      record.storedFileName,
      record.createdAt,
    );

    const { data, error } = await this.supabaseClient.storage
      .from(bucketName)
      .download(storagePath);

    if (error || !data) {
      throw new InternalServerErrorException(
        `Failed to download object from storage: ${error?.message || 'Unknown error'}`,
      );
    }

    return { blob: data, record };
  }
}
