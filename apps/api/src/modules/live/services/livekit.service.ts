import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';

@Injectable()
export class LiveKitService {
  private readonly logger = new Logger(LiveKitService.name);
  private roomService: RoomServiceClient | null = null;
  private apiKey: string;
  private apiSecret: string;
  private wsUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('livekit.apiKey') ||
      process.env.LIVEKIT_API_KEY ||
      '';
    this.apiSecret =
      this.configService.get<string>('livekit.apiSecret') ||
      process.env.LIVEKIT_API_SECRET ||
      '';
    this.wsUrl =
      this.configService.get<string>('livekit.wsUrl') ||
      process.env.LIVEKIT_URL ||
      '';

    if (this.apiKey && this.apiSecret && this.wsUrl) {
      // Convert wss:// to https:// for HTTP REST client of RoomServiceClient
      const httpUrl = this.wsUrl.replace('wss://', 'https://').replace('ws://', 'http://');
      this.roomService = new RoomServiceClient(httpUrl, this.apiKey, this.apiSecret);
    }
  }

  /**
   * Creates or gets a LiveKit room
   */
  async createRoom(roomName: string, emptyTimeoutSeconds = 1800): Promise<void> {
    if (!this.roomService) {
      this.logger.warn('LiveKit credentials missing. Skipping LiveKit room creation.');
      return;
    }

    try {
      await this.roomService.createRoom({
        name: roomName,
        emptyTimeout: emptyTimeoutSeconds, // 30 mins timeout if empty
        maxParticipants: 500,
      });
      this.logger.log(`LiveKit room created: ${roomName}`);
    } catch (error) {
      this.logger.error(
        `Failed to create LiveKit room ${roomName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new InternalServerErrorException(
        `LiveKit room creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Generates a JWT join token for a participant
   */
  async generateToken(params: {
    roomName: string;
    identity: string;
    name: string;
    isTeacher: boolean;
  }): Promise<string> {
    const { roomName, identity, name, isTeacher } = params;

    const apiKey = this.apiKey || 'devkey';
    const apiSecret = this.apiSecret || 'secretsecretsecretsecretsecretsecretsecret';

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      ttl: '4h', // 4 hours valid session
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true, // both teacher and student can publish mic/cam (or teacher controls mic)
      canSubscribe: true,
      canPublishData: true, // chat & whiteboard sync
      roomAdmin: isTeacher, // teacher is room admin
    });

    return await at.toJwt();
  }

  /**
   * Closes and deletes a room
   */
  async deleteRoom(roomName: string): Promise<void> {
    if (!this.roomService) return;

    try {
      await this.roomService.deleteRoom(roomName);
      this.logger.log(`LiveKit room deleted: ${roomName}`);
    } catch (error) {
      this.logger.warn(`Failed to delete room ${roomName} (might already be closed): ${error}`);
    }
  }
}
