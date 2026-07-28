import { Injectable } from '@nestjs/common';
import { ExamPublishStatusEnum } from '@prisma/client';

export type DerivedExamState =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'LIVE'
  | 'LOCKED'
  | 'UNDER_REVIEW'
  | 'ADMIN_REVIEW'
  | 'RESULT_PUBLISHED'
  | 'ARCHIVED'
  | 'CANCELLED';

@Injectable()
export class ExamStateService {
  /**
   * Computes the real-time operational state of an exam based on status and time window
   */
  getExamState(
    exam: {
      publishStatus: ExamPublishStatusEnum;
      examWindowStart: Date;
      examWindowEnd: Date;
      isClosed?: boolean;
    },
    now: Date = new Date(),
  ): DerivedExamState {
    if (exam.publishStatus === ExamPublishStatusEnum.PUBLISHED) {
      if (
        now >= exam.examWindowStart &&
        now <= exam.examWindowEnd &&
        !exam.isClosed
      ) {
        return 'LIVE';
      }
      if (now > exam.examWindowEnd || exam.isClosed) {
        return 'LOCKED';
      }
    }
    return exam.publishStatus;
  }

  /**
   * Checks if a student can click "Ready to Start"
   */
  canStudentStart(
    exam: {
      publishStatus: ExamPublishStatusEnum;
      examWindowStart: Date;
      examWindowEnd: Date;
      durationMinutes: number;
      requireFullDurationWindow: boolean;
      isClosed?: boolean;
    },
    now: Date = new Date(),
  ): boolean {
    if (exam.isClosed) return false;
    if (exam.publishStatus !== ExamPublishStatusEnum.PUBLISHED) return false;
    if (now < exam.examWindowStart || now > exam.examWindowEnd) return false;

    if (exam.requireFullDurationWindow) {
      const remainingMs = exam.examWindowEnd.getTime() - now.getTime();
      const requiredMs = exam.durationMinutes * 60 * 1000;
      if (remainingMs < requiredMs) return false;
    }
    return true;
  }

  /**
   * Resolves upload window status for a student submission
   */
  resolveUploadStatus(
    submission: {
      startedAt?: Date | null;
      calculatedEndAt?: Date | null;
      graceEndAt?: Date | null;
    },
    allowLateUpload: boolean,
    now: Date = new Date(),
  ): 'ALLOWED' | 'GRACE' | 'EXPIRED' {
    if (!submission.startedAt || !submission.calculatedEndAt) return 'EXPIRED';
    if (now <= submission.calculatedEndAt) return 'ALLOWED';
    if (
      submission.graceEndAt &&
      now <= submission.graceEndAt &&
      allowLateUpload
    ) {
      return 'GRACE';
    }
    return 'EXPIRED';
  }

  /**
   * Checks if tutor can evaluate or edit marks for a submission
   */
  canTutorEvaluate(
    exam: {
      evaluationLockedAt?: Date | null;
      resultsPublishedAt?: Date | null;
      isClosed?: boolean;
    },
    submission: { evaluationApproved: boolean },
  ): boolean {
    if (
      exam.evaluationLockedAt ||
      (exam.resultsPublishedAt && exam.resultsPublishedAt.getTime() > 0)
    ) {
      return false;
    }
    if (submission.evaluationApproved) return false;
    return true;
  }

  /**
   * Checks if result publication is allowed
   */
  canPublishResults(
    exam: {
      evaluationLockedAt?: Date | null;
      resultsPublishedAt?: Date | null;
    },
    checklistResult: { canPublish: boolean },
  ): boolean {
    if (exam.resultsPublishedAt && exam.resultsPublishedAt.getTime() > 0)
      return false;
    if (!exam.evaluationLockedAt) return false;
    return checklistResult.canPublish;
  }

  /**
   * Checks if exam can be archived
   */
  canArchive(exam: { publishStatus: ExamPublishStatusEnum }): boolean {
    return exam.publishStatus === ExamPublishStatusEnum.RESULT_PUBLISHED;
  }
}
