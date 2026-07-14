import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  JWT_PRIVATE_KEY_BASE64: z.string().optional().default(''),
  JWT_PUBLIC_KEY_BASE64: z.string().optional().default(''),
  RESEND_API_KEY: z.string().optional().default(''),
  R2_ACCESS_KEY_ID: z.string().optional().default(''),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(''),
  R2_BUCKET_NAME: z.string().optional().default(''),
  R2_ENDPOINT: z.string().url().optional().or(z.string().length(0)),
  JITSI_SECRET_KEY: z.string().optional().default(''),
  JITSI_APP_ID: z.string().optional().default(''),
  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
});

export type Env = z.infer<typeof EnvSchema>;

export function validate(config: Record<string, unknown>) {
  const result = EnvSchema.safeParse(config);

  if (!result.success) {
    /* eslint-disable no-console */
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    /* eslint-enable no-console */
    throw new Error('Environment validation failed');
  }

  return result.data;
}
