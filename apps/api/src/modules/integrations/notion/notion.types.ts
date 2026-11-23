/**
 * Types and schema definitions for NEET SaaS Notion Integration (Phase 4).
 * Enforces multi-tenancy, idempotent synchronization, and robust Notion block structures.
 */

export type NotionSyncStatus =
  | 'NOT_CONNECTED'
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'SYNCING'
  | 'SYNCED'
  | 'FAILED'
  | 'RETRYING'
  | 'UNPUBLISHED';

export interface NotionConnectionConfig {
  workspaceId?: string;
  workspaceName?: string;
  botId?: string;
  apiKeyEncrypted: string;
  destinationParentPageId: string;
  destinationParentPageTitle?: string;
  destinationParentPageUrl?: string;
  connectedAt: string;
  connectedBy: string;
  isActive: boolean;
}

export interface NotionConnectionStatusDto {
  isConnected: boolean;
  workspaceName?: string;
  botId?: string;
  destinationParentPageId?: string;
  destinationParentPageTitle?: string;
  destinationParentPageUrl?: string;
  connectedAt?: string;
}

export class ConnectNotionDto {
  apiKey!: string;
  destinationParentPageId!: string;
}

export interface NotionContentSyncMetadata {
  syncStatus: NotionSyncStatus;
  notionPageId?: string | null;
  notionPageUrl?: string | null;
  notionWorkspaceId?: string | null;
  notionParentPageId?: string | null;
  syncedVersion?: number | null;
  lastAttemptAt?: string | null;
  lastSyncedAt?: string | null;
  attemptCount: number;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
}

export interface NotionSyncStatusResponseDto {
  recordingId: string;
  contentId: string;
  syncStatus: NotionSyncStatus;
  notionPageId: string | null;
  notionPageUrl: string | null;
  syncedVersion: number | null;
  currentPublishedVersion: number | null;
  lastSyncedAt: string | null;
  lastAttemptAt: string | null;
  attemptCount: number;
  canRetry: boolean;
  errorMessage: string | null;
}

// Notion API Block Payloads conforming to 2022-06-28 API Version

export interface NotionRichTextItem {
  type: 'text';
  text: {
    content: string;
    link?: { url: string } | null;
  };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
}

export interface NotionBlock {
  object: 'block';
  type: string;
  [key: string]: any;
}

export interface NotionUserResponse {
  object: 'user';
  id: string;
  type?: 'person' | 'bot';
  name?: string;
  avatar_url?: string | null;
  bot?: {
    owner?: {
      type: 'workspace' | 'user';
      workspace?: boolean;
    };
    workspace_name?: string | null;
  };
}

export interface NotionPageResponse {
  object: 'page';
  id: string;
  url: string;
  archived: boolean;
  properties?: Record<string, any>;
  parent?: {
    type: string;
    page_id?: string;
    database_id?: string;
    workspace?: boolean;
  };
}

export interface NotionBlockListResponse {
  object: 'list';
  results: NotionBlock[];
  next_cursor: string | null;
  has_more: boolean;
}
