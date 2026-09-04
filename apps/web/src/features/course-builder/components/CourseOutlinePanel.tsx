'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Search,
  MoreVertical,
  Plus,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Folder,
  FileText,
  GripVertical,
  Edit3,
  Trash2,
  BookMarked,
  List,
  Lightbulb,
  Star,
  Sigma,
  GraduationCap,
  HelpCircle,
  Minus,
  ExternalLink,
  Video as VideoIcon,
  Upload,
  ListPlus,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useCreateChapter, useDeleteChapter } from '@/features/master-data/hooks/use-chapters';
import { useCreateTopic, useDeleteTopic } from '@/features/master-data/hooks/use-topics';
import { useReorderChapters, useReorderTopics } from '../hooks/use-reorder';
import { useTopicItems } from '../hooks/use-topic-items';
import { getBlockType } from '../types';
import type { BlockType } from '../types';

interface SubjectNode {
  id: string;
  subject: { name: string; code: string };
  chapters: Array<{
    id: string;
    name: string;
    displayOrder: number;
    courseSubjectId?: string;
    topics: Array<{
      id: string;
      name: string;
      displayOrder: number;
      chapterId?: string;
      _count?: { topicItems?: number };
    }>;
  }>;
}

interface CourseOutlinePanelProps {
  courseId: string;
  subjects: SubjectNode[];
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

function ChapterSortable({
  chapter,
  isChapterOpen,
  onToggleChapter,
  onSelectTopic,
  selectedTopicId,
  onChapterEdit,
  onChapterDelete,
  onChapterAddTopic,
  topicToCOpen,
  onToggleToC,
  blockItemsMap,
}: {
  chapter: SubjectNode['chapters'][number];
  isChapterOpen: boolean;
  onToggleChapter: (id: string) => void;
  onSelectTopic: (topicId: string) => void;
  selectedTopicId: string | null;
  onChapterEdit: (ch: SubjectNode['chapters'][number]) => void;
  onChapterDelete: (ch: SubjectNode['chapters'][number]) => void;
  onChapterAddTopic: (chapterId: string) => void;
  topicToCOpen: Set<string>;
  onToggleToC: (id: string) => void;
  blockItemsMap: Record<
    string,
    Array<{ id: string; type: string; blockType: BlockType | null; title: string }>
  >;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
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

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-50')}
    >
      <div className="group flex items-center gap-1 w-full">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-4 h-6 shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-slate-500"
        >
          <GripVertical className="h-3 w-3" />
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onToggleChapter(chapter.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleChapter(chapter.id);
            }
          }}
          className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-xl text-left transition-all text-slate-700 hover:bg-blue-50/60 min-w-0 cursor-pointer"
        >
          <div className="flex items-center justify-center w-4 h-4 shrink-0">
            {isChapterOpen ? (
              <ChevronDown className="h-3 w-3 text-slate-400" />
            ) : (
              <ChevronRight className="h-3 w-3 text-slate-400" />
            )}
          </div>
          <Folder className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="text-[11px] font-bold truncate flex-1 text-[#0B2447]">
            {chapter.name}
          </span>
          <div className="relative shrink-0" ref={menuRef}>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-slate-200 cursor-pointer"
            >
              <MoreVertical className="h-3 w-3 text-slate-400" />
            </div>
            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-0.5 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onChapterEdit(chapter);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onChapterAddTopic(chapter.id);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-left"
                >
                  <BookMarked className="h-3.5 w-3.5" />
                  Add Topic
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onChapterDelete(chapter);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {isChapterOpen && (
        <div className="ml-7 space-y-0.5">
          {chapter.topics.length === 0 && (
            <p className="text-[10px] text-slate-400 italic py-1.5 pl-3">No topics</p>
          )}
          {chapter.topics.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              isSelected={selectedTopicId === topic.id}
              onSelect={onSelectTopic}
              isToCOpen={topicToCOpen.has(topic.id)}
              onToggleToC={onToggleToC}
              blockItems={blockItemsMap[topic.id]}
            />
          ))}
          <button
            onClick={() => onChapterAddTopic(chapter.id)}
            className="flex items-center gap-1 w-full px-3 py-1 text-[10px] font-extrabold text-[#0052CC] hover:bg-blue-50 rounded-xl transition-all opacity-0 hover:opacity-100"
          >
            <Plus className="h-3 w-3" />
            Add Topic
          </button>
        </div>
      )}
    </div>
  );
}

