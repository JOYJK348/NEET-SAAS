'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTopicItems } from '../hooks/use-topic-items';
import type { TopicItem } from '../types';

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

function TopicItemCard({ item }: { item: TopicItem }) {
  const config = typeConfig[item.type] ?? {
    icon: <FileText className="h-4 w-4 text-gray-400" />,
    label: item.type,
  };

  return (
    <div className="group flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-gray-300 hover:text-gray-500">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 shrink-0">
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 truncate">{item.title}</span>
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
              <span className="text-xs text-gray-400">{item.durationMins} min</span>
            </>
          )}
        </div>
      </div>
      <button className="flex items-center justify-center w-8 h-8 rounded-xl text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all">
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ContentWorkspace({ topicId, topicData }: ContentWorkspaceProps) {
  const { data: items, isLoading } = useTopicItems(topicId);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  if (!topicId) {
    return <EmptyState />;
  }

  return (
    <div className="relative h-full">
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="p-6 space-y-4">
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

          <div className="space-y-2">
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
              items.map((item) => <TopicItemCard key={item.id} item={item} />)
            )}
          </div>

          <button
            onClick={() => showToast('Coming in Phase 2')}
            className="flex items-center justify-center gap-1.5 w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-xs font-bold hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50/50 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Content
          </button>
        </div>
      )}

      {toast && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}
