'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
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
  ExternalLink,
  ChevronLeft,
  Loader2,
  LayoutList,
  Paperclip,
  MessageSquare,
  Atom,
  FlaskConical,
  Leaf,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTopicItems } from '@/features/course-builder/hooks/use-topic-items';
import type { TopicItem } from '@/features/course-builder/types';

// ─── Subject header icon themes ──────────────────────────────────────────
const SUBJECT_THEMES: Record<string, { bg: string; iconBg: string; text: string; icon: any; emoji: string }> = {
  physics: {
    bg: 'bg-indigo-50/70 border-indigo-100',
    iconBg: 'bg-indigo-600',
    text: 'text-indigo-950',
    icon: Atom,
    emoji: '⚛️',
  },
  chemistry: {
    bg: 'bg-emerald-50/70 border-emerald-100',
    iconBg: 'bg-emerald-600',
    text: 'text-emerald-950',
    icon: FlaskConical,
    emoji: '🧪',
  },
  biology: {
    bg: 'bg-rose-50/70 border-rose-100',
    iconBg: 'bg-rose-600',
    text: 'text-rose-950',
    icon: Leaf,
    emoji: '🌿',
  },
  botany: {
    bg: 'bg-green-50/70 border-green-100',
    iconBg: 'bg-green-600',
    text: 'text-green-950',
    icon: Leaf,
    emoji: '🌱',
  },
  zoology: {
    bg: 'bg-purple-50/70 border-purple-100',
    iconBg: 'bg-purple-600',
    text: 'text-purple-950',
    icon: Leaf,
    emoji: '🦋',
  },
  maths: {
    bg: 'bg-amber-50/70 border-amber-100',
    iconBg: 'bg-amber-600',
    text: 'text-amber-950',
    icon: Calculator,
    emoji: '📐',
  },
};

function getSubjectTheme(subjectName: string) {
  const lower = subjectName.toLowerCase();
  const match = Object.entries(SUBJECT_THEMES).find(([k]) => lower.includes(k));
  return (
    match?.[1] ?? {
      bg: 'bg-violet-50/70 border-violet-100',
      iconBg: 'bg-violet-600',
      text: 'text-violet-950',
      icon: BookOpen,
      emoji: '📚',
    }
  );
}

// ─── Block Renderers ──────────────────────────────────────────────────────────

