import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  privateKey: process.env.JWT_PRIVATE_KEY_BASE64 || '',
  publicKey: process.env.JWT_PUBLIC_KEY_BASE64 || '',
  accessTokenExpiresInSeconds: Number(
    process.env.JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS || 900,
  ),
  refreshTokenExpiresInDays: Number(
    process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS || 7,
  ),
  refreshCookieName: process.env.JWT_REFRESH_COOKIE_NAME || 'refresh_token',
}));
