import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  RoomServiceClient,
  AccessToken,
  EgressClient,
  EncodedFileType,
  EncodedFileOutput,
  EncodingOptionsPreset,
  S3Upload,
} from 'livekit-server-sdk';

@Injectable()
export class LiveKitService {
  private readonly logger = new Logger(LiveKitService.name);
  private roomService: RoomServiceClient | null = null;
  private egressClient: EgressClient | null = null;
  private apiKey: string;
  private apiSecret: string;
  private wsUrl: string;
  private recordingsBucket: string;
  private egressS3AccessKey: string;
  private egressS3SecretKey: string;
  private egressS3Endpoint: string;
  private egressS3Region: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('livekit.apiKey') ||
      process.env.LIVEKIT_API_KEY ||
      'APIkxqs4LtzdvXf';
    this.apiSecret =
      this.configService.get<string>('livekit.apiSecret') ||
      process.env.LIVEKIT_API_SECRET ||
      'P2CeY2WD1ZlAtHdalufTLDdSE5ebBR1F8AkSksARZMQA';
    this.wsUrl =
      this.configService.get<string>('livekit.wsUrl') ||
      process.env.LIVEKIT_URL ||
      'wss://neet-n80sqwyo.livekit.cloud';

    this.recordingsBucket =
      this.configService.get<string>('livekit.recordingsBucket') ||
      process.env.SUPABASE_STORAGE_LIVE_RECORDINGS_BUCKET ||
      'live-class-recordings';
    this.egressS3AccessKey =
      this.configService.get<string>('livekit.egressS3.accessKey') ||
      process.env.SUPABASE_S3_ACCESS_KEY ||
      '';
    this.egressS3SecretKey =
      this.configService.get<string>('livekit.egressS3.secretKey') ||
      process.env.SUPABASE_S3_SECRET_KEY ||
      '';
    this.egressS3Endpoint =
      this.configService.get<string>('livekit.egressS3.endpoint') ||
      process.env.SUPABASE_S3_ENDPOINT ||
      '';
    this.egressS3Region =
      this.configService.get<string>('livekit.egressS3.region') ||
      process.env.SUPABASE_S3_REGION ||
      'us-east-1';

    if (this.apiKey && this.apiSecret && this.wsUrl) {
      // Convert wss:// to https:// for HTTP REST client of RoomServiceClient
      const httpUrl = this.wsUrl.replace('wss://', 'https://').replace('ws://', 'http://');
      this.roomService = new RoomServiceClient(httpUrl, this.apiKey, this.apiSecret);
      this.egressClient = new EgressClient(httpUrl, this.apiKey, this.apiSecret);
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

    const apiKey = this.apiKey || 'APIkxqs4LtzdvXf';
    const apiSecret = this.apiSecret || 'P2CeY2WD1ZlAtHdalufTLDdSE5ebBR1F8AkSksARZMQA';

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

  /**
   * Starts a LiveKit RoomCompositeEgress recording for a live class.
   * Writes the MP4 directly to the Supabase bucket via its S3-compatible endpoint,
   * under the curriculum-nested path (course → subject → chapter → topic → batch).
   */
  async startRecording(params: {
    roomName: string;
    tenantId: string;
    courseId: string;
    subjectId: string;
    chapterId: string;
    topicId: string;
    batchId: string;
    liveClassId: string;
  }): Promise<{ egressId: string }> {
    if (!this.egressClient) {
      this.logger.warn('LiveKit Egress client not initialized. Skipping recording start.');
      throw new InternalServerErrorException('LiveKit Egress is not configured');
    }
    if (!this.egressS3AccessKey || !this.egressS3SecretKey || !this.egressS3Endpoint) {
      this.logger.warn('Supabase S3 credentials missing. Skipping recording start.');
      throw new InternalServerErrorException('Egress S3 storage is not configured');
    }

    const {
      roomName,
      tenantId,
      courseId,
      subjectId,
      chapterId,
      topicId,
      batchId,
      liveClassId,
    } = params;

    const filepath =
      `tenants/${tenantId}/live_recordings/${courseId}/${subjectId}/${chapterId}/${topicId}/${batchId}/${liveClassId}.mp4`;

    // Build real protobuf message instances so the request serializes correctly.
    // (@livekit/protocol is @bufbuild/protobuf — messages are constructed with `new`.)
    const fileOutput = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath,
      output: {
        case: 's3',
        value: new S3Upload({
          accessKey: this.egressS3AccessKey,
          secret: this.egressS3SecretKey,
          region: this.egressS3Region,
          endpoint: this.egressS3Endpoint,
          bucket: this.recordingsBucket,
          forcePathStyle: true,
        }),
      },
    });

    try {
      const egressInfo = await this.egressClient.startRoomCompositeEgress(
        roomName,
        { file: fileOutput },
        {
          layout: 'speaker',
          encodingOptions: EncodingOptionsPreset.H264_720P_30,
        },
      );

      this.logger.log(
        `LiveKit egress started for ${roomName}: egressId=${egressInfo.egressId} -> ${filepath}`,
      );
      return { egressId: egressInfo.egressId };
    } catch (error) {
      this.logger.error(
        `Failed to start LiveKit egress for ${roomName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new InternalServerErrorException(
        `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Stops an in-flight egress recording so it finalizes (uploads) before the room is deleted.
   */
  async stopRecording(egressId: string): Promise<void> {
    if (!this.egressClient) {
      this.logger.warn('LiveKit Egress client not initialized. Skipping recording stop.');
      return;
    }

    try {
      await this.egressClient.stopEgress(egressId);
      this.logger.log(`LiveKit egress stopped: ${egressId}`);
    } catch (error) {
      this.logger.warn(
        `Failed to stop egress ${egressId} (may already be finalized): ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
