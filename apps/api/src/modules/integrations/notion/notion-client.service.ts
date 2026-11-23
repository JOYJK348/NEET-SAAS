import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  NotionBlock,
  NotionPageResponse,
  NotionUserResponse,
  NotionBlockListResponse,
} from './notion.types';

@Injectable()
export class NotionClientService {
  private readonly logger = new Logger(NotionClientService.name);
  private readonly baseUrl = 'https://api.notion.com/v1';
  private readonly notionVersion = '2022-06-28';
  private readonly requestTimeoutMs = 15000;
  private readonly maxRetries = 3;

  /**
   * Helper to format a Notion Page ID (supports both 32-char hex and UUID with hyphens).
   */
  normalizeNotionId(id: string): string {
    if (!id) return '';
    const clean = id.replace(/-/g, '').trim();
    if (clean.length === 32) {
      return `${clean.substring(0, 8)}-${clean.substring(8, 12)}-${clean.substring(12, 16)}-${clean.substring(16, 20)}-${clean.substring(20)}`;
    }
    return id.trim();
  }

  /**
   * Validates integration token by calling Notion's /v1/users/me endpoint.
   */
  async validateConnection(apiKey: string): Promise<{
    botId: string;
    botName: string;
    workspaceName?: string;
  }> {
    const data = await this.request<NotionUserResponse>(apiKey, 'GET', '/users/me');
    return {
      botId: data.id,
      botName: data.name || 'NEET Study Notes Bot',
      workspaceName: data.bot?.workspace_name || 'Notion Workspace',
    };
  }

  /**
   * Verifies that the bot integration has access to the destination parent page.
   */
  async verifyParentPageAccess(
    apiKey: string,
    rawParentPageId: string,
  ): Promise<{ id: string; title: string; url: string }> {
    const pageId = this.normalizeNotionId(rawParentPageId);
    const data = await this.request<NotionPageResponse>(apiKey, 'GET', `/pages/${pageId}`);

    let title = 'Destination Parent Page';
    if (data.properties) {
      for (const key of Object.keys(data.properties)) {
        const prop = data.properties[key];
        if (prop?.type === 'title' && Array.isArray(prop.title) && prop.title.length > 0) {
          title = prop.title.map((t: any) => t.plain_text || t.text?.content || '').join('');
          break;
        }
      }
    }

    return {
      id: data.id,
      title,
      url: data.url,
    };
  }

  /**
   * Creates a new page under the parent page with initial blocks (<= 100 blocks).
   */
  async createPage(
    apiKey: string,
    rawParentPageId: string,
    title: string,
    initialBlocks: NotionBlock[] = [],
  ): Promise<NotionPageResponse> {
    const parentPageId = this.normalizeNotionId(rawParentPageId);
    const safeInitialBlocks = initialBlocks.slice(0, 100);

    const payload = {
      parent: { page_id: parentPageId },
      icon: { type: 'emoji', emoji: '🩺' },
      properties: {
        title: {
          title: [
            {
              type: 'text',
              text: { content: (title || 'NEET AI Study Notes').slice(0, 2000) },
            },
          ],
        },
      },
      children: safeInitialBlocks,
    };

    return this.request<NotionPageResponse>(apiKey, 'POST', '/pages', payload);
  }

  /**
   * Appends blocks to a page or block container in chunks of 100.
   */
  async appendBlockChildren(
    apiKey: string,
    blockId: string,
    blocks: NotionBlock[],
  ): Promise<void> {
    const normalizedBlockId = this.normalizeNotionId(blockId);
    if (!blocks || blocks.length === 0) return;

    for (let i = 0; i < blocks.length; i += 100) {
      const chunk = blocks.slice(i, i + 100);
      await this.request(
        apiKey,
        'PATCH',
        `/blocks/${normalizedBlockId}/children`,
        { children: chunk },
      );
      // Mild pause between chunks to respect Notion rate limits
      if (i + 100 < blocks.length) {
        await this.delay(350);
      }
    }
  }

  /**
   * Retrieves page metadata.
   */
  async getPage(apiKey: string, pageId: string): Promise<NotionPageResponse> {
    const normalizedId = this.normalizeNotionId(pageId);
    return this.request<NotionPageResponse>(apiKey, 'GET', `/pages/${normalizedId}`);
  }

