import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TenantScopedPrisma } from '../../common/utils/tenant-scoped-prisma';
import { TopicItemController } from './controllers/topic-item.controller';
import { AdminExamsController } from './controllers/admin-exams.controller';
import { StudentExamsController } from './controllers/student-exams.controller';
import { TutorExamsController } from './controllers/tutor-exams.controller';
import { TopicItemService } from './services/topic-item.service';
import { ExamClosureService } from './services/exam-closure.service';
import { AdminExamsService } from './services/admin-exams.service';
import { StudentExamsService } from './services/student-exams.service';
import { TutorExamsService } from './services/tutor-exams.service';
import { ExamStateService } from './services/exam-state.service';
import { TimelineService } from './services/timeline.service';
import { RankingService } from './services/ranking.service';
import { PublishChecklistService } from './services/publish-checklist.service';

import { ExamApprovalService } from './services/exam-approval.service';
import { ExamAnalyticsService } from './services/exam-analytics.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    TopicItemController,
    AdminExamsController,
    StudentExamsController,
    TutorExamsController,
  ],
  providers: [
    TenantScopedPrisma,
    TopicItemService,
    ExamClosureService,
    AdminExamsService,
    StudentExamsService,
    TutorExamsService,
    ExamStateService,
    TimelineService,
    RankingService,
    PublishChecklistService,
    ExamApprovalService,
    ExamAnalyticsService,
  ],
  exports: [
    TopicItemService,
    ExamClosureService,
    AdminExamsService,
    StudentExamsService,
    TutorExamsService,
    ExamStateService,
    TimelineService,
    RankingService,
    PublishChecklistService,
    ExamApprovalService,
    ExamAnalyticsService,
  ],
})
export class LearningModule {}
