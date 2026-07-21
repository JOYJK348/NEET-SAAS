'use client';

import { useState, useCallback } from 'react';
import {
  FileText,
  File,
  Link,
  Video,
  ClipboardCheck,
  GripVertical,
  Plus,
  BookOpen,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTopicItems, useCreateTopicItem, useUpdateTopicItem } from '../hooks/use-topic-items';
import { TextLessonEditor } from './TextLessonEditor';
import { PdfDocumentForm } from './PdfDocumentForm';
import { ExternalLinkForm } from './ExternalLinkForm';
import { AddContentPickerModal } from './AddContentPickerModal';
import type { TopicItem, TopicItemType } from '../types';

interface ContentWorkspaceProps {
  topicId: string | null;
  topicData?: any;
}

const typeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  TEXT: { icon: <FileText className="h-4 w-4 text-sky-500" />, label: 'Text Lesson' },
  PDF: { icon: <File className="h-4 w-4 text-red-500" />, label: 'PDF' },
  LINK: { icon: <Link className="h-4 w-4 text-blue-500" />, label: 'Link' },
  VIDEO: { icon: <Video className="h-4 w-4 text-purple-500" />, label: 'Video' },
  ASSESSMENT: {
    icon: <ClipboardCheck className="h-4 w-4 text-emerald-500" />,
    label: 'Assessment',
  },
};

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-amber-50 text-amber-600 border border-amber-200/50',
  PUBLISHED: 'bg-emerald-50 text-emerald-600 border border-emerald-200/50',
  ARCHIVED: 'bg-gray-100 text-gray-500 border border-gray-200/50',
};

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
    <div className="space-y-3 p-6">
      <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-5 w-20 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />
      ))}
    </div>
  );
}

