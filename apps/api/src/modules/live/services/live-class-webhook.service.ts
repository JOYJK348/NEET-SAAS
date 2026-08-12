import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookReceiver } from 'livekit-server-sdk';
import { PrismaService } from '../../../common/prisma/prisma.service';

/**
 * Verifies and processes LiveKit webhook events for the live-class recording
 * lifecycle:
 *   - egress_started / egress_ended / egress_failed  → recording status pipeline
 *   - room_started / room_finished                   → session sync (best-effort)
 *
 * Auth note: `WebhookReceiver` (livekit-server-sdk 2.x) verifies the JWT in the
 * `Authorization` header that LiveKit signs with the API key/secret — it does NOT
 * take a separate webhook secret. The `LIVEKIT_WEBHOOK_SECRET` env var is
 * therefore not consumed by this SDK version.
 */
@Injectable()
export class LiveClassWebhookService {
  private readonly logger = new Logger(LiveClassWebhookService.name);
  private readonly receiver: WebhookReceiver | null = null;
  private readonly recordingsBucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const apiKey =
      this.configService.get<string>('livekit.apiKey') ||
      process.env.LIVEKIT_API_KEY ||
      '';
    const apiSecret =
      this.configService.get<string>('livekit.apiSecret') ||
      process.env.LIVEKIT_API_SECRET ||
      '';
    this.recordingsBucket =
      this.configService.get<string>('livekit.recordingsBucket') ||
      process.env.SUPABASE_STORAGE_LIVE_RECORDINGS_BUCKET ||
      'live-class-recordings';

    if (apiKey && apiSecret) {
      this.receiver = new WebhookReceiver(apiKey, apiSecret);
    }
  }

  async handleEvent(
    rawBody: string,
    authHeader?: string,
  ): Promise<{ event: string }> {
    if (!this.receiver) {
      throw new UnauthorizedException('LiveKit webhook not configured');
    }

    let event: any;
    try {
      event = await this.receiver.receive(rawBody, authHeader);
    } catch (err) {
      this.logger.warn(
        `LiveKit webhook verification failed: ${err instanceof Error ? err.message : err}`,
      );
      throw new UnauthorizedException('Invalid LiveKit webhook signature');
    }

    const eventName = event?.event as string;
    this.logger.log(`LiveKit webhook received: ${eventName}`);

    try {
      switch (eventName) {
        case 'egress_started':
          await this.handleEgressStarted(event.egressInfo);
          break;
        case 'egress_ended':
          await this.handleEgressEnded(event.egressInfo);
          break;
        case 'egress_failed':
          await this.handleEgressFailed(event.egressInfo);
          break;
        case 'room_started':
          await this.handleRoomStarted(event.room);
          break;
        case 'room_finished':
          await this.handleRoomFinished(event.room);
          break;
        default:
          this.logger.debug(`Ignoring unhandled LiveKit webhook event: ${eventName}`);
      }
    } catch (err) {
      // A webhook processing failure must not crash the request — LiveKit retries.
      this.logger.error(
        `Failed to process LiveKit webhook ${eventName}: ${err instanceof Error ? err.message : err}`,
      );
    }

    return { event: eventName };
  }

  // ─── Egress handlers ──────────────────────────────────────────────────────

  private async handleEgressStarted(egressInfo: any): Promise<void> {
    if (!egressInfo?.egressId) return;
    await this.prisma.liveClassRecordings.updateMany({
      where: { egressId: egressInfo.egressId },
      data: { status: 'RECORDING', updatedBy: 'system' },
    });
  }

  private async handleEgressEnded(egressInfo: any): Promise<void> {
    if (!egressInfo?.egressId) return;

    const fileInfo = egressInfo.fileResults?.[0];
    const location = fileInfo?.location || '';

    await this.prisma.liveClassRecordings.updateMany({
      where: { egressId: egressInfo.egressId },
      data: {
        status: 'READY',
        durationSeconds:
          fileInfo?.duration != null ? Number(fileInfo.duration) : undefined,
        fileSizeBytes: fileInfo?.size != null ? BigInt(fileInfo.size) : undefined,
        resolution: '720p', // we always request H264_720P_30 at egress start
        storageObjectId: location
          ? this.extractObjectKey(location, this.recordingsBucket)
          : undefined,
        rawEgressUrl: location || undefined,
        processingCompletedAt: new Date(),
        updatedBy: 'system',
      },
    });
  }

  private async handleEgressFailed(egressInfo: any): Promise<void> {
    if (!egressInfo?.egressId) return;
    if (egressInfo.error) {
      this.logger.error(
        `LiveKit egress failed (${egressInfo.egressId}): ${egressInfo.error}`,
      );
    }
    await this.prisma.liveClassRecordings.updateMany({
      where: { egressId: egressInfo.egressId },
      data: { status: 'FAILED', updatedBy: 'system' },
    });
  }

  // ─── Room handlers (best-effort session sync) ────────────────────────────

  private async handleRoomStarted(room: any): Promise<void> {
    const roomName = room?.name;
    if (!roomName) return;
    await this.prisma.liveClassSessions.updateMany({
      where: { providerSessionId: roomName, status: 'CREATED' },
      data: { status: 'STARTED', startedAt: new Date(), updatedBy: 'system' },
    });
  }

  private async handleRoomFinished(room: any): Promise<void> {
    const roomName = room?.name;
    if (!roomName) return;
    const now = new Date();
    await this.prisma.liveClassSessions.updateMany({
      where: {
        providerSessionId: roomName,
        status: { in: ['CREATED', 'STARTED'] },
      },
      data: {
        status: 'ENDED',
        endedAt: now,
        endedReason: 'COMPLETED',
        updatedBy: 'system',
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Derives the S3 object key from the egress file location. `location` may be
   * a full URL (`.../s3/{bucket}/tenants/.../x.mp4`) or already the bare path.
   */
  private extractObjectKey(location: string, bucket: string): string {
    const marker = `/${bucket}/`;
    const idx = location.indexOf(marker);
    if (idx >= 0) {
      return location.slice(idx + marker.length);
    }
    return location;
  }
}
