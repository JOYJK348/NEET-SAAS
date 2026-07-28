/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
import { RankingService } from './ranking.service';

describe('RankingService', () => {
  let service: RankingService;
  let mockPrisma: any;

  const tenantId = 'tenant-1';
  const examId = 'exam-100';

  beforeEach(() => {
    mockPrisma = {
      examSubmissions: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'sub-1', obtainedMarks: 180 },
          { id: 'sub-2', obtainedMarks: 150 },
          { id: 'sub-3', obtainedMarks: 150 },
          { id: 'sub-4', obtainedMarks: 100 },
        ]),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    service = new RankingService(mockPrisma);
  });

  it('calculates ranks and percentiles correctly with tie-handling', async () => {
    const result = await service.calculateExamRanks(tenantId, examId);

    expect(result.updatedCount).toBe(4);
    expect(mockPrisma.examSubmissions.update).toHaveBeenCalledTimes(4);

    // sub-1 (180 marks) -> rank 1
    expect(mockPrisma.examSubmissions.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'sub-1' },
      data: { rank: 1, percentile: 75.0 },
    });

    // sub-2 (150 marks) -> rank 2
    expect(mockPrisma.examSubmissions.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'sub-2' },
      data: { rank: 2, percentile: 50.0 },
    });

    // sub-3 (150 marks tie) -> rank 2
    expect(mockPrisma.examSubmissions.update).toHaveBeenNthCalledWith(3, {
      where: { id: 'sub-3' },
      data: { rank: 2, percentile: 50.0 },
    });

    // sub-4 (100 marks) -> rank 4
    expect(mockPrisma.examSubmissions.update).toHaveBeenNthCalledWith(4, {
      where: { id: 'sub-4' },
      data: { rank: 4, percentile: 0.0 },
    });
  });
});
