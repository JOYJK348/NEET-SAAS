import { Test, TestingModule } from '@nestjs/testing';
import { NotionController } from './notion.controller';
import { NotionIntegrationService } from './notion-integration.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { ForbiddenException } from '@nestjs/common';
import type { AuthenticatedRequestUser } from '../../auth/auth.types';

describe('NotionController', () => {
  let controller: NotionController;
  let service: any;

  const mockAdminUser: AuthenticatedRequestUser = {
    sub: 'user-admin-1',
    sessionId: 'session-123',
    roleCode: 'ADMIN',
    tenantId: 'tenant-123',
    forcePasswordChange: false,
  };

  const mockStudentUser: AuthenticatedRequestUser = {
    sub: 'user-student-1',
    sessionId: 'session-456',
    roleCode: 'STUDENT',
    tenantId: 'tenant-123',
    forcePasswordChange: false,
  };

  const mockTutorUser: AuthenticatedRequestUser = {
    sub: 'user-tutor-1',
    sessionId: 'session-789',
    roleCode: 'TUTOR',
    tenantId: 'tenant-123',
    forcePasswordChange: false,
  };

  beforeEach(async () => {
    service = {
      connect: jest.fn(),
      getStatus: jest.fn(),
      disconnect: jest.fn(),
      testConnection: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotionController],
      providers: [
        { provide: NotionIntegrationService, useValue: service },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotionController>(NotionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should delegate to service.connect when caller is ADMIN', async () => {
      const dto = {
        apiKey: 'secret_abc123',
        destinationParentPageId: 'page-123',
      };
      const expected = {
        isConnected: true,
        workspaceName: 'NEET Academy',
      };
      service.connect.mockResolvedValue(expected);

      const result = await controller.connect(mockAdminUser, dto);

      expect(service.connect).toHaveBeenCalledWith('tenant-123', dto, 'user-admin-1');
      expect(result).toEqual(expected);
    });

    it('should throw ForbiddenException when caller is STUDENT', async () => {
      const dto = {
        apiKey: 'secret_abc123',
        destinationParentPageId: 'page-123',
      };

      await expect(controller.connect(mockStudentUser, dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.connect).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when caller is TUTOR (only admin may connect)', async () => {
      const dto = {
        apiKey: 'secret_abc123',
        destinationParentPageId: 'page-123',
      };

      await expect(controller.connect(mockTutorUser, dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.connect).not.toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return connection status for user tenant when caller is ADMIN', async () => {
      const expected = { isConnected: true, workspaceName: 'NEET Academy' };
      service.getStatus.mockResolvedValue(expected);

      const result = await controller.getStatus(mockAdminUser);
      expect(service.getStatus).toHaveBeenCalledWith('tenant-123');
      expect(result).toEqual(expected);
    });

    it('should return connection status when caller is TUTOR', async () => {
      const expected = { isConnected: true, workspaceName: 'NEET Academy' };
      service.getStatus.mockResolvedValue(expected);

      const result = await controller.getStatus(mockTutorUser);
      expect(service.getStatus).toHaveBeenCalledWith('tenant-123');
      expect(result).toEqual(expected);
    });

    it('should throw ForbiddenException when caller is STUDENT', async () => {
      await expect(controller.getStatus(mockStudentUser)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.getStatus).not.toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should delegate to service.disconnect when caller is ADMIN', async () => {
      service.disconnect.mockResolvedValue({ success: true });

      const result = await controller.disconnect(mockAdminUser);
      expect(service.disconnect).toHaveBeenCalledWith('tenant-123', 'user-admin-1');
      expect(result).toEqual({ success: true });
    });

    it('should throw ForbiddenException when caller is TUTOR (only admin may disconnect)', async () => {
      await expect(controller.disconnect(mockTutorUser)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.disconnect).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when caller is STUDENT', async () => {
      await expect(controller.disconnect(mockStudentUser)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.disconnect).not.toHaveBeenCalled();
    });
  });

  describe('testConnection', () => {
    it('should delegate to service.testConnection when caller is ADMIN', async () => {
      const expected = { success: true, message: 'Valid' };
      service.testConnection.mockResolvedValue(expected);

      const result = await controller.testConnection(mockAdminUser);
      expect(service.testConnection).toHaveBeenCalledWith('tenant-123');
      expect(result).toEqual(expected);
    });

    it('should delegate to service.testConnection when caller is TUTOR', async () => {
      const expected = { success: true, message: 'Valid' };
      service.testConnection.mockResolvedValue(expected);

      const result = await controller.testConnection(mockTutorUser);
      expect(service.testConnection).toHaveBeenCalledWith('tenant-123');
      expect(result).toEqual(expected);
    });

    it('should throw ForbiddenException when caller is STUDENT', async () => {
      await expect(controller.testConnection(mockStudentUser)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.testConnection).not.toHaveBeenCalled();
    });
  });
});
