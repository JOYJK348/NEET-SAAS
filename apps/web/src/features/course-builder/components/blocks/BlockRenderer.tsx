'use client';

import type { TopicItem, BlockContent, BlockType } from '../../types';
import { TextBlock } from './TextBlock';
import { KeyConceptBlock } from './KeyConceptBlock';
import { ImportantNoteBlock } from './ImportantNoteBlock';
import { FormulaBlock } from './FormulaBlock';
import { WorkedExampleBlock } from './WorkedExampleBlock';
import { PracticeQuestionBlock } from './PracticeQuestionBlock';
import { ImageBlock } from './ImageBlock';
import { TableBlock } from './TableBlock';
import { DividerBlock } from './DividerBlock';
import { UploadDocumentBlock } from './UploadDocumentBlock';
import { ExternalLinkBlock } from './ExternalLinkBlock';
import { VideoBlock } from './VideoBlock';

interface BlockRendererProps {
  item: TopicItem;
  isEditing: boolean;
  onStartEdit: (item: TopicItem) => void;
  onSave: (item: TopicItem, content: BlockContent) => void;
  onSaveMedia?: (item: TopicItem, payload: Record<string, unknown>) => void;
  onDelete: (item: TopicItem) => void;
  onDuplicate?: (item: TopicItem) => void;
  onCancelEdit: () => void;
  isSaving: boolean;
}

export function BlockRenderer({
  item,
  isEditing,
  onStartEdit,
  onSave,
  onSaveMedia,
  onDelete,
  onDuplicate,
  onCancelEdit,
  isSaving,
}: BlockRendererProps) {
  // Handle media blocks (PDF, LINK, VIDEO)
  if (item.type === 'PDF') {
    return (
      <UploadDocumentBlock
        item={item}
        isEditing={isEditing}
        onSave={onSaveMedia ?? ((i, p) => {})}
        onStartEdit={onStartEdit}
        onCancelEdit={onCancelEdit}
        isSaving={isSaving}
      />
    );
  }

  if (item.type === 'LINK') {
    return (
      <ExternalLinkBlock
        item={item}
        isEditing={isEditing}
        onSave={onSaveMedia ?? ((i, p) => {})}
        onStartEdit={onStartEdit}
        onCancelEdit={onCancelEdit}
        isSaving={isSaving}
      />
    );
  }

  if (item.type === 'VIDEO') {
    return (
      <VideoBlock
        item={item}
        isEditing={isEditing}
        onSave={onSaveMedia ?? ((i, p) => {})}
        onStartEdit={onStartEdit}
        onCancelEdit={onCancelEdit}
        isSaving={isSaving}
      />
    );
  }

  if (item.type === 'ASSESSMENT') {
    return (
      <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
            Assessment
          </span>
        </div>
        <p className="text-xs text-emerald-600">Assessment linking coming soon</p>
      </div>
    );
  }

  const content = item.content as BlockContent | null;
  if (!content) return null;

  switch (content.blockType) {
    case 'TEXT':
      return (
        <TextBlock
          item={item}
          content={content}
          isEditing={isEditing}
          onSave={onSave}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          isSaving={isSaving}
        />
      );
    case 'KEY_CONCEPT':
      return (
        <KeyConceptBlock
          item={item}
          content={content}
          isEditing={isEditing}
          onSave={onSave}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          isSaving={isSaving}
        />
      );
    case 'IMPORTANT_NOTE':
      return (
        <ImportantNoteBlock
          item={item}
          content={content}
          isEditing={isEditing}
          onSave={onSave}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          isSaving={isSaving}
        />
      );
    case 'FORMULA':
      return (
        <FormulaBlock
          item={item}
          content={content}
          isEditing={isEditing}
          onSave={onSave}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          isSaving={isSaving}
        />
      );
    case 'WORKED_EXAMPLE':
      return (
        <WorkedExampleBlock
          item={item}
          content={content}
          isEditing={isEditing}
          onSave={onSave}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          isSaving={isSaving}
        />
      );
    case 'PRACTICE_QUESTION':
      return (
        <PracticeQuestionBlock
          item={item}
          content={content}
          isEditing={isEditing}
          onSave={onSave}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          isSaving={isSaving}
        />
      );
    case 'IMAGE':
      return (
        <ImageBlock
          item={item}
          content={content}
          isEditing={isEditing}
          onSave={onSave}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          isSaving={isSaving}
        />
      );
    case 'TABLE':
      return (
        <TableBlock
          item={item}
          content={content}
          isEditing={isEditing}
          onSave={onSave}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          isSaving={isSaving}
        />
      );
    case 'DIVIDER':
      return <DividerBlock item={item} onDelete={onDelete} />;
    default:
      return null;
  }
}

export function getBlockLabel(blockType: BlockType): string {
  const labels: Record<BlockType, string> = {
    TEXT: 'Text',
    KEY_CONCEPT: 'Key Concept',
    IMPORTANT_NOTE: 'Important Note',
    FORMULA: 'Formula',
    WORKED_EXAMPLE: 'Worked Example',
    PRACTICE_QUESTION: 'Practice Question',
    IMAGE: 'Image',
    TABLE: 'Table',
    DIVIDER: 'Divider',
  };
  return labels[blockType] ?? 'Block';
}

export function getBlockIcon(blockType: BlockType): string {
  const icons: Record<BlockType, string> = {
    TEXT: '📝',
    KEY_CONCEPT: '💡',
    IMPORTANT_NOTE: '⭐',
    FORMULA: 'ƒ',
    WORKED_EXAMPLE: '📐',
    PRACTICE_QUESTION: '❓',
    IMAGE: '🖼️',
    TABLE: '📊',
    DIVIDER: '—',
  };
  return icons[blockType] ?? '📄';
}
