import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { EncryptionService } from '../../../common/security/encryption.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scopes = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
  ) {
    this.clientId =
      this.configService.get<string>('GOOGLE_CLIENT_ID') ||
      process.env.GOOGLE_CLIENT_ID ||
      '';
    this.clientSecret =
      this.configService.get<string>('GOOGLE_CLIENT_SECRET') ||
      process.env.GOOGLE_CLIENT_SECRET ||
      '';
    this.redirectUri =
      this.configService.get<string>('GOOGLE_REDIRECT_URI') ||
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3000/api/v1/integrations/google-calendar/callback';
  }

  /**
   * Generates Google OAuth 2.0 Auth URL with CSRF state protection
   */
  async generateAuthUrl(tenantId: string, userId: string): Promise<string> {
    const rawState = `${tenantId}:${userId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
    const state = crypto.createHash('sha256').update(rawState).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.googleOAuthStates.create({
      data: {
        tenantId,
        userId,
        state,
        expiresAt,
      },
    });

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Processes OAuth Callback, verifies state, exchanges code for tokens, and saves encrypted connection
   */
  async handleCallback(code: string, state: string) {
    if (!code || !state) {
      throw new BadRequestException('Authorization code and state parameter are required.');
    }

    // 1. Verify CSRF state
    const storedState = await this.prisma.googleOAuthStates.findUnique({
      where: { state },
    });

    if (!storedState) {
      throw new BadRequestException('Invalid or expired OAuth state parameter.');
    }

    if (storedState.expiresAt < new Date()) {
      await this.prisma.googleOAuthStates.delete({ where: { id: storedState.id } });
      throw new BadRequestException('OAuth state has expired. Please try connecting again.');
    }

    const { tenantId, userId } = storedState;

    // Delete consumed state
    await this.prisma.googleOAuthStates.delete({ where: { id: storedState.id } });

    try {
      // 2. Exchange Code for Tokens
      const tokenRes = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      const { access_token, refresh_token, expires_in, scope } = tokenRes.data;

      // 3. Fetch Google User Email
      let googleEmail: string | undefined;
      let googleAccountId: string | undefined;

      try {
        const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        googleEmail = userInfoRes.data?.email;
        googleAccountId = userInfoRes.data?.id;
      } catch {
        /* non-fatal fallback */
      }

      const tokenExpiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);
      const accessTokenEncrypted = this.encryptionService.encrypt(access_token);
      const refreshTokenEncrypted = refresh_token
        ? this.encryptionService.encrypt(refresh_token)
        : '';

      // 4. Save Connection
      const connection = await this.prisma.googleCalendarConnections.upsert({
        where: { userId },
        create: {
          tenantId,
          userId,
          googleAccountId,
          email: googleEmail,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          tokenExpiresAt,
          scope: scope || this.scopes.join(' '),
          status: 'ACTIVE',
        },
        update: {
          googleAccountId: googleAccountId || undefined,
          email: googleEmail || undefined,
          accessTokenEncrypted,
          refreshTokenEncrypted: refreshTokenEncrypted || undefined,
          tokenExpiresAt,
          status: 'ACTIVE',
          scope: scope || this.scopes.join(' '),
        },
      });

      return {
        success: true,
        tenantId: connection.tenantId,
        userId: connection.userId,
        email: connection.email,
        message: 'Google Calendar connected successfully!',
      };
    } catch (err: any) {
      this.logger.error('Google token exchange error:', err?.response?.data || err?.message);
      throw new BadRequestException('Failed to complete Google Calendar authorization.');
    }
  }

  /**
   * Safely retrieves valid access token. Auto-refreshes if expiring, or marks REAUTH_REQUIRED if revoked.
   */
  async getValidAccessToken(connectionId: string): Promise<string | null> {
    const conn = await this.prisma.googleCalendarConnections.findUnique({
      where: { id: connectionId },
    });

    if (!conn || conn.status !== 'ACTIVE') return null;

    // Check if access token is valid (with 5-min grace window)
    const bufferWindow = 5 * 60 * 1000;
    if (conn.tokenExpiresAt.getTime() - bufferWindow > Date.now()) {
      return this.encryptionService.decrypt(conn.accessTokenEncrypted);
    }

    // Refresh Token
    if (!conn.refreshTokenEncrypted) {
      await this.prisma.googleCalendarConnections.update({
        where: { id: conn.id },
        data: { status: 'REAUTH_REQUIRED' },
      });
      return null;
    }

    try {
      const refreshToken = this.encryptionService.decrypt(conn.refreshTokenEncrypted);

      const refreshRes = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      const { access_token, expires_in } = refreshRes.data;
      const newAccessTokenEncrypted = this.encryptionService.encrypt(access_token);
      const newTokenExpiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);

      await this.prisma.googleCalendarConnections.update({
        where: { id: conn.id },
        data: {
          accessTokenEncrypted: newAccessTokenEncrypted,
          tokenExpiresAt: newTokenExpiresAt,
          status: 'ACTIVE',
        },
      });

      return access_token;
    } catch (err: any) {
      this.logger.warn(`Token refresh failed for user ${conn.userId}: marking REAUTH_REQUIRED`);
      await this.prisma.googleCalendarConnections.update({
        where: { id: conn.id },
        data: { status: 'REAUTH_REQUIRED' },
      });
      return null;
    }
  }

  /**
   * Get user connection status
   */
  async getConnectionStatus(tenantId: string, userId: string) {
    const conn = await this.prisma.googleCalendarConnections.findUnique({
      where: { userId },
      select: {
        id: true,
        email: true,
        status: true,
        autoSyncClasses: true,
        lastSyncedAt: true,
        createdAt: true,
      },
    });

    if (!conn) {
      return { connected: false, status: 'DISCONNECTED', autoSyncClasses: true };
    }

    return {
      connected: conn.status === 'ACTIVE',
      status: conn.status,
      email: conn.email,
      autoSyncClasses: conn.autoSyncClasses,
      lastSyncedAt: conn.lastSyncedAt,
      createdAt: conn.createdAt,
    };
  }

  /**
   * Toggle student opt-in auto-sync setting
   */
  async toggleAutoSync(userId: string, autoSyncClasses: boolean) {
    const conn = await this.prisma.googleCalendarConnections.findUnique({
      where: { userId },
    });

    if (!conn) throw new NotFoundException('Google Calendar connection not found');

    return this.prisma.googleCalendarConnections.update({
      where: { userId },
      data: { autoSyncClasses },
    });
  }

  /**
   * Disconnects Google Calendar
   */
  async disconnect(tenantId: string, userId: string) {
    const conn = await this.prisma.googleCalendarConnections.findUnique({
      where: { userId },
    });

    if (!conn) return { success: true };

    await this.prisma.googleCalendarConnections.update({
      where: { userId },
      data: { status: 'DISCONNECTED' },
    });

    return { success: true, message: 'Google Calendar disconnected.' };
  }
}