function EditorWrapper({
  children,
  onSave,
  onClose,
  isSaving,
}: {
  children: React.ReactNode;
  onSave: () => void;
  onClose: () => void;
  isSaving?: boolean;
}) {
  return (
    <div className="space-y-2">
      {children}
      <div className="flex items-center justify-end gap-2 px-1">
        <button
          onClick={onClose}
          className="flex items-center gap-1 h-8 px-3 rounded-xl text-[10px] font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1 h-8 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50"
        >
          <Check className="h-3 w-3" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export function ContentWorkspace({ topicId, topicData }: ContentWorkspaceProps) {
  const { data: items, isLoading } = useTopicItems(topicId);
  const createMutation = useCreateTopicItem();
  const updateMutation = useUpdateTopicItem();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [editContent, setEditContent] = useState<Record<string, unknown> | null>(null);
  const [editFileUrl, setEditFileUrl] = useState<string | undefined>(undefined);
  const [editExternalUrl, setEditExternalUrl] = useState<string | undefined>(undefined);
  const [editMetadata, setEditMetadata] = useState<Record<string, unknown> | undefined>(undefined);

  const resetEditState = useCallback(() => {
    setEditingId(null);
    setEditContent(null);
    setEditFileUrl(undefined);
    setEditExternalUrl(undefined);
    setEditMetadata(undefined);
  }, []);

  const startEditing = useCallback((item: TopicItem) => {
    setEditingId(item.id);
    setEditContent(item.content ?? null);
    setEditFileUrl(item.fileUrl ?? undefined);
    setEditExternalUrl(item.externalUrl ?? undefined);
    setEditMetadata(item.metadata ?? undefined);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingId) return;
    const payload: Record<string, unknown> = {};
    if (editContent !== null) payload.content = editContent;
    if (editFileUrl !== undefined) payload.fileUrl = editFileUrl || null;
    if (editExternalUrl !== undefined) payload.externalUrl = editExternalUrl || null;
    if (editMetadata !== undefined) payload.metadata = editMetadata;

    updateMutation.mutate({ id: editingId, payload }, { onSuccess: () => resetEditState() });
  }, [
    editingId,
    editContent,
    editFileUrl,
    editExternalUrl,
    editMetadata,
    updateMutation,
    resetEditState,
  ]);

  const handleAddContent = useCallback(
    (type: TopicItemType) => {
      if (!topicId) return;
      setPickerOpen(false);
      createMutation.mutate(
        {
          topicId,
          type,
          title: `New ${typeConfig[type]?.label ?? type}`,
        },
        {
          onSuccess: (newItem) => {
            startEditing(newItem);
          },
        },
      );
    },
    [topicId, createMutation, startEditing],
  );

  const renderEditor = useCallback(
    (item: TopicItem) => {
      switch (item.type) {
        case 'TEXT':
          return <TextLessonEditor content={editContent} onChange={(c) => setEditContent(c)} />;
        case 'PDF':
          return (
            <PdfDocumentForm
              fileUrl={editFileUrl ?? item.fileUrl}
              metadata={editMetadata ?? item.metadata}
              onChange={(d) => {
                if (d.fileUrl) setEditFileUrl(d.fileUrl);
                if (d.metadata) setEditMetadata(d.metadata);
              }}
            />
          );
        case 'LINK':
        case 'VIDEO':
          return (
            <ExternalLinkForm
              externalUrl={editExternalUrl ?? item.externalUrl}
              metadata={editMetadata ?? item.metadata}
              onChange={(d) => {
                setEditExternalUrl(d.externalUrl);
                if (d.metadata) setEditMetadata(d.metadata);
              }}
            />
          );
        case 'ASSESSMENT':
          return (
            <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              <ClipboardCheck className="h-8 w-8 mx-auto mb-2 text-emerald-300" />
              <p className="font-semibold text-gray-500">Assessment linking coming soon</p>
              <p className="text-[10px] mt-1">Select an exam to link from the assessment bank</p>
            </div>
          );
        default:
          return (
            <div className="p-6 text-center text-xs text-gray-400">
              Editor not available for {item.type}
            </div>
          );
      }
    },
    [editContent, editFileUrl, editExternalUrl, editMetadata],
  );

  const editingItem = editingId && items?.find((i) => i.id === editingId);

  if (!topicId) return <EmptyState />;

  return (
    <div className="relative h-full flex flex-col">
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <h2 className="text-lg font-black text-gray-900">{topicData?.name ?? 'Topic'}</h2>
            {topicData && (
              <div className="flex items-center gap-2 mt-1.5">
                {topicData.difficultyLevel && (
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
                {topicData.isActive !== undefined && (
                  <span
                    className={cn(
                      'text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider',
                      topicData.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-500',
                    )}
                  >
                    {topicData.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            )}
            {topicData?.description && (
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{topicData.description}</p>
            )}
          </div>

          <div className="space-y-3">
            {!items || items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                  <BookOpen className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-xs font-bold text-gray-500 mb-1">No content items yet</p>
                <p className="text-[10px] text-gray-400">
                  Add your first lesson, video, or assessment
                </p>
              </div>
            ) : (
              items.map((item) => {
                const isEditing = editingId === item.id;
                const config = typeConfig[item.type] ?? {
                  icon: <FileText className="h-4 w-4 text-gray-400" />,
                  label: item.type,
                };

                return (
                  <div key={item.id}>
                    {isEditing && editingItem ? (
                      <EditorWrapper
                        onSave={handleSaveEdit}
                        onClose={resetEditState}
                        isSaving={updateMutation.isPending}
                      >
                        {renderEditor(editingItem)}
                      </EditorWrapper>
                    ) : (
                      <button
                        onClick={() => startEditing(item)}
                        className="group flex items-center gap-3 w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200 text-left"
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-gray-300 hover:text-gray-500">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 shrink-0">
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 truncate">
                              {item.title}
                            </span>
                            <span
                              className={cn(
                                'text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0',
                                statusStyles[item.status] ?? statusStyles.DRAFT,
                              )}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{config.label}</span>
                            {item.durationMins != null && (
                              <>
                                <span className="text-gray-200">·</span>
                                <span className="text-xs text-gray-400">
                                  {item.durationMins} min
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all">
                          <MoreHorizontal className="h-4 w-4" />
                        </div>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center justify-center gap-1.5 w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-xs font-bold hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50/50 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Content
          </button>
        </div>
      )}

      <AddContentPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAddContent}
      />
    </div>
  );
}
