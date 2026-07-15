import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  enabled: process.env.REDIS_HOST ? true : false,
  host: process.env.REDIS_HOST || '',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
}));
