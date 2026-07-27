import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  privateKey: process.env.JWT_PRIVATE_KEY_BASE64 || '',
  publicKey: process.env.JWT_PUBLIC_KEY_BASE64 || '',
  accessTokenExpiresInSeconds: Number(
    process.env.JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS || 3153600000,
  ),
  refreshTokenExpiresInDays: Number(
    process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS || 36500,
  ),
  refreshCookieName: process.env.JWT_REFRESH_COOKIE_NAME || 'refresh_token',
}));
