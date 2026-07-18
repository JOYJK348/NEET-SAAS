import { Module } from '@nestjs/common';
import { BatchEnrollmentAdmissionController } from './batch-enrollment-admission.controller';
import { BatchEnrollmentItemController } from './batch-enrollment-item.controller';
import { BatchEnrollmentsService } from './batch-enrollments.service';
import { PeopleModule } from '../people/people.module';

@Module({
  imports: [PeopleModule],
  controllers: [
    BatchEnrollmentAdmissionController,
    BatchEnrollmentItemController,
  ],
  providers: [BatchEnrollmentsService],
  exports: [BatchEnrollmentsService],
})
export class BatchEnrollmentsModule {}
