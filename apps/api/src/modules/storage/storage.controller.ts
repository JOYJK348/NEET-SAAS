import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import type { AuthenticatedRequestUser } from '../auth/auth.types';
import { STORAGE_SERVICE_TOKEN } from './interfaces/storage.interface';
import type { IStorageService } from './interfaces/storage.interface';
import { UploadFileDto } from './dto/upload-file.dto';
import { BatchSignedUrlsDto } from './dto/batch-signed-urls.dto';

type MulterFile = Express.Multer.File;

@ApiTags('Storage Utility')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller({ path: 'storage', version: '1' })
export class StorageController {
  constructor(
    @Inject(STORAGE_SERVICE_TOKEN)
    private readonly storageService: IStorageService,
  ) {}

  private parseMetadata(
    rawMetadata?: string | Record<string, unknown>,
  ): Record<string, unknown> | null {
    if (!rawMetadata) return null;
    if (typeof rawMetadata === 'object') return rawMetadata;
    try {
      return JSON.parse(rawMetadata) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload file to storage bucket (Utility / Admin endpoint)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        fileType: { type: 'string', example: 'DOCUMENT' },
        moduleCode: { type: 'string', example: 'DOCUMENTS' },
        bucket: { type: 'string', example: 'PRIVATE' },
        metadata: { type: 'string', example: '{"pages":10}' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  async uploadFile(
    @UploadedFile() file: MulterFile,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    const metadata = this.parseMetadata(dto.metadata);
    const record = await this.storageService.uploadFile({
      tenantId: user.tenantId!,
      userId: user.sub,
      file,
      fileType: dto.fileType,
      moduleCode: dto.moduleCode,
      bucket: dto.bucket,
      metadata,
    });

    let signedUrl = '';
    try {
      signedUrl = await this.storageService.createSignedUrl({
        tenantId: user.tenantId!,
        fileUploadId: record.id,
      });
    } catch {
      // fallback
    }

    return {
      id: record.id,
      tenantId: record.tenantId,
      originalFileName: record.originalFileName,
      storedFileName: record.storedFileName,
      fileSizeBytes: Number(record.fileSizeBytes),
      mimeType: record.mimeType,
      metadata: record.metadata,
      fileType: record.fileType,
      moduleCode: record.moduleCode,
      bucket: record.bucket,
      signedUrl,
      fileUrl: signedUrl,
      storagePath: record.storedFileName,
    };
  }

  @Put(':fileUploadId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Safely replace existing file upload in-place' })
  @ApiResponse({ status: 200, description: 'File replaced successfully' })
  async replaceFile(
    @Param('fileUploadId') fileUploadId: string,
    @UploadedFile() file: MulterFile,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    const metadata = this.parseMetadata(dto.metadata);
    const record = await this.storageService.replaceFile({
      tenantId: user.tenantId!,
      fileUploadId,
      userId: user.sub,
      file,
      metadata,
    });

    let signedUrl = '';
    try {
      signedUrl = await this.storageService.createSignedUrl({
        tenantId: user.tenantId!,
        fileUploadId: record.id,
      });
    } catch {
      // fallback
    }

    return {
      id: record.id,
      tenantId: record.tenantId,
      originalFileName: record.originalFileName,
      storedFileName: record.storedFileName,
      fileSizeBytes: Number(record.fileSizeBytes),
      mimeType: record.mimeType,
      metadata: record.metadata,
      fileType: record.fileType,
      moduleCode: record.moduleCode,
      bucket: record.bucket,
      signedUrl,
      fileUrl: signedUrl,
      storagePath: record.storedFileName,
    };
  }

  @Get(':fileUploadId/url')
  @ApiOperation({ summary: 'Generate temporary signed URL for file access' })
  @ApiResponse({
    status: 200,
    description: 'Returns temporary signed URL string',
  })
  async getSignedUrl(
    @Param('fileUploadId') fileUploadId: string,
    @Query('expiresIn', new ParseIntPipe({ optional: true }))
    expiresIn?: number,
    @Query('download') download?: boolean,
    @CurrentUser() user?: AuthenticatedRequestUser,
  ) {
    const url = await this.storageService.createSignedUrl({
      tenantId: user!.tenantId!,
      fileUploadId,
      expiresInSeconds: expiresIn,
      download: String(download) === 'true' || download === true,
    });
    return { signedUrl: url };
  }

  @Post('batch-urls')
  @ApiOperation({
    summary: 'Generate signed URLs for multiple file IDs in one batch call',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns array of file ID & signed URL objects',
  })
  getBatchSignedUrls(
    @Body() dto: BatchSignedUrlsDto,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    return this.storageService.createSignedUrls({
      tenantId: user.tenantId!,
      fileUploadIds: dto.fileUploadIds,
      expiresInSeconds: dto.expiresInSeconds,
      download: dto.download,
    });
  }

  @Delete(':fileUploadId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete file from physical storage and soft-delete DB record',
  })
  @ApiResponse({ status: 204, description: 'File deleted' })
  async deleteFile(
    @Param('fileUploadId') fileUploadId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    await this.storageService.deleteFile({
      tenantId: user.tenantId!,
      fileUploadId,
      userId: user.sub,
    });
  }

  @Get(':fileUploadId/metadata')
  @ApiOperation({ summary: 'Get metadata for a specific file upload' })
  @ApiResponse({
    status: 200,
    description: 'Returns FileUploads database record',
  })
  async getMetadata(
    @Param('fileUploadId') fileUploadId: string,
    @CurrentUser() user: AuthenticatedRequestUser,
  ) {
    const record = await this.storageService.getMetadata({
      tenantId: user.tenantId!,
      fileUploadId,
    });
    return {
      ...record,
      fileSizeBytes: Number(record.fileSizeBytes),
    };
  }
}
