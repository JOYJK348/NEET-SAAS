/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExamAnalyticsService } from './exam-analytics.service';

describe('ExamAnalyticsService', () => {
  let service: ExamAnalyticsService;
  let mockPrisma: any;
  let mockExamStateService: any;

  const tenantId = 'tenant-1';
  const examId = 'exam-100';

  const mockExam = {
    id: examId,
    tenantId,
    batchId: 'batch-1',
    title: 'Grand Mock Test',
    totalMarks: 720,
    passingMarks: 360,
    examWindowStart: new Date('2026-07-28T09:00:00Z'),
    examWindowEnd: new Date('2026-07-28T17:00:00Z'),
    resultsPublishedAt: new Date('2026-07-28T18:00:00Z'),
    sectionConfig: [
      { sectionId: 'phy', name: 'Physics', maxMarks: 180 },
      { sectionId: 'chem', name: 'Chemistry', maxMarks: 180 },
    ],
  };

  const mockSubmissions = [
    {
      id: 'sub-1',
      tenantId,
      examId,
      status: 'SUBMITTED',
      evaluationStatus: 'COMPLETED',
      obtainedMarks: 600,
      rank: 1,
      percentile: 100,
      answerSheetFileId: 'file-1',
      startedAt: new Date('2026-07-28T10:00:00Z'),
      calculatedEndAt: new Date('2026-07-28T12:00:00Z'),
      graceEndAt: new Date('2026-07-28T12:15:00Z'),
      lastSeenAt: new Date(),
      marksBreakdown: [
        { sectionId: 'phy', obtainedMarks: 150 },
        { sectionId: 'chem', obtainedMarks: 150 },
      ],
    },
    {
      id: 'sub-2',
      tenantId,
      examId,
      status: 'SUBMITTED',
      evaluationStatus: 'COMPLETED',
      obtainedMarks: 300,
      rank: 2,
      percentile: 50,
      answerSheetFileId: 'file-2',
      startedAt: new Date('2026-07-28T10:00:00Z'),
      calculatedEndAt: new Date('2026-07-28T12:00:00Z'),
      graceEndAt: new Date('2026-07-28T12:15:00Z'),
      lastSeenAt: new Date(),
      marksBreakdown: [
        { sectionId: 'phy', obtainedMarks: 75 },
        { sectionId: 'chem', obtainedMarks: 75 },
      ],
    },
  ];

  beforeEach(() => {
    mockPrisma = {
      exams: {
        findFirst: jest.fn().mockResolvedValue(mockExam),
      },
      studentBatchEnrollments: {
        count: jest.fn().mockResolvedValue(10),
      },
      examSubmissions: {
        findMany: jest.fn().mockResolvedValue(mockSubmissions),
      },
    };

    mockExamStateService = {
      getExamState: jest.fn().mockReturnValue('RESULT_PUBLISHED'),
    };

    service = new ExamAnalyticsService(mockPrisma, mockExamStateService);
  });

  describe('getLiveDashboard', () => {
    it('returns real-time live monitoring metrics', async () => {
      const result = await service.getLiveDashboard(tenantId, examId);

      expect(result.examId).toBe(examId);
      expect(result.liveMetrics.totalStudents).toBe(10);
      expect(result.liveMetrics.submittedCount).toBe(2);
    });
  });

  describe('getPostPublishAnalytics', () => {
    it('calculates highest, lowest, average, pass% and fail% correctly', async () => {
      const result = await service.getPostPublishAnalytics(tenantId, examId);

      expect(result.marksAnalytics.highest).toBe(600);
      expect(result.marksAnalytics.lowest).toBe(300);
      expect(result.marksAnalytics.average).toBe(450);
      expect(result.overallStats.passPercent).toBe(50); // 1 passed out of 2 evaluated
    });
  });

  describe('getSectionAnalytics', () => {
    it('calculates average marks per section', async () => {
      const result = await service.getSectionAnalytics(tenantId, examId);

      expect(result.sectionAnalytics).toHaveLength(2);
      expect(result.sectionAnalytics[0].sectionName).toBe('Physics');
      expect(result.sectionAnalytics[0].averageMarks).toBe(112.5); // (150 + 75)/2
    });
  });

  describe('getTopStudents', () => {
    it('returns top students list ordered by rank', async () => {
      const top = await service.getTopStudents(tenantId, examId, 5);

      expect(top).toHaveLength(2);
      expect(top[0].obtainedMarks).toBe(600);
    });
  });
});
