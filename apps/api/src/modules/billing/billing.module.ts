import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';
import { FeePlanController } from './fee-plan/fee-plan.controller';
import { FeePlanService } from './fee-plan/fee-plan.service';
import { FeeAssignmentController } from './assignment/assignment.controller';
import { FeeAssignmentService } from './assignment/assignment.service';
import { PaymentController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';
import { RazorpayController } from './payment/razorpay.controller';
import { RazorpayService } from './payment/razorpay.service';
import { FeeLedgerController } from './ledger/ledger.controller';
import { FeeLedgerService } from './ledger/ledger.service';
import { OverdueSyncJob } from './jobs/overdue-sync.job';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [
    FeePlanController,
    FeeAssignmentController,
    PaymentController,
    RazorpayController,
    FeeLedgerController,
  ],
  providers: [
    FeePlanService,
    FeeAssignmentService,
    PaymentService,
    RazorpayService,
    FeeLedgerService,
    OverdueSyncJob,
  ],
  exports: [
    FeePlanService,
    FeeAssignmentService,
    PaymentService,
    RazorpayService,
    FeeLedgerService,
  ],
})
export class BillingModule {}
