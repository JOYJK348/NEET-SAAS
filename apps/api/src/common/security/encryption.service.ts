import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const rawKey =
      this.configService.get<string>('GOOGLE_TOKEN_ENCRYPTION_KEY') ||
      process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ||
      'neet_platform_secure_32_byte_token_encryption_secret_key_v1';

    // Ensure 32-byte key length for AES-256
    this.key = crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypts plaintext string into AES-256-GCM format: ivHex:authTagHex:encryptedHex
   */
  encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts formatted AES-256-GCM string (ivHex:authTagHex:encryptedHex)
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
      }

      const [ivHex, authTagHex, cipherTextHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err: any) {
      this.logger.error('Failed to decrypt token:', err?.message);
      throw new Error('Decryption failed');
    }
  }
}
