import { NotionClientService } from './notion-client.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as unknown as jest.Mock;

describe('NotionClientService', () => {
  let service: NotionClientService;
  const mockApiKey = 'secret_test_key_12345';
  const mockParentPageId = '12345678-1234-1234-1234-123456789abc';

  beforeEach(() => {
    jest.clearAllMocks();
    (axios as any).isAxiosError = (err: any) => Boolean(err?.isAxiosError);
    service = new NotionClientService();
  });

  describe('normalizeNotionId', () => {
    it('should format 32-character hex ID into hyphenated UUID', () => {
      const raw = '12345678123412341234123456789abc';
      const normalized = service.normalizeNotionId(raw);
      expect(normalized).toBe('12345678-1234-1234-1234-123456789abc');
    });

    it('should keep existing UUID with hyphens intact', () => {
      const uuid = '12345678-1234-1234-1234-123456789abc';
      expect(service.normalizeNotionId(uuid)).toBe(uuid);
    });

    it('should return empty string for null/undefined/empty input', () => {
      expect(service.normalizeNotionId('')).toBe('');
      expect(service.normalizeNotionId(null as any)).toBe('');
    });
  });

  describe('validateConnection', () => {
    it('should call /v1/users/me and return bot metadata', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: {
          id: 'bot-123',
          name: 'NEET Tutor Bot',
          bot: {
            workspace_name: 'NEET Academy Workspace',
          },
        },
      });

      const result = await service.validateConnection(mockApiKey);

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://api.notion.com/v1/users/me',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
            'Notion-Version': '2022-06-28',
          }),
        }),
      );
      expect(result).toEqual({
        botId: 'bot-123',
        botName: 'NEET Tutor Bot',
        workspaceName: 'NEET Academy Workspace',
      });
    });

    it('should throw error when authentication fails', async () => {
      const axiosError: any = new Error('Request failed with status code 401');
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 401,
        data: { message: 'API token is invalid' },
      };
      mockedAxios.mockRejectedValueOnce(axiosError);

      await expect(service.validateConnection(mockApiKey)).rejects.toThrow(
        'Notion API Error: API token is invalid',
      );
    });
  });

  describe('verifyParentPageAccess', () => {
    it('should retrieve page and extract title and url', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: {
          id: mockParentPageId,
          url: 'https://notion.so/test-page-url',
          properties: {
            title: {
              type: 'title',
              title: [{ plain_text: 'NEET Study Notes Archive' }],
            },
          },
        },
      });

      const result = await service.verifyParentPageAccess(mockApiKey, mockParentPageId);

      expect(result).toEqual({
        id: mockParentPageId,
        title: 'NEET Study Notes Archive',
        url: 'https://notion.so/test-page-url',
      });
    });
  });

  describe('createPage', () => {
    it('should post new page with parent ID, emoji icon, title, and initial blocks', async () => {
      const mockPageResponse = {
        id: 'new-page-id-123',
        url: 'https://notion.so/new-page-id-123',
        archived: false,
      };
      mockedAxios.mockResolvedValueOnce({ data: mockPageResponse });

      const initialBlocks = [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: [{ type: 'text', text: { content: 'Introduction' } }] },
        },
      ] as any;

      const result = await service.createPage(
        mockApiKey,
        mockParentPageId,
        'Physics: Optics Lecture Notes',
        initialBlocks,
      );

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://api.notion.com/v1/pages',
          data: expect.objectContaining({
            parent: { page_id: mockParentPageId },
            icon: { type: 'emoji', emoji: '🩺' },
            properties: {
              title: {
                title: [{ type: 'text', text: { content: 'Physics: Optics Lecture Notes' } }],
              },
            },
            children: initialBlocks,
          }),
        }),
      );
      expect(result).toEqual(mockPageResponse);
    });
  });

  describe('appendBlockChildren', () => {
    it('should chunk blocks in batches of 100', async () => {
      mockedAxios.mockResolvedValue({ data: { results: [] } });

      // Generate 150 blocks
      const blocks: any[] = [];
      for (let i = 0; i < 150; i++) {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: `Block ${i}` } }] },
        });
      }

      await service.appendBlockChildren(mockApiKey, 'target-page-id', blocks);

      // Should have been called twice (100 then 50)
      expect(mockedAxios).toHaveBeenCalledTimes(2);
      expect(mockedAxios).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          method: 'PATCH',
          url: 'https://api.notion.com/v1/blocks/target-page-id/children',
          data: { children: blocks.slice(0, 100) },
        }),
      );
      expect(mockedAxios).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          method: 'PATCH',
          url: 'https://api.notion.com/v1/blocks/target-page-id/children',
          data: { children: blocks.slice(100, 150) },
        }),
      );
    });
  });

  describe('replacePageContent', () => {
    it('should list existing blocks, delete each block, and append new blocks', async () => {
      // 1. First call: list blocks (has 2 blocks, has_more: false)
      mockedAxios.mockResolvedValueOnce({
        data: {
          results: [{ id: 'child-1' }, { id: 'child-2' }],
          has_more: false,
          next_cursor: null,
        },
      });

      // 2. Calls to delete child blocks
      mockedAxios.mockResolvedValueOnce({ data: { id: 'child-1' } });
      mockedAxios.mockResolvedValueOnce({ data: { id: 'child-2' } });

      // 3. Call to append new blocks
      mockedAxios.mockResolvedValueOnce({ data: { results: [] } });

      const newBlocks = [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: [{ type: 'text', text: { content: 'Updated Notes' } }] },
        },
      ] as any;

      await service.replacePageContent(mockApiKey, 'page-123', newBlocks);

      // Check DELETE calls
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          url: 'https://api.notion.com/v1/blocks/child-1',
        }),
      );
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          url: 'https://api.notion.com/v1/blocks/child-2',
        }),
      );
      // Check PATCH call for new blocks
      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
          url: 'https://api.notion.com/v1/blocks/page-123/children',
          data: { children: newBlocks },
        }),
      );
    });
  });

  describe('archivePage & unarchivePage', () => {
    it('should patch page with archived: true', async () => {
      mockedAxios.mockResolvedValueOnce({ data: { id: 'page-123', archived: true } });

      await service.archivePage(mockApiKey, 'page-123');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
          url: 'https://api.notion.com/v1/pages/page-123',
          data: { archived: true },
        }),
      );
    });

    it('should patch page with archived: false', async () => {
      mockedAxios.mockResolvedValueOnce({ data: { id: 'page-123', archived: false } });

      await service.unarchivePage(mockApiKey, 'page-123');

      expect(mockedAxios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
          url: 'https://api.notion.com/v1/pages/page-123',
          data: { archived: false },
        }),
      );
    });
  });

  describe('Rate Limiting & Retries (429 & 5xx)', () => {
    it('should retry when encountering 429 and honor Retry-After header', async () => {
      // First attempt: 429 with retry-after: 0
      const err429: any = new Error('Rate limited');
      err429.isAxiosError = true;
      err429.response = {
        status: 429,
        headers: { 'retry-after': '0' },
        data: { message: 'Rate limit hit' },
      };

      // Second attempt: Success
      const successData = { id: 'page-123', url: 'https://notion.so/page-123' };

      mockedAxios.mockRejectedValueOnce(err429);
      mockedAxios.mockResolvedValueOnce({ data: successData });

      const result = await service.getPage(mockApiKey, 'page-123');

      expect(mockedAxios).toHaveBeenCalledTimes(2);
      expect(result).toEqual(successData);
    });
  });
});
