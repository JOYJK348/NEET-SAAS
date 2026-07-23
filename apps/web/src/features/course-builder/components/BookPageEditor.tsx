'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  GripVertical,
  MoreHorizontal,
  Edit3,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useTopicItems,
  useCreateTopicItem,
  useUpdateTopicItem,
  useDeleteTopicItem,
  useReorderTopicItems,
} from '../hooks/use-topic-items';
import { BlockRenderer } from './blocks/BlockRenderer';
import { AddBlockDropdown } from './blocks/AddBlockDropdown';
import type { TopicItem, BlockContent, BlockType, AddableBlockType } from '../types';
import { getInitialBlockContent, getBlockType, getMediaTypeLabel } from '../types';

interface BookPageEditorProps {
  topicId: string | null;
  topicData?: any;
}

// Helpers to generate title from block type
const blockTitleMap: Record<string, string> = {
  TEXT: 'Text',
  KEY_CONCEPT: 'Key Concept',
  IMPORTANT_NOTE: 'Important Note',
  FORMULA: 'Formula',
  WORKED_EXAMPLE: 'Worked Example',
  PRACTICE_QUESTION: 'Practice Question',
  IMAGE: 'Image',
  TABLE: 'Table',
  DIVIDER: 'Divider',
  PDF: 'Upload Document',
  LINK: 'External Link',
  VIDEO: 'Video',
};

function getBlockLabelFromType(bType: string): string {
  return blockTitleMap[bType] ?? 'Block';
}

function SortableBlock({
  item,
  isEditing,
  editingItemId,
  onStartEdit,
  onSaveEdit,
  onSaveMedia,
  onCancelEdit,
  onDelete,
  onDuplicate,
  isSaving,
}: {
  item: TopicItem;
  isEditing: boolean;
  editingItemId: string | null;
  onStartEdit: (item: TopicItem) => void;
  onSaveEdit: (item: TopicItem, content: BlockContent) => void;
  onSaveMedia: (item: TopicItem, payload: Record<string, unknown>) => void;
  onCancelEdit: () => void;
  onDelete: (item: TopicItem) => void;
  onDuplicate?: (item: TopicItem) => void;
  isSaving: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [menuOpen]);

  const blockType = getBlockType(item);
  const isTextItem = item.type === 'TEXT';
  const blockLabel = isTextItem
    ? getBlockLabelFromType(blockType ?? 'TEXT')
    : getBlockLabelFromType(item.type);
  const isDivider = blockType === 'DIVIDER';

  if (isDivider) {
    return (
      <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
        <BlockRenderer
          item={item}
          isEditing={false}
          onStartEdit={onStartEdit}
          onSave={onSaveEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onCancelEdit={onCancelEdit}
          isSaving={false}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('group relative', isDragging && 'opacity-50')}
    >
      <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex flex-col items-center gap-0.5">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-6 h-8 rounded-lg cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>
      <div className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-0.5">
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-0.5 z-50 w-36 bg-white rounded-xl shadow-xl border border-gray-200 py-1">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onStartEdit(item);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 text-left"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
              {onDuplicate && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate(item);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 text-left"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </button>
              )}
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(item);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="text-[9px] text-gray-300 font-semibold uppercase tracking-wider mb-1 pl-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {blockLabel}
      </div>
      <BlockRenderer
        item={item}
        isEditing={isEditing}
        onStartEdit={onStartEdit}
        onSave={onSaveEdit}
        onSaveMedia={onSaveMedia}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onCancelEdit={onCancelEdit}
        isSaving={isSaving}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 px-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-violet-100 flex items-center justify-center mb-4">
        <BookOpen className="h-8 w-8 text-violet-600" />
      </div>
      <p className="text-base font-bold text-gray-700 mb-1">Select a topic from the outline</p>
      <p className="text-xs text-gray-400 max-w-xs">
        Choose a topic on the left to view and manage its learning content
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-8 max-w-2xl mx-auto">
      <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-5 w-20 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 bg-gray-50 rounded-xl animate-pulse border border-gray-100" />
      ))}
    </div>
  );
}

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null;
  return (
    <div className="flex items-center gap-1.5">
      {status === 'saving' && (
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <Save className="h-3 w-3 animate-pulse" />
          Saving...
        </span>
      )}
      {status === 'saved' && (
        <span className="flex items-center gap-1 text-[10px] text-emerald-500">
          <CheckCircle2 className="h-3 w-3" />
          Saved
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1 text-[10px] text-red-500">
          <AlertCircle className="h-3 w-3" />
          Save failed
        </span>
      )}
    </div>
  );
}

