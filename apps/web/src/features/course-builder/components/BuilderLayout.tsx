'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, ChevronDown, Eye, Send, PanelRight, PanelRightOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateCourse } from '@/features/master-data/hooks/use-courses';
import { courseKeys } from '@/features/master-data/hooks/use-courses';
import { PublishChecklist, type ChecklistItem } from './PublishChecklist';
import { StudentPreview } from './StudentPreview';

interface BuilderLayoutProps {
  courseId: string;
  course: any;
  subjects?: any[];
  selectedTopicId?: string | null;
  selectedTopicName?: string | null;
  selectedTopicDescription?: string | null;
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

const statusConfig: Record<string, { label: string; icon: string }> = {
  DRAFT: { label: 'Draft', icon: '🟡' },
  PUBLISHED: { label: 'Published', icon: '🟢' },
  ARCHIVED: { label: 'Archived', icon: '📁' },
};

export function BuilderLayout({
  courseId,
  course,
  subjects,
  selectedTopicId,
  selectedTopicName,
  selectedTopicDescription,
  leftPanel,
  centerPanel,
  rightPanel,
}: BuilderLayoutProps) {
  const queryClient = useQueryClient();
  const updateCourse = useUpdateCourse();

  const courseStatus = course?.isActive ? 'PUBLISHED' : 'DRAFT';
  const courseName = course?.name ?? 'Untitled Course';

  const [statusOpen, setStatusOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'left' | 'right' | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const status = useMemo(
    () => statusConfig[courseStatus] ?? { label: courseStatus, icon: '🟡' },
    [courseStatus],
  );

  const treeData = subjects ?? [];

  const checklistItems: ChecklistItem[] = useMemo(() => {
    let subjectCount = 0;
    let chapterCount = 0;
    let topicsWithNoContent = 0;
    let draftItems = 0;
    let chaptersWithNoTopics = 0;

    for (const s of treeData) {
      if (s.subject) subjectCount++;
      const chapters = s.chapters ?? [];
      for (const ch of chapters) {
        chapterCount++;
        const topics = ch.topics ?? [];
        if (topics.length === 0) chaptersWithNoTopics++;
        for (const t of topics) {
          const itemCount = t._count?.topicItems ?? 0;
          if (itemCount === 0) topicsWithNoContent++;
          if (t._count?.draftItems) draftItems += t._count.draftItems;
        }
      }
    }

    return [
      { label: 'Course exists', passed: !!course, blocking: true },
      { label: 'At least one subject mapped', passed: subjectCount > 0, blocking: true },
      { label: `Course has ${chapterCount} chapter(s)`, passed: chapterCount > 0, blocking: false },
      { label: `${subjectCount} subject(s) mapped`, passed: subjectCount > 0, blocking: false },
      {
        label:
          chaptersWithNoTopics > 0
            ? `${chaptersWithNoTopics} chapter(s) have no topics`
            : 'All chapters have topics',
        passed: chaptersWithNoTopics === 0,
        blocking: false,
      },
      {
        label:
          topicsWithNoContent > 0
            ? `${topicsWithNoContent} topic(s) have no learning content`
            : 'All topics have learning content',
        passed: topicsWithNoContent === 0,
        blocking: false,
      },
    ];
  }, [treeData, course]);

  const handlePublish = useCallback(async () => {
    try {
      await updateCourse.mutateAsync({
        id: courseId,
        input: { isActive: true } as any,
      });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
      toast.success('Course published successfully');
      setPublishOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to publish course');
    }
  }, [courseId, updateCourse, queryClient]);

  const handleStatusChange = useCallback(
    async (newStatus: string) => {
      setStatusOpen(false);
      try {
        if (newStatus === 'PUBLISHED') {
          setPublishOpen(true);
        } else if (newStatus === 'DRAFT') {
          await updateCourse.mutateAsync({
            id: courseId,
            input: { isActive: false } as any,
          });
          queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
          toast.success('Course set to Draft');
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Failed to update status');
      }
    },
    [courseId, updateCourse, queryClient],
  );

  const toggleMobilePanel = (panel: 'left' | 'right') => {
    setMobilePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="sticky top-0 z-50 h-[52px] shrink-0 bg-[#0f0a1e] flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/tenant-admin/courses/${courseId}`}
            className="flex items-center justify-center w-8 h-8 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-white font-bold text-sm truncate">{courseName}</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold transition-all border border-white/10"
            >
              <span className="text-xs leading-none">{status.icon}</span>
              <span>{status.label}</span>
              <ChevronDown className="h-3.5 w-3.5 text-white/40" />
            </button>
            {statusOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-36 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 overflow-hidden">
                  {Object.entries(statusConfig).map(([key, s]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-left transition-colors',
                        key === courseStatus
                          ? 'bg-violet-50 text-violet-700'
                          : 'text-gray-600 hover:bg-gray-50',
                      )}
                    >
                      <span className="text-xs leading-none">{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setPreviewOpen(!previewOpen)}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/20 text-xs font-semibold transition-all',
              previewOpen
                ? 'bg-violet-600 text-white border-violet-600'
                : 'text-white/60 hover:text-white hover:bg-white/10',
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{previewOpen ? 'Exit Preview' : 'Preview'}</span>
          </button>

          <button
            onClick={() => setPublishOpen(true)}
            className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Publish</span>
          </button>
        </div>
      </header>

      <div
        className={cn(
          'flex flex-1 overflow-hidden',
          previewOpen && 'opacity-50 pointer-events-none',
        )}
      >
        <aside
          className={cn(
            'w-[280px] border-r border-gray-200 bg-violet-50/30 shrink-0 overflow-y-auto',
            'hidden md:block',
            mobilePanel === 'left' && '!block fixed inset-0 z-30 pt-[52px] w-full',
          )}
        >
          {leftPanel}
        </aside>

        <main className="flex-1 overflow-y-auto min-w-0 bg-white">{centerPanel}</main>

        <aside
          className={cn(
            'w-[280px] border-l border-gray-200 bg-violet-50/30 shrink-0 overflow-y-auto',
            'hidden md:block',
            mobilePanel === 'right' && '!block fixed inset-0 z-30 pt-[52px] w-full',
          )}
        >
          {rightPanel}
        </aside>
      </div>

      {previewOpen && (
        <StudentPreview
          courseName={courseName}
          selectedTopicId={selectedTopicId ?? null}
          selectedTopicName={selectedTopicName ?? null}
          selectedTopicDescription={selectedTopicDescription ?? null}
          subjects={treeData}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#0f0a1e] rounded-2xl px-3 py-2 shadow-2xl border border-white/10">
        <button
          onClick={() => toggleMobilePanel('left')}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all',
            mobilePanel === 'left'
              ? 'bg-violet-600 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/10',
          )}
        >
          <PanelRightOpen className="h-3.5 w-3.5" />
          Outline
        </button>
        <button
          onClick={() => toggleMobilePanel('right')}
          className={cn(
            'flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all',
            mobilePanel === 'right'
              ? 'bg-violet-600 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/10',
          )}
        >
          <PanelRight className="h-3.5 w-3.5" />
          Properties
        </button>
      </div>

      {publishOpen && (
        <PublishChecklist
          courseName={courseName}
          items={checklistItems}
          onPublish={handlePublish}
          onCancel={() => setPublishOpen(false)}
          isPublishing={updateCourse.isPending}
        />
      )}
    </div>
  );
}
