import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface CreateLoginSessionInput {
  userId: string;
  tenantId: string | null;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress: string;
  rawUserAgent: string;
  deviceId?: string;
  deviceName?: string;
}

export interface RotateRefreshTokenInput {
  sessionId: string;
  currentRefreshTokenHash: string;
  refreshTokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class SessionService {
  constructor(private readonly prismaService: PrismaService) {}

  createLoginSession(
    input: CreateLoginSessionInput,
    prisma: Prisma.TransactionClient = this.prismaService,
  ) {
    return prisma.userSessions.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId,
        platformSessionId: randomUUID(),
        deviceFingerprint: input.deviceId || randomUUID(),
        deviceName: input.deviceName || 'Unknown device',
        ipAddress: input.ipAddress,
        deviceType: 'WEB',
        browserName: this.getBrowserName(input.rawUserAgent),
        osName: this.getOsName(input.rawUserAgent),
        rawUserAgent: input.rawUserAgent || 'unknown',
        status: 'ACTIVE',
        refreshTokenHash: input.refreshTokenHash,
        isRevoked: false,
        lastActiveAt: new Date(),
        expiresAt: input.expiresAt,
      },
    });
  }

  validateRefreshToken(refreshTokenHash: string) {
    return this.prismaService.userSessions.findFirst({
      where: {
        refreshTokenHash,
        isRevoked: false,
        status: 'ACTIVE',
      },
      include: { userIdusers: true },
    });
  }

  rotateRefreshToken(
    input: RotateRefreshTokenInput,
    prisma: Prisma.TransactionClient = this.prismaService,
  ) {
    return prisma.userSessions.updateMany({
      where: {
        id: input.sessionId,
        refreshTokenHash: input.currentRefreshTokenHash,
        isRevoked: false,
        status: 'ACTIVE',
      },
      data: {
        refreshTokenHash: input.refreshTokenHash,
        lastActiveAt: new Date(),
        expiresAt: input.expiresAt,
      },
    });
  }

  revokeSession(
    sessionId: string,
    prisma: Prisma.TransactionClient = this.prismaService,
  ) {
    const now = new Date();

    return prisma.userSessions.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        status: 'REVOKED',
        revokedAt: now,
        loggedOutAt: now,
      },
    });
  }

  revokeAllSessions(
    userId: string,
    prisma: Prisma.TransactionClient = this.prismaService,
  ) {
    const now = new Date();

    return prisma.userSessions.updateMany({
      where: {
        userId,
        isRevoked: false,
        status: 'ACTIVE',
      },
      data: {
        isRevoked: true,
        status: 'REVOKED',
        revokedAt: now,
        loggedOutAt: now,
      },
    });
  }

  getUserSessions(userId: string) {
    return this.prismaService.userSessions.findMany({
      where: {
        userId,
        isRevoked: false,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        browserName: true,
        ipAddress: true,
        lastActiveAt: true,
        expiresAt: true,
      },
    });
  }

  private getBrowserName(userAgent: string): string {
    const value = userAgent.toLowerCase();

    if (value.includes('edg/')) {
      return 'Edge';
    }

    if (value.includes('chrome/')) {
      return 'Chrome';
    }

    if (value.includes('firefox/')) {
      return 'Firefox';
    }

    if (value.includes('safari/')) {
      return 'Safari';
    }

    return 'Unknown';
  }

  private getOsName(userAgent: string): string {
    const value = userAgent.toLowerCase();

    if (value.includes('windows')) {
      return 'Windows';
    }

    if (value.includes('mac os')) {
      return 'macOS';
    }

    if (value.includes('android')) {
      return 'Android';
    }

    if (value.includes('iphone') || value.includes('ipad')) {
      return 'iOS';
    }

    if (value.includes('linux')) {
      return 'Linux';
    }

    return 'Unknown';
  }
}
