import { FileModuleEnum, BucketTypeEnum } from '@prisma/client';

export function buildStoragePath(
  tenantId: string,
  moduleCode: FileModuleEnum,
  storedFileName: string,
  uploadDate: Date = new Date(),
): string {
  const year = uploadDate.getFullYear();
  const month = String(uploadDate.getMonth() + 1).padStart(2, '0');
  return `tenants/${tenantId}/${moduleCode.toLowerCase()}/${year}/${month}/${storedFileName}`;
}

export function getBucketName(bucket: BucketTypeEnum): string {
  const map: Record<BucketTypeEnum, string> = {
    PRIVATE: process.env.SUPABASE_STORAGE_PRIVATE_BUCKET ?? 'private-files',
    PUBLIC: 'public-assets',
  };
  return map[bucket];
}
