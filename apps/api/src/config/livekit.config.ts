import { registerAs } from '@nestjs/config';

export default registerAs('livekit', () => ({
  apiKey: process.env.LIVEKIT_API_KEY || '',
  apiSecret: process.env.LIVEKIT_API_SECRET || '',
  wsUrl: process.env.LIVEKIT_URL || '',
  webhookSecret: process.env.LIVEKIT_WEBHOOK_SECRET || '',
  /** Supabase bucket for compressed recordings */
  recordingsBucket:
    process.env.SUPABASE_STORAGE_LIVE_RECORDINGS_BUCKET ||
    'live-class-recordings',
  /** Supabase S3-compatible credentials — LiveKit Egress writes MP4s directly to this endpoint */
  egressS3: {
    accessKey: process.env.SUPABASE_S3_ACCESS_KEY || '',
    secretKey: process.env.SUPABASE_S3_SECRET_KEY || '',
    endpoint: process.env.SUPABASE_S3_ENDPOINT || '',
    region: process.env.SUPABASE_S3_REGION || 'us-east-1',
  },
}));