  /**
   * Archives a page (soft-delete in Notion).
   */
  async archivePage(apiKey: string, pageId: string): Promise<NotionPageResponse> {
    const normalizedId = this.normalizeNotionId(pageId);
    return this.request<NotionPageResponse>(apiKey, 'PATCH', `/pages/${normalizedId}`, {
      archived: true,
    });
  }

  /**
   * Unarchives a page (restores in Notion).
   */
  async unarchivePage(apiKey: string, pageId: string): Promise<NotionPageResponse> {
    const normalizedId = this.normalizeNotionId(pageId);
    return this.request<NotionPageResponse>(apiKey, 'PATCH', `/pages/${normalizedId}`, {
      archived: false,
    });
  }

  /**
   * Replaces content of a page:
   * 1. Fetches existing child blocks.
   * 2. Deletes existing child blocks.
   * 3. Appends new blocks in 100-block batches.
   */
  async replacePageContent(
    apiKey: string,
    pageId: string,
    newBlocks: NotionBlock[],
  ): Promise<void> {
    const normalizedId = this.normalizeNotionId(pageId);

    // 1. Fetch existing children
    const existingBlockIds: string[] = [];
    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const endpoint = cursor
        ? `/blocks/${normalizedId}/children?page_size=100&start_cursor=${cursor}`
        : `/blocks/${normalizedId}/children?page_size=100`;

      const listResponse = await this.request<NotionBlockListResponse>(apiKey, 'GET', endpoint);
      for (const block of listResponse.results) {
        if (block.id) {
          existingBlockIds.push(block.id);
        }
      }
      hasMore = listResponse.has_more;
      cursor = listResponse.next_cursor;
    }

    // 2. Delete existing child blocks cleanly before appending
    for (let i = 0; i < existingBlockIds.length; i++) {
      await this.request(apiKey, 'DELETE', `/blocks/${existingBlockIds[i]}`);
      if ((i + 1) % 10 === 0 && i + 1 < existingBlockIds.length) {
        await this.delay(200);
      }
    }

    // 3. Append new blocks in chunks of 100
    await this.appendBlockChildren(apiKey, normalizedId, newBlocks);
  }

  /**
   * Robust HTTP request wrapper with rate limit backoff (429 Retry-After) and exponential retries.
   */
  private async request<T = any>(
    apiKey: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    data?: any,
  ): Promise<T> {
    let attempts = 0;

    while (attempts < this.maxRetries) {
      attempts++;
      try {
        const response = await axios({
          method,
          url: `${this.baseUrl}${path}`,
          data,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Notion-Version': this.notionVersion,
            'Content-Type': 'application/json',
          },
          timeout: this.requestTimeoutMs,
        });

        return response.data;
      } catch (error: any) {
        const isAxiosErr =
          (typeof axios.isAxiosError === 'function' && axios.isAxiosError(error)) ||
          Boolean(error?.isAxiosError) ||
          Boolean(error?.response);
        const status = isAxiosErr ? error.response?.status : null;
        const responseData = isAxiosErr ? error.response?.data : null;

        // Rate limit encountered (429)
        if (status === 429) {
          const retryAfterSec = error.response?.headers?.['retry-after'];
          const waitMs = retryAfterSec ? parseInt(retryAfterSec, 10) * 1000 : 1000 * Math.pow(2, attempts);
          this.logger.warn(
            `Notion API 429 rate limit hit on ${method} ${path}. Waiting ${waitMs}ms before attempt ${attempts + 1}...`,
          );
          await this.delay(waitMs);
          continue;
        }

        // 5xx Server Error or network timeout - retry with backoff
        if ((status && status >= 500) || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          if (attempts < this.maxRetries) {
            const waitMs = 1000 * Math.pow(2, attempts);
            this.logger.warn(
              `Notion API error (${status || error.code}) on ${method} ${path}. Retrying in ${waitMs}ms (attempt ${attempts + 1}/${this.maxRetries})...`,
            );
            await this.delay(waitMs);
            continue;
          }
        }

        // Non-retryable error (e.g. 400 Bad Request, 401 Unauthorized, 404 Not Found)
        const errorMsg =
          responseData?.message ||
          error?.message ||
          `Notion API request failed with status ${status}`;

        this.logger.error(
          `Notion API Error [${method} ${path}]: Status ${status} - ${errorMsg}`,
        );

        const customError: any = new Error(`Notion API Error: ${errorMsg}`);
        customError.status = status;
        customError.notionCode = responseData?.code;
        throw customError;
      }
    }

    throw new Error(`Notion API request failed after ${this.maxRetries} attempts`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

