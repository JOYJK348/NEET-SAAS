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
}));
