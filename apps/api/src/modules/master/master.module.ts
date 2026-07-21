import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TenantScopedPrisma } from '../../common/utils/tenant-scoped-prisma';
import { BranchController } from './controllers/branch.controller';
import { AcademicYearController } from './controllers/academic-year.controller';
import { CourseController } from './controllers/course.controller';
import { SubjectController } from './controllers/subject.controller';
import { CourseSubjectController } from './controllers/course-subject.controller';
import { ChapterController } from './controllers/chapter.controller';
import { TopicController } from './controllers/topic.controller';
import { BatchDeliveryTypeController } from './controllers/batch-delivery-type.controller';
import { BatchController } from './controllers/batch.controller';
import { BranchService } from './services/branch.service';
import { AcademicYearService } from './services/academic-year.service';
import { CourseService } from './services/course.service';
import { SubjectService } from './services/subject.service';
import { CourseSubjectService } from './services/course-subject.service';
import { ChapterService } from './services/chapter.service';
import { TopicService } from './services/topic.service';
import { BatchDeliveryTypeService } from './services/batch-delivery-type.service';
import { BatchService } from './services/batch.service';

import { BranchCourseController } from './controllers/branch-course.controller';
import { BranchCourseService } from './services/branch-course.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    BranchController,
    AcademicYearController,
    CourseController,
    SubjectController,
    CourseSubjectController,
    BranchCourseController,
    ChapterController,
    TopicController,
    BatchDeliveryTypeController,
    BatchController,
  ],
  providers: [
    TenantScopedPrisma,
    BranchService,
    AcademicYearService,
    CourseService,
    SubjectService,
    CourseSubjectService,
    BranchCourseService,
    ChapterService,
    TopicService,
    BatchDeliveryTypeService,
    BatchService,
  ],
  exports: [
    BranchService,
    AcademicYearService,
    CourseService,
    SubjectService,
    ChapterService,
    TopicService,
    BatchService,
  ],
})
export class MasterModule {}
