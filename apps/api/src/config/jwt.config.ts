import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  privateKey: process.env.JWT_PRIVATE_KEY_BASE64 || '',
  publicKey: process.env.JWT_PUBLIC_KEY_BASE64 || '',
}));
