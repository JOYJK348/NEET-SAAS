import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EncryptionService } from '../../../common/security/encryption.service';
import { NotionClientService } from './notion-client.service';
import {
  ConnectNotionDto,
  NotionConnectionConfig,
  NotionConnectionStatusDto,
} from './notion.types';

@Injectable()
export class NotionIntegrationService {
  private readonly logger = new Logger(NotionIntegrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly notionClient: NotionClientService,
  ) {}

  /**
   * Connects and validates a Notion integration for a tenant.
   * Encrypts API token at rest with AES-256-GCM.
   */
  async connect(
    tenantId: string,
    dto: ConnectNotionDto,
    userId: string,
  ): Promise<NotionConnectionStatusDto> {
    if (!dto.apiKey || !dto.apiKey.trim()) {
      throw new BadRequestException('Notion API Key (Integration Secret) is required');
    }
    if (!dto.destinationParentPageId || !dto.destinationParentPageId.trim()) {
      throw new BadRequestException('Destination Parent Page ID is required');
    }

    const cleanKey = dto.apiKey.trim();
    const cleanParentId = dto.destinationParentPageId.trim();

    // 1. Verify token with Notion API
    let botInfo: { botId: string; botName: string; workspaceName?: string };
    try {
      botInfo = await this.notionClient.validateConnection(cleanKey);
    } catch (err: any) {
      this.logger.error(`Failed to validate Notion token: ${err.message}`);
      throw new BadRequestException(
        `Failed to authenticate with Notion: ${err.message || 'Invalid API key or insufficient permissions'}`,
      );
    }

    // 2. Verify destination parent page access
    let pageInfo: { id: string; title: string; url: string };
    try {
      pageInfo = await this.notionClient.verifyParentPageAccess(cleanKey, cleanParentId);
    } catch (err: any) {
      this.logger.error(`Failed to verify Notion parent page: ${err.message}`);
      throw new BadRequestException(
        `Could not access parent page: Ensure page ID is correct and integration is invited/added as a connection to the page. (${err.message})`,
      );
    }

    // 3. Encrypt API key with AES-256-GCM
    const apiKeyEncrypted = this.encryption.encrypt(cleanKey);

    const config: NotionConnectionConfig = {
      workspaceName: botInfo.workspaceName,
      botId: botInfo.botId,
      apiKeyEncrypted,
      destinationParentPageId: pageInfo.id,
      destinationParentPageTitle: pageInfo.title,
      destinationParentPageUrl: pageInfo.url,
      connectedAt: new Date().toISOString(),
      connectedBy: userId,
      isActive: true,
    };

    // 4. Upsert TenantSettings
    const existing = await this.prisma.tenantSettings.findFirst({
      where: { tenantId, deletedAt: null },
    });

    if (existing) {
      const currentBranding = (existing.brandingConfig as Record<string, any>) || {};
      const updatedBranding = {
        ...currentBranding,
        notionIntegration: config,
      };

      await this.prisma.tenantSettings.update({
        where: { id: existing.id },
        data: {
          brandingConfig: updatedBranding as unknown as Prisma.InputJsonValue,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });
    } else {
      await this.prisma.tenantSettings.create({
        data: {
          tenantId,
          brandingConfig: { notionIntegration: config } as unknown as Prisma.InputJsonValue,
          passwordPolicy: {},
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    this.logger.log(
      `Tenant ${tenantId} connected to Notion workspace "${botInfo.workspaceName}" (Page: ${pageInfo.title})`,
    );

    return {
      isConnected: true,
      workspaceName: botInfo.workspaceName,
      botId: botInfo.botId,
      destinationParentPageId: pageInfo.id,
      destinationParentPageTitle: pageInfo.title,
      destinationParentPageUrl: pageInfo.url,
      connectedAt: config.connectedAt,
    };
  }

  /**
   * Retrieves connection status for a tenant (never leaks encrypted or plain token).
   */
  async getStatus(tenantId: string): Promise<NotionConnectionStatusDto> {
    const settings = await this.prisma.tenantSettings.findFirst({
      where: { tenantId, deletedAt: null },
    });

    const branding = (settings?.brandingConfig as Record<string, any>) || {};
    const config: NotionConnectionConfig | undefined = branding.notionIntegration;

    if (config && config.isActive && config.apiKeyEncrypted) {
      return {
        isConnected: true,
        workspaceName: config.workspaceName,
        botId: config.botId,
        destinationParentPageId: config.destinationParentPageId,
        destinationParentPageTitle: config.destinationParentPageTitle,
        destinationParentPageUrl: config.destinationParentPageUrl,
        connectedAt: config.connectedAt,
      };
    }

    // Check platform default credentials
    const defaultKey = (
      process.env.NOTION_DEFAULT_API_KEY ||
      process.env.NOTION_API_KEY ||
      ''
    ).trim();
    const defaultParentId = (
      process.env.NOTION_DEFAULT_PARENT_PAGE_ID ||
      process.env.NOTION_PARENT_PAGE_ID ||
      ''
    ).trim();

    if (defaultKey && defaultParentId) {
      return {
        isConnected: true,
        workspaceName: 'Platform Central Notion (Default)',
        destinationParentPageId: defaultParentId,
        destinationParentPageTitle: 'Platform Master Notes',
      };
    }

    return { isConnected: false };
  }

  /**
   * Disconnects Notion integration for a tenant.
   */
  async disconnect(tenantId: string, userId: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.tenantSettings.findFirst({
      where: { tenantId, deletedAt: null },
    });

    if (existing) {
      const currentBranding = (existing.brandingConfig as Record<string, any>) || {};
      const updatedBranding = {
        ...currentBranding,
        notionIntegration: {
          ...currentBranding.notionIntegration,
          isActive: false,
          disconnectedAt: new Date().toISOString(),
          disconnectedBy: userId,
        },
      };

      await this.prisma.tenantSettings.update({
        where: { id: existing.id },
        data: {
          brandingConfig: updatedBranding as unknown as Prisma.InputJsonValue,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });
    }

    this.logger.log(`Tenant ${tenantId} disconnected Notion integration`);
    return { success: true };
  }

  /**
   * Tests connection with Notion API using stored encrypted token.
   */
  async testConnection(tenantId: string): Promise<{
    success: boolean;
    message: string;
    workspaceName?: string;
    pageTitle?: string;
  }> {
    const config = await this.getConfig(tenantId);
    if (!config || !config.isActive) {
      return {
        success: false,
        message: 'Notion integration is not configured or is inactive for this institute.',
      };
    }

    try {
      const bot = await this.notionClient.validateConnection(config.apiKey);
      const page = await this.notionClient.verifyParentPageAccess(
        config.apiKey,
        config.destinationParentPageId,
      );

      return {
        success: true,
        message: `Successfully connected to Notion workspace "${bot.workspaceName}" and verified access to page "${page.title}"`,
        workspaceName: bot.workspaceName,
        pageTitle: page.title,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Connection test failed: ${err.message}`,
      };
    }
  }

  /**
   * Internal method: Retrieves decrypted config for background workers.
   * Priority:
   * 1. Tenant-specific custom Notion integration (if configured in TenantSettings).
   * 2. Platform-default Notion integration (from NOTION_DEFAULT_API_KEY & NOTION_DEFAULT_PARENT_PAGE_ID env vars).
   * Returns null if neither is configured.
   */
  async getConfig(
    tenantId: string,
  ): Promise<{ apiKey: string; destinationParentPageId: string; isActive: boolean; isPlatformDefault?: boolean } | null> {
    // 1. Check tenant custom settings
    if (tenantId) {
      try {
        const settings = await this.prisma.tenantSettings.findFirst({
          where: { tenantId, deletedAt: null },
        });

        if (settings) {
          const branding = (settings.brandingConfig as Record<string, any>) || {};
          const config: NotionConnectionConfig | undefined = branding.notionIntegration;

          if (config && config.isActive && config.apiKeyEncrypted) {
            try {
              const apiKey = this.encryption.decrypt(config.apiKeyEncrypted);
              return {
                apiKey,
                destinationParentPageId: config.destinationParentPageId,
                isActive: config.isActive,
              };
            } catch (err: any) {
              this.logger.error(`Failed to decrypt Notion API key for tenant ${tenantId}: ${err.message}`);
            }
          }
        }
      } catch (dbErr: any) {
        this.logger.warn(`Could not check tenantSettings for tenant ${tenantId}: ${dbErr.message}`);
      }
    }

    // 2. Fallback to platform-default Notion credentials from environment
    const defaultKey = (
      process.env.NOTION_DEFAULT_API_KEY ||
      process.env.NOTION_API_KEY ||
      ''
    ).trim();
    const defaultParentId = (
      process.env.NOTION_DEFAULT_PARENT_PAGE_ID ||
      process.env.NOTION_PARENT_PAGE_ID ||
      ''
    ).trim();

    if (defaultKey && defaultParentId) {
      return {
        apiKey: defaultKey,
        destinationParentPageId: defaultParentId,
        isActive: true,
        isPlatformDefault: true,
      };
    }

    return null;
  }
}

