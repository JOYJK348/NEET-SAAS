/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
import { TimelineService } from './timeline.service';
import { SubmissionTimelineEvent } from '@prisma/client';

describe('TimelineService', () => {
  let service: TimelineService;
  let mockPrisma: any;

  const tenantId = 'tenant-1';
  const submissionId = 'sub-100';

  beforeEach(() => {
    mockPrisma = {
      examSubmissionTimeline: {
        create: jest
          .fn()
          .mockImplementation(({ data }: any) =>
            Promise.resolve({ id: 'tl-1', ...data }),
          ),
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'tl-1', event: SubmissionTimelineEvent.STARTED },
          ]),
      },
    };

    service = new TimelineService(mockPrisma);
  });

  it('logs timeline event with metadata', async () => {
    const result = await service.logEvent(
      tenantId,
      submissionId,
      SubmissionTimelineEvent.STARTED,
      'user-1',
      { ip: '127.0.0.1' },
    );

    expect(mockPrisma.examSubmissionTimeline.create).toHaveBeenCalledWith({
      data: {
        tenantId,
        submissionId,
        event: SubmissionTimelineEvent.STARTED,
        createdBy: 'user-1',
        metadata: { ip: '127.0.0.1' },
      },
    });
    expect(result.event).toBe(SubmissionTimelineEvent.STARTED);
  });

  it('fetches submission timeline', async () => {
    const timeline = await service.getSubmissionTimeline(
      tenantId,
      submissionId,
    );
    expect(timeline).toHaveLength(1);
    expect(mockPrisma.examSubmissionTimeline.findMany).toHaveBeenCalledWith({
      where: { tenantId, submissionId },
      orderBy: { createdAt: 'asc' },
    });
  });
});
