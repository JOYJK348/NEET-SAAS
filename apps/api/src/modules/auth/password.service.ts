import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  async comparePassword(
    plainText: string,
    passwordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainText, passwordHash);
  }
}
