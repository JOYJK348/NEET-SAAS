import { Module } from '@nestjs/common';
import { PeopleModule } from '../people/people.module';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';
import { AdmissionNumberGenerator } from './utils/admission-number-generator';

@Module({
  imports: [PeopleModule],
  controllers: [AdmissionsController],
  providers: [AdmissionsService, AdmissionNumberGenerator],
  exports: [AdmissionsService],
})
export class AdmissionsModule {}
