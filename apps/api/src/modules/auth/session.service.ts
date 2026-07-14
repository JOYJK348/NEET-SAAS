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
