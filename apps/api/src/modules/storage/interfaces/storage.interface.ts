import {
  FileUploads,
  FileCategoryEnum,
  FileModuleEnum,
  BucketTypeEnum,
} from '@prisma/client';

export const STORAGE_SERVICE_TOKEN = Symbol('IStorageService');

export interface BatchSignedUrlResult {
  fileUploadId: string;
  signedUrl: string;
  expiresInSeconds: number;
}

export interface IStorageService {
  uploadFile(params: {
    tenantId: string;
    userId: string;
    file: Express.Multer.File;
    fileType: FileCategoryEnum;
    moduleCode: FileModuleEnum;
    metadata?: Record<string, unknown> | null;
    bucket?: BucketTypeEnum;
  }): Promise<FileUploads>;

  replaceFile(params: {
    tenantId: string;
    fileUploadId: string;
    userId: string;
    file: Express.Multer.File;
    metadata?: Record<string, unknown> | null;
  }): Promise<FileUploads>;

  createSignedUrl(params: {
    tenantId: string;
    fileUploadId: string;
    expiresInSeconds?: number;
    download?: boolean;
  }): Promise<string>;

  createSignedUrls(params: {
    tenantId: string;
    fileUploadIds: string[];
    expiresInSeconds?: number;
    download?: boolean;
  }): Promise<BatchSignedUrlResult[]>;

  deleteFile(params: {
    tenantId: string;
    fileUploadId: string;
    userId: string;
  }): Promise<void>;

  getMetadata(params: {
    tenantId: string;
    fileUploadId: string;
  }): Promise<FileUploads>;
}
