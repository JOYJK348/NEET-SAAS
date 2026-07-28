import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { SubmissionTimelineEvent } from '@prisma/client';
import type { Prisma } from '@prisma/client';

@Injectable()
export class TimelineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Logs a forensic submission timeline event
   */
  async logEvent(
    tenantId: string,
    submissionId: string,
    event: SubmissionTimelineEvent,
    userId?: string | null,
    metadata?: Record<string, unknown>,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.examSubmissionTimeline.create({
      data: {
        tenantId,
        submissionId,
        event,
        createdBy: userId || null,
        metadata: metadata
          ? (metadata as unknown as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }

  /**
   * Retrieves full chronological timeline for a submission
   */
  async getSubmissionTimeline(tenantId: string, submissionId: string) {
    return this.prisma.examSubmissionTimeline.findMany({
      where: { tenantId, submissionId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
