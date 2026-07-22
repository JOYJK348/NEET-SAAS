'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Link,
  Play,
  Video,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTopicItems } from '@/features/course-builder/hooks/use-topic-items';
import type { TopicItem } from '@/features/course-builder/types';

interface StudentPreviewProps {
  courseName: string;
  selectedTopicId: string | null;
  selectedTopicName: string | null;
  selectedTopicDescription: string | null;
  subjects: any[];
  onClose: () => void;
}

const typeConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  TEXT: { icon: FileText, label: 'Text Lesson', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  PDF: { icon: BookOpen, label: 'PDF Document', color: 'text-red-600', bg: 'bg-red-50' },
  LINK: { icon: Link, label: 'External Resource', color: 'text-sky-600', bg: 'bg-sky-50' },
  VIDEO: { icon: Video, label: 'Video Lesson', color: 'text-violet-600', bg: 'bg-violet-50' },
  ASSESSMENT: {
    icon: CheckCircle2,
    label: 'Assessment',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
};

function TopicContentView({ item }: { item: TopicItem }) {
  const cfg = typeConfig[item.type] ?? typeConfig.TEXT;
  const Icon = cfg.icon;

  switch (item.type) {
    case 'TEXT': {
      const html = (item.content as any)?.html ?? '';
      return (
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className={cn('flex items-center justify-center w-8 h-8 rounded-xl', cfg.bg)}>
              <Icon className={cn('h-4 w-4', cfg.color)} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
              <p className="text-[10px] text-gray-400">{cfg.label}</p>
            </div>
            {item.durationMins && (
              <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                {item.durationMins} min
              </span>
            )}
          </div>
          {html ? (
            <div
              className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-violet-600 prose-strong:text-gray-900 prose-code:text-violet-700 prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-xs text-gray-400 italic py-4">No content yet</p>
          )}
        </div>
      );
    }

    case 'PDF': {
      const meta = (item.metadata ?? {}) as any;
      return (
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className={cn('flex items-center justify-center w-8 h-8 rounded-xl', cfg.bg)}>
              <Icon className={cn('h-4 w-4', cfg.color)} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
              <p className="text-[10px] text-gray-400">{cfg.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 shrink-0">
              <FileText className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">
                {meta.fileName ?? 'Document'}
              </p>
              <p className="text-[10px] text-gray-400">
                {meta.pageCount ? `${meta.pageCount} pages` : ''}
                {meta.pageCount && meta.fileSizeBytes ? ' · ' : ''}
                {meta.fileSizeBytes ? `${(meta.fileSizeBytes / 1024 / 1024).toFixed(1)} MB` : ''}
              </p>
            </div>
            {item.fileUrl && (
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all shrink-0"
              >
                <Download className="h-3.5 w-3.5" />
                View
              </a>
            )}
          </div>
        </div>
      );
    }

    case 'LINK': {
      const meta = (item.metadata ?? {}) as any;
      const domain = item.externalUrl
        ? (() => {
            try {
              return new URL(item.externalUrl).hostname.replace('www.', '');
            } catch {
              return item.externalUrl;
            }
          })()
        : '';
      return (
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className={cn('flex items-center justify-center w-8 h-8 rounded-xl', cfg.bg)}>
              <Icon className={cn('h-4 w-4', cfg.color)} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
              <p className="text-[10px] text-gray-400">{cfg.label}</p>
            </div>
          </div>
          <a
            href={item.externalUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all group"
          >
            {meta.thumbnailUrl && (
              <img
                src={meta.thumbnailUrl}
                alt=""
                className="w-20 h-14 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-700 group-hover:text-violet-600 transition-colors truncate">
                {item.description || item.title}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{domain}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-violet-500 shrink-0 mt-0.5" />
          </a>
        </div>
      );
    }

    case 'VIDEO': {
      const isYoutube =
        item.externalUrl?.includes('youtube.com') || item.externalUrl?.includes('youtu.be');
      const isVimeo = item.externalUrl?.includes('vimeo.com');
      const embedUrl = isYoutube
        ? item.externalUrl?.replace('watch?v=', 'embed/').split('&')[0]
        : isVimeo
          ? item.externalUrl?.replace('vimeo.com', 'player.vimeo.com/video')
          : null;
      return (
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className={cn('flex items-center justify-center w-8 h-8 rounded-xl', cfg.bg)}>
              <Icon className={cn('h-4 w-4', cfg.color)} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
              <p className="text-[10px] text-gray-400">{cfg.label}</p>
            </div>
            {item.durationMins && (
              <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                {item.durationMins} min
              </span>
            )}
          </div>
          {embedUrl ? (
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : item.fileUrl ? (
            <video controls className="w-full rounded-xl" src={item.fileUrl}>
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-violet-100 shrink-0">
                <Video className="h-5 w-5 text-violet-500" />
              </div>
              <p className="text-xs text-gray-400">Video URL not configured</p>
            </div>
          )}
        </div>
      );
    }

    case 'ASSESSMENT':
      return (
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className={cn('flex items-center justify-center w-8 h-8 rounded-xl', cfg.bg)}>
              <Icon className={cn('h-4 w-4', cfg.color)} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
              <p className="text-[10px] text-gray-400">{cfg.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-700">Assessment</p>
              <p className="text-[10px] text-amber-500">Assessment feature coming soon</p>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

function CourseTreeOverview({ subjects }: { subjects: any[] }) {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(
    new Set(subjects?.map((s: any) => s.id) ?? []),
  );
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const toggleSubject = (id: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {!subjects || subjects.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-xs text-gray-400">No subjects available yet</p>
        </div>
      ) : (
        subjects.map((s: any) => (
          <div key={s.id} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => toggleSubject(s.id)}
              className="flex items-center gap-2 w-full px-4 py-3 bg-violet-50/50 hover:bg-violet-50 transition-colors text-left"
            >
              {expandedSubjects.has(s.id) ? (
                <ChevronDown className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-violet-400 shrink-0" />
              )}
              <span className="text-sm font-bold text-gray-900">
                {s.subject?.name ?? 'Subject'}
              </span>
              <span className="ml-auto text-[10px] font-semibold text-gray-400">
                {(s.chapters ?? []).length} chapters
              </span>
            </button>
            {expandedSubjects.has(s.id) && (
              <div className="divide-y divide-gray-50">
                {(s.chapters ?? []).length === 0 ? (
                  <div className="px-4 py-3 text-xs text-gray-400 italic">No chapters yet</div>
                ) : (
                  (s.chapters ?? []).map((ch: any) => (
                    <div key={ch.id}>
                      <button
                        onClick={() => toggleChapter(ch.id)}
                        className="flex items-center gap-2 w-full px-4 py-2.5 pl-8 hover:bg-gray-50 transition-colors text-left"
                      >
                        {expandedChapters.has(ch.id) ? (
                          <ChevronDown className="h-3 w-3 text-gray-300 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-gray-700">{ch.name}</span>
                        <span className="ml-auto text-[9px] text-gray-400">
                          {(ch.topics ?? []).length} topics
                        </span>
                      </button>
                      {expandedChapters.has(ch.id) && (
                        <div className="pb-2">
                          {(ch.topics ?? []).length === 0 ? (
                            <div className="px-4 py-1.5 pl-12 text-[10px] text-gray-400 italic">
                              No topics yet
                            </div>
                          ) : (
                            (ch.topics ?? []).map((t: any) => (
                              <div key={t.id} className="flex items-center gap-2 px-4 py-1.5 pl-12">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-300 shrink-0" />
                                <span className="text-[11px] font-medium text-gray-600">
                                  {t.name}
                                </span>
                                {(t._count?.topicItems ?? 0) > 0 && (
                                  <span className="text-[9px] text-gray-400">
                                    ({t._count.topicItems})
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export function StudentPreview({
  courseName,
  selectedTopicId,
  selectedTopicName,
  selectedTopicDescription,
  subjects,
  onClose,
}: StudentPreviewProps) {
  const { data: topicItems, isLoading: itemsLoading } = useTopicItems(selectedTopicId);
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeItems =
    topicItems?.filter((item) => item.isActive && item.status === 'PUBLISHED') ?? [];

  const prevItem = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const nextItem = () => setCurrentIndex((i) => Math.min(activeItems.length - 1, i + 1));

  return (
    <div className="fixed inset-0 z-40 pt-[52px] bg-white overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-100">
            <Eye className="h-4 w-4 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-gray-900">
              {selectedTopicId ? selectedTopicName : 'Course Overview'}
            </h2>
            <p className="text-[10px] text-gray-500 truncate">
              {selectedTopicId ? (
                <>
                  Viewing <span className="font-semibold">{courseName}</span> as a student
                </>
              ) : (
                <>{courseName} — Select a topic to preview its content</>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 transition-all shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            Exit Preview
          </button>
        </div>

        {!selectedTopicId ? (
          <CourseTreeOverview subjects={subjects} />
        ) : itemsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
              <p className="text-xs text-gray-400 font-semibold">Loading content...</p>
            </div>
          </div>
        ) : activeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 mb-4">
              <BookOpen className="h-6 w-6 text-gray-300" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">{selectedTopicName}</h3>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              No published content yet. Add lessons, PDFs, or links in the builder.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-black text-gray-900">{selectedTopicName}</h2>
              {selectedTopicDescription && (
                <p className="text-sm text-gray-500 mt-1">{selectedTopicDescription}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                  {activeItems.length} {activeItems.length === 1 ? 'lesson' : 'lessons'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {activeItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow bg-white"
                >
                  <TopicContentView item={item} />
                </div>
              ))}
            </div>

            {activeItems.length > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={prevItem}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Previous
                </button>
                <span className="text-[10px] font-semibold text-gray-400">
                  {currentIndex + 1} of {activeItems.length}
                </span>
                <button
                  onClick={nextItem}
                  disabled={currentIndex >= activeItems.length - 1}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
