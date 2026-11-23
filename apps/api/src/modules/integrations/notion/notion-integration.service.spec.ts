import { NotionIntegrationService } from './notion-integration.service';
import { BadRequestException } from '@nestjs/common';

describe('NotionIntegrationService', () => {
  let service: NotionIntegrationService;
  let prisma: any;
  let encryption: any;
  let notionClient: any;

  const tenantId = 'tenant-123';
  const userId = 'user-admin-1';
  const plainApiKey = 'secret_test_notion_key_abc';
  const encryptedApiKey = 'iv123:tag123:encrypted123';
  const parentPageId = 'parent-page-uuid-123';

  beforeEach(() => {
    prisma = {
      tenantSettings: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    encryption = {
      encrypt: jest.fn().mockReturnValue(encryptedApiKey),
      decrypt: jest.fn().mockReturnValue(plainApiKey),
    };

    notionClient = {
      validateConnection: jest.fn().mockResolvedValue({
        botId: 'bot-123',
        botName: 'NEET Bot',
        workspaceName: 'Apex Medical Academy',
      }),
      verifyParentPageAccess: jest.fn().mockResolvedValue({
        id: parentPageId,
        title: 'NEET Master Library',
        url: 'https://notion.so/apex/master-library',
      }),
    };

    service = new NotionIntegrationService(prisma, encryption, notionClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should validate credentials, encrypt token, upsert TenantSettings, and return sanitized status', async () => {
      prisma.tenantSettings.findFirst.mockResolvedValue(null);
      prisma.tenantSettings.create.mockResolvedValue({ id: 'ts-1' });

      const result = await service.connect(
        tenantId,
        { apiKey: plainApiKey, destinationParentPageId: parentPageId },
        userId,
      );

      expect(notionClient.validateConnection).toHaveBeenCalledWith(plainApiKey);
      expect(notionClient.verifyParentPageAccess).toHaveBeenCalledWith(plainApiKey, parentPageId);
      expect(encryption.encrypt).toHaveBeenCalledWith(plainApiKey);

      expect(prisma.tenantSettings.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            brandingConfig: expect.objectContaining({
              notionIntegration: expect.objectContaining({
                apiKeyEncrypted: encryptedApiKey,
                workspaceName: 'Apex Medical Academy',
                destinationParentPageId: parentPageId,
                isActive: true,
              }),
            }),
          }),
        }),
      );

      // Verify token is never leaked in return object
      expect(result).toEqual({
        isConnected: true,
        workspaceName: 'Apex Medical Academy',
        botId: 'bot-123',
        destinationParentPageId: parentPageId,
        destinationParentPageTitle: 'NEET Master Library',
        destinationParentPageUrl: 'https://notion.so/apex/master-library',
        connectedAt: expect.any(String),
      });
      expect((result as any).apiKey).toBeUndefined();
      expect((result as any).apiKeyEncrypted).toBeUndefined();
    });

    it('should throw BadRequestException if API key is missing', async () => {
      await expect(
        service.connect(tenantId, { apiKey: '', destinationParentPageId: parentPageId }, userId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if parent page validation fails', async () => {
      notionClient.verifyParentPageAccess.mockRejectedValue(new Error('Page not found or bot not invited'));

      await expect(
        service.connect(tenantId, { apiKey: plainApiKey, destinationParentPageId: parentPageId }, userId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatus', () => {
    it('should return isConnected: false if tenantSettings does not exist', async () => {
      prisma.tenantSettings.findFirst.mockResolvedValue(null);

      const status = await service.getStatus(tenantId);
      expect(status).toEqual({ isConnected: false });
    });

    it('should return connection metadata if integration is configured and active', async () => {
      prisma.tenantSettings.findFirst.mockResolvedValue({
        brandingConfig: {
          notionIntegration: {
            isActive: true,
            apiKeyEncrypted: encryptedApiKey,
            workspaceName: 'Apex Medical Academy',
            destinationParentPageId: parentPageId,
            destinationParentPageTitle: 'NEET Master Library',
            connectedAt: '2026-11-23T08:00:00.000Z',
          },
        },
      });

      const status = await service.getStatus(tenantId);
      expect(status.isConnected).toBe(true);
      expect(status.workspaceName).toBe('Apex Medical Academy');
      expect((status as any).apiKeyEncrypted).toBeUndefined();
    });
  });

  describe('disconnect', () => {
    it('should set isActive: false on tenant brandingConfig', async () => {
      prisma.tenantSettings.findFirst.mockResolvedValue({
        id: 'ts-1',
        brandingConfig: {
          notionIntegration: {
            isActive: true,
            apiKeyEncrypted: encryptedApiKey,
          },
        },
      });

      const result = await service.disconnect(tenantId, userId);
      expect(result).toEqual({ success: true });
      expect(prisma.tenantSettings.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ts-1' },
          data: expect.objectContaining({
            brandingConfig: expect.objectContaining({
              notionIntegration: expect.objectContaining({
                isActive: false,
                disconnectedBy: userId,
              }),
            }),
          }),
        }),
      );
    });
  });

  describe('getConfig', () => {
    it('should return decrypted API key and destination page ID for background sync worker', async () => {
      prisma.tenantSettings.findFirst.mockResolvedValue({
        brandingConfig: {
          notionIntegration: {
            isActive: true,
            apiKeyEncrypted: encryptedApiKey,
            destinationParentPageId: parentPageId,
          },
        },
      });

      const config = await service.getConfig(tenantId);

      expect(encryption.decrypt).toHaveBeenCalledWith(encryptedApiKey);
      expect(config).toEqual({
        apiKey: plainApiKey,
        destinationParentPageId: parentPageId,
        isActive: true,
      });
    });

    it('should return null if integration is inactive and no default env exists', async () => {
      delete process.env.NOTION_DEFAULT_API_KEY;
      delete process.env.NOTION_API_KEY;
      delete process.env.NOTION_DEFAULT_PARENT_PAGE_ID;
      delete process.env.NOTION_PARENT_PAGE_ID;

      prisma.tenantSettings.findFirst.mockResolvedValue({
        brandingConfig: {
          notionIntegration: {
            isActive: false,
            apiKeyEncrypted: encryptedApiKey,
          },
        },
      });

      const config = await service.getConfig(tenantId);
      expect(config).toBeNull();
    });

    it('should fallback to platform default credentials when tenant has no custom integration', async () => {
      process.env.NOTION_DEFAULT_API_KEY = 'secret_platform_default_key_123';
      process.env.NOTION_DEFAULT_PARENT_PAGE_ID = 'platform-default-parent-page-456';

      prisma.tenantSettings.findFirst.mockResolvedValue(null);

      const config = await service.getConfig(tenantId);
      expect(config).toEqual({
        apiKey: 'secret_platform_default_key_123',
        destinationParentPageId: 'platform-default-parent-page-456',
        isActive: true,
        isPlatformDefault: true,
      });

      // Cleanup
      delete process.env.NOTION_DEFAULT_API_KEY;
      delete process.env.NOTION_DEFAULT_PARENT_PAGE_ID;
    });
  });
});

