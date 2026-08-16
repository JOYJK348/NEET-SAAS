import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { LiveClassWebhookService } from '../services/live-class-webhook.service';

@ApiTags('Live Classes (Webhooks)')
@Controller('live-classes/webhook')
export class LiveClassWebhookController {
  constructor(
    private readonly webhookService: LiveClassWebhookService,
  ) {}

  /**
   * LiveKit → API webhook. Public by design (no JWT guard) — the HMAC/signature
   * is verified inside the service via WebhookReceiver before any state changes.
   * Configure LiveKit Cloud webhooks to POST to /api/v1/live-classes/webhook/livekit.
   */
  @Post('livekit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'LiveKit webhook receiver for the recording lifecycle',
  })
  async livekitWebhook(
    @Req() req: Request,
    @Headers('authorization') authHeader?: string,
  ) {
    const rawBody = (req as any).rawBody as string;
    return this.webhookService.handleEvent(rawBody, authHeader);
  }
}
