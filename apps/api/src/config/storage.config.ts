import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  bucketName: process.env.R2_BUCKET_NAME || '',
  endpoint: process.env.R2_ENDPOINT || '',
}));
