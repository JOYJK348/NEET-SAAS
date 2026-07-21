import type { Subject, Chapter, Topic } from '@/features/master-data/types';

export type TopicItemType = 'TEXT' | 'PDF' | 'LINK' | 'VIDEO' | 'ASSESSMENT';
export type TopicItemStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CompletionRule = 'NONE' | 'OPEN' | 'WATCH_80_PERCENT' | 'WATCHED_FULL';

export interface TopicItem {
  id: string;
  tenantId: string;
  topicId: string;
  type: TopicItemType;
  title: string;
  description: string | null;
  content: Record<string, unknown> | null;
  fileUrl: string | null;
  externalUrl: string | null;
  metadata: Record<string, unknown> | null;
  assessmentId: string | null;
  status: TopicItemStatus;
  displayOrder: number;
  durationMins: number | null;
  completionRule: CompletionRule;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CourseNode {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  chapters: CourseChapter[];
}

export interface CourseChapter {
  id: string;
  name: string;
  code: string;
  displayOrder: number;
  topics: CourseTopic[];
}

export interface CourseTopic {
  id: string;
  name: string;
  code: string;
  displayOrder: number;
  difficultyLevel: string;
  plannedHours: number;
  description: string;
  learningObjectives: string;
  itemCount?: number;
}

export type SelectionType = 'topic' | 'chapter' | 'topic-item' | null;

export interface BuilderSelection {
  type: SelectionType;
  id: string | null;
}

export interface CreateTopicItemPayload {
  topicId: string;
  type: TopicItemType;
  title: string;
  description?: string;
  content?: Record<string, unknown>;
  fileUrl?: string;
  externalUrl?: string;
  metadata?: Record<string, unknown>;
  durationMins?: number;
}

export interface UpdateTopicItemPayload {
  title?: string;
  description?: string;
  content?: Record<string, unknown>;
  fileUrl?: string;
  externalUrl?: string;
  metadata?: Record<string, unknown>;
  status?: TopicItemStatus;
  displayOrder?: number;
  durationMins?: number;
  completionRule?: CompletionRule;
  isActive?: boolean;
}

export interface ReorderPayload {
  items: { id: string; displayOrder: number }[];
}
