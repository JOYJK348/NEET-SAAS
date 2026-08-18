import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// cost 8  → ~80ms  (production - fast enough, still secure for a private app)
// cost 10 → ~300ms (development default)
const SALT_ROUNDS = process.env.NODE_ENV === 'production' ? 8 : 10;

@Injectable()
export class PasswordService {
  async comparePassword(
    plainText: string,
    passwordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainText, passwordHash);
  }

  async hashPassword(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  }
}
