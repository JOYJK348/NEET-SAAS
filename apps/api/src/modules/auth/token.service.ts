import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { Response } from 'express';
import type { AccessTokenPayload, AuthTokenPair } from './auth.types';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      algorithm: 'RS256',
      privateKey: this.getPrivateKey(),
      expiresIn: this.getAccessTokenExpiresIn(),
    });
  }

  generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  compareRefreshToken(refreshToken: string, refreshTokenHash: string): boolean {
    const incomingHash = this.hashRefreshToken(refreshToken);
    const incoming = Buffer.from(incomingHash, 'hex');
    const expected = Buffer.from(refreshTokenHash, 'hex');

    if (incoming.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(incoming, expected);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        algorithms: ['RS256'],
        publicKey: this.getPublicKey(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  async rotateRefreshToken(
    payload: AccessTokenPayload,
  ): Promise<AuthTokenPair> {
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();
    const accessToken = await this.generateAccessToken(payload);

    return {
      accessToken,
      refreshToken,
      refreshTokenHash,
      refreshTokenExpiresAt,
    };
  }

  setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(this.getRefreshCookieName(), refreshToken, {
      httpOnly: true,
      secure: this.isSecureCookie(),
      sameSite: this.isSecureCookie() ? 'none' : 'lax',
      path: '/api/v1/auth/refresh',
      expires: this.getRefreshTokenExpiresAt(),
    });
  }

  clearRefreshCookie(response: Response): void {
    response.clearCookie(this.getRefreshCookieName(), {
      httpOnly: true,
      secure: this.isSecureCookie(),
      sameSite: this.isSecureCookie() ? 'none' : 'lax',
      path: '/api/v1/auth/refresh',
    });
  }

  getPublicKey(): string {
    return this.decodeBase64Pem(
      this.configService.get<string>('jwt.publicKey'),
    );
  }

  private getPrivateKey(): string {
    return this.decodeBase64Pem(
      this.configService.get<string>('jwt.privateKey'),
    );
  }

  private getAccessTokenExpiresIn(): number {
    return (
      this.configService.get<number>('jwt.accessTokenExpiresInSeconds') || 900
    );
  }

  private getRefreshTokenExpiresAt(): Date {
    const days =
      this.configService.get<number>('jwt.refreshTokenExpiresInDays') || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
  }

  private getRefreshCookieName(): string {
    return (
      this.configService.get<string>('jwt.refreshCookieName') || 'refresh_token'
    );
  }

  private isSecureCookie(): boolean {
    return this.configService.get<string>('app.env') === 'production';
  }

  private decodeBase64Pem(value: string | undefined): string {
    if (!value) {
      throw new InternalServerErrorException('JWT key is not configured');
    }

    return Buffer.from(value, 'base64').toString('utf8');
  }
}
