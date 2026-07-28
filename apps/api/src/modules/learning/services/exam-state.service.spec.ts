import { ExamStateService } from './exam-state.service';
import { ExamPublishStatusEnum } from '@prisma/client';

describe('ExamStateService', () => {
  let service: ExamStateService;

  beforeEach(() => {
    service = new ExamStateService();
  });

  describe('getExamState', () => {
    it('returns LIVE when now is inside exam window for PUBLISHED exam', () => {
      const exam = {
        publishStatus: ExamPublishStatusEnum.PUBLISHED,
        examWindowStart: new Date('2026-07-28T09:00:00Z'),
        examWindowEnd: new Date('2026-07-28T17:00:00Z'),
      };

      const state = service.getExamState(
        exam,
        new Date('2026-07-28T10:00:00Z'),
      );
      expect(state).toBe('LIVE');
    });

    it('returns LOCKED when now is past examWindowEnd', () => {
      const exam = {
        publishStatus: ExamPublishStatusEnum.PUBLISHED,
        examWindowStart: new Date('2026-07-28T09:00:00Z'),
        examWindowEnd: new Date('2026-07-28T17:00:00Z'),
      };

      const state = service.getExamState(
        exam,
        new Date('2026-07-28T18:00:00Z'),
      );
      expect(state).toBe('LOCKED');
    });

    it('returns DRAFT when publishStatus is DRAFT regardless of time', () => {
      const exam = {
        publishStatus: ExamPublishStatusEnum.DRAFT,
        examWindowStart: new Date('2026-07-28T09:00:00Z'),
        examWindowEnd: new Date('2026-07-28T17:00:00Z'),
      };

      const state = service.getExamState(
        exam,
        new Date('2026-07-28T10:00:00Z'),
      );
      expect(state).toBe('DRAFT');
    });
  });

  describe('canStudentStart', () => {
    it('returns true when now is inside window', () => {
      const exam = {
        publishStatus: ExamPublishStatusEnum.PUBLISHED,
        examWindowStart: new Date('2026-07-28T09:00:00Z'),
        examWindowEnd: new Date('2026-07-28T17:00:00Z'),
        durationMinutes: 120,
        requireFullDurationWindow: false,
      };

      expect(
        service.canStudentStart(exam, new Date('2026-07-28T10:00:00Z')),
      ).toBe(true);
    });

    it('returns false when requireFullDurationWindow is true and remaining window is insufficient', () => {
      const exam = {
        publishStatus: ExamPublishStatusEnum.PUBLISHED,
        examWindowStart: new Date('2026-07-28T09:00:00Z'),
        examWindowEnd: new Date('2026-07-28T17:00:00Z'),
        durationMinutes: 120,
        requireFullDurationWindow: true,
      };

      // 16:00 is only 60 min before 17:00 window end, but 120 min is required
      expect(
        service.canStudentStart(exam, new Date('2026-07-28T16:00:00Z')),
      ).toBe(false);
    });
  });

  describe('resolveUploadStatus', () => {
    it('returns ALLOWED when now <= calculatedEndAt', () => {
      const submission = {
        startedAt: new Date('2026-07-28T10:00:00Z'),
        calculatedEndAt: new Date('2026-07-28T12:00:00Z'),
        graceEndAt: new Date('2026-07-28T12:15:00Z'),
      };

      expect(
        service.resolveUploadStatus(
          submission,
          false,
          new Date('2026-07-28T11:00:00Z'),
        ),
      ).toBe('ALLOWED');
    });

    it('returns GRACE when within grace period and allowLateUpload is true', () => {
      const submission = {
        startedAt: new Date('2026-07-28T10:00:00Z'),
        calculatedEndAt: new Date('2026-07-28T12:00:00Z'),
        graceEndAt: new Date('2026-07-28T12:15:00Z'),
      };

      expect(
        service.resolveUploadStatus(
          submission,
          true,
          new Date('2026-07-28T12:05:00Z'),
        ),
      ).toBe('GRACE');
    });

    it('returns EXPIRED when past graceEndAt', () => {
      const submission = {
        startedAt: new Date('2026-07-28T10:00:00Z'),
        calculatedEndAt: new Date('2026-07-28T12:00:00Z'),
        graceEndAt: new Date('2026-07-28T12:15:00Z'),
      };

      expect(
        service.resolveUploadStatus(
          submission,
          true,
          new Date('2026-07-28T12:20:00Z'),
        ),
      ).toBe('EXPIRED');
    });
  });
});
