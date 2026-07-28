import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  bucketName: process.env.R2_BUCKET_NAME || '',
  endpoint: process.env.R2_ENDPOINT || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabasePrivateBucket:
    process.env.SUPABASE_STORAGE_PRIVATE_BUCKET || 'private-files',
}));
