export type TopicItemType = 'TEXT' | 'PDF' | 'LINK' | 'VIDEO' | 'ASSESSMENT';
export type TopicItemStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CompletionRule = 'NONE' | 'OPEN' | 'WATCH_80_PERCENT' | 'WATCHED_FULL';

// Block types for the book editor (stored in TopicItem.content.blockType)
export type BlockType =
  | 'TEXT'
  | 'KEY_CONCEPT'
  | 'IMPORTANT_NOTE'
  | 'FORMULA'
  | 'WORKED_EXAMPLE'
  | 'PRACTICE_QUESTION'
  | 'IMAGE'
  | 'TABLE'
  | 'DIVIDER';

// Block content interfaces stored in TopicItem.content
export interface TextBlockContent {
  blockType: 'TEXT';
  html: string;
  wordCount: number;
}

export interface KeyConceptBlockContent {
  blockType: 'KEY_CONCEPT';
  html: string;
  wordCount: number;
}

export interface ImportantNoteBlockContent {
  blockType: 'IMPORTANT_NOTE';
  html: string;
  wordCount: number;
}

export interface FormulaBlockContent {
  blockType: 'FORMULA';
  formula: string;
  description?: string;
}

export interface WorkedExampleBlockContent {
  blockType: 'WORKED_EXAMPLE';
  question: string;
  solution: string;
  answer?: string;
}

export interface PracticeQuestionBlockContent {
  blockType: 'PRACTICE_QUESTION';
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}

export interface ImageBlockContent {
  blockType: 'IMAGE';
  url: string;
  caption?: string;
  altText?: string;
}

export interface TableBlockContent {
  blockType: 'TABLE';
  html: string;
  caption?: string;
}

export interface DividerBlockContent {
  blockType: 'DIVIDER';
}

export type BlockContent =
  | TextBlockContent
  | KeyConceptBlockContent
  | ImportantNoteBlockContent
  | FormulaBlockContent
  | WorkedExampleBlockContent
  | PracticeQuestionBlockContent
  | ImageBlockContent
  | TableBlockContent
  | DividerBlockContent;

/** Media block types that use existing TopicItemType values (PDF, LINK, VIDEO) */
export type MediaBlockType = 'PDF' | 'LINK' | 'VIDEO';

/** All block types that can be added via the block picker */
export type AddableBlockType = BlockType | MediaBlockType;

// Block display config for the picker
export interface BlockTypeConfig {
  blockType: BlockType;
  label: string;
  icon: string;
  description: string;
  comingSoon?: boolean;
}

export const BLOCK_TYPE_CONFIGS: BlockTypeConfig[] = [
  { blockType: 'TEXT', label: 'Text', icon: '📝', description: 'Rich text content' },
  {
    blockType: 'KEY_CONCEPT',
    label: 'Key Concept',
    icon: '💡',
    description: 'Highlight a key concept',
  },
  {
    blockType: 'IMPORTANT_NOTE',
    label: 'Important Note',
    icon: '⭐',
    description: 'Important information',
  },
  { blockType: 'FORMULA', label: 'Formula', icon: 'ƒ', description: 'Mathematical equation' },
  {
    blockType: 'WORKED_EXAMPLE',
    label: 'Worked Example',
    icon: '📐',
    description: 'Example with solution',
  },
  {
    blockType: 'PRACTICE_QUESTION',
    label: 'Practice Question',
    icon: '❓',
    description: 'Question for practice',
  },
  { blockType: 'IMAGE', label: 'Image', icon: '🖼️', description: 'Visual content' },
  { blockType: 'TABLE', label: 'Table', icon: '📊', description: 'Tabular data' },
  { blockType: 'DIVIDER', label: 'Divider', icon: '—', description: 'Horizontal separator' },
];

// Media block display configs
export interface MediaBlockConfig {
  mediaType: MediaBlockType;
  label: string;
  icon: string;
  description: string;
}

export const MEDIA_BLOCK_CONFIGS: MediaBlockConfig[] = [
  {
    mediaType: 'PDF',
    label: 'Upload Document',
    icon: '📄',
    description: 'PDF, DOC, PPTX and more',
  },
  { mediaType: 'VIDEO', label: 'Video', icon: '🎬', description: 'Embed or upload video' },
  { mediaType: 'LINK', label: 'External Link', icon: '🔗', description: 'Link to any resource' },
];

export interface TopicItem {
  id: string;
  tenantId: string;
  topicId: string;
  type: TopicItemType;
  title: string;
  description: string | null;
  content: BlockContent | Record<string, unknown> | null;
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

export type RichTextContent = Pick<TextBlockContent, 'html' | 'wordCount'>;

/** Helper to check if a TopicItem is a TEXT-based block (with blockType in content) */
export function isTextBlock(item: TopicItem): boolean {
  return item.type === 'TEXT';
}

/** Helper to check if a TopicItem is a media block (PDF, LINK, VIDEO) */
export function isMediaBlock(item: TopicItem): boolean {
  return item.type === 'PDF' || item.type === 'LINK' || item.type === 'VIDEO';
}

/** Helper to get the block type from a TopicItem's content */
export function getBlockType(item: TopicItem): BlockType | null {
  if (item.type !== 'TEXT') return null;
  const content = item.content as BlockContent | null;
  return content?.blockType ?? 'TEXT';
}

/** Helper to get the media type label */
export function getMediaTypeLabel(type: TopicItemType): string {
  const labels: Record<string, string> = {
    PDF: 'Upload Document',
    LINK: 'External Link',
    VIDEO: 'Video',
    ASSESSMENT: 'Assessment',
    TEXT: 'Text',
  };
  return labels[type] ?? type;
}

/** Helper to get an initial content object for a block type */
export function getInitialBlockContent(blockType: BlockType): BlockContent {
  switch (blockType) {
    case 'TEXT':
      return { blockType: 'TEXT', html: '', wordCount: 0 };
    case 'KEY_CONCEPT':
      return { blockType: 'KEY_CONCEPT', html: '', wordCount: 0 };
    case 'IMPORTANT_NOTE':
      return { blockType: 'IMPORTANT_NOTE', html: '', wordCount: 0 };
    case 'FORMULA':
      return { blockType: 'FORMULA', formula: '', description: '' };
    case 'WORKED_EXAMPLE':
      return { blockType: 'WORKED_EXAMPLE', question: '', solution: '', answer: '' };
    case 'PRACTICE_QUESTION':
      return { blockType: 'PRACTICE_QUESTION', question: '' };
    case 'IMAGE':
      return { blockType: 'IMAGE', url: '', caption: '', altText: '' };
    case 'TABLE':
      return { blockType: 'TABLE', html: '', caption: '' };
    case 'DIVIDER':
      return { blockType: 'DIVIDER' };
  }
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