function TopicBlockItem({
  blockType,
  label,
  itemType,
}: {
  blockType: BlockType | null;
  label: string;
  itemType?: string;
}) {
  const getIcon = (bt: BlockType | null, type?: string) => {
    if (bt) {
      switch (bt) {
        case 'KEY_CONCEPT':
          return <Lightbulb className="h-2.5 w-2.5 text-sky-500" />;
        case 'IMPORTANT_NOTE':
          return <Star className="h-2.5 w-2.5 text-amber-500" />;
        case 'FORMULA':
          return <Sigma className="h-2.5 w-2.5 text-[#0052CC]" />;
        case 'WORKED_EXAMPLE':
          return <GraduationCap className="h-2.5 w-2.5 text-emerald-500" />;
        case 'PRACTICE_QUESTION':
          return <HelpCircle className="h-2.5 w-2.5 text-orange-500" />;
        case 'DIVIDER':
          return <Minus className="h-2.5 w-2.5 text-slate-300" />;
        default:
          return <List className="h-2.5 w-2.5 text-slate-400" />;
      }
    }
    // Media types
    switch (type) {
      case 'PDF':
        return <FileText className="h-2.5 w-2.5 text-rose-500" />;
      case 'LINK':
        return <ExternalLink className="h-2.5 w-2.5 text-blue-500" />;
      case 'VIDEO':
        return <VideoIcon className="h-2.5 w-2.5 text-[#0052CC]" />;
      default:
        return <List className="h-2.5 w-2.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 pl-8 group">
      <span className="shrink-0">{getIcon(blockType, itemType)}</span>
      <span className="text-[10px] text-slate-600 truncate font-medium">{label}</span>
    </div>
  );
}

function TopicRow({
  topic,
  isSelected,
  onSelect,
  isToCOpen,
  onToggleToC,
  blockItems,
}: {
  topic: SubjectNode['chapters'][number]['topics'][number];
  isSelected: boolean;
  onSelect: (id: string) => void;
  isToCOpen?: boolean;
  onToggleToC?: (id: string) => void;
  blockItems?: Array<{ id: string; type: string; blockType: BlockType | null; title: string }>;
}) {
  const itemCount = topic._count?.topicItems ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
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

  return (
    <div>
      <div className="group flex items-center gap-1 w-full">
        <button
          onClick={() => onSelect(topic.id)}
          className={cn(
            'flex items-center gap-1.5 flex-1 w-full px-3 py-1.5 rounded-xl text-left transition-all min-w-0',
            isSelected
              ? 'bg-[#0052CC] text-white font-extrabold rounded-r-xl shadow-2xs'
              : 'text-slate-700 hover:bg-blue-50 font-medium rounded-r-xl',
          )}
        >
          <FileText className="h-3 w-3 shrink-0" />
          <span
            className={cn(
              'text-[11px] truncate flex-1',
              isSelected ? 'font-extrabold' : 'font-medium',
            )}
          >
            {topic.name}
          </span>
          {itemCount > 0 && (
            <span
              className={cn(
                'text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded-md shrink-0',
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100',
              )}
            >
              {itemCount}
            </span>
          )}
        </button>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md',
              isSelected ? 'text-white/80 hover:bg-white/20' : 'hover:bg-slate-200',
            )}
          >
            <MoreVertical className="h-3 w-3" />
          </button>
          {menuOpen && topic.chapterId && (
            <TopicMenu topic={topic} onClose={() => setMenuOpen(false)} menuRef={menuRef} />
          )}
        </div>
        {isSelected && blockItems && blockItems.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleToC?.(topic.id);
            }}
            className={cn(
              'shrink-0 p-0.5 rounded-md transition-all',
              isSelected ? 'text-white/80 hover:bg-white/20' : 'text-slate-400 hover:bg-slate-200',
            )}
          >
            {isToCOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        )}
      </div>
      {/* Topic ToC - internal block outline */}
      {isSelected && isToCOpen && blockItems && blockItems.length > 0 && (
        <div className="ml-2 pl-2 border-l-2 border-blue-200 mt-0.5 space-y-0.5">
          {blockItems.map((block) => (
            <TopicBlockItem
              key={block.id}
              blockType={block.blockType}
              label={block.title}
              itemType={block.type}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TopicMenu({
  topic,
  onClose,
  menuRef: _menuRef,
}: {
  topic: SubjectNode['chapters'][number]['topics'][number];
  onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
}) {
  const deleteTopic = useDeleteTopic(topic.chapterId ?? '');

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete "${topic.name}"?\n\nThis topic and its learning content will be permanently removed.`,
      )
    ) {
      deleteTopic.mutate(topic.id, {
        onSuccess: () => {
          toast.success('Topic deleted');
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to delete topic');
        },
      });
    }
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-0.5 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1">
      <button
        onClick={handleDelete}
        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );
}

export function CourseOutlinePanel({
  courseId: _courseId,
  subjects,
  selectedTopicId,
  onSelectTopic,
  onRefresh: _onRefresh,
  loading,
}: CourseOutlinePanelProps) {
  const [search, setSearch] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(() => {
    return new Set(subjects.map((s) => s.id));
  });
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [topicToCOpen, setTopicToCOpen] = useState<Set<string>>(new Set());

  const [addChapterSubjectId, setAddChapterSubjectId] = useState<string | null>(null);
  const [addTopicChapterId, setAddTopicChapterId] = useState<string | null>(null);
  const [chapterFormOpen, setChapterFormOpen] = useState(false);
  const [topicFormOpen, setTopicFormOpen] = useState(false);
  const [chapterName, setChapterName] = useState('');
  const [topicName, setTopicName] = useState('');
  const [savingChapter, setSavingChapter] = useState(false);
  const [savingTopic, setSavingTopic] = useState(false);

  // Bulk Chapters Upload state
  const [bulkChaptersModalOpen, setBulkChaptersModalOpen] = useState(false);
  const [bulkChaptersSubjectId, setBulkChaptersSubjectId] = useState<string | null>(null);
  const [bulkChaptersText, setBulkChaptersText] = useState('');
  const [bulkDefaultHours, setBulkDefaultHours] = useState(10);
  const [bulkDefaultSessions, setBulkDefaultSessions] = useState(8);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const sampleTemplateText = `1. Physical World and Measurement\n2. Kinematics & Motion\n3. Laws of Motion\n4. Work, Energy and Power\n5. Rotational Motion\n6. Gravitation\n7. Thermodynamics`;

  const handleCopySampleTemplate = () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(sampleTemplateText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = sampleTemplateText;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedTemplate(true);
      toast.success('Sample template copied to clipboard!');
      setTimeout(() => setCopiedTemplate(false), 2000);
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = sampleTemplateText;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedTemplate(true);
        toast.success('Sample template copied to clipboard!');
        setTimeout(() => setCopiedTemplate(false), 2000);
      } catch {
        toast.error('Failed to copy sample template');
      }
    }
  };

  // Fetch topic items for the selected topic to show ToC
  const { data: selectedTopicItems } = useTopicItems(selectedTopicId);

  const blockItemsMap = useMemo(() => {
    if (!selectedTopicItems || !selectedTopicId) return {};
    const items = [...selectedTopicItems].sort((a, b) => a.displayOrder - b.displayOrder);
    const blocks = items.map((item) => ({
      id: item.id,
      type: item.type,
      blockType: getBlockType(item),
      title: item.title,
    }));
    return { [selectedTopicId]: blocks };
  }, [selectedTopicItems, selectedTopicId]);

  const createChapter = useCreateChapter(addChapterSubjectId ?? '');
  const createTopic = useCreateTopic(addTopicChapterId ?? '');
  const deleteChapterMutation = useDeleteChapter();
  const reorderChaptersMutation = useReorderChapters();
  const reorderTopicsMutation = useReorderTopics();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const toggleTopicToC = useCallback((topicId: string) => {
    setTopicToCOpen((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return subjects;
    const q = search.toLowerCase();
    return subjects
      .map((s) => {
        const matchSubject =
          s.subject.name.toLowerCase().includes(q) || s.subject.code.toLowerCase().includes(q);
        const chapters = s.chapters
          .map((ch) => {
            const matchChapter = ch.name.toLowerCase().includes(q);
            const topics = ch.topics.filter((t) => t.name.toLowerCase().includes(q));
            if (matchChapter) return ch;
            if (topics.length > 0) return { ...ch, topics };
            return null;
          })
          .filter(Boolean) as SubjectNode['chapters'];
        if (matchSubject) return s;
        if (chapters.length > 0) return { ...s, chapters };
        return null;
      })
      .filter(Boolean) as SubjectNode[];
  }, [subjects, search]);

  const toggleSubject = (id: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleChapter = useCallback((id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = active.id as string;

      const activeChapter = subjects.flatMap((s) => s.chapters).find((ch) => ch.id === activeId);
      const overChapter = subjects.flatMap((s) => s.chapters).find((ch) => ch.id === over.id);

      if (activeChapter && overChapter) {
        const parentSubject = subjects.find((s) => s.chapters.some((ch) => ch.id === activeId));
        if (!parentSubject) return;

        const overInSameSubject = parentSubject.chapters.some((ch) => ch.id === over.id);
        if (!overInSameSubject) return;

        const sorted = [...parentSubject.chapters].sort((a, b) => a.displayOrder - b.displayOrder);
        const oldIdx = sorted.findIndex((ch) => ch.id === activeId);
        const newIdx = sorted.findIndex((ch) => ch.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return;

        const reordered = [...sorted];
        const [moved] = reordered.splice(oldIdx, 1);
        reordered.splice(newIdx, 0, moved);

        const items = reordered.map((ch, i) => ({ id: ch.id, displayOrder: i + 1 }));
        reorderChaptersMutation.mutate({
          courseSubjectId: parentSubject.id,
          items,
        });
        return;
      }

      const activeTopic = subjects
        .flatMap((s) => s.chapters)
        .flatMap((ch) => ch.topics)
        .find((t) => t.id === activeId);
      const overTopic = subjects
        .flatMap((s) => s.chapters)
        .flatMap((ch) => ch.topics)
        .find((t) => t.id === over.id);

      if (activeTopic && overTopic) {
        const parentChapter = subjects
          .flatMap((s) => s.chapters)
          .find((ch) => ch.topics.some((t) => t.id === activeId));
        if (!parentChapter) return;

        const overInSameChapter = parentChapter.topics.some((t) => t.id === over.id);
        if (!overInSameChapter) return;

        const sorted = [...parentChapter.topics].sort((a, b) => a.displayOrder - b.displayOrder);
        const oldIdx = sorted.findIndex((t) => t.id === activeId);
        const newIdx = sorted.findIndex((t) => t.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return;

        const reordered = [...sorted];
        const [moved] = reordered.splice(oldIdx, 1);
        reordered.splice(newIdx, 0, moved);

        const items = reordered.map((t, i) => ({ id: t.id, displayOrder: i + 1 }));
        reorderTopicsMutation.mutate({
          chapterId: parentChapter.id,
          items,
        });
      }
    },
    [subjects, reorderChaptersMutation, reorderTopicsMutation],
  );

  const handleAddChapter = (subjectId: string) => {
    setAddChapterSubjectId(subjectId);
    setChapterName('');
    setChapterFormOpen(true);
  };

  const handleAddTopic = (chapterId: string) => {
    setAddTopicChapterId(chapterId);
    setTopicName('');
    setTopicFormOpen(true);
  };

  const submitChapter = async () => {
    const name = chapterName.trim();
    if (!name) return;
    if (!addChapterSubjectId) return;
    setSavingChapter(true);
    try {
      const chapters = subjects.find((s) => s.id === addChapterSubjectId)?.chapters ?? [];
      const nextOrder =
        chapters.length > 0 ? Math.max(...chapters.map((ch) => ch.displayOrder)) + 1 : 1;
      await createChapter.mutateAsync({
        courseSubjectId: addChapterSubjectId,
        name,
        code: name.toUpperCase().replace(/\s+/g, '_').slice(0, 10),
        displayOrder: nextOrder,
      });
      toast.success('Chapter created');
      setChapterFormOpen(false);
      setChapterName('');
      if (!expandedSubjects.has(addChapterSubjectId)) {
        setExpandedSubjects((prev) => new Set(prev).add(addChapterSubjectId!));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create chapter');
    } finally {
      setSavingChapter(false);
    }
  };

  const handleProcessBulkChapters = async () => {
    if (!bulkChaptersText.trim() || !bulkChaptersSubjectId) {
      toast.error('Please paste or enter chapter names');
      return;
    }

    const lines = bulkChaptersText
      .split('\n')
      .map((line) =>
        line
          .trim()
          .replace(/^[0-9]+\.\s*/, '')
          .replace(/^[-*]\s*/, ''),
      )
      .filter(Boolean);

    if (lines.length === 0) {
      toast.error('No valid chapter names found');
      return;
    }

    setIsBulkSubmitting(true);
    try {
      const subject = subjects.find((s) => s.id === bulkChaptersSubjectId);
      const existingChapters = subject?.chapters ?? [];
      let nextOrder =
        existingChapters.length > 0
          ? Math.max(...existingChapters.map((ch) => ch.displayOrder)) + 1
          : 1;

      for (const name of lines) {
        const cleanName = name.trim();
        const codePrefix =
          cleanName
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 4)
            .toUpperCase() || 'CH';
        await createChapter.mutateAsync({
          courseSubjectId: bulkChaptersSubjectId,
          name: cleanName,
          code: `CH-${codePrefix}-${nextOrder}`,
          plannedHours: bulkDefaultHours,
          estimatedSessions: bulkDefaultSessions,
          displayOrder: nextOrder++,
        });
      }

      toast.success(`Successfully uploaded ${lines.length} chapters!`);
      setBulkChaptersModalOpen(false);
      setBulkChaptersText('');
      if (_onRefresh) _onRefresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to bulk upload chapters');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const submitTopic = async () => {
    const name = topicName.trim();
    if (!name) return;
    if (!addTopicChapterId) return;
    setSavingTopic(true);
    try {
      const parentChapter = subjects
        .flatMap((s) => s.chapters)
        .find((ch) => ch.id === addTopicChapterId);
      const topics = parentChapter?.topics ?? [];
      const nextOrder = topics.length > 0 ? Math.max(...topics.map((t) => t.displayOrder)) + 1 : 1;
      const newTopic = await createTopic.mutateAsync({
        chapterId: addTopicChapterId,
        name,
        code: name.toUpperCase().replace(/\s+/g, '_').slice(0, 10),
        displayOrder: nextOrder,
      });
      toast.success('Topic created');
      setTopicFormOpen(false);
      setTopicName('');
      onSelectTopic(newTopic.id);
      if (!expandedChapters.has(addTopicChapterId)) {
        setExpandedChapters((prev) => new Set(prev).add(addTopicChapterId!));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create topic');
    } finally {
      setSavingTopic(false);
    }
  };

  const handleDeleteChapterAction = (chapter: SubjectNode['chapters'][number]) => {
    const hasTopics = chapter.topics.length > 0;
    const msg = hasTopics
      ? `Delete "${chapter.name}"?\n\nThis chapter contains ${chapter.topics.length} topic(s). They must be removed first.`
      : `Delete "${chapter.name}"?`;
    if (!window.confirm(msg)) return;

    const parentSubject = subjects.find((s) => s.chapters.some((ch) => ch.id === chapter.id));
    const csId = parentSubject?.id;
    if (!csId) return;

    deleteChapterMutation.mutate(chapter.id, {
      onSuccess: () => {
        toast.success('Chapter deleted');
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to delete chapter');
      },
    });
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
        <div className="h-8 w-full bg-slate-100 rounded-xl animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2 pl-3">
            <div className="h-5 w-3/4 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-slate-50 rounded ml-4 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-[#0F172A] font-sans bg-white">
      <div className="p-4 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-extrabold tracking-widest text-[#0052CC] uppercase">
            Course Outline
          </span>
          <span className="text-[10px] font-bold text-slate-400 tabular-nums">
            {subjects.length} subjects
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter outline..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:border-[#0052CC] focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center mb-3">
              <BookOpen className="h-5 w-5 text-[#0052CC]" />
            </div>
            <p className="text-xs font-bold text-slate-700 mb-1">
              {search ? 'No matches found' : 'No subjects mapped'}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">
              {search ? 'Try a different search term' : 'Map subjects to this course program'}
            </p>
          </div>
        ) : (
          filtered.map((subject) => {
            const isSubjectOpen = expandedSubjects.has(subject.id);
            const chapterIds = subject.chapters.map((ch) => ch.id);
            return (
              <div key={subject.id}>
                <button
                  onClick={() => toggleSubject(subject.id)}
                  className={cn(
                    'group flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left transition-all',
                    isSubjectOpen
                      ? 'bg-blue-50 text-[#0052CC] font-bold'
                      : 'text-slate-700 hover:bg-blue-50/60 font-medium',
                  )}
                >
                  <div className="flex items-center justify-center w-5 h-5 shrink-0">
                    {isSubjectOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-[#0052CC]" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </div>
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#0052CC]" />
                  <span className="text-xs font-extrabold truncate flex-1">
                    {subject.subject.name}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase shrink-0">
                    {subject.subject.code}
                  </span>
                </button>

                {isSubjectOpen && (
                  <div className="ml-2 pl-3 border-l-2 border-blue-100 space-y-0.5">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={chapterIds} strategy={verticalListSortingStrategy}>
                        {subject.chapters.length === 0 && (
                          <p className="text-[10px] text-slate-400 italic py-2 pl-3">No chapters</p>
                        )}
                        {subject.chapters.map((chapter) => (
                          <ChapterSortable
                            key={chapter.id}
                            chapter={chapter}
                            isChapterOpen={expandedChapters.has(chapter.id)}
                            onToggleChapter={toggleChapter}
                            onSelectTopic={onSelectTopic}
                            selectedTopicId={selectedTopicId}
                            onChapterEdit={(_ch) => {
                              handleAddChapter(subject.id);
                            }}
                            onChapterDelete={handleDeleteChapterAction}
                            onChapterAddTopic={handleAddTopic}
                            topicToCOpen={topicToCOpen}
                            onToggleToC={toggleTopicToC}
                            blockItemsMap={blockItemsMap}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* Bulk Upload Chapters Modal */}
      {bulkChaptersModalOpen && (
        <Dialog open={bulkChaptersModalOpen} onOpenChange={setBulkChaptersModalOpen}>
          <DialogContent className="max-w-xl rounded-2xl p-6 bg-white border border-slate-200 shadow-2xl">
            <DialogHeader className="pb-3 border-b border-slate-100">
              <DialogTitle className="text-base font-extrabold text-[#0B2447] flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#0052CC]" />
                Bulk Upload Chapters
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium">
                Paste chapter names line-by-line to add multiple chapters at once.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0052CC] flex items-center gap-1.5">
                    <ListPlus className="w-4 h-4 text-[#0052CC]" />
                    Example Template Format
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySampleTemplate}
                    className="text-[11px] font-bold text-[#0052CC] hover:text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs flex items-center gap-1 transition-all"
                  >
                    {copiedTemplate ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-[#0052CC]" />
                    )}
                    {copiedTemplate ? 'Copied!' : 'Copy Example'}
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-700 bg-white p-2.5 rounded-xl border border-blue-200/60 overflow-x-auto">
                  {sampleTemplateText}
                </pre>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Paste Chapter List (Line by Line):
                </label>
                <textarea
                  value={bulkChaptersText}
                  onChange={(e) => setBulkChaptersText(e.target.value)}
                  rows={6}
                  placeholder={`1. Physical World and Measurement\n2. Kinematics & Motion\n3. Laws of Motion\n4. Work, Energy and Power`}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Default Hours / Chapter:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={bulkDefaultHours}
                    onChange={(e) => setBulkDefaultHours(parseInt(e.target.value, 10) || 10)}
                    className="w-full h-8 px-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Default Sessions / Chapter:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={bulkDefaultSessions}
                    onChange={(e) => setBulkDefaultSessions(parseInt(e.target.value, 10) || 8)}
                    className="w-full h-8 px-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBulkChaptersModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkSubmitting}
                onClick={handleProcessBulkChapters}
                className="flex items-center gap-2 px-5 py-2 text-xs font-extrabold text-white bg-[#0052CC] hover:bg-blue-700 rounded-xl shadow-2xs transition-all disabled:opacity-50"
              >
                {isBulkSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload All Chapters
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={chapterFormOpen} onOpenChange={setChapterFormOpen}>
        <DialogContent className="bg-white rounded-2xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#0B2447]">
              Add Chapter
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Enter a name for the new chapter
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Chapter Name *
              </label>
              <input
                value={chapterName}
                onChange={(e) => setChapterName(e.target.value)}
                placeholder="e.g. Mechanics"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitChapter();
                  if (e.key === 'Escape') setChapterFormOpen(false);
                }}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white outline-none transition-all focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-medium"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setChapterFormOpen(false)}
                className="h-9 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitChapter}
                disabled={!chapterName.trim() || savingChapter}
                className="flex items-center gap-1 h-9 px-4 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-extrabold transition-all disabled:opacity-50 shadow-2xs"
              >
                {savingChapter ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={topicFormOpen} onOpenChange={setTopicFormOpen}>
        <DialogContent className="bg-white rounded-2xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#0B2447]">Add Topic</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 font-medium">
              Enter a name for the new topic
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Topic Name *
              </label>
              <input
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g. Kinematics"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitTopic();
                  if (e.key === 'Escape') setTopicFormOpen(false);
                }}
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-white outline-none transition-all focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 font-medium"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTopicFormOpen(false)}
                className="h-9 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitTopic}
                disabled={!topicName.trim() || savingTopic}
                className="flex items-center gap-1 h-9 px-4 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-extrabold transition-all disabled:opacity-50 shadow-2xs"
              >
                {savingTopic ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
