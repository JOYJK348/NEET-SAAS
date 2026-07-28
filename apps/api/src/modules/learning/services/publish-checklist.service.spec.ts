/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { PublishChecklistService } from './publish-checklist.service';

describe('PublishChecklistService', () => {
  let service: PublishChecklistService;
  let mockPrisma: any;

  const tenantId = 'tenant-1';
  const examId = 'exam-100';

  beforeEach(() => {
    mockPrisma = {
      examSubmissions: {
        count: jest.fn().mockResolvedValue(0), // 0 unevaluated, 0 unapproved
      },
      exams: {
        findFirst: jest.fn().mockResolvedValue({
          evaluationLockedAt: new Date('2026-07-28T14:00:00Z'),
          isClosed: true,
        }),
      },
    };

    service = new PublishChecklistService(mockPrisma);
  });

  it('validates checklist and returns canPublish true when all rules pass', async () => {
    const result = await service.validateChecklist(tenantId, examId);

    expect(result.canPublish).toBe(true);
    expect(result.items).toHaveLength(4);
  });

  it('returns canPublish false when any rule fails', async () => {
    mockPrisma.examSubmissions.count
      .mockResolvedValueOnce(2) // ALL_EVALUATED fails (2 unevaluated)
      .mockResolvedValueOnce(0);

    const result = await service.validateChecklist(tenantId, examId);

    expect(result.canPublish).toBe(false);
    expect(result.items.find((i) => i.key === 'ALL_EVALUATED')?.passed).toBe(
      false,
    );
  });
});