export function BookPageEditor({ topicId, topicData }: BookPageEditorProps) {
  const { data: items, isLoading } = useTopicItems(topicId);
  const createMutation = useCreateTopicItem();
  const updateMutation = useUpdateTopicItem();
  const deleteMutation = useDeleteTopicItem();
  const reorderMutation = useReorderTopicItems();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const sortedItems = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [items]);

  const startEditing = useCallback((item: TopicItem) => {
    setEditingId(item.id);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleSaveEdit = useCallback(
    (item: TopicItem, content: BlockContent) => {
      setSaveStatus('saving');
      updateMutation.mutate(
        {
          id: item.id,
          payload: {
            content: content as unknown as Record<string, unknown>,
            title: getBlockLabelFromType(content.blockType),
          },
        },
        {
          onSuccess: () => {
            setSaveStatus('saved');
            setEditingId(null);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
          },
          onError: () => {
            setSaveStatus('error');
          },
        },
      );
    },
    [updateMutation],
  );

  const handleSaveMediaEdit = useCallback(
    (item: TopicItem, payload: Record<string, unknown>) => {
      setSaveStatus('saving');
      updateMutation.mutate(
        {
          id: item.id,
          payload: {
            ...payload,
            title: getBlockLabelFromType(item.type),
          },
        },
        {
          onSuccess: () => {
            setSaveStatus('saved');
            setEditingId(null);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
          },
          onError: () => {
            setSaveStatus('error');
          },
        },
      );
    },
    [updateMutation],
  );

  const handleAddBlock = useCallback(
    (blockType: AddableBlockType) => {
      if (!topicId) return;

      // Media types (PDF, LINK, VIDEO) use their own TopicItemType
      if (blockType === 'PDF' || blockType === 'LINK' || blockType === 'VIDEO') {
        createMutation.mutate(
          {
            topicId,
            type: blockType as 'PDF' | 'LINK' | 'VIDEO',
            title: getBlockLabelFromType(blockType),
          },
          {
            onSuccess: (newItem) => {
              toast.success(`${getBlockLabelFromType(blockType)} added`);
              setTimeout(() => {
                startEditing(newItem);
                const el = document.getElementById(`block-${newItem.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            },
            onError: () => {
              toast.error('Failed to add block');
            },
          },
        );
        return;
      }

      // Text-based block types use type: 'TEXT' with content.blockType
      const initialContent = getInitialBlockContent(blockType);
      createMutation.mutate(
        {
          topicId,
          type: 'TEXT' as const,
          title: getBlockLabelFromType(blockType),
          content: initialContent as unknown as Record<string, unknown>,
        },
        {
          onSuccess: (newItem) => {
            toast.success(`${getBlockLabelFromType(blockType)} block added`);
            setTimeout(() => {
              startEditing(newItem);
              const el = document.getElementById(`block-${newItem.id}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          },
          onError: () => {
            toast.error('Failed to add block');
          },
        },
      );
    },
    [topicId, createMutation, startEditing],
  );

  const getBlockDeleteLabel = useCallback((item: TopicItem) => {
    const bt = getBlockType(item);
    if (bt) return getBlockLabelFromType(bt);
    return getBlockLabelFromType(item.type);
  }, []);

  const handleDeleteItem = useCallback(
    (item: TopicItem) => {
      if (!window.confirm(`Delete this ${getBlockDeleteLabel(item)} block?`)) return;
      deleteMutation.mutate(item.id, {
        onSuccess: () => toast.success('Block deleted'),
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || 'Failed to delete block'),
      });
    },
    [deleteMutation, getBlockDeleteLabel],
  );

  const handleDuplicate = useCallback(
    (item: TopicItem) => {
      if (!topicId) return;
      createMutation.mutate(
        {
          topicId,
          type: item.type,
          title: `${item.title} (Copy)`,
          content: (item.content ?? undefined) as unknown as Record<string, unknown> | undefined,
          fileUrl: item.fileUrl ?? undefined,
          externalUrl: item.externalUrl ?? undefined,
          metadata: (item.metadata ?? undefined) as unknown as Record<string, unknown> | undefined,
        },
        {
          onSuccess: () => {
            toast.success('Block duplicated');
          },
          onError: () => {
            toast.error('Failed to duplicate block');
          },
        },
      );
    },
    [topicId, createMutation],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !topicId || !items) return;

      const sorted = [...items].sort((a, b) => a.displayOrder - b.displayOrder);
      const oldIdx = sorted.findIndex((i) => i.id === active.id);
      const newIdx = sorted.findIndex((i) => i.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = [...sorted];
      const [moved] = reordered.splice(oldIdx, 1);
      reordered.splice(newIdx, 0, moved);

      const payload = { items: reordered.map((i, idx) => ({ id: i.id, displayOrder: idx + 1 })) };
      reorderMutation.mutate({ topicId, payload });
    },
    [items, topicId, reorderMutation],
  );

  if (!topicId) return <EmptyState />;

  return (
    <div ref={containerRef} className="relative h-full flex flex-col">
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-20 md:pb-8 space-y-6">
            {/* Topic Header */}
            <div className="space-y-2">
              <h1 className="text-xl font-black text-gray-900">{topicData?.name ?? 'Topic'}</h1>
              <div className="flex items-center gap-2">
                {topicData?.difficultyLevel && (
                  <span
                    className={cn(
                      'text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider',
                      topicData.difficultyLevel === 'EASY'
                        ? 'bg-emerald-50 text-emerald-700'
                        : topicData.difficultyLevel === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700',
                    )}
                  >
                    {topicData.difficultyLevel}
                  </span>
                )}
                <SaveIndicator status={saveStatus} />
              </div>
              {topicData?.description && (
                <p className="text-sm text-gray-500 leading-relaxed">{topicData.description}</p>
              )}
            </div>

            {/* Content Blocks */}
            {sortedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                  <BookOpen className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-500 mb-1">This topic is empty</p>
                <p className="text-xs text-gray-400 mb-6 max-w-xs">
                  Start building your e-book chapter by adding content blocks
                </p>
                <div className="max-w-xs w-full">
                  <AddBlockDropdown onSelect={handleAddBlock} />
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedItems.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sortedItems.map((item, idx) => (
                      <div key={item.id} id={`block-${item.id}`}>
                        <SortableBlock
                          item={item}
                          isEditing={editingId === item.id}
                          editingItemId={editingId}
                          onStartEdit={startEditing}
                          onSaveEdit={handleSaveEdit}
                          onSaveMedia={handleSaveMediaEdit}
                          onCancelEdit={cancelEditing}
                          onDelete={handleDeleteItem}
                          onDuplicate={handleDuplicate}
                          isSaving={updateMutation.isPending}
                        />
                        {/* Insertion affordance between blocks */}
                        <div className="py-1">
                          <AddBlockDropdown onSelect={handleAddBlock} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
