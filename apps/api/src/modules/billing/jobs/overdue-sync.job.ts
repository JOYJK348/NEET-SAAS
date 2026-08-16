import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class OverdueSyncJob {
  private readonly logger = new Logger(OverdueSyncJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueSync() {
    this.logger.log('Starting daily overdue status synchronization...');

    const now = new Date();

    const result = await this.prisma.studentFeeInstallments.updateMany({
      where: {
        dueDate: { lt: now },
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
        deletedAt: null,
      },
      data: {
        status: 'OVERDUE',
      },
    });

    this.logger.log(
      `Daily overdue sync complete. Updated ${result.count} past-due installments to OVERDUE status.`,
    );
  }
}
