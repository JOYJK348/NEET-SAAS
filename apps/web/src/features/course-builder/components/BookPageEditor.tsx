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
  Plus,
  Sparkles,
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
  useDeleteAllTopicItems,
  useReorderTopicItems,
} from '../hooks/use-topic-items';
import { BlockRenderer } from './blocks/BlockRenderer';
import { AddBlockDropdown } from './blocks/AddBlockDropdown';
import type { TopicItem, BlockContent, BlockType, AddableBlockType } from '../types';
import { getInitialBlockContent, getBlockType, getMediaTypeLabel } from '../types';

interface BookPageEditorProps {
  topicId: string | null;
  topicData?: any;
  onOpenAddBlocksTab?: () => void;
  onAddBlock?: (blockType: any) => void;
  addBlockTrigger?: { type: string; timestamp: number } | null;
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

const QUICK_BLOCK_CHIPS = [
  { type: 'KEY_CONCEPT', label: 'Key Concept', icon: '💡', color: 'bg-amber-500/10 text-amber-800 border-amber-300/80 hover:bg-amber-500/20' },
  { type: 'FORMULA', label: 'Formula', icon: '📐', color: 'bg-cyan-500/10 text-cyan-800 border-cyan-300/80 hover:bg-cyan-500/20' },
  { type: 'WORKED_EXAMPLE', label: 'Worked Example', icon: '🎓', color: 'bg-indigo-500/10 text-indigo-800 border-indigo-300/80 hover:bg-indigo-500/20' },
  { type: 'PRACTICE_QUESTION', label: 'Question', icon: '❓', color: 'bg-emerald-500/10 text-emerald-800 border-emerald-300/80 hover:bg-emerald-500/20' },
  { type: 'TEXT', label: 'Text Note', icon: '📝', color: 'bg-violet-500/10 text-violet-800 border-violet-300/80 hover:bg-violet-500/20' },
  { type: 'VIDEO', label: 'Video', icon: '🎬', color: 'bg-rose-500/10 text-rose-800 border-rose-300/80 hover:bg-rose-500/20' },
  { type: 'PDF', label: 'PDF Doc', icon: '📄', color: 'bg-blue-500/10 text-blue-800 border-blue-300/80 hover:bg-blue-500/20' },
  { type: 'LINK', label: 'Link', icon: '🔗', color: 'bg-teal-500/10 text-teal-800 border-teal-300/80 hover:bg-teal-500/20' },
];

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
      className={cn(
        'group relative bg-white rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-md p-1.5 sm:p-2.5',
        isEditing ? 'border-[#7c3aed] ring-2 ring-violet-500/20' : 'border-slate-200/90 hover:border-violet-300',
        isDragging && 'opacity-50 shadow-xl'
      )}
    >
      {/* Block Header Toolbar */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 mb-2 border-b border-slate-100/90 bg-slate-50/70 rounded-xl">
        <div className="flex items-center gap-2 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center w-5 h-6 rounded cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 transition-colors"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 truncate">
            {blockLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => onStartEdit(item)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/60 transition-colors cursor-pointer"
            >
              <Edit3 className="h-3 w-3" />
              <span>Edit</span>
            </button>
          ) : (
            <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
              Editing...
            </span>
          )}

          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(item)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Duplicate block"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onDelete(item)}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete block"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div onClick={() => !isEditing && onStartEdit(item)} className={cn(!isEditing && 'cursor-pointer')}>
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

export function BookPageEditor({
  topicId,
  topicData,
  onOpenAddBlocksTab,
  onAddBlock,
  addBlockTrigger,
}: BookPageEditorProps) {
  const { data: items, isLoading } = useTopicItems(topicId);
  const createMutation = useCreateTopicItem();
  const updateMutation = useUpdateTopicItem();
  const deleteMutation = useDeleteTopicItem();
  const deleteAllMutation = useDeleteAllTopicItems();
  const reorderMutation = useReorderTopicItems();

  const handleClearAllBlocks = useCallback(() => {
    if (!topicId) return;
    if (window.confirm('Are you sure you want to delete all blocks for this topic?')) {
      deleteAllMutation.mutate(topicId, {
        onSuccess: () => toast.success('All blocks deleted successfully'),
        onError: () => toast.error('Failed to delete blocks'),
      });
    }
  }, [topicId, deleteAllMutation]);

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

  const lastProcessedTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (
      addBlockTrigger?.type &&
      addBlockTrigger.timestamp &&
      addBlockTrigger.timestamp !== lastProcessedTimestampRef.current
    ) {
      lastProcessedTimestampRef.current = addBlockTrigger.timestamp;
      handleAddBlock(addBlockTrigger.type as AddableBlockType);
    }
  }, [addBlockTrigger, handleAddBlock]);

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
          description: item.description ?? undefined,
          durationMins: item.durationMins ?? undefined,
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
    <div ref={containerRef} className="relative h-full flex flex-col overflow-hidden bg-slate-50/50">
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-24 space-y-6">
            {/* Topic Header Hero Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#7c3aed] via-[#6d28d9] to-[#5b21b6] text-white shadow-xl shadow-violet-900/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="relative z-10 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20 shadow-xs">
                    Topic Builder Workspace 📚
                  </span>
                  <div className="flex items-center gap-2">
                    {topicData?.difficultyLevel && (
                      <span
                        className={cn(
                          'text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-sm',
                          topicData.difficultyLevel === 'EASY'
                            ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                            : topicData.difficultyLevel === 'MEDIUM'
                              ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                              : 'bg-rose-500/20 text-rose-200 border border-rose-400/30',
                        )}
                      >
                        {topicData.difficultyLevel}
                      </span>
                    )}
                    <span className="text-[10px] font-extrabold text-white/90 bg-white/15 px-2.5 py-0.5 rounded-md border border-white/15">
                      {sortedItems.length} Content Blocks
                    </span>
                    {sortedItems.length > 0 && (
                      <button
                        type="button"
                        disabled={deleteAllMutation.isPending}
                        onClick={handleClearAllBlocks}
                        className="text-[10px] font-extrabold text-rose-200 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 px-2.5 py-0.5 rounded-md border border-rose-400/30 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Clear all blocks in this topic"
                      >
                        <Trash2 className="w-3 h-3" /> Clear All
                      </button>
                    )}
                    <SaveIndicator status={saveStatus} />
                  </div>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                  {topicData?.name ?? 'Topic Workspace'}
                </h1>
                {topicData?.description && (
                  <p className="text-xs text-white/80 leading-relaxed max-w-2xl pt-0.5 font-medium">
                    {topicData.description}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Add Content Block Toolbar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#7c3aed]" /> Quick Add Content Block ⚡
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Click any chip to add instantly</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {QUICK_BLOCK_CHIPS.map((chip) => (
                  <button
                    key={chip.type}
                    type="button"
                    disabled={createMutation.isPending}
                    onClick={() => handleAddBlock(chip.type as AddableBlockType)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 shadow-2xs hover:scale-[1.02] cursor-pointer',
                      chip.color
                    )}
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Blocks */}
            {sortedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-violet-200/80 rounded-3xl bg-white shadow-sm p-6">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3 border border-violet-100 shadow-inner">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 mb-1">This topic is empty</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Click any of the colorful chips above to add your first content block!
                </p>
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
