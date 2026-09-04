'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
  Eye,
  FileText,
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
  Atom,
  FlaskConical,
  Leaf,
  Calculator,
  Sparkles,
  PlayCircle,
  Share2,
  Check,
  Bookmark,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTopicItems } from '@/features/course-builder/hooks/use-topic-items';
import type { TopicItem } from '@/features/course-builder/types';
import { toast } from 'sonner';

// ─── Subject Header Icon Themes ──────────────────────────────────────────
const SUBJECT_THEMES: Record<
  string,
  { bg: string; iconBg: string; text: string; icon: any; emoji: string }
> = {
  physics: {
    bg: 'bg-gradient-to-r from-blue-50 via-indigo-50/70 to-sky-50 border-blue-200/90',
    iconBg: 'bg-[#0052CC] text-white shadow-2xs',
    text: 'text-[#0B2447]',
    icon: Atom,
    emoji: '⚛️',
  },
  chemistry: {
    bg: 'bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border-blue-200/90',
    iconBg: 'bg-[#0052CC] text-white shadow-2xs',
    text: 'text-[#0B2447]',
    icon: FlaskConical,
    emoji: '🧪',
  },
  biology: {
    bg: 'bg-gradient-to-r from-blue-50 via-emerald-50/50 to-sky-50 border-blue-200/90',
    iconBg: 'bg-[#0052CC] text-white shadow-2xs',
    text: 'text-[#0B2447]',
    icon: Leaf,
    emoji: '🌿',
  },
  botany: {
    bg: 'bg-gradient-to-r from-blue-50 via-teal-50/50 to-sky-50 border-blue-200/90',
    iconBg: 'bg-[#0052CC] text-white shadow-2xs',
    text: 'text-[#0B2447]',
    icon: Leaf,
    emoji: '🌱',
  },
  zoology: {
    bg: 'bg-gradient-to-r from-blue-50 via-indigo-50/70 to-sky-50 border-blue-200/90',
    iconBg: 'bg-[#0052CC] text-white shadow-2xs',
    text: 'text-[#0B2447]',
    icon: Leaf,
    emoji: '🦋',
  },
  maths: {
    bg: 'bg-gradient-to-r from-blue-50 via-amber-50/40 to-sky-50 border-blue-200/90',
    iconBg: 'bg-[#0052CC] text-white shadow-2xs',
    text: 'text-[#0B2447]',
    icon: Calculator,
    emoji: '📐',
  },
};

