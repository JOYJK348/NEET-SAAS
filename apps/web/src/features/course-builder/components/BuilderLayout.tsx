'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, ChevronDown, Eye, Send, PanelRight, PanelRightOpen, X } from 'lucide-react';
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
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 h-[56px] shrink-0 bg-gradient-to-r from-[#7c3aed] via-[#6d28d9] to-[#5b21b6] flex items-center justify-between px-4 border-b border-white/10 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/tenant-admin/courses/${courseId}`}
            className="flex items-center justify-center w-8 h-8 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all shrink-0 border border-white/10"
            title="Back to Course Overview"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
                Course Builder
              </span>
              <h1 className="text-white font-bold text-sm truncate">{courseName}</h1>
            </div>
            {selectedTopicName && (
              <p className="text-[10px] text-white/80 truncate flex items-center gap-1">
                <span>Selected Topic:</span>
                <span className="font-semibold text-white">{selectedTopicName}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all border border-white/20 shadow-xs"
            >
              <span className="text-xs leading-none">{status.icon}</span>
              <span className="hidden sm:inline">{status.label}</span>
              <ChevronDown className="h-3.5 w-3.5 text-white/70" />
            </button>
            {statusOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-50 w-40 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {Object.entries(statusConfig).map(([key, s]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      className={cn(
                        'flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-semibold text-left transition-colors',
                        key === courseStatus
                          ? 'bg-violet-50 text-[#7c3aed] font-bold'
                          : 'text-slate-600 hover:bg-slate-50',
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
            disabled={!selectedTopicId}
            className={cn(
              'flex items-center gap-1.5 h-8 px-3.5 rounded-xl border text-xs font-bold transition-all',
              previewOpen
                ? 'bg-white text-[#7c3aed] border-white shadow-md'
                : selectedTopicId
                  ? 'bg-white/15 text-white hover:bg-white/25 border-white/25'
                  : 'text-white/40 border-white/10 cursor-not-allowed opacity-50',
            )}
            title={!selectedTopicId ? 'Select a topic to preview' : 'Preview current topic'}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {previewOpen ? 'Exit Preview' : selectedTopicId ? 'Preview Topic' : 'Preview'}
            </span>
          </button>

          <button
            onClick={() => setPublishOpen(true)}
            className="flex items-center gap-1.5 h-8 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-extrabold transition-all shadow-lg shadow-emerald-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Publish</span>
          </button>
        </div>
      </header>

      <div
        className={cn(
          'flex flex-1 h-[calc(100vh-56px)] overflow-hidden relative',
          previewOpen && 'opacity-50 pointer-events-none',
        )}
      >
        {/* Desktop left sidebar */}
        <aside
          className={cn(
            'w-[280px] border-r border-gray-200 bg-violet-50/30 shrink-0 overflow-y-auto',
            'hidden lg:block',
          )}
        >
          {leftPanel}
        </aside>

        {/* Tablet left sidebar — visible on md but not overlapping */}
        <aside
          className={cn(
            'hidden md:block lg:hidden w-[240px] border-r border-gray-200 bg-violet-50/30 shrink-0 overflow-y-auto',
          )}
        >
          {leftPanel}
        </aside>

        {/* Mobile left drawer */}
        {mobilePanel === 'left' && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobilePanel(null)}
            />
            <div className="fixed left-0 top-[52px] bottom-0 w-[85vw] max-w-[320px] bg-white border-r border-gray-200 shadow-2xl overflow-y-auto animate-slide-in-left">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Outline
                </span>
                <button
                  onClick={() => setMobilePanel(null)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {leftPanel}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto min-w-0 bg-white">{centerPanel}</main>

        {/* Desktop right sidebar */}
        <aside
          className={cn(
            'w-[280px] border-l border-gray-200 bg-violet-50/30 shrink-0 overflow-y-auto',
            'hidden lg:block',
          )}
        >
          {rightPanel}
        </aside>

        {/* Tablet right sidebar — hidden by default, toggleable */}
        <aside
          className={cn(
            'hidden md:block lg:hidden w-[240px] border-l border-gray-200 bg-violet-50/30 shrink-0 overflow-y-auto',
            mobilePanel === 'right' && '!block',
          )}
        >
          {rightPanel}
        </aside>

        {/* Mobile right drawer */}
        {mobilePanel === 'right' && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobilePanel(null)}
            />
            <div className="fixed right-0 top-[52px] bottom-0 w-[85vw] max-w-[320px] bg-white border-l border-gray-200 shadow-2xl overflow-y-auto animate-slide-in-right">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Properties
                </span>
                <button
                  onClick={() => setMobilePanel(null)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {rightPanel}
            </div>
          </div>
        )}
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

      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-violet-700 rounded-2xl px-3 py-2 shadow-2xl border border-white/10">
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
