import { Module } from '@nestjs/common';
import { PeopleModule } from '../people/people.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { AdmissionNumberGenerator } from '../admissions/utils/admission-number-generator';

@Module({
  imports: [PeopleModule],
  controllers: [StudentsController],
  providers: [StudentsService, AdmissionNumberGenerator],
  exports: [StudentsService],
})
export class StudentsModule {}