function BlockPreviewRenderer({ item }: { item: TopicItem }) {
  const content = item.content as any;
  if (item.type !== 'TEXT' || !content?.blockType) return <TopicContentView item={item} />;

  switch (content.blockType) {
    case 'TEXT': {
      const html = content.html ?? '';
      return html ? (
        <div
          className="prose prose-sm max-w-none text-justify prose-p:text-justify prose-p:leading-relaxed prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-violet-600 prose-strong:text-slate-900"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null;
    }

    case 'KEY_CONCEPT': {
      const html = content.html ?? '';
      return (
        <div className="rounded-2xl border-l-4 border-sky-400 bg-sky-50/70 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-sky-600" />
            <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest">
              Key Concept
            </span>
          </div>
          {html ? (
            <div
              className="prose prose-sm max-w-none text-justify prose-p:text-justify prose-p:text-sky-900 prose-p:font-medium prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : null}
        </div>
      );
    }

    case 'IMPORTANT_NOTE': {
      const html = content.html ?? '';
      return (
        <div className="rounded-2xl border-l-4 border-amber-400 bg-amber-50/70 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-amber-600" />
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
              Important Note
            </span>
          </div>
          {html ? (
            <div
              className="prose prose-sm max-w-none text-justify prose-p:text-justify prose-p:text-amber-900 prose-p:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : null}
        </div>
      );
    }

    case 'FORMULA':
      return (
        <div className="rounded-2xl border-l-4 border-indigo-400 bg-indigo-50/70 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sigma className="h-4 w-4 text-indigo-600" />
            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
              Formula
            </span>
          </div>
          {content.formula && (
            <p className="text-xl font-mono font-black text-indigo-900 mb-1">{content.formula}</p>
          )}
          {content.description && <p className="text-sm text-indigo-600 text-justify leading-relaxed">{content.description}</p>}
        </div>
      );

    case 'WORKED_EXAMPLE':
      return (
        <div className="rounded-2xl border-l-4 border-emerald-400 bg-emerald-50/70 p-4">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
              Worked Example
            </span>
          </div>
          {content.question && (
            <div className="mb-3">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-1">
                Question
              </span>
              <p className="text-sm text-slate-800 font-medium text-justify leading-relaxed">{content.question}</p>
            </div>
          )}
          {content.solution && (
            <div className="mb-2">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-1">
                Solution
              </span>
              <p className="text-sm text-slate-700 whitespace-pre-wrap text-justify leading-relaxed">
                {content.solution}
              </p>
            </div>
          )}
          {content.answer && (
            <div className="mt-2 p-2 rounded-xl bg-emerald-100 border border-emerald-200">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-0.5">
                Answer
              </span>
              <p className="text-sm font-black text-emerald-900">{content.answer}</p>
            </div>
          )}
        </div>
      );

    case 'PRACTICE_QUESTION':
      return (
        <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="h-4 w-4 text-orange-600" />
            <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">
              Practice Question
            </span>
          </div>
          {content.question && (
            <p className="text-sm font-bold text-slate-800 mb-3 text-justify leading-relaxed">{content.question}</p>
          )}
          {content.options?.length > 0 && content.options.some((o: string) => o) && (
            <div className="space-y-2 mb-3">
              {content.options.map((opt: string, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-all',
                    content.correctAnswer === String.fromCharCode(65 + idx)
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-white border-orange-100 text-slate-700',
                  )}
                >
                  <span
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0',
                      content.correctAnswer === String.fromCharCode(65 + idx)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-orange-100 text-orange-700',
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 font-medium">{opt}</span>
                  {content.correctAnswer === String.fromCharCode(65 + idx) && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
          {content.explanation && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block mb-1">
                Explanation
              </span>
              <p className="text-sm text-emerald-800 text-justify leading-relaxed">{content.explanation}</p>
            </div>
          )}
        </div>
      );

    case 'DIVIDER':
      return (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          <div className="flex-1 h-px bg-slate-200" />
        </div>
      );

    case 'IMAGE':
      return content.url ? (
        <div className="space-y-2">
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <img
              src={content.url}
              alt={content.altText || ''}
              className="w-full object-contain max-h-80 bg-slate-50"
            />
          </div>
          {content.caption && (
            <p className="text-xs text-slate-500 text-center italic">{content.caption}</p>
          )}
        </div>
      ) : null;

    default:
      return null;
  }
}

function TopicContentView({ item }: { item: TopicItem }) {
  if (item.type === 'TEXT' && (item.content as any)?.blockType) {
    return <BlockPreviewRenderer item={item} />;
  }

  switch (item.type) {
    case 'TEXT': {
      const html = (item.content as any)?.html ?? '';
      return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-black text-slate-900 leading-tight">{item.title}</h4>
            {item.durationMins && (
              <span className="ml-2 shrink-0 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                {item.durationMins} min
              </span>
            )}
          </div>
          {html ? (
            <div
              className="prose prose-sm max-w-none text-justify prose-p:text-justify prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-a:text-violet-600"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-xs text-slate-400 italic">No text content yet.</p>
          )}
        </div>
      );
    }

    case 'PDF': {
      const meta = (item.metadata ?? {}) as any;
      return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
          <h4 className="text-sm font-black text-slate-900 mb-3">{item.title}</h4>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{meta.fileName ?? 'Document'}</p>
              <p className="text-[10px] text-slate-400">
                {meta.pageCount ? `${meta.pageCount} pages` : ''}
                {meta.pageCount && meta.fileSizeBytes ? ' · ' : ''}
                {meta.fileSizeBytes ? `${(meta.fileSizeBytes / 1024 / 1024).toFixed(1)} MB` : ''}
              </p>
            </div>
            {item.fileUrl && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    if (meta.fileUploadId) {
                      try {
                        const { api } = await import('@/lib/api');
                        const response: any = await api.get(`/storage/${meta.fileUploadId}/view`, { responseType: 'blob' });
                        const blob = new Blob([response as any], { type: meta.mimeType || 'application/pdf' });
                        window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
                        return;
                      } catch {}
                    }
                    window.open(item.fileUrl || '', '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-violet-50 border border-violet-200 text-xs font-bold text-violet-700 hover:bg-violet-100 transition-all cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    let blobUrl = item.fileUrl!;
                    let shouldRevoke = false;
                    if (meta.fileUploadId) {
                      try {
                        const { api } = await import('@/lib/api');
                        const response: any = await api.get(`/storage/${meta.fileUploadId}/view?download=true`, { responseType: 'blob' });
                        const blob = new Blob([response as any], { type: meta.mimeType || 'application/pdf' });
                        blobUrl = URL.createObjectURL(blob);
                        shouldRevoke = true;
                      } catch {}
                    }
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = meta.fileName ?? 'document.pdf';
                    a.target = '_blank';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    if (shouldRevoke) setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                  }}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'LINK': {
      const meta = (item.metadata ?? {}) as any;
      const domain = item.externalUrl
        ? (() => { try { return new URL(item.externalUrl).hostname.replace('www.', ''); } catch { return item.externalUrl; } })()
        : '';
      return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
          <h4 className="text-sm font-black text-slate-900 mb-3">{item.title}</h4>
          <a
            href={item.externalUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-xl bg-sky-50 border border-sky-100 hover:bg-sky-100 transition-all group"
          >
            {meta.thumbnailUrl && (
              <img src={meta.thumbnailUrl} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 group-hover:text-violet-700 transition-colors truncate">
                {item.description || item.title}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{domain}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-sky-400 group-hover:text-violet-500 shrink-0 mt-0.5" />
          </a>
        </div>
      );
    }

    case 'VIDEO': {
      const isYoutube = item.externalUrl?.includes('youtube.com') || item.externalUrl?.includes('youtu.be');
      const isVimeo = item.externalUrl?.includes('vimeo.com');
      const embedUrl = isYoutube
        ? item.externalUrl?.replace('watch?v=', 'embed/').split('&')[0]
        : isVimeo
          ? item.externalUrl?.replace('vimeo.com', 'player.vimeo.com/video')
          : null;
      return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h4 className="text-sm font-black text-slate-900">{item.title}</h4>
            {item.durationMins && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                {item.durationMins} min
              </span>
            )}
          </div>
          {embedUrl ? (
            <div className="aspect-video bg-black">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : item.fileUrl ? (
            <video controls className="w-full" src={item.fileUrl}>
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex items-center gap-3 p-5">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <Video className="h-5 w-5 text-violet-500" />
              </div>
              <p className="text-xs text-slate-400 font-medium">Video URL not configured</p>
            </div>
          )}
        </div>
      );
    }

    case 'ASSESSMENT':
      return (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-2xs p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{item.title}</p>
              <p className="text-[10px] text-amber-600 font-semibold">Assessment · Coming soon</p>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ─── Tab types ────────────────────────────────────────────────────────────────
type PreviewTab = 'summary' | 'materials' | 'discussion';

// ─── Main StudentPreview Component ───────────────────────────────────────────

interface StudentPreviewProps {
  courseName: string;
  selectedTopicId: string | null;
  selectedTopicName: string | null;
  selectedTopicDescription: string | null;
  subjects: any[];
  onClose: () => void;
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
  const [activeTab, setActiveTab] = useState<PreviewTab>('summary');

  // Lock body scroll when StudentPreview modal is open to avoid double scrollbars
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const activeItems = topicItems?.filter((item) => item.isActive) ?? [];

  // Detect subject theme
  const subjectKey =
    Object.keys(SUBJECT_THEMES).find((k) =>
      (selectedTopicName ?? courseName ?? '').toLowerCase().includes(k),
    ) ?? 'physics';
  const theme = getSubjectTheme(subjectKey);
  const ThemeIcon = theme.icon;

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F9FC] flex flex-col text-slate-900 h-screen w-screen overflow-hidden">
      {/* ── Sticky Header (Clean Light Design Matching Screenshot) ─────────── */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4.5 h-4.5 text-slate-700" />
          </button>

          {/* Course Badge Icon */}
          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Eye className="w-3.5 h-3.5" />
          </div>

          <span className="text-xs sm:text-sm font-black text-slate-900 truncate">{courseName}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-all shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit Preview</span>
        </button>
      </div>

      {/* ── Scrollable Body Area ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
          {/* Light Header Illustration Card (Matches Screenshot Hero Image) */}
          <div className={cn('rounded-3xl border p-6 flex flex-col items-center justify-center text-center space-y-3 shadow-2xs', theme.bg)}>
            <div className={cn('w-16 h-16 rounded-2xl text-white flex items-center justify-center shadow-md shadow-violet-500/20', theme.iconBg)}>
              <ThemeIcon className="w-8 h-8" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {theme.emoji} {subjectKey.charAt(0).toUpperCase() + subjectKey.slice(1)} LESSON VIEW
            </span>
          </div>

          {/* Topic Title & Lessons Count Badge */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-2 shadow-2xs">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {selectedTopicName ?? 'Topic Preview'}
            </h1>
            {selectedTopicDescription && (
              <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
                {selectedTopicDescription}
              </p>
            )}
            <div className="pt-1">
              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-black text-slate-700">
                {activeItems.length} {activeItems.length === 1 ? 'Lesson' : 'Lessons'}
              </span>
            </div>
          </div>

          {/* Content Start Marker */}
          <div id="preview-content-start" />

          {/* Content Items Area */}
          {!selectedTopicId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-6 space-y-2">
              <Eye className="h-8 w-8 text-slate-300" />
              <h3 className="text-sm font-black text-slate-800">Select a Topic to Preview</h3>
              <p className="text-xs text-slate-500">Choose a topic from the course outline to preview its content.</p>
            </div>
          ) : itemsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-6 space-y-2">
              <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading lesson content...</p>
            </div>
          ) : activeItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-6 space-y-2">
              <BookOpen className="h-8 w-8 text-slate-300" />
              <h3 className="text-sm font-black text-slate-800">No Content Yet</h3>
              <p className="text-xs text-slate-500">No published lessons, PDFs, or links added yet.</p>
            </div>
          ) : (
            <div className="space-y-4 pb-12">
              {activeItems
                .filter((item) => {
                  if (activeTab === 'materials') return item.type === 'PDF' || item.type === 'LINK' || item.type === 'VIDEO';
                  if (activeTab === 'discussion') return item.type === 'ASSESSMENT';
                  return true; // 'summary' shows everything
                })
                .map((item) => (
                  <TopicContentView key={item.id} item={item} />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Bottom Floating Bar (Matches Screenshot) ─────────────────── */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200/80 p-3 shadow-lg">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-around text-xs font-extrabold text-slate-500 w-full max-w-6xl mx-auto">
          {(
            [
              { key: 'summary', label: 'Summary' },
              { key: 'materials', label: 'Materials' },
              { key: 'discussion', label: 'Discussion' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                'px-4 py-1.5 rounded-xl transition-all cursor-pointer',
                activeTab === key
                  ? 'bg-violet-50 text-violet-700 font-black border border-violet-100'
                  : 'hover:text-slate-800',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