function getSubjectTheme(subjectName: string) {
  const lower = subjectName.toLowerCase();
  const match = Object.entries(SUBJECT_THEMES).find(([k]) => lower.includes(k));
  return (
    match?.[1] ?? {
      bg: 'bg-gradient-to-r from-blue-50 via-indigo-50/70 to-sky-50 border-blue-200/90',
      iconBg: 'bg-[#0052CC] text-white shadow-2xs',
      text: 'text-[#0B2447]',
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
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-2xs space-y-2">
          <div
            className="prose prose-sm max-w-none text-slate-700 leading-relaxed text-justify prose-p:text-justify prose-headings:text-[#0B2447] prose-headings:font-black prose-p:leading-relaxed prose-a:text-[#0052CC] prose-strong:text-[#0B2447]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      ) : null;
    }

    case 'KEY_CONCEPT': {
      const html = content.html ?? '';
      return (
        <div className="rounded-2xl sm:rounded-3xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-black text-[#0052CC] uppercase tracking-wider">
              Key Concept & Takeaway
            </span>
          </div>
          {html && (
            <div
              className="prose prose-sm max-w-none text-[#0B2447] font-medium leading-relaxed pt-1 text-justify prose-p:text-justify"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      );
    }

    case 'IMPORTANT_NOTE': {
      const html = content.html ?? '';
      return (
        <div className="rounded-2xl sm:rounded-3xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Star className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-black text-amber-800 uppercase tracking-wider">
              Important Exam Note
            </span>
          </div>
          {html && (
            <div
              className="prose prose-sm max-w-none text-amber-950 font-medium leading-relaxed pt-1 text-justify prose-p:text-justify"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      );
    }

    case 'FORMULA':
      return (
        <div className="rounded-2xl sm:rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sigma className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-black text-[#0052CC] uppercase tracking-wider">
                Formula Sheet
              </span>
            </div>
            <span className="text-[10px] font-extrabold text-[#0052CC] bg-white px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
              NEET Core
            </span>
          </div>

          {content.formula && (
            <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-2xs text-center font-mono font-black text-lg sm:text-xl text-[#0B2447] tracking-wider my-2">
              {content.formula}
            </div>
          )}
          {content.description && (
            <p className="text-xs text-slate-600 font-medium leading-relaxed text-justify">
              {content.description}
            </p>
          )}
        </div>
      );

    case 'WORKED_EXAMPLE':
      return (
        <div className="rounded-2xl sm:rounded-3xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
              Solved Worked Example
            </span>
          </div>

          {content.question && (
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                Question
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-[#0B2447] leading-relaxed text-justify">
                {content.question}
              </p>
            </div>
          )}

          {content.solution && (
            <div className="space-y-1">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                Step-by-Step Solution
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white/80 p-3 rounded-xl border border-emerald-100 whitespace-pre-wrap text-justify">
                {content.solution}
              </p>
            </div>
          )}

          {content.answer && (
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-2xs flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Final Answer:</span>
              <span className="text-sm font-black">{content.answer}</span>
            </div>
          )}
        </div>
      );

    case 'PRACTICE_QUESTION':
      return (
        <div className="rounded-2xl sm:rounded-3xl border border-orange-200 bg-orange-50/50 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <HelpCircle className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-black text-orange-800 uppercase tracking-wider">
                Practice Quiz Question
              </span>
            </div>
            <span className="text-[10px] font-black text-orange-700 bg-white px-2.5 py-0.5 rounded-full border border-orange-200">
              1 Mark
            </span>
          </div>

          {content.question && (
            <p className="text-xs sm:text-sm font-black text-[#0B2447] leading-relaxed bg-white p-3.5 rounded-xl border border-orange-100 shadow-2xs text-justify">
              {content.question}
            </p>
          )}

          {content.options?.length > 0 && content.options.some((o: string) => o) && (
            <div className="space-y-2">
              {content.options.map((opt: string, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm font-bold transition-all shadow-2xs text-justify',
                    content.correctAnswer === String.fromCharCode(65 + idx)
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-black'
                      : 'bg-white border-orange-100 text-slate-700',
                  )}
                >
                  <span
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs',
                      content.correctAnswer === String.fromCharCode(65 + idx)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-orange-100 text-orange-700',
                    )}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 truncate">{opt}</span>
                  {content.correctAnswer === String.fromCharCode(65 + idx) && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {content.explanation && (
            <div className="p-3 rounded-xl bg-white border border-orange-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-black text-orange-700 uppercase tracking-wider block">
                Explanation & Rationale
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed text-justify">
                {content.explanation}
              </p>
            </div>
          )}
        </div>
      );

    case 'IMAGE':
      return content.url ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-3 sm:p-4 shadow-2xs space-y-2">
          <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
            <img
              src={content.url}
              alt={content.altText || ''}
              className="w-full max-h-80 object-contain"
            />
          </div>
          {content.caption && (
            <p className="text-xs text-slate-500 text-center font-semibold italic">
              {content.caption}
            </p>
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
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs p-4 sm:p-6 space-y-3">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
            <h4 className="text-sm sm:text-base font-black text-[#0B2447] leading-tight">
              {item.title}
            </h4>
            {item.durationMins && (
              <span className="text-[10px] font-extrabold text-[#0052CC] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 shrink-0">
                ⏱️ {item.durationMins} min read
              </span>
            )}
          </div>
          {html ? (
            <div
              className="prose prose-sm max-w-none text-slate-700 font-medium leading-relaxed text-justify prose-p:text-justify prose-headings:text-[#0B2447] prose-a:text-[#0052CC]"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-xs text-slate-400 italic">No text content available.</p>
          )}
        </div>
      );
    }

    case 'PDF': {
      const meta = (item.metadata ?? {}) as any;
      return (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h4 className="text-xs sm:text-sm font-black text-[#0B2447] truncate">{item.title}</h4>
            <span className="text-[10px] font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              PDF Document
            </span>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/60 border border-blue-200/80">
            <div className="w-10 h-10 rounded-xl bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-[#0B2447] truncate">
                {meta.fileName ?? 'Study Material.pdf'}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {meta.pageCount ? `${meta.pageCount} pages` : 'Study Guide'}
                {meta.fileSizeBytes ? ` · ${(meta.fileSizeBytes / 1024 / 1024).toFixed(1)} MB` : ''}
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
                        const response: any = await api.get(`/storage/${meta.fileUploadId}/view`, {
                          responseType: 'blob',
                        });
                        const blob = new Blob([response as any], {
                          type: meta.mimeType || 'application/pdf',
                        });
                        window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
                        return;
                      } catch {}
                    }
                    window.open(item.fileUrl || '', '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs shadow-2xs transition cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    let blobUrl = item.fileUrl!;
                    let shouldRevoke = false;
                    if (meta.fileUploadId) {
                      try {
                        const { api } = await import('@/lib/api');
                        const response: any = await api.get(
                          `/storage/${meta.fileUploadId}/view?download=true`,
                          { responseType: 'blob' },
                        );
                        const blob = new Blob([response as any], {
                          type: meta.mimeType || 'application/pdf',
                        });
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
                  className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                  title="Download PDF"
                >
                  <Download className="h-4 w-4 text-[#0052CC]" />
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
        ? (() => {
            try {
              return new URL(item.externalUrl).hostname.replace('www.', '');
            } catch {
              return item.externalUrl;
            }
          })()
        : '';
      return (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
          <h4 className="text-xs sm:text-sm font-black text-[#0B2447]">{item.title}</h4>
          <a
            href={item.externalUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 hover:bg-blue-100/60 transition-all group"
          >
            {meta.thumbnailUrl && (
              <img
                src={meta.thumbnailUrl}
                alt=""
                className="w-14 h-12 rounded-xl object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-[#0B2447] group-hover:text-[#0052CC] transition-colors truncate">
                {item.description || item.title}
              </p>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">{domain}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-[#0052CC] shrink-0" />
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
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-100">
            <h4 className="text-xs sm:text-sm font-black text-[#0B2447]">{item.title}</h4>
            {item.durationMins && (
              <span className="text-[10px] font-extrabold text-[#0052CC] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                🎥 {item.durationMins} min
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
            <div className="flex items-center gap-3 p-5 bg-slate-50">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0">
                <Video className="h-5 w-5 text-[#0052CC]" />
              </div>
              <p className="text-xs text-slate-500 font-bold">Video stream ready</p>
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
type FilterTab = 'ALL' | 'NOTES' | 'VIDEOS' | 'PRACTICE';

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
  onClose,
}: StudentPreviewProps) {
  const { data: topicItems, isLoading: itemsLoading } = useTopicItems(selectedTopicId);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const activeItems = topicItems?.filter((item) => item.isActive) ?? [];

  const filteredItems = activeItems.filter((item) => {
    if (activeFilter === 'NOTES')
      return item.type === 'TEXT' || item.type === 'PDF' || item.type === 'LINK';
    if (activeFilter === 'VIDEOS') return item.type === 'VIDEO';
    if (activeFilter === 'PRACTICE')
      return item.type === 'ASSESSMENT' || (item.content as any)?.blockType === 'PRACTICE_QUESTION';
    return true;
  });

  const subjectKey =
    Object.keys(SUBJECT_THEMES).find((k) =>
      (selectedTopicName ?? courseName ?? '').toLowerCase().includes(k),
    ) ?? 'physics';
  const theme = getSubjectTheme(subjectKey);
  const ThemeIcon = theme.icon;

  const handleMarkCompleted = () => {
    setIsCompleted((prev) => !prev);
    if (!isCompleted) {
      toast.success('🎉 Lesson marked as completed!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6FB] flex flex-col text-[#0F172A] font-sans h-screen w-screen overflow-hidden">
      {/* ── Native Mobile App Glass Header ───────────────────────────────────── */}
      <div className="flex-shrink-0 bg-[#0B2447] text-white px-3.5 sm:px-5 py-3 flex items-center justify-between gap-3 shadow-md border-b border-blue-900">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/10"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="min-w-0">
            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest block truncate">
              {courseName}
            </span>
            <h3 className="text-xs sm:text-sm font-black text-white truncate leading-tight">
              {selectedTopicName || 'Lesson Preview'}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-extrabold text-white transition-all shrink-0 cursor-pointer border border-white/15"
        >
          <X className="w-4 h-4" />
          <span className="hidden xs:inline">Close</span>
        </button>
      </div>

      {/* ── Scrollable Lesson Body ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="w-full p-3.5 sm:p-5 lg:p-6 space-y-4">
          {/* Hero Banner Card */}
          <div
            className={cn(
              'rounded-2xl sm:rounded-3xl border p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs',
              theme.bg,
            )}
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0052CC] bg-white px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                  {theme.emoji} {subjectKey.toUpperCase()}
                </span>
                <span className="text-[10px] font-bold text-slate-500">NEET Syllabus</span>
              </div>
              <h1 className="text-base sm:text-xl font-black text-[#0B2447] tracking-tight leading-snug truncate">
                {selectedTopicName ?? 'Topic Preview'}
              </h1>
              {selectedTopicDescription && (
                <p className="text-xs font-semibold text-slate-600 line-clamp-2">
                  {selectedTopicDescription}
                </p>
              )}
            </div>

            <div
              className={cn(
                'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs',
                theme.iconBg,
              )}
            >
              <ThemeIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
          </div>

          {/* Segmented Filter Pills (Mobile App Style) */}
          <div className="flex items-center p-1 bg-white rounded-2xl border border-slate-200/90 shadow-2xs text-xs font-extrabold text-[#0B2447] overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={cn(
                'flex-1 min-w-[80px] py-2 rounded-xl transition cursor-pointer text-center truncate',
                activeFilter === 'ALL'
                  ? 'bg-[#0052CC] text-white shadow-2xs font-black'
                  : 'hover:text-[#0052CC] text-slate-600',
              )}
            >
              All ({activeItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('NOTES')}
              className={cn(
                'flex-1 min-w-[90px] py-2 rounded-xl transition cursor-pointer text-center truncate',
                activeFilter === 'NOTES'
                  ? 'bg-[#0052CC] text-white shadow-2xs font-black'
                  : 'hover:text-[#0052CC] text-slate-600',
              )}
            >
              Notes & PDF
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('VIDEOS')}
              className={cn(
                'flex-1 min-w-[80px] py-2 rounded-xl transition cursor-pointer text-center truncate',
                activeFilter === 'VIDEOS'
                  ? 'bg-[#0052CC] text-white shadow-2xs font-black'
                  : 'hover:text-[#0052CC] text-slate-600',
              )}
            >
              Videos
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('PRACTICE')}
              className={cn(
                'flex-1 min-w-[90px] py-2 rounded-xl transition cursor-pointer text-center truncate',
                activeFilter === 'PRACTICE'
                  ? 'bg-[#0052CC] text-white shadow-2xs font-black'
                  : 'hover:text-[#0052CC] text-slate-600',
              )}
            >
              Practice
            </button>
          </div>

          {/* Lesson Content List */}
          {itemsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs space-y-2">
              <Loader2 className="w-8 h-8 text-[#0052CC] animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading lesson content...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs space-y-2 text-center p-6">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-xs font-black text-[#0B2447]">No content items in this filter</h4>
              <p className="text-xs text-slate-400 font-semibold">
                Try selecting &apos;All&apos; to view all available study items.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <TopicContentView key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Native Mobile App Sticky Action Bar ────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 p-3 shadow-lg font-sans">
        <div className="w-full flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Courses</span>
          </button>

          <button
            type="button"
            onClick={handleMarkCompleted}
            className={cn(
              'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition shadow-2xs cursor-pointer',
              isCompleted
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-[#0052CC] text-white hover:bg-blue-700',
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Completed ✅' : 'Mark Completed'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
