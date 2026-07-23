'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Link,
  Video,
  X,
  Lightbulb,
  Star,
  Sigma,
  GraduationCap,
  HelpCircle,
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

function BlockPreviewRenderer({ item }: { item: TopicItem }) {
  const content = item.content as any;

  if (item.type !== 'TEXT' || !content?.blockType) {
    // For non-TEXT items, use existing rendering
    return <TopicContentView item={item} />;
  }

  switch (content.blockType) {
    case 'TEXT': {
      const html = content.html ?? '';
      return html ? (
        <div
          className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-violet-600 prose-strong:text-gray-900 prose-code:text-violet-700 prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null;
    }
    case 'KEY_CONCEPT': {
      const html = content.html ?? '';
      return (
        <div className="border border-sky-200 rounded-xl p-4 bg-sky-50/50">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-sky-600" />
            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">
              Key Concept
            </span>
          </div>
          {html ? (
            <div
              className="prose prose-sm max-w-none prose-p:text-sky-800"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : null}
        </div>
      );
    }
    case 'IMPORTANT_NOTE': {
      const html = content.html ?? '';
      return (
        <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/50">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-amber-600" />
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Important Note
            </span>
          </div>
          {html ? (
            <div
              className="prose prose-sm max-w-none prose-p:text-amber-800"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : null}
        </div>
      );
    }
    case 'FORMULA':
      return (
        <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/50">
          <div className="flex items-center gap-2 mb-2">
            <Sigma className="h-4 w-4 text-indigo-600" />
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
              Formula
            </span>
          </div>
          {content.formula && (
            <p className="text-lg font-mono font-bold text-indigo-900 mb-1">{content.formula}</p>
          )}
          {content.description && <p className="text-sm text-indigo-600">{content.description}</p>}
        </div>
      );
    case 'WORKED_EXAMPLE':
      return (
        <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Worked Example
            </span>
          </div>
          {content.question && (
            <div className="mb-3">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Question
              </span>
              <p className="text-sm text-gray-800">{content.question}</p>
            </div>
          )}
          {content.solution && (
            <div className="mb-2">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Solution
              </span>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{content.solution}</p>
            </div>
          )}
          {content.answer && (
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Answer
              </span>
              <p className="text-sm font-bold text-emerald-800">{content.answer}</p>
            </div>
          )}
        </div>
      );
    case 'PRACTICE_QUESTION':
      return (
        <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/50">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="h-4 w-4 text-orange-600" />
            <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">
              Practice Question
            </span>
          </div>
          {content.question && (
            <p className="text-sm font-semibold text-gray-800 mb-3">{content.question}</p>
          )}
          {content.options &&
            content.options.length > 0 &&
            content.options.some((o: string) => o) && (
              <div className="space-y-1 mb-3">
                {content.options.map((opt: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-orange-100"
                  >
                    <span className="text-xs font-bold text-orange-600 w-5">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span className="text-sm text-gray-700">{opt}</span>
                    {content.correctAnswer === String.fromCharCode(65 + idx) && (
                      <span className="ml-auto text-xs text-emerald-500 font-bold">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          {content.explanation && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Explanation
              </span>
              <p className="text-sm text-emerald-800">{content.explanation}</p>
            </div>
          )}
        </div>
      );
    case 'DIVIDER':
      return <hr className="border-gray-200" />;
    case 'IMAGE':
      return content.url ? (
        <div className="space-y-1">
          <div className="rounded-xl overflow-hidden border border-gray-200">
            <img
              src={content.url}
              alt={content.altText || ''}
              className="w-full object-contain max-h-96 bg-gray-50"
            />
          </div>
          {content.caption && (
            <p className="text-xs text-gray-500 text-center italic">{content.caption}</p>
          )}
        </div>
      ) : null;
    default:
      return null;
  }
}

function TopicContentView({ item }: { item: TopicItem }) {
  const cfg = typeConfig[item.type] ?? typeConfig.TEXT;
  const Icon = cfg.icon;

  // For TEXT items with blockType, use the new block preview
  if (item.type === 'TEXT' && (item.content as any)?.blockType) {
    return <BlockPreviewRenderer item={item} />;
  }

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

  const activeItems = topicItems?.filter((item) => item.isActive) ?? [];

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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Eye className="h-6 w-6 text-gray-300" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">Select a Topic to Preview</h3>
            <p className="text-xs text-gray-400 text-center max-w-sm">
              Choose a topic from the course outline in the builder, then click Preview Topic to see
              its student view.
            </p>
          </div>
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

            <div className="space-y-8">
              {activeItems.map((item, idx) => (
                <div key={item.id} className="bg-white">
                  <TopicContentView item={item} />
                  {idx < activeItems.length - 1 && (
                    <div className="mt-8 border-t border-gray-100" />
                  )}
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
