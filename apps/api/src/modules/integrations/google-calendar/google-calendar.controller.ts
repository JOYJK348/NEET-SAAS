import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GoogleAuthService } from './google-auth.service';
import { CalendarSyncService } from './calendar-sync.service';

@ApiTags('Integrations - Google Calendar')
@Controller({ path: 'integrations/google-calendar', version: '1' })
export class GoogleCalendarController {
  constructor(
    private readonly googleAuthService: GoogleAuthService,
    private readonly calendarSyncService: CalendarSyncService,
  ) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate Google OAuth 2.0 Consent URL with CSRF state protection' })
  async getAuthUrl(@Req() req: any) {
    const tenantId = req.user?.tenantId || 'review-academy';
    const userId = req.user?.sub || req.user?.id;

    const url = await this.googleAuthService.generateAuthUrl(tenantId, userId);
    return { url };
  }

  @Get('callback')
  @ApiOperation({ summary: 'Google OAuth 2.0 Callback handler' })
  async handleCallback(
    @Req() req: any,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: any,
  ) {
    const rawHost = req.headers?.host || 'localhost:3000';
    const hostname = rawHost.split(':')[0];
    const frontendBase =
      process.env.FRONTEND_URL ||
      process.env.WEB_APP_URL ||
      `http://${hostname}:3001`;

    try {
      const result = await this.googleAuthService.handleCallback(code, state);

      // Trigger automatic background sync of all upcoming classes for newly connected user
      if (result.tenantId && result.userId) {
        this.calendarSyncService.syncUserUpcomingClasses(result.tenantId, result.userId);
      }

      // Redirect to Next.js frontend web app integration page with success state
      const redirectUrl = `${frontendBase}/dashboard/settings/integrations/google-calendar?status=success&email=${encodeURIComponent(result.email || '')}`;
      return res.redirect(redirectUrl);
    } catch (err: any) {
      const redirectUrl = `${frontendBase}/dashboard/settings/integrations/google-calendar?status=error&message=${encodeURIComponent(err?.message || 'Authorization failed')}`;
      return res.redirect(redirectUrl);
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current Google Calendar connection status' })
  async getStatus(@Req() req: any) {
    const tenantId = req.user?.tenantId || 'review-academy';
    const userId = req.user?.sub || req.user?.id;

    return this.googleAuthService.getConnectionStatus(tenantId, userId);
  }

  @Patch('opt-in')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle Student Auto-Sync Opt-In setting' })
  async toggleOptIn(@Req() req: any, @Body('autoSyncClasses') autoSyncClasses: boolean) {
    const tenantId = req.user?.tenantId || 'review-academy';
    const userId = req.user?.sub || req.user?.id;

    const res = await this.googleAuthService.toggleAutoSync(userId, Boolean(autoSyncClasses));
    if (autoSyncClasses) {
      this.calendarSyncService.syncUserUpcomingClasses(tenantId, userId);
    }
    return res;
  }

  @Post('disconnect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Google Calendar' })
  async disconnect(@Req() req: any) {
    const tenantId = req.user?.tenantId || 'review-academy';
    const userId = req.user?.sub || req.user?.id;

    return this.googleAuthService.disconnect(tenantId, userId);
  }

  @Post('test-notification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send test notification event to Google Calendar & print log to backend console' })
  async sendTestNotification(@Req() req: any) {
    const tenantId = req.user?.tenantId || 'review-academy';
    const userId = req.user?.sub || req.user?.id;

    return this.calendarSyncService.sendTestNotification(tenantId, userId);
  }
}
