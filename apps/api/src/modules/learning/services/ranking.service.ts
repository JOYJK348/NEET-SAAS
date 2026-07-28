import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates integer ranks and percentiles for all evaluated submissions of an exam
   */
  async calculateExamRanks(
    tenantId: string,
    examId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ updatedCount: number }> {
    const client = tx || this.prisma;

    // Fetch evaluated submissions ordered by obtainedMarks DESC, submittedAt ASC (tie-breaker)
    const submissions = await client.examSubmissions.findMany({
      where: {
        tenantId,
        examId,
        status: { not: 'ABSENT' },
        evaluationStatus: 'COMPLETED',
        deletedAt: null,
      },
      orderBy: [{ obtainedMarks: 'desc' }, { submittedAt: 'asc' }],
      select: { id: true, obtainedMarks: true },
    });

    const totalCount = submissions.length;
    if (totalCount === 0) {
      return { updatedCount: 0 };
    }

    let currentRank = 1;
    let prevMarks: number | null = null;

    for (let i = 0; i < totalCount; i++) {
      const sub = submissions[i];
      const mark = Number(sub.obtainedMarks);

      // Handle ties in rank
      if (prevMarks !== null && mark < prevMarks) {
        currentRank = i + 1;
      }
      prevMarks = mark;

      // Percentile formula: ((totalCount - currentRank) / totalCount) * 100
      const percentile = Number(
        (((totalCount - currentRank) / totalCount) * 100).toFixed(2),
      );

      await client.examSubmissions.update({
        where: { id: sub.id },
        data: {
          rank: currentRank,
          percentile,
        },
      });
    }

    return { updatedCount: totalCount };
  }
}
