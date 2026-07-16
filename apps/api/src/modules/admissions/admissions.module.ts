import { Module } from '@nestjs/common';
import { PeopleModule } from '../people/people.module';
import { AdmissionsStudentController } from './admissions-student.controller';
import { AdmissionItemController } from './admission-item.controller';
import { AdmissionsService } from './admissions.service';
import { AdmissionNumberGenerator } from './utils/admission-number-generator';

@Module({
  imports: [PeopleModule],
  controllers: [AdmissionsStudentController, AdmissionItemController],
  providers: [AdmissionsService, AdmissionNumberGenerator],
  exports: [AdmissionsService],
})
export class AdmissionsModule {}
